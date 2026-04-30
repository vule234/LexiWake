import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alarmSoundOptions, type AlarmSoundKey } from '../../src/lib/alarmOptions';
import {
  getAlarmLessonActionLabel,
  getLessonProgressCopy,
  getLessonScopeState,
} from '../../src/lib/lessonScopeUi';
import { useAlarms, useDecks, useProfile } from '../../src/lib/hooks';
import { useAppStore } from '../../src/stores/appStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
  KineticStepHeader,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette } from '../../src/theme/kinetic';
import { goBackOrReplace } from '../../src/lib/navigation';

const dayOptions = [
  { id: 'mon', label: 'T2' },
  { id: 'tue', label: 'T3' },
  { id: 'wed', label: 'T4' },
  { id: 'thu', label: 'T5' },
  { id: 'fri', label: 'T6' },
  { id: 'sat', label: 'T7' },
  { id: 'sun', label: 'CN' },
];

const timeOptions = ['06:30', '07:00', '07:30', '08:00', '08:30'];

export default function SetupAlarmScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ newDailyLimit?: string; sessionLength?: string; mode?: string }>();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { profile, updateProfile, setActiveLearningScope } = useProfile();
  const { decks } = useDecks();
  const { createAlarm } = useAlarms();
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [soundKey, setSoundKey] = useState<AlarmSoundKey>('classic');
  const [saving, setSaving] = useState(false);

  const dailyWordLimit = [5, 10, 15].includes(Number(params.newDailyLimit))
    ? Number(params.newDailyLimit)
    : profile.newDailyLimit || 5;
  const sessionLength =
    params.sessionLength === 'quick' || params.sessionLength === 'standard' || params.sessionLength === 'deep'
      ? params.sessionLength
      : profile.sessionLength || 'quick';
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;
  const lessonOptions = selectedDeck?.lessons || [];

  useEffect(() => {
    if (selectedDeckId || decks.length === 0) {
      return;
    }

    const initialDeck = decks.find((deck) => deck.id === profile.activeDeckId) || decks[0];
    setSelectedDeckId(initialDeck.id);
    setSelectedLessonIds([]);
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
    setSelectedDays((current) =>
      current.includes(dayId) ? current.filter((day) => day !== dayId) : [...current, dayId]
    );
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

  const handleComplete = async () => {
    if (!isAuthenticated || isGuest) {
      router.replace('/(auth)/register');
      return;
    }

    if (alarmEnabled && selectedDays.length === 0) {
      Alert.alert('Thiếu ngày lặp', 'Vui lòng chọn ít nhất một ngày.');
      return;
    }

    if (selectedDeck && lessonOptions.length > 0 && selectedLessonIds.length === 0) {
      Alert.alert('Chưa chọn bài học', 'Vui lòng chọn ít nhất một bài học để hoàn tất thiết lập.');
      return;
    }

    try {
      setSaving(true);

      if (selectedDeck && selectedLessonIds.length > 0) {
        await setActiveLearningScope(selectedDeck.id, selectedLessonIds);
      }

      await updateProfile({
        onboardingCompleted: true,
        dailyWordLimit,
        newDailyLimit: dailyWordLimit,
        sessionLength,
      });

      if (alarmEnabled && selectedDeck) {
        await createAlarm({
          title: `${selectedDeck.name} Alarm`,
          time: selectedTime,
          repeatDays: selectedDays,
          isActive: true,
          deckId: selectedDeck.id,
          deckName: selectedDeck.name,
          lessonDeckIds: selectedLessonIds,
          soundKey,
        });
      }

      router.replace({
        pathname: '/onboarding/success',
        params: {
          dailyWordLimit: String(dailyWordLimit),
          sessionLength,
          time: selectedTime,
          deckName: selectedDeck?.name || 'Bộ học mặc định',
        },
      });
    } catch (error: any) {
      Alert.alert('Không thể hoàn tất thiết lập', error?.response?.data?.error || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBackOrReplace('/onboarding/learning')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KineticStepHeader
          step={2}
          total={2}
          title="Alarm đầu tiên"
          subtitle="Hoàn tất nhịp học, chọn scope mặc định và tạo alarm mẫu sau khi đã đăng nhập."
        />

        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroTime}>{selectedTime}</Text>
          <Text style={styles.heroTitle}>
            {alarmEnabled ? 'Alarm đầu tiên đã sẵn sàng' : 'Hoàn tất mà chưa cần alarm'}
          </Text>
          <Text style={styles.heroText}>
            {dailyWordLimit} từ/ngày • session {sessionLength} • {selectedDays.length} ngày lặp
          </Text>
          <Text style={styles.heroText}>
            {selectedDeck?.name || 'Chưa chọn bộ từ'} • {selectedLessonIds.length} bài học
          </Text>
        </KineticGlassCard>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionMain}>
              <Text style={styles.sectionTitle}>Tạo alarm onboarding</Text>
              <Text style={styles.sectionText}>
                Nếu tắt, app vẫn lưu nhịp học và scope mặc định, nhưng chưa tạo báo thức đầu tiên.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.togglePill, alarmEnabled && styles.togglePillActive]}
              onPress={() => setAlarmEnabled((current) => !current)}
            >
              <Text style={[styles.toggleText, alarmEnabled && styles.toggleTextActive]}>
                {alarmEnabled ? 'Bật' : 'Tắt'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bộ học mặc định</Text>
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
                    <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>{deck.name}</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lesson mặc định</Text>
          {lessonOptions.length === 0 ? (
            <Text style={styles.sectionText}>Bộ này chưa có bài học.</Text>
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
                          pathname: '/onboarding/lesson',
                          params: {
                            deckId: selectedDeck?.id || '',
                            deckName: selectedDeck?.name || '',
                            lessonId: lesson.id,
                            lessonName: lesson.name,
                            backTo: '/onboarding/alarm',
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

        {alarmEnabled ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Giờ học</Text>
              <View style={styles.wrapRow}>
                {timeOptions.map((time) => {
                  const active = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Lặp lại</Text>
              <View style={styles.wrapRow}>
                {dayOptions.map((day) => {
                  const active = selectedDays.includes(day.id);
                  return (
                    <TouchableOpacity
                      key={day.id}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => toggleDay(day.id)}
                    >
                      <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
            </View>
          </>
        ) : null}

        <KineticGlassCard style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Nhịp học đã chốt</Text>
          <Text style={styles.summaryText}>{dailyWordLimit} từ mới mỗi ngày</Text>
          <Text style={styles.summaryText}>Session {sessionLength}</Text>
          <Text style={styles.summaryText}>
            Bộ từ mặc định: {selectedDeck?.name || 'Chưa chọn bộ từ'} • {selectedLessonIds.length} bài học
          </Text>
        </KineticGlassCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton disabled={saving} onPress={handleComplete}>
          <KineticButtonText>{saving ? 'Đang hoàn tất...' : 'Hoàn tất thiết lập'}</KineticButtonText>
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
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: kineticPalette.onSurface,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 18,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 221, 184, 0.56)',
    gap: 6,
  },
  heroTime: {
    fontSize: 40,
    fontWeight: '900',
    color: kineticPalette.primary,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: kineticPalette.onSurface,
    marginBottom: 6,
  },
  heroText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  summaryCard: {
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurface,
  },
  section: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionMain: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  togglePill: {
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceHigh,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  togglePillActive: {
    backgroundColor: kineticPalette.primaryContainer,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  toggleTextActive: {
    color: kineticPalette.onPrimaryContainer,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceHigh,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipActive: {
    backgroundColor: kineticPalette.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  chipTextActive: {
    color: kineticPalette.onPrimary,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: kineticPalette.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
  },
  dayChipTextActive: {
    color: kineticPalette.onPrimary,
  },
  optionColumn: {
    gap: 10,
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
    minWidth: 84,
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
    color: kineticPalette.onPrimary,
  },
  lessonSelectTextCompleted: {
    color: kineticPalette.onPrimary,
  },
  footer: {
    paddingTop: 12,
  },
});
