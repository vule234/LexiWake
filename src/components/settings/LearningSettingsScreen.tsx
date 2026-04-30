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
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../lib/hooks';
import { goBackOrReplace } from '../../lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticChoiceCard,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';

const dailyOptions = [5, 10, 15, 20];
const sessionOptions = [
  { value: 'quick', label: 'Quick', text: '5-7 phút', icon: '⚡' },
  { value: 'standard', label: 'Standard', text: '10-12 phút', icon: '📚' },
  { value: 'deep', label: 'Deep', text: '15+ phút', icon: '🧠' },
] as const;

export default function LearningSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading, updateProfile } = useProfile();
  const [newDailyLimit, setNewDailyLimit] = useState(5);
  const [sessionLength, setSessionLength] = useState<typeof sessionOptions[number]['value']>('quick');
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const formHydratedRef = useRef(false);

  useEffect(() => {
    if (loading || formHydratedRef.current) {
      return;
    }

    setNewDailyLimit(profile.newDailyLimit || profile.dailyWordLimit);
    setSessionLength(profile.sessionLength);
    setDarkMode(profile.darkMode);
    formHydratedRef.current = true;
  }, [loading, profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        dailyWordLimit: newDailyLimit,
        newDailyLimit,
        sessionLength,
        darkMode,
      });
      goBackOrReplace('/(tabs)/settings');
    } catch (error) {
      Alert.alert('Không thể lưu cài đặt học tập', 'Vui lòng thử lại.');
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
        <Text style={styles.headerTitle}>Học tập</Text>
        <TouchableOpacity style={styles.headerButton} disabled={saving} onPress={handleSave}>
          <Text style={styles.saveText}>{saving ? '...' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </KineticGlassCard>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={kineticGradient} style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Learning cadence</Text>
            <Text style={styles.heroTitle}>{newDailyLimit} từ mỗi ngày</Text>
            <Text style={styles.heroText}>
              Session hiện tại: {sessionLength} • App sẽ cá nhân hóa nhịp học theo thiết lập này.
            </Text>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Số từ mới mỗi ngày</Text>
            <View style={styles.optionRow}>
              {dailyOptions.map((option) => {
                const active = newDailyLimit === option;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pillButton, active && styles.pillButtonActive]}
                    onPress={() => setNewDailyLimit(option)}
                  >
                    <Text style={[styles.pillButtonText, active && styles.pillButtonTextActive]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Độ dài phiên học</Text>
            <View style={styles.stack}>
              {sessionOptions.map((option) => (
                <KineticChoiceCard
                  key={option.value}
                  title={option.label}
                  description={option.text}
                  icon={option.icon}
                  active={sessionLength === option.value}
                  onPress={() => setSessionLength(option.value)}
                />
              ))}
            </View>
          </View>

          <KineticGlassCard style={styles.switchCard}>
            <View style={styles.switchMain}>
              <Text style={styles.switchTitle}>Tùy chọn giao diện tối</Text>
              <Text style={styles.switchText}>
                Giá trị này đã lưu vào profile. Theme toàn app sẽ nối đầy đủ ở bước polish tiếp theo.
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#d1d5db', true: kineticPalette.primary }}
              thumbColor="#ffffff"
            />
          </KineticGlassCard>

          <KineticGlassCard style={styles.tipCard}>
            <Text style={styles.tipTitle}>Gợi ý hệ thống</Text>
            <Text style={styles.tipText}>
              Nếu bạn mới quay lại thói quen học, hãy bắt đầu với `5 từ/ngày` và `Quick` để duy trì streak ổn định.
            </Text>
          </KineticGlassCard>

          <View style={styles.actionStack}>
            <KineticButton onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <KineticButtonText>Lưu cài đặt</KineticButtonText>
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
  heroCard: { borderRadius: 30, padding: 24, gap: 8, ...kineticShadow },
  heroEyebrow: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.76)', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: '#ffffff' },
  heroText: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.onSurface },
  optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pillButton: { minWidth: 68, borderRadius: 22, backgroundColor: kineticPalette.surfaceHigh, paddingHorizontal: 18, paddingVertical: 16, alignItems: 'center' },
  pillButtonActive: { backgroundColor: kineticPalette.primary },
  pillButtonText: { fontSize: 15, fontWeight: '800', color: kineticPalette.onSurfaceVariant },
  pillButtonTextActive: { color: '#ffffff' },
  stack: { gap: 10 },
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchMain: { flex: 1, gap: 4 },
  switchTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  switchText: { fontSize: 13, lineHeight: 18, color: kineticPalette.onSurfaceVariant },
  tipCard: { gap: 8 },
  tipTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  tipText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  actionStack: { gap: 12 },
});
