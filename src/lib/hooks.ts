import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  authApi,
  alarmApi,
  deckApi,
  topicApi,
  wordApi,
  learningApi,
  progressApi,
  profileApi,
} from '../lib/api';
import {
  DEFAULT_PROFILE,
  profileFromUser,
  useAppStore,
  type SavedDeckScope,
  type User,
  type UserProfile,
} from '../stores/appStore';
import {
  cancelAllAlarmNotifications,
  cancelAlarmNotifications,
  scheduleAlarmNotifications,
  syncAlarmNotifications,
} from './notifications';
import { getNextAlarmOccurrence } from './alarmSchedule';

export interface Alarm {
  id: string;
  title: string;
  time: string;
  repeatDays: string[];
  isActive: boolean;
  snoozeMinutes?: number;
  dismissMode?: 'quick' | 'standard' | 'challenge';
  soundKey?: 'classic' | 'bright' | 'focus' | 'vibrate' | 'silent';
  deckId: string | null;
  deckName: string;
  lessonDeckIds?: string[];
  lessonDeckNames?: string[];
  lessonDecks?: Deck[];
}

export interface Word {
  id: string;
  word: string;
  meaning: string;
  ipa?: string;
  example?: string;
  exampleVi?: string;
  lessonId?: string | null;
  lessonName?: string | null;
  topic?: string;
  topicSlug?: string | null;
  status: 'new' | 'learning' | 'review' | 'mastered' | 'lapsed';
  isFavorite: boolean;
  masteryScore: number;
  lastDifficulty?: 1 | 2 | 3;
}

export interface Topic {
  id: string;
  name: string;
  slug?: string;
  wordCount: number;
  masteredCount?: number;
  progress: number;
  isActive?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  deckKind?: 'course' | 'lesson';
  parentDeckId?: string | null;
  lessonOrder?: number;
  lessonCount?: number;
  lessons?: Deck[];
  goalTag?: 'communication' | 'toeic' | 'both';
  levelTag?: 'beginner' | 'elementary' | 'intermediate';
  topic?: string | null;
  wordCount: number;
  learnedCount?: number;
  masteredCount?: number;
  newCount?: number;
  dueCount?: number;
  progress?: number;
  progressPercent?: number;
  completedWordCount?: number;
  hasInProgress?: boolean;
  lastStudiedAt?: string | null;
  isCompleted?: boolean;
  isActive?: boolean;
  status?: 'completed' | 'active' | 'pending';
}

export interface Session {
  id: string;
  type: string;
  totalQuestions: number;
  totalWords: number;
  correctAnswers: number;
  score: number;
  startedAt?: string;
  endedAt?: string;
}

export interface UnfinishedLearningSession {
  sessionId: string;
  deckId?: string | null;
  deckName?: string | null;
  lessonDeckIds?: string[];
  lessonNames?: string[];
  phase: 'idle' | 'flashcard' | 'quiz' | 'complete';
  flashcardIndex: number;
  quizIndex: number;
  remainingCount: number;
  startedAt?: string | null;
  lastActiveAt?: string | null;
}

export type { UserProfile };

