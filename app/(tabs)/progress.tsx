import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProgress, useTrophies } from '../../src/lib/hooks';
import { useAppStore } from '../../src/stores/appStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const {
    totalLearnedWords,
    totalMasteredWords,
    streak,
    accuracyRate,
    weeklyActivity,
    favoriteCount,
    loading,
  } = useProgress();
  const {
    trophies,
    loading: trophyLoading,
    error: trophyError,
    refetch: refetchTrophies,
  } = useTrophies();

  const maxWords = Math.max(...weeklyActivity.map((item) => item.words), 1);
  const unlockedTrophies = trophies.filter((trophy) => trophy.unlocked);
  const nextMilestone = Math.max(5, Math.ceil((streak.current + 1) / 5) * 5);
  const milestonePercent = nextMilestone > 0 ? Math.min(100, Math.round((streak.current / nextMilestone) * 100)) : 0;
  const trophyHeadline = trophyLoading ? '...' : trophyError ? '--' : String(unlockedTrophies.length);
  const trophyMeta = trophyError ? 'Chưa tải được' : `${unlockedTrophies.length}/${trophies.length} đã mở khóa`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.topAppBar}>
        <View>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.title}>Tiến độ của bạn</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.headerButtonIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {!isAuthenticated ? (
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.messageCard}>
            <Text style={styles.messageTitle}>Cần đăng nhập để xem tiến độ</Text>
            <Text style={styles.messageText}>
              Sau khi đăng nhập, màn này sẽ lấy streak, weekly activity và trophies từ backend.
            </Text>
            <KineticButton onPress={() => router.replace('/(auth)/login')}>
              <KineticButtonText>Đăng nhập</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        </View>
      ) : loading ? (
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải tiến độ...</Text>
          </KineticGlassCard>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={kineticGradient} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroEyebrow}>Learning Momentum</Text>
                <Text style={styles.heroTitle}>{streak.current} ngày</Text>
                <Text style={styles.heroSubtitle}>Chuỗi học hiện tại của bạn đang giữ nhịp rất ổn.</Text>
              </View>
              <View style={styles.heroFlameWrap}>
                <Text style={styles.heroFlame}>🔥</Text>
              </View>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{totalLearnedWords}</Text>
                <Text style={styles.heroStatLabel}>Learned</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{accuracyRate}%</Text>
                <Text style={styles.heroStatLabel}>Accuracy</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{trophyHeadline}</Text>
                <Text style={styles.heroStatLabel}>Trophies</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statWideCard]}>
              <Text style={styles.statEyebrow}>Mốc tiếp theo</Text>
              <Text style={styles.statHeadline}>{nextMilestone} ngày</Text>
              <Text style={styles.statSubtext}>Còn {Math.max(nextMilestone - streak.current, 0)} ngày để chạm mốc kế tiếp.</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${milestonePercent}%` }]} />
              </View>
            </View>

            <View style={styles.statMiniCard}>
              <Text style={styles.statMiniValue}>{totalMasteredWords}</Text>
              <Text style={styles.statMiniLabel}>Đã thuộc</Text>
            </View>

            <View style={[styles.statMiniCard, styles.statMiniCardWarm]}>
              <Text style={styles.statMiniValueWarm}>{favoriteCount}</Text>
              <Text style={styles.statMiniLabelWarm}>Yêu thích</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.streakDetailCard} onPress={() => router.push('/progress/streak')}>
            <View style={styles.streakDetailMain}>
              <Text style={styles.streakDetailTitle}>Chi tiết streak</Text>
              <Text style={styles.streakDetailText}>
                Xem tiến trình 7 ngày, nhịp học gần đây và động lực để tiếp tục.
              </Text>
            </View>
            <Text style={styles.streakDetailArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.weeklySection}>
            <Text style={styles.sectionTitle}>7 ngày gần đây</Text>
            <View style={styles.weeklyCard}>
              {weeklyActivity.map((item) => (
                <View key={item.date} style={styles.dayColumn}>
                  <View style={styles.barBase}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: Math.max(10, Math.round((item.words / maxWords) * 88)),
                          backgroundColor: item.completed ? kineticPalette.primary : kineticPalette.surfaceHigh,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, item.completed && styles.dayLabelActive]}>{item.day}</Text>
                  <Text style={styles.dayMeta}>{item.words}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.trophySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Huy hiệu</Text>
                <Text style={styles.sectionMeta}>{trophyMeta}</Text>
              </View>
              <TouchableOpacity style={styles.sectionLinkButton} onPress={() => router.push('/progress/trophies')}>
                <Text style={styles.sectionLinkText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            {trophyLoading ? (
              <KineticGlassCard style={styles.inlineLoadingCard}>
                <ActivityIndicator size="small" color={kineticPalette.primary} />
                <Text style={styles.inlineLoadingText}>Đang tải huy hiệu...</Text>
              </KineticGlassCard>
            ) : trophyError ? (
              <KineticGlassCard style={styles.inlineErrorCard}>
                <Text style={styles.inlineErrorTitle}>Chưa tải được huy hiệu</Text>
                <Text style={styles.inlineErrorText}>
                  Request trophy bị timeout. Bạn vẫn xem được phần tiến độ khác, và có thể thử lại ngay tại đây.
                </Text>
                <KineticButton style={styles.inlineRetryButton} onPress={() => void refetchTrophies()}>
                  <KineticButtonText>Thử lại</KineticButtonText>
                </KineticButton>
              </KineticGlassCard>
            ) : (
              <View style={styles.trophyGrid}>
                {trophies.map((trophy) => (
                  <View
                    key={trophy.id}
                    style={[styles.trophyCard, !trophy.unlocked && styles.trophyCardLocked]}
                  >
                    <View style={[styles.trophyIconWrap, !trophy.unlocked && styles.trophyIconWrapLocked]}>
                      <Text style={styles.trophyIcon}>{trophy.unlocked ? '🏆' : '🔒'}</Text>
                    </View>
                    <Text style={[styles.trophyTitle, !trophy.unlocked && styles.trophyTitleLocked]}>
                      {trophy.title}
                    </Text>
                    <Text style={[styles.trophyDesc, !trophy.unlocked && styles.trophyDescLocked]}>
                      {trophy.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    color: kineticPalette.primary,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonIcon: {
    fontSize: 16,
    color: kineticPalette.outline,
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
  inlineLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineLoadingText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  inlineErrorCard: {
    gap: 12,
  },
  inlineErrorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  inlineErrorText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  inlineRetryButton: {
    alignSelf: 'stretch',
  },
  loadingText: {
    fontSize: 15,
    color: kineticPalette.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 132,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    gap: 18,
    ...kineticShadow,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.76)',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 6,
    maxWidth: '78%',
  },
  heroFlameWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFlame: {
    fontSize: 34,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    ...kineticShadow,
  },
  statWideCard: {
    width: '100%',
    minHeight: 146,
    justifyContent: 'space-between',
  },
  statMiniCard: {
    width: '48%',
    minHeight: 118,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 18,
    justifyContent: 'space-between',
  },
  statMiniCardWarm: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  statEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statHeadline: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.primaryContainer,
  },
  statSubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: kineticPalette.primary,
  },
  statMiniValue: {
    fontSize: 32,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  statMiniValueWarm: {
    fontSize: 32,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  statMiniLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statMiniLabelWarm: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.tertiaryContainer,
    textTransform: 'uppercase',
  },
  streakDetailCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...kineticShadow,
  },
  streakDetailMain: {
    flex: 1,
    gap: 4,
  },
  streakDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  streakDetailText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  streakDetailArrow: {
    fontSize: 24,
    color: kineticPalette.outline,
  },
  weeklySection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  sectionLinkButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
  },
  sectionLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  weeklyCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 172,
    ...kineticShadow,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barBase: {
    width: '100%',
    height: 92,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 22,
    borderRadius: 999,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: kineticPalette.outline,
  },
  dayLabelActive: {
    color: kineticPalette.primary,
  },
  dayMeta: {
    fontSize: 11,
    color: kineticPalette.outline,
  },
  trophySection: {
    gap: 12,
  },
  trophyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trophyCard: {
    width: '48%',
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 10,
    ...kineticShadow,
  },
  trophyCardLocked: {
    backgroundColor: kineticPalette.surfaceLow,
  },
  trophyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: kineticPalette.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyIconWrapLocked: {
    backgroundColor: kineticPalette.surfaceHigh,
  },
  trophyIcon: {
    fontSize: 24,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  trophyTitleLocked: {
    color: kineticPalette.onSurfaceVariant,
  },
  trophyDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  trophyDescLocked: {
    color: kineticPalette.outline,
  },
});
