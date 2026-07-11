import { describe, expect, it } from 'vitest';

import { defaultState } from './defaults';
import { parsePersistedAppState } from './persistence';

describe('parsePersistedAppState', () => {
  it('accepts a valid state', () => {
    expect(parsePersistedAppState(defaultState)).toEqual(defaultState);
  });

  it('adds retention defaults when loading a save created before retention features', () => {
    const legacy = JSON.parse(JSON.stringify(defaultState));
    delete legacy.settings.remindersEnabled;
    delete legacy.settings.reminderHour;
    delete legacy.stats.dailyActivity;
    delete legacy.stats.lastStreakFreezeMonth;

    const parsed = parsePersistedAppState(legacy);
    expect(parsed?.settings.remindersEnabled).toBe(false);
    expect(parsed?.settings.reminderHour).toBe(20);
    expect(parsed?.stats.dailyActivity).toEqual({});
    expect(parsed?.stats.lastStreakFreezeMonth).toBeNull();
  });

  it('rejects unsafe settings that could break progress calculations', () => {
    expect(parsePersistedAppState({
      ...defaultState,
      settings: { ...defaultState.settings, dailyGoal: 0 },
    })).toBeNull();
  });

  it('rejects malformed review dates and mismatched record keys', () => {
    expect(parsePersistedAppState({
      ...defaultState,
      reviews: {
        agenda: {
          wordId: 'invoice',
          repetitions: 1,
          intervalDays: 1,
          easeFactor: 2.5,
          dueAt: 'not-a-date',
          lastReviewedAt: '2026-06-20T00:00:00.000Z',
          correctCount: 1,
          incorrectCount: 0,
        },
      },
    })).toBeNull();
  });
});
