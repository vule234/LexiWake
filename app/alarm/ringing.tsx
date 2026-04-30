import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { learningApi } from '../../src/lib/api';
import { hasNativeAlarmSupport, nativeAlarmScheduler } from '../../src/lib/androidNativeAlarm';
import { useProfile, useProgress } from '../../src/lib/hooks';
import type { AlarmSoundKey } from '../../src/lib/alarmOptions';
import { getAlarmRingtoneUri } from '../../src/lib/alarmRingtones';
import { scheduleIosSnoozeNotification } from '../../src/lib/notifications';
import { useAppStore } from '../../src/stores/appStore';
import { kineticPalette } from '../../src/theme/kinetic';

type PreviewWord = {
  id: string;
  word: string;
  meaning: string;
  source: 'new' | 'review';
};

export default function AlarmRingingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    alarmId?: string;
    deckId?: string;
    deckName?: string;
    lessonDeckIds?: string;
    soundKey?: string;
    title?: string;
    time?: string;
    triggerSource?: string;
  }>();
  const nextAlarm = useAppStore((state) => state.nextAlarm);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { profile } = useProfile();
  const { streak } = useProgress();
  const [previewWords, setPreviewWords] = useState<PreviewWord[]>([]);
  const [loading, setLoading] = useState(true);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const alarmId = typeof params.alarmId === 'string' ? params.alarmId : '';
  const triggerSource = typeof params.triggerSource === 'string' ? params.triggerSource : 'preview';
  const isNativeAlarmTrigger = Platform.OS === 'android' && hasNativeAlarmSupport && triggerSource === 'native_alarm';
  const isIosForegroundAlarm = Platform.OS === 'ios' && triggerSource === 'ios_foreground_alarm';

  const deckId = typeof params.deckId === 'string' && params.deckId ? params.deckId : nextAlarm?.deckId || '';
  const lessonDeckIds = useMemo(() => {
    if (typeof params.lessonDeckIds === 'string' && params.lessonDeckIds.trim()) {
      return params.lessonDeckIds.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return nextAlarm?.lessonDeckIds || [];
  }, [nextAlarm?.lessonDeckIds, params.lessonDeckIds]);
  const soundKey = ((typeof params.soundKey === 'string' && params.soundKey) || nextAlarm?.soundKey || 'classic') as AlarmSoundKey;
  const displayTitle = (typeof params.title === 'string' && params.title) || nextAlarm?.title || 'LexiWake';
  const displayDeckName =
    (typeof params.deckName === 'string' && params.deckName) ||
    nextAlarm?.deckName ||
    'Từ vựng tiếng Anh căn bản';
  const displayTime = (typeof params.time === 'string' && params.time) || nextAlarm?.time || '07:00';
  const dailyTarget = profile.newDailyLimit || profile.dailyWordLimit || 5;

  useEffect(() => {
    if (isNativeAlarmTrigger) {
      return;
    }

    let mounted = true;

    const startRingtone = async () => {
      try {
        if (profile.soundEnabled !== false && soundKey !== 'silent' && soundKey !== 'vibrate') {
          const ringtoneUri = getAlarmRingtoneUri(soundKey);
          if (ringtoneUri) {
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
              shouldDuckAndroid: true,
            });

            const { sound } = await Audio.Sound.createAsync(
              { uri: ringtoneUri },
              { shouldPlay: true, isLooping: true }
            );

            if (!mounted) {
              await sound.unloadAsync();
              return;
            }

            ringtoneRef.current = sound;
          }
        }

        if (profile.vibrationEnabled !== false && soundKey !== 'silent') {
          Vibration.vibrate([0, 500, 300, 500], true);
        }
      } catch {}
    };

    void startRingtone();

    return () => {
      mounted = false;
      Vibration.cancel();
      const activeSound = ringtoneRef.current;
      ringtoneRef.current = null;
      if (activeSound) {
        void activeSound.stopAsync().catch(() => {});
        void activeSound.unloadAsync().catch(() => {});
      }
    };
  }, [isNativeAlarmTrigger, profile.soundEnabled, profile.vibrationEnabled, soundKey]);

  useEffect(() => {
    let mounted = true;

    const fetchPreview = async () => {
      if (!isAuthenticated || isGuest) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await learningApi.getToday({
          deckId,
          lessonDeckIds: lessonDeckIds.join(','),
        });
        const words = (response.data.words || []).slice(0, 4).map((word: any) => ({
          id: word.id,
          word: word.word,
          meaning: word.meaning,
          source: word.source,
        }));

        if (mounted) {
          setPreviewWords(words);
        }
      } catch (error) {
        if (mounted) {
          setPreviewWords([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      mounted = false;
    };
  }, [deckId, isAuthenticated, isGuest, lessonDeckIds]);

  const stopAlarmEffects = async () => {
    Vibration.cancel();
    const activeSound = ringtoneRef.current;
    ringtoneRef.current = null;
    if (activeSound) {
      try {
        await activeSound.stopAsync();
      } catch {}
      try {
        await activeSound.unloadAsync();
      } catch {}
    }
  };

  const handleStudyNow = async () => {
    if (isNativeAlarmTrigger && alarmId) {
      await nativeAlarmScheduler.dismissActiveAlarm(alarmId).catch(() => {});
    } else {
      await stopAlarmEffects();
    }

    router.push(
      isGuest
        ? '/(auth)/register'
        : {
            pathname: '/learning',
            params: {
              deckId,
              lessonDeckIds: lessonDeckIds.join(','),
              alarmId,
              triggerSource,
            },
          }
    );
  };

  const handleSnooze = async () => {
    if (isNativeAlarmTrigger && alarmId) {
      await nativeAlarmScheduler.snoozeAlarm(alarmId, 10).catch(() => {});
    } else if (isIosForegroundAlarm) {
      await stopAlarmEffects();
      await scheduleIosSnoozeNotification(
        {
          alarmId,
          deckId,
          deckName: displayDeckName,
          lessonDeckIds,
          title: displayTitle,
          time: displayTime,
        },
        10
      ).catch(() => {});
    } else {
      await stopAlarmEffects();
    }

    router.replace('/(tabs)');
  };

  const handleDismiss = async () => {
    if (isNativeAlarmTrigger && alarmId) {
      await nativeAlarmScheduler.dismissActiveAlarm(alarmId).catch(() => {});
    } else {
      await stopAlarmEffects();
    }

    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 18 }]}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.timeSection}>
        <View style={styles.ritualRow}>
          <Text style={styles.ritualIcon}>⏰</Text>
          <Text style={styles.ritualText}>Daily Ritual</Text>
        </View>
        <Text style={styles.heroTime}>{displayTime}</Text>
        <Text style={styles.heroDate}>
          {isIosForegroundAlarm ? 'Thông báo học đang diễn ra trong app' : 'Đã đến lúc học từ vựng'}
        </Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>{displayTitle}</Text>
          <View style={styles.topicChip}>
            <Text style={styles.topicChipText}>
              Bộ học: {displayDeckName}
            </Text>
          </View>
          {lessonDeckIds.length > 0 ? (
            <Text style={styles.scopeText}>Phạm vi đã chọn: {lessonDeckIds.length} bài học</Text>
          ) : null}

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Hành trình</Text>
              <Text style={styles.statValue}>Ngày {streak.current || 1}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Mục tiêu</Text>
              <Text style={styles.statValue}>{dailyTarget} từ mới</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
          {loading ? (
            <View style={styles.previewChipLoading}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          ) : previewWords.length > 0 ? (
            previewWords.map((word) => (
              <View key={word.id} style={styles.previewChip}>
                <Text style={styles.previewWord}>{word.word}</Text>
              </View>
            ))
          ) : (
            <View style={styles.previewChip}>
              <Text style={styles.previewWord}>Session mới</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStudyNow}
        >
          <Text style={styles.primaryButtonText}>
            {isGuest ? 'Tạo tài khoản để học' : 'Bắt đầu học ngay'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSnooze}
        >
          <Text style={styles.secondaryButtonText}>Snooze (10 phút)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>Tắt báo thức lần này</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakIconWrap}>
          <Text style={styles.streakIcon}>🏆</Text>
        </View>
        <View>
          <Text style={styles.streakLabel}>Streak</Text>
          <Text style={styles.streakValue}>{streak.current} ngày</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  backgroundGlowTop: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -120,
    right: -120,
    backgroundColor: 'rgba(79,70,229,0.18)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    left: -80,
    bottom: 80,
    backgroundColor: 'rgba(87,223,254,0.08)',
  },
  timeSection: {
    marginTop: 18,
    alignItems: 'center',
    gap: 6,
  },
  ritualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ritualIcon: {
    fontSize: 18,
  },
  ritualText: {
    fontSize: 13,
    fontWeight: '800',
    color: kineticPalette.primaryFixedDim || '#c3c0ff',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  heroTime: {
    fontSize: 88,
    lineHeight: 94,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -2,
  },
  heroDate: {
    fontSize: 18,
    color: 'rgba(218,215,255,0.78)',
  },
  middleSection: {
    gap: 18,
  },
  glassCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 24,
    gap: 18,
  },
  cardTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: '#ffffff',
  },
  topicChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(87,223,254,0.16)',
  },
  topicChipText: {
    color: kineticPalette.secondaryFixed || '#acedff',
    fontSize: 13,
    fontWeight: '700',
  },
  scopeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.76)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.46)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  previewRow: {
    gap: 10,
  },
  previewChipLoading: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  previewChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  previewWord: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: kineticPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    fontWeight: '700',
  },
  dismissButton: {
    minHeight: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dismissButtonText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 15,
    fontWeight: '800',
  },
  streakCard: {
    position: 'absolute',
    top: 56,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,221,184,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,221,184,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  streakIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: kineticPalette.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIcon: {
    fontSize: 18,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,185,95,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
});
