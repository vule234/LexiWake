import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import { useAppStore } from '../../src/stores/appStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

const accentOptions = [
  { value: 'us' as const, title: 'American English', subtitle: 'Tiếng Anh Mỹ', badge: 'US' },
  { value: 'uk' as const, title: 'British English', subtitle: 'Tiếng Anh Anh', badge: 'UK' },
];

const speedOptions = [0.75, 1, 1.5] as const;

export default function AlarmSoundScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { profile, loading, updateProfile } = useProfile();
  const [preferredAccent, setPreferredAccent] = useState<'us' | 'uk'>('us');
  const [playbackSpeed, setPlaybackSpeed] = useState<(typeof speedOptions)[number]>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const formHydratedRef = useRef(false);

  useEffect(() => {
    if (loading || formHydratedRef.current) {
      return;
    }

    setPreferredAccent(profile.preferredAccent);
    setSoundEnabled(profile.soundEnabled);
    setVibrationEnabled(profile.vibrationEnabled);
    formHydratedRef.current = true;
  }, [loading, profile]);

  const handlePreview = () => {
    Alert.alert(
      'Preview giọng đọc',
      `Accent: ${preferredAccent.toUpperCase()} • Tốc độ: ${playbackSpeed}x\nPhần nghe thử native sẽ được hoàn thiện ở bước sau.`
    );
  };

  const handleSave = async () => {
    if (!isAuthenticated || isGuest) {
      router.replace('/(auth)/register');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        preferredAccent,
        soundEnabled,
        vibrationEnabled,
      });
      goBackOrReplace('/alarm');
    } catch (error) {
      Alert.alert('Không thể lưu cài đặt âm thanh', 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/alarm')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Cài đặt âm thanh</Text>
          <Text style={styles.headerBrand}>LexiWake</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} disabled={saving} onPress={handleSave}>
          <Text style={styles.headerAction}>{saving ? '...' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải sound preferences...</Text>
          </KineticGlassCard>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.previewShell}>
            <View style={styles.previewGlow} />
            <KineticGlassCard style={styles.previewCard}>
              <View style={styles.previewIconWrap}>
                <Text style={styles.previewIcon}>🔊</Text>
              </View>
              <Text style={styles.previewTitle}>LexiWake</Text>
              <Text style={styles.previewPhonetic}>
                /{preferredAccent === 'us' ? 'kəˈnɛtɪk ˈskɑlər' : 'kɪˈnɛtɪk ˈskɒlə'}/
              </Text>
              <KineticButton onPress={handlePreview}>
                <KineticButtonText>Nghe thử giọng đọc</KineticButtonText>
              </KineticButton>
            </KineticGlassCard>
          </View>

          <KineticGlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Giọng đọc</Text>
              <Text style={styles.sectionMeta}>Accent</Text>
            </View>
            <View style={styles.optionStack}>
              {accentOptions.map((option) => {
                const active = preferredAccent === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.92}
                    style={[styles.voiceCard, active && styles.voiceCardActive]}
                    onPress={() => setPreferredAccent(option.value)}
                  >
                    <View style={[styles.voiceBadge, active && styles.voiceBadgeActive]}>
                      <Text style={[styles.voiceBadgeText, active && styles.voiceBadgeTextActive]}>
                        {option.badge}
                      </Text>
                    </View>
                    <View style={styles.voiceMain}>
                      <Text style={[styles.voiceTitle, active && styles.voiceTitleActive]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.voiceText, active && styles.voiceTextActive]}>
                        {option.subtitle}
                      </Text>
                    </View>
                    <View style={[styles.voiceCheck, active && styles.voiceCheckActive]}>
                      <Text style={[styles.voiceCheckText, active && styles.voiceCheckTextActive]}>
                        {active ? '✓' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </KineticGlassCard>

          <KineticGlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tốc độ phát</Text>
              <Text style={styles.sectionMeta}>Preview only</Text>
            </View>

            <View style={styles.speedLegendRow}>
              <View style={styles.speedLegendItem}>
                <Text style={styles.speedLegendIcon}>🐢</Text>
                <Text style={styles.speedLegendText}>Chậm</Text>
              </View>
              <View style={styles.speedLegendItem}>
                <Text style={styles.speedLegendIcon}>🏃</Text>
                <Text style={styles.speedLegendText}>Chuẩn</Text>
              </View>
              <View style={styles.speedLegendItem}>
                <Text style={styles.speedLegendIcon}>🚀</Text>
                <Text style={styles.speedLegendText}>Nhanh</Text>
              </View>
            </View>

            <View style={styles.speedRow}>
              {speedOptions.map((speed) => {
                const active = playbackSpeed === speed;
                return (
                  <TouchableOpacity
                    key={speed}
                    style={active ? styles.speedChipActive : styles.speedChip}
                    onPress={() => setPlaybackSpeed(speed)}
                  >
                    <Text style={active ? styles.speedChipTextActive : styles.speedChipText}>
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </KineticGlassCard>

          <View style={styles.rowSection}>
            <KineticGlassCard style={styles.toggleCard}>
              <View style={styles.toggleHeader}>
                <Text style={styles.toggleIcon}>🔔</Text>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: kineticPalette.surfaceHighest, true: kineticPalette.primary }}
                  thumbColor="#ffffff"
                />
              </View>
              <Text style={styles.toggleTitle}>Âm thanh</Text>
              <Text style={styles.toggleText}>Phát âm báo cho alarm và notification.</Text>
            </KineticGlassCard>

            <KineticGlassCard style={styles.toggleCard}>
              <View style={styles.toggleHeader}>
                <Text style={styles.toggleIcon}>📳</Text>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                  trackColor={{ false: kineticPalette.surfaceHighest, true: kineticPalette.primary }}
                  thumbColor="#ffffff"
                />
              </View>
              <Text style={styles.toggleTitle}>Rung</Text>
              <Text style={styles.toggleText}>
                Dùng rung như lớp cảnh báo bổ sung khi thiết bị hỗ trợ.
              </Text>
            </KineticGlassCard>
          </View>

          <LinearGradient colors={kineticGradient} style={styles.tipCard}>
            <Text style={styles.tipTitle}>Mẹo nhỏ cho bạn</Text>
            <Text style={styles.tipText}>
              Dùng accent `US` hoặc `UK` cho phát âm mẫu của bộ từ hiện tại. Tốc độ 0.75x hiện là bản xem trước để thử cảm giác trước khi nối native audio thật.
            </Text>
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
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerButton: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: kineticPalette.surfaceLowest,
  },
  headerIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  headerCopy: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  headerBrand: {
    fontSize: 13,
    fontWeight: '900',
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  headerAction: {
    fontSize: 14,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 18,
  },
  previewShell: {
    position: 'relative',
    marginBottom: 2,
  },
  previewGlow: {
    position: 'absolute',
    top: -6,
    right: -8,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(79,70,229,0.1)',
  },
  previewCard: {
    alignItems: 'center',
    gap: 10,
  },
  previewIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,70,229,0.1)',
  },
  previewIcon: {
    fontSize: 40,
  },
  previewTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  previewPhonetic: {
    fontSize: 16,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
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
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  optionStack: {
    gap: 12,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
  },
  voiceCardActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  voiceBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: kineticPalette.surfaceLow,
  },
  voiceBadgeActive: {
    backgroundColor: kineticPalette.primary,
  },
  voiceBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  voiceBadgeTextActive: {
    color: '#ffffff',
  },
  voiceMain: {
    flex: 1,
    gap: 4,
  },
  voiceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  voiceTitleActive: {
    color: kineticPalette.primary,
  },
  voiceText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  voiceTextActive: {
    color: kineticPalette.primaryContainer,
  },
  voiceCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: kineticPalette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceCheckActive: {
    borderColor: kineticPalette.primary,
    backgroundColor: kineticPalette.primary,
  },
  voiceCheckText: {
    fontSize: 13,
    fontWeight: '900',
    color: 'transparent',
  },
  voiceCheckTextActive: {
    color: '#ffffff',
  },
  speedLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  speedLegendItem: {
    alignItems: 'center',
    gap: 4,
  },
  speedLegendIcon: {
    fontSize: 22,
  },
  speedLegendText: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  speedChip: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: kineticPalette.surfaceLowest,
  },
  speedChipActive: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: kineticPalette.primaryContainer,
    ...kineticShadow,
  },
  speedChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  speedChipTextActive: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  rowSection: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleCard: {
    flex: 1,
    gap: 10,
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 26,
  },
  toggleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  toggleText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  tipCard: {
    borderRadius: 30,
    padding: 24,
    gap: 8,
    ...kineticShadow,
  },
  tipTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
});
