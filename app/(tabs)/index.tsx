import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAlarms, useDecks, useProfile, useProgress, useUnfinishedLearningSession } from '../../src/lib/hooks';
import { formatNextAlarmOccurrence, getNextAlarmOccurrence } from '../../src/lib/alarmSchedule';
import { useAppStore } from '../../src/stores/appStore';
import { KineticBackdrop, KineticButton, KineticButtonText, KineticGlassCard } from '../../src/components/ui/KineticPrimitives';
import { openAiAgent } from '../../src/features/ai-agent/store';
import { kineticPalette, kineticShadow } from '../../src/theme/kinetic';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const nextAlarm = useAppStore((state) => state.nextAlarm);
  const { profile } = useProfile();
  const { decks } = useDecks();
  const { streak, newWordsToday, reviewWordsToday, loading: progressLoading } = useProgress();
  const { session: unfinishedSession } = useUnfinishedLearningSession();

  useAlarms();

  const isLoading = isAuthenticated && !isGuest && progressLoading;
  const displayName = profile.fullName || 'bạn';
  const activeDeck = decks.find((deck) => deck.id === profile.activeDeckId) || null;
  const nextAlarmOccurrenceLabel = formatNextAlarmOccurrence(getNextAlarmOccurrence(nextAlarm as any));
  const activeScopeLabel = activeDeck
    ? `${activeDeck.name} • ${profile.activeLessonDeckIds.length || activeDeck.lessonCount || 0} bài học`
    : 'Chưa chọn bộ từ đang học';
  const subtitle = isGuest
    ? 'Bạn đang ở chế độ khách. Có thể xem thư viện công khai và khám phá giao diện trước khi tạo tài khoản.'
    : isAuthenticated
      ? 'Sẵn sàng cho một ngày học tập hứng khởi chưa?'
      : 'Đăng nhập để đồng bộ alarm, tiến độ và thư viện từ vựng.';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

        <View style={styles.topAppBar}>
          <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/lexiwake-mark.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>LexiWake</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.profileText}>
            {(displayName.trim()[0] || 'V').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isAuthenticated ? `Chào buổi sáng, ${displayName}!` : 'Chào mừng đến LexiWake'}
          </Text>
          <Text style={styles.welcomeSubtitle}>{subtitle}</Text>
          {isAuthenticated && !isGuest ? (
            <Text style={styles.activeDeckText}>Bộ từ đang học: {activeScopeLabel}</Text>
          ) : null}
        </View>

        {unfinishedSession?.sessionId && !isGuest && isAuthenticated ? (
          <KineticGlassCard style={styles.resumeCard}>
            <View style={styles.resumeMain}>
              <Text style={styles.resumeEyebrow}>Đang học dở</Text>
              <Text style={styles.resumeTitle}>{unfinishedSession.deckName || 'Phiên học chưa hoàn thành'}</Text>
              <Text style={styles.resumeText}>
                {unfinishedSession.phase === 'quiz' ? 'Đang ở vòng quiz' : 'Đang ở vòng flashcard'} • còn {unfinishedSession.remainingCount} mục.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resumeButton}
              activeOpacity={0.92}
              onPress={() =>
                router.push({
                  pathname: '/learning',
                  params: { resumeSessionId: unfinishedSession.sessionId },
                })
              }
            >
              <Text style={styles.resumeButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
          </KineticGlassCard>
        ) : null}

        {isLoading ? (
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu học tập...</Text>
          </KineticGlassCard>
        ) : (
          <View style={styles.bentoGrid}>
            <KineticGlassCard style={styles.streakCard}>
              <View style={styles.streakMain}>
                <Text style={styles.streakLabel}>Chuỗi học tập</Text>
                <View style={styles.streakNumberRow}>
                  <Text style={styles.streakNumber}>{streak.current}</Text>
                  <Text style={styles.streakUnit}>ngày</Text>
                </View>
              </View>
              <View style={styles.streakTrophy}>
                <Text style={styles.streakTrophyIcon}>🏆</Text>
              </View>
              <View style={styles.streakDecor} />
            </KineticGlassCard>

            <Link href={isGuest ? '/(auth)/register' : isAuthenticated ? '/alarm' : '/(auth)/login'} asChild>
              <TouchableOpacity style={styles.alarmCard} activeOpacity={0.92}>
                <View style={styles.alarmIconWrap}>
                  <Text style={styles.alarmIcon}>⏰</Text>
                </View>
                <View style={styles.alarmContent}>
                  <Text style={styles.alarmLabel}>Báo thức tiếp theo</Text>
                  <Text style={styles.alarmTime}>{nextAlarm?.time || '--:--'}</Text>
                  <Text style={styles.alarmDeck}>
                    {nextAlarm?.title || (isGuest ? 'Tạo tài khoản để đồng bộ alarm' : 'Chưa có báo thức hoạt động')}
                  </Text>
                  {nextAlarm ? <Text style={styles.alarmMeta}>{nextAlarmOccurrenceLabel}</Text> : null}
                </View>
                <Text style={styles.alarmChevron}>›</Text>
              </TouchableOpacity>
            </Link>

            <View style={styles.statsRow}>
              <TouchableOpacity
                style={[styles.statCard, styles.statCardHalf]}
                activeOpacity={0.9}
                onPress={() => router.push(isGuest ? '/(auth)/register' : isAuthenticated ? '/library/new' : '/(auth)/login')}
              >
                <Text style={styles.statValue}>{newWordsToday}</Text>
                <Text style={styles.statLabel}>Từ mới</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statCard, styles.statCardHalf]}
                activeOpacity={0.9}
                onPress={() => router.push(isGuest ? '/(auth)/register' : isAuthenticated ? '/library/review' : '/(auth)/login')}
              >
                <Text style={styles.statValue}>{reviewWordsToday}</Text>
                <Text style={styles.statLabel}>Cần ôn</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.ctaSection}>
          <KineticButton onPress={() => router.push(isGuest ? '/(tabs)/library' : isAuthenticated ? '/learning' : '/(auth)/login')}>
            <KineticButtonText>
              {isGuest ? 'Khám phá thư viện công khai' : isAuthenticated ? 'Tiếp tục học' : 'Đăng nhập để học'}
            </KineticButtonText>
            <Text style={styles.ctaPrimaryIcon}>▶</Text>
          </KineticButton>

          <KineticButton
            variant="secondary"
            onPress={() =>
              isGuest || !isAuthenticated
                ? router.push('/(auth)/login')
                : openAiAgent({ prompt: 'Nên học gì tiếp theo hôm nay?', sheetMode: 'full' })
            }
          >
            <KineticButtonText variant="secondary">Trợ lý học tập</KineticButtonText>
          </KineticButton>

          <KineticButton variant="secondary" onPress={() => router.push('/cram/setup')}>
            <KineticButtonText variant="secondary">Ôn nhanh</KineticButtonText>
          </KineticButton>
        </View>

        <View style={styles.imageSection}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
            }}
            style={styles.aestheticImage}
          />
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.primaryContainer,
    letterSpacing: -0.4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLowest,
    borderWidth: 2,
    borderColor: kineticPalette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 132,
  },
  welcomeSection: {
    marginBottom: 24,
    gap: 8,
  },
  welcomeTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: kineticPalette.onSurface,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
    fontWeight: '500',
  },
  activeDeckText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.primary,
    fontWeight: '700',
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
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  resumeMain: {
    flex: 1,
    gap: 4,
  },
  resumeEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  resumeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  resumeText: {
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  resumeButton: {
    minWidth: 96,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: kineticPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  resumeButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  bentoGrid: {
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 221, 184, 0.5)',
    overflow: 'hidden',
  },
  streakMain: {
    zIndex: 1,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.tertiary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  streakNumber: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  streakUnit: {
    fontSize: 20,
    fontWeight: '800',
    color: kineticPalette.tertiaryContainer,
    marginBottom: 6,
  },
  streakTrophy: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: kineticPalette.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTrophyIcon: {
    fontSize: 34,
  },
  streakDecor: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -30,
    bottom: -50,
    backgroundColor: 'rgba(104,64,0,0.08)',
  },
  alarmCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...kineticShadow,
  },
  alarmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(79,70,229,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmIcon: {
    fontSize: 28,
  },
  alarmContent: {
    flex: 1,
    gap: 2,
  },
  alarmLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  alarmDeck: {
    fontSize: 13,
    color: kineticPalette.primary,
    fontWeight: '700',
  },
  alarmMeta: {
    fontSize: 12,
    color: kineticPalette.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  alarmChevron: {
    fontSize: 24,
    color: kineticPalette.outline,
  },
  statCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 18,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  statCardHalf: {
    flex: 1,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  ctaSection: {
    gap: 12,
    marginTop: 28,
  },
  ctaPrimaryIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  imageSection: {
    marginTop: 24,
  },
  aestheticImage: {
    width: '100%',
    height: 180,
    borderRadius: 28,
    opacity: 0.42,
  },
});
