import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { goBackOrReplace } from '../../lib/navigation';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';

export default function AppInfoScreen() {
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/settings')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin app</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.logoShell}>
            <LinearGradient colors={kineticGradient} style={styles.logoTile}>
              <Image
                source={require('../../../assets/lexiwake-mark.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>LexiWake</Text>
          <Text style={styles.heroSubtitle}>Phiên bản {appVersion}</Text>
        </View>

        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>Sứ mệnh của chúng tôi</Text>
          <Text style={styles.missionText}>
            "Biến mỗi giây phút thức dậy thành một bước tiến mới trong hành trình chinh phục ngôn ngữ."
          </Text>
          <Text style={styles.missionMeta}>LexiWake Team</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.rateCard}
            activeOpacity={0.92}
            onPress={() => Alert.alert('Đánh giá ứng dụng', 'Luồng deep link store sẽ được nối sau.')}
          >
            <Text style={styles.rateCardTitle}>Đánh giá ứng dụng</Text>
            <Text style={styles.rateCardText}>Giúp chúng tôi cải thiện sản phẩm</Text>
          </TouchableOpacity>

          <View style={styles.linkStack}>
            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.92}
              onPress={() => Alert.alert('Điều khoản dịch vụ', 'Màn nội dung pháp lý sẽ hoàn thiện sau.')}
            >
              <Text style={styles.linkRowMain}>Điều khoản dịch vụ</Text>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              activeOpacity={0.92}
              onPress={() => Alert.alert('Chính sách bảo mật', 'Màn nội dung pháp lý sẽ hoàn thiện sau.')}
            >
              <Text style={styles.linkRowMain}>Chính sách bảo mật</Text>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KineticGlassCard style={styles.communityCard}>
          <View style={styles.communityMain}>
            <Text style={styles.communityTitle}>Cộng đồng LexiWake</Text>
            <Text style={styles.communityText}>Hơn 450,000 học viên đang luyện tập mỗi ngày.</Text>
          </View>
        </KineticGlassCard>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>Thiết kế với tâm huyết tại Việt Nam</Text>
          <Text style={styles.footerNoteText}>© 2026 LexiWake</Text>
        </View>

        <KineticButton onPress={() => goBackOrReplace('/(tabs)/settings')}>
          <KineticButtonText>Quay lại cài đặt</KineticButtonText>
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
  heroSection: { alignItems: 'center', gap: 8, marginBottom: 6 },
  logoShell: { position: 'relative', marginBottom: 10 },
  logoTile: { width: 124, height: 124, borderRadius: 34, alignItems: 'center', justifyContent: 'center', ...kineticShadow },
  logoImage: { width: 86, height: 86 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: kineticPalette.onSurface },
  heroSubtitle: { fontSize: 14, color: kineticPalette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.2 },
  missionCard: { borderRadius: 28, backgroundColor: kineticPalette.surfaceLowest, padding: 22, gap: 12, ...kineticShadow },
  missionTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.primary },
  missionText: { fontSize: 18, lineHeight: 28, color: kineticPalette.onSurface, fontStyle: 'italic' },
  missionMeta: { fontSize: 13, fontWeight: '700', color: kineticPalette.onSurfaceVariant },
  actionGrid: { flexDirection: 'row', gap: 12 },
  rateCard: { flex: 1, borderRadius: 28, backgroundColor: kineticPalette.primaryContainer, padding: 18, gap: 10 },
  rateCardTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  rateCardText: { fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.82)' },
  linkStack: { flex: 1, gap: 12 },
  linkRow: { flex: 1, borderRadius: 24, backgroundColor: kineticPalette.surfaceLow, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkRowMain: { flex: 1, fontSize: 15, fontWeight: '700', color: kineticPalette.onSurface },
  linkArrow: { fontSize: 22, color: kineticPalette.outline },
  communityCard: { gap: 4 },
  communityMain: { gap: 4 },
  communityTitle: { fontSize: 17, fontWeight: '800', color: kineticPalette.onSurface },
  communityText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  footerNote: { alignItems: 'center', gap: 2, paddingVertical: 8 },
  footerNoteText: { fontSize: 12, color: kineticPalette.outline },
});
