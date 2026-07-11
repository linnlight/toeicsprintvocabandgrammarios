import type { UiLanguage } from '@/i18n/copy';

export interface RetentionNotificationPlan {
  enabled: boolean;
  reminderHour: number;
  language: UiLanguage;
  weeklyWords: number;
  weeklySprints: number;
}

