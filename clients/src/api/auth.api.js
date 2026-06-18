import api, { setToken, clearAuth } from "./axios";

/**
 * Inscription
 * @param {{ nom, email, password, role }} data
 */
export const register = async (data) => {
  const res = await api.post("/auth/register", data);
  if (res.data.token) setToken(res.data.token);
  return res.data;
};

/**
 * Connexion
 * @param {{ email, password }} data
 */
export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  if (res.data.token) setToken(res.data.token);
  return res.data;
};

/**
 * Récupérer le profil connecté
 */
export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

/**
 * Déconnexion (côté client)
 */
export const logout = () => {
  clearAuth();
};

/**
 * Demande de réinitialisation du mot de passe
 * @param {{ email }} data
 */
export const forgotPassword = async (data) => {
  const res = await api.post("/auth/forgot-password", data);
  return res.data;
};

/**
 * Réinitialisation avec code
 * @param {{ email, code, newPassword }} data
 */
export const resetPassword = async (data) => {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
};