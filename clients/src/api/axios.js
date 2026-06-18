import axios from "axios";
import { API_URL } from "../utils/constants";

// ── Instance principale ──────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Helpers token ────────────────────────────────────────────────
const getToken  = ()        => localStorage.getItem("token");
const setToken  = (token)   => localStorage.setItem("token", token);
const clearAuth = ()        => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ── Intercepteur REQUEST : injecte le JWT ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur RESPONSE : gestion globale des erreurs ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    // Token expiré ou invalide → déconnexion propre
    if (response?.status === 401) {
      clearAuth();
      // Redirect sans casser le router React
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth/login";
      }
    }

    // Construire un message d'erreur lisible
    const message =
      response?.data?.message ||
      response?.data?.error  ||
      "Une erreur est survenue. Veuillez réessayer.";

    // Attacher le message propre à l'erreur
    error.userMessage = message;

    return Promise.reject(error);
  }
);

export { getToken, setToken, clearAuth };
export default api;