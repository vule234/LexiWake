import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

export default function OnboardingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    dailyWordLimit?: string;
    sessionLength?: string;
    time?: string;
    deckName?: string;
  }>();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 18 }]}>
      <KineticBackdrop />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
        <Text style={styles.title}>Thiết lập hoàn tất</Text>
        <Text style={styles.subtitle}>
          Tài khoản, nhịp học cá nhân và alarm đầu tiên của bạn đã sẵn sàng để bắt đầu.
        </Text>
      </View>

      <KineticGlassCard style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tóm tắt</Text>
        <Text style={styles.summaryText}>Bộ từ: {params.deckName || 'Bộ học mặc định'}</Text>
        <Text style={styles.summaryText}>
          Nhịp học: {params.dailyWordLimit || '5'} từ/ngày • {params.sessionLength || 'quick'}
        </Text>
        <Text style={styles.summaryText}>Alarm mẫu: {params.time || '07:00'}</Text>
      </KineticGlassCard>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton onPress={() => router.replace('/(tabs)')}>
          <KineticButtonText>Vào trang chủ</KineticButtonText>
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
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: kineticPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 38,
    color: kineticPalette.onPrimary,
    fontWeight: '900',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: kineticPalette.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryCard: {
    gap: 8,
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: kineticPalette.primary,
  },
  summaryText: {
    fontSize: 15,
    color: kineticPalette.onSurface,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 12,
  },
});
