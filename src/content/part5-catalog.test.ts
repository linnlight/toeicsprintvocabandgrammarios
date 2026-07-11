import { describe, expect, it } from 'vitest';

import { part5QuestionCount, part5Tests } from './part5-catalog';

describe('Part 5 content catalog', () => {
  it('contains ten complete test sets', () => {
    expect(part5Tests).toHaveLength(10);
    expect(part5QuestionCount).toBe(400);
    expect(part5Tests.every((test) => test.questions.length === 40)).toBe(true);
  });

  it('has unique question IDs and valid answers', () => {
    const questions = part5Tests.flatMap((test) => test.questions);
    expect(new Set(questions.map((question) => question.id)).size).toBe(400);
    expect(questions.every((question) => question.correctIndex >= 0 && question.correctIndex < 4)).toBe(true);
    expect(questions.every((question) => question.options.length === 4)).toBe(true);
  });

  it('tracks the supplied source for every question', () => {
    expect(part5Tests.flatMap((test) => test.questions).every((question) => (
      question.sourceId === 'part5-003'
      && question.sourceLocator.includes('003.pdf')
    ))).toBe(true);
  });
});
