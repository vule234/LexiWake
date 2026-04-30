import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KineticButton,
  KineticButtonText,
  KineticGlassCard,
} from '../ui/KineticPrimitives';
import { kineticPalette, kineticShadow } from '../../theme/kinetic';
import { AiRichMessage } from './aiRichMessage';
import {
  closeAiAgent,
  openAiAgent,
  type AiSheetMode,
  useAiAgentOverlayStore,
} from '../../features/ai-agent/store';
import { useAiAgentController } from '../../features/ai-agent/useAiAgentController';

const routeIsHidden = (segments: string[]) => {
  const first = segments[0] || '';
  return ['splash', '(auth)', 'onboarding', 'alarm', 'learning', 'cram', 'results'].includes(first);
};

const relativeTime = (value: string) => {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(delta / 60000);

  if (minutes < 1) {
    return 'Vừa xong';
  }
  if (minutes < 60) {
    return `${minutes}m trước`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h trước`;
  }

  return `${Math.floor(hours / 24)}d trước`;
};

export default function AIAgentOverlayHost() {
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const hidden = routeIsHidden(segments);
  const isOpen = useAiAgentOverlayStore((state) => state.isOpen);
  const sheetMode = useAiAgentOverlayStore((state) => state.sheetMode);
  const setSheetMode = useAiAgentOverlayStore((state) => state.setSheetMode);
  const isHistoryOpen = useAiAgentOverlayStore((state) => state.isHistoryOpen);
  const openHistory = useAiAgentOverlayStore((state) => state.openHistory);
  const closeHistory = useAiAgentOverlayStore((state) => state.closeHistory);
  const hasUnreadAgentUpdate = useAiAgentOverlayStore((state) => state.hasUnreadAgentUpdate);
  const {
    isAuthenticated,
    isGuest,
    loading,
    sending,
    toolStatus,
    errorBanner,
    conversations,
    activeConversationId,
    messages,
    input,
    pendingImage,
    suggestions,
    setInput,
    setErrorBanner,
    loadConversation,
    createNewConversation,
    pickImage,
    sendPrompt,
    sendFeedback,
  } = useAiAgentController();

  const visible = !hidden && isAuthenticated && !isGuest;
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 40);

    return () => clearTimeout(timeout);
  }, [isOpen, messages, toolStatus]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => openAiAgent({ sheetMode: 'full' })}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 94,
          },
          (sending || toolStatus || hasUnreadAgentUpdate) && styles.fabActive,
        ]}
      >
        <Image
          source={require('../../../assets/chatbot-logo-mark.png')}
          style={styles.fabImage}
          resizeMode="cover"
        />
        {(sending || toolStatus || hasUnreadAgentUpdate) ? <View style={styles.fabDot} /> : null}
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeAiAgent}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeAiAgent} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'height' : undefined}
            keyboardVerticalOffset={0}
            style={styles.sheetAvoiding}
          >
            <View
              style={[
                styles.sheet,
                {
                  paddingTop: insets.top + 10,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >

            <View style={styles.header}>
              <View style={styles.headerMain}>
                <View style={styles.agentAvatar}>
                  <Image
                    source={require('../../../assets/chatbot-logo-mark.png')}
                    style={styles.agentAvatarImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.headerTitle}>Trợ lý AI</Text>
                  <Text style={styles.headerSubtitle}>
                    {toolStatus || (sending ? 'Đang suy nghĩ...' : 'Đang sẵn sàng')}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerAction} onPress={() => createNewConversation().catch(() => undefined)}>
                  <Text style={styles.headerActionText}>Mới</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerAction} onPress={isHistoryOpen ? closeHistory : openHistory}>
                  <Text style={styles.headerActionText}>Lịch sử</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerAction} onPress={closeAiAgent}>
                  <Text style={styles.headerActionText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>

            {errorBanner ? (
              <View style={styles.bannerError}>
                <Text style={styles.bannerErrorText}>{errorBanner}</Text>
                <TouchableOpacity onPress={() => setErrorBanner(null)}>
                <Text style={styles.bannerDismiss}>Ẩn</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.content}>
              <ScrollView
                ref={scrollRef}
                style={styles.messageScroll}
                contentContainerStyle={styles.messageContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {loading ? (
                  <KineticGlassCard style={styles.loadingCard}>
                    <ActivityIndicator color={kineticPalette.primary} />
                    <Text style={styles.loadingText}>Đang nạp trợ lý học tập...</Text>
                  </KineticGlassCard>
                ) : messages.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Trợ lý học tập luôn sẵn sàng</Text>
                    <Text style={styles.emptyText}>
                      Hỏi về từ vựng, xin kế hoạch học tập cá nhân hóa hoặc nhờ gợi ý bước học tiếp theo.
                    </Text>
                    <View style={styles.suggestionWrap}>
                      {suggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          style={styles.suggestionChip}
                          onPress={() => sendPrompt(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  messages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          message.role === 'user' ? styles.messageBubbleUser : styles.messageBubbleAssistant,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageLabel,
                            message.role === 'user' && styles.messageLabelUser,
                          ]}
                        >
                          {message.role === 'user' ? 'Bạn' : 'Agent'}
                        </Text>
                        {message.attachments?.[0] ? (
                          <Image
                            source={{ uri: `data:${message.attachments[0].mimeType};base64,${message.attachments[0].data}` }}
                            style={styles.inlineImage}
                          />
                        ) : null}
                        {message.role === 'assistant' && message.status === 'completed' ? (
                          <AiRichMessage text={message.rawText || message.text} />
                        ) : (
                          <Text
                            style={[
                              styles.messageText,
                              message.role === 'user' && styles.messageTextUser,
                            ]}
                          >
                            {message.text || (message.status === 'pending' ? 'Đang soạn phản hồi...' : '')}
                          </Text>
                        )}
                        {message.role === 'assistant' && message.metadata?.citations?.length ? (
                          <View style={styles.citationRow}>
                            {message.metadata.citations.map((citation, citationIndex) => (
                              <View key={`${message.id}-${citation.toolName}-${citationIndex}`} style={styles.citationBadge}>
                                <Text style={styles.citationText}>{citation.label}</Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                        {message.role === 'assistant' && message.status === 'completed' ? (
                          <View style={styles.feedbackRow}>
                            <TouchableOpacity style={styles.feedbackButton} onPress={() => sendFeedback(message.id, 'up')}>
                              <Text style={styles.feedbackText}>👍 Hữu ích</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.feedbackButton} onPress={() => sendFeedback(message.id, 'down')}>
                              <Text style={styles.feedbackText}>👎 Chưa ổn</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {pendingImage ? (
              <KineticGlassCard style={styles.pendingCard}>
                <Image
                  source={{ uri: `data:${pendingImage.mimeType};base64,${pendingImage.data}` }}
                  style={styles.pendingImage}
                />
                <Text style={styles.pendingText}>Ảnh sẽ được gửi cùng câu hỏi tiếp theo.</Text>
              </KineticGlassCard>
            ) : null}

            <View style={styles.quickRow}>
              {suggestions.slice(0, 3).map((suggestion) => (
                <TouchableOpacity key={suggestion} style={styles.quickChip} onPress={() => sendPrompt(suggestion)}>
                  <Text style={styles.quickChipText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.composer}>
              <TouchableOpacity style={styles.composerIcon} onPress={pickImage}>
                <Text style={styles.composerIconText}>🖼</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Hỏi về từ, bộ từ hoặc nhờ AI gợi ý lộ trình..."
                placeholderTextColor={kineticPalette.outline}
                multiline
                value={input}
                onChangeText={setInput}
              />
              <KineticButton style={styles.sendButton} onPress={() => sendPrompt()} disabled={sending}>
                {sending ? <ActivityIndicator color="#ffffff" /> : <KineticButtonText>Gửi</KineticButtonText>}
              </KineticButton>
            </View>

            {isHistoryOpen ? (
              <View style={styles.historyDrawer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Lịch sử hội thoại</Text>
                  <TouchableOpacity onPress={closeHistory}>
                    <Text style={styles.historyClose}>Đóng</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.newChatRow}
                  onPress={async () => {
                    await createNewConversation();
                    closeHistory();
                  }}
                >
                  <Text style={styles.newChatText}>＋ Tạo hội thoại mới</Text>
                </TouchableOpacity>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.historyList}
                  keyboardShouldPersistTaps="handled"
                >
                  {conversations.map((conversation) => (
                    <TouchableOpacity
                      key={conversation.id}
                      style={[
                        styles.historyItem,
                        conversation.id === activeConversationId && styles.historyItemActive,
                      ]}
                      onPress={async () => {
                        await loadConversation(conversation.id);
                        closeHistory();
                      }}
                    >
                      <Text numberOfLines={1} style={styles.historyItemTitle}>
                        {conversation.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.historyItemPreview}>
                        {conversation.preview || 'Chưa có nội dung'}
                      </Text>
                      <Text style={styles.historyItemTime}>{relativeTime(conversation.updatedAt)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    zIndex: 30,
    ...kineticShadow,
  },
  fabActive: {
    shadowOpacity: 0.24,
    shadowRadius: 42,
    elevation: 18,
  },
  fabImage: {
    width: '100%',
    height: '100%',
  },
  fabDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#57dffe',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  modalRoot: {
    flex: 1,
  },
  sheetAvoiding: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 15, 24, 0.28)',
  },
  sheet: {
    flex: 1,
    backgroundColor: 'rgba(248,249,250,0.98)',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.12)',
  },
  agentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  headerSubtitle: {
    fontSize: 13,
    color: kineticPalette.onSurfaceVariant,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  bannerError: {
    marginHorizontal: 18,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: kineticPalette.errorContainer,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  bannerErrorText: {
    flex: 1,
    color: kineticPalette.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  bannerDismiss: {
    color: kineticPalette.error,
    fontSize: 12,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  messageScroll: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: kineticPalette.onSurfaceVariant,
  },
  emptyState: {
    paddingTop: 22,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: kineticPalette.onSurfaceVariant,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '800',
    color: kineticPalette.primary,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '96%',
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  messageBubbleUser: {
    backgroundColor: kineticPalette.primary,
    ...kineticShadow,
  },
  messageBubbleAssistant: {
    backgroundColor: kineticPalette.surfaceLowest,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
    color: kineticPalette.onSurface,
  },
  messageLabelUser: {
    color: 'rgba(255,255,255,0.82)',
  },
  messageTextUser: {
    color: '#ffffff',
  },
  inlineImage: {
    width: 180,
    height: 120,
    borderRadius: 18,
  },
  citationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  citationBadge: {
    borderRadius: 999,
    backgroundColor: kineticPalette.primaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  citationText: {
    fontSize: 11,
    fontWeight: '700',
    color: kineticPalette.primary,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  feedbackButton: {
    borderRadius: 999,
    backgroundColor: kineticPalette.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: kineticPalette.onSurfaceVariant,
  },
  pendingCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pendingImage: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: kineticPalette.onSurfaceVariant,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  quickChip: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: kineticPalette.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  quickChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: kineticPalette.primary,
    textAlign: 'center',
  },
  composer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: 'rgba(248,249,250,0.96)',
  },
  composerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerIconText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 24,
    backgroundColor: kineticPalette.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: kineticPalette.onSurface,
  },
  sendButton: {
    minWidth: 84,
  },
  historyDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '82%',
    backgroundColor: 'rgba(255,255,255,0.98)',
    padding: 16,
    ...kineticShadow,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  historyClose: {
    fontSize: 12,
    fontWeight: '900',
    color: kineticPalette.primary,
    textTransform: 'uppercase',
  },
  newChatRow: {
    borderRadius: 18,
    backgroundColor: kineticPalette.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  newChatText: {
    fontSize: 13,
    fontWeight: '900',
    color: kineticPalette.primary,
  },
  historyList: {
    gap: 10,
    paddingBottom: 24,
  },
  historyItem: {
    borderRadius: 20,
    backgroundColor: kineticPalette.surfaceLow,
    padding: 14,
    gap: 5,
  },
  historyItemActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: kineticPalette.onSurface,
  },
  historyItemPreview: {
    fontSize: 12,
    lineHeight: 17,
    color: kineticPalette.onSurfaceVariant,
  },
  historyItemTime: {
    fontSize: 11,
    fontWeight: '700',
    color: kineticPalette.primary,
  },
});
