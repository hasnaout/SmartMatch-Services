import { create } from "zustand";
import {
  getNotifications,
  marquerLue,
  marquerToutesLues,
  deleteNotification,
} from "../api/notification.api";

const useNotificationStore = create((set) => ({
  // ── State ──────────────────────────────────────────────
  notifications: [],
  nonLus:        0,
  isLoading:     false,

  // ── Fetch ──────────────────────────────────────────────
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await getNotifications();
      const liste = data.notifications ?? data;
      set({
        notifications: liste,
        nonLus: liste.filter((n) => !n.lu).length,
      });
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Marquer une notification lue ───────────────────────
  marquerLue: async (id) => {
    try {
      await marquerLue(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, lu: true } : n
        ),
        nonLus: Math.max(0, state.nonLus - 1),
      }));
    } catch (err) {
      console.error("Marquer lue error:", err);
    }
  },

  // ── Marquer toutes lues ────────────────────────────────
  marquerToutesLues: async () => {
    try {
      await marquerToutesLues();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, lu: true })),
        nonLus: 0,
      }));
    } catch (err) {
      console.error("Marquer toutes lues error:", err);
    }
  },

  // ── Supprimer ──────────────────────────────────────────
  deleteNotification: async (id) => {
    try {
      await deleteNotification(id);
      set((state) => {
        const notif  = state.notifications.find((n) => n._id === id);
        const wasUnread = notif && !notif.lu;
        return {
          notifications: state.notifications.filter((n) => n._id !== id),
          nonLus: wasUnread ? Math.max(0, state.nonLus - 1) : state.nonLus,
        };
      });
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  },

  // ── Ajout temps réel (Socket.io) ───────────────────────
  pushNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      nonLus: state.nonLus + 1,
    }));
  },
}));

export default useNotificationStore;