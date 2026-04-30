import { create } from 'zustand';

export type AiSheetMode = 'mini' | 'half' | 'full';

export type AiScreenContext = {
  type: string;
  id?: string | null;
  name?: string | null;
};

export type AiAgentOpenOptions = {
  prompt?: string;
  screenContext?: AiScreenContext | null;
  conversationId?: string | null;
  sheetMode?: AiSheetMode;
};

type PendingIntent = AiAgentOpenOptions & {
  id: number;
};

type AiAgentOverlayState = {
  isOpen: boolean;
  isHistoryOpen: boolean;
  hasUnreadAgentUpdate: boolean;
  sheetMode: AiSheetMode;
  pendingIntent: PendingIntent | null;
  open: (options?: AiAgentOpenOptions) => void;
  close: () => void;
  setSheetMode: (mode: AiSheetMode) => void;
  openHistory: () => void;
  closeHistory: () => void;
  clearUnread: () => void;
  markUnread: () => void;
};

let nextIntentId = 1;

export const useAiAgentOverlayStore = create<AiAgentOverlayState>((set) => ({
  isOpen: false,
  isHistoryOpen: false,
  hasUnreadAgentUpdate: false,
  sheetMode: 'full',
  pendingIntent: null,
  open: (options) =>
    set({
      isOpen: true,
      isHistoryOpen: false,
      hasUnreadAgentUpdate: false,
      sheetMode: options?.sheetMode || 'full',
      pendingIntent: {
        id: nextIntentId++,
        ...options,
      },
    }),
  close: () =>
    set({
      isOpen: false,
      isHistoryOpen: false,
      sheetMode: 'mini',
    }),
  setSheetMode: (mode) => set({ sheetMode: mode }),
  openHistory: () => set({ isHistoryOpen: true }),
  closeHistory: () => set({ isHistoryOpen: false }),
  clearUnread: () => set({ hasUnreadAgentUpdate: false }),
  markUnread: () => set({ hasUnreadAgentUpdate: true }),
}));

export const openAiAgent = (options?: AiAgentOpenOptions) => {
  useAiAgentOverlayStore.getState().open(options);
};

export const closeAiAgent = () => {
  useAiAgentOverlayStore.getState().close();
};

export const startNewAiConversation = (seedText?: string) => {
  useAiAgentOverlayStore.getState().open({ prompt: seedText, conversationId: null, sheetMode: 'full' });
};

export const openAiConversation = (conversationId: string) => {
  useAiAgentOverlayStore.getState().open({ conversationId, sheetMode: 'full' });
};
