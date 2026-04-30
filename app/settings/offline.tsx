import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

export default function OfflinePreviewScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/settings')}>
          <Text style={styles.headerButtonIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.title}>Offline State</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 132 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.illustrationStage}>
          <View style={styles.meshOrbPrimary} />
          <View style={styles.meshOrbSecondary} />
          <View style={styles.illustrationCard}>
            <Text style={styles.illustrationRobot}>🤖</Text>
            <View style={styles.illustrationBadge}>
              <Text style={styles.illustrationBadgeIcon}>☁</Text>
            </View>
          </View>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.headline}>Mất kết nối internet</Text>
          <Text style={styles.subhead}>
            Đây là màn xem trước cho trạng thái mất mạng. Khi app không gọi được API, ta có thể điều hướng về layout này thay vì chỉ hiện cảnh báo kỹ thuật.
          </Text>
        </View>

        <KineticGlassCard style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Text style={styles.tipIcon}>📶</Text>
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipTitle}>Kiểm tra lại kết nối</Text>
            <Text style={styles.tipText}>
              Vui lòng kiểm tra Wifi hoặc 4G rồi thử lại để tiếp tục alarm session, progress sync và favorite actions.
            </Text>
          </View>
        </KineticGlassCard>

        <LinearGradient colors={kineticGradient} style={styles.statusCard}>
          <Text style={styles.statusTitle}>Fallback UI cho network errors</Text>
          <Text style={styles.statusText}>
            Màn này ưu tiên copy rõ ràng, CTA lớn và có thể tái sử dụng cho API timeout, offline mode hoặc backend unavailable.
          </Text>
        </LinearGradient>

        <View style={styles.actionStack}>
          <KineticButton onPress={() => goBackOrReplace('/(tabs)/settings')}>
            <KineticButtonText>Thử lại</KineticButtonText>
          </KineticButton>
          <TouchableOpacity style={styles.secondaryLink} onPress={() => router.replace('/(tabs)/settings')}>
            <Text style={styles.secondaryLinkText}>Quay lại cài đặt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerSpacer: {
    width: 42,
    height: 42,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    color: kineticPalette.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 20,
  },
  illustrationStage: {
    height: 312,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meshOrbPrimary: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(226, 223, 255, 0.7)',
    top: 12,
    left: 4,
  },
  meshOrbSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(172, 237, 255, 0.4)',
    right: 18,
    bottom: 22,
  },
  illustrationCard: {
    width: 244,
    height: 244,
    borderRadius: 34,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...kineticShadow,
  },
  illustrationRobot: {
    fontSize: 92,
  },
  illustrationBadge: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBadgeIcon: {
    fontSize: 30,
    color: kineticPalette.tertiaryContainer,
  },
  copyBlock: {
    gap: 10,
  },
  headline: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  subhead: {
    fontSize: 16,
    lineHeight: 24,
    color: kineticPalette.onSurfaceVariant,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  tipIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: kineticPalette.primaryFixed,
  },
  tipIcon: {
    fontSize: 26,
  },
  tipBody: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  statusCard: {
    borderRadius: 30,
    padding: 24,
    gap: 8,
    ...kineticShadow,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  actionStack: {
    gap: 14,
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: kineticPalette.primary,
  },
});
