import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgress } from '../../lib/hooks';
import { useLearningSessionStore } from '../../stores/learningSessionStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';

const formatDuration = (startedAt?: string | null, completedAt?: string | null) => {
  if (!startedAt || !completedAt) {
    return '0:00';
  }

  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = Math.max(end.getTime() - start.getTime(), 0);
  const totalSeconds = Math.round(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getMessage = (accuracy: number) => {
  if (accuracy >= 90) {
    return {
      title: 'Chúc mừng!',
      subtitle: 'Bạn xử lý session này rất chắc tay và giữ nhịp học cực ổn.',
    };
  }

  if (accuracy >= 70) {
    return {
      title: 'Tiến độ rất ổn',
      subtitle: 'Bạn đã hoàn thành phần lớn câu hỏi và vẫn giữ được tốc độ học tốt.',
    };
  }

  if (accuracy >= 40) {
    return {
      title: 'Đã lưu session',
      subtitle: 'Tiến độ đã được cập nhật. Nên xem lại các từ sai để đẩy độ nhớ lên nhanh hơn.',
    };
  }

  return {
    title: 'Buổi học đã xong',
    subtitle: 'Nên chạy thêm một session ngắn để củng cố nhóm từ khó ngay bây giờ.',
  };
};

export default function LearningCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { streak, loading, weeklyActivity } = useProgress();
  const {
    sessionType,
    words,
    quizAnswers,
    totalQuestions,
    correctAnswers,
    activeDeckName,
    deckTransition,
    startedAt,
    completedAt,
    reset,
  } = useLearningSessionStore();

  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const timeSpent = formatDuration(startedAt, completedAt);
  const xpEarned = correctAnswers * 12 + words.length * 8;
  const message = getMessage(accuracy);
  const streakPreview = weeklyActivity.slice(-7);

  const wordsToReview = useMemo(() => {
    const incorrectWordIds = Object.entries(quizAnswers)
      .filter(([, answer]) => !answer.isCorrect)
      .map(([wordId]) => wordId);

    if (incorrectWordIds.length > 0) {
      return words.filter((word) => incorrectWordIds.includes(word.id)).slice(0, 4);
    }

    return words
      .slice()
      .sort((left, right) => left.masteryScore - right.masteryScore)
      .slice(0, 4);
  }, [quizAnswers, words]);

  const streakLabel = loading ? '...' : `${streak.current} ngày`;
  const maxWords = Math.max(...streakPreview.map((item) => item.words), 1);
  const reviewWordCount = words.filter((word) => word.source === 'review').length;
  const newWordCount = words.filter((word) => word.source === 'new').length;
  const transitionText = deckTransition?.advanced && deckTransition.activeDeck?.name
      ? `Đã chuyển sang bộ tiếp theo: ${deckTransition.activeDeck.name}.`
      : null;

  useEffect(() => {
    if (words.length === 0) {
      router.replace('/learning');
    }
  }, [words.length]);

  if (words.length === 0) {
    return null;
  }

  const goHome = () => {
    reset();
    router.replace('/(tabs)');
  };

  const restart = () => {
    reset();
    router.replace(sessionType === 'cram' ? '/cram/setup' : '/learning');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={kineticGradient} style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeIcon}>🏆</Text>
          </View>
          <Text style={styles.heroTitle}>{message.title}</Text>
          <Text style={styles.heroSubtitle}>{message.subtitle}</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📘</Text>
            <Text style={styles.statValue}>{words.length}/{words.length}</Text>
            <Text style={styles.statLabel}>Từ vựng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{timeSpent}</Text>
            <Text style={styles.statLabel}>Phút học</Text>
          </View>
          <View style={[styles.statWideCard, styles.statWideCardSoft]}>
            <Text style={styles.statSmallLabel}>Điểm tích lũy</Text>
            <Text style={styles.statWideValue}>+{xpEarned} PTS</Text>
          </View>
        </View>

        <KineticGlassCard style={styles.scopeCard}>
          <Text style={styles.reviewTitle}>Phạm vi học</Text>
          <Text style={styles.summaryItem}>Bộ từ: {activeDeckName || 'LexiWake'}</Text>
          <Text style={styles.summaryItem}>Ôn lại: {reviewWordCount} từ • Từ mới: {newWordCount} từ</Text>
          {transitionText ? <Text style={styles.transitionText}>{transitionText}</Text> : null}
        </KineticGlassCard>

        <KineticGlassCard style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View>
              <Text style={styles.streakTitle}>Chuỗi học tập</Text>
              <Text style={styles.streakSubtitle}>Duy trì thói quen mỗi ngày</Text>
            </View>
            <View style={styles.streakValueWrap}>
              <Text style={styles.streakValue}>{streak.current || 0}</Text>
              <Text style={styles.streakValueText}>Ngày liên tiếp</Text>
            </View>
          </View>

          <View style={styles.weeklyRow}>
            {streakPreview.map((item) => (
              <View key={item.date} style={styles.weeklyItem}>
                <View style={styles.weeklyTrack}>
                  <View
                    style={[
                      styles.weeklyFill,
                      {
                        height: Math.max(12, Math.round((item.words / maxWords) * 52)),
                        backgroundColor: item.completed ? kineticPalette.primary : kineticPalette.surfaceHigh,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.weeklyLabel, item.completed && styles.weeklyLabelActive]}>
                  {item.day}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Đúng: {correctAnswers}/{totalQuestions}</Text>
            <Text style={styles.summaryItem}>Chính xác: {accuracy}%</Text>
            <Text style={styles.summaryItem}>Streak: {streakLabel}</Text>
          </View>
        </KineticGlassCard>

        <KineticGlassCard style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Từ nên ôn thêm</Text>
          <View style={styles.reviewList}>
            {wordsToReview.map((word) => (
              <View key={word.id} style={styles.reviewRow}>
                <View style={styles.reviewMain}>
                  <Text style={styles.reviewWord}>{word.word}</Text>
                  <Text style={styles.reviewMeaning}>{word.meaning}</Text>
                </View>
                <Text style={styles.reviewMeta}>Mastery {word.masteryScore}%</Text>
              </View>
            ))}
          </View>
        </KineticGlassCard>

        <View style={styles.actions}>
          <KineticButton onPress={goHome}>
            <KineticButtonText>Về trang chủ</KineticButtonText>
          </KineticButton>
          <TouchableOpacity style={styles.secondaryButton} onPress={restart}>
            <Text style={styles.secondaryButtonText}>
              {sessionType === 'cram' ? 'Cram tiếp' : 'Ôn tập thêm'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
    paddingHorizontal: 24,
  },
  content: {
    gap: 18,
  },
  heroCard: {
    borderRadius: 34,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...kineticShadow,
  },
  heroBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroBadgeIcon: {
    fontSize: 50,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 26,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    minHeight: 148,
    justifyContent: 'space-between',
    ...kineticShadow,
  },
  statWideCard: {
    width: '100%',
    borderRadius: 28,
    padding: 20,
    ...kineticShadow,
  },
  statWideCardSoft: {
    backgroundColor: kineticPalette.surfaceLow,
  },
  statIcon: {
    fontSize: 26,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statSmallLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statWideValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: kineticPalette.primaryContainer,
  },
  streakCard: {
    gap: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  streakTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  streakSubtitle: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  streakValueWrap: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  streakValueText: {
    fontSize: 10,
    fontWeight: '800',
    color: kineticPalette.tertiary,
    textTransform: 'uppercase',
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  weeklyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  weeklyTrack: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    justifyContent: 'flex-end',
    backgroundColor: kineticPalette.surfaceLow,
    overflow: 'hidden',
  },
  weeklyFill: {
    width: '100%',
    borderRadius: 999,
  },
  weeklyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  weeklyLabelActive: {
    color: kineticPalette.primary,
  },
  summaryRow: {
    gap: 6,
  },
  summaryItem: {
    fontSize: 14,
    color: kineticPalette.onSurface,
  },
  reviewCard: {
    gap: 12,
  },
  scopeCard: {
    gap: 8,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  transitionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  reviewList: {
    gap: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  reviewMain: {
    flex: 1,
    gap: 4,
  },
  reviewWord: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  reviewMeaning: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  reviewMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.primary,
  },
  actions: {
    gap: 12,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(79,70,229,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.primaryContainer,
  },
});
