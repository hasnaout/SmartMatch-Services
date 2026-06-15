import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CreditCard, Banknote, CheckCircle,
   Shield, AlertCircle, ClipboardList, Wallet, Receipt
} from 'lucide-react';
import { CATEGORIES_EN_LIGNE } from '../../utils/paiementHelper';


import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';


const StripeCheckoutForm = ({ paiement, onSuccess, onError }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,       setPaying]       = useState(false);
  const [stripeReady,  setStripeReady]  = useState(false);

  useEffect(() => {
    if (stripe) setStripeReady(true);
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError('Stripe non chargé — désactivez votre extension de sécurité ou testez en navigation privée.');
      return;
    }
    setPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paiement.stripeClientSecret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );
      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        onError(`Paiement incomplet (statut: ${paymentIntent.status})`);
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (!stripeReady && !stripe) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <span className="spinner-dark" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block', marginBottom: 16 }} />
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
          Chargement de Stripe en cours...
        </p>
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'var(--warning-light)', fontSize: 12, color: 'var(--warning)',
          textAlign: 'left',
        }}>
          <strong>Si le bouton ne s'affiche pas :</strong><br />
          Désactivez votre extension de sécurité (Trend Micro, Malwarebytes…)<br />
          ou testez en <strong>navigation privée</strong> (Ctrl+Shift+N).
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: 'var(--gradient)', borderRadius: 16,
        padding: '24px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>CARTE BANCAIRE — STRIPE TEST</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, marginBottom: 16 }}>
          •••• •••• •••• ????
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>MONTANT</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{paiement?.montant} MAD</div>
          </div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>RÉFÉRENCE</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{paiement?.reference}</div>
          </div>
        </div>
      </div>

      <div style={{
        border: '2px solid var(--border)', borderRadius: 12,
        padding: '16px', marginBottom: 16,
        background: 'var(--bg3)',
      }}>
        <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 10 }}>
          Numéro de carte (test : 4242 4242 4242 4242)
        </label>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#000',
              '::placeholder': { color: '#aaa' },
            },
          },
        }} />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 8,
        background: 'var(--info-light)', marginBottom: 20,
        fontSize: 12, color: 'var(--info)',
      }}>
        <AlertCircle size={14} />
        Mode test — carte : 4242 4242 4242 4242 · exp 12/28 · CVV 123
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={!stripe || paying}
        style={{ width: '100%', padding: 15 }}
      >
        {paying
          ? <><span className="spinner" /> Traitement Stripe...</>
          : <><Shield size={16} /> Payer {paiement?.montant} MAD via Stripe</>
        }
      </button>
    </form>
  );
};


