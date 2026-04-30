import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAlarms } from '../../src/lib/hooks';
import { formatNextAlarmOccurrence, getNextAlarmOccurrence } from '../../src/lib/alarmSchedule';
import { useAppStore } from '../../src/stores/appStore';
import { KineticBackdrop, KineticButton, KineticButtonText, KineticGlassCard } from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

const dayMap: Record<string, string> = {
  mon: 'T2',
  tue: 'T3',
  wed: 'T4',
  thu: 'T5',
  fri: 'T6',
  sat: 'T7',
  sun: 'CN',
};

const getRepeatLabel = (days: string[]) => {
  if (!days || days.length === 0) {
    return 'Một lần';
  }

  if (days.length === 7) {
    return 'Hàng ngày';
  }

  return days.map((day) => dayMap[day] || day).join(', ');
};

export default function AlarmListScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { alarms, loading, toggleAlarm, fetchAlarms } = useAlarms();

  useFocusEffect(
    useCallback(() => {
      fetchAlarms();
    }, [fetchAlarms])
  );

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleAlarm(id, isActive);
    } catch (error) {
      Alert.alert('Không thể cập nhật báo thức', 'Vui lòng thử lại sau.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMain}>
          <Text style={styles.brandText}>LexiWake</Text>
          <Text style={styles.title}>Báo thức</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(isAuthenticated && !isGuest ? '/alarm/create' : '/(auth)/register')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {isGuest ? (
        <KineticGlassCard style={styles.centerCard}>
          <Text style={styles.centerTitle}>Chế độ khách chưa quản lý báo thức thật</Text>
          <Text style={styles.centerText}>
            Để tạo và đồng bộ báo thức với learning session, bạn cần chuyển sang tài khoản thật.
          </Text>
          <KineticButton onPress={() => router.replace('/(auth)/register')}>
            <KineticButtonText>Tạo tài khoản</KineticButtonText>
          </KineticButton>
        </KineticGlassCard>
      ) : !isAuthenticated ? (
        <KineticGlassCard style={styles.centerCard}>
          <Text style={styles.centerTitle}>Cần đăng nhập để quản lý báo thức</Text>
          <Text style={styles.centerText}>
            Báo thức được lưu theo tài khoản để đồng bộ với dữ liệu học của bạn.
          </Text>
          <KineticButton onPress={() => router.replace('/(auth)/login')}>
            <KineticButtonText>Đăng nhập</KineticButtonText>
          </KineticButton>
        </KineticGlassCard>
      ) : loading ? (
        <KineticGlassCard style={styles.loadingCard}>
          <ActivityIndicator size="small" color={kineticPalette.primary} />
          <Text style={styles.loadingText}>Đang tải báo thức...</Text>
        </KineticGlassCard>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Học từ vựng mỗi khi thức giấc.</Text>
              <Text style={styles.heroText}>
                Chọn giờ, nhịp học và bộ từ để mỗi buổi sáng mở app là đi thẳng vào session.
              </Text>
            </View>

            <View style={styles.alarmList}>
              {alarms.map((alarm) => {
                const activeDays = alarm.repeatDays.filter((day) => dayMap[day]);
                const nextOccurrenceLabel = formatNextAlarmOccurrence(getNextAlarmOccurrence(alarm));

                return (
                  <TouchableOpacity
                    key={alarm.id}
                    style={[styles.alarmCard, !alarm.isActive && styles.alarmCardInactive]}
                    activeOpacity={0.95}
                    onPress={() => router.push({ pathname: '/alarm/edit', params: { id: alarm.id } })}
                  >
                    <View style={styles.alarmTopRow}>
                      <View>
                        <View style={styles.timeRow}>
                          <Text style={[styles.alarmTime, !alarm.isActive && styles.alarmTextInactive]}>
                            {alarm.time}
                          </Text>
                        </View>
                        <View style={styles.daysRow}>
                          {activeDays.map((day) => (
                            <View key={day} style={styles.dayBadge}>
                              <Text style={styles.dayBadgeText}>{dayMap[day]}</Text>
                            </View>
                          ))}
                          {activeDays.length === 0 ? (
                            <Text style={styles.repeatText}>Một lần</Text>
                          ) : null}
                        </View>
                      </View>

                      <Switch
                        value={alarm.isActive}
                        onValueChange={(value) => handleToggle(alarm.id, value)}
                        trackColor={{ false: kineticPalette.surfaceHighest, true: kineticPalette.primary }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    <View style={styles.deckCard}>
                      <Text style={styles.deckLabel}>Bộ từ vựng</Text>
                      <Text style={[styles.deckName, !alarm.isActive && styles.alarmTextInactive]}>
                        {alarm.deckName || alarm.title}
                      </Text>
                      <Text style={styles.deckSubtext}>
                        {getRepeatLabel(alarm.repeatDays)} • {alarm.dismissMode || 'standard'}
                      </Text>
                      <Text style={styles.deckSubtext}>Reo kế tiếp: {nextOccurrenceLabel}</Text>
                      {alarm.lessonDeckNames && alarm.lessonDeckNames.length > 0 ? (
                        <Text style={styles.deckSubtext}>
                          {alarm.lessonDeckNames.length} bài học: {alarm.lessonDeckNames.slice(0, 3).join(', ')}
                          {alarm.lessonDeckNames.length > 3 ? '...' : ''}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {alarms.length === 0 ? (
              <KineticGlassCard style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Chưa có báo thức nào</Text>
                <Text style={styles.emptyText}>
                  Tạo alarm đầu tiên để kết nối giờ thức dậy với phiên học ngắn mỗi ngày.
                </Text>
                <KineticButton onPress={() => router.push('/alarm/create')}>
                  <KineticButtonText>Thêm báo thức mới</KineticButtonText>
                </KineticButton>
              </KineticGlassCard>
            ) : (
              <View style={styles.quickStats}>
                <View style={styles.quickStatCardPrimary}>
                  <Text style={styles.quickStatValue}>{alarms.filter((alarm) => alarm.isActive).length}</Text>
                  <Text style={styles.quickStatLabelPrimary}>Alarm đang bật</Text>
                </View>
                <View style={styles.quickStatCardWarm}>
                  <Text style={styles.quickStatValueWarm}>{alarms.length}</Text>
                  <Text style={styles.quickStatLabelWarm}>Tổng số alarm</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={() => router.push('/alarm/create')}>
            <Text style={styles.fabText}>＋</Text>
          </TouchableOpacity>
        </>
      )}
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
    gap: 14,
    marginBottom: 14,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  headerMain: {
    flex: 1,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: kineticPalette.onSurface,
    lineHeight: 40,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: kineticPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  hero: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
    marginBottom: 4,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  centerCard: {
    gap: 12,
    marginTop: 20,
  },
  centerTitle: {
    fontSize: 18,
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
  alarmList: {
    gap: 16,
  },
  alarmCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 20,
    overflow: 'hidden',
  },
  alarmCardInactive: {
    opacity: 0.72,
    backgroundColor: kineticPalette.surfaceLow,
  },
  alarmTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  alarmTime: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  alarmTextInactive: {
    color: kineticPalette.outline,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  dayBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: kineticPalette.primaryFixed,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  repeatText: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.outline,
  },
  deckCard: {
    borderRadius: 18,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 16,
    gap: 4,
  },
  deckLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  deckSubtext: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  emptyState: {
    marginTop: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  quickStatCardPrimary: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    backgroundColor: kineticPalette.primary,
  },
  quickStatCardWarm: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(255,221,184,0.72)',
  },
  quickStatValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
  },
  quickStatLabelPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.76)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  quickStatValueWarm: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  quickStatLabelWarm: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: kineticPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 30,
    color: '#ffffff',
    lineHeight: 32,
  },
});
