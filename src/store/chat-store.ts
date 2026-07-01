import { create } from "zustand";
import type { Message, Profile } from "@/types/database.types";

interface ChatState {
  currentUserId: string | null;
  currentRoomId: string | null;
  profiles: Record<string, Profile>;
  messages: Message[];

  onlineIds: Set<string>;
  typingIds: Set<string>;

  setCurrentUserId: (id: string) => void;
  setCurrentRoomId: (id: string) => void;
  setProfiles: (profiles: Profile[]) => void;
  upsertProfile: (profile: Profile) => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  setOnlineIds: (ids: string[]) => void;
  setTyping: (id: string, isTyping: boolean) => void;

  /** Dọn sạch state của phòng trước đó khi chuyển sang phòng khác. */
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentUserId: null,
  currentRoomId: null,
  profiles: {},
  messages: [],
  onlineIds: new Set(),
  typingIds: new Set(),

  setCurrentUserId: (id) => set({ currentUserId: id }),
  setCurrentRoomId: (id) => set({ currentRoomId: id }),

  setProfiles: (profiles) =>
    set({
      profiles: Object.fromEntries(profiles.map((p) => [p.id, p])),
    }),

  upsertProfile: (profile) =>
    set({ profiles: { ...get().profiles, [profile.id]: profile } }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    if (get().messages.some((m) => m.id === message.id)) return;
    set({ messages: [...get().messages, message] });
  },

  setOnlineIds: (ids) => set({ onlineIds: new Set(ids) }),

  setTyping: (id, isTyping) => {
    const next = new Set(get().typingIds);
    if (isTyping) next.add(id);
    else next.delete(id);
    set({ typingIds: next });
  },

  reset: () =>
    set({
      currentRoomId: null,
      profiles: {},
      messages: [],
      onlineIds: new Set(),
      typingIds: new Set(),
    }),
}));
