import type { AnswerEvent, SprintResult, SprintSession, VocabularyEntry } from './models';

export function createSprint(wordIds: string[], now = new Date()): SprintSession {
  return {
    id: `sprint-${now.getTime()}`,
    startedAt: now.toISOString(),
    targetCount: wordIds.length,
    queue: [...wordIds],
    initialWordIds: [...wordIds],
    cursor: 0,
    answers: [],
    repeatedWordIds: [],
    completed: wordIds.length === 0,
  };
}

export function answerSprint(
  session: SprintSession,
  selectedMeaning: string,
  correct: boolean,
  now = new Date(),
): SprintSession {
  const wordId = session.queue[session.cursor];
  if (!wordId || session.completed) return session;

  const isRepeat = !session.initialWordIds.includes(wordId) || session.cursor >= session.initialWordIds.length;
  const answer: AnswerEvent = { wordId, selectedMeaning, correct, answeredAt: now.toISOString(), isRepeat };
  const shouldRepeat = !correct && !session.repeatedWordIds.includes(wordId);
  const queue = shouldRepeat ? [...session.queue, wordId] : session.queue;
  const repeatedWordIds = shouldRepeat ? [...session.repeatedWordIds, wordId] : session.repeatedWordIds;
  const cursor = session.cursor + 1;

  return {
    ...session,
    queue,
    repeatedWordIds,
    cursor,
    answers: [...session.answers, answer],
    completed: cursor >= queue.length,
  };
}

export function sprintResult(session: SprintSession): SprintResult {
  const firstAnswers = new Map<string, AnswerEvent>();
  for (const answer of session.answers) {
    if (!firstAnswers.has(answer.wordId)) firstAnswers.set(answer.wordId, answer);
  }
  const correct = [...firstAnswers.values()].filter((answer) => answer.correct).length;
  const uniqueWords = firstAnswers.size;
  const incorrectWordIds = [...firstAnswers.values()].filter((answer) => !answer.correct).map((answer) => answer.wordId);

  return {
    uniqueWords,
    answers: session.answers.length,
    correct,
    accuracy: uniqueWords === 0 ? 0 : Math.round((correct / uniqueWords) * 100),
    incorrectWordIds,
    xp: correct * 10 + (uniqueWords - correct) * 4,
  };
}

export function buildChoices(word: VocabularyEntry, allWords: VocabularyEntry[]): string[] {
  const candidates = [...word.distractors, ...allWords.filter((item) => item.id !== word.id).map((item) => item.meaningJa)];
  const unique = [...new Set(candidates)].filter((choice) => choice !== word.meaningJa).slice(0, 3);
  const choices = [word.meaningJa, ...unique];
  let seed = word.id.split('').reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 0);
  for (let index = choices.length - 1; index > 0; index -= 1) {
    seed = ((seed * 1_664_525) + 1_013_904_223) >>> 0;
    const swapIndex = seed % (index + 1);
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }
  return choices;
}
