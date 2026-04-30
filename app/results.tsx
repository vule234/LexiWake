import { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgress } from '../src/lib/hooks';
import { goBackOrReplace } from '../src/lib/navigation';
import { useLearningSessionStore } from '../src/stores/learningSessionStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../src/theme/kinetic';

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

const getSessionTitle = (type?: string | null) => {
  switch (type) {
    case 'cram':
      return 'Phiên cram đã xong';
    case 'alarm':
      return 'Alarm session hoàn tất';
    default:
      return 'Kết quả phiên học';
  }
};

export default function ResultsDetailScreen() {
  const insets = useSafeAreaInsets();
  const { streak, recentSessions, loading } = useProgress();
  const {
    words,
    totalQuestions,
    correctAnswers,
    startedAt,
    completedAt,
    sessionType,
    reset,
  } = useLearningSessionStore();

  const activeSession = useMemo(() => {
    if (words.length > 0) {
      return {
        type: sessionType,
        score: correctAnswers,
        totalQuestions,
        totalWords: words.length,
        duration: formatDuration(startedAt, completedAt),
      };
    }

    if (recentSessions[0]) {
      return {
        type: recentSessions[0].type,
        score: recentSessions[0].score,
        totalQuestions: recentSessions[0].totalQuestions,
        totalWords: recentSessions[0].totalWords,
        duration: formatDuration(recentSessions[0].startedAt, recentSessions[0].endedAt),
      };
    }

    return null;
  }, [completedAt, correctAnswers, recentSessions, sessionType, startedAt, totalQuestions, words.length]);

  const accuracy =
    activeSession && activeSession.totalQuestions > 0
      ? Math.round((activeSession.score / activeSession.totalQuestions) * 100)
      : 0;
  const xpEarned = activeSession ? activeSession.score * 10 + activeSession.totalWords * 5 : 0;
  const recentPreview = recentSessions.slice(0, 4);
  const restartRoute = activeSession?.type === 'cram' ? '/cram/setup' : '/learning';

  const handleGoHome = () => {
    reset();
    router.replace('/(tabs)');
  };

  const handleRestart = () => {
    reset();
    router.replace(restartRoute as '/learning' | '/cram/setup');
  };

  if (loading && !activeSession) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải kết quả...</Text>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  if (!activeSession) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)')}>
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kết quả</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có dữ liệu session</Text>
            <Text style={styles.emptyText}>
              Hãy bắt đầu một phiên học hoặc cram mode để xem màn tổng kết.
            </Text>
            <KineticButton onPress={() => router.replace('/learning')}>
              <KineticButtonText>Bắt đầu session mới</KineticButtonText>
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
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/progress')}>
          <Text style={styles.headerIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={kineticGradient} style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeIcon}>🏆</Text>
          </View>
          <Text style={styles.heroTitle}>Chúc mừng!</Text>
          <Text style={styles.heroSubtitle}>{getSessionTitle(activeSession.type)}</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📘</Text>
            <Text style={styles.statValue}>
              {activeSession.totalWords}/{activeSession.totalWords}
            </Text>
            <Text style={styles.statLabel}>Từ vựng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{activeSession.duration}</Text>
            <Text style={styles.statLabel}>Phút học</Text>
          </View>
          <View style={[styles.statCardWide, styles.statCardWideSoft]}>
            <Text style={styles.statWideEyebrow}>Điểm tích lũy</Text>
            <Text style={styles.statWideValue}>+{xpEarned} PTS</Text>
          </View>
        </View>

        <KineticGlassCard style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View>
              <Text style={styles.streakTitle}>Chuỗi học tập</Text>
              <Text style={styles.streakText}>Duy trì thói quen mỗi ngày để giữ nhịp.</Text>
            </View>
            <View style={styles.streakBadgeWrap}>
              <Text style={styles.streakBadgeValue}>{streak.current || 0}</Text>
              <Text style={styles.streakBadgeLabel}>Ngày liên tiếp</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Đúng: {activeSession.score}/{activeSession.totalQuestions}</Text>
            <Text style={styles.summaryItem}>Chính xác: {accuracy}%</Text>
            <Text style={styles.summaryItem}>Session: {activeSession.type}</Text>
          </View>
        </KineticGlassCard>

        <KineticGlassCard style={styles.recentCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Session gần đây</Text>
            <Text style={styles.sectionMeta}>{recentPreview.length} mục</Text>
          </View>
          <View style={styles.recentList}>
            {recentPreview.map((session) => (
              <View key={session.id} style={styles.recentRow}>
                <View style={styles.recentMain}>
                  <Text style={styles.recentTitle}>{session.type}</Text>
                  <Text style={styles.recentText}>
                    {session.correctAnswers}/{session.totalQuestions} câu • {session.totalWords} từ
                  </Text>
                </View>
                <Text style={styles.recentScore}>{session.score}</Text>
              </View>
            ))}
          </View>
        </KineticGlassCard>

        <View style={styles.actions}>
          <KineticButton onPress={handleGoHome}>
            <KineticButtonText>Về trang chủ</KineticButtonText>
          </KineticButton>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRestart}>
            <Text style={styles.secondaryButtonText}>
              {activeSession.type === 'cram' ? 'Cram tiếp' : 'Ôn tập thêm'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  emptyCard: {
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 2,
  },
  heroBadgeIcon: {
    fontSize: 46,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
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
    minHeight: 148,
    padding: 18,
    justifyContent: 'space-between',
    backgroundColor: kineticPalette.surfaceLowest,
    ...kineticShadow,
  },
  statCardWide: {
    width: '100%',
    borderRadius: 28,
    padding: 20,
    ...kineticShadow,
  },
  statCardWideSoft: {
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
  statWideEyebrow: {
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
  streakTop: {
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
  streakText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  streakBadgeWrap: {
    alignItems: 'center',
  },
  streakBadgeValue: {
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  streakBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: kineticPalette.tertiary,
    textTransform: 'uppercase',
  },
  summaryRow: {
    gap: 6,
  },
  summaryItem: {
    fontSize: 14,
    color: kineticPalette.onSurface,
  },
  recentCard: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  sectionMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  recentList: {
    gap: 10,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 16,
  },
  recentMain: {
    flex: 1,
    gap: 4,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
    textTransform: 'capitalize',
  },
  recentText: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  recentScore: {
    fontSize: 20,
    fontWeight: '900',
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