export interface Trophy {
  id: string;
  code: string;
  title: string;
  description: string;
  milestoneType: 'session_count' | 'streak_days' | 'words_learned' | 'words_mastered';
  milestoneValue: number;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export interface WeeklyActivity {
  date: string;
  day: string;
  sessions: number;
  words: number;
  completed: boolean;
}

export interface ProgressSnapshot {
  streak: {
    current: number;
    longest: number;
    lastCompletedDate: string | null;
  };
  newWordsToday: number;
  reviewWordsToday: number;
  totalLearnedWords: number;
  totalMasteredWords: number;
  accuracyRate: number;
  favoriteCount: number;
  weeklyActivity: WeeklyActivity[];
  recentSessions: Session[];
}

export interface ScopeSummary {
  deckId: string | null;
  deckName: string | null;
  selectedLessonCount: number;
  totalWordsInScope: number;
  masteredWordsInScope: number;
  favoriteWordsInScope: number;
  learningWordsInScope: number;
  reviewWordsInScope: number;
  newWordsAvailableInScope: number;
  newWordsTodayInScope: number;
}

const getNextActiveAlarm = (alarms: Alarm[]) => {
  const activeAlarms = alarms
    .filter((alarm) => alarm.isActive)
    .map((alarm) => ({
      alarm,
      nextOccurrence: getNextAlarmOccurrence(alarm),
    }))
    .filter((entry) => entry.nextOccurrence);

  if (activeAlarms.length === 0) {
    return null;
  }

  activeAlarms.sort(
    (left, right) =>
      (left.nextOccurrence?.getTime() || Number.MAX_SAFE_INTEGER) -
      (right.nextOccurrence?.getTime() || Number.MAX_SAFE_INTEGER)
  );

  return activeAlarms[0]?.alarm || null;
};

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

const logNotificationWarning = (action: string, err: unknown) => {
  console.warn(`Alarm notification ${action} failed: ${getErrorMessage(err)}`);
};

const getProfileOwnerKey = (user: User | null) => user?.id || 'anonymous';

const arraysEqual = (left: string[] = [], right: string[] = []) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const savedScopesEqual = (left: SavedDeckScope[] = [], right: SavedDeckScope[] = []) =>
  left.length === right.length &&
  left.every((entry, index) =>
    entry.deckId === right[index]?.deckId &&
    arraysEqual(entry.lessonDeckIds, right[index]?.lessonDeckIds || [])
  );

const profilesEqual = (left: UserProfile, right: UserProfile) =>
  left.fullName === right.fullName &&
  left.onboardingCompleted === right.onboardingCompleted &&
  left.dailyWordLimit === right.dailyWordLimit &&
  left.reviewDailyLimit === right.reviewDailyLimit &&
  left.newDailyLimit === right.newDailyLimit &&
  left.sessionLength === right.sessionLength &&
  left.preferredAccent === right.preferredAccent &&
  left.activeDeckId === right.activeDeckId &&
  left.activeDeckIndex === right.activeDeckIndex &&
  arraysEqual(left.activeLessonDeckIds, right.activeLessonDeckIds) &&
  savedScopesEqual(left.savedDeckScopes, right.savedDeckScopes) &&
  left.notificationsEnabled === right.notificationsEnabled &&
  left.soundEnabled === right.soundEnabled &&
  left.vibrationEnabled === right.vibrationEnabled &&
  left.alarmNotifications === right.alarmNotifications &&
  left.reminderNotifications === right.reminderNotifications &&
  left.streakNotifications === right.streakNotifications &&
  left.weeklyReport === right.weeklyReport &&
  left.quietHoursEnabled === right.quietHoursEnabled &&
  left.quietHoursStart === right.quietHoursStart &&
  left.quietHoursEnd === right.quietHoursEnd &&
  left.reminderTime === right.reminderTime &&
  left.darkMode === right.darkMode;

let inFlightProfileRequest: Promise<UserProfile> | null = null;
let inFlightProfileOwnerKey: string | null = null;

export function useAlarms() {
  const token = useAppStore((state) => state.token);
  const setNextAlarm = useAppStore((state) => state.setNextAlarm);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlarms = useCallback(async () => {
    if (!token) {
      setAlarms([]);
      cancelAllAlarmNotifications().catch((err) => logNotificationWarning('cancel all', err));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await alarmApi.getAll();
      const nextAlarms = response.data.alarms as Alarm[];
      setAlarms(nextAlarms);
      syncAlarmNotifications(nextAlarms).catch((err) => logNotificationWarning('sync', err));
    } catch (err: any) {
      setError(err.message);
      setAlarms([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  useEffect(() => {
    setNextAlarm(getNextActiveAlarm(alarms));
  }, [alarms, setNextAlarm]);

  const createAlarm = async (data: Partial<Alarm>) => {
    try {
      const response = await alarmApi.create(data);
      const nextAlarm = response.data.alarm as Alarm;
      setAlarms((current) => {
        return [...current, nextAlarm].sort((a, b) => a.time.localeCompare(b.time));
      });
      await scheduleAlarmNotifications(nextAlarm).catch((err) =>
        logNotificationWarning('schedule', err)
      );
      return nextAlarm;
    } catch (err) {
      console.error('Create alarm error:', err);
      throw err;
    }
  };

  const updateAlarm = async (id: string, data: Partial<Alarm>) => {
    try {
      const response = await alarmApi.update(id, data);
      const updatedAlarm = response.data.alarm as Alarm;
      setAlarms((current) => {
        return current
          .map((alarm) => (alarm.id === id ? updatedAlarm : alarm))
          .sort((a, b) => a.time.localeCompare(b.time));
      });
      await scheduleAlarmNotifications(updatedAlarm).catch((err) =>
        logNotificationWarning('reschedule', err)
      );
      return updatedAlarm;
    } catch (err) {
      console.error('Update alarm error:', err);
      throw err;
    }
  };

  const toggleAlarm = async (id: string, isActive: boolean) => updateAlarm(id, { isActive });

  const deleteAlarm = async (id: string) => {
    try {
      await alarmApi.delete(id);
      setAlarms((current) => current.filter((alarm) => alarm.id !== id));
      await cancelAlarmNotifications(id).catch((err) => logNotificationWarning('cancel', err));
    } catch (err) {
      console.error('Delete alarm error:', err);
      throw err;
    }
  };

  return { alarms, loading, error, fetchAlarms, createAlarm, updateAlarm, toggleAlarm, deleteAlarm };
}

export function useWords(params?: {
  search?: string;
  limit?: number;
  deckId?: string | null;
  lessonDeckIds?: string[];
  enabled?: boolean;
}) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lessonDeckIdsKey = (params?.lessonDeckIds || []).join(',');

  const fetchWords = useCallback(async () => {
    if (params?.enabled === false) {
      setWords([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await wordApi.getAll({
        search: params?.search,
        limit: params?.limit || 100,
        deckId: params?.deckId || undefined,
        lessonDeckIds: lessonDeckIdsKey || undefined,
      });
      setWords(response.data.words as Word[]);
    } catch (err: any) {
      setError(err.message);
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [params?.deckId, params?.enabled, params?.limit, params?.search, lessonDeckIdsKey]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  return { words, loading, error, fetchWords };
}

export function useScopeSummary(params?: {
  deckId?: string | null;
  lessonDeckIds?: string[];
  enabled?: boolean;
  newDailyLimit?: number;
}) {
  const [summary, setSummary] = useState<ScopeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lessonDeckIdsKey = (params?.lessonDeckIds || []).join(',');

  const fetchSummary = useCallback(async () => {
    if (params?.enabled === false) {
      setSummary(null);
      setLoading(false);
      setError(null);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await wordApi.getScopeSummary({
        deckId: params?.deckId || undefined,
        lessonDeckIds: lessonDeckIdsKey || undefined,
        newDailyLimit: params?.newDailyLimit || undefined,
      });
      const nextSummary = response.data.summary as ScopeSummary;
      setSummary(nextSummary);
      return nextSummary;
    } catch (err: any) {
      setError(err.message);
      setSummary(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lessonDeckIdsKey, params?.deckId, params?.enabled, params?.newDailyLimit]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await topicApi.getAll();
      setTopics(response.data.topics as Topic[]);
    } catch (err) {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return { topics, loading, fetchTopics };
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await deckApi.getAll();
      setDecks(response.data.decks as Deck[]);
    } catch (err: any) {
      setError(err.message);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return { decks, loading, error, refetch: fetchDecks };
}

export function useProgress() {
  const profile = useAppStore((state) => state.profile);
  const streak = useAppStore((state) => state.streak);
  const newWordsToday = useAppStore((state) => state.newWordsToday);
  const reviewWordsToday = useAppStore((state) => state.reviewWordsToday);
  const totalLearnedWords = useAppStore((state) => state.totalLearnedWords);
  const totalMasteredWords = useAppStore((state) => state.totalMasteredWords);
  const setStreak = useAppStore((state) => state.setStreak);
  const setProgress = useAppStore((state) => state.setProgress);
  const token = useAppStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  const fetchProgress = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setAccuracyRate(0);
      setFavoriteCount(0);
      setWeeklyActivity([]);
      setRecentSessions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await progressApi.getDashboard();
      setStreak({
        current: response.data.streak.current,
        longest: response.data.streak.longest,
        lastCompletedDate: response.data.streak.lastCompletedDate || '',
      });
      setProgress({
        newWordsToday: response.data.newWordsToday,
        reviewWordsToday: response.data.reviewWordsToday,
        totalLearnedWords: response.data.totalLearnedWords,
        totalMasteredWords: response.data.totalMasteredWords,
      });
      setAccuracyRate(response.data.accuracyRate || 0);
      setFavoriteCount(response.data.favoriteCount || 0);
      setWeeklyActivity(response.data.weeklyActivity || []);
      setRecentSessions(
        (response.data.recentSessions || []).map((session: any) => ({
          id: session.id,
          type: session.sessionType,
          totalQuestions: session.totalQuestions,
          totalWords: session.totalWords,
          correctAnswers: session.correctAnswers,
          score: session.correctAnswers,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        }))
      );
    } catch (err) {
      console.warn(`Progress unavailable: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [
    profile?.activeDeckId,
    profile?.activeLessonDeckIds?.join(','),
    profile?.newDailyLimit,
    setProgress,
    setStreak,
    token,
  ]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { 
    streak, 
    totalLearnedWords, 
    totalMasteredWords, 
    newWordsToday, 
    reviewWordsToday,
    accuracyRate,
    favoriteCount,
    weeklyActivity,
    recentSessions,
    refetch: fetchProgress,
    loading 
  };
}

export function useLearning() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  const startSession = async (type: string) => {
    try {
      setLoading(true);
      const [sessionResponse, wordsResponse] = await Promise.all([
        learningApi.start({ sessionType: type }),
        learningApi.getToday()
      ]);
      setSession({
        id: sessionResponse.data.session._id || sessionResponse.data.session.id,
        type,
        totalQuestions:
          (wordsResponse.data.summary?.scheduledReviewCount || 0) +
          (wordsResponse.data.summary?.newCount || 0),
        totalWords:
          (wordsResponse.data.summary?.scheduledReviewCount || 0) +
          (wordsResponse.data.summary?.newCount || 0),
        correctAnswers: 0,
        score: 0,
      });
    } catch (err) {
      console.error('Start session error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: any) => {
    try {
      await learningApi.submitQuiz(answer);
    } catch (err) {
      console.error('Submit answer error:', err);
    }
  };

  return { session, loading, startSession, submitAnswer };
}

export function useUnfinishedLearningSession() {
  const token = useAppStore((state) => state.token);
  const [session, setSession] = useState<UnfinishedLearningSession | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  const fetchUnfinishedSession = useCallback(async () => {
    if (!token) {
      setSession(null);
      setError(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await learningApi.getUnfinished();
      const nextSession = response.data.session
        ? ({
            sessionId: response.data.session.sessionId,
            deckId: response.data.session.deckId || null,
            deckName: response.data.session.deckName || null,
            lessonDeckIds: response.data.session.lessonDeckIds || [],
            lessonNames: response.data.session.lessonNames || [],
            phase: response.data.session.phase || 'flashcard',
            flashcardIndex: response.data.session.flashcardIndex || 0,
            quizIndex: response.data.session.quizIndex || 0,
            remainingCount: response.data.session.remainingCount || 0,
            startedAt: response.data.session.startedAt || null,
            lastActiveAt: response.data.session.lastActiveAt || null,
          } as UnfinishedLearningSession)
        : null;
      setSession(nextSession);
      return nextSession;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUnfinishedSession();
  }, [fetchUnfinishedSession]);

  return {
    session,
    loading,
    error,
    refetch: fetchUnfinishedSession,
    clear: () => setSession(null),
  };
}

export function useProfile() {
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const cachedProfile = useAppStore((state) => state.profile);
  const profileOwnerKey = useAppStore((state) => state.profileOwnerKey);
  const profileLoaded = useAppStore((state) => state.profileLoaded);
  const profileLoading = useAppStore((state) => state.profileLoading);
  const setProfileCache = useAppStore((state) => state.setProfileCache);
  const setProfileLoading = useAppStore((state) => state.setProfileLoading);
  const [error, setError] = useState<string | null>(null);
  const ownerKey = getProfileOwnerKey(user);
  const fallbackProfile = useMemo(() => profileFromUser(user), [user]);
  const hasCachedProfile = profileOwnerKey === ownerKey && Boolean(cachedProfile);
  const profile = hasCachedProfile ? (cachedProfile as UserProfile) : fallbackProfile;
  const loading = Boolean(token && !hasCachedProfile && (!profileLoaded || profileLoading));

  const syncProfileToUser = useCallback((nextProfile: UserProfile) => {
    const currentUser = useAppStore.getState().user;

    if (!currentUser) {
      return;
    }

    if (profilesEqual(profileFromUser(currentUser), nextProfile)) {
      return;
    }

    setUser({
      ...currentUser,
      fullName: nextProfile.fullName,
      onboardingCompleted: nextProfile.onboardingCompleted,
      dailyWordLimit: nextProfile.dailyWordLimit,
      reviewDailyLimit: nextProfile.reviewDailyLimit,
      newDailyLimit: nextProfile.newDailyLimit,
      sessionLength: nextProfile.sessionLength,
      preferredAccent: nextProfile.preferredAccent,
      activeDeckId: nextProfile.activeDeckId,
      activeDeckIndex: nextProfile.activeDeckIndex,
      activeLessonDeckIds: nextProfile.activeLessonDeckIds,
      savedDeckScopes: nextProfile.savedDeckScopes,
      notificationsEnabled: nextProfile.notificationsEnabled,
      soundEnabled: nextProfile.soundEnabled,
      vibrationEnabled: nextProfile.vibrationEnabled,
      alarmNotifications: nextProfile.alarmNotifications,
      reminderNotifications: nextProfile.reminderNotifications,
      streakNotifications: nextProfile.streakNotifications,
      weeklyReport: nextProfile.weeklyReport,
      quietHoursEnabled: nextProfile.quietHoursEnabled,
      quietHoursStart: nextProfile.quietHoursStart,
      quietHoursEnd: nextProfile.quietHoursEnd,
      reminderTime: nextProfile.reminderTime,
      darkMode: nextProfile.darkMode,
    });
  }, [setUser]);

  const fetchProfile = useCallback(async (force = false) => {
    if (!token) {
      setProfileCache(fallbackProfile, ownerKey, true);
      setError(null);
      return fallbackProfile;
    }

    if (!force && hasCachedProfile && profileLoaded && cachedProfile) {
      return cachedProfile;
    }

    if (inFlightProfileRequest && inFlightProfileOwnerKey === ownerKey) {
      try {
        const nextProfile = await inFlightProfileRequest;
        setProfileCache(nextProfile, ownerKey, true);
        syncProfileToUser(nextProfile);
        return nextProfile;
      } catch (err: any) {
        setError(err.message);
        setProfileLoading(false);
        return profile;
      }
    }

    const request = profileApi.get().then((response) => {
      return {
        ...DEFAULT_PROFILE,
        ...(response.data.profile || {}),
      } as UserProfile;
    });

    inFlightProfileRequest = request;
    inFlightProfileOwnerKey = ownerKey;

    try {
      setProfileLoading(true);
      setError(null);
      const nextProfile = await request;
      setProfileCache(nextProfile, ownerKey, true);
      syncProfileToUser(nextProfile);
      return nextProfile;
    } catch (err: any) {
      setError(err.message);
      setProfileLoading(false);
      return profile;
    } finally {
      if (inFlightProfileRequest === request) {
        inFlightProfileRequest = null;
        inFlightProfileOwnerKey = null;
      }
    }
  }, [
    cachedProfile,
    fallbackProfile,
    hasCachedProfile,
    ownerKey,
    profile,
    profileLoaded,
    setProfileCache,
    setProfileLoading,
    syncProfileToUser,
    token,
  ]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!token) {
      const nextProfile = {
        ...profile,
        ...data,
      } as UserProfile;
      setProfileCache(nextProfile, ownerKey, true);
      syncProfileToUser(nextProfile);
      return nextProfile;
    }

    const response = await profileApi.update(data);
    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...(response.data.profile || {}),
    } as UserProfile;
    setProfileCache(nextProfile, ownerKey, true);
    syncProfileToUser(nextProfile);

    return nextProfile;
  };

  const setActiveLearningScope = async (deckId: string, lessonDeckIds: string[]) => {
    const nextLessonDeckIds = [...new Set(lessonDeckIds.filter(Boolean))];

    if (!token) {
      const nextSavedScopes = [
        ...(profile.savedDeckScopes || []).filter((entry) => entry.deckId !== deckId),
        { deckId, lessonDeckIds: nextLessonDeckIds },
      ];
      const nextProfile = {
        ...profile,
        activeDeckId: deckId,
        activeLessonDeckIds: nextLessonDeckIds,
        savedDeckScopes: nextSavedScopes,
      } as UserProfile;
      setProfileCache(nextProfile, ownerKey, true);
      syncProfileToUser(nextProfile);
      return nextProfile;
    }

    const response = await profileApi.setActiveLearningScope({ deckId, lessonDeckIds: nextLessonDeckIds });
    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...(response.data.profile || {}),
    } as UserProfile;
    setProfileCache(nextProfile, ownerKey, true);
    syncProfileToUser(nextProfile);
    return nextProfile;
  };

  return { profile, loading, error, refetch: fetchProfile, updateProfile, setActiveLearningScope };
}

export function useTrophies() {
  const token = useAppStore((state) => state.token);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  const fetchTrophies = useCallback(async () => {
    if (!token) {
      setTrophies([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await progressApi.getTrophies();
      setTrophies(
        (response.data.trophies || []).map((trophy: any) => ({
          id: trophy._id || trophy.id,
          code: trophy.code,
          title: trophy.title,
          description: trophy.description,
          milestoneType: trophy.milestoneType,
          milestoneValue: trophy.milestoneValue,
          unlocked: trophy.unlocked,
          unlockedAt: trophy.unlockedAt || null,
        }))
      );
    } catch (err) {
      const message = getErrorMessage(err);
      console.warn(`Trophy request unavailable: ${message}`);
      setTrophies([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTrophies();
  }, [fetchTrophies]);

  return { trophies, loading, error, refetch: fetchTrophies };
}

export function useAuth() {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const setAuthenticatedSession = useAppStore((state) => state.setAuthenticatedSession);
  const continueAsGuestInStore = useAppStore((state) => state.continueAsGuest);
  const setUser = useAppStore((state) => state.setUser);
  const logout = useAppStore((state) => state.logout);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login(email, password);
      setAuthenticatedSession(response.data.user, response.data.token);
      return response.data.user;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    extras?: {
      profile?: Partial<UserProfile>;
      alarm?: {
        title: string;
        time: string;
        repeatDays: string[];
        isActive?: boolean;
      };
    }
  ) => {
    try {
      setLoading(true);
      const response = await authApi.register(email, password, fullName);
      setAuthenticatedSession(response.data.user, response.data.token);

      if (extras?.profile) {
        const profileResponse = await profileApi.update(extras.profile);
        setUser({
          ...response.data.user,
          ...(profileResponse.data.profile || {}),
          id: response.data.user.id,
          email: response.data.user.email,
        });
      }

      if (extras?.alarm) {
        await alarmApi.create({
          ...extras.alarm,
          isActive: extras.alarm.isActive ?? true,
        });
      }
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      await authApi.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = (overrides?: {
    fullName?: string;
    dailyWordLimit?: number;
    sessionLength?: UserProfile['sessionLength'];
  }) => {
    continueAsGuestInStore({
      ...overrides,
      fullName: overrides?.fullName || 'Khách',
    });
  };

  const refreshMe = async () => {
    if (!useAppStore.getState().token) {
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.getMe();
      setUser(response.data.user);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isGuest,
    login,
    register,
    forgotPassword,
    continueAsGuest,
    refreshMe,
    logout,
    loading,
  };
}
