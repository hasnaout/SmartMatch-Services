import { useState } from 'react';
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Lock, Trash2, Eye, EyeOff, ShieldAlert, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();

  const [mdpForm, setMdpForm] = useState({
    ancienMotDePasse: '',
    nouveauMotDePasse: '',
    confirmation: '',
  });
  const [showAncien,   setShowAncien]   = useState(false);
  const [showNouveau,  setShowNouveau]  = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [mdpLoading,   setMdpLoading]   = useState(false);

  const handleMdpChange = (e) =>
    setMdpForm({ ...mdpForm, [e.target.name]: e.target.value });

  const handleMdpSubmit = async () => {
    if (mdpForm.nouveauMotDePasse !== mdpForm.confirmation) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    setMdpLoading(true);
    try {
      const { data } = await api.put('/users/changer-mot-de-passe', mdpForm);
      toast.success(data.message);
      setMdpForm({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setMdpLoading(false);
    }
  };

  const [raison,         setRaison]         = useState('');
  const [suppLoading,    setSuppLoading]    = useState(false);
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false);

  const handleSuppressionSubmit = async () => {
    if (raison.trim().length < 10) {
      toast.error('Veuillez préciser la raison (minimum 10 caractères)');
      return;
    }
    setSuppLoading(true);
    try {
      const { data } = await api.post('/users/demande-suppression', { raison });
      toast.success(data.message);
      setDemandeEnvoyee(true);
      setRaison('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setSuppLoading(false);
    }
  };

  const handleAnnulerDemande = async () => {
    try {
      const { data } = await api.delete('/users/demande-suppression');
      toast.success(data.message);
      setDemandeEnvoyee(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const inputWrap = { position: 'relative' };
  const eyeBtn = {
    position: 'absolute', right: 14, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--muted)', padding: 0, display: 'flex',
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Paramètres du <span>compte</span>
          </h1>
          <p className="dashboard-subtitle">
            Gérez votre sécurité et vos préférences
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>

          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  Changer le mot de passe
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                  Sécurisez votre accès
                </p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <div style={inputWrap}>
                <input
                  className="form-input"
                  type={showAncien ? 'text' : 'password'}
                  name="ancienMotDePasse"
                  placeholder="••••••••"
                  value={mdpForm.ancienMotDePasse}
                  onChange={handleMdpChange}
                  style={{ paddingRight: 42 }}
                />
                <button style={eyeBtn} onClick={() => setShowAncien(!showAncien)}>
                  {showAncien ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <div style={inputWrap}>
                <input
                  className="form-input"
                  type={showNouveau ? 'text' : 'password'}
                  name="nouveauMotDePasse"
                  placeholder="••••••••"
                  value={mdpForm.nouveauMotDePasse}
                  onChange={handleMdpChange}
                  style={{ paddingRight: 42 }}
                />
                <button style={eyeBtn} onClick={() => setShowNouveau(!showNouveau)}>
                  {showNouveau ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <div style={inputWrap}>
                <input
                  className="form-input"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmation"
                  placeholder="••••••••"
                  value={mdpForm.confirmation}
                  onChange={handleMdpChange}
                  style={{ paddingRight: 42 }}
                />
                <button style={eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mdpForm.confirmation && mdpForm.nouveauMotDePasse && (
                <p style={{
                  fontSize: 12, marginTop: 6,
                  color: mdpForm.confirmation === mdpForm.nouveauMotDePasse
                    ? 'var(--success, #22c55e)'
                    : 'var(--danger, #ef4444)',
                }}>
                  {mdpForm.confirmation === mdpForm.nouveauMotDePasse
                    ? '✓ Les mots de passe correspondent'
                    : '✗ Les mots de passe ne correspondent pas'}
                </p>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleMdpSubmit}
              disabled={mdpLoading}
              style={{ width: '100%' }}
            >
              {mdpLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>

          <div className="card" style={{ padding: 28, borderColor: demandeEnvoyee ? 'var(--warning, #f59e0b)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: demandeEnvoyee
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {demandeEnvoyee ? <CheckCircle size={18} color="#fff" /> : <Trash2 size={18} color="#fff" />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  Suppression du compte
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                  Action irréversible
                </p>
              </div>
            </div>

            {demandeEnvoyee ? (

              <div>
                <div style={{
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 10, padding: '14px 16px', marginBottom: 16,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <CheckCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                    Votre demande a bien été transmise à l'administrateur. Elle sera traitée dans les plus brefs délais.
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={handleAnnulerDemande}
                  style={{ width: '100%', fontSize: 13 }}
                >
                  Annuler ma demande
                </button>
              </div>
            ) : (
              /* État : formulaire */
              <div>
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <ShieldAlert size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                    La suppression est définitive. Toutes vos données (demandes, messages, avis) seront effacées après validation par l'administrateur.
                  </p>
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Raison de la suppression *</label>
                  <textarea
                    className="form-input"
                    placeholder="Expliquez pourquoi vous souhaitez supprimer votre compte (minimum 10 caractères)..."
                    value={raison}
                    onChange={(e) => setRaison(e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical', minHeight: 100 }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    {raison.trim().length} / 10 caractères minimum
                  </p>
                </div>

                <button
                  onClick={handleSuppressionSubmit}
                  disabled={suppLoading || raison.trim().length < 10}
                  style={{
                    width: '100%', padding: '11px 0',
                    background: raison.trim().length >= 10 ? '#ef4444' : 'var(--border)',
                    color: raison.trim().length >= 10 ? '#fff' : 'var(--muted)',
                    border: 'none', borderRadius: 8, fontSize: 14,
                    fontWeight: 600, cursor: raison.trim().length >= 10 ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                  }}
                >
                  {suppLoading ? 'Envoi en cours...' : 'Envoyer la demande de suppression'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
