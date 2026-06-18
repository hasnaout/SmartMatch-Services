import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

/**
 * Accessible uniquement aux visiteurs non connectés.
 * Redirige vers le dashboard si déjà authentifié.
 */
export default function GuestRoute() {
  const { user, token } = useAuthStore();

  if (token && user) {
    const redirect =
      user.role === "admin"       ? "/admin/dashboard"       :
      user.role === "prestataire" ? "/prestataire/dashboard" :
                                    "/client/dashboard";

    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}