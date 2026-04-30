import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { goBackOrReplace } from '../../lib/navigation';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';
import { TouchableOpacity } from 'react-native';

export default function WidgetPreviewScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/settings')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Widget Preview</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Xem trước Widget</Text>
          <Text style={styles.heroText}>Giao diện học tập nhanh ngay trên màn hình chính của bạn.</Text>
        </View>

        <View style={styles.phoneFrame}>
          <LinearGradient colors={['#161f3b', '#2c245f', '#3525cd']} style={styles.phoneBody}>
            <View style={styles.phoneStatusRow}>
              <Text style={styles.phoneStatusText}>9:41</Text>
              <Text style={styles.phoneStatusText}>● ● ●</Text>
            </View>

            <View style={styles.phoneTopCards}>
              <KineticGlassCard style={styles.phoneMiniCard}>
                <Text style={styles.phoneMiniIcon}>🔥</Text>
                <Text style={styles.phoneMiniValue}>12</Text>
                <Text style={styles.phoneMiniLabel}>Chuỗi ngày</Text>
              </KineticGlassCard>
              <KineticGlassCard style={styles.phoneMiniCard}>
                <Text style={styles.phoneMiniIcon}>⏰</Text>
                <Text style={styles.phoneMiniValue}>07:00</Text>
                <Text style={styles.phoneMiniLabel}>Sáng mai</Text>
              </KineticGlassCard>
            </View>

            <KineticGlassCard style={styles.phoneMainCard}>
              <View style={styles.phoneMainHeader}>
                <Text style={styles.phoneMainEyebrow}>Từ vựng hiện tại</Text>
                <Text style={styles.phoneMainIcon}>🔊</Text>
              </View>
              <Text style={styles.phoneWord}>Resilient</Text>
              <Text style={styles.phoneMeaning}>Kiên cường, mau phục hồi</Text>
              <View style={styles.phoneProgressTrack}>
                <View style={styles.phoneProgressFill} />
              </View>
            </KineticGlassCard>

            <View style={styles.appDockRow}>
              {['Chat', 'Ảnh', 'Vocab', 'Nhạc'].map((item) => (
                <View key={item} style={styles.appDockItem}>
                  <View style={[styles.appDockIcon, item === 'Vocab' && styles.appDockIconPrimary]}>
                    <Text style={styles.appDockIconText}>{item === 'Vocab' ? '⏰' : '•'}</Text>
                  </View>
                  <Text style={styles.appDockLabel}>{item}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureMain}>
              <Text style={styles.featureTitle}>Cập nhật tức thì</Text>
              <Text style={styles.featureText}>Từ mới hiển thị lại ngay sau mỗi phiên báo thức.</Text>
            </View>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>👁</Text>
            <View style={styles.featureMain}>
              <Text style={styles.featureTitle}>Ghi nhớ thụ động</Text>
              <Text style={styles.featureText}>Thấy từ vựng nhiều lần trên màn hình chính giúp tăng nhớ dài hạn.</Text>
            </View>
          </View>
        </View>

        <KineticButton onPress={() => Alert.alert('Chưa nối native widget', 'Luồng native widget sẽ hoàn thiện ở bước sau.')}>
          <KineticButtonText>Thêm vào màn hình chính</KineticButtonText>
        </KineticButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kineticPalette.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: kineticPalette.surfaceLowest, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  headerTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 18 },
  hero: { gap: 6 },
  heroTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900', color: kineticPalette.onSurface },
  heroText: { fontSize: 15, lineHeight: 22, color: kineticPalette.onSurfaceVariant },
  phoneFrame: {
    alignSelf: 'center',
    width: 290,
    borderRadius: 46,
    backgroundColor: '#0f172a',
    padding: 8,
    ...kineticShadow,
  },
  phoneBody: {
    borderRadius: 38,
    minHeight: 612,
    padding: 18,
    gap: 18,
    justifyContent: 'space-between',
  },
  phoneStatusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  phoneStatusText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  phoneTopCards: { flexDirection: 'row', gap: 12 },
  phoneMiniCard: { flex: 1, minHeight: 118, justifyContent: 'space-between' },
  phoneMiniIcon: { fontSize: 24 },
  phoneMiniValue: { fontSize: 24, fontWeight: '900', color: kineticPalette.onSurface },
  phoneMiniLabel: { fontSize: 11, fontWeight: '700', color: kineticPalette.onSurfaceVariant, textTransform: 'uppercase' },
  phoneMainCard: { gap: 10, minHeight: 164 },
  phoneMainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneMainEyebrow: { fontSize: 11, fontWeight: '800', color: kineticPalette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  phoneMainIcon: { fontSize: 18 },
  phoneWord: { fontSize: 34, fontWeight: '900', color: kineticPalette.primary },
  phoneMeaning: { fontSize: 14, color: kineticPalette.onSurfaceVariant, fontStyle: 'italic' },
  phoneProgressTrack: { height: 8, borderRadius: 999, backgroundColor: kineticPalette.surfaceHigh, overflow: 'hidden' },
  phoneProgressFill: { width: '66%', height: '100%', borderRadius: 999, backgroundColor: kineticPalette.primaryContainer },
  appDockRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 6 },
  appDockItem: { alignItems: 'center', gap: 6 },
  appDockIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  appDockIconPrimary: { backgroundColor: 'rgba(255,255,255,0.24)' },
  appDockIconText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  appDockLabel: { fontSize: 10, color: '#ffffff', fontWeight: '600' },
  featureList: { gap: 12 },
  featureCard: { borderRadius: 24, backgroundColor: kineticPalette.surfaceLowest, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center', ...kineticShadow },
  featureIcon: { fontSize: 24 },
  featureMain: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  featureText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
});
