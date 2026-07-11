import rawTests from './part5-tests.json';

export interface Part5Question {
  id: string;
  number: number;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  sourceId: string;
  sourceLocator: string;
}

export interface Part5Test {
  id: string;
  number: number;
  titleJa: string;
  titleEn: string;
  questions: Part5Question[];
}

function validateCatalog(value: unknown): Part5Test[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Part 5 catalog must contain at least one test');
  }

  const ids = new Set<string>();
  return value.map((candidate, testIndex) => {
    const test = candidate as Partial<Part5Test>;
    if (
      typeof test.id !== 'string'
      || typeof test.number !== 'number'
      || typeof test.titleJa !== 'string'
      || typeof test.titleEn !== 'string'
      || !Array.isArray(test.questions)
      || test.questions.length !== 40
    ) {
      throw new Error(`Invalid Part 5 test at index ${testIndex}`);
    }

    const questions = test.questions.map((candidateQuestion, questionIndex) => {
      const question = candidateQuestion as Partial<Part5Question>;
      const correctIndex = question.correctIndex;
      if (
        typeof question.id !== 'string'
        || ids.has(question.id)
        || typeof question.number !== 'number'
        || question.number !== questionIndex + 1
        || typeof question.prompt !== 'string'
        || question.prompt.length === 0
        || !Array.isArray(question.options)
        || question.options.length !== 4
        || question.options.some((option) => typeof option !== 'string' || option.length === 0)
        || !Number.isInteger(correctIndex)
        || correctIndex === undefined
        || correctIndex < 0
        || correctIndex > 3
        || typeof question.sourceId !== 'string'
        || typeof question.sourceLocator !== 'string'
      ) {
        throw new Error(`Invalid question ${questionIndex + 1} in ${test.id}`);
      }
      ids.add(question.id);
      return question as Part5Question;
    });

    return { ...test, questions } as Part5Test;
  });
}

export const part5Tests = validateCatalog(rawTests);
export const part5TestById = new Map(part5Tests.map((test) => [test.id, test]));
export const part5QuestionCount = part5Tests.reduce((total, test) => total + test.questions.length, 0);
