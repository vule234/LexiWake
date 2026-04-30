import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { learningApi } from '../../lib/api';
import { useAppStore } from '../../stores/appStore';
import {
  type LearningPhase,
  type LearningSessionWord,
  useLearningSessionStore,
} from '../../stores/learningSessionStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow, kineticWarmGradient } from '../../theme/kinetic';

type TodayPayload = {
  words?: any[];
  reviewWords?: any[];
  newWords?: any[];
  activeDeck?: {
    id: string;
    name: string;
    wordCount?: number;
    masteredCount?: number;
    progress?: number;
    newCount?: number;
  } | null;
  summary?: {
    reviewCount?: number;
    scheduledReviewCount?: number;
    newCount?: number;
    newDailyLimit?: number;
    reviewDailyLimit?: number;
    activeDeckWordCount?: number;
    activeDeckMasteredCount?: number;
  };
};

type PreviewScope = {
  activeDeck: TodayPayload['activeDeck'];
};

type SessionDetailPayload = {
  id?: string;
  _id?: string;
  sessionType?: string;
  status?: 'active' | 'completed' | 'abandoned';
  phase?: LearningPhase;
  deckName?: string | null;
  scopeSnapshot?: {
    deckId?: string | null;
    lessonDeckIds?: string[];
    reviewMode?: ReviewMode;
    sessionType?: string;
  } | null;
  flashcardIndex?: number;
  quizIndex?: number;
  flashcardAnswers?: Record<string, { difficulty: 1 | 2 | 3; answeredAt: string }>;
  quizAnswers?: Record<string, { selectedAnswer: string; isCorrect: boolean; answeredAt: string }>;
  totalQuestions?: number;
  correctAnswers?: number;
  remainingCount?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  words?: any[];
};

type QuizMode = 'meaning_to_word' | 'word_to_meaning' | 'example' | 'fill_missing';
type ReviewMode = 'all' | 'urgent';

const DIFFICULTY_OPTIONS = [
  {
    value: 3 as const,
    label: 'Khó',
    hint: 'Ôn lại sớm',
    tone: '#fee2e2',
    accent: '#b91c1c',
  },
  {
    value: 2 as const,
    label: 'Vừa',
    hint: 'Tiếp tục luyện',
    tone: '#fef3c7',
    accent: '#92400e',
  },
  {
    value: 1 as const,
    label: 'Dễ',
    hint: 'Giãn lịch ôn',
    tone: '#dcfce7',
    accent: '#166534',
  },
];

const QUIZ_SEQUENCE: QuizMode[] = ['meaning_to_word', 'word_to_meaning', 'fill_missing', 'example'];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const REVIEW_MODE_LABELS: Record<ReviewMode, string> = {
  all: 'Ôn tất cả',
  urgent: 'Ôn ưu tiên',
};

const getErrorMessage = (error: any) =>
  error?.response?.data?.error || error?.message || 'Đã xảy ra lỗi. Thử lại sau.';

const getSingleParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
const normalizeReviewMode = (value?: string): ReviewMode =>
  value === 'urgent' ? value : 'all';

const shuffleArray = <T,>(items: T[]) => {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
};

const normalizeWord = (entry: any, source?: 'new' | 'review'): LearningSessionWord | null => {
  const word = entry?.wordId || entry;

  if (!word?._id && !word?.id) {
    return null;
  }

  return {
    id: word._id || word.id,
    word: word.word,
    meaning: word.meaning || word.meaningVi || '',
    ipa: word.ipa || '',
    example: word.example || word.exampleEn || '',
    exampleVi: word.exampleVi || '',
    audioUrl: word.audioUrl || '',
    deckId: entry.deckId || word.deckId || null,
    deckName: entry.deckName || word.deckName || null,
    source: source || entry.source || 'new',
    status: entry.status || word.status || 'new',
    masteryScore: entry.masteryScore || word.masteryScore || 0,
    lastDifficulty: entry.lastDifficulty ?? word.lastDifficulty ?? undefined,
    wrongCount: entry.wrongCount || word.wrongCount || 0,
    consecutiveCorrect: entry.consecutiveCorrect || word.consecutiveCorrect || 0,
    nextReviewAt: entry.nextReviewAt || word.nextReviewAt || null,
    overdueDays: entry.overdueDays || word.overdueDays || 0,
    overdueHours: entry.overdueHours || word.overdueHours || 0,
  };
};

const normalizeTodayWords = (payload: TodayPayload) => {
  if (Array.isArray(payload.words) && payload.words.length > 0) {
    return payload.words
      .map((word) => normalizeWord(word, word.source))
      .filter(Boolean) as LearningSessionWord[];
  }

  const reviewWords = (payload.reviewWords || [])
    .map((word) => normalizeWord(word, 'review'))
    .filter(Boolean) as LearningSessionWord[];
  const newWords = (payload.newWords || [])
    .map((word) => normalizeWord(word, 'new'))
    .filter(Boolean) as LearningSessionWord[];

  return [...reviewWords, ...newWords];
};

const normalizeSessionWords = (items: any[] = []) =>
  items
    .map((word) => normalizeWord(word, word?.source))
    .filter(Boolean) as LearningSessionWord[];

