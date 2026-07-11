import { describe, expect, it } from 'vitest';

import { defaultState } from './defaults';
import { isCurrentMonthFreezeAvailable, recordCompletedSprint, rollingWeekSummary } from './stats';

describe('recordCompletedSprint', () => {
  it('increments a streak on consecutive local calendar days', () => {
    const first = recordCompletedSprint(defaultState.stats, 10, 10, 8, new Date(2026, 5, 20, 9));
    const second = recordCompletedSprint(first, 5, 6, 5, new Date(2026, 5, 21, 9));
    expect(second.streak).toBe(2);
    expect(second.longestStreak).toBe(2);
    expect(second.studiedToday).toBe(5);
  });

  it('does not increment the streak twice on the same day', () => {
    const first = recordCompletedSprint(defaultState.stats, 5, 5, 5, new Date(2026, 5, 20, 9));
    const second = recordCompletedSprint(first, 5, 5, 4, new Date(2026, 5, 20, 20));
    expect(second.streak).toBe(1);
    expect(second.studiedToday).toBe(10);
    expect(second.dailyActivity['2026-06-20']).toEqual({ words: 10, sprints: 2, answers: 10, correctAnswers: 9 });
  });

  it('automatically uses one streak freeze for a single missed day each month', () => {
    const first = recordCompletedSprint(defaultState.stats, 5, 5, 4, new Date(2026, 5, 1, 9));
    const frozen = recordCompletedSprint(first, 5, 5, 4, new Date(2026, 5, 3, 9));
    const secondGap = recordCompletedSprint(frozen, 5, 5, 4, new Date(2026, 5, 5, 9));

    expect(frozen.streak).toBe(2);
    expect(frozen.lastStreakFreezeMonth).toBe('2026-06');
    expect(isCurrentMonthFreezeAvailable(frozen, new Date(2026, 5, 3))).toBe(false);
    expect(secondGap.streak).toBe(1);
  });

  it('summarizes only the rolling seven local calendar days', () => {
    const old = recordCompletedSprint(defaultState.stats, 10, 12, 9, new Date(2026, 5, 10, 9));
    const recent = recordCompletedSprint(old, 5, 6, 5, new Date(2026, 5, 18, 9));
    const today = recordCompletedSprint(recent, 8, 10, 8, new Date(2026, 5, 20, 9));

    expect(rollingWeekSummary(today, new Date(2026, 5, 20, 20))).toEqual({
      words: 13,
      sprints: 2,
      answers: 16,
      correctAnswers: 13,
      studiedDays: 2,
      accuracy: 81,
    });
  });
});
