import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useDecks, useProfile, useScopeSummary, useUnfinishedLearningSession, useWords, type Deck } from '../../src/lib/hooks';
import {
  getLessonProgressCopy,
  getLessonScopeState,
  getLibraryLessonActionLabel,
} from '../../src/lib/lessonScopeUi';
import { useAppStore } from '../../src/stores/appStore';
import {
  KineticBackdrop,
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../../src/components/ui/KineticPrimitives';
import { kineticPalette, kineticShadow } from '../../src/theme/kinetic';

type FilterKey = 'all' | 'mastered' | 'learning' | 'review' | 'favorite';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'mastered', label: 'Đã thuộc' },
  { key: 'learning', label: 'Đang học' },
  { key: 'review', label: 'Cần ôn' },
  { key: 'favorite', label: 'Yêu thích' },
];

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'mastered':
      return 'Đã thuộc';
    case 'learning':
      return 'Đang học';
    case 'review':
      return 'Cần ôn';
    case 'lapsed':
      return 'Quên lại';
    default:
      return 'Từ mới';
  }
};

const getStatusTone = (status: string) => {
  switch (status) {
    case 'mastered':
      return { background: '#dcfce7', text: '#166534' };
    case 'learning':
      return { background: '#fef3c7', text: '#92400e' };
    case 'review':
    case 'lapsed':
      return { background: '#fee2e2', text: '#b91c1c' };
    default:
      return { background: kineticPalette.primaryFixed, text: kineticPalette.primary };
  }
};

const buildSavedScopeMap = (scopes: Array<{ deckId: string; lessonDeckIds: string[] }> = []) =>
  scopes.reduce<Record<string, string[]>>((acc, entry) => {
    acc[entry.deckId] = entry.lessonDeckIds || [];
    return acc;
  }, {});

