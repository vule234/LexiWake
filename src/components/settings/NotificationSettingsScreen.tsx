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
import { cancelAllAlarmNotifications } from '../../lib/notifications';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';

const reminderOptions = ['07:00', '08:00', '09:00', '18:00'];
const quietHourPresets = [
  { start: '22:00', end: '07:00' },
  { start: '23:00', end: '06:00' },
  { start: '00:00', end: '08:00' },
];

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading, updateProfile } = useProfile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alarmNotifications, setAlarmNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [streakNotifications, setStreakNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const formHydratedRef = useRef(false);

  useEffect(() => {
    if (loading || formHydratedRef.current) {
      return;
    }

    setNotificationsEnabled(profile.notificationsEnabled);
    setAlarmNotifications(profile.alarmNotifications);
    setReminderNotifications(profile.reminderNotifications);
    setStreakNotifications(profile.streakNotifications);
    setWeeklyReport(profile.weeklyReport);
    setSoundEnabled(profile.soundEnabled);
    setVibrationEnabled(profile.vibrationEnabled);
    setQuietHoursEnabled(profile.quietHoursEnabled);
    setQuietHoursStart(profile.quietHoursStart);
    setQuietHoursEnd(profile.quietHoursEnd);
    setReminderTime(profile.reminderTime);
    formHydratedRef.current = true;
  }, [loading, profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        notificationsEnabled,
        alarmNotifications,
        reminderNotifications,
        streakNotifications,
        weeklyReport,
        soundEnabled,
        vibrationEnabled,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        reminderTime,
      });

      if (!notificationsEnabled || !alarmNotifications) {
        await cancelAllAlarmNotifications();
      }

      goBackOrReplace('/(tabs)/settings');
    } catch (error) {
      Alert.alert('Không thể lưu cài đặt thông báo', 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const renderCompactToggle = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={[styles.compactCard, !notificationsEnabled && styles.disabledCard]}>
      <View style={styles.compactHeader}>
        <Text style={styles.compactIcon}>{icon}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#d1d5db', true: kineticPalette.primary }}
          thumbColor="#ffffff"
          disabled={!notificationsEnabled}
        />
      </View>
      <Text style={styles.compactTitle}>{title}</Text>
      <Text style={styles.compactText}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/settings')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
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
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Tùy chỉnh không gian học</Text>
            <Text style={styles.heroText}>Quản lý cách bạn nhận nhắc nhở, báo thức và các cập nhật từ LexiWake.</Text>
          </View>

          <View style={styles.primaryAlarmCard}>
            <View style={styles.primaryAlarmTop}>
              <View style={styles.primaryAlarmMain}>
                <View style={styles.primaryAlarmIconWrap}>
                  <Text style={styles.primaryAlarmIcon}>⏰</Text>
                </View>
                <View style={styles.primaryAlarmCopy}>
                  <Text style={styles.primaryAlarmTitle}>Thông báo tổng</Text>
                  <Text style={styles.primaryAlarmText}>Bật hoặc tắt toàn bộ không gian nhắc học.</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: kineticPalette.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.reminderCard}>
              <Text style={styles.reminderCardLabel}>Khung giờ nhắc</Text>
              <View style={styles.reminderOptionRow}>
                {reminderOptions.map((option) => {
                  const active = reminderTime === option;

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.reminderChip, active && styles.reminderChipActive]}
                      onPress={() => setReminderTime(option)}
                    >
                      <Text style={[styles.reminderChipText, active && styles.reminderChipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.grid}>
            {renderCompactToggle('Alarm', 'Cho phép alarm alert trong app.', '🔔', alarmNotifications, setAlarmNotifications)}
            {renderCompactToggle('Nhắc học', 'Reminder hằng ngày theo giờ đã chọn.', '📘', reminderNotifications, setReminderNotifications)}
            {renderCompactToggle('Streak', 'Cảnh báo khi sắp đứt streak.', '🔥', streakNotifications, setStreakNotifications)}
            {renderCompactToggle('Báo cáo tuần', 'Tổng kết học tập hằng tuần.', '📊', weeklyReport, setWeeklyReport)}
          </View>

          <View style={styles.rowSection}>
            <KineticGlassCard style={styles.inlineToggleCard}>
              <View style={styles.inlineToggleMain}>
                <Text style={styles.inlineToggleTitle}>Âm thanh</Text>
                <Text style={styles.inlineToggleText}>Phát âm thanh cho thông báo và alarm.</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#d1d5db', true: kineticPalette.primary }}
                thumbColor="#ffffff"
                disabled={!notificationsEnabled}
              />
            </KineticGlassCard>

            <KineticGlassCard style={styles.inlineToggleCard}>
              <View style={styles.inlineToggleMain}>
                <Text style={styles.inlineToggleTitle}>Rung</Text>
                <Text style={styles.inlineToggleText}>Bật vibration cho lời nhắc quan trọng.</Text>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: '#d1d5db', true: kineticPalette.primary }}
                thumbColor="#ffffff"
                disabled={!notificationsEnabled}
              />
            </KineticGlassCard>
          </View>

          <KineticGlassCard style={styles.quietHoursCard}>
            <View style={styles.quietHoursTop}>
              <View style={styles.inlineToggleMain}>
                <Text style={styles.inlineToggleTitle}>Quiet hours</Text>
                <Text style={styles.inlineToggleText}>Giới hạn thông báo trong khoảng giờ nghỉ.</Text>
              </View>
              <Switch
                value={quietHoursEnabled}
                onValueChange={setQuietHoursEnabled}
                trackColor={{ false: '#d1d5db', true: kineticPalette.primary }}
                thumbColor="#ffffff"
                disabled={!notificationsEnabled}
              />
            </View>

            {quietHoursEnabled ? (
              <View style={styles.presetColumn}>
                {quietHourPresets.map((preset) => {
                  const active = quietHoursStart === preset.start && quietHoursEnd === preset.end;

                  return (
                    <TouchableOpacity
                      key={`${preset.start}-${preset.end}`}
                      style={[styles.presetRow, active && styles.presetRowActive]}
                      onPress={() => {
                        setQuietHoursStart(preset.start);
                        setQuietHoursEnd(preset.end);
                      }}
                    >
                      <Text style={[styles.presetText, active && styles.presetTextActive]}>
                        {preset.start} - {preset.end}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </KineticGlassCard>

          <LinearGradient colors={kineticGradient} style={styles.streakCard}>
            <View style={styles.streakCopy}>
              <Text style={styles.streakTitle}>Duy trì streak của bạn</Text>
              <Text style={styles.streakText}>Bật nhắc học để không bỏ lỡ nhịp học hằng ngày.</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeIcon}>🔥</Text>
              <Text style={styles.streakBadgeText}>12 ngày</Text>
            </View>
          </LinearGradient>

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
  heroSection: { gap: 6 },
  heroTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900', color: kineticPalette.onSurface },
  heroText: { fontSize: 15, lineHeight: 22, color: kineticPalette.onSurfaceVariant },
  primaryAlarmCard: { borderRadius: 28, backgroundColor: kineticPalette.surfaceLowest, padding: 20, gap: 18, ...kineticShadow },
  primaryAlarmTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  primaryAlarmMain: { flex: 1, flexDirection: 'row', gap: 14, alignItems: 'center' },
  primaryAlarmIconWrap: { width: 48, height: 48, borderRadius: 20, backgroundColor: 'rgba(79,70,229,0.12)', alignItems: 'center', justifyContent: 'center' },
  primaryAlarmIcon: { fontSize: 24 },
  primaryAlarmCopy: { flex: 1, gap: 4 },
  primaryAlarmTitle: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  primaryAlarmText: { fontSize: 14, lineHeight: 20, color: kineticPalette.onSurfaceVariant },
  reminderCard: { borderRadius: 22, backgroundColor: kineticPalette.surfaceLow, padding: 16, gap: 12 },
  reminderCardLabel: { fontSize: 12, fontWeight: '800', color: kineticPalette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  reminderOptionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reminderChip: { minWidth: 74, borderRadius: 999, backgroundColor: kineticPalette.surfaceHigh, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  reminderChipActive: { backgroundColor: kineticPalette.primary },
  reminderChipText: { fontSize: 13, fontWeight: '700', color: kineticPalette.onSurfaceVariant },
  reminderChipTextActive: { color: '#ffffff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  compactCard: { width: '48%', borderRadius: 24, backgroundColor: kineticPalette.surfaceLowest, padding: 18, gap: 8, ...kineticShadow },
  disabledCard: { opacity: 0.55 },
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compactIcon: { fontSize: 22 },
  compactTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  compactText: { fontSize: 13, lineHeight: 18, color: kineticPalette.onSurfaceVariant },
  rowSection: { gap: 12 },
  inlineToggleCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineToggleMain: { flex: 1, gap: 4 },
  inlineToggleTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  inlineToggleText: { fontSize: 13, lineHeight: 18, color: kineticPalette.onSurfaceVariant },
  quietHoursCard: { gap: 12 },
  quietHoursTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presetColumn: { gap: 10 },
  presetRow: { borderRadius: 20, backgroundColor: kineticPalette.surfaceHigh, paddingHorizontal: 16, paddingVertical: 14 },
  presetRowActive: { backgroundColor: kineticPalette.primaryFixed },
  presetText: { fontSize: 14, fontWeight: '700', color: kineticPalette.onSurfaceVariant },
  presetTextActive: { color: kineticPalette.primary },
  streakCard: { borderRadius: 28, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, ...kineticShadow },
  streakCopy: { flex: 1, gap: 4 },
  streakTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  streakText: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)' },
  streakBadge: { borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center' },
  streakBadgeIcon: { fontSize: 22 },
  streakBadgeText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  actionStack: { gap: 12 },
});
