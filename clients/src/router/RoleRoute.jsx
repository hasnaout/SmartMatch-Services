import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

/**
 * Protège les routes par rôle(s).
 * @prop {string | string[]} roles — rôles autorisés
 */
export default function RoleRoute({ roles }) {
  const { user } = useAuthStore();

  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!user || !allowed.includes(user.role)) {
    // Redirige vers le dashboard du rôle actuel
    const fallback =
      user?.role === "admin"       ? "/admin/dashboard"       :
      user?.role === "prestataire" ? "/prestataire/dashboard" :
      user?.role === "client"      ? "/client/dashboard"      :
      "/auth/login";

    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}