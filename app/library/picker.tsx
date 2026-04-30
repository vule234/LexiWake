import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useProfile, useWords } from '../../src/lib/hooks';
import { goBackOrReplace } from '../../src/lib/navigation';

export default function SelectWordScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { words, loading } = useWords({
    limit: 100,
    deckId: profile.activeDeckId,
    lessonDeckIds: profile.activeLessonDeckIds,
    enabled: !profile.activeDeckId || profile.activeLessonDeckIds.length > 0,
  });
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);

  const firstSelectedWord = useMemo(
    () => words.find((word) => word.id === selectedWordIds[0]),
    [selectedWordIds, words]
  );

  const toggleWord = (id: string) => {
    setSelectedWordIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => goBackOrReplace('/(tabs)/library')}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn tu</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color="#3525cd" />
          <Text style={styles.loadingText}>Đang tải word list...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Chọn từ để xem nhanh chi tiết</Text>
            <Text style={styles.infoSubtitle}>Đã chọn {selectedWordIds.length} từ trong phạm vi học hiện tại</Text>
          </View>

          <View style={styles.list}>
            {words.map((word) => {
              const active = selectedWordIds.includes(word.id);
              return (
                <TouchableOpacity
                  key={word.id}
                  style={[styles.wordItem, active && styles.wordItemActive]}
                  onPress={() => toggleWord(word.id)}
                >
                  <View style={styles.wordMain}>
                    <Text style={[styles.wordTitle, active && styles.wordTitleActive]}>{word.word}</Text>
                    <Text style={styles.wordText}>{word.meaning}</Text>
                  </View>
                  <Text style={[styles.wordCheck, active && styles.wordCheckActive]}>{active ? '✓' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.primaryButton, !firstSelectedWord && styles.primaryButtonDisabled]}
          disabled={!firstSelectedWord}
          onPress={() =>
            firstSelectedWord &&
            router.push({ pathname: '/library/word', params: { id: firstSelectedWord.id } })
          }
        >
          <Text style={styles.primaryButtonText}>Mở từ đã chọn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191c1d' },
  loadingCard: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#464555' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  infoCard: { backgroundColor: '#ede9fe', borderRadius: 18, padding: 18, gap: 6 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#3525cd' },
  infoSubtitle: { fontSize: 13, color: '#5b44e0' },
  list: { gap: 10 },
  wordItem: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordItemActive: { backgroundColor: '#ede9fe' },
  wordMain: { flex: 1, gap: 4 },
  wordTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  wordTitleActive: { color: '#3525cd' },
  wordText: { fontSize: 13, color: '#6b7280' },
  wordCheck: { minWidth: 20, fontSize: 16, fontWeight: '700', color: '#9ca3af', textAlign: 'center' },
  wordCheckActive: { color: '#3525cd' },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  primaryButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#3525cd', alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});


