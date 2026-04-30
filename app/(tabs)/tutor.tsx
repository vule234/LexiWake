import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { openAiAgent } from '../../src/features/ai-agent/store';
import { kineticPalette, kineticShadow } from '../../src/theme/kinetic';

const ideas = [
  'Nên học gì tiếp theo hôm nay?',
  'Ôn lại các từ dễ quên gần đây',
  'Tạo mini quiz theo bộ từ hiện tại',
];

export default function TutorHubScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ prompt?: string; screenType?: string; screenId?: string; screenName?: string }>();

  useEffect(() => {
    if (!params.prompt && !params.screenType) {
      return;
    }

    openAiAgent({
      prompt: params.prompt,
      screenContext: params.screenType
        ? {
            type: params.screenType,
            id: params.screenId || null,
            name: params.screenName || null,
          }
        : null,
      sheetMode: 'full',
    });
  }, [params.prompt, params.screenId, params.screenName, params.screenType]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <KineticBackdrop />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LexiWake</Text>
          <Text style={styles.title}>Trợ lý học tập luôn sẵn sàng trong toàn app</Text>
          <Text style={styles.subtitle}>
            Mở trợ lý để hỏi về từ vựng, lộ trình học và gợi ý dựa trên dữ liệu học tập của bạn.
          </Text>
        </View>

        <KineticButton style={styles.primaryCta} onPress={() => openAiAgent({ sheetMode: 'full' })}>
          <KineticButtonText>Mở trợ lý học tập</KineticButtonText>
        </KineticButton>

        <View style={styles.ideaList}>
          {ideas.map((idea) => (
            <TouchableOpacity key={idea} style={styles.ideaCard} onPress={() => openAiAgent({ prompt: idea, sheetMode: 'full' })}>
              <Text style={styles.ideaTitle}>{idea}</Text>
              <Text style={styles.ideaMeta}>Gửi vào trợ lý học tập</Text>
            </TouchableOpacity>
          ))}
        </View>

        <KineticGlassCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>Cách dùng mới</Text>
          <Text style={styles.infoText}>
            Nút nổi `AI` xuất hiện trên các màn hình học tập chính. Bạn có thể mở trợ lý từ bất cứ đâu thay vì rời màn hình hiện tại.
          </Text>
        </KineticGlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 18,
  },
  hero: {
    gap: 10,
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  primaryCta: {
    marginTop: 8,
  },
  ideaList: {
    gap: 12,
  },
  ideaCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    ...kineticShadow,
  },
  ideaTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  ideaMeta: {
    marginTop: 8,
    fontSize: 13,
    color: kineticPalette.primary,
    fontWeight: '700',
  },
  infoCard: {
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
});
