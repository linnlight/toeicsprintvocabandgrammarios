import { describe, expect, it } from 'vitest';

import { defaultState } from './defaults';
import { recordCompletedSprint } from './stats';

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
  });
});
