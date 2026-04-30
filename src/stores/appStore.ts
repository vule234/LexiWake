import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface SavedDeckScope {
  deckId: string;
  lessonDeckIds: string[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  onboardingCompleted: boolean;
  dailyWordLimit: number;
  reviewDailyLimit?: number;
  newDailyLimit?: number;
  sessionLength?: 'quick' | 'standard' | 'deep';
  preferredAccent: 'us' | 'uk';
  activeDeckId?: string | null;
  activeDeckIndex?: number;
  activeLessonDeckIds?: string[];
  savedDeckScopes?: SavedDeckScope[];
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  alarmNotifications?: boolean;
  reminderNotifications?: boolean;
  streakNotifications?: boolean;
  weeklyReport?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  reminderTime?: string;
  darkMode?: boolean;
}

export interface UserProfile {
  fullName: string;
  onboardingCompleted: boolean;
  dailyWordLimit: number;
  reviewDailyLimit: number;
  newDailyLimit: number;
  sessionLength: 'quick' | 'standard' | 'deep';
  preferredAccent: 'us' | 'uk';
  activeDeckId: string | null;
  activeDeckIndex: number;
  activeLessonDeckIds: string[];
  savedDeckScopes: SavedDeckScope[];
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  alarmNotifications: boolean;
  reminderNotifications: boolean;
  streakNotifications: boolean;
  weeklyReport: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderTime: string;
  darkMode: boolean;
}

export interface Alarm {
  id: string;
  title: string;
  time: string;
  repeatDays: string[];
  isActive: boolean;
  soundKey?: 'classic' | 'bright' | 'focus' | 'vibrate' | 'silent';
  deckId: string | null;
  deckName: string;
  lessonDeckIds?: string[];
  lessonDeckNames?: string[];
}

export interface Word {
  id: string;
  word: string;
  meaning: string;
  ipa?: string;
  example?: string;
  audioUrl?: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface Streak {
  current: number;
  longest: number;
  lastCompletedDate: string;
}

interface AppState {
  hasHydrated: boolean;
  authMode: 'anonymous' | 'guest' | 'authenticated';
  isGuest: boolean;

  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Profile cache
  profile: UserProfile | null;
  profileOwnerKey: string | null;
  profileLoaded: boolean;
  profileLoading: boolean;
  
  // Progress
  streak: Streak;
  newWordsToday: number;
  reviewWordsToday: number;
  totalLearnedWords: number;
  totalMasteredWords: number;
  
  // Next alarm
  nextAlarm: Alarm | null;
  
  // Actions
  setHasHydrated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticatedSession: (user: User, token: string) => void;
  continueAsGuest: (overrides?: Partial<User>) => void;
  logout: () => void;
  setProfileCache: (profile: UserProfile | null, ownerKey: string | null, loaded?: boolean) => void;
  setProfileLoading: (value: boolean) => void;
  setStreak: (streak: Streak) => void;
  setNextAlarm: (alarm: Alarm | null) => void;
  setProgress: (data: {
    newWordsToday: number;
    reviewWordsToday: number;
    totalLearnedWords: number;
    totalMasteredWords: number;
  }) => void;
}

export const DEFAULT_PROFILE: UserProfile = {
  fullName: '',
  onboardingCompleted: false,
  dailyWordLimit: 5,
  reviewDailyLimit: 5,
  newDailyLimit: 5,
  sessionLength: 'quick',
  preferredAccent: 'us',
  activeDeckId: null,
  activeDeckIndex: 0,
  activeLessonDeckIds: [],
  savedDeckScopes: [],
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  alarmNotifications: true,
  reminderNotifications: true,
  streakNotifications: true,
  weeklyReport: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  reminderTime: '08:00',
  darkMode: false,
};

export const profileFromUser = (user: User | null): UserProfile => {
  if (!user) {
    return DEFAULT_PROFILE;
  }

  return {
    ...DEFAULT_PROFILE,
    fullName: user.fullName || DEFAULT_PROFILE.fullName,
    onboardingCompleted: user.onboardingCompleted ?? DEFAULT_PROFILE.onboardingCompleted,
    dailyWordLimit: user.dailyWordLimit || DEFAULT_PROFILE.dailyWordLimit,
    reviewDailyLimit: user.reviewDailyLimit || DEFAULT_PROFILE.reviewDailyLimit,
    newDailyLimit: user.newDailyLimit || user.dailyWordLimit || DEFAULT_PROFILE.newDailyLimit,
    sessionLength: user.sessionLength || DEFAULT_PROFILE.sessionLength,
    preferredAccent: user.preferredAccent || DEFAULT_PROFILE.preferredAccent,
    activeDeckId: user.activeDeckId ?? DEFAULT_PROFILE.activeDeckId,
    activeDeckIndex: user.activeDeckIndex ?? DEFAULT_PROFILE.activeDeckIndex,
    activeLessonDeckIds: user.activeLessonDeckIds || DEFAULT_PROFILE.activeLessonDeckIds,
    savedDeckScopes: user.savedDeckScopes || DEFAULT_PROFILE.savedDeckScopes,
    notificationsEnabled: user.notificationsEnabled ?? DEFAULT_PROFILE.notificationsEnabled,
    soundEnabled: user.soundEnabled ?? DEFAULT_PROFILE.soundEnabled,
    vibrationEnabled: user.vibrationEnabled ?? DEFAULT_PROFILE.vibrationEnabled,
    alarmNotifications: user.alarmNotifications ?? DEFAULT_PROFILE.alarmNotifications,
    reminderNotifications: user.reminderNotifications ?? DEFAULT_PROFILE.reminderNotifications,
    streakNotifications: user.streakNotifications ?? DEFAULT_PROFILE.streakNotifications,
    weeklyReport: user.weeklyReport ?? DEFAULT_PROFILE.weeklyReport,
    quietHoursEnabled: user.quietHoursEnabled ?? DEFAULT_PROFILE.quietHoursEnabled,
    quietHoursStart: user.quietHoursStart || DEFAULT_PROFILE.quietHoursStart,
    quietHoursEnd: user.quietHoursEnd || DEFAULT_PROFILE.quietHoursEnd,
    reminderTime: user.reminderTime || DEFAULT_PROFILE.reminderTime,
    darkMode: user.darkMode ?? DEFAULT_PROFILE.darkMode,
  };
};

const guestUser: User = {
  id: 'guest',
  email: 'guest@lexiwake.local',
  fullName: 'Khách',
  onboardingCompleted: true,
  dailyWordLimit: 5,
  reviewDailyLimit: 5,
  newDailyLimit: 5,
  sessionLength: 'quick',
  preferredAccent: 'us',
  activeDeckId: null,
  activeDeckIndex: 0,
  activeLessonDeckIds: [],
  savedDeckScopes: [],
  notificationsEnabled: false,
  soundEnabled: true,
  vibrationEnabled: true,
  alarmNotifications: false,
  reminderNotifications: false,
  streakNotifications: false,
  weeklyReport: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  reminderTime: '08:00',
  darkMode: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      hasHydrated: false,
      authMode: 'anonymous',
      isGuest: false,
      user: null,
      token: null,
      isAuthenticated: false,
      profile: null,
      profileOwnerKey: null,
      profileLoaded: false,
      profileLoading: false,
      streak: { current: 0, longest: 0, lastCompletedDate: '' },
      newWordsToday: 0,
      reviewWordsToday: 0,
      totalLearnedWords: 0,
      totalMasteredWords: 0,
      nextAlarm: null,
      
      // Actions
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setUser: (user) =>
        set((state) => {
          const authMode =
            !user
              ? 'anonymous'
              : state.authMode === 'guest' || user.id === 'guest'
                ? 'guest'
                : state.token
                  ? 'authenticated'
                  : 'authenticated';

          return {
            user,
            isAuthenticated: !!user,
            authMode,
            isGuest: authMode === 'guest',
            profile: !user
              ? null
              : state.profileOwnerKey === user.id && state.profile
                ? state.profile
                : profileFromUser(user),
            profileOwnerKey: user ? user.id : null,
            profileLoaded: !user
              ? false
              : state.profileOwnerKey === user.id && state.profile
                ? state.profileLoaded
                : false,
            profileLoading: !user ? false : state.profileLoading,
          };
        }),
      setToken: (token) =>
        set((state) => {
          const authMode = token
            ? 'authenticated'
            : state.user
              ? state.user.id === 'guest' || state.authMode === 'guest'
                ? 'guest'
                : 'authenticated'
              : 'anonymous';

          return {
            token,
            authMode,
            isGuest: authMode === 'guest',
            isAuthenticated: !!state.user,
          };
        }),
      setAuthenticatedSession: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          authMode: 'authenticated',
          isGuest: false,
          profile: profileFromUser(user),
          profileOwnerKey: user.id,
          profileLoaded: false,
          profileLoading: false,
        }),
      continueAsGuest: (overrides) =>
        set(() => {
          const user = {
            ...guestUser,
            ...overrides,
            id: 'guest',
            email: overrides?.email || guestUser.email,
          };

          return {
            user,
            token: null,
            isAuthenticated: true,
            authMode: 'guest',
            isGuest: true,
            profile: profileFromUser(user),
            profileOwnerKey: user.id,
            profileLoaded: true,
            profileLoading: false,
            nextAlarm: null,
          };
        }),
      logout: () => set({ 
        authMode: 'anonymous',
        isGuest: false,
        user: null, 
        token: null, 
        isAuthenticated: false,
        profile: null,
        profileOwnerKey: null,
        profileLoaded: false,
        profileLoading: false,
        streak: { current: 0, longest: 0, lastCompletedDate: '' },
        newWordsToday: 0,
        reviewWordsToday: 0,
        totalLearnedWords: 0,
        totalMasteredWords: 0,
        nextAlarm: null
      }),
      setProfileCache: (profile, ownerKey, loaded = true) =>
        set({
          profile,
          profileOwnerKey: ownerKey,
          profileLoaded: loaded,
          profileLoading: false,
        }),
      setProfileLoading: (value) => set({ profileLoading: value }),
      setStreak: (streak) => set({ streak }),
      setNextAlarm: (alarm) => set({ nextAlarm: alarm }),
      setProgress: (data) => set({
        newWordsToday: data.newWordsToday,
        reviewWordsToday: data.reviewWordsToday,
        totalLearnedWords: data.totalLearnedWords,
        totalMasteredWords: data.totalMasteredWords,
      }),
    }),
    {
      name: 'vocab-alarm-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.token) {
          state.setProfileCache(state.profile, state.profileOwnerKey, false);
        }
      },
    }
  )
);
