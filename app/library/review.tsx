import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { learningApi } from '../../src/lib/api';
import { useProfile } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

type ReviewMode = 'all' | 'urgent';

type ReviewWord = {
  id: string;
  word: string;
  meaning?: string;
  meaningVi?: string;
  deckName?: string;
  overdueDays?: number;
};

type ReviewDashboard = {
  words: ReviewWord[];
  activeDeck?: {
    id?: string;
    name?: string;
  } | null;
  groups?: {
    all?: ReviewWord[];
    urgent?: ReviewWord[];
  };
  summary?: {
    totalDueCount?: number;
    urgentCount?: number;
    overdueCount?: number;
    selectedLessonCount?: number;
  };
};

export default function ReviewLibraryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deckId?: string | string[];
    lessonDeckIds?: string | string[];
    replaceUnfinished?: string | string[];
  }>();
  const { profile } = useProfile();
  const [mode, setMode] = useState<ReviewMode>('all');
  const [dashboard, setDashboard] = useState<ReviewDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const requestedDeckId = useMemo(
    () => (Array.isArray(params.deckId) ? params.deckId[0] : params.deckId) || profile.activeDeckId || undefined,
    [params.deckId, profile.activeDeckId]
  );
  const requestedLessonDeckIdsKey = useMemo(
    () =>
      (Array.isArray(params.lessonDeckIds) ? params.lessonDeckIds[0] : params.lessonDeckIds) ||
      profile.activeLessonDeckIds.join(','),
    [params.lessonDeckIds, profile.activeLessonDeckIds]
  );
  const replaceUnfinished = useMemo(
    () => (Array.isArray(params.replaceUnfinished) ? params.replaceUnfinished[0] : params.replaceUnfinished) || '',
    [params.replaceUnfinished]
  );

  const fetchReview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await learningApi.getReview({
        reviewMode: mode,
        deckId: requestedDeckId,
        lessonDeckIds: requestedLessonDeckIdsKey || undefined,
      });
      setDashboard(response.data);
    } finally {
      setLoading(false);
    }
  }, [mode, requestedDeckId, requestedLessonDeckIdsKey]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const words = useMemo(() => {
    const groups = dashboard?.groups || {};
    return mode === 'urgent' ? groups.urgent || [] : groups.all || dashboard?.words || [];
  }, [dashboard, mode]);

  const startReview = () => {
    router.push({
      pathname: '/learning',
      params: {
        reviewMode: mode,
        deckId: requestedDeckId || '',
        lessonDeckIds: requestedLessonDeckIdsKey || '',
        ...(replaceUnfinished ? { replaceUnfinished } : {}),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <KineticBackdrop />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => goBackOrReplace('/library')}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dashboard?.activeDeck?.name || 'Ôn tập'}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={fetchReview}>
          <Text style={styles.iconText}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Review Queue</Text>
          <Text style={styles.heroTitle}>{dashboard?.summary?.totalDueCount || 0} từ đến hạn</Text>
          <Text style={styles.heroText}>
            {(dashboard?.summary?.selectedLessonCount || 0) > 0
              ? `Đang ôn trong ${(dashboard?.summary?.selectedLessonCount || 0)} bài học đã chọn.`
              : 'Đang dùng phạm vi học mặc định của bạn để lấy hàng đợi ôn tập.'}
          </Text>
          <View style={styles.modeRow}>
            {(['all', 'urgent'] as ReviewMode[]).map((item) => {
              const active = item === mode;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => setMode(item)}
                >
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>
                    {item === 'all' ? 'Tất cả' : 'Ưu tiên'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </KineticGlassCard>

        {loading ? (
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải từ cần ôn...</Text>
          </KineticGlassCard>
        ) : (
          <View style={styles.wordList}>
            {words.map((word) => (
              <KineticGlassCard key={word.id} style={styles.wordCard}>
                <Text style={styles.wordText}>{word.word}</Text>
                <Text style={styles.meaningText}>{word.meaningVi || word.meaning}</Text>
                <Text style={styles.metaText}>{word.deckName || dashboard?.activeDeck?.name || 'Từ vựng'}</Text>
              </KineticGlassCard>
            ))}
            {words.length === 0 ? (
              <KineticGlassCard style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Chưa có từ đến hạn</Text>
                <Text style={styles.emptyText}>Bạn có thể bắt đầu session hằng ngày để học từ mới.</Text>
              </KineticGlassCard>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <KineticButton disabled={loading || words.length === 0} onPress={startReview}>
          <KineticButtonText>Bắt đầu ôn</KineticButtonText>
        </KineticButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kineticPalette.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: kineticPalette.surfaceLowest, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  headerTitle: { fontSize: 18, fontWeight: '900', color: kineticPalette.onSurface },
  content: { gap: 14 },
  heroCard: { gap: 12 },
  heroEyebrow: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: kineticPalette.primary },
  heroTitle: { fontSize: 34, fontWeight: '900', color: kineticPalette.onSurface },
  heroText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: kineticPalette.surfaceLow },
  modeChipActive: { backgroundColor: kineticPalette.primary },
  modeText: { fontSize: 13, fontWeight: '800', color: kineticPalette.onSurfaceVariant },
  modeTextActive: { color: kineticPalette.onPrimary },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: kineticPalette.onSurfaceVariant },
  wordList: { gap: 10 },
  wordCard: { gap: 5 },
  wordText: { fontSize: 22, fontWeight: '900', color: kineticPalette.onSurface },
  meaningText: { fontSize: 15, lineHeight: 21, color: kineticPalette.onSurfaceVariant },
  metaText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: kineticPalette.outline },
  emptyCard: { gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: kineticPalette.onSurface },
  emptyText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 0, paddingTop: 12 },
});
