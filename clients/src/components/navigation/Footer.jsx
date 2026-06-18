import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logoIcon}>S</span>
          <span className={styles.logoText}>SmartMatch</span>
        </div>
        <p className={styles.copy}>
          © {new Date().getFullYear()} SmartMatch — Tous droits réservés
        </p>
        <div className={styles.links}>
          <Link to="/prestataires">Prestataires</Link>
          <Link to="/auth/register">S'inscrire</Link>
        </div>
      </div>
    </footer>
  );
}