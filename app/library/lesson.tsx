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
import { goBackOrReplace } from '../../src/lib/navigation';
import { useProfile, useWords } from '../../src/lib/hooks';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette, kineticShadow } from '../../src/theme/kinetic';

export default function LessonDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    deckId?: string | string[];
    deckName?: string | string[];
    lessonId?: string | string[];
    lessonName?: string | string[];
    replaceUnfinished?: string | string[];
  }>();
  const { profile, setActiveLearningScope } = useProfile();
  const [saving, setSaving] = useState(false);
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
  const replaceUnfinished = useMemo(
    () => (Array.isArray(params.replaceUnfinished) ? params.replaceUnfinished[0] : params.replaceUnfinished) || '',
    [params.replaceUnfinished]
  );
  const { words, loading } = useWords({
    limit: 200,
    deckId,
    lessonDeckIds: lessonId ? [lessonId] : [],
    enabled: Boolean(deckId && lessonId),
  });

  const existingScopeLessonIds = useMemo(() => {
    if (!deckId) {
      return [];
    }

    if (profile.activeDeckId === deckId) {
      return profile.activeLessonDeckIds || [];
    }

    return profile.savedDeckScopes.find((entry) => entry.deckId === deckId)?.lessonDeckIds || [];
  }, [deckId, profile.activeDeckId, profile.activeLessonDeckIds, profile.savedDeckScopes]);
  const alreadyInScope = existingScopeLessonIds.includes(lessonId);
  const isCompleted = useMemo(
    () =>
      words.length > 0 &&
      words.every((word) => word.status === 'mastered' || (word.masteryScore || 0) >= 80),
    [words]
  );

  const handleAddToScope = async () => {
    if (!deckId || !lessonId) {
      return;
    }

    try {
      setSaving(true);
      const nextLessonIds = Array.from(new Set([...existingScopeLessonIds, lessonId]));
      await setActiveLearningScope(deckId, nextLessonIds);
      Alert.alert('Đã cập nhật phạm vi học', `${lessonName} đã được thêm vào bộ đang học.`);
    } catch (error: any) {
      Alert.alert('Không thể cập nhật scope', error?.response?.data?.error || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const startThisLesson = () => {
    if (!deckId || !lessonId) {
      return;
    }

    if (isCompleted) {
      router.push({
        pathname: '/library/review',
        params: {
          deckId,
          lessonDeckIds: lessonId,
          ...(replaceUnfinished ? { replaceUnfinished } : {}),
        },
      });
      return;
    }

    router.push({
      pathname: '/learning',
      params: {
        deckId,
        lessonDeckIds: lessonId,
        ...(replaceUnfinished ? { replaceUnfinished } : {}),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/library')}>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
        showsVerticalScrollIndicator={false}
      >
        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Lesson Detail</Text>
          <Text style={styles.heroTitle}>{lessonName}</Text>
          <Text style={styles.heroText}>
            Xem trước toàn bộ từ trong bài học này, rồi quyết định thêm vào phạm vi học hoặc học ngay.
          </Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaCard}>
              <Text style={styles.heroMetaValue}>{words.length}</Text>
              <Text style={styles.heroMetaLabel}>Số từ trong bài học</Text>
            </View>
            <View style={styles.heroMetaCard}>
              <Text style={[styles.heroMetaValue, isCompleted && styles.heroMetaValueCompleted]}>
                {isCompleted ? 'Xong' : alreadyInScope ? 'Có' : 'Chưa'}
              </Text>
              <Text style={styles.heroMetaLabel}>{isCompleted ? 'Trạng thái bài học' : 'Trong phạm vi học hiện tại'}</Text>
            </View>
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
        <KineticButton variant="secondary" style={styles.footerButton} disabled={saving} onPress={handleAddToScope}>
          <KineticButtonText variant="secondary">
            {alreadyInScope ? 'Đã có trong phạm vi học' : saving ? 'Đang thêm...' : 'Thêm vào phạm vi học'}
          </KineticButtonText>
        </KineticButton>
        <KineticButton style={styles.footerButton} onPress={startThisLesson}>
          <KineticButtonText>{isCompleted ? 'Ôn lại bài học này' : 'Học bài học này'}</KineticButtonText>
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
  heroMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroMetaCard: {
    flex: 1,
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
  heroMetaValueCompleted: {
    color: '#15803d',
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
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(248,249,250,0.9)',
  },
  footerButton: {
    flex: 1,
  },
});
