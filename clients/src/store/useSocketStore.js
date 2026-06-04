import { create } from "zustand";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";
import useNotificationStore from "./useNotificationStore";
import useMessageStore      from "./useMessageStore";

const useSocketStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  socket:      null,
  isConnected: false,

  // ── Connexion ──────────────────────────────────────────
  connect: (userId) => {
    if (get().socket) return; // déjà connecté

    const socket = io(SOCKET_URL, {
      auth:             { userId },
      transports:       ["websocket"],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // ── Événements système ─────────────────────────────
    socket.on("connect", () => {
      set({ isConnected: true });
      // Rejoindre la room personnelle
      socket.emit("join_user_room", userId);
    });

    socket.on("disconnect", () => set({ isConnected: false }));

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    // ── Notifications temps réel ───────────────────────
    socket.on("nouvelle_notification", (notif) => {
      useNotificationStore.getState().pushNotification(notif);
    });

    // ── Messages temps réel ────────────────────────────
    socket.on("nouveau_message", (message) => {
      useMessageStore.getState().pushMessage(message);
    });

    set({ socket });
  },

  // ── Rejoindre une room de chat ─────────────────────────
  joinRoom: (roomId) => {
    get().socket?.emit("join_room", roomId);
  },

  // ── Envoyer un message via socket ──────────────────────
  sendMessage: (payload) => {
    get().socket?.emit("send_message", payload);
  },

  // ── Déconnexion ────────────────────────────────────────
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false });
  },
}));

export default useSocketStore;