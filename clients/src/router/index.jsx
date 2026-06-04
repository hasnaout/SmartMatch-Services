import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { lazyLoad } from "./LazyLoad";

// Guards
import PrivateRoute from "./PrivateRoute";
import RoleRoute    from "./RoleRoute";
import GuestRoute   from "./GuestRoute";

// Layouts (importés directement, pas lazy — chargés une fois)
//import PublicLayout      from "../layouts/PublicLayout";
import AuthLayout        from "../layouts/AuthLayout";
import DashboardLayout   from "../layouts/DashboardLayout";

// ── Pages publiques ────────────────────────────────────────────
//const LandingPage          = () => lazyLoad(() => import("../pages/public/LandingPage"));
//const PrestatairesPage     = () => lazyLoad(() => import("../pages/public/PrestatairesPage"));
//const PrestataireDetailPage= () => lazyLoad(() => import("../pages/public/PrestataireDetailPage"));

// ── Pages auth ─────────────────────────────────────────────────
const LoginPage            = () => lazyLoad(() => import("../pages/auth/LoginPage"));
const RegisterPage         = () => lazyLoad(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage   = () => lazyLoad(() => import("../pages/auth/ForgotPasswordPage"));
//const ResetPasswordPage    = () => lazyLoad(() => import("../pages/auth/ResetPasswordPage"));

// ── Pages client ───────────────────────────────────────────────
const ClientDashboard      = () => lazyLoad(() => import("../pages/client/Dashboard"));
const NouvelleDemandePage  = () => lazyLoad(() => import("../pages/client/CreerDemande"));
const MesDemandesPage      = () => lazyLoad(() => import("../pages/client/MesDemandes"));
const DemandeDetailPage    = () => lazyLoad(() => import("../pages/client/DetailDemande"));
const PrestatairesPage     = () => lazyLoad(() => import("../pages/client/Prestataires"));
const PrestataireDetailPage= () => lazyLoad(() => import("../pages/client/ProfilPrestataire"));
const CartePage            = () => lazyLoad(() => import("../pages/client/Carte"));
const PaiementPage         = () => lazyLoad(() => import("../pages/client/Paiement"));
const HistoriquePaiements  = () => lazyLoad(() => import("../pages/client/HistoriquePaiements"));
//const MesAvisPage          = () => lazyLoad(() => import("../pages/client/MesAvisPage"));

// ── Pages prestataire ──────────────────────────────────────────
const PrestataireDashboard = () => lazyLoad(() => import("../pages/prestataire/Dashboard"));
const ProfilPage           = () => lazyLoad(() => import("../pages/prestataire/MonProfil"));
//const PortfolioPage        = () => lazyLoad(() => import("../pages/prestataire/PortfolioPage"));
const MissionsDispo        = () => lazyLoad(() => import("../pages/prestataire/Demandes"));
const MissionDetailPage    = () => lazyLoad(() => import("../pages/prestataire/DetailMission"));
const RevenusPage          = () => lazyLoad(() => import("../pages/prestataire/Revenus"));

// ── Pages admin ────────────────────────────────────────────────
const AdminDashboard       = () => lazyLoad(() => import("../pages/admin/Dashboard"));
const UsersManagement      = () => lazyLoad(() => import("../pages/admin/Users"));
const AvisManagement       = () => lazyLoad(() => import("../pages/admin/ModerationAvis"));
//const DemandesManagement   = () => lazyLoad(() => import("../pages/admin/DemandesManagement"));
const CategoriesPage       = () => lazyLoad(() => import("../pages/admin/Categories"));
const AnalyticsPage        = () => lazyLoad(() => import("../pages/admin/Analytics"));
//const PaiementsAdmin       = () => lazyLoad(() => import("../pages/admin/PaiementsAdmin"));

// ── Pages partagées ────────────────────────────────────────────
const ChatPage             = () => lazyLoad(() => import("../pages/shared/Messagerie"));
//const NotificationsPage    = () => lazyLoad(() => import("../pages/shared/NotificationsPage"));
//const ProfilSettingsPage   = () => lazyLoad(() => import("../pages/shared/ProfilSettingsPage"));
//const NotFoundPage         = () => lazyLoad(() => import("../pages/shared/NotFoundPage"));

// ── Router ──────────────────────────────────────────────────────
const router = createBrowserRouter([
  // Redirect root to auth login while public routes are commented
  { path: "/", element: <Navigate to="/auth/login" replace /> },

  // ── AUTH (visiteurs uniquement) ──────────────────────────────
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/auth/login",           element: <LoginPage /> },
          { path: "/auth/register",        element: <RegisterPage /> },
          { path: "/auth/forgot-password", element: <ForgotPasswordPage /> },
        //  { path: "/auth/reset-password",  element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  // ── APP protégée ─────────────────────────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <RoleRoute roles="client" />,
            children: [
              { path: "/client/dashboard",          element: <ClientDashboard /> },
              { path: "/client/demandes",           element: <MesDemandesPage /> },
              { path: "/client/demandes/nouvelle",  element: <NouvelleDemandePage /> },
              { path: "/client/creer",              element: <Navigate to="/client/demandes/nouvelle" replace /> },
              { path: "/client/demandes/:id",       element: <DemandeDetailPage /> },
              { path: "/client/prestataires",       element: <PrestatairesPage /> },
              { path: "/client/prestataires/:id",   element: <PrestataireDetailPage /> },
              { path: "/client/carte",              element: <CartePage /> },
              { path: "/client/paiement/:demandeId",element: <PaiementPage /> },
              { path: "/client/paiements",          element: <HistoriquePaiements /> },
            ],
          },
          {
            element: <RoleRoute roles="prestataire" />,
            children: [
              { path: "/prestataire/dashboard",     element: <PrestataireDashboard /> },
              { path: "/prestataire/profil",        element: <ProfilPage /> },
              { path: "/prestataire/disponibles",   element: <MissionsDispo /> },
              { path: "/prestataire/missions",      element: <MissionsDispo /> },
              { path: "/prestataire/demandes",      element: <Navigate to="/prestataire/disponibles" replace /> },
              { path: "/prestataire/missions/:id",  element: <MissionDetailPage /> },
              { path: "/prestataire/revenus",       element: <RevenusPage /> },
            ],
          },
          {
            element: <RoleRoute roles="admin" />,
            children: [
              { path: "/admin/dashboard",           element: <AdminDashboard /> },
              { path: "/admin/users",               element: <UsersManagement /> },
              { path: "/admin/categories",          element: <CategoriesPage /> },
              { path: "/admin/avis",                element: <AvisManagement /> },
              { path: "/admin/analytics",           element: <AnalyticsPage /> },
            ],
          },
          {
            element: <RoleRoute roles={["client", "prestataire"]} />,
            children: [
              { path: "/chat",                      element: <ChatPage /> },
              { path: "/messages",                  element: <Navigate to="/chat" replace /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback: redirect unknown routes to login
  { path: "*", element: <Navigate to="/auth/login" replace /> },
]);
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
