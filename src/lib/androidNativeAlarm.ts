import { NativeModules, Platform } from 'react-native';

export type NativeAlarmPayload = {
  id: string;
  title: string;
  time: string;
  repeatDays: string[];
  soundKey: 'classic' | 'bright' | 'focus' | 'vibrate' | 'silent';
  deckId: string | null;
  deckName?: string | null;
  lessonDeckIds: string[];
  isActive: boolean;
};

type AlarmSchedulerModuleShape = {
  scheduleAlarm(payload: NativeAlarmPayload): Promise<void>;
  cancelAlarm(alarmId: string): Promise<void>;
  syncAlarms(payloads: NativeAlarmPayload[]): Promise<void>;
  schedulePreviewAlarm(payload: NativeAlarmPayload, delaySeconds: number): Promise<void>;
  dismissActiveAlarm(alarmId: string): Promise<void>;
  snoozeAlarm(alarmId: string, minutes: number): Promise<void>;
};

const nativeModule = NativeModules.AlarmSchedulerModule as AlarmSchedulerModuleShape | undefined;

export const hasNativeAlarmSupport = Platform.OS === 'android' && Boolean(nativeModule);

const getModule = () => {
  if (!nativeModule) {
    throw new Error('AlarmSchedulerModule is unavailable on this build.');
  }

  return nativeModule;
};

export const nativeAlarmScheduler = {
  scheduleAlarm(payload: NativeAlarmPayload) {
    return getModule().scheduleAlarm(payload);
  },
  cancelAlarm(alarmId: string) {
    return getModule().cancelAlarm(alarmId);
  },
  syncAlarms(payloads: NativeAlarmPayload[]) {
    return getModule().syncAlarms(payloads);
  },
  schedulePreviewAlarm(payload: NativeAlarmPayload, delaySeconds: number) {
    return getModule().schedulePreviewAlarm(payload, delaySeconds);
  },
  dismissActiveAlarm(alarmId: string) {
    return getModule().dismissActiveAlarm(alarmId);
  },
  snoozeAlarm(alarmId: string, minutes: number) {
    return getModule().snoozeAlarm(alarmId, minutes);
  },
};
