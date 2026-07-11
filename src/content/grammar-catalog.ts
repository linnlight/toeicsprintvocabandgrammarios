import { z } from 'zod';

import rawLessons from './grammar-lessons.json';
import rawSources from './grammar-sources.json';

const questionSchema = z.object({
  id: z.string().min(1), prompt: z.string().min(1),
  options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  correctIndex: z.number().int().min(0).max(3), explanationJa: z.string().min(1),
});

const lessonSchema = z.object({
  id: z.string().min(1), number: z.number().int().positive(), level: z.number().int().min(1).max(3),
  titleJa: z.string().min(1), titleEn: z.string().min(1), summaryJa: z.string().min(1), ruleJa: z.string().min(1),
  examples: z.array(z.object({ en: z.string().min(1), ja: z.string().min(1) })).min(2),
  sourceId: z.string().min(1), sourceLocator: z.string().min(1), questions: z.array(questionSchema).min(3),
});

export type GrammarLesson = z.infer<typeof lessonSchema>;
export type GrammarQuestion = z.infer<typeof questionSchema>;
export const grammarSources = z.array(z.object({
  id: z.string().min(1), fileName: z.string().min(1), type: z.literal('supplied_pdf'), use: z.string().min(1),
})).parse(rawSources);
export const grammarLessons = z.array(lessonSchema).parse(rawLessons);
const grammarSourceIds = new Set(grammarSources.map((source) => source.id));
for (const lesson of grammarLessons) {
  if (!grammarSourceIds.has(lesson.sourceId)) throw new Error(`Unknown grammar source: ${lesson.sourceId}`);
}
export const grammarLessonById = new Map(grammarLessons.map((lesson) => [lesson.id, lesson]));
export const grammarQuestionCount = grammarLessons.reduce((sum, lesson) => sum + lesson.questions.length, 0);
