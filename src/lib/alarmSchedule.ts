import type { Alarm } from './hooks';

const DAY_TO_JS_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const DAY_LABEL: Record<number, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
};

const parseAlarmTime = (time: string) => {
  const [rawHour, rawMinute] = (time || '07:00').split(':').map(Number);
  const hour = Number.isFinite(rawHour) ? Math.min(Math.max(rawHour, 0), 23) : 7;
  const minute = Number.isFinite(rawMinute) ? Math.min(Math.max(rawMinute, 0), 59) : 0;
  return { hour, minute };
};

const withTime = (base: Date, hour: number, minute: number) => {
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  return next;
};

export function getNextAlarmOccurrence(alarm: Alarm, now = new Date()) {
  if (!alarm?.isActive) {
    return null;
  }

  const { hour, minute } = parseAlarmTime(alarm.time);
  const repeatDays = (alarm.repeatDays || []).filter((dayId) => dayId in DAY_TO_JS_INDEX);

  if (repeatDays.length === 0) {
    const candidate = withTime(now, hour, minute);
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  let bestCandidate: Date | null = null;

  repeatDays.forEach((dayId) => {
    const targetDay = DAY_TO_JS_INDEX[dayId];
    const candidate = withTime(now, hour, minute);
    const dayOffset = (targetDay - now.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + dayOffset);

    if (dayOffset === 0 && candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 7);
    }

    if (!bestCandidate || candidate.getTime() < bestCandidate.getTime()) {
      bestCandidate = candidate;
    }
  });

  return bestCandidate;
}

export function formatNextAlarmOccurrence(date: Date | null) {
  if (!date) {
    return 'Chưa có lịch reo kế tiếp';
  }

  const dayLabel = DAY_LABEL[date.getDay()] || '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${dayLabel} ${day}/${month} • ${hours}:${minutes}`;
}
