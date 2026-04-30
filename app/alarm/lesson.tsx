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
import { router, useLocalSearchParams } from 'expo-router';
import { useWords } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette, kineticShadow } from '../../src/theme/kinetic';

export default function AlarmLessonDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deckId?: string | string[];
    deckName?: string | string[];
    lessonId?: string | string[];
    lessonName?: string | string[];
    backTo?: string | string[];
  }>();

  const deckId = useMemo(
    () => (Array.isArray(params.deckId) ? params.deckId[0] : params.deckId) || '',
    [params.deckId]
  );
  const deckName = useMemo(
    () => (Array.isArray(params.deckName) ? params.deckName[0] : params.deckName) || 'Bộ học',
    [params.deckName]
  );
  const lessonId = useMemo(
    () => (Array.isArray(params.lessonId) ? params.lessonId[0] : params.lessonId) || '',
    [params.lessonId]
  );
  const lessonName = useMemo(
    () => (Array.isArray(params.lessonName) ? params.lessonName[0] : params.lessonName) || 'Bài học',
    [params.lessonName]
  );
  const backTo = useMemo(
    () => (Array.isArray(params.backTo) ? params.backTo[0] : params.backTo) || '/alarm/create',
    [params.backTo]
  );

  const { words, loading } = useWords({
    limit: 200,
    deckId,
    lessonDeckIds: lessonId ? [lessonId] : [],
    enabled: Boolean(deckId && lessonId),
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace(backTo as any)}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>{deckName}</Text>
          <Text style={styles.headerTitle}>{lessonName}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Alarm Scope</Text>
          <Text style={styles.heroTitle}>{lessonName}</Text>
          <Text style={styles.heroText}>
            Xem trước toàn bộ từ trong bài học này trước khi quay lại màn báo thức để chọn phạm vi học.
          </Text>
          <View style={styles.heroMetaCard}>
            <Text style={styles.heroMetaValue}>{words.length}</Text>
            <Text style={styles.heroMetaLabel}>Số từ trong bài học</Text>
          </View>
        </KineticGlassCard>

        {loading ? (
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách từ của bài học...</Text>
          </KineticGlassCard>
        ) : (
          <View style={styles.wordList}>
            {words.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={styles.wordCard}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: '/library/word', params: { id: word.id } })}
              >
                <View style={styles.wordMain}>
                  <Text style={styles.wordText}>{word.word}</Text>
                  <Text style={styles.meaningText}>{word.meaning}</Text>
                </View>
                <Text style={styles.wordMeta}>{word.status}</Text>
              </TouchableOpacity>
            ))}

            {!loading && words.length === 0 ? (
              <KineticGlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Bài học này chưa có dữ liệu</Text>
                <Text style={styles.emptyText}>Kiểm tra lại dữ liệu bộ từ hoặc bài học tương ứng trong backend.</Text>
              </KineticGlassCard>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton onPress={() => goBackOrReplace(backTo as any)}>
          <KineticButtonText>Quay lại màn báo thức</KineticButtonText>
        </KineticButton>
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
  headerTitleWrap: {
    alignItems: 'center',
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
  },
  heroCard: {
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  heroMetaCard: {
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 16,
    gap: 4,
    ...kineticShadow,
  },
  heroMetaValue: {
    fontSize: 26,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  heroMetaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  wordList: {
    gap: 10,
  },
  wordCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...kineticShadow,
  },
  wordMain: {
    flex: 1,
    gap: 4,
  },
  wordText: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  meaningText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  wordMeta: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  emptyCard: {
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    paddingTop: 12,
    backgroundColor: 'rgba(248,249,250,0.9)',
  },
});