const hasLessonSelection = (deck: Deck | null, lessonIds: string[]) =>
  deck ? (deck.lessons || []).length === 0 || lessonIds.length > 0 : false;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((state) => state.user);
  const isGuest = useAppStore((state) => state.isGuest);
  const { decks, loading: deckLoading } = useDecks();
  const { profile, setActiveLearningScope } = useProfile();
  const { session: unfinishedSession, refetch: refetchUnfinishedSession } = useUnfinishedLearningSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [draftSelections, setDraftSelections] = useState<Record<string, string[]>>({});
  const [savingScope, setSavingScope] = useState(false);
  const [dismissedUnfinishedThisVisit, setDismissedUnfinishedThisVisit] = useState(false);
  const [libraryFocused, setLibraryFocused] = useState(false);
  const [showStudyPrompt, setShowStudyPrompt] = useState(false);
  const [lastPromptedScopeKey, setLastPromptedScopeKey] = useState<string | null>(null);

  const savedScopeMap = useMemo(
    () => buildSavedScopeMap(profile.savedDeckScopes || []),
    [profile.savedDeckScopes]
  );

  useEffect(() => {
    if (decks.length === 0) {
      return;
    }

    setExpandedDeckId((current) => {
      if (current && decks.some((deck) => deck.id === current)) {
        return current;
      }

      if (profile.activeDeckId && decks.some((deck) => deck.id === profile.activeDeckId)) {
        return profile.activeDeckId;
      }

      return decks[0].id;
    });
  }, [decks, profile.activeDeckId]);

  useEffect(() => {
    setDraftSelections((current) => {
      const next = { ...current };

      Object.entries(savedScopeMap).forEach(([deckId, lessonDeckIds]) => {
        next[deckId] = lessonDeckIds;
      });

      return next;
    });
  }, [savedScopeMap]);

  const expandedDeck = useMemo(
    () => decks.find((deck) => deck.id === expandedDeckId) || null,
    [decks, expandedDeckId]
  );
  const selectedLessonIds = expandedDeckId ? draftSelections[expandedDeckId] || [] : [];
  const canStudyCurrentScope = hasLessonSelection(expandedDeck, selectedLessonIds);
  const shouldShowStudyPrompt = Boolean(expandedDeck) && selectedLessonIds.length > 0;
  const shouldReplaceUnfinished =
    dismissedUnfinishedThisVisit && Boolean(unfinishedSession?.sessionId);
  const scopeParams =
    expandedDeck && canStudyCurrentScope
      ? {
          deckId: expandedDeck.id,
          lessonDeckIds: selectedLessonIds.join(','),
        }
      : null;
  const { words, loading: wordsLoading } = useWords({
    limit: 60,
    deckId: expandedDeck?.id || null,
    lessonDeckIds: selectedLessonIds,
    enabled: Boolean(expandedDeck) && canStudyCurrentScope,
  });
  const { summary: scopeSummary, refetch: refetchScopeSummary } = useScopeSummary({
    deckId: expandedDeck?.id || null,
    lessonDeckIds: selectedLessonIds,
    enabled: Boolean(expandedDeck) && canStudyCurrentScope,
    newDailyLimit: profile.newDailyLimit,
  });

  const filteredWords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return words.filter((word) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        word.word.toLowerCase().includes(normalizedQuery) ||
        word.meaning.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'favorite' ? word.isFavorite : word.status === activeFilter);

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, searchQuery, words]);

  const selectedLessonNames = useMemo(() => {
    if (!expandedDeck) {
      return [];
    }

    const lessonMap = new Map((expandedDeck.lessons || []).map((lesson) => [lesson.id, lesson.name]));
    return selectedLessonIds.map((lessonId) => lessonMap.get(lessonId)).filter(Boolean) as string[];
  }, [expandedDeck, selectedLessonIds]);

  const handleSelectDeck = (deckId: string) => {
    setExpandedDeckId((current) => (current === deckId ? null : deckId));
  };

  const persistScope = async (deckId: string, lessonDeckIds: string[]) => {
    try {
      setSavingScope(true);
      await setActiveLearningScope(deckId, lessonDeckIds);
    } finally {
      setSavingScope(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLibraryFocused(true);
      setDismissedUnfinishedThisVisit(false);
      setShowStudyPrompt(false);
      void refetchUnfinishedSession();

      return () => {
        setLibraryFocused(false);
        setDismissedUnfinishedThisVisit(false);
        setShowStudyPrompt(false);
      };
    }, [refetchUnfinishedSession])
  );

  useEffect(() => {
    if (!libraryFocused || dismissedUnfinishedThisVisit || !unfinishedSession?.sessionId || !unfinishedSession.deckName) {
      return;
    }

    const lessonCopy = unfinishedSession.lessonNames?.length
      ? ` ở ${unfinishedSession.lessonNames.join(', ')}`
      : '';

    Alert.alert(
      'Tiếp tục phiên học dở?',
      `Bạn đang học dở bộ ${unfinishedSession.deckName}${lessonCopy}. Bạn có muốn hoàn thành tiếp không?`,
      [
        {
          text: 'Không',
          style: 'cancel',
          onPress: () => {
            if (unfinishedSession.deckId) {
              setDraftSelections((current) => ({
                ...current,
                [unfinishedSession.deckId as string]: [],
              }));
              setShowStudyPrompt(false);
            }
            setDismissedUnfinishedThisVisit(true);
          },
        },
        {
          text: 'Có',
          onPress: () => {
            if (unfinishedSession.deckId) {
              setExpandedDeckId(unfinishedSession.deckId);
              setDraftSelections((current) => ({
                ...current,
                [unfinishedSession.deckId as string]: unfinishedSession.lessonDeckIds || [],
              }));
            }
            setDismissedUnfinishedThisVisit(true);
            router.push({
              pathname: '/learning',
              params: { resumeSessionId: unfinishedSession.sessionId },
            });
          },
        },
      ],
      { cancelable: true, onDismiss: () => setDismissedUnfinishedThisVisit(true) }
    );
  }, [dismissedUnfinishedThisVisit, libraryFocused, unfinishedSession]);

  const toggleLesson = async (deck: Deck, lessonId: string) => {
    const current = draftSelections[deck.id] || [];
    const next = current.includes(lessonId)
      ? current.filter((item) => item !== lessonId)
      : [...current, lessonId];

    setDraftSelections((state) => ({
      ...state,
      [deck.id]: next,
    }));

    if (next.length === 0) {
      setShowStudyPrompt(false);
    }

    if (next.length > 0) {
      try {
        await persistScope(deck.id, next);
        await refetchScopeSummary();

        const scopeKey = `${deck.id}:${[...next].sort().join(',')}`;
        if (scopeKey !== lastPromptedScopeKey) {
          setLastPromptedScopeKey(scopeKey);
        }
        setShowStudyPrompt(true);
      } catch (error: any) {
        setDraftSelections((state) => ({
          ...state,
          [deck.id]: current,
        }));
        Alert.alert('Không thể lưu phạm vi học', error?.response?.data?.error || 'Vui lòng thử lại.');
      }
    }
  };

  const goToScopedRoute = (
    pathname: '/library/new' | '/library/review' | '/library/favorites' | '/learning',
    nextParams = scopeParams
  ) => {
    if (!nextParams) {
      return;
    }

    router.push({
      pathname,
      params: {
        ...nextParams,
        ...(shouldReplaceUnfinished ? { replaceUnfinished: '1' } : {}),
      },
    });
  };

  const deckSummaryText = expandedDeck
    ? selectedLessonIds.length > 0
      ? `${selectedLessonIds.length} bài học đã chọn`
      : 'Chưa chọn bài học nào'
    : 'Chọn một bộ từ để xem danh sách bài học';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <KineticBackdrop />

      <View style={styles.topAppBar}>
        <View style={styles.identityBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {((user?.fullName || user?.email || 'V').trim()[0] || 'V').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.brandText}>LexiWake</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Text style={styles.headerActionIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Thư viện <Text style={styles.heroAccent}>từ vựng.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>{expandedDeck?.name || 'Chưa chọn bộ từ'}</Text>
        </View>

        <KineticGlassCard style={styles.deckSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bộ từ vựng</Text>
            <Text style={styles.sectionMeta}>{decks.length} bộ từ</Text>
          </View>

          {deckLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={kineticPalette.primary} />
              <Text style={styles.inlineText}>Đang tải danh sách bộ từ...</Text>
            </View>
          ) : (
            <View style={styles.deckAccordion}>
              {decks.map((deck) => {
                const expanded = expandedDeckId === deck.id;
                const selectedCount = (draftSelections[deck.id] || savedScopeMap[deck.id] || []).length;

                return (
                  <View key={deck.id} style={styles.deckAccordionItem}>
                    <TouchableOpacity
                      activeOpacity={0.92}
                      style={[styles.deckAccordionButton, expanded && styles.deckAccordionButtonActive]}
                      onPress={() => handleSelectDeck(deck.id)}
                    >
                      <View style={styles.deckAccordionMain}>
                        <Text style={styles.deckAccordionTitle}>{deck.name}</Text>
                        <Text style={styles.deckAccordionText}>
                          {deck.wordCount} từ • {deck.lessonCount || deck.lessons?.length || 0} bài học
                        </Text>
                      </View>
                      <View style={styles.deckAccordionAside}>
                        <Text style={styles.deckAccordionCount}>{selectedCount} chọn</Text>
                        <Text style={styles.deckAccordionChevron}>{expanded ? '−' : '+'}</Text>
                      </View>
                    </TouchableOpacity>

                    {expanded ? (
                      <View style={styles.lessonWrap}>
                        {(deck.lessons || []).length === 0 ? (
                          <Text style={styles.inlineText}>Bộ này chưa có bài học.</Text>
                        ) : (
                          (deck.lessons || []).map((lesson) => {
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
                                  activeOpacity={0.92}
                                  style={styles.lessonPreviewButton}
                                  onPress={() =>
                                    router.push({
                                      pathname: '/library/lesson',
                                      params: {
                                        deckId: deck.id,
                                        deckName: deck.name,
                                        lessonId: lesson.id,
                                        lessonName: lesson.name,
                                        ...(shouldReplaceUnfinished ? { replaceUnfinished: '1' } : {}),
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
                                  activeOpacity={0.92}
                                  style={[
                                    styles.lessonSelectButton,
                                    (active || isCompleted) && styles.lessonSelectButtonActive,
                                    isCompleted && styles.lessonSelectButtonCompleted,
                                  ]}
                                  onPress={() => {
                                    if (isCompleted) {
                                      router.push({
                                        pathname: '/library/review',
                                        params: {
                                          deckId: deck.id,
                                          lessonDeckIds: lesson.id,
                                          ...(shouldReplaceUnfinished ? { replaceUnfinished: '1' } : {}),
                                        },
                                      });
                                      return;
                                    }

                                    void toggleLesson(deck, lesson.id);
                                  }}
                                >
                                  {!isCompleted ? (
                                    <View style={styles.checkboxShell}>
                                      <View style={[styles.checkbox, active && styles.checkboxActive]}>
                                        {active ? <Text style={styles.checkboxTick}>✓</Text> : null}
                                      </View>
                                    </View>
                                  ) : null}
                                  <Text
                                    style={[
                                      styles.lessonSelectText,
                                      (active || isCompleted) && styles.lessonSelectTextActive,
                                      isCompleted && styles.lessonSelectTextCompleted,
                                    ]}
                                  >
                                    {getLibraryLessonActionLabel(lesson, active)}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </KineticGlassCard>

        <View style={styles.searchShell}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm từ vựng hoặc nghĩa..."
            placeholderTextColor={kineticPalette.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = filter.key === activeFilter;
            return (
              <TouchableOpacity
                key={filter.key}
                style={active ? styles.filterChipActive : styles.filterChip}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text style={active ? styles.filterChipTextActive : styles.filterChipText}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardLarge]}>
            <Text style={styles.statValue}>{scopeSummary?.totalWordsInScope || 0}</Text>
            <Text style={styles.statLabel}>Tổng số từ</Text>
            <Text style={styles.statHint}>
              {scopeSummary?.deckName || expandedDeck?.name || 'Chưa chọn bộ'}
              {(scopeSummary?.selectedLessonCount || selectedLessonNames.length) > 0
                ? ` • ${scopeSummary?.selectedLessonCount || selectedLessonNames.length} bài học`
                : ' • Chưa chọn bài học'}
            </Text>
          </View>
          <View style={styles.statStack}>
            <View style={styles.smallStatCard}>
              <Text style={styles.smallStatValue}>{scopeSummary?.masteredWordsInScope || 0}</Text>
              <Text style={styles.smallStatLabel}>Đã thuộc</Text>
            </View>
            <View style={styles.smallStatCardWarm}>
              <Text style={styles.smallStatValueWarm}>{scopeSummary?.favoriteWordsInScope || 0}</Text>
              <Text style={styles.smallStatLabelWarm}>Yêu thích</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={[styles.quickActionCard, (!scopeParams || savingScope) && styles.quickActionCardDisabled]}
            disabled={!scopeParams || savingScope}
            onPress={() => goToScopedRoute('/library/new')}
          >
            <Text style={styles.quickActionTitle}>Từ mới</Text>
            <Text style={styles.quickActionText}>
              Hôm nay {scopeSummary?.newWordsTodayInScope || 0} từ mới theo lựa chọn {profile.newDailyLimit}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, (!scopeParams || savingScope) && styles.quickActionCardDisabled]}
            disabled={!scopeParams || savingScope}
            onPress={() => goToScopedRoute('/library/review')}
          >
            <Text style={styles.quickActionTitle}>Cần ôn</Text>
            <Text style={styles.quickActionText}>
              {scopeSummary?.reviewWordsInScope || 0} từ đang cần ôn trong bộ từ này
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, (!scopeParams || savingScope) && styles.quickActionCardDisabled]}
            disabled={!scopeParams || savingScope}
            onPress={() => goToScopedRoute('/library/favorites')}
          >
            <Text style={styles.quickActionTitle}>Yêu thích</Text>
            <Text style={styles.quickActionText}>Lọc danh sách đã đánh dấu theo bộ từ và bài học đã chọn</Text>
          </TouchableOpacity>
        </View>

        {wordsLoading ? (
          <KineticGlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={kineticPalette.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách từ trong phạm vi đã chọn...</Text>
          </KineticGlassCard>
        ) : !canStudyCurrentScope ? (
          <KineticGlassCard style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa chọn bài học</Text>
            <Text style={styles.emptyText}>
              Hãy chọn ít nhất một bài học để xem danh sách từ và bắt đầu học.
            </Text>
          </KineticGlassCard>
        ) : (
          <View style={styles.wordList}>
            {filteredWords.map((word) => {
              const tone = getStatusTone(word.status);

              return (
                <TouchableOpacity
                  key={word.id}
                  style={styles.wordCard}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: '/library/word', params: { id: word.id } })}
                >
                  <View style={styles.wordMain}>
                    <View style={styles.wordHeader}>
                      <Text style={styles.wordText}>{word.word}</Text>
                      {word.isFavorite ? <Text style={styles.favoriteIcon}>♥</Text> : null}
                    </View>
                    <Text style={styles.meaningText}>{word.meaning}</Text>
                    <Text style={styles.exampleText}>{word.lessonName || expandedDeck?.name || 'Từ vựng'}</Text>
                  </View>
                  <View style={styles.wordMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: tone.background }]}>
                      <Text style={[styles.statusText, { color: tone.text }]}>
                        {getStatusLabel(word.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredWords.length === 0 ? (
              <KineticGlassCard style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Không tìm thấy từ phù hợp</Text>
                <Text style={styles.emptyText}>
                  Thử đổi bộ lọc, giảm từ khóa tìm kiếm hoặc chuyển sang bài học khác.
                </Text>
                <KineticButton variant="secondary" onPress={() => setActiveFilter('all')}>
                  <KineticButtonText variant="secondary">Xem lại toàn bộ</KineticButtonText>
                </KineticButton>
              </KineticGlassCard>
            ) : null}
          </View>
        )}

        {isGuest ? (
          <KineticGlassCard style={styles.guestCard}>
            <Text style={styles.guestTitle}>Chế độ khách chỉ lưu phạm vi học trên máy này</Text>
            <Text style={styles.guestText}>
              Đăng ký để đồng bộ lựa chọn bộ học, yêu thích và tiến độ giữa nhiều thiết bị.
            </Text>
            <KineticButton onPress={() => router.push('/(auth)/register')}>
              <KineticButtonText>Tạo tài khoản</KineticButtonText>
            </KineticButton>
          </KineticGlassCard>
        ) : null}
      </ScrollView>

      {shouldShowStudyPrompt && scopeParams ? (
        <View pointerEvents="box-none" style={styles.sheetFloatingLayer}>
          <View pointerEvents="box-none" style={[styles.sheetContainer, { paddingBottom: insets.bottom + 112 }]}>
            <KineticGlassCard style={styles.sheetCard}>
              <KineticButton
                onPress={() => {
                  setShowStudyPrompt(false);
                  goToScopedRoute('/learning', scopeParams);
                }}
              >
                <KineticButtonText>Học ngay</KineticButtonText>
              </KineticButton>
            </KineticGlassCard>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: kineticPalette.background,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLowest,
    borderWidth: 2,
    borderColor: kineticPalette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 16,
    color: kineticPalette.outline,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 132,
    gap: 18,
  },
  heroSection: {
    gap: 10,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  heroAccent: {
    color: kineticPalette.primary,
    fontStyle: 'italic',
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: kineticPalette.onSurfaceVariant,
  },
  scopeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scopeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  deckSection: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  deckAccordion: {
    gap: 12,
  },
  deckAccordionItem: {
    gap: 10,
  },
  deckAccordionButton: {
    borderRadius: 22,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    ...kineticShadow,
  },
  deckAccordionButtonActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  deckAccordionMain: {
    flex: 1,
    gap: 4,
  },
  deckAccordionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  deckAccordionText: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
  },
  deckAccordionAside: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  deckAccordionCount: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  deckAccordionChevron: {
    fontSize: 22,
    fontWeight: '700',
    color: kineticPalette.primary,
  },
  lessonWrap: {
    gap: 10,
  },
  lessonRow: {
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  checkboxShell: {
    width: 26,
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: kineticPalette.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: kineticPalette.primary,
    backgroundColor: kineticPalette.primary,
  },
  checkboxTick: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
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
  lessonPreviewHint: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
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
  lessonSelectButton: {
    minWidth: 110,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: kineticPalette.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
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
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: kineticPalette.surfaceHighest,
    borderRadius: 24,
    paddingHorizontal: 18,
    minHeight: 62,
  },
  searchIcon: {
    fontSize: 18,
    color: kineticPalette.outline,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: kineticPalette.onSurface,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceHigh,
  },
  filterChipActive: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: kineticPalette.primary,
    ...kineticShadow,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  filterChipTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    borderRadius: 28,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 20,
    ...kineticShadow,
  },
  statCardLarge: {
    flex: 1.2,
    justifyContent: 'space-between',
    minHeight: 176,
  },
  statStack: {
    flex: 0.8,
    gap: 12,
  },
  smallStatCard: {
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 18,
    minHeight: 82,
    justifyContent: 'space-between',
  },
  smallStatCardWarm: {
    borderRadius: 24,
    backgroundColor: kineticPalette.tertiaryFixed,
    padding: 18,
    minHeight: 82,
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statHint: {
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  smallStatValue: {
    fontSize: 26,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  smallStatValueWarm: {
    fontSize: 26,
    fontWeight: '900',
    color: kineticPalette.tertiaryContainer,
  },
  smallStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  smallStatLabelWarm: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.tertiaryContainer,
  },
  quickActionGrid: {
    gap: 12,
  },
  quickActionCard: {
    borderRadius: 26,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    gap: 8,
    ...kineticShadow,
  },
  quickActionCardDisabled: {
    opacity: 0.45,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  quickActionText: {
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
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
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: kineticPalette.onSurfaceVariant,
  },
  wordList: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: kineticPalette.surfaceLowest,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    ...kineticShadow,
  },
  wordMain: {
    flex: 1,
    gap: 4,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordText: {
    fontSize: 24,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  favoriteIcon: {
    fontSize: 14,
    color: kineticPalette.error,
  },
  meaningText: {
    fontSize: 15,
    lineHeight: 21,
    color: kineticPalette.onSurfaceVariant,
  },
  exampleText: {
    fontSize: 12,
    color: kineticPalette.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  wordMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyState: {
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
  guestCard: {
    gap: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: kineticPalette.onSurface,
  },
  guestText: {
    fontSize: 14,
    lineHeight: 20,
    color: kineticPalette.onSurfaceVariant,
  },
  sheetFloatingLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
    zIndex: 24,
    elevation: 24,
  },
  sheetContainer: {
    pointerEvents: 'box-none',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sheetCard: {
    padding: 12,
    zIndex: 25,
    elevation: 25,
  },
});
