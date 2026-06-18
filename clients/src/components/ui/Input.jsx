import { forwardRef } from "react";
import styles from "./Input.module.css";
import { cn } from "../../utils/cn";

/**
 * @param {string}  label
 * @param {string}  error
 * @param {string}  hint
 * @param {ReactNode} leftIcon
 * @param {ReactNode} rightIcon
 */
const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={cn(styles.inputWrapper, error && styles.hasError)}>
        {leftIcon  && <span className={styles.iconLeft}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            styles.input,
            leftIcon  && styles.withLeft,
            rightIcon && styles.withRight,
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
export default Input;