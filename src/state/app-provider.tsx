import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { vocabulary } from '@/content/catalog';
import { defaultState } from '@/domain/defaults';
import type { PersistedAppState, SprintSession, UserSettings } from '@/domain/models';
import { scheduleReview, selectSprintWords } from '@/domain/scheduler';
import { answerSprint, createSprint, sprintResult } from '@/domain/sprint';
import { recordCompletedSprint } from '@/domain/stats';
import { localProgressStorage } from '@/services/progress-storage';

type SprintMode = 'daily' | 'review';

interface RuntimeState {
  data: PersistedAppState;
  session: SprintSession | null;
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; payload: PersistedAppState }
  | { type: 'COMPLETE_ONBOARDING'; payload: Pick<UserSettings, 'currentScore' | 'targetScore' | 'dailyGoal'> }
  | { type: 'SET_LANGUAGE'; payload: UserSettings['uiLanguage'] }
  | { type: 'START_SPRINT'; payload: SprintSession }
  | { type: 'ANSWER'; payload: { selectedMeaning: string; correct: boolean; now: Date } }
  | { type: 'CLEAR_SESSION' }
  | { type: 'RESET' };

function normalizeState(value: PersistedAppState | null): PersistedAppState {
  if (!value || value.version !== 1) return defaultState;
  return {
    ...defaultState,
    ...value,
    settings: { ...defaultState.settings, ...value.settings },
    stats: { ...defaultState.stats, ...value.stats },
    reviews: value.reviews ?? {},
  };
}

function reducer(state: RuntimeState, action: Action): RuntimeState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, data: normalizeState(action.payload), hydrated: true };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        data: {
          ...state.data,
          settings: { ...state.data.settings, ...action.payload, onboardingComplete: true },
        },
      };
    case 'SET_LANGUAGE':
      return { ...state, data: { ...state.data, settings: { ...state.data.settings, uiLanguage: action.payload } } };
    case 'START_SPRINT':
      return { ...state, session: action.payload };
    case 'ANSWER': {
      if (!state.session) return state;
      const wordId = state.session.queue[state.session.cursor];
      if (!wordId) return state;
      const nextSession = answerSprint(state.session, action.payload.selectedMeaning, action.payload.correct, action.payload.now);
      const reviews = {
        ...state.data.reviews,
        [wordId]: scheduleReview(state.data.reviews[wordId], wordId, action.payload.correct, action.payload.now),
      };
      const result = sprintResult(nextSession);
      const stats = nextSession.completed && !state.session.completed
        ? recordCompletedSprint(
            state.data.stats,
            result.uniqueWords,
            result.answers,
            nextSession.answers.filter((answer) => answer.correct).length,
            action.payload.now,
          )
        : state.data.stats;
      return { ...state, session: nextSession, data: { ...state.data, reviews, stats } };
    }
    case 'CLEAR_SESSION':
      return { ...state, session: null };
    case 'RESET':
      return { data: defaultState, session: null, hydrated: true };
    default:
      return state;
  }
}

interface AppContextValue extends RuntimeState {
  completeOnboarding: (settings: Pick<UserSettings, 'currentScore' | 'targetScore' | 'dailyGoal'>) => void;
  setLanguage: (language: UserSettings['uiLanguage']) => void;
  startSprint: (mode?: SprintMode) => SprintSession;
  submitAnswer: (selectedMeaning: string, correct: boolean) => void;
  clearSession: () => void;
  resetProgress: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, {
    data: defaultState,
    session: null,
    hydrated: false,
  });

  useEffect(() => {
    let active = true;
    localProgressStorage.load()
      .then((saved) => {
        if (active) dispatch({ type: 'HYDRATE', payload: normalizeState(saved) });
      })
      .catch(() => {
        if (active) dispatch({ type: 'HYDRATE', payload: defaultState });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (state.hydrated) void localProgressStorage.save(state.data).catch(() => undefined);
  }, [state.data, state.hydrated]);

  const completeOnboarding = useCallback((settings: Pick<UserSettings, 'currentScore' | 'targetScore' | 'dailyGoal'>) => {
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: settings });
  }, []);
  const setLanguage = useCallback((language: UserSettings['uiLanguage']) => dispatch({ type: 'SET_LANGUAGE', payload: language }), []);

  const startSprint = useCallback((mode: SprintMode = 'daily') => {
    const pool = mode === 'review'
      ? vocabulary.filter((word) => Boolean(state.data.reviews[word.id]))
      : vocabulary;
    const selected = selectSprintWords(pool, state.data.reviews, state.data.settings.dailyGoal);
    const session = createSprint(selected.map((word) => word.id));
    dispatch({ type: 'START_SPRINT', payload: session });
    return session;
  }, [state.data.reviews, state.data.settings.dailyGoal]);

  const submitAnswer = useCallback((selectedMeaning: string, correct: boolean) => {
    dispatch({ type: 'ANSWER', payload: { selectedMeaning, correct, now: new Date() } });
  }, []);

  const clearSession = useCallback(() => dispatch({ type: 'CLEAR_SESSION' }), []);
  const resetProgress = useCallback(async () => {
    await localProgressStorage.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    completeOnboarding,
    setLanguage,
    startSprint,
    submitAnswer,
    clearSession,
    resetProgress,
  }), [state, completeOnboarding, setLanguage, startSprint, submitAnswer, clearSession, resetProgress]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
