import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { hasNativeAlarmSupport, nativeAlarmScheduler, type NativeAlarmPayload } from './androidNativeAlarm';
import { getAlarmSoundOption } from './alarmOptions';
import type { Alarm } from './hooks';

type NotificationsModule = any;
const isExpoGo =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
let cachedNotificationsModule: NotificationsModule | null | undefined;
let notificationModuleWarningShown = false;

const getNotificationsModule = (): NotificationsModule | null => {
  if (cachedNotificationsModule !== undefined) {
    return cachedNotificationsModule;
  }

  if (isExpoGo) {
    cachedNotificationsModule = null;
    return cachedNotificationsModule;
  }

  try {
    cachedNotificationsModule = require('expo-notifications');
    return cachedNotificationsModule;
  } catch (error) {
    cachedNotificationsModule = null;
    if (!notificationModuleWarningShown) {
      notificationModuleWarningShown = true;
      console.warn('expo-notifications native module unavailable:', error);
    }
    return cachedNotificationsModule;
  }
};

type NotificationResponse = any;

const ALARM_CHANNEL_ID = 'vocab-alarm';
const ALARM_NOTIFICATION_SOURCE = 'vocab-alarm';
const ALARM_ROUTE = '/alarm/ringing';
const LEARNING_ROUTE = '/learning';

const dayToWeekday: Record<string, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

let notificationHandlerConfigured = false;
let lastHandledForegroundAlarmId = '';
let lastHandledForegroundAt = 0;

const getAlarmNotificationId = (alarmId: string, suffix: string) => `vocab-alarm-${alarmId}-${suffix}`;

const getAllPossibleAlarmNotificationIds = (alarmId: string) => [
  getAlarmNotificationId(alarmId, 'once'),
  ...Object.keys(dayToWeekday).map((dayId) => getAlarmNotificationId(alarmId, dayId)),
  getAlarmNotificationId(alarmId, 'debug'),
];

const parseAlarmTime = (time: string) => {
  const [rawHour, rawMinute] = time.split(':').map(Number);
  const hour = Number.isFinite(rawHour) ? Math.min(Math.max(rawHour, 0), 23) : 7;
  const minute = Number.isFinite(rawMinute) ? Math.min(Math.max(rawMinute, 0), 59) : 0;

  return { hour, minute };
};

const getNextOneTimeAlarmDate = (hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
};

const alarmNotificationsEnabled = () => {
  const user = useAppStore.getState().user;
  return user?.notificationsEnabled !== false && user?.alarmNotifications !== false;
};

const getNotificationBody = (alarm: Alarm) => {
  const lessonCount = alarm.lessonDeckIds?.length || 0;
  if (alarm.deckName) {
    return lessonCount > 0
      ? `Đến giờ học ${alarm.deckName} với ${lessonCount} bài học đã chọn.`
      : `Đến giờ học ${alarm.deckName}. Chạm để bắt đầu phiên học.`;
  }

  return 'Đến giờ học từ vựng. Chạm để bắt đầu phiên học.';
};

const toNativeAlarmPayload = (alarm: Alarm): NativeAlarmPayload => ({
  id: alarm.id,
  title: alarm.title || 'LexiWake',
  time: alarm.time,
  repeatDays: alarm.repeatDays || [],
  soundKey: alarm.soundKey || 'classic',
  deckId: alarm.deckId || null,
  deckName: alarm.deckName || null,
  lessonDeckIds: alarm.lessonDeckIds || [],
  isActive: alarm.isActive,
});

const formatLessonDeckIdsParam = (lessonDeckIds: unknown) =>
  Array.isArray(lessonDeckIds) ? lessonDeckIds.join(',') : '';

const pushAlarmRingingRoute = (data: Record<string, unknown>, triggerSource: string) => {
  router.push({
    pathname: ALARM_ROUTE as any,
    params: {
      alarmId: data.alarmId ? String(data.alarmId) : '',
      deckId: data.deckId ? String(data.deckId) : '',
      deckName: data.deckName ? String(data.deckName) : '',
      soundKey: data.soundKey ? String(data.soundKey) : '',
      title: data.title ? String(data.title) : '',
      time: data.time ? String(data.time) : '',
      lessonDeckIds: formatLessonDeckIdsParam(data.lessonDeckIds),
      triggerSource,
    },
  });
};

const pushLearningRoute = (data: Record<string, unknown>, triggerSource: string) => {
  router.push({
    pathname: LEARNING_ROUTE as any,
    params: {
      deckId: data.deckId ? String(data.deckId) : '',
      lessonDeckIds: formatLessonDeckIdsParam(data.lessonDeckIds),
      alarmId: data.alarmId ? String(data.alarmId) : '',
      triggerSource,
    },
  });
};

