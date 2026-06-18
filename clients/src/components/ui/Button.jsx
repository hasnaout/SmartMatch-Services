import styles from "./Button.module.css";
import { cn } from "../../utils/cn";

/**
 * @param {"primary"|"secondary"|"ghost"|"danger"} variant
 * @param {"sm"|"md"|"lg"} size
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export default function Button({
  children,
  variant  = "primary",
  size     = "md",
  loading  = false,
  fullWidth= false,
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth  && styles.fullWidth,
        loading    && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden />}
      <span className={cn(styles.content, loading && styles.contentHidden)}>
        {children}
      </span>
    </button>
  );
}