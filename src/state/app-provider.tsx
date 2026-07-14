import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { vocabulary, vocabularyById } from '@/content/catalog';
import { part5TestById } from '@/content/part5-catalog';
import { sprintWordLimit } from '@/domain/access';
import { defaultState } from '@/domain/defaults';
import type { Part5Session, PersistedAppState, SprintSession, UserSettings } from '@/domain/models';
import { answerPart5Question, canAccessPart5Test, createPart5Session, recordPart5Attempt } from '@/domain/part5';
import { scheduleReview, selectSprintWords } from '@/domain/scheduler';
import { answerSprint, createSprint, sprintResult } from '@/domain/sprint';
import { currentDailyCount, recordCompletedSprint, rollingWeekSummary } from '@/domain/stats';
import { localProgressStorage } from '@/services/progress-storage';
import type { RetentionNotificationPlan } from '@/services/retention-notifications.types';
import { usePurchases } from '@/state/purchase-provider';

type SprintMode = 'daily' | 'review';

interface RuntimeState {
  data: PersistedAppState;
  session: SprintSession | null;
  part5Session: Part5Session | null;
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; payload: PersistedAppState }
  | { type: 'COMPLETE_ONBOARDING'; payload: Pick<UserSettings, 'currentScore' | 'targetScore' | 'dailyGoal'> }
  | { type: 'SET_LANGUAGE'; payload: UserSettings['uiLanguage'] }
  | { type: 'SET_RETENTION'; payload: Pick<UserSettings, 'remindersEnabled' | 'reminderHour'> }
  | { type: 'START_SPRINT'; payload: SprintSession }
  | { type: 'ANSWER'; payload: { selectedMeaning: string; correct: boolean; now: Date } }
  | { type: 'CLEAR_SESSION' }
  | { type: 'START_PART5_TEST'; payload: Part5Session }
  | { type: 'ANSWER_PART5'; payload: { selectedIndex: number; now: Date } }
  | { type: 'CLEAR_PART5_SESSION' }
  | { type: 'RESET' };

function reducer(state: RuntimeState, action: Action): RuntimeState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, data: action.payload, hydrated: true };
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
    case 'SET_RETENTION':
      return { ...state, data: { ...state.data, settings: { ...state.data.settings, ...action.payload } } };
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
    case 'START_PART5_TEST':
      return { ...state, part5Session: action.payload };
    case 'ANSWER_PART5': {
      if (!state.part5Session) return state;
      const test = part5TestById.get(state.part5Session.testId);
      if (!test) return state;
      const nextSession = answerPart5Question(state.part5Session, test, action.payload.selectedIndex);
      if (nextSession === state.part5Session) return state;
      const part5Attempts = nextSession.completed && !state.part5Session.completed
        ? {
            ...state.data.part5Attempts,
            [test.id]: recordPart5Attempt(
              state.data.part5Attempts[test.id],
              nextSession,
              action.payload.now,
            ),
          }
        : state.data.part5Attempts;
      return {
        ...state,
        part5Session: nextSession,
        data: { ...state.data, part5Attempts },
      };
    }
    case 'CLEAR_PART5_SESSION':
      return { ...state, part5Session: null };
    case 'RESET':
      return { data: defaultState, session: null, part5Session: null, hydrated: true };
    default:
      return state;
  }
}

