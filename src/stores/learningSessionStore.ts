import { create } from 'zustand';

export type LearningPhase = 'idle' | 'flashcard' | 'quiz' | 'complete';
export type LearningSessionStatus = 'active' | 'completed' | 'abandoned';

export interface LearningScopeSnapshot {
  deckId: string | null;
  lessonDeckIds: string[];
  reviewMode: 'all' | 'urgent';
  sessionType: string;
}

export interface LearningSessionWord {
  id: string;
  word: string;
  meaning: string;
  ipa?: string;
  example?: string;
  exampleVi?: string;
  audioUrl?: string;
  deckId?: string | null;
  deckName?: string | null;
  source: 'new' | 'review';
  status: 'new' | 'learning' | 'review' | 'mastered' | 'lapsed';
  masteryScore: number;
  lastDifficulty?: 1 | 2 | 3;
  wrongCount?: number;
  consecutiveCorrect?: number;
  nextReviewAt?: string | null;
  overdueDays?: number;
  overdueHours?: number;
}

export interface LearningDeckTransition {
  advanced: boolean;
  previousDeck?: {
    id: string;
    name: string;
  } | null;
  activeDeck?: {
    id: string;
    name: string;
  } | null;
}

export interface FlashcardAnswer {
  difficulty: 1 | 2 | 3;
  answeredAt: string;
}

export interface QuizAnswer {
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
}

interface LearningSessionState {
  sessionId: string | null;
  resumeSessionId: string | null;
  sessionType: string;
  sessionStatus: LearningSessionStatus;
  activeDeckName: string | null;
  deckTransition: LearningDeckTransition | null;
  phase: LearningPhase;
  words: LearningSessionWord[];
  flashcardIndex: number;
  quizIndex: number;
  flashcardAnswers: Record<string, FlashcardAnswer>;
  quizAnswers: Record<string, QuizAnswer>;
  scopeSnapshot: LearningScopeSnapshot | null;
  remainingCount: number;
  totalQuestions: number;
  correctAnswers: number;
  startedAt: string | null;
  completedAt: string | null;
  initializeSession: (payload: {
    sessionId: string;
    sessionType: string;
    words: LearningSessionWord[];
    activeDeckName?: string | null;
    startedAt?: string;
  }) => void;
  hydrateSession: (payload: {
    sessionId: string;
    resumeSessionId?: string | null;
    sessionType: string;
    sessionStatus?: LearningSessionStatus;
    phase: LearningPhase;
    words: LearningSessionWord[];
    flashcardIndex?: number;
    quizIndex?: number;
    flashcardAnswers?: Record<string, FlashcardAnswer>;
    quizAnswers?: Record<string, QuizAnswer>;
    totalQuestions?: number;
    correctAnswers?: number;
    activeDeckName?: string | null;
    scopeSnapshot?: LearningScopeSnapshot | null;
    remainingCount?: number;
    startedAt?: string | null;
    completedAt?: string | null;
  }) => void;
  setCompletionMeta: (payload: {
    deckTransition?: LearningDeckTransition | null;
    activeDeckName?: string | null;
  }) => void;
  recordFlashcard: (wordId: string, difficulty: 1 | 2 | 3) => void;
  advanceFlashcard: () => void;
  recordQuiz: (wordId: string, selectedAnswer: string, isCorrect: boolean) => void;
  advanceQuiz: () => void;
  markComplete: () => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  resumeSessionId: null,
  sessionType: 'daily_review',
  sessionStatus: 'active' as LearningSessionStatus,
  activeDeckName: null,
  deckTransition: null,
  phase: 'idle' as LearningPhase,
  words: [] as LearningSessionWord[],
  flashcardIndex: 0,
  quizIndex: 0,
  flashcardAnswers: {} as Record<string, FlashcardAnswer>,
  quizAnswers: {} as Record<string, QuizAnswer>,
  scopeSnapshot: null as LearningScopeSnapshot | null,
  remainingCount: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  startedAt: null,
  completedAt: null,
};

