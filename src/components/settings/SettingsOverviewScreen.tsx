import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useProfile, useProgress } from '../../lib/hooks';
import { useAppStore } from '../../stores/appStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../theme/kinetic';

export default function SettingsOverviewScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const user = useAppStore((state) => state.user);
  const { profile, loading } = useProfile();
  const { streak, totalLearnedWords, totalMasteredWords } = useProgress();
  const { logout } = useAuth();

  const shortcuts = useMemo(
    () => [
      {
        title: 'Hồ sơ',
        subtitle: profile.fullName || 'Cập nhật thông tin và mục tiêu học',
        route: '/settings/profile' as const,
      },
      {
        title: 'Học tập',
        subtitle: `${profile.newDailyLimit || profile.dailyWordLimit} từ/ngày • ${profile.sessionLength}`,
        route: '/settings/learning' as const,
      },
      {
        title: 'Thông báo',
        subtitle: `${profile.notificationsEnabled ? 'Bật' : 'Tắt'} • nhắc ${profile.reminderTime}`,
        route: '/settings/notifications' as const,
      },
      {
        title: 'Xem trước widget',
        subtitle: 'Xem trước widget học tập trên màn hình chính',
        route: '/settings/widget' as const,
      },
      {
        title: 'Thông tin app',
        subtitle: 'Phiên bản, sứ mệnh và các liên kết sản phẩm',
        route: '/settings/info' as const,
      },
      {
        title: 'Xem trước offline',
        subtitle: 'Xem trước trạng thái mất kết nối của app',
        route: '/settings/offline' as const,
      },
    ],
    [
      profile.dailyWordLimit,
      profile.newDailyLimit,
      profile.fullName,
      profile.notificationsEnabled,
      profile.reminderTime,
      profile.sessionLength,
    ]
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <KineticBackdrop />

        <View style={styles.header}>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.title}>Cài đặt</Text>
        </View>

        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.centerCard}>
            <Text style={styles.centerTitle}>Cần đăng nhập để đồng bộ cài đặt</Text>
            <Text style={styles.centerText}>
              Profile, learning preferences và thông báo sẽ được lưu theo tài khoản của bạn.
            </Text>
            <KineticButton onPress={() => router.replace('/(auth)/login')}>
              <KineticButtonText>Đăng nhập</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <View>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.title}>Cài đặt</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/settings/info')}>
          <Text style={styles.headerButtonIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerStage}>
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải profile...</Text>
          </KineticGlassCard>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={kineticGradient} style={styles.heroCard}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>
                {((profile.fullName || user?.email || 'V').trim()[0] || 'V').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroName}>{profile.fullName || 'Người học'}</Text>
              <Text style={styles.heroEmail}>{user?.email || 'learner@lexiwake.app'}</Text>
              <Text style={styles.heroMeta}>
                LexiWake
                {isGuest ? ' • Chế độ khách' : ''}
              </Text>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{streak.current}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalLearnedWords}</Text>
              <Text style={styles.statLabel}>Đã học</Text>
            </View>
            <View style={styles.statCardWarm}>
              <Text style={styles.statValueWarm}>{totalMasteredWords}</Text>
              <Text style={styles.statLabelWarm}>Đã thuộc</Text>
            </View>
          </View>

          <View style={styles.shortcutGrid}>
            {shortcuts.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.shortcutCard}
                activeOpacity={0.92}
                onPress={() => router.push(item.route)}
              >
                <Text style={styles.shortcutTitle}>{item.title}</Text>
                <Text style={styles.shortcutText}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <KineticGlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tóm tắt nhanh</Text>
            <Text style={styles.summaryText}>
              Accent: {profile.preferredAccent.toUpperCase()} • Reminder: {profile.reminderTime}
            </Text>
            <Text style={styles.summaryText}>
              Báo thức: {profile.alarmNotifications ? 'Bật' : 'Tắt'} • Weekly report: {profile.weeklyReport ? 'Bật' : 'Tắt'}
            </Text>
          </KineticGlassCard>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.92} onPress={logout}>
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
    color: kineticPalette.primary,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonIcon: {
    fontSize: 16,
    color: kineticPalette.outline,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerCard: {
    gap: 12,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  centerText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: kineticPalette.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 132,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...kineticShadow,
  },
  heroAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroAvatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.86)',
  },
  heroMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.76)',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    ...kineticShadow,
  },
  statCardWarm: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: kineticPalette.tertiaryFixed,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  statValueWarm: {
    fontSize: 28,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statLabelWarm: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.tertiaryContainer,
    textTransform: 'uppercase',
  },
  shortcutGrid: {
    gap: 12,
  },
  shortcutCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 6,
    ...kineticShadow,
  },
  shortcutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  shortcutText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  summaryCard: {
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  logoutButton: {
    borderRadius: 24,
    backgroundColor: kineticPalette.errorContainer,
    paddingVertical: 18,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.error,
  },
});
