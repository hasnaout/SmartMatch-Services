import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuthStore from "../../store/useAuthStore";
import styles from "./Navbar.module.css";
import { cn } from "../../utils/cn";

export default function Navbar() {
  const { user, logout }    = useAuthStore();
  const navigate            = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const dashboardPath =
    user?.role === "admin"       ? "/admin/dashboard"       :
    user?.role === "prestataire" ? "/prestataire/dashboard" :
                                    "/client/dashboard";

  return (
    <header className={cn(styles.header, scrolled && styles.scrolled)}>
      <div className={styles.inner}>

        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>S</span>
          <span className={styles.logoText}>SmartMatch</span>
        </Link>

        {/* Nav desktop */}
        <nav className={styles.nav}>
          <NavLink
            to="/prestataires"
            className={({ isActive }) =>
              cn(styles.navLink, isActive && styles.navLinkActive)
            }
          >
            Prestataires
          </NavLink>
          {user && (
            <NavLink
              to={dashboardPath}
              className={({ isActive }) =>
                cn(styles.navLink, isActive && styles.navLinkActive)
              }
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {user ? (
            <>
              <Link to={dashboardPath} className={styles.avatarBtn}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.nom} className={styles.avatar} />
                  : <span className={styles.avatarFallback}>
                      {user.nom?.[0]?.toUpperCase()}
                    </span>
                }
              </Link>
              <button onClick={handleLogout} className={styles.btnOutline}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login"    className={styles.btnGhost}>Connexion</Link>
              <Link to="/auth/register" className={styles.btnPrimary}>S'inscrire</Link>
            </>
          )}
        </div>

        {/* Burger mobile */}
        <button
          className={styles.burger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className={cn(styles.burgerLine, menuOpen && styles.burgerOpen1)} />
          <span className={cn(styles.burgerLine, menuOpen && styles.burgerOpen2)} />
          <span className={cn(styles.burgerLine, menuOpen && styles.burgerOpen3)} />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/prestataires" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
            Prestataires
          </Link>
          {user
            ? <>
                <Link to={dashboardPath} onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className={styles.mobileLinkBtn}>
                  Déconnexion
                </button>
              </>
            : <>
                <Link to="/auth/login"    onClick={() => setMenuOpen(false)} className={styles.mobileLink}>Connexion</Link>
                <Link to="/auth/register" onClick={() => setMenuOpen(false)} className={styles.mobileLinkPrimary}>S'inscrire</Link>
              </>
          }
        </div>
      )}
    </header>
  );
}