import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import { forgotPassword } from "../../api/auth.api";
import Button from "../../components/ui/Button";
import Input  from "../../components/ui/Input";
import styles from "./AuthPages.module.css";
import sent   from "./ForgotPasswordPage.module.css";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await forgotPassword(data);
      setSuccess(true);
    } catch (err) {
      toast.error(err.userMessage || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={sent.successState}>
        <div className={sent.icon}><CheckCircle size={40} /></div>
        <h2 className={styles.title}>Email envoyé !</h2>
        <p className={sent.message}>
          Vérifiez votre boîte mail et suivez les instructions
          pour réinitialiser votre mot de passe.
        </p>
        <Link to="/auth/login">
          <Button variant="secondary" fullWidth>Retour à la connexion</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mot de passe oublié</h2>
        <p className={styles.subtitle}>
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

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
        <Button type="submit" fullWidth loading={loading} size="lg">
          Envoyer le lien
        </Button>
      </form>

      <p className={styles.subtitle}>
        <Link to="/auth/login" className={styles.link}>← Retour à la connexion</Link>
      </p>
    </div>
  );
}
