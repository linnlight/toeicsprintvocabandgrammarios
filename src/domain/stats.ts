import type { StudyStats } from './models';

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function previousDayKey(date = new Date()): string {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return localDayKey(previous);
}

export function recordCompletedSprint(
  stats: StudyStats,
  uniqueWords: number,
  totalAnswers: number,
  correctAnswers: number,
  now = new Date(),
): StudyStats {
  const today = localDayKey(now);
  const studiedToday = stats.studiedTodayDate === today ? stats.studiedToday + uniqueWords : uniqueWords;
  const streak = stats.lastStudyDate === today
    ? stats.streak
    : stats.lastStudyDate === previousDayKey(now)
      ? stats.streak + 1
      : 1;

  return {
    totalAnswers: stats.totalAnswers + totalAnswers,
    correctAnswers: stats.correctAnswers + correctAnswers,
    completedSprints: stats.completedSprints + 1,
    streak,
    longestStreak: Math.max(stats.longestStreak, streak),
    lastStudyDate: today,
    studiedToday,
    studiedTodayDate: today,
  };
}

export function currentDailyCount(stats: StudyStats, now = new Date()): number {
  return stats.studiedTodayDate === localDayKey(now) ? stats.studiedToday : 0;
}
