import styles from "./PageLoader.module.css";

export default function PageLoader() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.logo}>S</div>
      <div className={styles.spinner} />
    </div>
  );
}