import type { RetentionNotificationPlan } from './retention-notifications.types';

// The web MVP has no native notification scheduler. Metro replaces this module
// with retention-notifications.native.ts in iOS and Android builds.
export async function requestAndScheduleRetentionNotifications(
  _plan: RetentionNotificationPlan,
): Promise<boolean> {
  return false;
}

export async function syncRetentionNotifications(_plan: RetentionNotificationPlan): Promise<void> {}

