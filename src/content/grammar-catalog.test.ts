import { describe, expect, it } from 'vitest';

import { grammarLessons, grammarQuestionCount, grammarSources } from './grammar-catalog';

describe('grammar catalog', () => {
  it('contains the complete forty-lesson grammar catalog', () => {
    expect(grammarLessons).toHaveLength(40);
    expect(grammarQuestionCount).toBe(120);
    expect(grammarSources).toHaveLength(5);
  });

  it('has a valid unique answer for every question', () => {
    const questions = grammarLessons.flatMap((lesson) => lesson.questions);
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
    for (const question of questions) {
      expect(new Set(question.options).size).toBe(4);
      expect(question.options[question.correctIndex]).toBeTruthy();
    }
  });
});
