import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';

import { PlusCircle, MapPin, Calendar, XCircle, Star } from 'lucide-react';

const statusConfig = {
  publiée:  { label: 'Publiée',  className: 'badge badge-accent'  },
  en_cours: { label: 'En cours', className: 'badge badge-warning' },
  terminée: { label: 'Terminée', className: 'badge badge-success' },
  annulée:  { label: 'Annulée',  className: 'badge badge-danger'  },
};

const urgenceConfig = {
  faible:  { label: 'Faible',  className: 'badge badge-muted'   },
  normale: { label: 'Normale', className: 'badge badge-warning' },
  urgente: { label: 'Urgente', className: 'badge badge-danger'  },
};

// ── Modal Avis ──
const ModalAvis = ({ demande, onClose, onSuccess }) => {
  const [note,        setNote]        = useState(0);
  const [hover,       setHover]       = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async () => {
    if (note === 0) { toast.error('Veuillez choisir une note'); return; }
    setLoading(true);
    try {
      await api.post('/avis', {
        prestataireId: demande.prestataireChoisi?._id || demande.prestataireChoisi,
        demandeId:     demande._id,
        note,
        commentaire,
      });
      toast.success('Avis publié !');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, marginBottom:6, color:'var(--text)' }}>
          Noter la prestation
        </h3>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>
          {demande.titre}
        </p>

        {/* Étoiles */}
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:10 }}>
            Votre note *
          </p>
          <div className="star-selector">
            {[1,2,3,4,5].map((s) => (
              <button
                key={s}
                type="button"
                className={s <= (hover || note) ? 'filled' : ''}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setNote(s)}
              >
                ★
              </button>
            ))}
          </div>
          {note > 0 && (
            <p style={{ fontSize:13, color:'var(--warning)', marginTop:8, fontWeight:500 }}>
              {['','Mauvais','Passable','Bien','Très bien','Excellent'][note]}
            </p>
          )}
        </div>

        {/* Commentaire */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:8 }}>
            Commentaire (optionnel)
          </p>
          <textarea
            className="form-textarea"
            placeholder="Décrivez votre expérience avec ce prestataire..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            style={{ minHeight:100 }}
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex:1 }}>
            Annuler
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || note === 0}
            style={{ flex:1 }}
          >
            {loading ? <><span className="spinner" /> Envoi...</> : <><Star size={15} /> Publier</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
  backdropFilter:'blur(4px)',
  display:'flex', alignItems:'center', justifyContent:'center',
  zIndex:300, padding:16, animation:'fadeIn 0.2s ease-out',
};
const modal = {
  background:'var(--bg2)', border:'1px solid var(--border)',
  borderRadius:'var(--radius-xl)', padding:'32px',
  width:'100%', maxWidth:440,
  boxShadow:'var(--shadow-lg)', animation:'fadeUp 0.3s ease-out',
};

