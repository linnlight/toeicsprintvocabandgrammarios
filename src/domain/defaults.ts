import type { PersistedAppState } from './models';

export const defaultState: PersistedAppState = {
  version: 1,
  settings: {
    currentScore: 450,
    targetScore: 730,
    dailyGoal: 10,
    onboardingComplete: false,
    uiLanguage: 'ja',
  },
  reviews: {},
  stats: {
    totalAnswers: 0,
    correctAnswers: 0,
    completedSprints: 0,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    studiedToday: 0,
    studiedTodayDate: null,
  },
};
