import { useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, useProgress } from '../../lib/hooks';
import { useAppStore } from '../../stores/appStore';
import { goBackOrReplace } from '../../lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
  KineticInput,
} from '../ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';

const accentOptions = [
  { value: 'us', label: 'US' },
  { value: 'uk', label: 'UK' },
] as const;

export default function ProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading, updateProfile } = useProfile();
  const { streak } = useProgress();
  const user = useAppStore((state) => state.user);
  const [fullName, setFullName] = useState('');
  const [preferredAccent, setPreferredAccent] = useState<typeof accentOptions[number]['value']>('us');
  const [saving, setSaving] = useState(false);
  const formHydratedRef = useRef(false);

  useEffect(() => {
    if (loading || formHydratedRef.current) {
      return;
    }

    setFullName(profile.fullName || '');
    setPreferredAccent(profile.preferredAccent);
    formHydratedRef.current = true;
  }, [loading, profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        fullName,
        preferredAccent,
      });
      goBackOrReplace('/(tabs)/settings');
    } catch (error) {
      Alert.alert('Không thể lưu hồ sơ', 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/settings')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity style={styles.headerButton} disabled={saving} onPress={handleSave}>
          <Text style={styles.saveText}>{saving ? '...' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
          </KineticGlassCard>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              <LinearGradient colors={kineticGradient} style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {((fullName || user?.email || 'V').trim()[0] || 'V').toUpperCase()}
                  </Text>
                </View>
              </LinearGradient>
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeText}>📷</Text>
              </View>
            </View>

            <Text style={styles.heroName}>{fullName || 'Người học'}</Text>
            <Text style={styles.heroMeta}>
              {user?.email || 'learner@lexiwake.app'} • {streak.current} ngày liên tiếp
            </Text>
          </View>

          <KineticInput
            label="Họ và tên"
            icon="👤"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập tên hiển thị"
          />

          <KineticGlassCard style={styles.readonlyCard}>
            <Text style={styles.readonlyLabel}>Email</Text>
            <Text style={styles.readonlyValue}>{user?.email || 'learner@lexiwake.app'}</Text>
          </KineticGlassCard>

          <KineticGlassCard style={styles.readonlyCard}>
            <Text style={styles.readonlyLabel}>Bộ từ đang học</Text>
            <Text style={styles.readonlyValue}>Đồng bộ theo bộ từ bạn đã chọn</Text>
          </KineticGlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accent mặc định</Text>
            <View style={styles.accentRow}>
              {accentOptions.map((option) => {
                const active = preferredAccent === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.accentChip, active && styles.accentChipActive]}
                    onPress={() => setPreferredAccent(option.value)}
                  >
                    <Text style={[styles.accentChipText, active && styles.accentChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <KineticGlassCard style={styles.trophyCard}>
            <View style={styles.trophyMain}>
              <Text style={styles.trophyTitle}>Thành tích học tập</Text>
              <Text style={styles.trophyText}>
                Bạn đang giữ nhịp học tốt. Hồ sơ này chỉ lưu thông tin cá nhân và tuỳ chọn học chung.
              </Text>
            </View>
          </KineticGlassCard>

          <View style={styles.actionStack}>
            <KineticButton onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <KineticButtonText>Lưu thay đổi</KineticButtonText>
              )}
            </KineticButton>
            <KineticButton variant="secondary" onPress={() => goBackOrReplace('/(tabs)/settings')}>
              <KineticButtonText variant="secondary">Hủy</KineticButtonText>
            </KineticButton>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kineticPalette.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerButton: { minWidth: 42, height: 42, borderRadius: 21, backgroundColor: kineticPalette.surfaceLowest, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  headerIcon: { fontSize: 18, fontWeight: '700', color: kineticPalette.onSurface },
  headerTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.onSurface },
  saveText: { fontSize: 14, fontWeight: '800', color: kineticPalette.primary },
  centerStage: { flex: 1, justifyContent: 'center' },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: kineticPalette.onSurfaceVariant },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 18 },
  hero: { alignItems: 'center', gap: 8 },
  avatarWrap: { position: 'relative', marginBottom: 6 },
  avatarRing: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', ...kineticShadow },
  avatarInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 44, fontWeight: '900', color: '#ffffff' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 2, width: 38, height: 38, borderRadius: 19, backgroundColor: kineticPalette.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: kineticPalette.surface },
  cameraBadgeText: { fontSize: 16 },
  heroName: { fontSize: 30, fontWeight: '900', color: kineticPalette.onSurface },
  heroMeta: { fontSize: 13, lineHeight: 18, color: kineticPalette.onSurfaceVariant, textAlign: 'center' },
  readonlyCard: { gap: 8 },
  readonlyLabel: { fontSize: 12, fontWeight: '800', color: kineticPalette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.2 },
  readonlyValue: { fontSize: 16, fontWeight: '700', color: kineticPalette.onSurface },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.onSurface },
  sectionStack: { gap: 10 },
  accentRow: { flexDirection: 'row', gap: 10 },
  accentChip: { flex: 1, borderRadius: 22, backgroundColor: kineticPalette.surfaceHigh, paddingVertical: 16, alignItems: 'center' },
  accentChipActive: { backgroundColor: kineticPalette.primary },
  accentChipText: { fontSize: 14, fontWeight: '800', color: kineticPalette.onSurfaceVariant },
  accentChipTextActive: { color: '#ffffff' },
  trophyCard: { gap: 4 },
  trophyMain: { gap: 4 },
  trophyTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  trophyText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  actionStack: { gap: 12, marginTop: 4 },
});
