import type { Part5Test } from '../content/part5-catalog';

import type { Part5Session, Part5TestAttempt } from './models';

export const FREE_PART5_TEST_COUNT = 2;
// Tests 1–2 are the free preview. Tests 3–10 require the Pro entitlement.
export const PART5_PRO_GATING_ENABLED = true;

export function canAccessPart5Test(testNumber: number, isPro: boolean): boolean {
  if (!Number.isInteger(testNumber) || testNumber < 1) return false;
  return !PART5_PRO_GATING_ENABLED || isPro || testNumber <= FREE_PART5_TEST_COUNT;
}

export function createPart5Session(testId: string, now = new Date()): Part5Session {
  return {
    testId,
    startedAt: now.toISOString(),
    cursor: 0,
    answers: [],
    completed: false,
  };
}

export function answerPart5Question(
  session: Part5Session,
  test: Part5Test,
  selectedIndex: number,
): Part5Session {
  if (session.completed || session.testId !== test.id) return session;
  const question = test.questions[session.cursor];
  if (!question || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) {
    return session;
  }

  const answers = [
    ...session.answers,
    {
      questionId: question.id,
      selectedIndex,
      correct: selectedIndex === question.correctIndex,
    },
  ];
  const completed = answers.length === test.questions.length;
  return {
    ...session,
    answers,
    cursor: completed ? session.cursor : session.cursor + 1,
    completed,
  };
}

export function part5Score(session: Part5Session): number {
  return session.answers.filter((answer) => answer.correct).length;
}

export function recordPart5Attempt(
  previous: Part5TestAttempt | undefined,
  session: Part5Session,
  now = new Date(),
): Part5TestAttempt {
  const score = part5Score(session);
  return {
    testId: session.testId,
    attempts: (previous?.attempts ?? 0) + 1,
    bestScore: Math.max(previous?.bestScore ?? 0, score),
    latestScore: score,
    lastCompletedAt: now.toISOString(),
  };
}
