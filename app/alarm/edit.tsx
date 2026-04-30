import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import TimeWheelPicker from '../../src/components/alarm/TimeWheelPicker';
import { alarmSoundOptions, type AlarmSoundKey } from '../../src/lib/alarmOptions';
import { playAlarmRingtonePreview } from '../../src/lib/alarmRingtones';
import {
  getAlarmLessonActionLabel,
  getLessonProgressCopy,
  getLessonScopeState,
} from '../../src/lib/lessonScopeUi';
import {
  canShowAndroidAlarmSettings,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  openNotificationSettings,
} from '../../src/lib/androidAlarmSettings';
import { useAlarms, useDecks } from '../../src/lib/hooks';
import { isNotificationPreviewUnsupported, scheduleDebugAlarmPreview } from '../../src/lib/notifications';
import { goBackOrReplace } from '../../src/lib/navigation';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';

const days = [
  { id: 'mon', label: 'T2' },
  { id: 'tue', label: 'T3' },
  { id: 'wed', label: 'T4' },
  { id: 'thu', label: 'T5' },
  { id: 'fri', label: 'T6' },
  { id: 'sat', label: 'T7' },
  { id: 'sun', label: 'CN' },
];

const parseTime = (time: string) => {
  const [rawHour, rawMinute] = (time || '07:00').split(':').map(Number);
  const hour = Number.isFinite(rawHour) ? Math.min(Math.max(rawHour, 0), 23) : 7;
  const minute = Number.isFinite(rawMinute) ? Math.min(Math.max(rawMinute, 0), 59) : 0;
  return { hour, minute };
};

