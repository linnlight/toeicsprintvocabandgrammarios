import { describe, expect, it } from 'vitest';

import { part5Tests } from '../content/part5-catalog';

import {
  answerPart5Question,
  canAccessPart5Test,
  createPart5Session,
  part5Score,
  recordPart5Attempt,
} from './part5';

describe('Part 5 tests', () => {
  it('temporarily allows every test while Pro gating is disabled', () => {
    expect(canAccessPart5Test(1, false)).toBe(true);
    expect(canAccessPart5Test(2, false)).toBe(true);
    expect(canAccessPart5Test(3, false)).toBe(true);
    expect(canAccessPart5Test(10, false)).toBe(true);
    expect(canAccessPart5Test(10, true)).toBe(true);
  });

  it('scores a completed session and records the best result', () => {
    const test = part5Tests[0];
    let session = createPart5Session(test.id, new Date('2026-01-01T00:00:00.000Z'));
    for (const question of test.questions) {
      session = answerPart5Question(session, test, question.correctIndex);
    }
    expect(session.completed).toBe(true);
    expect(part5Score(session)).toBe(40);

    const attempt = recordPart5Attempt(undefined, session, new Date('2026-01-02T00:00:00.000Z'));
    expect(attempt).toMatchObject({ attempts: 1, bestScore: 40, latestScore: 40 });
  });

  it('rejects invalid answers without advancing', () => {
    const test = part5Tests[0];
    const session = createPart5Session(test.id);
    expect(answerPart5Question(session, test, 4)).toEqual(session);
  });
});
