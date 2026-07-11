import type { PersistedAppState } from './models';

export const defaultState: PersistedAppState = {
  version: 1,
  settings: {
    currentScore: 450,
    targetScore: 730,
    dailyGoal: 20,
    onboardingComplete: false,
    uiLanguage: 'ja',
    remindersEnabled: false,
    reminderHour: 20,
  },
  reviews: {},
  part5Attempts: {},
  stats: {
    totalAnswers: 0,
    correctAnswers: 0,
    completedSprints: 0,
    streak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    studiedToday: 0,
    studiedTodayDate: null,
    dailyActivity: {},
    lastStreakFreezeMonth: null,
  },
};