const scheduleIosSnoozeNotification = async (
  data: {
    alarmId?: string;
    deckId?: string | null;
    deckName?: string | null;
    lessonDeckIds?: string[];
    title?: string;
    time?: string;
  },
  delayMinutes: number
) => {
  const Notifications = getNotificationsModule();
  if (!Notifications || Platform.OS !== 'ios') {
    return null;
  }

  const notificationId = getAlarmNotificationId(data.alarmId || 'ios-snooze', 'snooze');
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: {
      title: data.title || 'LexiWake',
      body: data.deckName
        ? `Đến giờ học ${data.deckName}. Chạm để bắt đầu phiên học.`
        : 'Đến giờ học từ vựng. Chạm để bắt đầu phiên học.',
      sound: 'default',
      interruptionLevel: 'timeSensitive',
      data: {
        source: ALARM_NOTIFICATION_SOURCE,
        alarmId: data.alarmId || '',
        deckId: data.deckId || '',
        deckName: data.deckName || '',
        lessonDeckIds: data.lessonDeckIds || [],
        title: data.title || 'LexiWake',
        time: data.time || '',
        url: ALARM_ROUTE,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
      repeats: false,
    },
  });

  return notificationId;
};

export const isNotificationPreviewUnsupported = () =>
  Platform.OS === 'android' && (isExpoGo || !hasNativeAlarmSupport);

function ensureNotificationHandler() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return;
  }

  if (notificationHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async (notification: any) => {
      const soundKey = notification.request.content.data?.soundKey;
      const shouldPlaySound =
        Platform.OS === 'ios' ? true : soundKey !== 'vibrate' && soundKey !== 'silent';

      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound,
        shouldSetBadge: false,
      };
    },
  });

  notificationHandlerConfigured = true;
}

const buildNotificationContent = (alarm: Alarm) => {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const soundOption = getAlarmSoundOption(alarm.soundKey);
  const shouldPlaySound =
    Platform.OS === 'ios' ? true : soundOption.key !== 'vibrate' && soundOption.key !== 'silent';
  const shouldVibrate = soundOption.key !== 'silent';

  return {
    title: alarm.title || 'LexiWake',
    body: getNotificationBody(alarm),
    sound: shouldPlaySound ? 'default' : undefined,
    priority: Platform.OS === 'android' ? Notifications.AndroidNotificationPriority.MAX : undefined,
    vibrate: Platform.OS === 'android' && shouldVibrate ? [0, 300, 200, 300] : undefined,
    interruptionLevel: 'timeSensitive' as const,
    data: {
      source: ALARM_NOTIFICATION_SOURCE,
      alarmId: alarm.id,
      soundKey: soundOption.key,
      deckId: alarm.deckId,
      deckName: alarm.deckName,
      lessonDeckIds: alarm.lessonDeckIds || [],
      title: alarm.title,
      time: alarm.time,
      url: ALARM_ROUTE,
    },
  };
};

export async function ensureNotificationSetup() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  ensureNotificationHandler();

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(
        ALARM_CHANNEL_ID,
        {
        name: 'LexiWake',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#3525cd',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      }
      );
    } catch (error) {
      console.warn('Notification channel setup failed:', error);
    }
  }

  return true;
}

export async function ensureNotificationPermission() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  await ensureNotificationSetup();

  const currentPermission = await Notifications.getPermissionsAsync();
  console.log('[alarm-notification] current permission', JSON.stringify(currentPermission));
  if (currentPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: false,
    },
  });

  console.log('[alarm-notification] requested permission', JSON.stringify(requestedPermission));

  return requestedPermission.granted;
}

export async function cancelAlarmNotifications(alarmId: string) {
  const Notifications = getNotificationsModule();
  if (hasNativeAlarmSupport) {
    await nativeAlarmScheduler.cancelAlarm(alarmId);
  }

  if (Notifications) {
    await Promise.all(
      getAllPossibleAlarmNotificationIds(alarmId).map((notificationId) =>
        Notifications.cancelScheduledNotificationAsync(notificationId)
      )
    );
  }
}

export async function cancelAllAlarmNotifications() {
  const Notifications = getNotificationsModule();
  if (hasNativeAlarmSupport) {
    await nativeAlarmScheduler.syncAlarms([]);
  }

  if (Notifications) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotificationIds = scheduledNotifications
      .filter((notification: any) => notification.content.data?.source === ALARM_NOTIFICATION_SOURCE)
      .map((notification: any) => notification.identifier);

    await Promise.all(
      alarmNotificationIds.map((notificationId: string) =>
        Notifications.cancelScheduledNotificationAsync(notificationId)
      )
    );
  }
}

async function scheduleAlarmNotificationsInternal(alarm: Alarm, shouldCancelExisting: boolean) {
  const Notifications = getNotificationsModule();
  if (hasNativeAlarmSupport) {
    await ensureNotificationPermission().catch(() => false);

    if (shouldCancelExisting) {
      await nativeAlarmScheduler.cancelAlarm(alarm.id);
    }

    if (!alarm.isActive || !alarmNotificationsEnabled()) {
      return [];
    }

    await nativeAlarmScheduler.scheduleAlarm(toNativeAlarmPayload(alarm));
    return [alarm.id];
  }

  if (shouldCancelExisting) {
    await cancelAlarmNotifications(alarm.id);
  }

  if (!alarm.isActive || !alarmNotificationsEnabled()) {
    return [];
  }

  if (!Notifications) {
    return [];
  }

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return [];
  }

  const { hour, minute } = parseAlarmTime(alarm.time);
  const repeatDays = (alarm.repeatDays || []).filter((dayId) => dayToWeekday[dayId]);
  const content = buildNotificationContent(alarm);
  if (!content) {
    return [];
  }

  if (repeatDays.length === 0) {
    const notificationId = getAlarmNotificationId(alarm.id, 'once');
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: getNextOneTimeAlarmDate(hour, minute),
        channelId: ALARM_CHANNEL_ID,
      },
    });

    return [notificationId];
  }

  const scheduledIds = await Promise.all(
    repeatDays.map(async (dayId) => {
      const notificationId = getAlarmNotificationId(alarm.id, dayId);
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: dayToWeekday[dayId],
          hour,
          minute,
          channelId: ALARM_CHANNEL_ID,
        },
      });

      return notificationId;
    })
  );

  return scheduledIds;
}

