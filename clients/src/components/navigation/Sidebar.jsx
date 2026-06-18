import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, PlusCircle, MessageSquare,
  Bell, Settings, LogOut, Briefcase, Star,
  Users, ShieldCheck, CreditCard, ChevronLeft,
  Wallet, FolderOpen, CheckSquare
} from "lucide-react";
import useAuthStore  from "../../store/useAuthStore";
import useUIStore    from "../../store/useUIStore";
import useMessageStore      from "../../store/useMessageStore";
import useNotificationStore from "../../store/useNotificationStore";
import styles from "./Sidebar.module.css";
import { cn } from "../../utils/cn";

// ── Nav items par rôle ─────────────────────────────────────────
const NAV = {
  client: [
    { to: "/client/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
    { to: "/client/demandes",         icon: FileText,        label: "Mes demandes" },
    { to: "/client/demandes/nouvelle",icon: PlusCircle,      label: "Nouvelle demande" },
    { to: "/client/paiements",        icon: CreditCard,      label: "Paiements" },
    { to: "/client/avis",             icon: Star,            label: "Mes avis" },
  ],
  prestataire: [
    { to: "/prestataire/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
    { to: "/prestataire/disponibles", icon: Briefcase,       label: "Missions dispo" },
    { to: "/prestataire/missions",    icon: CheckSquare,     label: "Mes missions" },
    { to: "/prestataire/profil",      icon: ShieldCheck,     label: "Mon profil" },
    { to: "/prestataire/portfolio",   icon: FolderOpen,      label: "Portfolio" },
    { to: "/prestataire/revenus",     icon: Wallet,          label: "Revenus" },
  ],
  admin: [
    { to: "/admin/dashboard",         icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users",             icon: Users,           label: "Utilisateurs" },
    { to: "/admin/demandes",          icon: FileText,        label: "Demandes" },
    { to: "/admin/avis",              icon: Star,            label: "Avis" },
    { to: "/admin/categories",        icon: FolderOpen,      label: "Catégories" },
    { to: "/admin/paiements",         icon: CreditCard,      label: "Paiements" },
  ],
};

const BOTTOM_NAV = [
  { to: "/chat",             icon: MessageSquare, label: "Messages",      badge: "messages" },
  { to: "/notifications",    icon: Bell,          label: "Notifications", badge: "notifs"   },
  { to: "/settings/profil",  icon: Settings,      label: "Paramètres"    },
];

export default function Sidebar() {
  const { user, logout }          = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const messagesNonLus            = useMessageStore((s) => s.messagesNonLus);
  const nonLusNotifs              = useNotificationStore((s) => s.nonLus);
  const navigate                  = useNavigate();

  const navItems = NAV[user?.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const getBadge = (key) => {
    if (key === "messages") return messagesNonLus;
    if (key === "notifs")   return nonLusNotifs;
    return 0;
  };

  return (
    <aside className={cn(styles.sidebar, !sidebarOpen && styles.collapsed)}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>S</span>
          {sidebarOpen && <span className={styles.logoText}>SmartMatch</span>}
        </div>
        <button
          className={cn(styles.toggleBtn, !sidebarOpen && styles.toggleBtnCollapsed)}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* User info */}
      {sidebarOpen && (
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.nom} />
              : <span>{user?.nom?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.nom}</p>
            <p className={styles.userRole}>{user?.role}</p>
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <nav className={styles.nav}>
        <p className={styles.navLabel}>{sidebarOpen ? "Navigation" : ""}</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(styles.navItem, isActive && styles.navItemActive)
            }
          >
            <Icon size={18} className={styles.navIcon} />
            {sidebarOpen && <span className={styles.navLabel2}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Séparateur */}
      <div className={styles.divider} />

      {/* Navigation basse */}
      <nav className={styles.nav}>
        {BOTTOM_NAV.map(({ to, icon: Icon, label, badge }) => {
          const count = badge ? getBadge(badge) : 0;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(styles.navItem, isActive && styles.navItemActive)
              }
            >
              <span className={styles.iconWrapper}>
                <Icon size={18} className={styles.navIcon} />
                {count > 0 && (
                  <span className={styles.badge}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              {sidebarOpen && <span className={styles.navLabel2}>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} />
        {sidebarOpen && <span>Déconnexion</span>}
      </button>

    </aside>
  );
}