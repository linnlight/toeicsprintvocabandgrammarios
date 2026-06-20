import type { ReviewRecord, VocabularyEntry } from './models';

const DAY_MS = 86_400_000;

export function createReviewRecord(wordId: string, now: Date): ReviewRecord {
  return {
    wordId,
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    dueAt: now.toISOString(),
    lastReviewedAt: now.toISOString(),
    correctCount: 0,
    incorrectCount: 0,
  };
}

export function scheduleReview(
  previous: ReviewRecord | undefined,
  wordId: string,
  correct: boolean,
  now = new Date(),
): ReviewRecord {
  const base = previous ?? createReviewRecord(wordId, now);

  if (!correct) {
    return {
      ...base,
      repetitions: 0,
      intervalDays: 1,
      easeFactor: Math.max(1.3, base.easeFactor - 0.2),
      dueAt: new Date(now.getTime() + DAY_MS).toISOString(),
      lastReviewedAt: now.toISOString(),
      incorrectCount: base.incorrectCount + 1,
    };
  }

  const repetitions = base.repetitions + 1;
  const intervalDays = repetitions === 1
    ? 1
    : repetitions === 2
      ? 3
      : Math.max(4, Math.round(base.intervalDays * base.easeFactor));

  return {
    ...base,
    repetitions,
    intervalDays,
    easeFactor: Math.min(2.8, base.easeFactor + 0.05),
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
    lastReviewedAt: now.toISOString(),
    correctCount: base.correctCount + 1,
  };
}

export function selectSprintWords(
  words: VocabularyEntry[],
  reviews: Record<string, ReviewRecord>,
  count: number,
  now = new Date(),
): VocabularyEntry[] {
  const nowMs = now.getTime();
  const due: VocabularyEntry[] = [];
  const newWords: VocabularyEntry[] = [];
  const upcoming: VocabularyEntry[] = [];

  for (const word of words) {
    const review = reviews[word.id];
    if (!review) newWords.push(word);
    else if (new Date(review.dueAt).getTime() <= nowMs) due.push(word);
    else upcoming.push(word);
  }

  due.sort((a, b) => reviews[a.id].dueAt.localeCompare(reviews[b.id].dueAt));
  upcoming.sort((a, b) => reviews[a.id].dueAt.localeCompare(reviews[b.id].dueAt));

  return [...due, ...newWords, ...upcoming].slice(0, Math.min(count, words.length));
}

export function dueCount(reviews: Record<string, ReviewRecord>, now = new Date()): number {
  const nowMs = now.getTime();
  return Object.values(reviews).filter((review) => new Date(review.dueAt).getTime() <= nowMs).length;
}

export function masteryLevel(review: ReviewRecord | undefined): 0 | 1 | 2 | 3 {
  if (!review) return 0;
  if (review.repetitions >= 4) return 3;
  if (review.repetitions >= 2) return 2;
  return 1;
}
