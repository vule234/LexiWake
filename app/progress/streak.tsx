import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProgress } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticGradient, kineticPalette, kineticShadow } from '../../src/theme/kinetic';

export default function StreakDetailScreen() {
  const insets = useSafeAreaInsets();
  const { streak, weeklyActivity, recentSessions } = useProgress();
  const nextMilestone = Math.max(5, Math.ceil((streak.current + 1) / 5) * 5);
  const milestonePercent = nextMilestone > 0 ? Math.min(100, Math.round((streak.current / nextMilestone) * 100)) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KineticBackdrop />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/progress')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LexiWake</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroMain}>
            <Text style={styles.heroLabel}>Chuỗi ngày học hiện tại</Text>
            <View style={styles.heroValueRow}>
              <Text style={styles.heroValue}>{streak.current}</Text>
              <Text style={styles.heroUnit}>NGÀY</Text>
            </View>
            <Text style={styles.heroText}>Bạn đang làm tốt. Đừng để ngọn lửa này hụt nhịp.</Text>
          </View>

          <View style={styles.heroFlameShell}>
            <View style={styles.heroFlameGlass}>
              <Text style={styles.heroFlame}>🔥</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <LinearGradient colors={kineticGradient} style={styles.milestoneCard}>
            <Text style={styles.milestoneTitle}>Cố lên nào!</Text>
            <Text style={styles.milestoneText}>Còn {Math.max(nextMilestone - streak.current, 0)} ngày để đạt mốc {nextMilestone} ngày.</Text>
            <View style={styles.milestoneRow}>
              <Text style={styles.milestonePercent}>{milestonePercent}%</Text>
              <Text style={styles.milestoneMeta}>Mốc tiếp theo: {nextMilestone}</Text>
            </View>
            <View style={styles.milestoneTrack}>
              <View style={[styles.milestoneFill, { width: `${milestonePercent}%` }]} />
            </View>
          </LinearGradient>

          <View style={styles.bestCard}>
            <Text style={styles.bestIcon}>🏆</Text>
            <Text style={styles.bestLabel}>Kỷ lục cao nhất</Text>
            <Text style={styles.bestValue}>{streak.longest} ngày</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7 ngày gần đây</Text>
          <View style={styles.weekRow}>
            {weeklyActivity.map((item, index) => (
              <View
                key={item.date}
                style={[
                  styles.dayCard,
                  item.completed && styles.dayCardActive,
                  index === weeklyActivity.length - 1 && styles.dayCardToday,
                ]}
              >
                <Text style={[styles.dayDate, item.completed && styles.dayDateActive]}>
                  {index === weeklyActivity.length - 1 ? 'Hôm nay' : item.day}
                </Text>
                <Text style={[styles.dayMain, item.completed && styles.dayMainActive]}>
                  {item.completed ? '✓' : item.words}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session gần đây</Text>
          <View style={styles.sessionList}>
            {recentSessions.map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionMain}>
                  <Text style={styles.sessionTitle}>{session.type}</Text>
                  <Text style={styles.sessionText}>
                    {session.correctAnswers}/{session.totalQuestions} câu • {session.totalWords} từ
                  </Text>
                </View>
                <Text style={styles.sessionScore}>{session.score}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoRow}>
          <KineticGlassCard style={styles.infoCard}>
            <Text style={styles.infoIcon}>🧠</Text>
            <Text style={styles.infoTitle}>Bạn có biết?</Text>
            <Text style={styles.infoText}>
              Học ngắn nhưng đều mỗi ngày hiệu quả hơn học dồn cuối tuần.
            </Text>
          </KineticGlassCard>
          <KineticGlassCard style={styles.infoCard}>
            <Text style={styles.infoIcon}>⚡</Text>
            <Text style={styles.infoTitle}>Siêu năng lượng</Text>
            <Text style={styles.infoText}>
              Chuỗi hiện tại đang giúp bạn giữ thói quen học rất ổn định.
            </Text>
          </KineticGlassCard>
        </View>

        <KineticButton onPress={() => router.push('/learning')}>
          <KineticButtonText>Tiếp tục học ngay</KineticButtonText>
        </KineticButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: kineticPalette.background, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: kineticPalette.surfaceLowest, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 18, fontWeight: '700', color: kineticPalette.onSurface },
  headerTitle: { fontSize: 20, fontWeight: '800', color: kineticPalette.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40, gap: 18 },
  heroCard: { borderRadius: 28, backgroundColor: kineticPalette.surfaceLowest, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...kineticShadow },
  heroMain: { flex: 1, gap: 8 },
  heroLabel: { fontSize: 18, fontWeight: '700', color: kineticPalette.onSurfaceVariant },
  heroValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroValue: { fontSize: 64, lineHeight: 68, fontWeight: '900', color: kineticPalette.primary },
  heroUnit: { fontSize: 30, fontWeight: '800', color: kineticPalette.onSurface },
  heroText: { fontSize: 14, color: kineticPalette.onSurfaceVariant, maxWidth: 220 },
  heroFlameShell: { width: 148, height: 148, borderRadius: 74, backgroundColor: 'rgba(255,185,95,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroFlameGlass: { width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(255,221,184,0.45)', alignItems: 'center', justifyContent: 'center' },
  heroFlame: { fontSize: 64 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  milestoneCard: { flex: 1.3, borderRadius: 28, padding: 20, gap: 12, ...kineticShadow },
  milestoneTitle: { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  milestoneText: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.84)' },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  milestonePercent: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  milestoneMeta: { fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  milestoneTrack: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  milestoneFill: { height: '100%', borderRadius: 999, backgroundColor: '#ffffff' },
  bestCard: { flex: 0.8, borderRadius: 28, backgroundColor: kineticPalette.surfaceLow, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  bestIcon: { fontSize: 34 },
  bestLabel: { fontSize: 13, fontWeight: '700', color: kineticPalette.onSurfaceVariant, textAlign: 'center' },
  bestValue: { fontSize: 28, fontWeight: '900', color: kineticPalette.onSurface },
  section: { backgroundColor: kineticPalette.surfaceLowest, borderRadius: 26, padding: 18, gap: 12, ...kineticShadow },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: kineticPalette.onSurface },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  dayCard: { flex: 1, minHeight: 86, borderRadius: 20, backgroundColor: kineticPalette.surfaceHigh, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 6 },
  dayCardActive: { backgroundColor: kineticPalette.primary },
  dayCardToday: { borderWidth: 2, borderColor: kineticPalette.secondaryContainer },
  dayDate: { fontSize: 11, fontWeight: '700', color: kineticPalette.onSurfaceVariant, textTransform: 'uppercase' },
  dayDateActive: { color: '#ffffff' },
  dayMain: { fontSize: 18, fontWeight: '900', color: kineticPalette.onSurface },
  dayMainActive: { color: '#ffffff' },
  sessionList: { gap: 10 },
  sessionRow: { backgroundColor: kineticPalette.surfaceLow, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionMain: { flex: 1, gap: 4 },
  sessionTitle: { fontSize: 15, fontWeight: '700', color: kineticPalette.onSurface },
  sessionText: { fontSize: 13, color: kineticPalette.onSurfaceVariant },
  sessionScore: { fontSize: 18, fontWeight: '800', color: kineticPalette.primary },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, gap: 8 },
  infoIcon: { fontSize: 28 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: kineticPalette.onSurface },
  infoText: { fontSize: 13, lineHeight: 18, color: kineticPalette.onSurfaceVariant },
});

