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
import { useDecks } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticChoiceCard,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

type Mode = 'weak' | 'deck';
type Duration = 5 | 10 | 15;

const DURATION_OPTIONS: Duration[] = [5, 10, 15];

export default function CramSetupScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('weak');
  const [duration, setDuration] = useState<Duration>(10);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const { decks, loading: deckLoading } = useDecks();

  const canStart = useMemo(() => {
    if (mode === 'weak') {
      return true;
    }
    if (mode === 'deck') {
      return Boolean(selectedDeckId);
    }
    return false;
  }, [mode, selectedDeckId]);

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;

  const handleStart = () => {
    if (!canStart) {
      return;
    }

    router.push({
      pathname: '/cram/learning',
      params: {
        mode,
        duration: String(duration),
        deckId: selectedDeckId || '',
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.headerButtonIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Cram setup</Text>
          <Text style={styles.headerBrand}>LexiWake</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.headerButtonIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={kineticGradient} style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeIcon}>⚡</Text>
            <Text style={styles.heroBadgeText}>High Energy</Text>
          </View>
          <Text style={styles.heroTitle}>Chế độ Cram.</Text>
          <Text style={styles.heroText}>
            Học cấp tốc bằng các đợt ngắn, ưu tiên tốc độ phản xạ và nhịp lặp dày hơn flow học báo thức thông thường.
          </Text>
          <Text style={styles.heroBolt}>⚡</Text>
        </LinearGradient>

        <KineticGlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chọn thời lượng</Text>
            <Text style={styles.sectionMeta}>Session timer</Text>
          </View>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((option) => {
              const active = option === duration;
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.92}
                  style={active ? styles.durationCardActive : styles.durationCard}
                  onPress={() => setDuration(option)}
                >
                  <Text style={active ? styles.durationValueActive : styles.durationValue}>{option}</Text>
                  <Text style={active ? styles.durationLabelActive : styles.durationLabel}>PHÚT</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </KineticGlassCard>

        <KineticGlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nguồn từ vựng</Text>
            <Text style={styles.sectionMeta}>Focus</Text>
          </View>
          <View style={styles.choiceStack}>
            <KineticChoiceCard
              title="Weak words"
              description="Lấy các từ có lịch sử sai nhiều để cram lại nhanh."
              icon="⚠"
              active={mode === 'weak'}
              onPress={() => setMode('weak')}
            />
            <KineticChoiceCard
              title="Theo deck"
              description="Tập trung vào một bộ học cụ thể do bạn chọn."
              icon="🗂"
              active={mode === 'deck'}
              onPress={() => setMode('deck')}
            />
          </View>
        </KineticGlassCard>

        {mode === 'deck' ? (
          <KineticGlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chọn deck</Text>
              <Text style={styles.sectionMeta}>{decks.length} deck</Text>
            </View>
            {deckLoading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator size="small" color={kineticPalette.primary} />
                <Text style={styles.loadingInlineText}>Đang tải deck...</Text>
              </View>
            ) : (
              <View style={styles.choiceStack}>
                {decks.map((deck) => (
                  <KineticChoiceCard
                    key={deck.id}
                    title={deck.name}
                    description={`${deck.wordCount} từ`}
                    icon="📘"
                    active={selectedDeckId === deck.id}
                    onPress={() => setSelectedDeckId(deck.id)}
                  />
                ))}
              </View>
            )}
          </KineticGlassCard>
        ) : null}

        <KineticGlassCard style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Session summary</Text>
          <Text style={styles.summaryTitle}>
            {duration} phút •{' '}
            {mode === 'weak'
              ? 'Weak words'
              : selectedDeck?.name || 'Chọn deck'}
          </Text>
          <Text style={styles.summaryText}>
            Luồng này sẽ gọi `learning/start` và `learning/cram`, sau đó đẩy bạn vào một session multiple-choice tốc độ cao.
          </Text>
        </KineticGlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton style={styles.footerButton} disabled={!canStart} onPress={handleStart}>
          <KineticButtonText>Bắt đầu học ngay</KineticButtonText>
        </KineticButton>
      </View>
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
  headerCopy: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  headerBrand: {
    fontSize: 13,
    fontWeight: '900',
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    gap: 12,
    overflow: 'hidden',
    ...kineticShadow,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroBadgeIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroText: {
    width: '82%',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  heroBolt: {
    position: 'absolute',
    right: 20,
    bottom: 14,
    fontSize: 94,
    color: 'rgba(255,255,255,0.18)',
  },
  sectionCard: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  durationCardActive: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.primaryContainer,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
    ...kineticShadow,
  },
  durationValue: {
    fontSize: 30,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  durationValueActive: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  durationLabelActive: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
  },
  choiceStack: {
    gap: 12,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingInlineText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceLowest,
  },
  topicChipActive: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  topicChipTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  summaryCard: {
    gap: 8,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.secondary,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  footerButton: {
    minHeight: 58,
  },
});
