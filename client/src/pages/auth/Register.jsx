import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, User, Briefcase, CheckCircle, Users, Star } from 'lucide-react';

const Register = () => {
  const [form, setForm]         = useState({ nom: '', prenom: '', email: '', password: '', telephone: '', role: 'client' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Compte créé avec succès !');
      if (user.role === 'client')      navigate('/client/dashboard');
      if (user.role === 'prestataire') navigate('/prestataire/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l&apos;inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Côté gauche */}
      <div className="auth-left">
        <div className="auth-left-orb auth-left-orb-1" />
        <div className="auth-left-orb auth-left-orb-2" />
        <div className="auth-left-orb auth-left-orb-3" />
        <div className="auth-left-content">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={24} color="#fff" />
            </div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:'#fff' }}>
              SmartMatch
            </span>
          </div>
          <h2 className="auth-left-title">
            Rejoignez des milliers de professionnels
          </h2>
          <p className="auth-left-subtitle">
            Créez votre compte et accédez à une plateforme intelligente qui connecte clients et prestataires qualifiés.
          </p>
          {[
            { icon: <CheckCircle size={16} color="#fff" />, text: 'Inscription gratuite et rapide' },
            { icon: <Users size={16} color="#fff" />,       text: 'Accès à des milliers de missions' },
            { icon: <Star size={16} color="#fff" />,        text: 'Système de notation transparent' },
          ].map((f, i) => (
            <div key={i} className="auth-feature">
              <div className="auth-feature-icon">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Côté droit */}
      <div className="auth-right">
        <div className="auth-container auth-container-wide">

          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Zap size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="auth-logo-text">SmartMatch</span>
          </div>

          <div className="auth-card">
            <div className="auth-card-header">
              <h1 className="auth-title">Créer un compte ✨</h1>
              <p className="auth-subtitle">Rejoignez la plateforme intelligente</p>
            </div>

            {/* Rôle */}
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${form.role === 'client' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'client' })}
              >
                <User size={17} /> Je suis Client
              </button>
              <button
                type="button"
                className={`role-btn ${form.role === 'prestataire' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'prestataire' })}
              >
                <Briefcase size={17} /> Je suis Prestataire
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Nom</label>
                  <input className="form-input" name="nom" placeholder="Alami"
                    value={form.nom} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" name="prenom" placeholder="Youssef"
                    value={form.prenom} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Adresse email</label>
                <input className="form-input" name="email" type="email"
                  placeholder="vous@exemple.com" value={form.email}
                  onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label className="form-label">Téléphone</label>
                <input className="form-input" name="telephone"
                  placeholder="06XXXXXXXX" value={form.telephone}
                  onChange={handleChange} />
              </div>

              <div className="form-field">
                <label className="form-label">Mot de passe</label>
                <div className="form-input-wrap">
                  <input className="form-input" name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 caractères"
                    value={form.password} onChange={handleChange} required />
                  <button type="button" className="input-icon-btn"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Création...</> : 'Créer mon compte'}
              </button>
            </form>

            <p className="auth-footer">
              Déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;