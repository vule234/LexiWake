import type { Deck } from './hooks';

export type LessonScopeState = 'idle' | 'selected' | 'in_progress' | 'completed';

export const getLessonProgressPercent = (lesson: Deck) =>
  lesson.progressPercent ?? lesson.progress ?? 0;

export const getLessonScopeState = (lesson: Deck, isSelected: boolean): LessonScopeState => {
  if (lesson.isCompleted) {
    return 'completed';
  }

  if (isSelected) {
    return 'selected';
  }

  if (lesson.hasInProgress || (lesson.learnedCount || 0) > 0) {
    return 'in_progress';
  }

  return 'idle';
};

export const getLibraryLessonActionLabel = (lesson: Deck, isSelected: boolean) => {
  const state = getLessonScopeState(lesson, isSelected);
  if (state === 'completed') {
    return 'Ôn lại';
  }
  if (state === 'selected' || state === 'in_progress') {
    return 'Đang học';
  }
  return 'Chọn học';
};

export const getAlarmLessonActionLabel = (lesson: Deck, isSelected: boolean) => {
  const state = getLessonScopeState(lesson, isSelected);
  if (state === 'completed') {
    return isSelected ? 'Đang ôn' : 'Ôn lại';
  }
  if (state === 'selected' || state === 'in_progress') {
    return 'Đang học';
  }
  return 'Chọn học';
};

export const getLessonProgressCopy = (lesson: Deck) => {
  const percent = getLessonProgressPercent(lesson);

  if (lesson.isCompleted) {
    return `Hoàn thành • ${percent}%`;
  }

  if (lesson.hasInProgress || (lesson.learnedCount || 0) > 0) {
    return `Đang học • ${percent}%`;
  }

  return `${percent}% hoàn thành`;
};
