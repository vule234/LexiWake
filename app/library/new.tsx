import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { learningApi } from '../../src/lib/api';
import { useProfile } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

type NewWord = {
  id: string;
  word: string;
  meaning: string;
  ipa?: string;
  status: string;
};

type ActiveDeck = {
  id: string;
  name: string;
  wordCount?: number;
  masteredCount?: number;
  progress?: number;
} | null;

export default function NewWordsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deckId?: string | string[];
    lessonDeckIds?: string | string[];
    replaceUnfinished?: string | string[];
  }>();
  const { profile } = useProfile();
  const [words, setWords] = useState<NewWord[]>([]);
  const [activeDeck, setActiveDeck] = useState<ActiveDeck>(null);
  const [selectedLessonCount, setSelectedLessonCount] = useState(0);
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

  useEffect(() => {
    let mounted = true;

    const fetchNewWords = async () => {
      try {
        setLoading(true);
        const response = await learningApi.getNew({
          deckId: requestedDeckId,
          lessonDeckIds: requestedLessonDeckIdsKey || undefined,
        });
        const nextWords = (response.data.words || [])
          .map((item: any) => ({
            id: item.id || item._id,
            word: item.word,
            meaning: item.meaning || item.meaningVi,
            ipa: item.ipa,
            status: item.status || 'new',
          }))
          .filter((item: NewWord) => item.id && item.word);

        if (mounted) {
          setWords(nextWords);
          setActiveDeck(response.data.activeDeck || null);
          setSelectedLessonCount(response.data.summary?.selectedLessonCount || 0);
        }
      } catch {
        if (mounted) {
          setWords([]);
          setActiveDeck(null);
          setSelectedLessonCount(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchNewWords();

    return () => {
      mounted = false;
    };
  }, [requestedDeckId, requestedLessonDeckIdsKey]);

  const learningParams = useMemo(
    () => ({
      deckId: requestedDeckId || '',
      lessonDeckIds: requestedLessonDeckIdsKey || '',
      ...(replaceUnfinished ? { replaceUnfinished } : {}),
    }),
    [replaceUnfinished, requestedDeckId, requestedLessonDeckIdsKey]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/library')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Từ mới</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <KineticGlassCard style={styles.loadingCard}>
          <ActivityIndicator size="small" color="#3525cd" />
          <Text style={styles.loadingText}>Đang tải từ mới hôm nay...</Text>
        </KineticGlassCard>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={kineticGradient} style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>New Words</Text>
            <Text style={styles.heroValue}>{words.length}</Text>
            <Text style={styles.heroTitle}>{activeDeck?.name || 'Từ mới hôm nay'}</Text>
            <Text style={styles.heroText}>
              {selectedLessonCount > 0
                ? `Đang lấy từ ${selectedLessonCount} bài học trong phạm vi học hiện tại.`
                : 'Từ mới đang bám theo phạm vi học mặc định của bạn.'}
            </Text>
          </LinearGradient>

          <View style={styles.list}>
            {words.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={styles.row}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/library/word', params: { id: word.id } })}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{word.word}</Text>
                  {word.ipa ? <Text style={styles.rowIpa}>{word.ipa}</Text> : null}
                  <Text style={styles.rowText}>{word.meaning}</Text>
                </View>
                <View style={styles.rowStatusBadge}>
                  <Text style={styles.rowStatus}>{word.status}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {words.length === 0 ? (
              <KineticGlassCard style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Chưa có từ mới trong bộ hiện tại</Text>
                <Text style={styles.emptyText}>
                  {activeDeck
                    ? 'Nếu bộ này chưa đạt mastery, hãy tiếp tục ôn để củng cố tiến độ.'
                    : 'Scope học hiện tại chưa có dữ liệu published.'}
                </Text>
              </KineticGlassCard>
            ) : null}
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <KineticButton onPress={() => router.push({ pathname: '/learning', params: learningParams })}>
          <KineticButtonText>Bắt đầu học</KineticButtonText>
        </KineticButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kineticPalette.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: kineticPalette.surfaceLowest, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 18, fontWeight: '700', color: kineticPalette.onSurface },
  headerTitle: { fontSize: 18, fontWeight: '800', color: kineticPalette.primary },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  loadingText: { fontSize: 14, color: kineticPalette.onSurfaceVariant },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24, gap: 16 },
  heroCard: { borderRadius: 28, padding: 24, gap: 6, ...kineticShadow },
  heroEyebrow: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroValue: { fontSize: 42, fontWeight: '900', color: '#ffffff' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  heroText: { fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.82)' },
  list: { gap: 10 },
  row: { backgroundColor: kineticPalette.surfaceLowest, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, ...kineticShadow },
  rowMain: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  rowIpa: { fontSize: 13, fontWeight: '700', color: kineticPalette.primary },
  rowText: { fontSize: 14, color: kineticPalette.onSurfaceVariant },
  rowStatusBadge: { borderRadius: 999, backgroundColor: kineticPalette.primaryFixed, paddingHorizontal: 12, paddingVertical: 8 },
  rowStatus: { fontSize: 11, fontWeight: '800', color: kineticPalette.primary, textTransform: 'uppercase' },
  emptyState: { gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  emptyText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  footer: { paddingTop: 12 },
});
