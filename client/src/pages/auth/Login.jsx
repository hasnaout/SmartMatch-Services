import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, CheckCircle, Users, Star } from 'lucide-react';

const Login = () => {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail,setForgotEmail]= useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  // Charger email sauvegardé
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) { setEmail(savedEmail); setRemember(true); }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);

      // Se souvenir de moi
      if (remember) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      toast.success(`Bienvenue ${user.prenom} !`);
      if (user.role === 'client')      navigate('/client/dashboard');
      if (user.role === 'prestataire') navigate('/prestataire/dashboard');
      if (user.role === 'admin')       navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSend = async () => {
    if (!forgotEmail) { toast.error('Entrez votre email'); return; }
    setForgotLoading(true);
    try {
      const { data } = await import('../../services/api').then(m =>
        m.default.post('/auth/mot-de-passe-oublie', { email: forgotEmail })
      );
      toast.success('Code envoyé !');
      setCodeEnvoye(true);
      if (data.code) {
        toast(`🔑 Code de test : ${data.code}`, { duration: 10000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async () => {
    if (!forgotCode || !newPass) { toast.error('Remplissez tous les champs'); return; }
    if (newPass.length < 6) { toast.error('Mot de passe trop court'); return; }
    setForgotLoading(true);
    try {
      await import('../../services/api').then(m =>
        m.default.post('/auth/reinitialiser-mot-de-passe', {
          email: forgotEmail,
          code:  forgotCode,
          nouveauMotDePasse: newPass,
        })
      );
      toast.success('✅ Mot de passe réinitialisé !');
      setShowForgot(false);
      setCodeEnvoye(false);
      setForgotEmail('');
      setForgotCode('');
      setNewPass('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code invalide');
    } finally {
      setForgotLoading(false);
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
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:'#fff' }}>SmartMatch</span>
          </div>
          <h2 className="auth-left-title">La plateforme qui connecte talents et besoins</h2>
          <p className="auth-left-subtitle">
            Trouvez le prestataire idéal ou développez votre activité grâce à notre système intelligent.
          </p>
          {[
            { icon: <CheckCircle size={16} color="#fff" />, text: 'Matching intelligent basé sur vos critères' },
            { icon: <Users size={16} color="#fff" />,       text: 'Des milliers de prestataires qualifiés'     },
            { icon: <Star size={16} color="#fff" />,        text: 'Système d\'avis et de notation fiable'      },
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
        <div className="auth-container">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Zap size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="auth-logo-text">SmartMatch</span>
          </div>

          {!showForgot ? (
            /* ── Formulaire Login ── */
            <div className="auth-card">
              <div className="auth-card-header">
                <h1 className="auth-title">Bon retour 👋</h1>
                <p className="auth-subtitle">Connectez-vous à votre espace</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label className="form-label">Adresse email</label>
                  <input className="form-input" type="email" placeholder="vous@exemple.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="form-field">
                  <label className="form-label">Mot de passe</label>
                  <div className="form-input-wrap">
                    <input className="form-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="input-icon-btn"
                      onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Se souvenir + Mot de passe oublié */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--muted)' }}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      style={{ width:15, height:15, accentColor:'var(--accent)', cursor:'pointer' }}
                    />
                    Se souvenir de moi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{
                      border:'none', cursor:'pointer',
                      fontSize:13, fontWeight:500,
                      background: 'var(--gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Connexion...</> : 'Se connecter'}
                </button>
              </form>

              <p className="auth-footer">
                Pas encore de compte ? <Link to="/register">Créer un compte</Link>
              </p>
            </div>
          ) : (
            /* ── Formulaire Mot de passe oublié ── */
            <div className="auth-card">
              <div className="auth-card-header">
                <h1 className="auth-title">
                  {codeEnvoye ? '🔑 Nouveau mot de passe' : '🔒 Mot de passe oublié'}
                </h1>
                <p className="auth-subtitle">
                  {codeEnvoye
                    ? 'Entrez le code reçu et votre nouveau mot de passe'
                    : 'Entrez votre email pour recevoir un code'
                  }
                </p>
              </div>

              <div className="auth-form">
                {!codeEnvoye ? (
                  <>
                    <div className="form-field">
                      <label className="form-label">Adresse email</label>
                      <input className="form-input" type="email"
                        placeholder="vous@exemple.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)} />
                    </div>
                    <button
                      className="btn-primary auth-submit"
                      onClick={handleForgotSend}
                      disabled={forgotLoading}
                    >
                      {forgotLoading
                        ? <><span className="spinner" /> Envoi...</>
                        : 'Envoyer le code'
                      }
                    </button>
                  </>
                ) : (
                  <>
                    <div className="form-field">
                      <label className="form-label">Code de vérification</label>
                      <input className="form-input"
                        placeholder="123456"
                        value={forgotCode}
                        onChange={e => setForgotCode(e.target.value)}
                        maxLength={6}
                        style={{ letterSpacing:8, textAlign:'center', fontSize:20, fontWeight:700 }}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Nouveau mot de passe</label>
                      <input className="form-input" type="password"
                        placeholder="Min. 6 caractères"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)} />
                    </div>
                    <button
                      className="btn-primary auth-submit"
                      onClick={handleForgotReset}
                      disabled={forgotLoading}
                    >
                      {forgotLoading
                        ? <><span className="spinner" /> Réinitialisation...</>
                        : 'Réinitialiser le mot de passe'
                      }
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setShowForgot(false); setCodeEnvoye(false); }}
                  style={{
                    background:'none', border:'none', cursor:'pointer',
                    fontSize:14, color:'var(--muted)', textAlign:'center',
                    textDecoration:'underline',
                  }}
                >
                  ← Retour à la connexion
                </button>
              </div>
            </div>
          )}

          <div className="auth-badges">
            {['Client', 'Prestataire', 'Admin'].map(r => (
              <span key={r} className="auth-badge">{r}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;