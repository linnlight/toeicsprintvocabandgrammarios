import { describe, expect, it } from 'vitest';

import {
  canAccessGrammarLesson,
  dailyGoalForAccess,
  FREE_DAILY_WORD_LIMIT,
  FREE_GRAMMAR_LESSON_COUNT,
  sprintWordLimit,
} from './access';

describe('purchase access limits', () => {
  it('limits a free daily goal to twenty words', () => {
    expect(dailyGoalForAccess(30, false)).toBe(FREE_DAILY_WORD_LIMIT);
    expect(sprintWordLimit(30, false, 3, 'daily')).toBe(17);
    expect(sprintWordLimit(30, false, 20, 'daily')).toBe(0);
  });

  it('uses the configured goal for Pro access', () => {
    expect(dailyGoalForAccess(30, true)).toBe(30);
    expect(sprintWordLimit(30, true, 20, 'daily')).toBe(30);
  });

  it('lets free users review up to twenty learned words per session', () => {
    expect(sprintWordLimit(30, false, 5, 'review')).toBe(20);
  });

  it('limits free grammar access while keeping every lesson available to Pro', () => {
    expect(canAccessGrammarLesson(FREE_GRAMMAR_LESSON_COUNT, false)).toBe(true);
    expect(canAccessGrammarLesson(FREE_GRAMMAR_LESSON_COUNT + 1, false)).toBe(false);
    expect(canAccessGrammarLesson(FREE_GRAMMAR_LESSON_COUNT + 1, true)).toBe(true);
    expect(canAccessGrammarLesson(0, true)).toBe(false);
  });
});
