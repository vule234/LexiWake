import { useEffect, useState } from 'react';
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
import { useAppStore } from '../../src/stores/appStore';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { openAiAgent } from '../../src/features/ai-agent/store';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

type WordDetail = {
  id: string;
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  exampleVi?: string;
  status: string;
  masteryScore: number;
  isFavorite: boolean;
};

const getStatusLabel = (status: string) => {
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

export default function WordDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fetchWord = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await wordApi.getById(id);
      setWord(response.data.word as WordDetail);
    } catch (error) {
      setWord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWord();
  }, [id]);

  const handleFavorite = async () => {
    if (!word || !isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      setFavoriteLoading(true);
      const response = await wordApi.favorite(word.id);
      setWord({ ...word, isFavorite: response.data.favorited });
    } catch (error) {
      Alert.alert('Không thể cập nhật yêu thích', 'Vui lòng thử lại.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />
        <KineticGlassCard style={styles.loadingCard}>
          <ActivityIndicator size="small" color={kineticPalette.primary} />
          <Text style={styles.loadingText}>Đang tải chi tiết từ...</Text>
        </KineticGlassCard>
      </View>
    );
  }

  if (!word) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <KineticBackdrop />
        <KineticGlassCard style={styles.loadingCard}>
          <Text style={styles.loadingText}>Không tìm thấy từ này.</Text>
        </KineticGlassCard>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/library')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity style={styles.headerButton} disabled={favoriteLoading} onPress={handleFavorite}>
          <Text style={[styles.headerIcon, word.isFavorite && styles.favoriteActive]}>
            {word.isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 126 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.ghostWord}>{word.word.toUpperCase()}</Text>

          <View style={styles.heroTopRow}>
            <View style={styles.metaBadgePrimary}>
              <Text style={styles.metaBadgePrimaryText}>{word.partOfSpeech || 'Word'}</Text>
            </View>
            <TouchableOpacity style={styles.favoriteButton} onPress={handleFavorite}>
              <Text style={styles.favoriteButtonIcon}>{word.isFavorite ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.wordText}>{word.word}</Text>
          {word.ipa ? (
            <View style={styles.pronunciationRow}>
              <Text style={styles.ipaText}>{word.ipa}</Text>
              <View style={styles.audioHint}>
                <Text style={styles.audioHintText}>Audio</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.meaningCard}>
            <Text style={styles.sectionLabel}>Meaning</Text>
            <Text style={styles.meaningText}>{word.meaning}</Text>
          </View>
        </View>

        <View style={styles.metaInfoRow}>
            <View style={styles.metaInfoCard}>
              <Text style={styles.metaInfoLabel}>Bộ từ</Text>
            <Text style={styles.metaInfoValue}>Scope hiện tại</Text>
            </View>
          <View style={styles.metaInfoCard}>
            <Text style={styles.metaInfoLabel}>Status</Text>
            <Text style={styles.metaInfoValue}>{getStatusLabel(word.status)}</Text>
          </View>
          <View style={styles.metaInfoCard}>
            <Text style={styles.metaInfoLabel}>Mastery</Text>
            <Text style={styles.metaInfoValue}>{word.masteryScore}%</Text>
          </View>
        </View>

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Usage Example</Text>
          <View style={[styles.exampleCard, styles.exampleCardPrimary]}>
            <Text style={styles.exampleText}>{word.example || 'Chưa có ví dụ cho từ này.'}</Text>
            {word.exampleVi ? <Text style={styles.translationText}>{word.exampleVi}</Text> : null}
          </View>
          <View style={[styles.exampleCard, styles.exampleCardSecondary]}>
            <Text style={styles.exampleHintTitle}>Study cue</Text>
            <Text style={styles.exampleHintText}>
              Ghim từ này vào yêu thích hoặc mở session học ngay để đẩy mastery score lên tiếp.
            </Text>
          </View>
        </View>

        <KineticGlassCard style={styles.noteCard}>
          <Text style={styles.noteTitle}>Personal notes</Text>
          <Text style={styles.noteText}>
            Luồng note cá nhân chưa mở backend riêng, nhưng block này đã có chỗ sẵn để nối vào sau.
          </Text>
        </KineticGlassCard>

        <View style={styles.imageRow}>
          <LinearGradient colors={kineticGradient} style={styles.imageTileLarge}>
            <Text style={styles.imageTileWord}>{word.word}</Text>
          </LinearGradient>
          <View style={styles.imageTileSmall}>
            <Text style={styles.imageTileSmallText}>{getStatusLabel(word.status)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton variant="secondary" style={styles.footerButton} onPress={() => router.push('/(tabs)/library')}>
          <KineticButtonText variant="secondary">Về thư viện</KineticButtonText>
        </KineticButton>
        <KineticButton
          variant="secondary"
          style={styles.footerButton}
          onPress={() =>
            openAiAgent({
              prompt: `Giải thích từ ${word.word} và cho tôi mẹo nhớ nhanh.`,
              screenContext: {
                type: 'word',
                id: word.id,
                name: word.word,
              },
              sheetMode: 'full',
            })
          }
        >
          <KineticButtonText variant="secondary">Hỏi trợ lý</KineticButtonText>
        </KineticButton>
        <KineticButton style={styles.footerButton} onPress={() => router.push('/learning')}>
          <KineticButtonText>Học từ này</KineticButtonText>
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
  favoriteActive: {
    color: kineticPalette.error,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 18,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  loadingText: {
    fontSize: 15,
    color: kineticPalette.onSurfaceVariant,
  },
  heroSection: {
    position: 'relative',
    paddingTop: 10,
  },
  ghostWord: {
    position: 'absolute',
    top: -8,
    left: -4,
    fontSize: 72,
    fontWeight: '900',
    color: 'rgba(53,37,205,0.08)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaBadgePrimary: {
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  metaBadgePrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...kineticShadow,
  },
  favoriteButtonIcon: {
    fontSize: 18,
    color: kineticPalette.error,
  },
  wordText: {
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '900',
    color: kineticPalette.primary,
    letterSpacing: -1.8,
    marginBottom: 8,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  ipaText: {
    fontSize: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  audioHint: {
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  meaningCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 22,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  meaningText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  metaInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaInfoCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 16,
    minHeight: 96,
    justifyContent: 'space-between',
    ...kineticShadow,
  },
  metaInfoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaInfoValue: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  examplesSection: {
    gap: 12,
  },
  examplesTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  exampleCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 20,
    gap: 12,
    ...kineticShadow,
  },
  exampleCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: kineticPalette.primary,
  },
  exampleCardSecondary: {
    borderLeftWidth: 4,
    borderLeftColor: kineticPalette.secondary,
  },
  exampleText: {
    fontSize: 18,
    lineHeight: 28,
    color: kineticPalette.onSurface,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
    fontStyle: 'italic',
  },
  exampleHintTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  exampleHintText: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  noteCard: {
    gap: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageTileLarge: {
    flex: 1,
    minHeight: 140,
    borderRadius: 28,
    padding: 18,
    justifyContent: 'flex-end',
  },
  imageTileWord: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  imageTileSmall: {
    width: 118,
    minHeight: 140,
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 18,
    justifyContent: 'flex-end',
  },
  imageTileSmallText: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
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
