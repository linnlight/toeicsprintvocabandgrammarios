import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { RetentionNotificationPlan } from './retention-notifications.types';

const CHANNEL_ID = 'study-reminders';
const RETENTION_DATA_KEY = 'retentionType';
let notificationHandlerConfigured = false;

function ensureNotificationHandlerConfigured(): void {
  if (notificationHandlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

function permissionAllowsNotifications(status: Notifications.NotificationPermissionsStatus): boolean {
  if (Platform.OS !== 'ios') return status.granted;
  const iosStatus = status.ios?.status;
  return iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED
    || iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL
    || iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Study reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    lightColor: '#208AEF',
  });
}

async function cancelRetentionNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.[RETENTION_DATA_KEY] === 'daily'
        || request.content.data?.[RETENTION_DATA_KEY] === 'weekly')
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

function notificationCopy(plan: RetentionNotificationPlan) {
  if (plan.language === 'ja') {
    return {
      dailyTitle: '今日の英単語スプリント',
      dailyBody: '短いスプリントで、今日の学習を続けましょう。',
      weeklyTitle: '今週の学習まとめ',
      weeklyBody: `直近7日間：${plan.weeklyWords}語・${plan.weeklySprints}スプリント。次の1週間も続けましょう。`,
    };
  }
  return {
    dailyTitle: "Today's vocabulary Sprint",
    dailyBody: 'Keep your progress going with a short study Sprint.',
    weeklyTitle: 'Your weekly study summary',
    weeklyBody: `Last 7 days: ${plan.weeklyWords} words and ${plan.weeklySprints} Sprints. Keep going next week.`,
  };
}

async function scheduleRetentionNotifications(plan: RetentionNotificationPlan): Promise<void> {
  await cancelRetentionNotifications();
  if (!plan.enabled) return;

  const copy = notificationCopy(plan);
  const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.dailyTitle,
      body: copy.dailyBody,
      data: { [RETENTION_DATA_KEY]: 'daily' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: plan.reminderHour,
      minute: 0,
      channelId,
    },
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.weeklyTitle,
      body: copy.weeklyBody,
      data: { [RETENTION_DATA_KEY]: 'weekly' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 19,
      minute: 0,
      channelId,
    },
  });
}

export async function requestAndScheduleRetentionNotifications(
  plan: RetentionNotificationPlan,
): Promise<boolean> {
  ensureNotificationHandlerConfigured();
  await configureAndroidChannel();
  let status = await Notifications.getPermissionsAsync();
  if (!permissionAllowsNotifications(status)) {
    status = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
  }
  if (!permissionAllowsNotifications(status)) return false;
  await scheduleRetentionNotifications({ ...plan, enabled: true });
  return true;
}

export async function syncRetentionNotifications(plan: RetentionNotificationPlan): Promise<void> {
  ensureNotificationHandlerConfigured();
  await configureAndroidChannel();
  if (!plan.enabled) {
    await cancelRetentionNotifications();
    return;
  }
  const status = await Notifications.getPermissionsAsync();
  if (permissionAllowsNotifications(status)) await scheduleRetentionNotifications(plan);
}