const Paiement = () => {
  const { demandeId } = useParams();
  const navigate      = useNavigate();

  const [demande,           setDemande]           = useState(null);
  const [paiementExistant,  setPaiementExistant]  = useState(null);
  const [stripeData,        setStripeData]         = useState(null);
  const [stripePromise,     setStripePromise]      = useState(null);
  const [montant,           setMontant]            = useState('');
  const [methode,           setMethode]            = useState('');
  const [notes,             setNotes]              = useState('');
  const [loading,           setLoading]            = useState(true);
  const [paying,            setPaying]             = useState(false);
  const [step,              setStep]               = useState(1);

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
          if (p.data.paiement.statut === 'payé') setStep(3);
        }
        if (!p.data.paiement && d.data.demande.budget?.max > 0) {
          setMontant(d.data.demande.budget.max.toString());
        }
      })
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, [demandeId]);

  const handleInitier = async () => {
    if (!montant || Number(montant) <= 0) { toast.error('Entrez un montant valide'); return; }
    if (!methode) { toast.error('Choisissez une méthode de paiement'); return; }

    setPaying(true);
    try {
      const { data } = await api.post('/paiements/initier', {
        demandeId, montant: Number(montant), methode, notes,
      });

      setPaiementExistant(data.paiement);


      if (methode === 'en_ligne' && data.stripeClientSecret) {
        const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || data.stripePublishableKey;
        if (!pubKey) {
          toast.error('Clé Stripe publique manquante — vérifiez votre configuration');
          return;
        }
        // Ne pas await loadStripe — passer la Promise directement à Elements
        setStripePromise(loadStripe(pubKey));
        setStripeData({
          clientSecret: data.stripeClientSecret,
          montant:      data.paiement.montant,
          reference:    data.paiement.reference,
        });
      }


      if (methode === 'especes') {
        await api.put(`/paiements/${data.paiement._id}/confirmer`);
        toast.success('Paiement en espèces enregistré !');
        setStep(3);
        setPaiementExistant({ ...data.paiement, statut: 'payé' });
        return;
      }

      setStep(2);
    } catch (err) {
      const p = err.response?.data?.paiement;
      if (p) { setPaiementExistant(p); setStep(p.statut === 'payé' ? 3 : 2); }
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setPaying(false);
    }
  };


  const handlePaiementSuccess = async () => {
    try {
      const { data } = await api.put(`/paiements/${paiementExistant._id}/confirmer`);
      toast.success('Paiement effectué avec succès !');
      setStep(3);
      setPaiementExistant(data.paiement);
    } catch (err) {
      if (err.response?.data?.message?.includes('déjà confirmé')) {
        setStep(3);
        return;
      }
      toast.error(err.response?.data?.message || 'Erreur confirmation');
    }
  };


  const handleSimulerPaiement = async () => {
    setPaying(true);
    await new Promise(r => setTimeout(r, 2000));
    await handlePaiementSuccess();
    setPaying(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state">
          <span className="spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">


        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="dashboard-greeting">Paiement <span>Mission</span></h1>
            <p className="dashboard-subtitle">{demande?.titre}</p>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto' }}>


          {paiementExistant?.statut === 'payé' && step !== 3 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
              <CheckCircle size={56} color="var(--success)" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Paiement déjà effectué</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Cette mission a déjà été réglée</p>
              <button className="btn-primary" onClick={() => navigate('/client/demandes')}>
                Retour à mes demandes
              </button>
            </div>

          ) : step === 1 ? (

            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--accent2)' }}>
                  <ClipboardList size={16} /> Résumé de la mission
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Mission',     value: demande?.titre },
                    { label: 'Catégorie',   value: <span className="badge badge-accent">{demande?.categorie}</span> },
                    { label: 'Prestataire', value: `${demande?.prestataireChoisi?.user?.prenom} ${demande?.prestataireChoisi?.user?.nom}` },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>{item.label}</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</span>
                    </div>
                  ))}
                  {demande?.budget?.max > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>Budget convenu</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>
                        {demande.budget.min} – {demande.budget.max} MAD
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--accent2)' }}>
                  <Wallet size={16} /> Montant à payer
                </h3>
                <input
                  className="form-input"
                  type="number" placeholder="Ex: 500"
                  value={montant} onChange={e => setMontant(e.target.value)} min="1"
                  style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}
                />
                {demande?.budget?.max > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[demande.budget.min, demande.budget.max].filter(Boolean).map(m => (
                      <button key={m} type="button" className="btn-secondary"
                        onClick={() => setMontant(m.toString())}
                        style={{ flex: 1, fontSize: 13, padding: '8px' }}>
                        {m} MAD
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--accent2)' }}>
                  <CreditCard size={16} /> Méthode de paiement
                </h3>


                <div onClick={() => setMethode('en_ligne')} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px', borderRadius: 12, cursor: 'pointer', marginBottom: 12,
                  border: methode === 'en_ligne' ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: methode === 'en_ligne' ? 'var(--accent-light)' : 'var(--bg3)',
                  transition: 'all var(--transition)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: methode === 'en_ligne' ? 'var(--gradient)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CreditCard size={22} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Paiement en ligne</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                      Carte bancaire sécurisée via Stripe
                    </div>
                  </div>
                  {methode === 'en_ligne' && <CheckCircle size={20} color="var(--accent)" />}
                </div>


                <div onClick={() => setMethode('especes')} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px', borderRadius: 12, cursor: 'pointer',
                  border: methode === 'especes' ? '2px solid var(--success)' : '2px solid var(--border)',
                  background: methode === 'especes' ? 'var(--success-light)' : 'var(--bg3)',
                  transition: 'all var(--transition)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: methode === 'especes' ? 'var(--success)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Banknote size={22} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Paiement en espèces</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>Paiement direct au prestataire</div>
                  </div>
                  {methode === 'especes' && <CheckCircle size={20} color="var(--success)" />}
                </div>

                <div className="form-field" style={{ marginTop: 16 }}>
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea className="form-textarea" placeholder="Ex: Paiement effectué le 15 janvier..."
                    value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 80 }} />
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--info-light)', border: '1px solid rgba(37,99,235,0.2)', marginBottom: 20,
              }}>
                <Shield size={16} color="var(--info)" />
                <p style={{ fontSize: 13, color: 'var(--info)' }}>
                  Paiement en ligne sécurisé par Stripe — standard bancaire mondial
                </p>
              </div>

              <button className="btn-primary" onClick={handleInitier}
                disabled={paying || !montant || !methode} style={{ width: '100%', padding: 15 }}>
                {paying
                  ? <><span className="spinner" /> Traitement...</>
                  : methode === 'especes'
                  ? <><Banknote size={16} /> Confirmer le paiement en espèces</>
                  : <><CreditCard size={16} /> Procéder au paiement en ligne</>
                }
              </button>
            </div>

          ) : step === 2 ? (

            <div className="card" style={{ padding: '40px 32px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, background: 'var(--gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: 'var(--shadow-md)',
              }}>
                <CreditCard size={32} color="#fff" />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                {stripeData ? 'Paiement Stripe sécurisé' : 'Simulation Paiement en Ligne'}
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14, textAlign: 'center' }}>
                {stripeData
                  ? 'Entrez vos informations de carte bancaire'
                  : 'Interface simulée — En production : CMI ou Stripe'}
              </p>


              {stripeData && stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripeCheckoutForm
                    paiement={{ ...paiementExistant, stripeClientSecret: stripeData.clientSecret }}
                    onSuccess={handlePaiementSuccess}
                    onError={(msg) => toast.error(msg)}
                  />
                </Elements>
              ) : (

                <>
                  <div style={{
                    background: 'var(--gradient)', borderRadius: 16, padding: '24px',
                    marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', right: -20, top: -20, width: 100, height: 100,
                      borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                    }} />
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>CARTE BANCAIRE SIMULÉE</div>
                    <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, marginBottom: 16 }}>
                      •••• •••• •••• 4242
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>MONTANT</div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{paiementExistant?.montant} MAD</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>RÉFÉRENCE</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{paiementExistant?.reference}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                    borderRadius: 8, background: 'var(--warning-light)',
                    marginBottom: 24, fontSize: 12, color: 'var(--warning)',
                  }}>
                    <AlertCircle size={14} />
                    Ceci est une simulation — configurez STRIPE_SECRET_KEY pour activer le vrai paiement
                  </div>

                  <button className="btn-primary" onClick={handleSimulerPaiement}
                    disabled={paying} style={{ width: '100%', padding: 15 }}>
                    {paying
                      ? <><span className="spinner" /> Traitement en cours...</>
                      : <><Shield size={16} /> Confirmer le paiement simulé</>
                    }
                  </button>
                </>
              )}
            </div>

          ) : (

            <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--success-light)', border: '3px solid var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <CheckCircle size={40} color="var(--success)" />
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Paiement effectué   </h2>
              <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 14 }}>
                Votre paiement a été enregistré avec succès
              </p>

              <div style={{
                background: 'var(--bg3)', borderRadius: 16, padding: '20px',
                marginBottom: 28, textAlign: 'left', border: '1px solid var(--border)',
              }}>
                <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 16, fontWeight: 700, color: 'var(--accent2)' }}>
                  <Receipt size={16} /> REÇU DE PAIEMENT
                </div>
                <div className="divider" />
                {[
                  { label: 'Référence',   value: paiementExistant?.reference },
                  { label: 'Mission',     value: demande?.titre },
                  { label: 'Prestataire', value: `${demande?.prestataireChoisi?.user?.prenom} ${demande?.prestataireChoisi?.user?.nom}` },
                  { label: 'Méthode',     value: paiementExistant?.methode === 'en_ligne' ? 'Carte bancaire (Stripe)' : 'Espèces' },
                  { label: 'Date',        value: formatDate(new Date()) },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px dashed var(--border)',
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>TOTAL PAYÉ</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                    {paiementExistant?.montant} MAD
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary" onClick={() => navigate('/client/demandes')} style={{ flex: 1 }}>
                  Mes demandes
                </button>
                <button className="btn-primary" onClick={() => navigate('/client/paiements')} style={{ flex: 1 }}>
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