const formatMinutes = (dateString?: string | null) => {
  if (!dateString) {
    return 'Hôm nay';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Hôm nay';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getQuizMode = (word: LearningSessionWord, index: number): QuizMode => {
  const preferred = QUIZ_SEQUENCE[index % QUIZ_SEQUENCE.length];

  if (preferred === 'example' && !word.example && !word.exampleVi) {
    return index % 2 === 0 ? 'meaning_to_word' : 'word_to_meaning';
  }

  return preferred;
};

const getExampleOption = (word: LearningSessionWord) =>
  word.example || word.exampleVi || `${word.word} - ${word.meaning}`;

const isLetter = (character: string) => /[a-z]/i.test(character);

const buildFillMissingPrompt = (word: string) => {
  const characters = word.split('');
  const maskIndexes = new Set<number>();
  let tokenStart: number | null = null;

  const maskToken = (start: number, end: number) => {
    const length = end - start;

    if (length <= 0) {
      return;
    }

    if (length === 1) {
      maskIndexes.add(start);
      return;
    }

    if (length === 2) {
      maskIndexes.add(start + 1);
      return;
    }

    const interior = Array.from({ length: length - 2 }, (_, index) => start + 1 + index);
    const targetCount = Math.max(1, Math.ceil(interior.length / 2));

    interior
      .filter((_, index) => index % 2 === 0)
      .slice(0, targetCount)
      .forEach((index) => maskIndexes.add(index));
  };

  characters.forEach((character, index) => {
    if (isLetter(character)) {
      if (tokenStart === null) {
        tokenStart = index;
      }
      return;
    }

    if (tokenStart !== null) {
      maskToken(tokenStart, index);
      tokenStart = null;
    }
  });

  if (tokenStart !== null) {
    maskToken(tokenStart, characters.length);
  }

  const missingText = characters
    .filter((_, index) => maskIndexes.has(index))
    .join('');

  return {
    characters: characters.map((character, index) => ({
      value: character,
      hidden: maskIndexes.has(index),
    })),
    missingText,
  };
};

const normalizeAnswer = (value: string) => value.trim().toLowerCase();
const normalizeFillAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

export default function LearningSessionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    reviewMode?: string | string[];
    deckId?: string | string[];
    lessonDeckIds?: string | string[];
    alarmId?: string | string[];
    resumeSessionId?: string | string[];
    replaceUnfinished?: string | string[];
  }>();
  const token = useAppStore((state) => state.token);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const user = useAppStore((state) => state.user);
  const {
    sessionId,
    phase,
    words,
    flashcardIndex,
    quizIndex,
    totalQuestions,
    correctAnswers,
    hydrateSession,
    initializeSession,
    recordFlashcard,
    advanceFlashcard,
    recordQuiz,
    advanceQuiz,
    markComplete,
    setCompletionMeta,
    reset,
  } = useLearningSessionStore();
  const [previewWords, setPreviewWords] = useState<LearningSessionWord[]>([]);
  const [previewCounts, setPreviewCounts] = useState({ reviewCount: 0, newCount: 0 });
  const [previewReviewMode, setPreviewReviewMode] = useState<ReviewMode>('all');
  const [previewScope, setPreviewScope] = useState<PreviewScope>({
    activeDeck: null,
  });
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const [submittingFlashcard, setSubmittingFlashcard] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillMissingAnswer, setFillMissingAnswer] = useState('');
  const [submittedResult, setSubmittedResult] = useState<{
    selectedAnswer: string;
    isCorrect: boolean;
  } | null>(null);
  const [playingFlashcardAudio, setPlayingFlashcardAudio] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const audioRef = useRef<Audio.Sound | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quizSubmitLockRef = useRef(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const requestedReviewMode = normalizeReviewMode(getSingleParam(params.reviewMode));
  const hasReviewOverride = params.reviewMode !== undefined;
  const requestedDeckId = getSingleParam(params.deckId) || undefined;
  const requestedLessonDeckIdsKey = getSingleParam(params.lessonDeckIds) || '';
  const requestedLessonDeckIds = useMemo(
    () =>
      requestedLessonDeckIdsKey
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [requestedLessonDeckIdsKey]
  );
  const requestedAlarmId = getSingleParam(params.alarmId) || undefined;
  const requestedResumeSessionId = getSingleParam(params.resumeSessionId) || undefined;
  const shouldReplaceUnfinished = ['1', 'true', 'yes'].includes(
    (getSingleParam(params.replaceUnfinished) || '').toLowerCase()
  );

  const activeWords = sessionId ? words : previewWords;
  const currentFlashcard = words[flashcardIndex];
  const currentQuizWord = words[quizIndex];
  const currentQuizMode = currentQuizWord ? getQuizMode(currentQuizWord, quizIndex) : 'meaning_to_word';
  const effectivePreviewReviewMode = hasReviewOverride ? previewReviewMode : 'all';
  const frontRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const previewModeCopy = useMemo(() => {
    if (!hasReviewOverride) {
      return {
        identity: 'Daily Session',
        eyebrow: previewScope.activeDeck?.name ? 'Bộ từ đang học' : 'Lộ trình học',
        title:
          activeWords.length === 0
            ? 'Hôm nay đã xong phần từ đến hạn'
            : `${activeWords.length} từ đang chờ bạn`,
        subtitle: `${previewCounts.reviewCount} lượt ôn đã chọn, ${previewCounts.newCount} từ mới${
          previewScope.activeDeck?.name ? ` từ ${previewScope.activeDeck.name}` : ''
        } và 1 vòng quiz ngắn.`,
      };
    }

    if (effectivePreviewReviewMode === 'urgent') {
      return {
        identity: 'Review Session',
        eyebrow: 'Ưu tiên xử lý',
        title:
          activeWords.length === 0
            ? 'Không còn từ ưu tiên cần ôn'
            : `${previewCounts.reviewCount} từ quá hạn hoặc khó đang chờ`,
        subtitle: `${previewCounts.newCount} từ mới sẽ nối tiếp sau khi hoàn tất phần ôn ưu tiên.`,
      };
    }

    return {
      identity: 'Review Session',
      eyebrow: REVIEW_MODE_LABELS[effectivePreviewReviewMode],
      title:
        activeWords.length === 0
          ? 'Không còn từ cần ôn'
          : `${previewCounts.reviewCount} từ đến hạn đã được chọn`,
      subtitle: `${previewCounts.newCount} từ mới sẽ nối tiếp sau phần ôn lại.`,
    };
  }, [
    activeWords.length,
    effectivePreviewReviewMode,
    hasReviewOverride,
    previewCounts.newCount,
    previewCounts.reviewCount,
    previewScope.activeDeck?.name,
  ]);

  const fetchTodayWords = useCallback(async () => {
    if (!token || sessionId || requestedResumeSessionId) {
      setLoadingPreview(false);
      return [];
    }

    try {
      setLoadingPreview(true);
      setError(null);
      const response = await learningApi.getToday({
        reviewMode: requestedReviewMode,
        deckId: requestedDeckId,
        lessonDeckIds: requestedLessonDeckIdsKey,
      });
      const normalizedWords = normalizeTodayWords(response.data);
      setPreviewWords(normalizedWords);
      setPreviewCounts({
        reviewCount:
          response.data.summary?.scheduledReviewCount ||
          normalizedWords.filter((word) => word.source === 'review').length,
        newCount:
          response.data.summary?.newCount ||
          normalizedWords.filter((word) => word.source === 'new').length,
      });
      setPreviewReviewMode(normalizeReviewMode(response.data.summary?.reviewMode));
      setPreviewScope({
        activeDeck: response.data.activeDeck || null,
      });
      return normalizedWords;
    } catch (nextError: any) {
      setError(getErrorMessage(nextError));
      setPreviewWords([]);
      setPreviewCounts({ reviewCount: 0, newCount: 0 });
      setPreviewReviewMode(requestedReviewMode);
      setPreviewScope({ activeDeck: null });
      return [];
    } finally {
      setLoadingPreview(false);
    }
  }, [requestedDeckId, requestedLessonDeckIdsKey, requestedResumeSessionId, requestedReviewMode, sessionId, token]);

  const loadResumeSession = useCallback(
    async (resumeSessionId: string) => {
      if (!token || !resumeSessionId) {
        return;
      }

      try {
        setLoadingPreview(true);
        setError(null);
        const response = await learningApi.getSession(resumeSessionId);
        const nextSession = (response.data.session || {}) as SessionDetailPayload;
        const nextWords = normalizeSessionWords(nextSession.words || []);
        const nextSessionId = nextSession.id || nextSession._id || resumeSessionId;

        hydrateSession({
          sessionId: nextSessionId,
          resumeSessionId: nextSessionId,
          sessionType: nextSession.sessionType || 'daily_review',
          sessionStatus: nextSession.status || 'active',
          phase: nextSession.phase || (nextWords.length > 0 ? 'flashcard' : 'idle'),
          words: nextWords,
          flashcardIndex: nextSession.flashcardIndex || 0,
          quizIndex: nextSession.quizIndex || 0,
          flashcardAnswers: nextSession.flashcardAnswers || {},
          quizAnswers: nextSession.quizAnswers || {},
          totalQuestions: nextSession.totalQuestions || 0,
          correctAnswers: nextSession.correctAnswers || 0,
          activeDeckName: nextSession.deckName || null,
          scopeSnapshot: nextSession.scopeSnapshot
            ? {
                deckId: nextSession.scopeSnapshot.deckId || null,
                lessonDeckIds: nextSession.scopeSnapshot.lessonDeckIds || [],
                reviewMode: nextSession.scopeSnapshot.reviewMode || 'all',
                sessionType: nextSession.scopeSnapshot.sessionType || nextSession.sessionType || 'daily_review',
              }
            : null,
          remainingCount: nextSession.remainingCount ?? nextWords.length,
          startedAt: nextSession.startedAt || new Date().toISOString(),
          completedAt: nextSession.completedAt || null,
        });
      } catch (nextError: any) {
        setError(getErrorMessage(nextError));
      } finally {
        setLoadingPreview(false);
      }
    },
    [hydrateSession, token]
  );

  const persistSessionSnapshot = useCallback(async () => {
    const latestState = useLearningSessionStore.getState();

    if (!latestState.sessionId) {
      return;
    }

    await learningApi.updateSessionProgress(latestState.sessionId, {
      phase: latestState.phase,
      flashcardIndex: latestState.flashcardIndex,
      quizIndex: latestState.quizIndex,
      flashcardAnswers: latestState.flashcardAnswers,
      quizAnswers: latestState.quizAnswers,
      totalQuestions: latestState.totalQuestions,
      correctAnswers: latestState.correctAnswers,
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoadingPreview(false);
      setPreviewWords([]);
      setPreviewCounts({ reviewCount: 0, newCount: 0 });
      setPreviewReviewMode('all');
      setPreviewScope({ activeDeck: null });
      return;
    }

    if (requestedResumeSessionId) {
      if (sessionId !== requestedResumeSessionId) {
        loadResumeSession(requestedResumeSessionId);
      } else {
        setLoadingPreview(false);
      }
      return;
    }

    if (!sessionId) {
      fetchTodayWords();
    }
  }, [fetchTodayWords, isAuthenticated, loadResumeSession, requestedResumeSessionId, sessionId, token]);

  useEffect(() => {
    setShowAnswer(false);
    setIsFlipping(false);
    flipAnimation.stopAnimation();
    flipAnimation.setValue(0);
  }, [flashcardIndex, flipAnimation]);

  useEffect(() => {
    setSelectedOption(null);
    setFillMissingAnswer('');
    setSubmittedResult(null);
    quizSubmitLockRef.current = false;
  }, [quizIndex]);

  const overallProgress = useMemo(() => {
    if (words.length === 0) {
      return 0;
    }

    const totalSteps = words.length * 2;
    const completedSteps =
      phase === 'quiz'
        ? words.length + quizIndex
        : phase === 'complete'
          ? totalSteps
          : flashcardIndex;

    return Math.max(6, Math.round(((completedSteps + 1) / totalSteps) * 100));
  }, [flashcardIndex, phase, quizIndex, words.length]);

  const fillMissingPrompt = useMemo(
    () => buildFillMissingPrompt(currentQuizWord?.word || ''),
    [currentQuizWord?.word]
  );

  const quizOptions = useMemo(() => {
    if (!currentQuizWord) {
      return [];
    }

    const distractors = shuffleArray(words.filter((word) => word.id !== currentQuizWord.id));

    switch (currentQuizMode) {
      case 'word_to_meaning':
        return shuffleArray(
          Array.from(
            new Set([
              currentQuizWord.meaning,
              ...distractors.slice(0, 3).map((word) => word.meaning),
            ])
          )
        );
      case 'example':
        return shuffleArray(
          Array.from(
            new Set([
              getExampleOption(currentQuizWord),
              ...distractors
                .filter((word) => word.example || word.exampleVi)
                .slice(0, 3)
                .map((word) => getExampleOption(word)),
            ])
          )
        );
      case 'fill_missing':
        return [];
      case 'meaning_to_word':
      default:
        return shuffleArray(
          Array.from(
            new Set([
              currentQuizWord.word,
              ...distractors.slice(0, 3).map((word) => word.word),
            ])
          )
        );
    }
  }, [currentQuizMode, currentQuizWord, words]);

  const expectedQuizAnswer = useMemo(() => {
    if (!currentQuizWord) {
      return '';
    }

    switch (currentQuizMode) {
      case 'word_to_meaning':
        return currentQuizWord.meaning;
      case 'example':
        return getExampleOption(currentQuizWord);
      case 'fill_missing':
        return currentQuizWord.word;
      case 'meaning_to_word':
      default:
        return currentQuizWord.word;
    }
  }, [currentQuizMode, currentQuizWord]);

  const previewPills = useMemo(
    () =>
      activeWords.slice(0, 6).map((word) => ({
        id: word.id,
        label: word.word,
        accent: word.source === 'review' ? kineticPalette.tertiaryFixed : kineticPalette.primaryFixed,
      })),
    [activeWords]
  );

  const stopFlashcardAudio = useCallback(async () => {
    await Speech.stop();

    if (audioRef.current) {
      const activeAudio = audioRef.current;
      audioRef.current = null;

      try {
        await activeAudio.stopAsync();
      } catch {}

      try {
        await activeAudio.unloadAsync();
      } catch {}
    }

    setPlayingFlashcardAudio(false);
  }, []);

  const speakFallback = useCallback(
    async (text: string) =>
      new Promise<void>((resolve, reject) => {
        try {
          Speech.stop();
          Speech.speak(text, {
            language: user?.preferredAccent === 'uk' ? 'en-GB' : 'en-US',
            pitch: 1,
            rate: 0.95,
            onDone: () => resolve(),
            onStopped: () => resolve(),
            onError: (event) => reject(event),
          });
        } catch (nextError) {
          reject(nextError);
        }
      }),
    [user?.preferredAccent]
  );

  const handlePlayFlashcardAudio = useCallback(async () => {
    if (!currentFlashcard) {
      return;
    }

    if (playingFlashcardAudio) {
      await stopFlashcardAudio();
      return;
    }

    if (user?.soundEnabled === false) {
      setError('Âm thanh đang tắt trong cài đặt. Bật lại ở Alarm sound để nghe flashcard.');
      return;
    }

    try {
      setError(null);
      setPlayingFlashcardAudio(true);

      const remoteAudioUrl = currentFlashcard.audioUrl?.trim();

      if (remoteAudioUrl) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: remoteAudioUrl },
          { shouldPlay: true }
        );

        audioRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) {
            return;
          }

          if (status.didJustFinish) {
            if (audioRef.current === sound) {
              audioRef.current = null;
            }
            setPlayingFlashcardAudio(false);
            void sound.unloadAsync();
          }
        });
        return;
      }

      await speakFallback(currentFlashcard.word);
      setPlayingFlashcardAudio(false);
    } catch {
      try {
        await speakFallback(currentFlashcard.word);
        setPlayingFlashcardAudio(false);
      } catch {
        setError('Không thể phát audio cho từ này. Kiểm tra lại audioUrl hoặc thử lại sau.');
        await stopFlashcardAudio();
      }
    }
  }, [
    currentFlashcard,
    playingFlashcardAudio,
    speakFallback,
    stopFlashcardAudio,
    user?.soundEnabled,
  ]);

  const handlePlayQuizAudio = useCallback(async () => {
    if (!currentQuizWord) {
      return;
    }

    if (playingFlashcardAudio) {
      await stopFlashcardAudio();
      return;
    }

    if (user?.soundEnabled === false) {
      setError('Âm thanh đang tắt trong cài đặt. Bật lại ở Alarm sound để nghe phát âm.');
      return;
    }

    try {
      setError(null);
      setPlayingFlashcardAudio(true);
      await speakFallback(currentQuizWord.word);
      setPlayingFlashcardAudio(false);
    } catch {
      setError('Không thể phát âm từ này. Vui lòng thử lại sau.');
      await stopFlashcardAudio();
    }
  }, [
    currentQuizWord,
    playingFlashcardAudio,
    speakFallback,
    stopFlashcardAudio,
    user?.soundEnabled,
  ]);

  useEffect(() => {
    void stopFlashcardAudio();
  }, [currentFlashcard?.id, currentQuizWord?.id, phase, stopFlashcardAudio]);

  useEffect(() => () => {
    void stopFlashcardAudio();
  }, [stopFlashcardAudio]);

  useEffect(() => () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
  }, []);

  useEffect(
    () => () => {
      const latestState = useLearningSessionStore.getState();

      if (latestState.sessionId && latestState.phase !== 'complete') {
        persistSessionSnapshot().catch(() => {});
      }
    },
    [persistSessionSnapshot]
  );

  const leaveSession = () => {
    void stopFlashcardAudio();
    reset();
    router.replace('/(tabs)');
  };

  const handleToggleFlashcard = useCallback(() => {
    if (isFlipping) {
      return;
    }

    const nextShowAnswer = !showAnswer;

    setError(null);
    setIsFlipping(true);
    setShowAnswer(nextShowAnswer);

    Animated.timing(flipAnimation, {
      toValue: nextShowAnswer ? 1 : 0,
      duration: 360,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipping(false);
    });
  }, [flipAnimation, isFlipping, showAnswer]);

  const handleStartSession = async () => {
    try {
      setStartingSession(true);
      setError(null);

      let nextWords = previewWords;
      if (nextWords.length === 0) {
        nextWords = await fetchTodayWords();
      }

      if (nextWords.length === 0) {
        return;
      }

      const response = await learningApi.start({
        sessionType: requestedAlarmId ? 'alarm' : 'daily_review',
        alarmId: requestedAlarmId,
        deckId: previewScope.activeDeck?.id,
        lessonDeckIds: requestedLessonDeckIds,
        reviewMode: requestedReviewMode,
        replaceUnfinished: shouldReplaceUnfinished,
      });
      const session = response.data.session;

      if (response.data.resumed && (session?.id || session?._id)) {
        await loadResumeSession(session.id || session._id);
        return;
      }

      initializeSession({
        sessionId: session._id || session.id,
        sessionType: session.sessionType || 'daily_review',
        words: nextWords,
        activeDeckName: response.data.activeDeck?.name || previewScope.activeDeck?.name || null,
        startedAt: session.startedAt,
      });
    } catch (nextError: any) {
      if (nextError?.response?.status === 409 && nextError?.response?.data?.unfinished?.sessionId) {
        setError('Bạn đang có một phiên học chưa hoàn thành. Quay lại Library hoặc Home để tiếp tục phiên đó.');
      } else {
        setError(getErrorMessage(nextError));
      }
    } finally {
      setStartingSession(false);
    }
  };

  const handleFlashcardAnswer = async (difficulty: 1 | 2 | 3) => {
    if (!sessionId || !currentFlashcard) {
      return;
    }

    try {
      setSubmittingFlashcard(true);
      setError(null);
      await learningApi.submitFlashcard({
        sessionId,
        wordId: currentFlashcard.id,
        difficulty,
      });
      recordFlashcard(currentFlashcard.id, difficulty);
      advanceFlashcard();
      await persistSessionSnapshot();
    } catch (nextError: any) {
      setError(getErrorMessage(nextError));
    } finally {
      setSubmittingFlashcard(false);
    }
  };

  async function handleAdvanceQuiz() {
    if (!sessionId) {
      return;
    }

    const latestState = useLearningSessionStore.getState();
    const isLastQuestion = latestState.quizIndex >= latestState.words.length - 1;

    if (!isLastQuestion) {
      advanceQuiz();
      await persistSessionSnapshot();
      return;
    }

    try {
      setCompletingSession(true);
      setError(null);
      const response = await learningApi.completeSession({
        sessionId,
        totalWords: latestState.words.length,
        totalQuestions: latestState.totalQuestions,
        correctAnswers: latestState.correctAnswers,
      });
      setCompletionMeta({
        deckTransition: response.data.deckTransition || null,
        activeDeckName:
          response.data.deckTransition?.activeDeck?.name || latestState.activeDeckName,
      });
      markComplete();
      router.replace('/learning/complete');
    } catch (nextError: any) {
      setError(getErrorMessage(nextError));
    } finally {
      setCompletingSession(false);
    }
  }

  const handleSubmitQuiz = async (nextAnswer: string) => {
    if (!sessionId || !currentQuizWord || submittingQuiz || submittedResult || quizSubmitLockRef.current) {
      return;
    }

    const trimmedAnswer = nextAnswer.trim();
    if (!trimmedAnswer) {
      return;
    }

    const isCorrect =
      currentQuizMode === 'fill_missing'
        ? normalizeFillAnswer(trimmedAnswer) === normalizeFillAnswer(expectedQuizAnswer)
        : normalizeAnswer(trimmedAnswer) === normalizeAnswer(expectedQuizAnswer);

    try {
      quizSubmitLockRef.current = true;
      setSelectedOption(trimmedAnswer);
      setSubmittingQuiz(true);
      setError(null);
      await learningApi.submitQuiz({
        sessionId,
        wordId: currentQuizWord.id,
        quizType: currentQuizMode,
        selectedAnswer: trimmedAnswer,
        isCorrect,
      });
      recordQuiz(currentQuizWord.id, trimmedAnswer, isCorrect);
      await persistSessionSnapshot();
      setSubmittedResult({
        selectedAnswer: trimmedAnswer,
        isCorrect,
      });

      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }

      autoAdvanceTimerRef.current = setTimeout(() => {
        void handleAdvanceQuiz();
      }, 700);
    } catch (nextError: any) {
      quizSubmitLockRef.current = false;
      setError(getErrorMessage(nextError));
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (!isAuthenticated || !token) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />

        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.identityLabel}>Learning</Text>
          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.centerCard}>
            <Text style={styles.centerEyebrow}>Session Locked</Text>
            <Text style={styles.centerTitle}>Cần đăng nhập để bắt đầu học</Text>
            <Text style={styles.centerText}>
              Phiên học sử dụng dữ liệu spaced repetition và tiến độ theo tài khoản của bạn.
            </Text>
            <KineticButton onPress={() => router.replace('/(auth)/login')}>
              <KineticButtonText>Đăng nhập</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  if (!sessionId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />

        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.identityLabel}>{previewModeCopy.identity}</Text>
          <TouchableOpacity style={styles.iconButton} onPress={fetchTodayWords}>
            <Text style={styles.iconText}>↻</Text>
          </TouchableOpacity>
        </View>

        {loadingPreview ? (
          <View style={styles.centerStage}>
            <KineticGlassCard style={styles.loadingCard}>
              <ActivityIndicator size="small" color={kineticPalette.primary} />
              <Text style={styles.loadingText}>Đang tải danh sách từ cần học.</Text>
            </KineticGlassCard>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
              showsVerticalScrollIndicator={false}
            >
              <LinearGradient colors={kineticGradient} style={styles.heroGradientCard}>
                <View style={styles.heroGradientGlow} />
                <Text style={styles.heroEyebrow}>{previewModeCopy.eyebrow}</Text>
                <Text style={styles.heroTitle}>{previewModeCopy.title}</Text>
                <Text style={styles.heroSubtitle}>{previewModeCopy.subtitle}</Text>

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{previewCounts.reviewCount}</Text>
                    <Text style={styles.heroStatLabel}>Review</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{previewCounts.newCount}</Text>
                    <Text style={styles.heroStatLabel}>New</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{activeWords.length * 2}</Text>
                    <Text style={styles.heroStatLabel}>Steps</Text>
                  </View>
                </View>
              </LinearGradient>

                <KineticGlassCard style={styles.scopeCard}>
                  <Text style={styles.sectionEyebrow}>Deck hiện tại</Text>
                  <Text style={styles.scopeTitle}>
                  {previewScope.activeDeck?.name || 'Phạm vi học hiện tại'}
                  </Text>
                  <Text style={styles.scopeText}>
                    {previewScope.activeDeck
                      ? `${previewScope.activeDeck.masteredCount || 0}/${previewScope.activeDeck.wordCount || 0} từ đã thuộc trong bộ từ hiện tại.`
                    : 'Phiên học này sẽ dùng phạm vi học mặc định hoặc phạm vi truyền từ báo thức/thư viện.'}
                  </Text>
                </KineticGlassCard>

              <KineticGlassCard style={styles.structureCard}>
                <Text style={styles.sectionEyebrow}>Session Flow</Text>
                <View style={styles.structureRow}>
                  <View style={styles.structureStep}>
                    <Text style={styles.structureStepIndex}>01</Text>
                    <Text style={styles.structureStepTitle}>Audio cue khi có sẵn</Text>
                  </View>
                  <View style={styles.structureStep}>
                    <Text style={styles.structureStepIndex}>02</Text>
                    <Text style={styles.structureStepTitle}>Flashcard + đánh giá độ khó</Text>
                  </View>
                  <View style={styles.structureStep}>
                    <Text style={styles.structureStepIndex}>03</Text>
                    <Text style={styles.structureStepTitle}>Quiz nhiều kiểu câu hỏi</Text>
                  </View>
                </View>
              </KineticGlassCard>

              {error ? (
                <View style={styles.noticeCard}>
                  <Text style={styles.noticeText}>{error}</Text>
                </View>
              ) : null}

              {activeWords.length === 0 ? (
                <KineticGlassCard style={styles.emptyStateCard}>
                  <Text style={styles.centerTitle}>Không còn từ đến hạn</Text>
                  <Text style={styles.centerText}>
                    Bạn có thể quay lại thư viện hoặc chờ alarm tiếp theo để mở một session mới.
                  </Text>
                </KineticGlassCard>
              ) : (
                <>
                  <View style={styles.previewPillRow}>
                    {previewPills.map((pill) => (
                      <View key={pill.id} style={[styles.previewPill, { backgroundColor: pill.accent }]}>
                        <Text style={styles.previewPillText}>{pill.label}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.previewList}>
                    {activeWords.map((word) => (
                      <View key={word.id} style={styles.previewRow}>
                        <View style={styles.previewWordMain}>
                          <Text style={styles.previewWord}>{word.word}</Text>
                          <Text style={styles.previewMeaning}>{word.meaning}</Text>
                        </View>
                        <View
                          style={[
                            styles.sourcePill,
                            word.source === 'review' ? styles.reviewPill : styles.newPill,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sourcePillText,
                              word.source === 'review' ? styles.reviewPillText : styles.newPillText,
                            ]}
                          >
                            {word.source === 'review' ? 'Ôn lại' : 'Từ mới'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.bottomActionBar, { paddingBottom: insets.bottom + 16 }]}>
              <KineticButton variant="secondary" style={styles.actionFlex} onPress={() => router.replace('/(tabs)')}>
                <KineticButtonText variant="secondary">Để sau</KineticButtonText>
              </KineticButton>
              <KineticButton
                style={styles.actionFlex}
                disabled={activeWords.length === 0 || startingSession}
                onPress={handleStartSession}
              >
                {startingSession ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <KineticButtonText>Bắt đầu học</KineticButtonText>
                    <Text style={styles.primaryInlineIcon}>▶</Text>
                  </>
                )}
              </KineticButton>
            </View>
          </>
        )}
      </View>
    );
  }

  if (phase === 'quiz' && currentQuizWord) {
    const titleByMode =
      currentQuizMode === 'meaning_to_word'
        ? 'Chọn từ đúng'
        : currentQuizMode === 'word_to_meaning'
          ? 'Chọn nghĩa đúng'
          : currentQuizMode === 'fill_missing'
            ? 'Gõ chữ còn thiếu'
            : 'Chọn ví dụ đúng';
    const focusText =
      currentQuizMode === 'meaning_to_word'
        ? currentQuizWord.meaning
        : currentQuizMode === 'word_to_meaning'
          ? currentQuizWord.word
          : currentQuizMode === 'fill_missing'
            ? currentQuizWord.word
            : currentQuizWord.word;
    const helperText =
      currentQuizMode === 'meaning_to_word'
        ? currentQuizWord.exampleVi || 'Chọn từ tiếng Anh khớp với nghĩa bên dưới.'
        : currentQuizMode === 'word_to_meaning'
          ? currentQuizWord.example || 'Chọn nghĩa tiếng Việt phù hợp nhất với từ này.'
          : currentQuizMode === 'fill_missing'
            ? 'Từ đang bị khuyết chữ. Hãy nhập nguyên từ hoàn chỉnh.'
            : currentQuizWord.meaning;

    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />

        <View style={styles.topRow}>
          <TouchableOpacity style={styles.iconButton} onPress={leaveSession}>
            <Text style={styles.iconText}>×</Text>
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.identityLabel}>Quiz</Text>
            <Text style={styles.progressLabel}>
              {quizIndex + 1}/{words.length}
            </Text>
          </View>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              {currentQuizMode === 'example' ? 'Example' : currentQuizMode === 'fill_missing' ? 'Typing' : 'Choice'}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient colors={kineticGradient} style={[styles.progressFill, { width: `${overallProgress}%` }]} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.quizHero}>
            <Text style={styles.quizGhostWord}>LEXICON</Text>
            <KineticGlassCard style={styles.quizCard}>
              <Text style={styles.sectionEyebrow}>{titleByMode}</Text>
              {currentQuizMode === 'fill_missing' ? (
                <View style={styles.fillWordRow}>
                  {fillMissingPrompt.characters.map((character, index) => (
                    <View
                      key={`${character.value}-${index}`}
                      style={[
                        styles.fillLetterTile,
                        character.hidden && styles.fillLetterTileHidden,
                        !isLetter(character.value) && styles.fillLetterTileSpacer,
                      ]}
                    >
                      <Text style={[styles.fillLetterText, character.hidden && styles.fillLetterTextHidden]}>
                        {character.hidden ? '_' : character.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.quizFocusText}>{focusText}</Text>
              )}
              {currentQuizMode === 'example' ? (
                <Text style={styles.quizFocusMeaning}>{currentQuizWord.meaning}</Text>
              ) : null}
              <Text style={styles.quizHelperText}>{helperText}</Text>
            </KineticGlassCard>
          </View>

          {currentQuizMode === 'fill_missing' ? (
            <KineticGlassCard style={styles.fillInputCard}>
              <View style={styles.fillMetaRow}>
                <View style={styles.fillMetaMain}>
                  {currentQuizWord.ipa ? <Text style={styles.fillIpa}>{currentQuizWord.ipa}</Text> : null}
                  <Text style={styles.fillMeaning}>{currentQuizWord.meaning}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.fillAudioButton,
                    playingFlashcardAudio && styles.fillAudioButtonActive,
                    user?.soundEnabled === false && styles.audioButtonDisabled,
                  ]}
                  onPress={handlePlayQuizAudio}
                  activeOpacity={0.9}
                >
                  <Text style={styles.fillAudioText}>{playingFlashcardAudio ? 'Dừng' : 'Nghe'}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.fillTextInput}
                placeholder="Nhập nguyên từ..."
                placeholderTextColor={kineticPalette.outline}
                autoCapitalize="none"
                autoCorrect={false}
                value={fillMissingAnswer}
                onChangeText={setFillMissingAnswer}
                editable={!submittedResult && !submittingQuiz}
                onSubmitEditing={() => void handleSubmitQuiz(fillMissingAnswer)}
              />
            </KineticGlassCard>
          ) : (
          <View style={styles.optionsColumn}>
            {quizOptions.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = Boolean(submittedResult?.selectedAnswer) && option === expectedQuizAnswer;
              const isWrong =
                submittedResult?.selectedAnswer === option &&
                submittedResult.selectedAnswer !== expectedQuizAnswer;

              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    isCorrect && styles.optionCardCorrect,
                    isWrong && styles.optionCardWrong,
                  ]}
                  disabled={Boolean(submittedResult) || submittingQuiz}
                  onPress={() => void handleSubmitQuiz(option)}
                >
                  <View
                    style={[
                      styles.optionLetterCircle,
                      isSelected && styles.optionLetterCircleSelected,
                      isCorrect && styles.optionLetterCircleCorrect,
                      isWrong && styles.optionLetterCircleWrong,
                    ]}
                  >
                    <Text style={styles.optionLetter}>{OPTION_LETTERS[index] || '?'}</Text>
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          )}

          {submittedResult ? (
            <View style={styles.insightCard}>
              <Text style={styles.insightLabel}>Đáp án chuẩn</Text>
              <Text style={styles.insightTitle}>{expectedQuizAnswer}</Text>
              <Text style={styles.insightBody}>
                {currentQuizMode === 'meaning_to_word'
                  ? currentQuizWord.example || 'Không có ví dụ cho từ này.'
                  : currentQuizMode === 'word_to_meaning'
                    ? currentQuizWord.exampleVi || 'Không có gợi ý thêm cho câu hỏi này.'
                    : currentQuizMode === 'fill_missing'
                      ? currentQuizWord.meaning
                      : currentQuizWord.exampleVi || currentQuizWord.example || 'Không có ví dụ dịch kèm theo.'}
              </Text>
            </View>
          ) : null}

          {submittedResult ? (
            <View
              style={[
                styles.resultStrip,
                submittedResult.isCorrect ? styles.resultStripCorrect : styles.resultStripWrong,
              ]}
            >
              <Text style={styles.resultTitle}>
                {submittedResult.isCorrect ? 'Chính xác' : 'Cần ôn lại'}
              </Text>
              <Text style={styles.resultText}>
                {submittedResult.selectedAnswer === '[skip]'
                  ? `Bạn đã bỏ qua câu này. Đáp án đúng là ${expectedQuizAnswer}.`
                  : submittedResult.isCorrect
                    ? 'Bạn đã chọn đúng phương án của vòng quiz này.'
                    : `Bạn đã chọn ${submittedResult.selectedAnswer}. Đáp án đúng là ${expectedQuizAnswer}.`}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomActionBar, { paddingBottom: insets.bottom + 16 }]}>
          {currentQuizMode === 'fill_missing' && !submittedResult ? (
            <KineticButton
              style={styles.fullWidthAction}
              disabled={!fillMissingAnswer.trim() || submittingQuiz}
              onPress={() => void handleSubmitQuiz(fillMissingAnswer)}
            >
              {submittingQuiz ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <KineticButtonText>Trả lời</KineticButtonText>
                  <Text style={styles.primaryInlineIcon}>→</Text>
                </>
              )}
            </KineticButton>
          ) : (
            <KineticButton style={styles.fullWidthAction} disabled>
              {submittingQuiz || completingSession ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <KineticButtonText>
                  {submittedResult
                    ? quizIndex >= words.length - 1
                      ? 'Đang hoàn thành'
                      : 'Đang chuyển câu'
                    : 'Chọn đáp án để tiếp tục'}
                </KineticButtonText>
              )}
            </KineticButton>
          )}
        </View>
      </View>
    );
  }

  if (!currentFlashcard) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang chuẩn bị buổi học.</Text>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconButton} onPress={leaveSession}>
          <Text style={styles.iconText}>×</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.identityLabel}>Flashcard</Text>
          <Text style={styles.progressLabel}>
            {flashcardIndex + 1}/{words.length}
          </Text>
        </View>
        <View style={[styles.modeBadge, currentFlashcard.source === 'review' ? styles.warmBadge : styles.coolBadge]}>
          <Text
            style={[
              styles.modeBadgeText,
              currentFlashcard.source === 'review' ? styles.warmBadgeText : styles.coolBadgeText,
            ]}
          >
            {currentFlashcard.source === 'review' ? 'Ôn lại' : 'Từ mới'}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <LinearGradient colors={kineticGradient} style={[styles.progressFill, { width: `${overallProgress}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 176 }]}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.flashcardStage}>
          <Pressable
            onPress={handleToggleFlashcard}
            accessibilityRole="button"
            disabled={isFlipping}
            style={styles.flashcardPressShell}
          >
            <View style={styles.flashcardDisplay}>
              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.flashcardFace,
                  {
                    transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
                  },
                ]}
              >
                <LinearGradient colors={kineticGradient} style={styles.flashcardFaceGradient}>
                  <Text style={styles.flashcardGhost}>WORD</Text>
                  <View style={styles.flashcardTopRow}>
                    <View style={styles.flashcardChipRow}>
                      <View style={styles.flashcardChip}>
                        <Text style={styles.flashcardChipText}>
                          {currentFlashcard.audioUrl ? 'Audio file' : 'TTS fallback'}
                        </Text>
                      </View>
                      <View style={[styles.flashcardChip, styles.flashcardChipMuted]}>
                        <Text style={styles.flashcardChipTextMuted}>Mastery {currentFlashcard.masteryScore}%</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.audioButton,
                        playingFlashcardAudio && styles.audioButtonActive,
                        user?.soundEnabled === false && styles.audioButtonDisabled,
                      ]}
                      activeOpacity={0.92}
                      onPress={(event) => {
                        event.stopPropagation();
                        void handlePlayFlashcardAudio();
                      }}
                    >
                      <Text style={styles.audioButtonIcon}>{playingFlashcardAudio ? '■' : '🔊'}</Text>
                      <Text style={styles.audioButtonText}>{playingFlashcardAudio ? 'Dừng' : 'Nghe'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.flashcardFrontContent}>
                    <Text style={styles.flashcardWord}>{currentFlashcard.word}</Text>
                    {currentFlashcard.ipa ? <Text style={styles.flashcardIpa}>{currentFlashcard.ipa}</Text> : null}
                  </View>

                  <Text style={styles.flashcardPrompt}>Chạm để lật sang mặt nghĩa.</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.flashcardFace,
                  {
                    transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
                  },
                ]}
              >
                <LinearGradient colors={kineticWarmGradient} style={styles.flashcardFaceGradient}>
                  <Text style={styles.flashcardGhost}>MEANING</Text>
                  <View style={styles.flashcardTopRow}>
                    <View style={styles.flashcardChipRow}>
                      <View style={[styles.flashcardChip, styles.flashcardBackChip]}>
                        <Text style={styles.flashcardChipText}>Mặt sau</Text>
                      </View>
                      <View style={[styles.flashcardChip, styles.flashcardBackChipMuted]}>
                        <Text style={styles.flashcardChipTextMuted}>{currentFlashcard.ipa || 'No IPA'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.audioButton,
                        styles.flashcardBackAudioButton,
                        playingFlashcardAudio && styles.audioButtonActive,
                        user?.soundEnabled === false && styles.audioButtonDisabled,
                      ]}
                      activeOpacity={0.92}
                      onPress={(event) => {
                        event.stopPropagation();
                        void handlePlayFlashcardAudio();
                      }}
                    >
                      <Text style={styles.audioButtonIcon}>{playingFlashcardAudio ? '■' : '🔊'}</Text>
                      <Text style={styles.audioButtonText}>{playingFlashcardAudio ? 'Dừng' : 'Nghe'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.flashcardBackContent}>
                    <View style={styles.flashcardBackHeadline}>
                      <Text style={styles.flashcardBackWord}>{currentFlashcard.word}</Text>
                      {currentFlashcard.ipa ? <Text style={styles.flashcardBackIpa}>{currentFlashcard.ipa}</Text> : null}
                    </View>
                    <Text style={styles.answerMeaningInCard}>{currentFlashcard.meaning}</Text>
                    <Text style={styles.answerExampleInCard}>
                      {currentFlashcard.example || 'Không có ví dụ cho từ này.'}
                    </Text>
                    {currentFlashcard.exampleVi ? (
                      <Text style={styles.answerTranslationInCard}>{currentFlashcard.exampleVi}</Text>
                    ) : null}
                  </View>

                  <Text style={styles.flashcardPrompt}>Chạm để quay lại mặt từ hoặc đánh giá độ khó bên dưới.</Text>
                </LinearGradient>
              </Animated.View>
            </View>
          </Pressable>

          <View style={styles.flashcardMetaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Lần ôn</Text>
              <Text style={styles.metaValue}>{currentFlashcard.consecutiveCorrect || 0}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Lịch sau</Text>
              <Text style={styles.metaValue}>{formatMinutes(currentFlashcard.nextReviewAt)}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Nguồn</Text>
              <Text style={styles.metaValue}>{currentFlashcard.source === 'review' ? 'Review' : 'New'}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={[styles.bottomStack, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.difficultyCard,
                { backgroundColor: option.tone },
                (!showAnswer || submittingFlashcard || isFlipping) && styles.difficultyCardDisabled,
              ]}
              disabled={!showAnswer || submittingFlashcard || isFlipping}
              onPress={() => handleFlashcardAnswer(option.value)}
            >
              {submittingFlashcard ? (
                <ActivityIndicator color={option.accent} />
              ) : (
                <>
                  <Text style={[styles.difficultyTitle, { color: option.accent }]}>{option.label}</Text>
                  <Text style={[styles.difficultyHint, { color: option.accent }]}>{option.hint}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...kineticShadow,
  },
  iconPlaceholder: {
    width: 42,
    height: 42,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  identityLabel: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    color: kineticPalette.primary,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  modeBadge: {
    minWidth: 86,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  warmBadge: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  coolBadge: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  warmBadgeText: {
    color: kineticPalette.tertiaryContainer,
  },
  coolBadgeText: {
    color: kineticPalette.primary,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceHigh,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  scrollContent: {
    gap: 18,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  centerCard: {
    gap: 14,
  },
  centerEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  centerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  centerText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  loadingText: {
    fontSize: 15,
    color: kineticPalette.onSurfaceVariant,
  },
  heroGradientCard: {
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
    ...kineticShadow,
  },
  heroGradientGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -36,
    top: -24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.84)',
    marginBottom: 18,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  structureCard: {
    gap: 14,
  },
  scopeCard: {
    gap: 8,
  },
  scopeTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  scopeText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  structureRow: {
    gap: 12,
  },
  structureStep: {
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 16,
    gap: 4,
  },
  structureStepIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primaryContainer,
  },
  structureStepTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: kineticPalette.onSurface,
  },
  previewPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: kineticPalette.onSurface,
  },
  previewList: {
    gap: 12,
  },
  previewRow: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...kineticShadow,
  },
  previewWordMain: {
    flex: 1,
    gap: 4,
  },
  previewWord: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  previewMeaning: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  sourcePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewPill: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  newPill: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  sourcePillText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reviewPillText: {
    color: kineticPalette.tertiaryContainer,
  },
  newPillText: {
    color: kineticPalette.primary,
  },
  emptyStateCard: {
    gap: 12,
  },
  noticeCard: {
    borderRadius: 22,
    backgroundColor: kineticPalette.errorContainer,
    padding: 16,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.error,
    fontWeight: '600',
  },
  bottomActionBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(248,249,250,0.86)',
  },
  actionFlex: {
    flex: 1,
  },
  fullWidthAction: {
    width: '100%',
  },
  primaryInlineIcon: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  quizHero: {
    position: 'relative',
  },
  quizGhostWord: {
    position: 'absolute',
    top: -36,
    left: -6,
    fontSize: 72,
    fontWeight: '900',
    color: 'rgba(53,37,205,0.06)',
    letterSpacing: -2,
  },
  quizCard: {
    paddingTop: 26,
    gap: 10,
  },
  quizFocusText: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: kineticPalette.primary,
    letterSpacing: -1.2,
  },
  quizFocusMeaning: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: kineticPalette.onSurface,
  },
  quizHelperText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  fillWordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fillLetterTile: {
    minWidth: 34,
    height: 48,
    borderRadius: 14,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  fillLetterTileHidden: {
    backgroundColor: kineticPalette.primaryFixed,
    borderBottomWidth: 3,
    borderBottomColor: kineticPalette.primaryContainer,
  },
  fillLetterTileSpacer: {
    minWidth: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  fillLetterText: {
    fontSize: 26,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  fillLetterTextHidden: {
    color: kineticPalette.primary,
  },
  fillInputCard: {
    gap: 16,
  },
  fillMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fillMetaMain: {
    flex: 1,
    gap: 4,
  },
  fillIpa: {
    fontSize: 15,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  fillMeaning: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: kineticPalette.onSurface,
  },
  fillAudioButton: {
    minWidth: 72,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  fillAudioButtonActive: {
    backgroundColor: kineticPalette.secondaryContainer,
  },
  fillAudioText: {
    fontSize: 12,
    fontWeight: '900',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  fillTextInput: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLowest,
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  optionsColumn: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    ...kineticShadow,
  },
  optionCardSelected: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  optionCardCorrect: {
    backgroundColor: '#dcfce7',
  },
  optionCardWrong: {
    backgroundColor: '#fee2e2',
  },
  optionLetterCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: kineticPalette.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  optionLetterCircleSelected: {
    backgroundColor: kineticPalette.primaryContainer,
  },
  optionLetterCircleCorrect: {
    backgroundColor: '#15803d',
  },
  optionLetterCircleWrong: {
    backgroundColor: '#b91c1c',
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  optionCopy: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    color: kineticPalette.onSurface,
  },
  insightCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 18,
    gap: 8,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  insightTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  insightBody: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  resultStrip: {
    borderRadius: 24,
    padding: 18,
    gap: 6,
  },
  resultStripCorrect: {
    backgroundColor: '#dcfce7',
  },
  resultStripWrong: {
    backgroundColor: '#fee2e2',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  flashcardStage: {
    gap: 16,
  },
  flashcardPressShell: {
    borderRadius: 30,
  },
  flashcardDisplay: {
    position: 'relative',
    height: 340,
    borderRadius: 30,
    ...kineticShadow,
  },
  flashcardFace: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
  flashcardFaceGradient: {
    borderRadius: 30,
    padding: 24,
    minHeight: 340,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  flashcardBackChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  flashcardBackChipMuted: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  flashcardBackAudioButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  flashcardGhost: {
    position: 'absolute',
    right: -8,
    bottom: 10,
    fontSize: 76,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.08)',
  },
  flashcardChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    flex: 1,
  },
  flashcardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  flashcardChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  flashcardChipMuted: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  flashcardChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  flashcardChipTextMuted: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.84)',
  },
  audioButton: {
    minWidth: 92,
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  audioButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  audioButtonDisabled: {
    opacity: 0.45,
  },
  audioButtonIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  audioButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  flashcardWord: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1.6,
  },
  flashcardIpa: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  flashcardPrompt: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
  },
  flashcardFrontContent: {
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  flashcardBackContent: {
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  flashcardBackHeadline: {
    gap: 4,
  },
  flashcardBackWord: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    color: '#ffffff',
  },
  flashcardBackIpa: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  answerMeaningInCard: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    color: '#ffffff',
  },
  answerExampleInCard: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  answerTranslationInCard: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
  },
  flashcardMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 16,
    gap: 6,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  metaValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  answerRevealCard: {
    gap: 10,
  },
  answerMeaning: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  answerExample: {
    fontSize: 16,
    lineHeight: 24,
    color: kineticPalette.onSurface,
  },
  answerTranslation: {
    fontSize: 14,
    lineHeight: 21,
    color: kineticPalette.onSurfaceVariant,
  },
  hiddenAnswerText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  bottomStack: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    gap: 12,
    backgroundColor: 'rgba(248,249,250,0.9)',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  difficultyCardDisabled: {
    opacity: 0.45,
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  difficultyHint: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