const toTimeString = (hour: number, minute: number) =>
  `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

export default function EditAlarmScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { alarms, loading, updateAlarm, deleteAlarm } = useAlarms();
  const { decks } = useDecks();
  const alarm = useMemo(() => alarms.find((item) => item.id === id), [alarms, id]);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [lessonDeckIds, setLessonDeckIds] = useState<string[]>([]);
  const [soundKey, setSoundKey] = useState<AlarmSoundKey>('classic');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const isIos = Platform.OS === 'ios';

  useEffect(() => {
    if (!alarm) {
      return;
    }

    const parsed = parseTime(alarm.time);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setRepeatDays(alarm.repeatDays || []);
    setIsActive(alarm.isActive);
    setDeckId(alarm.deckId || null);
    setLessonDeckIds(alarm.lessonDeckIds || []);
    setSoundKey(alarm.soundKey || 'classic');
  }, [alarm]);

  const selectedDeck = decks.find((deck) => deck.id === deckId) || null;
  const lessonOptions = selectedDeck?.lessons || [];
  const alarmTime = toTimeString(hour, minute);

  useEffect(() => {
    if (!selectedDeck) {
      setLessonDeckIds([]);
      return;
    }

    const availableLessonIds = new Set((selectedDeck.lessons || []).map((lesson) => lesson.id));
    setLessonDeckIds((current) => {
      const filtered = current.filter((lessonId) => availableLessonIds.has(lessonId));
      return filtered;
    });
  }, [selectedDeck?.id]);

  const toggleDay = (dayId: string) => {
    setRepeatDays((current) =>
      current.includes(dayId) ? current.filter((day) => day !== dayId) : [...current, dayId]
    );
  };

  const handleSelectDeck = (nextDeckId: string) => {
    setDeckId(nextDeckId);
    setLessonDeckIds([]);
  };

  const toggleLesson = (lessonId: string) => {
    setLessonDeckIds((current) =>
      current.includes(lessonId)
        ? current.filter((item) => item !== lessonId)
        : [...current, lessonId]
    );
  };

  const handleTestSound = async () => {
    if (soundKey === 'silent') {
      Alert.alert('Chuông im lặng', 'Preset này không phát audio. Hãy chọn chuông khác để test.');
      return;
    }

    if (soundKey === 'vibrate') {
      Alert.alert('Preset rung', 'Preset này chỉ rung khi báo thức reo, không có file audio để preview.');
      return;
    }

    try {
      setTestingSound(true);
      await playAlarmRingtonePreview(soundKey);
    } catch {
      Alert.alert('Không thể phát thử chuông', 'Kiểm tra lại loa máy hoặc quyền audio của thiết bị.');
    } finally {
      setTestingSound(false);
    }
  };

  const handleTestNotification = async () => {
    if (!alarm || !selectedDeck) {
      return;
    }

    if (isNotificationPreviewUnsupported()) {
      Alert.alert(
        'Expo Go không hỗ trợ flow này',
        'Android Expo Go sẽ không preview notification alarm ổn định với expo-notifications. Hãy dùng "Mở màn ringing demo" hoặc chạy development build để test notification thật.'
      );
      return;
    }

    try {
      setTestingNotification(true);
      await scheduleDebugAlarmPreview({
        ...alarm,
        time: alarmTime,
        repeatDays,
        isActive,
        soundKey,
        deckId: selectedDeck.id,
        deckName: selectedDeck.name,
        lessonDeckIds,
      });
      Alert.alert(
        'Đã lên lịch notification test',
        isIos
          ? 'Thông báo time-sensitive sẽ kích hoạt sau 5 giây. Nếu app đang mở, ringing screen sẽ bật trong app; nếu app ở nền, chạm notification sẽ vào thẳng session học.'
          : 'Alarm test sẽ kích hoạt sau 5 giây. Trên dev build Android, màn ringing sẽ tự bật và chuông sẽ reo liên tục.'
      );
    } catch {
      Alert.alert('Không thể test notification', 'Kiểm tra quyền thông báo hoặc thử lại bằng development build.');
    } finally {
      setTestingNotification(false);
    }
  };

  const handleOpenRingingPreview = () => {
    if (!selectedDeck || !alarm) {
      return;
    }

    router.push({
      pathname: '/alarm/ringing',
      params: {
        alarmId: alarm.id,
        deckId: selectedDeck.id,
        deckName: selectedDeck.name,
        lessonDeckIds: lessonDeckIds.join(','),
        soundKey,
        title: alarm.title,
        time: alarmTime,
        triggerSource: 'preview',
      },
    });
  };

  const handleSave = async () => {
    if (!alarm) {
      return;
    }

    try {
      setSaving(true);
      if (lessonOptions.length > 0 && lessonDeckIds.length === 0) {
      Alert.alert('Chưa chọn bài học', 'Vui lòng chọn ít nhất một bài học để học.');
        return;
      }
      await updateAlarm(alarm.id, {
        title: alarm.title,
        time: alarmTime,
        repeatDays,
        isActive,
        soundKey,
        deckId,
        lessonDeckIds,
      });
      router.replace('/alarm');
    } catch {
      Alert.alert('Không thể cập nhật báo thức', 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!alarm) {
      return;
    }

    Alert.alert('Xóa báo thức', 'Báo thức này sẽ bị xóa khỏi tài khoản của bạn.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteAlarm(alarm.id);
            router.replace('/alarm');
          } catch {
            Alert.alert('Không thể xóa báo thức', 'Vui lòng thử lại.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading && !alarm) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <KineticBackdrop />
        <KineticGlassCard style={styles.centerCard}>
          <ActivityIndicator size="small" color={kineticPalette.primary} />
          <Text style={styles.centerText}>Đang tải báo thức...</Text>
        </KineticGlassCard>
      </View>
    );
  }

  if (!alarm) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <KineticBackdrop />
        <KineticGlassCard style={styles.centerCard}>
          <Text style={styles.centerTitle}>Không tìm thấy báo thức</Text>
          <KineticButton onPress={() => router.replace('/alarm')}>
            <KineticButtonText>Về danh sách</KineticButtonText>
          </KineticButton>
        </KineticGlassCard>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/alarm')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa báo thức</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.headerAction}>{saving ? '...' : 'Lưu'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroTime}>{alarmTime}</Text>
          <Text style={styles.heroTitle}>{alarm.title}</Text>
          <Text style={styles.heroText}>
            {selectedDeck?.name || alarm.deckName || 'Chưa gắn bộ từ'} • {lessonDeckIds.length} bài học
          </Text>
        </KineticGlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Giờ báo thức</Text>
          <TimeWheelPicker hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchMain}>
              <Text style={styles.switchTitle}>Kích hoạt báo thức</Text>
              <Text style={styles.switchText}>Trạng thái sẽ được đồng bộ với backend.</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: kineticPalette.surfaceHighest, true: kineticPalette.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lặp lại</Text>
          <View style={styles.daysRow}>
            {days.map((day) => {
              const active = repeatDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayButton, active && styles.dayButtonActive]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Deck</Text>
          <View style={styles.optionColumn}>
            {decks.map((deck) => {
              const active = deckId === deck.id;
              return (
                <TouchableOpacity
                  key={deck.id}
                  style={[styles.rowCard, active && styles.rowCardActive]}
                  onPress={() => handleSelectDeck(deck.id)}
                >
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>{deck.name}</Text>
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>
                      {deck.wordCount} từ • {deck.lessonCount || 0} bài học
                    </Text>
                  </View>
                  <Text style={[styles.rowCheck, active && styles.rowCheckActive]}>
                    {active ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bài học</Text>
          {lessonOptions.length === 0 ? (
            <Text style={styles.rowText}>Bộ từ này chưa có bài học.</Text>
          ) : (
            <View style={styles.lessonList}>
              {lessonOptions.map((lesson) => {
                const active = lessonDeckIds.includes(lesson.id);
                const lessonState = getLessonScopeState(lesson, active);
                const isCompleted = lessonState === 'completed';

                return (
                  <View
                    key={lesson.id}
                    style={[
                      styles.lessonRow,
                      active && styles.lessonRowActive,
                      isCompleted && styles.lessonRowCompleted,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.lessonPreviewButton}
                      onPress={() =>
                        router.push({
                          pathname: '/alarm/lesson',
                          params: {
                            deckId: selectedDeck?.id || '',
                            deckName: selectedDeck?.name || '',
                            lessonId: lesson.id,
                            lessonName: lesson.name,
                            backTo: `/alarm/edit?id=${alarm.id}`,
                          },
                        })
                      }
                    >
                      <View style={styles.lessonMain}>
                        <View style={styles.lessonTitleRow}>
                          <Text style={styles.lessonTitle}>{lesson.name}</Text>
                          {isCompleted ? (
                            <View style={styles.lessonCompletedBadge}>
                              <Text style={styles.lessonCompletedBadgeText}>Đã xong</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.lessonText}>
                          {lesson.wordCount} từ • {getLessonProgressCopy(lesson)}
                        </Text>
                      </View>
                      <Text style={styles.lessonPreviewHint}>Xem từ ›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.lessonSelectButton,
                        (active || isCompleted) && styles.lessonSelectButtonActive,
                        isCompleted && styles.lessonSelectButtonCompleted,
                      ]}
                      onPress={() => toggleLesson(lesson.id)}
                    >
                      <Text
                        style={[
                          styles.lessonSelectText,
                          (active || isCompleted) && styles.lessonSelectTextActive,
                          isCompleted && styles.lessonSelectTextCompleted,
                        ]}
                      >
                        {getAlarmLessonActionLabel(lesson, active)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Chuông báo thức</Text>
          <View style={styles.optionColumn}>
            {alarmSoundOptions.map((option) => {
              const active = soundKey === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.rowCard, active && styles.rowCardActive]}
                  onPress={() => setSoundKey(option.key)}
                >
                  <View style={styles.rowMain}>
                    <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>{option.label}</Text>
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>{option.description}</Text>
                  </View>
                  <Text style={[styles.rowCheck, active && styles.rowCheckActive]}>
                    {active ? 'Chọn' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.inlineLink} onPress={() => router.push('/alarm/sound')}>
            <Text style={styles.inlineLinkText}>Mở cài đặt âm thanh nâng cao</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Test alarm trong Expo</Text>
          <Text style={styles.rowText}>
            {isIos
              ? 'Trên iPhone, notification sẽ dùng sound hệ thống và hiện time-sensitive nếu người dùng cấp quyền. Nếu app đang mở, ringing screen sẽ bật ngay trong app.'
              : 'Dùng ba nút này để biết lỗi nằm ở lịch notification, điều hướng sang ringing hay phần phát audio trong app.'}
          </Text>
          <View style={styles.optionColumn}>
            <TouchableOpacity style={styles.debugButton} onPress={handleTestSound} disabled={testingSound}>
              <Text style={styles.debugButtonText}>
                {testingSound ? 'Đang phát thử...' : 'Test chuông ngay'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleTestNotification}
              disabled={testingNotification}
            >
              <Text style={styles.debugButtonText}>
                {testingNotification ? 'Đang lên lịch...' : 'Test notification sau 5 giây'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.debugButton} onPress={handleOpenRingingPreview}>
              <Text style={styles.debugButtonText}>Mở màn ringing demo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {canShowAndroidAlarmSettings ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Báo thức kiểu máy</Text>
            <Text style={styles.rowText}>
              Trên Android thật, hãy cấp thêm các quyền hệ thống này để báo thức tiến gần hành vi mặc định của máy.
            </Text>
            <View style={styles.optionColumn}>
              <TouchableOpacity style={styles.debugButton} onPress={() => void openExactAlarmSettings()}>
                <Text style={styles.debugButtonText}>Mở Alarms & reminders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.debugButton} onPress={() => void openFullScreenIntentSettings()}>
                <Text style={styles.debugButtonText}>Mở Full-screen intent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.debugButton} onPress={() => void openNotificationSettings()}>
                <Text style={styles.debugButtonText}>Mở Notification settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.deleteButton} disabled={deleting} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>{deleting ? 'Đang xóa...' : 'Xóa báo thức'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kineticPalette.background, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerButton: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  headerIcon: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  headerTitle: { fontSize: 20, fontWeight: '900', color: kineticPalette.onSurface },
  headerAction: { fontSize: 14, fontWeight: '800', color: kineticPalette.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 16 },
  centerCard: { gap: 12, marginTop: 20 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  centerText: { fontSize: 14, color: kineticPalette.onSurfaceVariant },
  heroCard: { gap: 6 },
  heroTime: { fontSize: 42, fontWeight: '900', color: kineticPalette.primary },
  heroTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.onSurface },
  heroText: { fontSize: 14, color: kineticPalette.onSurfaceVariant },
  section: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchMain: { flex: 1, gap: 4 },
  switchTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  switchText: { fontSize: 13, color: kineticPalette.onSurfaceVariant },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: { backgroundColor: kineticPalette.primary },
  dayText: { fontSize: 13, fontWeight: '800', color: kineticPalette.onSurfaceVariant },
  dayTextActive: { color: '#ffffff' },
  optionColumn: { gap: 10 },
  lessonList: { gap: 10 },
  lessonRow: {
    borderRadius: 18,
    backgroundColor: kineticPalette.surfaceLow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  lessonRowActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  lessonPreviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lessonMain: {
    flex: 1,
    gap: 4,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  lessonText: {
    fontSize: 12,
    color: kineticPalette.onSurfaceVariant,
  },
  lessonRowCompleted: {
    backgroundColor: '#ecfdf3',
  },
  lessonCompletedBadge: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lessonCompletedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
  },
  lessonPreviewHint: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  lessonSelectButton: {
    minWidth: 98,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  lessonSelectButtonActive: {
    backgroundColor: kineticPalette.primary,
  },
  lessonSelectButtonCompleted: {
    backgroundColor: '#16a34a',
  },
  lessonSelectText: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  lessonSelectTextActive: {
    color: '#ffffff',
  },
  lessonSelectTextCompleted: {
    color: '#ffffff',
  },
  rowCard: {
    borderRadius: 16,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowCardActive: { backgroundColor: kineticPalette.primaryFixed },
  rowMain: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: kineticPalette.onSurface },
  rowTitleActive: { color: kineticPalette.primary },
  rowText: { fontSize: 13, color: kineticPalette.onSurfaceVariant },
  rowTextActive: { color: kineticPalette.primaryContainer },
  rowCheck: { minWidth: 36, textAlign: 'center', fontSize: 12, fontWeight: '800', color: kineticPalette.outline },
  rowCheckActive: { color: kineticPalette.primary },
  inlineLink: { paddingTop: 4, alignSelf: 'flex-start' },
  inlineLinkText: { fontSize: 13, fontWeight: '800', color: kineticPalette.primary },
  debugButton: {
    borderRadius: 16,
    backgroundColor: kineticPalette.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  debugButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  deleteButton: {
    borderRadius: 20,
    backgroundColor: kineticPalette.errorContainer,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 16, fontWeight: '800', color: kineticPalette.error },
});
