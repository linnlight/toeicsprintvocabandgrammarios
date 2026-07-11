export const FREE_DAILY_WORD_LIMIT = 20;

export type AccessSprintMode = 'daily' | 'review';

export function dailyGoalForAccess(configuredGoal: number, isPro: boolean): number {
  return isPro ? configuredGoal : Math.min(configuredGoal, FREE_DAILY_WORD_LIMIT);
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
