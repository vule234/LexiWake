import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { learningApi } from '../../src/lib/api';
import { useProgress } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

type CramWord = {
  id: string;
  word: string;
  meaning: string;
  example?: string;
};

const shuffleArray = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function CramLearningScreen() {
  const insets = useSafeAreaInsets();
  const { mode, deckId, duration } = useLocalSearchParams<{
    mode?: string;
    deckId?: string;
    duration?: string;
  }>();
  const [words, setWords] = useState<CramWord[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const initialSeconds = Math.max(60, Number(duration || '10') * 60);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const { streak } = useProgress();

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let mounted = true;

    const fetchCram = async () => {
      try {
        setLoading(true);
        const params: Record<string, string | boolean> = {};

        if (mode === 'weak') {
          params.weak = true;
        }
        if (mode === 'deck' && deckId) {
          params.deckId = deckId;
        }

        const [sessionResponse, wordsResponse] = await Promise.all([
          learningApi.start({ sessionType: 'cram' }),
          learningApi.getCram(params),
        ]);

        const nextWords = (wordsResponse.data.words || []).map((word: any) => ({
          id: word._id || word.id,
          word: word.word,
          meaning: word.meaningVi || word.meaning,
          example: word.example,
        }));

        if (mounted) {
          setSessionId(sessionResponse.data.session._id || sessionResponse.data.session.id);
          setWords(nextWords);
        }
      } catch (error) {
        if (mounted) {
          setWords([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCram();

    return () => {
      mounted = false;
    };
  }, [deckId, mode]);

  const completeSession = useCallback(async () => {
    if (!sessionId || finishing) {
      return;
    }

    try {
      setFinishing(true);
      await learningApi.completeSession({
        sessionId,
        totalWords: words.length,
        totalQuestions: words.length,
        correctAnswers: score,
      });
      router.replace('/results');
    } catch (error) {
      Alert.alert('Không thể kết thúc cram session', 'Vui lòng thử lại.');
    } finally {
      setFinishing(false);
    }
  }, [finishing, score, sessionId, words.length]);

  useEffect(() => {
    if (loading || !words.length || finishing) {
      return;
    }

    if (timeLeft <= 0) {
      completeSession();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [completeSession, finishing, loading, timeLeft, words.length]);

  const currentWord = words[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) {
      return [];
    }

    const distractors = shuffleArray(words.filter((word) => word.id !== currentWord.id))
      .slice(0, 3)
      .map((word) => word.meaning);

    return shuffleArray([currentWord.meaning, ...distractors]);
  }, [currentWord, words]);

  const answeredCount = currentIndex + (selectedAnswer ? 1 : 0);
  const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;

  const handleAnswer = async (answer: string) => {
    if (!currentWord || !sessionId || submitting || selectedAnswer) {
      return;
    }

    const isCorrect = answer === currentWord.meaning;

    try {
      setSubmitting(true);
      setSelectedAnswer(answer);
      await learningApi.submitQuiz({
        sessionId,
        wordId: currentWord.id,
        quizType: 'word_to_meaning',
        selectedAnswer: answer,
        isCorrect,
      });
      if (isCorrect) {
        setScore((current) => current + 1);
      }
    } catch (error) {
      Alert.alert('Không thể lưu đáp án', 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex >= words.length - 1) {
      await completeSession();
      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelectedAnswer(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải cram session...</Text>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  if (!currentWord) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <Text style={styles.loadingText}>Không có dữ liệu cram cho lựa chọn này.</Text>
            <KineticButton onPress={() => router.replace('/cram/setup')}>
              <KineticButtonText>Quay lại setup</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/cram/setup')}>
          <Text style={styles.headerButtonIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerBrand}>Cram Mode Active</Text>
          <Text style={styles.headerTitle}>Phiên cấp tốc</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 154 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <KineticGlassCard style={styles.timerCard}>
            <Text style={styles.timerIcon}>⏱</Text>
            <Text style={styles.timerValue}>{formatClock(timeLeft)}</Text>
            <Text style={styles.timerLabel}>Thời gian còn lại</Text>
          </KineticGlassCard>

          <View style={styles.miniStats}>
            <LinearGradient colors={kineticGradient} style={styles.statPrimary}>
              <Text style={styles.statValueLight}>
                {currentIndex + 1}/{words.length}
              </Text>
              <Text style={styles.statLabelLight}>Tiến trình</Text>
            </LinearGradient>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{streak.current}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={[styles.statCard, styles.statCardWarm]}>
                <Text style={styles.statValueWarm}>{accuracy}%</Text>
                <Text style={styles.statLabelWarm}>Accuracy</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.questionShell}>
          <View style={styles.wordCard}>
            <Text style={styles.wordBadge}>Từ vựng</Text>
            <Text style={styles.wordText}>{currentWord.word}</Text>
            <Text style={styles.meaningHint}>Chọn nghĩa đúng nhất cho từ này.</Text>

            <View style={styles.exampleCard}>
              <Text style={styles.exampleText}>
                {currentWord.example || 'Tập trung vào phản xạ và tốc độ trả lời trong từng lượt cram.'}
              </Text>
            </View>
          </View>

          <View style={styles.optionsSection}>
            {options.map((option, index) => {
              const isCorrect = Boolean(selectedAnswer) && option === currentWord.meaning;
              const isWrong = selectedAnswer === option && option !== currentWord.meaning;

              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.92}
                  disabled={Boolean(selectedAnswer)}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && styles.optionButtonSelected,
                    isCorrect && styles.optionButtonCorrect,
                    isWrong && styles.optionButtonWrong,
                  ]}
                  onPress={() => handleAnswer(option)}
                >
                  <Text style={styles.optionKey}>{String.fromCharCode(65 + index)}</Text>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {selectedAnswer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
          <KineticButton style={styles.footerButton} disabled={finishing} onPress={handleNext}>
            <KineticButtonText>
              {currentIndex >= words.length - 1 ? 'Hoàn thành cram' : 'Câu tiếp theo'}
            </KineticButtonText>
          </KineticButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    gap: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: kineticPalette.surfaceLowest,
  },
  headerButtonIcon: {
    fontSize: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  headerCopy: {
    alignItems: 'center',
    gap: 2,
  },
  headerBrand: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  scoreBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 12,
    backgroundColor: kineticPalette.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  timerCard: {
    width: 144,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerIcon: {
    fontSize: 34,
  },
  timerValue: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  miniStats: {
    flex: 1,
    gap: 12,
  },
  statPrimary: {
    borderRadius: 26,
    padding: 18,
    gap: 6,
    ...kineticShadow,
  },
  statValueLight: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  statLabelLight: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    backgroundColor: kineticPalette.surfaceLowest,
    gap: 6,
    ...kineticShadow,
  },
  statCardWarm: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  statValueWarm: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statLabelWarm: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.tertiaryContainer,
    textTransform: 'uppercase',
  },
  questionShell: {
    gap: 16,
  },
  wordCard: {
    borderRadius: 30,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 24,
    gap: 14,
    borderLeftWidth: 10,
    borderLeftColor: kineticPalette.primary,
    ...kineticShadow,
  },
  wordBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  wordText: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  meaningHint: {
    fontSize: 18,
    lineHeight: 24,
    color: kineticPalette.onSurfaceVariant,
  },
  exampleCard: {
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 16,
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurface,
    fontStyle: 'italic',
  },
  optionsSection: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: kineticPalette.surfaceLowest,
    ...kineticShadow,
  },
  optionButtonSelected: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  optionButtonCorrect: {
    backgroundColor: '#dcfce7',
  },
  optionButtonWrong: {
    backgroundColor: kineticPalette.errorContainer,
  },
  optionKey: {
    width: 34,
    height: 34,
    borderRadius: 17,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: kineticPalette.surfaceLow,
    color: kineticPalette.outline,
    fontSize: 13,
    fontWeight: '800',
    paddingTop: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: kineticPalette.onSurface,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  footerButton: {
    minHeight: 58,
  },
});
