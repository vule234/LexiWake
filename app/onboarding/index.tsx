import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandEmoji}>L</Text>
        </View>
        <Text style={styles.brandText}>LexiWake</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Học theo nhịp báo thức</Text>
          <Text style={styles.heroTitle}>
            Biến báo thức thành<Text style={styles.heroHighlight}> thời điểm</Text> học mỗi sáng
          </Text>
          <Text style={styles.heroSubtitle}>
            Audio, flashcard, mini quiz và ôn tập theo nhịp học ngắn nhưng đều đặn.
          </Text>
        </View>

      </View>

      <View style={styles.content}>
        <View style={styles.featureRow}>
          <View style={styles.featureCard}>
            <Text style={styles.featureValue}>5-10</Text>
            <Text style={styles.featureLabel}>từ mỗi ngày</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureValue}>SRS</Text>
            <Text style={styles.featureLabel}>ôn tập đúng lúc</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <KineticButton onPress={() => router.push('/(auth)/register')}>
            <KineticButtonText>Tạo tài khoản để bắt đầu</KineticButtonText>
          </KineticButton>

          <KineticButton variant="secondary" onPress={() => router.push('/(auth)/login')}>
            <KineticButtonText variant="secondary">Tôi đã có tài khoản</KineticButtonText>
          </KineticButton>

          <KineticButton variant="ghost" onPress={() => router.push('/(auth)/guest')}>
            <KineticButtonText variant="ghost">Dùng thử với chế độ khách</KineticButtonText>
          </KineticButton>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.progressDotActive} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
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
    gap: 10,
    marginBottom: 18,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: kineticPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  hero: {
    position: 'relative',
    marginBottom: 28,
  },
  heroCard: {
    minHeight: 330,
    borderRadius: 32,
    backgroundColor: kineticPalette.surfaceLowest,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'flex-end',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: kineticPalette.primary,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: kineticPalette.onSurface,
    marginBottom: 12,
  },
  heroHighlight: {
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: kineticPalette.onSurfaceVariant,
  },
  content: {
    gap: 22,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 18,
  },
  featureValue: {
    fontSize: 26,
    fontWeight: '900',
    color: kineticPalette.onSurface,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  actions: {
    gap: 12,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressDotActive: {
    width: 26,
    height: 10,
    borderRadius: 999,
    backgroundColor: kineticPalette.primary,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: kineticPalette.outlineVariant,
  },
});
