import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CreditCard, Banknote, CheckCircle,
  Clock, Shield, AlertCircle,
} from 'lucide-react';
import { CATEGORIES_EN_LIGNE } from '../../utils/paiementHelper';

const Paiement = () => {
  const { demandeId } = useParams();
  const navigate      = useNavigate();

  const [demande,          setDemande]          = useState(null);
  const [paiementExistant, setPaiementExistant] = useState(null);
  const [montant,          setMontant]          = useState('');
  const [methode,          setMethode]          = useState('');
  const [notes,            setNotes]            = useState('');
  const [loading,          setLoading]          = useState(true);
  const [paying,           setPaying]           = useState(false);
  const [step,             setStep]             = useState(1); // 1=choix, 2=simulation, 3=confirmation

  const isEnLigne = demande ? CATEGORIES_EN_LIGNE.includes(demande.categorie) : false;

  useEffect(() => {
    Promise.all([
      api.get(`/demandes/${demandeId}`),
      api.get(`/paiements/demande/${demandeId}`),
    ])
      .then(([d, p]) => {
        setDemande(d.data.demande);
        if (p.data.paiement) {
          setPaiementExistant(p.data.paiement);
          setMethode(p.data.paiement.methode);
          setMontant(p.data.paiement.montant?.toString() || '');

          if (p.data.paiement.statut !== 'payé' && p.data.paiement.methode === 'en_ligne') {
            setStep(2);
          }
        }
        // Pré-remplir le montant avec le budget max
        if (!p.data.paiement && d.data.demande.budget?.max > 0) {
          setMontant(d.data.demande.budget.max.toString());
        }
      })
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, [demandeId]);

  const handleInitier = async () => {
    if (paiementExistant?.statut === 'en_attente') {
      if (paiementExistant.methode === 'en_ligne') {
        setStep(2);
        return;
      }

      setPaying(true);
      try {
        const { data } = await api.put(`/paiements/${paiementExistant._id}/confirmer`);
        toast.success('✅ Paiement en espèces enregistré !');
        setStep(3);
        setPaiementExistant(data.paiement);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Erreur');
      } finally {
        setPaying(false);
      }
      return;
    }

    if (!montant || Number(montant) <= 0) {
      toast.error('Entrez un montant valide');
      return;
    }
    if (!methode) {
      toast.error('Choisissez une méthode de paiement');
      return;
    }

    if (methode === 'especes') {
      // Paiement en espèces — confirmer directement
      setPaying(true);
      try {
        const { data } = await api.post('/paiements/initier', {
          demandeId, montant: Number(montant), methode, notes,
        });
        // Confirmer immédiatement pour les espèces
        await api.put(`/paiements/${data.paiement._id}/confirmer`);
        toast.success('✅ Paiement en espèces enregistré !');
        setStep(3);
        setPaiementExistant({ ...data.paiement, statut: 'payé' });
      } catch (err) {
        const paiement = err.response?.data?.paiement;
        if (paiement) {
          setPaiementExistant(paiement);
          setMethode(paiement.methode);
          setMontant(paiement.montant?.toString() || montant);
          if (paiement.statut === 'payé') {
            setStep(3);
          } else if (paiement.methode === 'en_ligne') {
            setStep(2);
          }
        }
        toast.error(err.response?.data?.message || 'Erreur');
      } finally {
        setPaying(false);
      }
    } else {
      // Paiement en ligne — simuler
      setPaying(true);
      try {
        const { data } = await api.post('/paiements/initier', {
          demandeId, montant: Number(montant), methode, notes,
        });
        setPaiementExistant(data.paiement);
        setStep(2); // Aller à la simulation
      } catch (err) {
        const paiement = err.response?.data?.paiement;
        if (paiement) {
          setPaiementExistant(paiement);
          setMethode(paiement.methode);
          setMontant(paiement.montant?.toString() || montant);
          if (paiement.statut === 'payé') {
            setStep(3);
          } else {
            setStep(2);
          }
        }
        toast.error(err.response?.data?.message || 'Erreur');
      } finally {
        setPaying(false);
      }
    }
  };

  const handleSimulerPaiement = async () => {
    if (!paiementExistant?._id) {
      toast.error('Aucun paiement à confirmer');
      return;
    }

    // Simuler un délai de traitement bancaire
    setPaying(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    try {
      const { data } = await api.put(`/paiements/${paiementExistant._id}/confirmer`);
      toast.success('✅ Paiement effectué avec succès !');
      setStep(3);
      setPaiementExistant(data.paiement);
    } catch (err) {
      if (err.response?.data?.message?.includes('déjà confirmé')) {
        setStep(3);
        setPaiementExistant(prev => prev ? ({ ...prev, statut: 'payé' }) : prev);
        toast.success('✅ Paiement déjà confirmé');
        return;
      }
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setPaying(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state">
          <span className="spinner-dark" style={{ width:36, height:36, borderWidth:3 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding:'8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="dashboard-greeting">
              Paiement <span>Mission</span>
            </h1>
            <p className="dashboard-subtitle">{demande?.titre}</p>
          </div>
        </div>

        <div style={{ maxWidth:600, margin:'0 auto' }}>

          {/* Paiement déjà effectué */}
          {paiementExistant?.statut === 'payé' && step !== 3 ? (
            <div className="card" style={{ textAlign:'center', padding:'40px 32px' }}>
              <CheckCircle size={56} color="var(--success)" style={{ marginBottom:16 }} />
              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>
                Paiement déjà effectué
              </h2>
              <p style={{ color:'var(--muted)', marginBottom:24 }}>
                Cette mission a déjà été réglée
              </p>
              <div style={{
                background:'var(--success-light)', borderRadius:12,
                padding:'16px 20px', marginBottom:24, textAlign:'left',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>Référence</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{paiementExistant.reference}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>Montant</span>
                  <span style={{ fontWeight:700, color:'var(--success)' }}>
                    {paiementExistant.montant} {paiementExistant.devise}
                  </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>Méthode</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>
                    {paiementExistant.methode === 'en_ligne' ? '💳 En ligne' : '💵 Espèces'}
                  </span>
                </div>
              </div>
              <button className="btn-primary" onClick={() => navigate('/client/demandes')}>
                Retour à mes demandes
              </button>
            </div>

          ) : step === 1 ? (
            /* ── Étape 1 — Choix de la méthode ── */
            <div>
              {/* Résumé mission */}
              <div className="card" style={{ marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--accent2)' }}>
                  📋 Résumé de la mission
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--muted)', fontSize:14 }}>Mission</span>
                    <span style={{ fontWeight:600, fontSize:14 }}>{demande?.titre}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--muted)', fontSize:14 }}>Catégorie</span>
                    <span className="badge badge-accent">{demande?.categorie}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--muted)', fontSize:14 }}>Prestataire</span>
                    <span style={{ fontWeight:600, fontSize:14 }}>
                      {demande?.prestataireChoisi?.user?.prenom} {demande?.prestataireChoisi?.user?.nom}
                    </span>
                  </div>
                  {demande?.budget?.max > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ color:'var(--muted)', fontSize:14 }}>Budget convenu</span>
                      <span style={{ fontWeight:700, color:'var(--success)', fontSize:14 }}>
                        {demande.budget.min} – {demande.budget.max} MAD
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Montant */}
              <div className="card" style={{ marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--accent2)' }}>
                  💰 Montant à payer
                </h3>
                <div className="form-field">
                  <label className="form-label">Montant (MAD) *</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Ex: 500"
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    min="1"
                    style={{ fontSize:20, fontWeight:700, textAlign:'center' }}
                  />
                </div>
                {demande?.budget?.max > 0 && (
                  <div style={{ display:'flex', gap:8, marginTop:12 }}>
                    {[demande.budget.min, demande.budget.max].filter(Boolean).map(m => (
                      <button
                        key={m}
                        type="button"
                        className="btn-secondary"
                        onClick={() => setMontant(m.toString())}
                        style={{ flex:1, fontSize:13, padding:'8px' }}
                      >
                        {m} MAD
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Méthode de paiement */}
              <div className="card" style={{ marginBottom:20 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--accent2)' }}>
                  💳 Méthode de paiement
                </h3>

                {/* Paiement en ligne */}
                <div
                  onClick={() => setMethode('en_ligne')}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'16px', borderRadius:12, cursor:'pointer',
                    border: methode === 'en_ligne'
                      ? '2px solid var(--accent)'
                      : '2px solid var(--border)',
                    background: methode === 'en_ligne' ? 'var(--accent-light)' : 'var(--bg3)',
                    marginBottom:12, transition:'all var(--transition)',
                  }}
                >
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background: methode === 'en_ligne' ? 'var(--gradient)' : 'var(--border)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <CreditCard size={22} color="#fff" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:2 }}>
                      Paiement en ligne
                    </div>
                    <div style={{ fontSize:13, color:'var(--muted)' }}>
                      Simuler un paiement par carte bancaire
                    </div>
                  </div>
                  {!isEnLigne && (
                    <span className="badge badge-warning" style={{ fontSize:11 }}>
                      Service présentiel
                    </span>
                  )}
                  {methode === 'en_ligne' && (
                    <CheckCircle size={20} color="var(--accent)" />
                  )}
                </div>

                {/* Paiement en espèces */}
                <div
                  onClick={() => setMethode('especes')}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'16px', borderRadius:12, cursor:'pointer',
                    border: methode === 'especes'
                      ? '2px solid var(--success)'
                      : '2px solid var(--border)',
                    background: methode === 'especes' ? 'var(--success-light)' : 'var(--bg3)',
                    transition:'all var(--transition)',
                  }}
                >
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background: methode === 'especes' ? 'var(--success)' : 'var(--border)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Banknote size={22} color="#fff" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:2 }}>
                      Paiement en espèces
                    </div>
                    <div style={{ fontSize:13, color:'var(--muted)' }}>
                      Paiement direct au prestataire
                    </div>
                  </div>
                  {methode === 'especes' && (
                    <CheckCircle size={20} color="var(--success)" />
                  )}
                </div>

                {/* Notes */}
                <div className="form-field" style={{ marginTop:16 }}>
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Ex: Paiement effectué le 15 janvier..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ minHeight:80 }}
                  />
                </div>
              </div>

              {/* Sécurité */}
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'12px 16px', borderRadius:10,
                background:'var(--info-light)',
                border:'1px solid rgba(37,99,235,0.2)',
                marginBottom:20,
              }}>
                <Shield size={16} color="var(--info)" />
                <p style={{ fontSize:13, color:'var(--info)' }}>
                  Vos transactions sont sécurisées et enregistrées dans notre système
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={handleInitier}
                disabled={paying || !montant || !methode}
                style={{ width:'100%', padding:15 }}
              >
                {paying
                  ? <><span className="spinner" /> Traitement...</>
                  : methode === 'especes'
                  ? <><Banknote size={16} /> Confirmer le paiement en espèces</>
                  : <><CreditCard size={16} /> Procéder au paiement en ligne</>
                }
              </button>
            </div>

          ) : step === 2 ? (
            /* ── Étape 2 — Simulation paiement en ligne ── */
            <div className="card" style={{ padding:'40px 32px', textAlign:'center' }}>
              <div style={{
                width:72, height:72, borderRadius:20,
                background:'var(--gradient)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 20px',
                boxShadow:'var(--shadow-md)',
              }}>
                <CreditCard size={32} color="#fff" />
              </div>

              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>
                Simulation Paiement en Ligne
              </h2>
              <p style={{ color:'var(--muted)', marginBottom:28, fontSize:14 }}>
                Interface simulée — En production, ce serait CMI ou HPS
              </p>

              {/* Carte simulée */}
              <div style={{
                background:'var(--gradient)', borderRadius:16,
                padding:'24px', marginBottom:24, textAlign:'left',
                color:'#fff', position:'relative', overflow:'hidden',
              }}>
                <div style={{
                  position:'absolute', right:-20, top:-20,
                  width:100, height:100, borderRadius:'50%',
                  background:'rgba(255,255,255,0.1)',
                }} />
                <div style={{ fontSize:12, opacity:0.7, marginBottom:16 }}>CARTE BANCAIRE SIMULÉE</div>
                <div style={{ fontSize:20, fontWeight:700, letterSpacing:4, marginBottom:16 }}>
                  •••• •••• •••• 4242
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:10, opacity:0.7 }}>TITULAIRE</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>CLIENT TEST</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, opacity:0.7 }}>EXPIRATION</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>12/28</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, opacity:0.7 }}>MONTANT</div>
                    <div style={{ fontSize:18, fontWeight:800 }}>{paiementExistant?.montant} MAD</div>
                  </div>
                </div>
              </div>

              {/* Détails transaction */}
              <div style={{
                background:'var(--bg3)', borderRadius:12,
                padding:'16px', marginBottom:24, textAlign:'left',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>Référence</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{paiementExistant?.reference}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>Mission</span>
                  <span style={{ fontWeight:600, fontSize:13 }}>{demande?.titre}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--muted)', fontSize:13 }}>Montant total</span>
                  <span style={{ fontWeight:800, fontSize:16, color:'var(--accent2)' }}>
                    {paiementExistant?.montant} MAD
                  </span>
                </div>
              </div>

              <div style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 14px', borderRadius:8,
                background:'var(--warning-light)',
                marginBottom:24, fontSize:12, color:'var(--warning)',
              }}>
                <AlertCircle size={14} />
                Ceci est une simulation à des fins de démonstration
              </div>

              <button
                className="btn-primary"
                onClick={handleSimulerPaiement}
                disabled={paying}
                style={{ width:'100%', padding:15 }}
              >
                {paying ? (
                  <>
                    <span className="spinner" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Shield size={16} /> Confirmer le paiement simulé
                  </>
                )}
              </button>
            </div>

          ) : (
            /* ── Étape 3 — Confirmation ── */
            <div className="card" style={{ padding:'40px 32px', textAlign:'center' }}>
              <div style={{
                width:80, height:80, borderRadius:'50%',
                background:'var(--success-light)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 20px',
                border:'3px solid var(--success)',
              }}>
                <CheckCircle size={40} color="var(--success)" />
              </div>

              <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8, color:'var(--text)' }}>
                Paiement Effectué ! 🎉
              </h2>
              <p style={{ color:'var(--muted)', marginBottom:28, fontSize:14 }}>
                Votre paiement a été enregistré avec succès
              </p>

              {/* Reçu */}
              <div style={{
                background:'var(--bg3)', borderRadius:16,
                padding:'20px', marginBottom:28, textAlign:'left',
                border:'1px solid var(--border)',
              }}>
                <div style={{
                  textAlign:'center', marginBottom:16,
                  fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700,
                  color:'var(--accent2)',
                }}>
                  🧾 REÇU DE PAIEMENT
                </div>
                <div className="divider" />
                {[
                  { label:'Référence',   value: paiementExistant?.reference },
                  { label:'Mission',     value: demande?.titre },
                  { label:'Prestataire', value: `${demande?.prestataireChoisi?.user?.prenom} ${demande?.prestataireChoisi?.user?.nom}` },
                  { label:'Méthode',     value: paiementExistant?.methode === 'en_ligne' ? '💳 Paiement en ligne' : '💵 Espèces' },
                  { label:'Date',        value: formatDate(new Date()) },
                ].map((item, i) => (
                  <div key={i} style={{
                    display:'flex', justifyContent:'space-between',
                    padding:'8px 0', borderBottom:'1px dashed var(--border)',
                  }}>
                    <span style={{ color:'var(--muted)', fontSize:13 }}>{item.label}</span>
                    <span style={{ fontWeight:600, fontSize:13, maxWidth:'60%', textAlign:'right' }}>{item.value}</span>
                  </div>
                ))}
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  padding:'12px 0', marginTop:4,
                }}>
                  <span style={{ fontSize:15, fontWeight:700 }}>TOTAL PAYÉ</span>
                  <span style={{ fontSize:20, fontWeight:800, color:'var(--success)' }}>
                    {paiementExistant?.montant} MAD
                  </span>
                </div>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button
                  className="btn-secondary"
                  onClick={() => navigate('/client/demandes')}
                  style={{ flex:1 }}
                >
                  Mes demandes
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigate('/client/paiements')}
                  style={{ flex:1 }}
                >
                  Historique paiements
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Paiement;
