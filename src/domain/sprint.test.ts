import { describe, expect, it } from 'vitest';

import { answerSprint, createSprint, sprintResult } from './sprint';

describe('sprint session', () => {
  it('queues each missed word for one same-session repeat', () => {
    let session = createSprint(['agenda', 'invoice'], new Date('2026-06-20T00:00:00Z'));
    session = answerSprint(session, 'wrong', false);
    expect(session.queue).toEqual(['agenda', 'invoice', 'agenda']);
    session = answerSprint(session, '請求書', true);
    session = answerSprint(session, '議題', true);
    expect(session.completed).toBe(true);
    expect(session.answers[2].isRepeat).toBe(true);
  });

  it('reports initial-answer accuracy independently of repeat answers', () => {
    let session = createSprint(['agenda', 'invoice']);
    session = answerSprint(session, 'wrong', false);
    session = answerSprint(session, '請求書', true);
    session = answerSprint(session, '議題', true);
    expect(sprintResult(session)).toMatchObject({
      uniqueWords: 2,
      answers: 3,
      correct: 1,
      accuracy: 50,
      incorrectWordIds: ['agenda'],
    });
  });
});
