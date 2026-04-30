import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/lib/hooks';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

export default function GuestModeScreen() {
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 18 }]}>
      <KineticBackdrop />

      <View style={styles.hero}>
        <Text style={styles.title}>Chế độ khách</Text>
        <Text style={styles.subtitle}>
          Bạn có thể xem giao diện, thư viện công khai và flow chính mà chưa cần tạo tài khoản.
        </Text>
      </View>

      <KineticGlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Lưu ý về đồng bộ</Text>
        <Text style={styles.cardText}>
          Dữ liệu học tập trong chế độ khách chỉ mang tính trải nghiệm. Để đồng bộ báo thức, tiến độ và phiên học thật, bạn vẫn cần tạo tài khoản.
        </Text>
      </KineticGlassCard>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton
          onPress={() => {
            continueAsGuest();
            router.replace('/(tabs)');
          }}
        >
          <KineticButtonText>Bắt đầu dùng thử</KineticButtonText>
        </KineticButton>

        <KineticButton variant="secondary" onPress={() => router.replace('/(auth)/register')}>
          <KineticButtonText variant="secondary">Tạo tài khoản luôn</KineticButtonText>
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
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: kineticPalette.onSurfaceVariant,
  },
  card: {
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  footer: {
    gap: 12,
  },
});
