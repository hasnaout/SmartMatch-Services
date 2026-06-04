import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

/**
 * Protège les routes nécessitant une authentification.
 * Redirige vers /auth/login si non connecté,
 * en mémorisant la page demandée (state.from).
 */
export default function PrivateRoute() {
  const { user, token } = useAuthStore();
  const location        = useLocation();

  if (!token || !user) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}