export const useLearningSessionStore = create<LearningSessionState>((set) => ({
  ...initialState,
  initializeSession: ({ sessionId, sessionType, words, activeDeckName, startedAt }) =>
    set({
      sessionId,
      resumeSessionId: sessionId,
      sessionType,
      sessionStatus: 'active',
      activeDeckName: activeDeckName || null,
      deckTransition: null,
      phase: words.length > 0 ? 'flashcard' : 'idle',
      words,
      flashcardIndex: 0,
      quizIndex: 0,
      flashcardAnswers: {},
      quizAnswers: {},
      scopeSnapshot: null,
      remainingCount: words.length,
      totalQuestions: 0,
      correctAnswers: 0,
      startedAt: startedAt || new Date().toISOString(),
      completedAt: null,
    }),
  hydrateSession: ({
    sessionId,
    resumeSessionId,
    sessionType,
    sessionStatus,
    phase,
    words,
    flashcardIndex,
    quizIndex,
    flashcardAnswers,
    quizAnswers,
    totalQuestions,
    correctAnswers,
    activeDeckName,
    scopeSnapshot,
    remainingCount,
    startedAt,
    completedAt,
  }) =>
    set({
      sessionId,
      resumeSessionId: resumeSessionId ?? sessionId,
      sessionType,
      sessionStatus: sessionStatus || 'active',
      activeDeckName: activeDeckName || null,
      deckTransition: null,
      phase,
      words,
      flashcardIndex: flashcardIndex || 0,
      quizIndex: quizIndex || 0,
      flashcardAnswers: flashcardAnswers || {},
      quizAnswers: quizAnswers || {},
      scopeSnapshot: scopeSnapshot || null,
      remainingCount:
        remainingCount ??
        (phase === 'quiz'
          ? Math.max(words.length - (quizIndex || 0), 0)
          : Math.max(words.length - (flashcardIndex || 0), 0)),
      totalQuestions: totalQuestions || 0,
      correctAnswers: correctAnswers || 0,
      startedAt: startedAt || new Date().toISOString(),
      completedAt: completedAt || null,
    }),
  setCompletionMeta: ({ deckTransition, activeDeckName }) =>
    set((state) => ({
      deckTransition: deckTransition === undefined ? state.deckTransition : deckTransition,
      activeDeckName: activeDeckName === undefined ? state.activeDeckName : activeDeckName,
    })),
  recordFlashcard: (wordId, difficulty) =>
    set((state) => ({
      flashcardAnswers: {
        ...state.flashcardAnswers,
        [wordId]: {
          difficulty,
          answeredAt: new Date().toISOString(),
        },
      },
      remainingCount: Math.max(state.words.length - state.flashcardIndex, 0),
    })),
  advanceFlashcard: () =>
    set((state) => {
      if (state.words.length === 0) {
        return state;
      }

      const isLastWord = state.flashcardIndex >= state.words.length - 1;
      if (isLastWord) {
        return {
          phase: 'quiz',
          quizIndex: 0,
          remainingCount: state.words.length,
        };
      }

      return {
        flashcardIndex: state.flashcardIndex + 1,
        remainingCount: Math.max(state.words.length - (state.flashcardIndex + 1), 0),
      };
    }),
  recordQuiz: (wordId, selectedAnswer, isCorrect) =>
    set((state) => {
      const alreadyAnswered = Boolean(state.quizAnswers[wordId]);

      return {
        quizAnswers: {
          ...state.quizAnswers,
          [wordId]: {
            selectedAnswer,
            isCorrect,
            answeredAt: new Date().toISOString(),
          },
        },
        totalQuestions: alreadyAnswered ? state.totalQuestions : state.totalQuestions + 1,
        correctAnswers:
          alreadyAnswered
            ? state.correctAnswers
            : state.correctAnswers + (isCorrect ? 1 : 0),
        remainingCount: Math.max(state.words.length - state.quizIndex, 0),
      };
    }),
  advanceQuiz: () =>
    set((state) => {
      if (state.words.length === 0) {
        return state;
      }

      const isLastQuestion = state.quizIndex >= state.words.length - 1;
      if (isLastQuestion) {
        return {
          sessionStatus: 'completed',
          phase: 'complete',
          remainingCount: 0,
          completedAt: new Date().toISOString(),
        };
      }

      return {
        quizIndex: state.quizIndex + 1,
        remainingCount: Math.max(state.words.length - (state.quizIndex + 1), 0),
      };
    }),
  markComplete: () =>
    set({
      sessionStatus: 'completed',
      phase: 'complete',
      remainingCount: 0,
      completedAt: new Date().toISOString(),
    }),
  reset: () => set(initialState),
}));
