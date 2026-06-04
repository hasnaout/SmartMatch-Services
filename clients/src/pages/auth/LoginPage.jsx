import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

import { login } from "../../api/auth.api";
import useAuthStore from "../../store/useAuthStore";
import Button from "../../components/ui/Button";
import Input  from "../../components/ui/Input";
import styles from "./AuthPages.module.css";

// ── Validation ────────────────────────────────────────────────────
const schema = z.object({
  email:    z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

export default function LoginPage() {
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const { setAuth }             = useAuthStore();
  const navigate                = useNavigate();
  const location                = useLocation();

  // Redirection vers la page demandée avant login
  const from = location.state?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data);
      setAuth({ user: res.user, token: res.token });
      toast.success(`Bienvenue ${res.user.nom} !`);

      // Redirect selon rôle ou page précédente
      const redirect =
        from ||
        (res.user.role === "admin"       ? "/admin/dashboard"       :
         res.user.role === "prestataire" ? "/prestataire/dashboard" :
                                           "/client/dashboard");
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.userMessage || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* En-tête */}
      <div className={styles.header}>
        <h2 className={styles.title}>Connexion</h2>
        <p className={styles.subtitle}>
          Pas encore de compte ?{" "}
          <Link to="/auth/register" className={styles.link}>S'inscrire</Link>
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>

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
          placeholder="••••••••"
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
          required
          {...register("password")}
        />

        <div className={styles.forgotRow}>
          <Link to="/auth/forgot-password" className={styles.forgotLink}>
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          Se connecter
        </Button>

      </form>

      {/* Divider */}
      <div className={styles.divider}>
        <span>ou continuez avec</span>
      </div>

      {/* Démo rapide */}
      <div className={styles.demoGrid}>
        {[
          { role: "client",      label: "Demo Client",      email: "client@demo.com"      },
          { role: "prestataire", label: "Demo Prestataire", email: "prestataire@demo.com" },
        ].map(({ role, label, email }) => (
          <button
            key={role}
            type="button"
            className={styles.demoBtn}
            onClick={() => {
              // Pré-remplissage rapide pour démo
              document.querySelector('[name="email"]').value    = email;
              document.querySelector('[name="password"]').value = "password123";
            }}
          >
            {label}
          </button>
        ))}
      </div>

    </div>
  );
}