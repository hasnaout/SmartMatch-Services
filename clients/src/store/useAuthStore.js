import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getMe } from "../api/auth.api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────
      user:      null,
      token:     null,
      isLoading: false,
      isReady:   false, // true après hydratation initiale

      // ── Setters ────────────────────────────────────────
      setUser:  (user)  => set({ user }),
      setToken: (token) => set({ token }),

      // ── Auth actions ───────────────────────────────────

      /**
       * Appelé après login/register réussi
       * @param {{ user, token }} payload
       */
      setAuth: ({ user, token }) => {
        localStorage.setItem("token", token);
        set({ user, token });
      },

      /**
       * Déconnexion complète
       */
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null });
      },

      /**
       * Rafraîchit le profil depuis l'API (appelé au montage de l'app)
       */
      fetchMe: async () => {
        const token = get().token || localStorage.getItem("token");
        if (!token) {
          set({ isReady: true });
          return;
        }

        set({ isLoading: true });
        try {
          const data = await getMe();
          set({ user: data.user ?? data, token, isReady: true });
        } catch {
          // Token invalide ou expiré
          localStorage.removeItem("token");
          set({ user: null, token: null, isReady: true });
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Getters dérivés ────────────────────────────────
      isAuthenticated: () => !!get().token && !!get().user,
      isClient:        () => get().user?.role === "client",
      isPrestataire:   () => get().user?.role === "prestataire",
      isAdmin:         () => get().user?.role === "admin",
      getRole:         () => get().user?.role ?? null,
    }),
    {
      name:    "smartmatch-auth",        // clé localStorage
      partialize: (state) => ({          // ne persister que token + user
        token: state.token,
        user:  state.user,
      }),
    }
  )
);

export default useAuthStore;