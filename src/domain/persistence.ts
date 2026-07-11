import { z } from 'zod';

import type { PersistedAppState } from './models';

const dayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nonNegativeInteger = z.number().int().nonnegative();

const settingsSchema = z.object({
  currentScore: z.number().int().min(0).max(990),
  targetScore: z.number().int().min(0).max(990),
  dailyGoal: z.number().int().min(1).max(100),
  onboardingComplete: z.boolean(),
  uiLanguage: z.enum(['ja', 'en']),
  remindersEnabled: z.boolean().default(false),
  reminderHour: z.number().int().min(0).max(23).default(20),
});

const reviewRecordSchema = z.object({
  wordId: z.string().min(1),
  repetitions: nonNegativeInteger,
  intervalDays: nonNegativeInteger,
  easeFactor: z.number().finite().min(1.3).max(2.8),
  dueAt: z.iso.datetime(),
  lastReviewedAt: z.iso.datetime(),
  correctCount: nonNegativeInteger,
  incorrectCount: nonNegativeInteger,
});

const reviewsSchema = z.record(z.string(), reviewRecordSchema).superRefine((reviews, context) => {
  for (const [key, review] of Object.entries(reviews)) {
    if (key !== review.wordId) {
      context.addIssue({
        code: 'custom',
        message: `Review key "${key}" does not match wordId "${review.wordId}"`,
        path: [key, 'wordId'],
      });
    }
  }
});

const dailyActivitySchema = z.object({
  words: nonNegativeInteger,
  sprints: nonNegativeInteger,
  answers: nonNegativeInteger,
  correctAnswers: nonNegativeInteger,
}).refine((activity) => activity.correctAnswers <= activity.answers, {
  message: 'Correct answers cannot exceed answers',
  path: ['correctAnswers'],
});

const statsSchema = z.object({
  totalAnswers: nonNegativeInteger,
  correctAnswers: nonNegativeInteger,
  completedSprints: nonNegativeInteger,
  streak: nonNegativeInteger,
  longestStreak: nonNegativeInteger,
  lastStudyDate: dayKeySchema.nullable(),
  studiedToday: nonNegativeInteger,
  studiedTodayDate: dayKeySchema.nullable(),
  dailyActivity: z.record(dayKeySchema, dailyActivitySchema).default({}),
  lastStreakFreezeMonth: z.string().regex(/^\d{4}-\d{2}$/).nullable().default(null),
}).refine((stats) => stats.correctAnswers <= stats.totalAnswers, {
  message: 'Correct answers cannot exceed total answers',
  path: ['correctAnswers'],
});

const part5AttemptSchema = z.object({
  testId: z.string().min(1),
  attempts: nonNegativeInteger,
  bestScore: nonNegativeInteger.max(40),
  latestScore: nonNegativeInteger.max(40),
  lastCompletedAt: z.iso.datetime(),
});

const part5AttemptsSchema = z.record(z.string(), part5AttemptSchema)
  .default({})
  .superRefine((attempts, context) => {
    for (const [key, attempt] of Object.entries(attempts)) {
      if (key !== attempt.testId) {
        context.addIssue({
          code: 'custom',
          message: `Part 5 attempt key "${key}" does not match testId "${attempt.testId}"`,
          path: [key, 'testId'],
        });
      }
    }
  });

const persistedAppStateSchema = z.object({
  version: z.literal(1),
  settings: settingsSchema,
  reviews: reviewsSchema,
  stats: statsSchema,
  part5Attempts: part5AttemptsSchema,
});

export function parsePersistedAppState(value: unknown): PersistedAppState | null {
  const result = persistedAppStateSchema.safeParse(value);
  return result.success ? result.data : null;
}