interface AppContextValue extends RuntimeState {
  completeOnboarding: (settings: Pick<UserSettings, 'currentScore' | 'targetScore' | 'dailyGoal'>) => void;
  setLanguage: (language: UserSettings['uiLanguage']) => void;
  setRetentionSettings: (enabled: boolean, reminderHour: number) => Promise<boolean>;
  startSprint: (mode?: SprintMode) => SprintSession;
  submitAnswer: (selectedMeaning: string) => boolean | null;
  clearSession: () => void;
  startPart5Test: (testId: string) => Part5Session | null;
  submitPart5Answer: (selectedIndex: number) => void;
  clearPart5Session: () => void;
  resetProgress: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function requestAndScheduleRetentionNotifications(plan: RetentionNotificationPlan): Promise<boolean> {
  const service = await import('@/services/retention-notifications');
  return service.requestAndScheduleRetentionNotifications(plan);
}

async function syncRetentionNotifications(plan: RetentionNotificationPlan): Promise<void> {
  const service = await import('@/services/retention-notifications');
  await service.syncRetentionNotifications(plan);
}

export function AppProvider({ children }: PropsWithChildren) {
  const { isPro } = usePurchases();
  const [state, dispatch] = useReducer(reducer, {
    data: defaultState,
    session: null,
    part5Session: null,
    hydrated: false,
  });

  useEffect(() => {
    let active = true;
    localProgressStorage.load()
      .then((saved) => {
        if (active) dispatch({ type: 'HYDRATE', payload: saved ?? defaultState });
      })
      .catch(() => {
        if (active) dispatch({ type: 'HYDRATE', payload: defaultState });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (state.hydrated) void localProgressStorage.save(state.data).catch(() => undefined);
  }, [state.data, state.hydrated]);

  const weeklySummary = useMemo(() => rollingWeekSummary(state.data.stats), [state.data.stats]);
  const notificationPlan = useMemo<RetentionNotificationPlan>(() => ({
    enabled: state.data.settings.remindersEnabled,
    reminderHour: state.data.settings.reminderHour,
    language: state.data.settings.uiLanguage,
    weeklyWords: weeklySummary.words,
    weeklySprints: weeklySummary.sprints,
  }), [
    state.data.settings.remindersEnabled,
    state.data.settings.reminderHour,
    state.data.settings.uiLanguage,
    weeklySummary.sprints,
    weeklySummary.words,
  ]);

  useEffect(() => {
    if (state.hydrated && notificationPlan.enabled) {
      void syncRetentionNotifications(notificationPlan).catch(() => undefined);
    }
  }, [notificationPlan, state.hydrated]);

  const completeOnboarding = useCallback((settings: Pick<UserSettings, 'currentScore' | 'targetScore' | 'dailyGoal'>) => {
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: settings });
  }, []);
  const setLanguage = useCallback((language: UserSettings['uiLanguage']) => dispatch({ type: 'SET_LANGUAGE', payload: language }), []);
  const setRetentionSettings = useCallback(async (enabled: boolean, reminderHour: number) => {
    if (enabled) {
      try {
        const scheduled = await requestAndScheduleRetentionNotifications({
          ...notificationPlan,
          enabled: true,
          reminderHour,
        });
        if (!scheduled) return false;
      } catch {
        return false;
      }
    }
    dispatch({ type: 'SET_RETENTION', payload: { remindersEnabled: enabled, reminderHour } });
    return true;
  }, [notificationPlan]);

  const startSprint = useCallback((mode: SprintMode = 'daily') => {
    const pool = mode === 'review'
      ? vocabulary.filter((word) => Boolean(state.data.reviews[word.id]))
      : vocabulary;
    const limit = sprintWordLimit(
      state.data.settings.dailyGoal,
      isPro,
      currentDailyCount(state.data.stats),
      mode,
    );
    const selected = selectSprintWords(pool, state.data.reviews, limit);
    const session = createSprint(selected.map((word) => word.id));
    dispatch({ type: 'START_SPRINT', payload: session });
    return session;
  }, [isPro, state.data.reviews, state.data.settings.dailyGoal, state.data.stats]);

  const submitAnswer = useCallback((selectedMeaning: string) => {
    const wordId = state.session?.queue[state.session.cursor];
    const word = wordId ? vocabularyById.get(wordId) : undefined;
    if (!word || state.session?.completed) return null;
    const correct = selectedMeaning === word.meaningJa;
    dispatch({ type: 'ANSWER', payload: { selectedMeaning, correct, now: new Date() } });
    return correct;
  }, [state.session]);

  const clearSession = useCallback(() => dispatch({ type: 'CLEAR_SESSION' }), []);
  const startPart5Test = useCallback((testId: string) => {
    const test = part5TestById.get(testId);
    if (!test || !canAccessPart5Test(test.number, isPro)) return null;
    const session = createPart5Session(testId);
    dispatch({ type: 'START_PART5_TEST', payload: session });
    return session;
  }, [isPro]);
  const submitPart5Answer = useCallback((selectedIndex: number) => {
    dispatch({ type: 'ANSWER_PART5', payload: { selectedIndex, now: new Date() } });
  }, []);
  const clearPart5Session = useCallback(() => dispatch({ type: 'CLEAR_PART5_SESSION' }), []);
  const resetProgress = useCallback(async () => {
    await localProgressStorage.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    completeOnboarding,
    setLanguage,
    setRetentionSettings,
    startSprint,
    submitAnswer,
    clearSession,
    startPart5Test,
    submitPart5Answer,
    clearPart5Session,
    resetProgress,
  }), [state, completeOnboarding, setLanguage, setRetentionSettings, startSprint, submitAnswer, clearSession, startPart5Test, submitPart5Answer, clearPart5Session, resetProgress]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
