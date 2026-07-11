import type { DailyStudyActivity, StudyStats } from './models';

export interface WeeklyStudySummary extends DailyStudyActivity {
  studiedDays: number;
  accuracy: number;
}

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function previousDayKey(date = new Date()): string {
  return shiftedDayKey(date, -1);
}

export function shiftedDayKey(date: Date, days: number): string {
  const previous = new Date(date);
  previous.setDate(previous.getDate() + days);
  return localDayKey(previous);
}

export function localMonthKey(date = new Date()): string {
  return localDayKey(date).slice(0, 7);
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
  const missedDay = previousDayKey(now);
  const missedDayMonth = missedDay.slice(0, 7);
  const canUseFreeze = stats.streak > 0
    && stats.lastStudyDate === shiftedDayKey(now, -2)
    && stats.lastStreakFreezeMonth !== missedDayMonth;
  const streak = stats.lastStudyDate === today
    ? stats.streak
    : stats.lastStudyDate === missedDay || canUseFreeze
      ? stats.streak + 1
      : 1;
  const previousActivity = stats.dailyActivity[today] ?? { words: 0, sprints: 0, answers: 0, correctAnswers: 0 };

  return {
    totalAnswers: stats.totalAnswers + totalAnswers,
    correctAnswers: stats.correctAnswers + correctAnswers,
    completedSprints: stats.completedSprints + 1,
    streak,
    longestStreak: Math.max(stats.longestStreak, streak),
    lastStudyDate: today,
    studiedToday,
    studiedTodayDate: today,
    dailyActivity: {
      ...stats.dailyActivity,
      [today]: {
        words: previousActivity.words + uniqueWords,
        sprints: previousActivity.sprints + 1,
        answers: previousActivity.answers + totalAnswers,
        correctAnswers: previousActivity.correctAnswers + correctAnswers,
      },
    },
    lastStreakFreezeMonth: canUseFreeze ? missedDayMonth : stats.lastStreakFreezeMonth,
  };
}

export function currentDailyCount(stats: StudyStats, now = new Date()): number {
  return stats.studiedTodayDate === localDayKey(now) ? stats.studiedToday : 0;
}

export function rollingWeekSummary(stats: StudyStats, now = new Date()): WeeklyStudySummary {
  const summary: WeeklyStudySummary = {
    words: 0,
    sprints: 0,
    answers: 0,
    correctAnswers: 0,
    studiedDays: 0,
    accuracy: 0,
  };

  for (let offset = 0; offset < 7; offset += 1) {
    const activity = stats.dailyActivity[shiftedDayKey(now, -offset)];
    if (!activity) continue;
    summary.words += activity.words;
    summary.sprints += activity.sprints;
    summary.answers += activity.answers;
    summary.correctAnswers += activity.correctAnswers;
    if (activity.sprints > 0) summary.studiedDays += 1;
  }

  summary.accuracy = summary.answers === 0 ? 0 : Math.round((summary.correctAnswers / summary.answers) * 100);
  return summary;
}

export function isCurrentMonthFreezeAvailable(stats: StudyStats, now = new Date()): boolean {
  return stats.lastStreakFreezeMonth !== localMonthKey(now);
}
