import { useMemo, useState } from 'react';
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
import {
  type Trophy,
  useProgress,
  useTrophies,
} from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import { useAppStore } from '../../src/stores/appStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import {
  kineticGradient,
  kineticPalette,
  kineticShadow,
  kineticWarmGradient,
} from '../../src/theme/kinetic';

type TrophyFilter = 'all' | 'unlocked' | 'locked';

const FILTERS: Array<{ key: TrophyFilter; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unlocked', label: 'Đã đạt' },
  { key: 'locked', label: 'Chưa khóa' },
];

const getTrophyVisual = (trophy: Trophy) => {
  switch (trophy.milestoneType) {
    case 'streak_days':
      return {
        icon: '🔥',
        colors: kineticWarmGradient,
        background: kineticPalette.tertiaryFixed,
      };
    case 'words_mastered':
      return {
        icon: '🧠',
        colors: kineticGradient,
        background: kineticPalette.primaryFixed,
      };
    case 'words_learned':
      return {
        icon: '📚',
        colors: ['#57dffe', '#00687a'] as const,
        background: kineticPalette.secondaryFixed,
      };
    default:
      return {
        icon: '⏰',
        colors: kineticGradient,
        background: kineticPalette.primaryFixed,
      };
  }
};

const getMetricLabel = (trophy: Trophy) => {
  switch (trophy.milestoneType) {
    case 'streak_days':
      return 'ngày streak';
    case 'words_mastered':
      return 'từ đã thuộc';
    case 'words_learned':
      return 'từ đã học';
    default:
      return 'session';
  }
};

