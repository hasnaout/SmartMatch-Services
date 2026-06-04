import { Outlet, Link } from "react-router-dom";
import styles from "./AuthLayout.module.css";

export default function AuthLayout() {
  return (
    <div className={styles.wrapper}>

      {/* Panneau gauche — branding */}
      <div className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.logo}>S</div>
          <h1 className={styles.brandTitle}>SmartMatch</h1>
          <p className={styles.brandSubtitle}>
            La plateforme qui connecte les meilleurs prestataires
            aux clients qui en ont besoin.
          </p>
          <ul className={styles.features}>
            {[
              "Matching intelligent basé sur vos critères",
              "Prestataires vérifiés et notés",
              "Paiement sécurisé & suivi en temps réel",
            ].map((f) => (
              <li key={f} className={styles.featureItem}>
                <span className={styles.featureIcon}>✦</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.brandDecor} aria-hidden />
      </div>

      {/* Panneau droit — formulaire */}
      <div className={styles.form}>
        <div className={styles.formInner}>
          <Link to="/" className={styles.backLink}>
            ← Retour à l'accueil
          </Link>
          <div className={styles.formCard}>
            <Outlet />
          </div>
        </div>
      </div>

    </div>
  );
}