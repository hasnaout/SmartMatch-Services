import { useLocation, Link } from "react-router-dom";
import { Bell, MessageSquare, Menu } from "lucide-react";
import useUIStore            from "../../store/useUIStore";
import useNotificationStore  from "../../store/useNotificationStore";
import useMessageStore       from "../../store/useMessageStore";
import useAuthStore          from "../../store/useAuthStore";
import styles from "./Topbar.module.css";

// Titre de page selon la route
const PAGE_TITLES = {
  "/client/dashboard":         "Dashboard",
  "/client/demandes":          "Mes demandes",
  "/client/demandes/nouvelle": "Nouvelle demande",
  "/client/paiements":         "Paiements",
  "/client/avis":              "Mes avis",
  "/prestataire/dashboard":    "Dashboard",
  "/prestataire/disponibles":  "Missions disponibles",
  "/prestataire/missions":     "Mes missions",
  "/prestataire/profil":       "Mon profil",
  "/prestataire/portfolio":    "Portfolio",
  "/prestataire/revenus":      "Revenus",
  "/admin/dashboard":          "Administration",
  "/admin/users":              "Utilisateurs",
  "/admin/demandes":           "Demandes",
  "/admin/avis":               "Avis",
  "/admin/categories":         "Catégories",
  "/admin/paiements":          "Paiements",
  "/chat":                     "Messages",
  "/notifications":            "Notifications",
  "/settings/profil":          "Paramètres",
};

export default function TopBar() {
  const { pathname }     = useLocation();
  const { toggleSidebar } = useUIStore();
  const nonLusNotifs     = useNotificationStore((s) => s.nonLus);
  const messagesNonLus   = useMessageStore((s) => s.messagesNonLus);
  const { user }         = useAuthStore();

  const title = PAGE_TITLES[pathname] ?? "SmartMatch";

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {/* Messages */}
        <Link to="/chat" className={styles.iconBtn} aria-label="Messages">
          <MessageSquare size={20} />
          {messagesNonLus > 0 && (
            <span className={styles.badge}>
              {messagesNonLus > 99 ? "99+" : messagesNonLus}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <Link to="/notifications" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
          {nonLusNotifs > 0 && (
            <span className={styles.badge}>
              {nonLusNotifs > 99 ? "99+" : nonLusNotifs}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link to="/settings/profil" className={styles.avatar}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.nom} />
            : <span>{user?.nom?.[0]?.toUpperCase()}</span>
          }
        </Link>
      </div>
    </header>
  );
}