export default function TrophyCollectionScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [activeFilter, setActiveFilter] = useState<TrophyFilter>('all');
  const {
    streak,
    totalLearnedWords,
    totalMasteredWords,
    recentSessions,
  } = useProgress();
  const { trophies, loading, error, refetch } = useTrophies();

  const withProgress = useMemo(() => {
    return trophies.map((trophy) => {
      const currentValue =
        trophy.milestoneType === 'streak_days'
          ? streak.current
          : trophy.milestoneType === 'words_mastered'
            ? totalMasteredWords
            : trophy.milestoneType === 'words_learned'
              ? totalLearnedWords
              : recentSessions.length;
      const progress = trophy.unlocked
        ? 100
        : Math.min(100, Math.round((currentValue / Math.max(trophy.milestoneValue, 1)) * 100));
      const remaining = Math.max(trophy.milestoneValue - currentValue, 0);

      return {
        ...trophy,
        currentValue,
        progress,
        remaining,
      };
    });
  }, [recentSessions.length, streak.current, totalLearnedWords, totalMasteredWords, trophies]);

  const filteredTrophies = withProgress.filter((trophy) => {
    if (activeFilter === 'unlocked') {
      return trophy.unlocked;
    }
    if (activeFilter === 'locked') {
      return !trophy.unlocked;
    }
    return true;
  });

  const unlockedCount = withProgress.filter((trophy) => trophy.unlocked).length;
  const nextTrophy =
    withProgress
      .filter((trophy) => !trophy.unlocked)
      .sort((a, b) => b.progress - a.progress)[0] ||
    withProgress[0] ||
    null;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/progress')}>
            <Text style={styles.headerButtonIcon}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.brandText}>LexiWake</Text>
            <Text style={styles.headerTitle}>Huy hiệu</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.messageCard}>
            <Text style={styles.messageTitle}>Cần đăng nhập để xem bộ sưu tập huy hiệu</Text>
            <Text style={styles.messageText}>
              Thành tích của bạn được lấy từ progress backend và mở khóa theo streak, learned words và session count.
            </Text>
            <KineticButton onPress={() => router.replace('/(auth)/login')}>
              <KineticButtonText>Đăng nhập</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  if (loading && trophies.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải bộ sưu tập huy hiệu...</Text>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  if (error && trophies.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/progress')}>
            <Text style={styles.headerButtonIcon}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.brandText}>LexiWake</Text>
            <Text style={styles.headerTitle}>Huy hiệu</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.messageCard}>
            <Text style={styles.messageTitle}>Chưa tải được bộ sưu tập huy hiệu</Text>
            <Text style={styles.messageText}>
              API trophy đang chậm hoặc chưa phản hồi. Thử lại khi backend ổn định hơn.
            </Text>
            <KineticButton onPress={() => void refetch()}>
              <KineticButtonText>Thử lại</KineticButtonText>
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
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/progress')}>
          <Text style={styles.headerButtonIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.headerTitle}>Huy hiệu</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.headerButtonIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <KineticGlassCard style={styles.warningCard}>
            <Text style={styles.warningTitle}>Dữ liệu huy hiệu chưa mới nhất</Text>
            <Text style={styles.warningText}>
              Lần gọi gần nhất bị lỗi. Bạn có thể thử tải lại để lấy dữ liệu mới.
            </Text>
            <KineticButton style={styles.warningAction} onPress={() => void refetch()}>
              <KineticButtonText>Thử lại</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        ) : null}

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            Thành tích <Text style={styles.heroAccent}>Đỉnh cao.</Text>
          </Text>
          <Text style={styles.heroText}>
            Mỗi huy hiệu là một dấu mốc cho kỷ luật học tập. Màn này gom toàn bộ thành tích ra riêng thay vì chỉ hiển thị tóm tắt ở tab tiến độ.
          </Text>
        </View>

        {nextTrophy ? (
          <LinearGradient colors={getTrophyVisual(nextTrophy).colors} style={styles.highlightCard}>
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeIcon}>{getTrophyVisual(nextTrophy).icon}</Text>
            </View>
            <Text style={styles.highlightTitle}>{nextTrophy.title}</Text>
            <Text style={styles.highlightText}>{nextTrophy.description}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${nextTrophy.progress}%` }]} />
            </View>
            <Text style={styles.highlightMeta}>
              {nextTrophy.unlocked
                ? 'Đã mở khóa'
                : `Còn ${nextTrophy.remaining} ${getMetricLabel(nextTrophy)} để đạt mốc này`}
            </Text>
          </LinearGradient>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Đã mở khóa</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{withProgress.length}</Text>
            <Text style={styles.statLabel}>Tổng huy hiệu</Text>
          </View>
          <View style={[styles.statCard, styles.statWarm]}>
            <Text style={styles.statValueWarm}>{streak.current}</Text>
            <Text style={styles.statLabelWarm}>Ngày streak</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={active ? styles.filterChipActive : styles.filterChip}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={active ? styles.filterChipTextActive : styles.filterChipText}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.grid}>
          {filteredTrophies.map((trophy) => {
            const visual = getTrophyVisual(trophy);

            return (
              <View key={trophy.id} style={[styles.trophyCard, !trophy.unlocked && styles.trophyCardLocked]}>
                {trophy.unlocked ? (
                  <LinearGradient colors={visual.colors} style={styles.trophyBadge}>
                    <Text style={styles.trophyBadgeIcon}>{visual.icon}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.trophyBadge, styles.trophyBadgeLocked, { backgroundColor: visual.background }]}>
                    <Text style={styles.trophyBadgeIconLocked}>🔒</Text>
                  </View>
                )}
                <Text style={[styles.trophyTitle, !trophy.unlocked && styles.trophyTitleLocked]}>
                  {trophy.title}
                </Text>
                <Text style={[styles.trophyDesc, !trophy.unlocked && styles.trophyDescLocked]}>
                  {trophy.description}
                </Text>
                <Text style={[styles.trophyMeta, !trophy.unlocked && styles.trophyMetaLocked]}>
                  {trophy.unlocked
                    ? 'Đã mở khóa'
                    : `${trophy.currentValue}/${trophy.milestoneValue} ${getMetricLabel(trophy)}`}
                </Text>
              </View>
            );
          })}
        </View>

        <LinearGradient colors={kineticGradient} style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Giữ nhịp để mở khóa mốc kế tiếp</Text>
          <Text style={styles.ctaText}>
            Tiếp tục học đều mỗi ngày để kéo streak lên và biến những huy hiệu đang khóa thành tiến độ thực.
          </Text>
          <KineticButton variant="glass" onPress={() => router.push('/progress/streak')}>
            <KineticButtonText variant="secondary">Xem streak</KineticButtonText>
          </KineticButton>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
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
  headerSpacer: {
    width: 42,
    height: 42,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    color: kineticPalette.primary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  messageCard: {
    gap: 12,
  },
  messageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: kineticPalette.onSurfaceVariant,
  },
  warningCard: {
    gap: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  warningAction: {
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 18,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  heroAccent: {
    color: kineticPalette.primary,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  highlightCard: {
    borderRadius: 30,
    padding: 24,
    gap: 14,
    ...kineticShadow,
  },
  highlightBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBadgeIcon: {
    fontSize: 36,
  },
  highlightTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
  },
  highlightText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  highlightMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    gap: 6,
    ...kineticShadow,
  },
  statWarm: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  statValueWarm: {
    fontSize: 28,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statLabelWarm: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.tertiaryContainer,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceLowest,
  },
  filterChipActive: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  filterChipTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trophyCard: {
    width: '48%',
    borderRadius: 28,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    backgroundColor: kineticPalette.surfaceLowest,
    ...kineticShadow,
  },
  trophyCardLocked: {
    backgroundColor: kineticPalette.surfaceLow,
  },
  trophyBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBadgeLocked: {
    opacity: 0.5,
  },
  trophyBadgeIcon: {
    fontSize: 36,
  },
  trophyBadgeIconLocked: {
    fontSize: 30,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
    textAlign: 'center',
  },
  trophyTitleLocked: {
    color: kineticPalette.onSurfaceVariant,
  },
  trophyDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
    textAlign: 'center',
  },
  trophyDescLocked: {
    color: kineticPalette.outline,
  },
  trophyMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  trophyMetaLocked: {
    color: kineticPalette.outline,
  },
  ctaCard: {
    borderRadius: 28,
    padding: 24,
    gap: 10,
    ...kineticShadow,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  ctaText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
});
