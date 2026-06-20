import { z } from 'zod';

import sourceData from './sources.json';
import essentialVocabularyData from './essential-vocabulary.json';
import topicVocabularyData from './topic-vocabulary.json';
import vocabularyData from './vocabulary.json';

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['supplied_pdf', 'spreadsheet', 'ai_generated', 'editorial']),
  fileName: z.string().min(1),
  note: z.string().optional(),
});

const vocabularySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  pronunciation: z.string().min(1),
  partOfSpeech: z.string().min(1),
  meaningJa: z.string().min(1),
  category: z.string().min(1),
  level: z.number().int().min(1).max(3),
  example: z.string().min(1),
  exampleJa: z.string().min(1),
  explanationJa: z.string().min(1),
  distractors: z.array(z.string().min(1)).min(3),
  sourceId: z.string().min(1),
  sourceLocator: z.string().min(1),
  contentTypes: z.array(z.enum(['source_term', 'editorial_translation', 'ai_assisted_learning'])).min(1),
});

export const contentSources = z.array(sourceSchema).parse(sourceData);
const curatedVocabulary = z.array(vocabularySchema).parse(vocabularyData);
const essentialVocabulary = z.array(vocabularySchema).parse(essentialVocabularyData);
const topicVocabulary = z.array(vocabularySchema).parse(topicVocabularyData);

const seenTerms = new Set<string>();
export const vocabulary = [...curatedVocabulary, ...essentialVocabulary, ...topicVocabulary].filter((entry) => {
  const key = entry.term.toLocaleLowerCase('en-US').trim();
  if (seenTerms.has(key)) return false;
  seenTerms.add(key);
  return true;
});

const sourceIds = new Set(contentSources.map((source) => source.id));
for (const entry of vocabulary) {
  if (!sourceIds.has(entry.sourceId)) {
    throw new Error(`Unknown sourceId "${entry.sourceId}" for vocabulary entry "${entry.id}"`);
  }
}

export const vocabularyById = new Map(vocabulary.map((entry) => [entry.id, entry]));
export const sourceById = new Map(contentSources.map((source) => [source.id, source]));
