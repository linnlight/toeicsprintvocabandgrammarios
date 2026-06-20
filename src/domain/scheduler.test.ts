import { describe, expect, it } from 'vitest';

import type { ReviewRecord, VocabularyEntry } from './models';
import { scheduleReview, selectSprintWords } from './scheduler';

const now = new Date('2026-06-20T00:00:00.000Z');

function word(id: string): VocabularyEntry {
  return {
    id,
    term: id,
    pronunciation: '/test/',
    partOfSpeech: '名詞',
    meaningJa: id,
    category: 'test',
    level: 1,
    example: 'Example.',
    exampleJa: '例。',
    explanationJa: '説明',
    distractors: ['a', 'b', 'c'],
    sourceId: 'source',
    sourceLocator: 'p.1',
    contentTypes: ['source_term'],
  };
}

describe('scheduleReview', () => {
  it('moves a correct new word to tomorrow', () => {
    const result = scheduleReview(undefined, 'agenda', true, now);
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.correctCount).toBe(1);
    expect(result.dueAt).toBe('2026-06-21T00:00:00.000Z');
  });

  it('resets repetitions and lowers ease after an incorrect answer', () => {
    const previous: ReviewRecord = {
      wordId: 'agenda', repetitions: 3, intervalDays: 8, easeFactor: 2.5,
      dueAt: now.toISOString(), lastReviewedAt: now.toISOString(), correctCount: 3, incorrectCount: 0,
    };
    const result = scheduleReview(previous, 'agenda', false, now);
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.3);
    expect(result.incorrectCount).toBe(1);
  });
});

describe('selectSprintWords', () => {
  it('prioritizes overdue words, then new words, then upcoming words', () => {
    const words = [word('new'), word('upcoming'), word('due')];
    const reviews: Record<string, ReviewRecord> = {
      due: { wordId: 'due', repetitions: 1, intervalDays: 1, easeFactor: 2.5, dueAt: '2026-06-19T00:00:00.000Z', lastReviewedAt: now.toISOString(), correctCount: 1, incorrectCount: 0 },
      upcoming: { wordId: 'upcoming', repetitions: 1, intervalDays: 1, easeFactor: 2.5, dueAt: '2026-06-22T00:00:00.000Z', lastReviewedAt: now.toISOString(), correctCount: 1, incorrectCount: 0 },
    };
    expect(selectSprintWords(words, reviews, 3, now).map((item) => item.id)).toEqual(['due', 'new', 'upcoming']);
  });
});
