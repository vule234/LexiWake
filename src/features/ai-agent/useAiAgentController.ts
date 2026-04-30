import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import EventSource from 'react-native-sse';
import { AI_BASE_URL, aiTutorApi } from '../../lib/api';
import { useAppStore } from '../../stores/appStore';
import {
  type AiAgentOpenOptions,
  type AiScreenContext,
  useAiAgentOverlayStore,
} from './store';

type TutorEvents = 'token' | 'tool_call_started' | 'tool_call_finished' | 'message_done';

export type AiConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
};

export type AiAgentMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  rawText?: string;
  status?: 'pending' | 'completed' | 'error';
  attachments?: Array<{ mimeType: string; data: string; name?: string }>;
  metadata?: {
    citations?: Array<{ toolName: string; label: string }>;
  };
};

type PendingImage = {
  mimeType: string;
  data: string;
  name?: string;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data?.error === 'string') {
      return error.response.data.error;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export function useAiAgentController() {
  const token = useAppStore((state) => state.token);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isGuest = useAppStore((state) => state.isGuest);
  const profile = useAppStore((state) => state.profile);
  const pendingIntent = useAiAgentOverlayStore((state) => state.pendingIntent);
  const isOpen = useAiAgentOverlayStore((state) => state.isOpen);
  const markUnread = useAiAgentOverlayStore((state) => state.markUnread);
  const clearUnread = useAiAgentOverlayStore((state) => state.clearUnread);

  const eventSourceRef = useRef<EventSource<TutorEvents> | null>(null);
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiAgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [draftContext, setDraftContext] = useState<AiScreenContext | null>(null);
  const [lastIntentId, setLastIntentId] = useState<number | null>(null);

  const closeEventSource = useCallback(() => {
    eventSourceRef.current?.removeAllEventListeners();
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const normalizeConversation = (conversation: any): AiConversationSummary => ({
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    preview: conversation.lastMessage?.text || '',
  });

  const ensureConversation = useCallback(
    async (seedText?: string) => {
      if (activeConversationId) {
        return activeConversationId;
      }

      const response = await aiTutorApi.createConversation(seedText);
      const created = response.data.conversation;
      const nextConversation = {
        id: created._id || created.id,
        title: created.title,
        updatedAt: created.updatedAt,
        preview: '',
      };

      setConversations((current) => [nextConversation, ...current]);
      setActiveConversationId(nextConversation.id);
      return nextConversation.id;
    },
    [activeConversationId]
  );

  const loadConversation = useCallback(async (conversationId: string) => {
    const response = await aiTutorApi.getConversation(conversationId);
    setMessages(
      (response.data.messages || []).map((message: any) => ({
        id: message.id,
        role: message.role,
        text: message.text,
        rawText: message.text,
        status: message.status,
        attachments: message.attachments || [],
        metadata: message.metadata || {},
      }))
    );
    setActiveConversationId(conversationId);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!token || !isAuthenticated || isGuest) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorBanner(null);
      const response = await aiTutorApi.listConversations();
      const items = (response.data.conversations || []).map(normalizeConversation);
      setConversations(items);

      if (items.length > 0) {
        await loadConversation(items[0].id);
      } else {
        const createdId = await ensureConversation();
        await loadConversation(createdId);
      }
    } catch (error) {
      setErrorBanner(getApiErrorMessage(error, 'Không tải được trợ lý học tập.'));
    } finally {
      setLoading(false);
    }
  }, [ensureConversation, isAuthenticated, isGuest, loadConversation, token]);

  useEffect(() => {
    loadConversations();
    return closeEventSource;
  }, [closeEventSource, loadConversations]);

  useEffect(() => {
    if (!pendingIntent || pendingIntent.id === lastIntentId) {
      return;
    }

    setLastIntentId(pendingIntent.id);
    setErrorBanner(null);

    if (pendingIntent.screenContext !== undefined) {
      setDraftContext(pendingIntent.screenContext || null);
    }

    if (pendingIntent.prompt) {
      setInput(pendingIntent.prompt);
    }

    if (pendingIntent.conversationId) {
      loadConversation(pendingIntent.conversationId).catch((error) => {
        setErrorBanner(getApiErrorMessage(error, 'Không tải được hội thoại đã chọn.'));
      });
    } else if (pendingIntent.prompt || pendingIntent.screenContext) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [lastIntentId, loadConversation, pendingIntent]);

  useEffect(() => {
    if (isOpen) {
      clearUnread();
    }
  }, [clearUnread, isOpen]);

  const createNewConversation = useCallback(
    async (seedText?: string) => {
      setErrorBanner(null);
      const response = await aiTutorApi.createConversation(seedText);
      const created = response.data.conversation;
      const nextConversation = {
        id: created._id || created.id,
        title: created.title,
        updatedAt: created.updatedAt,
        preview: '',
      };

      setConversations((current) => [nextConversation, ...current]);
      setMessages([]);
      setPendingImage(null);
      setInput(seedText || '');
      setDraftContext(null);
      setActiveConversationId(nextConversation.id);
      return nextConversation.id;
    },
    []
  );

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Chưa có quyền ảnh', 'Hãy cấp quyền để gửi ảnh chụp màn hình cho trợ lý học tập.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setPendingImage({
        mimeType: result.assets[0].mimeType || 'image/jpeg',
        data: result.assets[0].base64,
        name: result.assets[0].fileName || 'tutor-image.jpg',
      });
    }
  }, []);

  const sendPrompt = useCallback(
    async (overrideText?: string) => {
      const prompt = (overrideText ?? input).trim();
      if ((!prompt && !pendingImage) || sending) {
        return;
      }

      try {
        setSending(true);
        setToolStatus(null);
        setErrorBanner(null);
        closeEventSource();

        const conversationId = activeConversationId || (await ensureConversation(prompt));
        const requestBody = {
          text: prompt,
          images: pendingImage ? [pendingImage] : [],
          screenContext: draftContext,
            learningContext: profile
              ? {
                  vocabularyDeck: 'LexiWake',
                  dailyWordLimit: profile.dailyWordLimit,
                reviewDailyLimit: profile.reviewDailyLimit,
                newDailyLimit: profile.newDailyLimit,
                sessionLength: profile.sessionLength,
              }
            : null,
        };

        const response = await aiTutorApi.createMessage(conversationId, requestBody);
        const assistantMessageId = response.data.messageId;

        setMessages((current) => [
          ...current,
          {
            id: response.data.userMessageId || `local-user-${Date.now()}`,
            role: 'user',
            text: prompt,
            rawText: prompt,
            status: 'completed',
            attachments: pendingImage ? [pendingImage] : [],
          },
          {
            id: assistantMessageId,
            role: 'assistant',
            text: '',
            rawText: '',
            status: 'pending',
            metadata: { citations: [] },
          },
        ]);

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  preview: prompt,
                  updatedAt: new Date().toISOString(),
                }
              : conversation
          )
        );

        setInput('');
        setPendingImage(null);

        const streamUrl = `${AI_BASE_URL}${response.data.streamUrl}`;
        const eventSource = new EventSource<TutorEvents>(streamUrl, {
          headers: {
            Authorization: {
              toString: () => `Bearer ${token}`,
            },
          },
          pollingInterval: 0,
        });

        eventSource.addEventListener('token', (event) => {
          const payload = JSON.parse(('data' in event ? event.data : '{}') || '{}');
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    text: `${message.text}${payload.text || ''}`,
                    rawText: `${message.rawText || message.text}${payload.text || ''}`,
                  }
                : message
            )
          );

          if (!useAiAgentOverlayStore.getState().isOpen) {
            markUnread();
          }
        });

        eventSource.addEventListener('tool_call_started', (event) => {
          const payload = JSON.parse(('data' in event ? event.data : '{}') || '{}');
          setToolStatus(`Đang dùng tool: ${payload.toolName}`);
        });

        eventSource.addEventListener('tool_call_finished', () => {
          setToolStatus(null);
        });

        eventSource.addEventListener('message_done', (event) => {
          const payload = JSON.parse(('data' in event ? event.data : '{}') || '{}');
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    text: payload.text || message.text,
                    rawText: payload.text || message.rawText || message.text,
                    status: 'completed',
                    metadata: { citations: payload.citations || [] },
                  }
                : message
            )
          );
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    preview: payload.text || conversation.preview,
                    updatedAt: new Date().toISOString(),
                  }
                : conversation
            )
          );
          if (!useAiAgentOverlayStore.getState().isOpen) {
            markUnread();
          }
          setSending(false);
          setToolStatus(null);
          closeEventSource();
        });

        eventSource.addEventListener('error', (event: any) => {
          let message = 'Không thể stream câu trả lời.';
          if (event?.data) {
            try {
              const payload = JSON.parse(event.data);
              message = payload.error || message;
            } catch {
              message = event.data;
            }
          }

          setMessages((current) =>
            current.map((item) =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    status: 'error',
                    text: item.text || 'Mình bị ngắt khi trả lời. Hãy thử gửi lại.',
                    rawText: item.rawText || item.text || 'Mình bị ngắt khi trả lời. Hãy thử gửi lại.',
                  }
                : item
            )
          );
          setErrorBanner(message);
          setSending(false);
          setToolStatus(null);
          closeEventSource();
        });

        eventSourceRef.current = eventSource;
      } catch (error) {
        setSending(false);
        setErrorBanner(getApiErrorMessage(error, 'Không gửi được câu hỏi tới trợ lý học tập.'));
      }
    },
    [
      activeConversationId,
      closeEventSource,
      draftContext,
      ensureConversation,
      input,
      markUnread,
      pendingImage,
      profile,
      sending,
      token,
    ]
  );

  const sendFeedback = useCallback(async (messageId: string, vote: 'up' | 'down') => {
    try {
      await aiTutorApi.submitFeedback(messageId, vote);
    } catch (error) {
      setErrorBanner(getApiErrorMessage(error, 'Không gửi được feedback.'));
    }
  }, []);

  const suggestions = useMemo(
    () => ['Giải thích từ này', 'Ôn lại từ dễ quên', 'Tạo mini quiz cho bộ từ này', 'Nên học gì tiếp theo'],
    []
  );

  return {
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
  };
}
