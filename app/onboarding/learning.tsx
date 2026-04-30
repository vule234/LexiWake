import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useProfile } from '../../src/lib/hooks';
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

const dailyWordOptions = [5, 10, 15];
const sessionOptions = [
  { value: 'quick', title: 'Quick', text: '2-3 phút' },
  { value: 'standard', title: 'Standard', text: '5 phút' },
  { value: 'deep', title: 'Deep', text: '8-10 phút' },
] as const;

export default function OnboardingLearningScreen() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const { profile } = useProfile();
  const [dailyWordLimit, setDailyWordLimit] = useState(profile.newDailyLimit || profile.dailyWordLimit || 5);
  const [sessionLength, setSessionLength] =
    useState<typeof sessionOptions[number]['value']>(profile.sessionLength || 'quick');

  useEffect(() => {
    if (!isAuthenticated || isGuest) {
      router.replace('/(auth)/register');
    }
  }, [isAuthenticated, isGuest]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <KineticStepHeader
          step={1}
          total={2}
          title="Cấu hình học tập"
          subtitle="Chọn số từ mới mỗi ngày và độ dài phiên học trước khi tạo alarm đầu tiên."
        />

        <KineticGlassCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>{dailyWordLimit} từ/ngày</Text>
          <Text style={styles.heroText}>
            Session hiện tại: {sessionLength}. Thiết lập này sẽ dùng cho Home, Library và learning plan.
          </Text>
        </KineticGlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Số từ mới mỗi ngày</Text>
          <View style={styles.wrapRow}>
            {dailyWordOptions.map((value) => {
              const active = dailyWordLimit === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDailyWordLimit(value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{value} từ</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Độ dài session</Text>
          <View style={styles.optionList}>
            {sessionOptions.map((option) => {
              const active = sessionLength === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.segmentCard, active && styles.segmentCardActive]}
                  onPress={() => setSessionLength(option.value)}
                >
                  <View style={styles.segmentMain}>
                    <Text style={[styles.segmentTitle, active && styles.segmentTitleActive]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                      {option.text}
                    </Text>
                  </View>
                  <Text style={[styles.segmentCheck, active && styles.segmentCheckActive]}>
                    {active ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <KineticButton
          onPress={() =>
            router.push({
              pathname: '/onboarding/alarm',
              params: {
                mode: 'profileSetup',
                newDailyLimit: String(dailyWordLimit),
                sessionLength,
              },
            })
          }
        >
          <KineticButtonText>Sang bước báo thức</KineticButtonText>
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
    gap: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  heroText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  section: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 14,
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
  optionList: {
    gap: 10,
  },
  segmentCard: {
    borderRadius: 18,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentCardActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  segmentMain: {
    flex: 1,
    gap: 4,
  },
  segmentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  segmentTitleActive: {
    color: kineticPalette.primary,
  },
  segmentText: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  segmentTextActive: {
    color: kineticPalette.primaryContainer,
  },
  segmentCheck: {
    minWidth: 20,
    textAlign: 'center',
    color: kineticPalette.outline,
    fontWeight: '900',
  },
  segmentCheckActive: {
    color: kineticPalette.primary,
  },
  footer: {
    paddingTop: 12,
  },
});
