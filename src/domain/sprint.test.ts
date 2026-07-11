import { describe, expect, it } from 'vitest';

import type { VocabularyEntry } from './models';
import { answerSprint, buildChoices, createSprint, sprintResult } from './sprint';

function word(id: string, meaningJa: string, distractors = ['A', 'B', 'C']): VocabularyEntry {
  return {
    id,
    term: id,
    pronunciation: '/test/',
    partOfSpeech: '名詞',
    meaningJa,
    category: 'test',
    level: 1,
    example: 'Example.',
    exampleJa: '例。',
    explanationJa: '説明',
    distractors,
    sourceId: 'source',
    sourceLocator: 'p.1',
    contentTypes: ['source_term'],
  };
}

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

  it('builds four unique, deterministic choices containing the answer', () => {
    const target = word('agenda', '議題', ['請求書', '契約', '会議']);
    const allWords = [target, word('invoice', '請求書')];
    const choices = buildChoices(target, allWords);

    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain('議題');
    expect(buildChoices(target, allWords)).toEqual(choices);
  });
});
