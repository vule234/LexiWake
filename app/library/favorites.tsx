import { useMemo, useState } from 'react';
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
import { wordApi } from '../../src/lib/api';
import { type Word, useProfile, useWords } from '../../src/lib/hooks';
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

const getStatusLabel = (status: Word['status']) => {
  switch (status) {
    case 'mastered':
      return 'Đã thuộc';
    case 'learning':
      return 'Đang học';
    case 'review':
      return 'Cần ôn';
    case 'lapsed':
      return 'Quên lại';
    default:
      return 'Từ mới';
  }
};

const getStatusTone = (status: Word['status']) => {
  switch (status) {
    case 'mastered':
      return { background: '#dcfce7', text: '#166534' };
    case 'learning':
      return { background: '#fef3c7', text: '#92400e' };
    case 'review':
    case 'lapsed':
      return { background: '#fee2e2', text: '#b91c1c' };
    default:
      return { background: kineticPalette.primaryFixed, text: kineticPalette.primary };
  }
};

export default function FavoriteWordsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deckId?: string | string[];
    lessonDeckIds?: string | string[];
    replaceUnfinished?: string | string[];
  }>();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { profile } = useProfile();
  const requestedDeckId =
    (Array.isArray(params.deckId) ? params.deckId[0] : params.deckId) || profile.activeDeckId;
  const requestedLessonDeckIds = (
    (Array.isArray(params.lessonDeckIds) ? params.lessonDeckIds[0] : params.lessonDeckIds) ||
    profile.activeLessonDeckIds.join(',')
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const replaceUnfinished =
    (Array.isArray(params.replaceUnfinished) ? params.replaceUnfinished[0] : params.replaceUnfinished) || '';
  const { words, loading, fetchWords } = useWords({
    limit: 100,
    deckId: requestedDeckId,
    lessonDeckIds: requestedLessonDeckIds,
    enabled: !requestedDeckId || requestedLessonDeckIds.length > 0,
  });
  const [pendingWordId, setPendingWordId] = useState<string | null>(null);

  const favoriteWords = useMemo(() => words.filter((word) => word.isFavorite), [words]);
  const featuredWord = favoriteWords[0] || null;
  const reviewCount = favoriteWords.filter((word) => word.status === 'review').length;

  const handleToggleFavorite = async (wordId: string) => {
    if (!isAuthenticated || isGuest) {
      router.push('/(auth)/login');
      return;
    }

    try {
      setPendingWordId(wordId);
      await wordApi.favorite(wordId);
      await fetchWords();
    } catch (error) {
      Alert.alert('Không thể cập nhật yêu thích', 'Vui lòng thử lại sau.');
    } finally {
      setPendingWordId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/library')}>
          <Text style={styles.headerButtonIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.headerTitle}>Yêu thích</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.headerButtonIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {favoriteWords.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.emptyContent, { paddingBottom: insets.bottom + 132 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyIllustrationWrap}>
            <View style={styles.emptyOrbPrimary} />
            <View style={styles.emptyOrbSecondary} />
            <View style={styles.emptyIllustrationCard}>
              <Text style={styles.emptyHeart}>♡</Text>
              <Text style={styles.emptyBook}>📘</Text>
              <Text style={styles.emptySpark}>✦</Text>
            </View>
          </View>

          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>
              {isAuthenticated && !isGuest
                ? 'Bạn chưa có từ vựng yêu thích nào'
                : 'Đăng nhập để đồng bộ từ yêu thích'}
            </Text>
            <Text style={styles.emptyText}>
              {isAuthenticated && !isGuest
                ? 'Lưu lại những từ quan trọng để chúng xuất hiện nhanh hơn trong các buổi ôn tập và alarm session.'
                : 'Từ yêu thích được lưu theo tài khoản. Sau khi đăng nhập, bạn có thể ghim từ từ màn chi tiết hoặc thư viện.'}
            </Text>
          </View>

          <View style={styles.emptyActions}>
            <KineticButton onPress={() => router.push(isAuthenticated ? '/(tabs)/library' : '/(auth)/login')}>
              <KineticButtonText>
                {isAuthenticated ? 'Khám phá thư viện' : 'Đăng nhập'}
              </KineticButtonText>
            </KineticButton>
            <TouchableOpacity style={styles.secondaryLink} onPress={() => router.replace('/(tabs)/library')}>
              <Text style={styles.secondaryLinkText}>Quay lại thư viện</Text>
            </TouchableOpacity>
          </View>

            <KineticGlassCard style={styles.suggestionSection}>
            <Text style={styles.sectionEyebrow}>Gợi ý cho bạn</Text>
            <Text style={styles.sectionTitle}>Chọn một phạm vi học</Text>
            <Text style={styles.wordMeta}>Mở Thư viện để chọn bộ từ và bài học trước khi lọc danh sách yêu thích.</Text>
          </KineticGlassCard>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Bộ sưu tập</Text>
            <Text style={styles.heroTitle}>
              Từ vựng <Text style={styles.heroAccent}>Yêu thích</Text>
            </Text>
            <Text style={styles.heroText}>
              Bạn đã lưu {favoriteWords.length} từ quan trọng để ôn tập nhanh hơn trong alarm flow và review session.
            </Text>
          </View>

          {featuredWord ? (
            <LinearGradient colors={kineticWarmGradient} style={styles.featuredCard}>
              <View style={styles.featuredTopRow}>
                <Text style={styles.featuredLabel}>Từ vựng gần đây</Text>
                <Text style={styles.featuredIcon}>♥</Text>
              </View>
              <View style={styles.featuredWordBlock}>
                <Text style={styles.featuredWord}>{featuredWord.word}</Text>
                <Text style={styles.featuredMeaning}>{featuredWord.meaning}</Text>
              </View>
              <View style={styles.featuredExampleCard}>
                <Text style={styles.featuredExample}>
                  {featuredWord.example || 'Lưu từ này để đưa nó vào những lần ôn tập tiếp theo.'}
                </Text>
              </View>
            </LinearGradient>
          ) : null}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardLarge]}>
              <Text style={styles.statValue}>{favoriteWords.length}</Text>
              <Text style={styles.statLabel}>Từ đã ghim</Text>
              <Text style={styles.statHint}>Sẵn sàng cho review flow</Text>
            </View>
            <View style={styles.statStack}>
              <View style={styles.statSmallCard}>
                <Text style={styles.statValuePrimary}>1</Text>
                <Text style={styles.statLabel}>Bộ từ</Text>
              </View>
              <View style={[styles.statSmallCard, styles.statSmallCardWarm]}>
                <Text style={styles.statValueWarm}>{reviewCount}</Text>
                <Text style={styles.statLabelWarm}>Cần ôn</Text>
              </View>
            </View>
          </View>

          <View style={styles.listSection}>
            {favoriteWords.map((word) => {
              const tone = getStatusTone(word.status);
              const pending = pendingWordId === word.id;

              return (
                <TouchableOpacity
                  key={word.id}
                  activeOpacity={0.92}
                  style={styles.wordCard}
                  onPress={() => router.push({ pathname: '/library/word', params: { id: word.id } })}
                >
                  <View style={styles.wordMain}>
                    <View style={styles.wordHeader}>
                      <Text style={styles.wordText}>{word.word}</Text>
                      <TouchableOpacity
                        disabled={pending}
                        style={styles.favoriteButton}
                        onPress={() => handleToggleFavorite(word.id)}
                      >
                        <Text style={styles.favoriteButtonText}>{pending ? '…' : '♥'}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.wordMeaning}>{word.meaning}</Text>
                <Text style={styles.wordMeta}>{word.lessonName || 'Trong phạm vi học hiện tại'}</Text>
              </View>
                  <View style={[styles.statusBadge, { backgroundColor: tone.background }]}>
                    <Text style={[styles.statusText, { color: tone.text }]}>
                      {getStatusLabel(word.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <LinearGradient colors={kineticGradient} style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Bắt đầu ôn tập ngay?</Text>
            <Text style={styles.ctaText}>
              Luyện với các từ bạn đã ghim để tăng nhớ lâu và đẩy mastery score lên nhanh hơn.
            </Text>
            <KineticButton
              variant="glass"
              onPress={() =>
                router.push({
                  pathname: '/library/review',
                  params: {
                    deckId: requestedDeckId || '',
                    lessonDeckIds: requestedLessonDeckIds.join(','),
                    ...(replaceUnfinished ? { replaceUnfinished } : {}),
                  },
                })
              }
            >
              <KineticButtonText variant="secondary">Học ngay</KineticButtonText>
            </KineticButton>
          </LinearGradient>
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
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'space-between',
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
  headerTitleWrap: {
    alignItems: 'center',
    gap: 2,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
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
  heroEyebrow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  heroAccent: {
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  featuredCard: {
    borderRadius: 30,
    padding: 24,
    gap: 18,
    ...kineticShadow,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.tertiaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredIcon: {
    fontSize: 22,
    color: kineticPalette.tertiaryContainer,
  },
  featuredWordBlock: {
    gap: 4,
  },
  featuredWord: {
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  featuredMeaning: {
    fontSize: 18,
    color: kineticPalette.onSurfaceVariant,
    fontWeight: '600',
  },
  featuredExampleCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    padding: 16,
  },
  featuredExample: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurface,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    borderRadius: 26,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    ...kineticShadow,
  },
  statCardLarge: {
    flex: 1,
    gap: 6,
  },
  statStack: {
    width: 132,
    gap: 12,
  },
  statSmallCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 6,
    ...kineticShadow,
  },
  statSmallCardWarm: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  statValuePrimary: {
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
  },
  statLabelWarm: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.tertiaryContainer,
    textTransform: 'uppercase',
  },
  statHint: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  listSection: {
    gap: 12,
  },
  wordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 12,
    ...kineticShadow,
  },
  wordMain: {
    flex: 1,
    gap: 6,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  wordText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  wordMeaning: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  wordMeta: {
    fontSize: 13,
    color: kineticPalette.outline,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonText: {
    fontSize: 20,
    color: kineticPalette.primary,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    color: 'rgba(255,255,255,0.8)',
  },
  emptyContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 24,
  },
  emptyIllustrationWrap: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOrbPrimary: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(226, 223, 255, 0.85)',
    top: 18,
    left: 12,
  },
  emptyOrbSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(172, 237, 255, 0.36)',
    right: 24,
    bottom: 24,
  },
  emptyIllustrationCard: {
    width: 232,
    height: 232,
    borderRadius: 34,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...kineticShadow,
  },
  emptyHeart: {
    fontSize: 108,
    color: kineticPalette.primaryFixedDim,
    lineHeight: 112,
  },
  emptyBook: {
    position: 'absolute',
    fontSize: 46,
    color: kineticPalette.primary,
  },
  emptySpark: {
    position: 'absolute',
    top: 38,
    right: 42,
    fontSize: 24,
    color: kineticPalette.secondary,
  },
  emptyCopy: {
    gap: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: kineticPalette.onSurface,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    lineHeight: 25,
    color: kineticPalette.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyActions: {
    width: '100%',
    gap: 14,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: kineticPalette.primary,
  },
  suggestionSection: {
    width: '100%',
    gap: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.secondary,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  topicGrid: {
    gap: 12,
  },
  topicCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 10,
  },
  topicIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: kineticPalette.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicIconWrapSecondary: {
    backgroundColor: kineticPalette.secondaryFixed,
  },
  topicIconWrapWarm: {
    backgroundColor: kineticPalette.tertiaryFixed,
  },
  topicIcon: {
    fontSize: 22,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  topicMeta: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
});
