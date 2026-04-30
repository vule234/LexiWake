import type { AlarmRingtoneKey } from './alarmRingtones';

export type AlarmSoundKey = AlarmRingtoneKey;

export const alarmSoundOptions: Array<{
  key: AlarmSoundKey;
  label: string;
  description: string;
}> = [
  {
    key: 'classic',
    label: 'Classic',
    description: 'Nhịp chuông cân bằng, dễ nghe và rõ để bắt đầu buổi học.',
  },
  {
    key: 'bright',
    label: 'Bright',
    description: 'Chuông sáng, cao và gọn cho những nhắc học ngắn.',
  },
  {
    key: 'focus',
    label: 'Focus',
    description: 'Chuông trầm hơn, ít gắt, hợp cho nhịp học buổi sớm.',
  },
  {
    key: 'vibrate',
    label: 'Chỉ rung',
    description: 'Không phát âm, vẫn rung khi thiết bị hỗ trợ.',
  },
  {
    key: 'silent',
    label: 'Im lặng',
    description: 'Chỉ hiện thông báo, không âm báo.',
  },
];

export const getAlarmSoundOption = (soundKey?: string | null) =>
  alarmSoundOptions.find((option) => option.key === soundKey) || alarmSoundOptions[0];
