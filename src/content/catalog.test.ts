import { describe, expect, it } from 'vitest';

import essentialVocabulary from './essential-vocabulary.json';
import { vocabulary } from './catalog';

describe('vocabulary catalog', () => {
  it('contains all 600 essential lesson records', () => {
    expect(essentialVocabulary).toHaveLength(600);
    expect(essentialVocabulary.filter((entry) => entry.sourceId === '600-essential-words')).toHaveLength(600);
  });

  it('merges sources into a unique 875-word catalog', () => {
    expect(vocabulary).toHaveLength(875);
    expect(new Set(vocabulary.map((entry) => entry.id)).size).toBe(vocabulary.length);
    expect(new Set(vocabulary.map((entry) => entry.term.toLocaleLowerCase('en-US'))).size).toBe(vocabulary.length);
  });

  it('provides complete Japanese learning content and three distractors', () => {
    for (const entry of vocabulary) {
      expect(entry.meaningJa.length).toBeGreaterThan(0);
      expect(entry.explanationJa.length).toBeGreaterThan(0);
      expect(entry.example.length).toBeGreaterThan(0);
      expect(entry.exampleJa.length).toBeGreaterThan(0);
      expect(entry.distractors).toHaveLength(3);
    }
  });
});
