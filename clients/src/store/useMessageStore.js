import { create } from "zustand";
import { getConversations, getNonLus } from "../api/message.api";

const useMessageStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  conversations:    [],
  messagesNonLus:   0,
  activeConversation: null,
  isLoading:        false,

  // ── Fetch conversations ────────────────────────────────
  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const data = await getConversations();
      set({ conversations: data.conversations ?? data });
    } catch (err) {
      console.error("Conversations fetch error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Fetch compteur non-lus ─────────────────────────────
  fetchNonLus: async () => {
    try {
      const data = await getNonLus();
      set({ messagesNonLus: data.count ?? 0 });
    } catch (err) {
      console.error("Non-lus fetch error:", err);
    }
  },

  // ── Conversation active ────────────────────────────────
  setActiveConversation: (conv) => set({ activeConversation: conv }),

  // ── Nouveau message temps réel ─────────────────────────
  pushMessage: (message) => {
    const { activeConversation, conversations } = get();

    // Si le message appartient à la conv active → pas de badge
    const isActive =
      activeConversation?.demandeId === message.demandeId;

    set((state) => ({
      messagesNonLus: isActive ? state.messagesNonLus : state.messagesNonLus + 1,
      conversations: conversations.map((c) =>
        c.demandeId === message.demandeId
          ? { ...c, dernierMessage: message }
          : c
      ),
    }));
  },

  // ── Reset non-lus quand on ouvre une conv ─────────────
  resetNonLusConv: () => {
    // optionnel : recalcul depuis l'API
    get().fetchNonLus();
  },
}));

export default useMessageStore;