const MesDemandes = () => {
  const [demandes,     setDemandes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('');
  const [avisDemandeId, setAvisDemandeId] = useState(null);
  const [avisExistants, setAvisExistants] = useState([]);

  const fetchDemandes = () => {
    setLoading(true);
    api.get('/demandes/mes-demandes')
      .then(({ data }) => setDemandes(data.demandes))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  const fetchMesAvis = () => {
    api.get('/avis/mes-avis')
      .then(({ data }) => setAvisExistants(data.avis.map(a => a.demande?._id || a.demande)))
      .catch(() => {});
  };

  useEffect(() => { fetchDemandes(); fetchMesAvis(); }, []);

  const handleAnnuler = async (id) => {
    if (!window.confirm('Annuler cette demande ?')) return;
    try {
      await api.put(`/demandes/${id}/statut`, { statut: 'annulée' });
      toast.success('Demande annulée');
      fetchDemandes();
    } catch { toast.error('Erreur annulation'); }
  };

  const demandeANoter = demandes.find(d => d._id === avisDemandeId);
  const filtered = filter ? demandes.filter(d => d.statut === filter) : demandes;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">Mes <span>Demandes</span></h1>
          <p className="dashboard-subtitle">Suivez l'état de toutes vos demandes</p>
        </div>

        {/* Filtres */}
        <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { val:'',         label:'Toutes'    },
              { val:'publiée',  label:'Publiées'  },
              { val:'en_cours', label:'En cours'  },
              { val:'terminée', label:'Terminées' },
              { val:'annulée',  label:'Annulées'  },
            ].map(f => (
              <button
                key={f.val}
                className={filter === f.val ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setFilter(f.val)}
                style={{ padding:'8px 16px', fontSize:13 }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Link to="/client/creer" className="btn-primary">
            <PlusCircle size={15} /> Nouvelle demande
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width:32, height:32, borderWidth:3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon"><PlusCircle size={28} /></div>
              <p className="empty-state-title">Aucune demande</p>
              <p className="empty-state-text">Créez votre première demande</p>
              <Link to="/client/creer" className="btn-primary">
                <PlusCircle size={15} /> Créer une demande
              </Link>
            </div>
          </div>
        ) : (
          <div className="demandes-grid">
            {filtered.map((d, i) => {
              const s = statusConfig[d.statut]   || statusConfig['publiée'];
              const u = urgenceConfig[d.urgence] || urgenceConfig['normale'];
              const dejaNote = avisExistants.includes(d._id);
              return (
                <div key={d._id} className="demande-card client-style" style={{ animationDelay:`${i*0.06}s` }}>
                  <div className="demande-card-header">
                    <div>
                      <div className="demande-card-title">{d.titre}</div>
                      <div className="demande-card-cat">{d.categorie}</div>
                    </div>
                    <div className="demande-card-badges">
                      <span className={s.className}>{s.label}</span>
                      <span className={u.className}>{u.label}</span>
                    </div>
                  </div>

                  <p className="demande-card-body">{d.description}</p>

                  {(d.budget?.min > 0 || d.budget?.max > 0) && (
                    <div className="demande-budget">
                      Budget : {d.budget.min} - {d.budget.max} {d.budget.devise}
                    </div>
                  )}

                  <div className="demande-card-footer">
                    <div className="demande-card-meta-row">
                      <div className="demande-card-meta">
                        <MapPin size={12} /> {d.localisation?.ville || 'Non précisé'}
                      </div>
                      <div className="demande-card-meta">
                        <Calendar size={12} /> {formatDate(d.createdAt)}
                      </div>
                    </div>
                    <div className="demande-card-actions">
                      {d.statut === 'terminée' && d.prestataireChoisi && !dejaNote && (
                        <button
                          className="btn-success"
                          onClick={() => setAvisDemandeId(d._id)}
                          style={{ padding:'6px 12px', fontSize:12 }}
                        >
                          <Star size={13} /> Noter
                        </button>
                      )}
                      {d.statut === 'terminée' && dejaNote && (
                        <span className="badge badge-success">
                          <Star size={11} style={{ marginRight:4 }} /> Noté
                        </span>
                      )}
                      {d.statut === 'publiée' && (
                        <button
                          className="btn-danger"
                          onClick={() => handleAnnuler(d._id)}
                          style={{ padding:'6px 12px', fontSize:12 }}
                        >
                          <XCircle size={13} /> Annuler
                        </button>
                      )}
                      <Link
  to={`/client/demandes/${d._id}`}
  className="btn-secondary"
  style={{ padding:'6px 12px', fontSize:12 }}
>
  Voir détails
</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal avis */}
      {avisDemandeId && demandeANoter && (
        <ModalAvis
          demande={demandeANoter}
          onClose={() => setAvisDemandeId(null)}
          onSuccess={() => { fetchMesAvis(); fetchDemandes(); }}
        />
      )}
    </div>
  );
};

export default MesDemandes;
