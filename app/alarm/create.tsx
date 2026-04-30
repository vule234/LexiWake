import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useAlarms, useDecks, useProfile } from '../../src/lib/hooks';
import { isNotificationPreviewUnsupported, scheduleDebugAlarmPreview } from '../../src/lib/notifications';
import { useAppStore } from '../../src/stores/appStore';
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

const timeOptions = [2, 5, 10];

export default function CreateAlarmScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { decks, loading: decksLoading } = useDecks();
  const { profile } = useProfile();
  const { createAlarm } = useAlarms();

  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(30);
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [learningTime, setLearningTime] = useState(5);
  const [soundKey, setSoundKey] = useState<AlarmSoundKey>('classic');
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [snoozeMinutes] = useState(5);
  const [saving, setSaving] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const isIos = Platform.OS === 'ios';

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || decks[0] || null;
  const lessonOptions = selectedDeck?.lessons || [];

  const alarmTime = useMemo(
    () => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    [hours, minutes]
  );

  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      const initialDeck = decks.find((deck) => deck.id === profile.activeDeckId) || decks[0];
      setSelectedDeckId(initialDeck.id);
      setSelectedLessonIds([]);
    }
  }, [decks, profile.activeDeckId, selectedDeckId]);

  useEffect(() => {
    if (!selectedDeck) {
      setSelectedLessonIds([]);
      return;
    }

    const availableLessonIds = new Set((selectedDeck.lessons || []).map((lesson) => lesson.id));
    setSelectedLessonIds((current) => {
      const filtered = current.filter((lessonId) => availableLessonIds.has(lessonId));
      return filtered;
    });
  }, [selectedDeck?.id]);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((day) => day !== dayId));
      return;
    }

    setSelectedDays([...selectedDays, dayId]);
  };

  const handleSelectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    setSelectedLessonIds([]);
  };

  const toggleLesson = (lessonId: string) => {
    setSelectedLessonIds((current) =>
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
    if (!selectedDeck) {
      Alert.alert('Chưa có bộ từ', 'Hiện chưa tải được deck từ backend.');
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
        id: `preview-${Date.now()}`,
        title: `${selectedDeck.name} Alarm`,
        time: alarmTime,
        repeatDays: selectedDays,
        isActive: true,
        soundKey,
        deckId: selectedDeck.id,
        deckName: selectedDeck.name,
        lessonDeckIds: selectedLessonIds,
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
    if (!selectedDeck) {
      return;
    }

    router.push({
      pathname: '/alarm/ringing',
      params: {
        deckId: selectedDeck.id,
        deckName: selectedDeck.name,
        lessonDeckIds: selectedLessonIds.join(','),
        soundKey,
        title: `${selectedDeck.name} Alarm`,
        time: alarmTime,
        triggerSource: 'preview',
      },
    });
  };

  const handleSave = async () => {
    if (!isAuthenticated || isGuest) {
      router.replace('/(auth)/register');
      return;
    }

    if (!selectedDeck) {
      Alert.alert('Chưa có bộ từ', 'Hiện chưa tải được deck từ backend.');
      return;
    }

    if (lessonOptions.length > 0 && selectedLessonIds.length === 0) {
      Alert.alert('Chưa chọn bài học', 'Vui lòng chọn ít nhất một bài học để học.');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Thiếu ngày lặp', 'Vui lòng chọn ít nhất một ngày.');
      return;
    }

    try {
      setSaving(true);
      await createAlarm({
        title: `${selectedDeck.name} Alarm`,
        time: alarmTime,
        repeatDays: selectedDays,
        snoozeMinutes: snoozeEnabled ? snoozeMinutes : 0,
        dismissMode: learningTime >= 10 ? 'challenge' : learningTime >= 5 ? 'standard' : 'quick',
        soundKey,
        deckId: selectedDeck.id,
        deckName: selectedDeck.name,
        lessonDeckIds: selectedLessonIds,
        isActive: true,
      });
      router.replace('/alarm');
    } catch (error: any) {
      Alert.alert('Không thể tạo báo thức', error?.response?.data?.error || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/alarm')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt báo thức</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroTime}>{alarmTime}</Text>
          <Text style={styles.heroTitle}>Alarm sẵn sàng cho buổi học mới</Text>
          <Text style={styles.heroText}>
            {selectedDeck?.name || 'Chưa chọn bộ từ'} • {selectedLessonIds.length} bài học • {learningTime} phút
          </Text>
        </KineticGlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Giờ báo thức</Text>
          <TimeWheelPicker
            hour={hours}
            minute={minutes}
            onHourChange={setHours}
            onMinuteChange={setMinutes}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lặp lại</Text>
          <View style={styles.daysRow}>
            {days.map((day) => {
              const active = selectedDays.includes(day.id);
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

        <View style={styles.gridRow}>
          <View style={[styles.section, styles.gridSection]}>
            <Text style={styles.sectionLabel}>Bộ từ vựng</Text>
            {decksLoading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator size="small" color={kineticPalette.primary} />
                <Text style={styles.inlineText}>Đang tải bộ từ...</Text>
              </View>
            ) : (
              <View style={styles.optionColumn}>
                {decks.map((deck) => {
                  const active = selectedDeck?.id === deck.id;
                  return (
                    <TouchableOpacity
                      key={deck.id}
                      style={[styles.rowCard, active && styles.rowCardActive]}
                      onPress={() => handleSelectDeck(deck.id)}
                    >
                      <View style={styles.rowMain}>
                        <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>
                          {deck.name}
                        </Text>
                        <Text style={[styles.rowText, active && styles.rowTextActive]}>
                          {deck.wordCount} từ • {deck.lessonCount || 0} bài học
                        </Text>
                      </View>
                      <Text style={[styles.rowCheck, active && styles.rowCheckActive]}>
                        {active ? 'Chọn' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={[styles.section, styles.gridSection]}>
            <Text style={styles.sectionLabel}>Thời gian học</Text>
            <View style={styles.optionColumn}>
              {timeOptions.map((time) => {
                const active = learningTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.segmentButton, active && styles.segmentButtonActive]}
                    onPress={() => setLearningTime(time)}
                  >
                    <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>
                      {time}p
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.deckText}>
              Dismiss mode: {learningTime >= 10 ? 'challenge' : learningTime >= 5 ? 'standard' : 'quick'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bài học</Text>
          {lessonOptions.length === 0 ? (
            <Text style={styles.deckText}>Bộ từ này chưa có bài học.</Text>
          ) : (
            <View style={styles.lessonList}>
              {lessonOptions.map((lesson) => {
                const active = selectedLessonIds.includes(lesson.id);
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
                            backTo: '/alarm/create',
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
          <Text style={styles.deckText}>
            Đã chọn {selectedLessonIds.length} bài học cho phiên học từ báo thức này.
          </Text>
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
                    <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>
                      {option.description}
                    </Text>
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
          <Text style={styles.deckText}>
            {isIos
              ? 'Trên iPhone, notification sẽ dùng sound hệ thống và hiện time-sensitive nếu người dùng cấp quyền. Nếu app đang mở, ringing screen sẽ bật ngay trong app.'
              : 'Expo Go chỉ preview được notification và màn ringing. Để test chuông nền ổn định hơn, dùng development build Android thật.'}
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
            <Text style={styles.deckText}>
              Để app gần hành vi báo thức thật hơn khi đã build APK, hãy bật đủ quyền Android ở dưới.
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
            <Text style={styles.deckText}>
              Lưu ý: các quyền này phát huy đúng trên APK/dev build, không phải Expo Go.
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchMain}>
              <Text style={styles.switchTitle}>Snooze</Text>
              <Text style={styles.switchText}>
                {snoozeEnabled ? `${snoozeMinutes} phút` : 'Tắt tạm dừng'}
              </Text>
            </View>
            <Switch
              value={snoozeEnabled}
              onValueChange={setSnoozeEnabled}
              trackColor={{ false: kineticPalette.surfaceHighest, true: kineticPalette.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#ffffff" /> : <KineticButtonText>Lưu báo thức</KineticButtonText>}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    gap: 6,
  },
  heroTime: {
    fontSize: 42,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  heroText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
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
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: kineticPalette.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  dayTextActive: {
    color: '#ffffff',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridSection: {
    flex: 1,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  deckText: {
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  lessonList: {
    gap: 10,
  },
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
  optionColumn: {
    gap: 10,
  },
  segmentButton: {
    borderRadius: 14,
    backgroundColor: kineticPalette.surfaceHigh,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: kineticPalette.primary,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  segmentButtonTextActive: {
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
  rowCardActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  rowMain: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  rowTitleActive: {
    color: kineticPalette.primary,
  },
  rowText: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  rowTextActive: {
    color: kineticPalette.primaryContainer,
  },
  rowCheck: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.outline,
  },
  rowCheckActive: {
    color: kineticPalette.primary,
  },
  inlineLink: {
    paddingTop: 4,
    alignSelf: 'flex-start',
  },
  inlineLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchMain: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  switchText: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  footer: {
    paddingTop: 12,
  },
});
