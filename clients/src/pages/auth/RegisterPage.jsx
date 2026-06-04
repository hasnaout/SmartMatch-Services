import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, User, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

import { register as registerApi } from "../../api/auth.api";
import useAuthStore from "../../store/useAuthStore";
import Button from "../../components/ui/Button";
import Input  from "../../components/ui/Input";
import styles from "./AuthPages.module.css";

// ── Validation ─────────────────────────────────────────────────
const schema = z.object({
  nom:      z.string().min(2, "Minimum 2 caractères"),
  email:    z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/,    "Au moins une majuscule")
    .regex(/[0-9]/,    "Au moins un chiffre"),
  confirm:  z.string(),
  role:     z.enum(["client", "prestataire"]),
}).refine((d) => d.password === d.confirm, {
  message: "Les mots de passe ne correspondent pas",
  path:    ["confirm"],
});

export default function RegisterPage() {
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const { setAuth }             = useAuthStore();
  const navigate                = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "client" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const {...payload } = data;
      const res = await registerApi(payload);
      setAuth({ user: res.user, token: res.token });
      toast.success("Compte créé avec succès !");
      navigate(
        res.user.role === "prestataire"
          ? "/prestataire/dashboard"
          : "/client/dashboard",
        { replace: true }
      );
    } catch (err) {
      toast.error(err.userMessage || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* En-tête */}
      <div className={styles.header}>
        <h2 className={styles.title}>Créer un compte</h2>
        <p className={styles.subtitle}>
          Déjà inscrit ?{" "}
          <Link to="/auth/login" className={styles.link}>Se connecter</Link>
        </p>
      </div>

      {/* Sélecteur de rôle */}
      <div className={styles.roleSelector}>
        {[
          { value: "client",      icon: User,      label: "Client",      desc: "Je cherche un prestataire" },
          { value: "prestataire", icon: Briefcase, label: "Prestataire", desc: "Je propose mes services"   },
        ].map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            type="button"
            className={`${styles.roleCard} ${selectedRole === value ? styles.roleCardActive : ""}`}
            onClick={() => setValue("role", value)}
          >
            <div className={styles.roleIconWrapper}>
              <Icon size={20} />
            </div>
            <div>
              <p className={styles.roleLabel}>{label}</p>
              <p className={styles.roleDesc}>{desc}</p>
            </div>
          </button>
        ))}
      </div>
      {errors.role && <p className={styles.errorGlobal}>{errors.role.message}</p>}

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>

        <Input
          label="Nom complet"
          type="text"
          placeholder="Votre nom"
          leftIcon={<User size={16} />}
          error={errors.nom?.message}
          required
          {...register("nom")}
        />

        <Input
          label="Adresse email"
          type="email"
          placeholder="vous@exemple.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          required
          {...register("email")}
        />

        <Input
          label="Mot de passe"
          type={showPwd ? "text" : "password"}
          placeholder="Min. 8 caractères"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className={styles.eyeBtn}
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          hint="8 caractères min., 1 majuscule, 1 chiffre"
          required
          {...register("password")}
        />

        <Input
          label="Confirmer le mot de passe"
          type={showPwd ? "text" : "password"}
          placeholder="Répétez le mot de passe"
          leftIcon={<Lock size={16} />}
          error={errors.confirm?.message}
          required
          {...register("confirm")}
        />

        {/* Force du mot de passe */}
        <PasswordStrength password={watch("password") || ""} />

        <Button type="submit" fullWidth loading={loading} size="lg">
          Créer mon compte
        </Button>

        <p className={styles.terms}>
          En créant un compte, vous acceptez nos{" "}
          <a href="#" className={styles.link}>conditions d'utilisation</a>.
        </p>

      </form>
    </div>
  );
}

// ── Indicateur de force du mot de passe ───────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { test: password.length >= 8,    label: "8 caractères" },
    { test: /[A-Z]/.test(password),  label: "Majuscule"   },
    { test: /[0-9]/.test(password),  label: "Chiffre"     },
    { test: /[^A-Za-z0-9]/.test(password), label: "Symbole" },
  ];

  const score = checks.filter((c) => c.test).length;
  const colors = ["", "#ef4444", "#f59e0b", "#10b981", "#7C3AED"];
  const labels = ["", "Faible", "Moyen", "Bon", "Fort"];

  return (
    <div className={styles.strength}>
      <div className={styles.strengthBars}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={styles.strengthBar}
            style={{ background: i <= score ? colors[score] : "var(--color-border)" }}
          />
        ))}
      </div>
      <span className={styles.strengthLabel} style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}