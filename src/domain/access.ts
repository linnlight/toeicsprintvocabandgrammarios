export const FREE_DAILY_WORD_LIMIT = 20;
export const FREE_GRAMMAR_LESSON_COUNT = 3;

export type AccessSprintMode = 'daily' | 'review';

export function dailyGoalForAccess(configuredGoal: number, isPro: boolean): number {
  return isPro ? configuredGoal : Math.min(configuredGoal, FREE_DAILY_WORD_LIMIT);
}

export function canAccessGrammarLesson(lessonNumber: number, isPro: boolean): boolean {
  if (!Number.isInteger(lessonNumber) || lessonNumber < 1) return false;
  return isPro || lessonNumber <= FREE_GRAMMAR_LESSON_COUNT;
}

export function sprintWordLimit(
  configuredGoal: number,
  isPro: boolean,
  studiedToday: number,
  mode: AccessSprintMode,
): number {
  const goal = dailyGoalForAccess(configuredGoal, isPro);
  if (isPro || mode === 'review') return goal;
  return Math.max(0, goal - studiedToday);
}