export async function scheduleAlarmNotifications(alarm: Alarm) {
  const ids = await scheduleAlarmNotificationsInternal(alarm, true);
  console.log('[alarm-notification] scheduled alarm ids', alarm.id, ids);
  return ids;
}

export async function syncAlarmNotifications(alarms: Alarm[]) {
  if (hasNativeAlarmSupport) {
    if (!alarmNotificationsEnabled()) {
      await nativeAlarmScheduler.syncAlarms([]);
      return [];
    }

    const activeAlarms = alarms
      .filter((alarm) => alarm.isActive)
      .map((alarm) => toNativeAlarmPayload(alarm));
    await nativeAlarmScheduler.syncAlarms(activeAlarms);
    return activeAlarms.map((alarm) => alarm.id);
  }

  await cancelAllAlarmNotifications();

  if (!alarmNotificationsEnabled()) {
    return [];
  }

  const scheduledIdGroups = await Promise.all(
    alarms
      .filter((alarm) => alarm.isActive)
      .map((alarm) => scheduleAlarmNotificationsInternal(alarm, false))
  );

  return scheduledIdGroups.flat();
}

export async function scheduleDebugAlarmPreview(alarm: Alarm, delaySeconds = 5) {
  const Notifications = getNotificationsModule();
  if (hasNativeAlarmSupport) {
    await ensureNotificationPermission().catch(() => false);

    const previewAlarm = {
      ...alarm,
      title: `${alarm.title || 'LexiWake'} (test)`,
    };
    await nativeAlarmScheduler.schedulePreviewAlarm(
      toNativeAlarmPayload(previewAlarm),
      delaySeconds
    );
    console.log('[alarm-notification] scheduled native debug alarm', previewAlarm.id);
    return previewAlarm.id;
  }

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    console.warn('[alarm-notification] permission denied for debug preview');
    return null;
  }

  if (!Notifications) {
    return null;
  }

  const notificationId = getAlarmNotificationId(alarm.id || 'preview', 'debug');
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: {
      ...buildNotificationContent(alarm),
      title: `${alarm.title || 'LexiWake'} (test)`,
      body: `Thông báo thử sẽ mở màn ringing sau ${delaySeconds} giây.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      repeats: false,
      channelId: ALARM_CHANNEL_ID,
    },
  });

  console.log('[alarm-notification] scheduled debug notification', notificationId);
  return notificationId;
}

export async function registerAlarmNotificationListeners() {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return () => {};
  }

  ensureNotificationHandler();

  const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync().catch(() => null);
  if (lastNotificationResponse) {
    setTimeout(() => handleAlarmNotificationResponse(lastNotificationResponse), 0);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
    const data = notification.request.content.data || {};
    if (data.source !== ALARM_NOTIFICATION_SOURCE || data.url !== ALARM_ROUTE) {
      return;
    }

    const alarmId = data.alarmId ? String(data.alarmId) : '';
    const now = Date.now();
    if (
      alarmId &&
      alarmId === lastHandledForegroundAlarmId &&
      now - lastHandledForegroundAt < 5000
    ) {
      return;
    }

    lastHandledForegroundAlarmId = alarmId;
    lastHandledForegroundAt = now;

    if (Platform.OS === 'ios') {
      pushAlarmRingingRoute(data, 'ios_foreground_alarm');
      return;
    }

    pushAlarmRingingRoute(data, 'notification_foreground');
  });

  const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
    handleAlarmNotificationResponse(response);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  });

  return () => {
    receivedSubscription.remove();
    subscription.remove();
  };
}

export function handleAlarmNotificationResponse(response: NotificationResponse) {
  const url = response?.notification.request.content.data?.url;

  if (url === ALARM_ROUTE) {
    const data = response?.notification.request.content.data || {};
    const alarmId = data.alarmId ? String(data.alarmId) : '';
    const now = Date.now();

    if (
      Platform.OS === 'ios' &&
      alarmId &&
      alarmId === lastHandledForegroundAlarmId &&
      now - lastHandledForegroundAt < 5000
    ) {
      return;
    }

    if (Platform.OS === 'ios') {
      pushLearningRoute(data, 'ios_notification');
      return;
    }

    pushAlarmRingingRoute(data, 'notification_tap');
  }
}

export { scheduleIosSnoozeNotification };
