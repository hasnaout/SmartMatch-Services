import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Filter, MessageCircle } from 'lucide-react';

const urgenceConfig = {
  faible:  { label: '🟢 Faible',  className: 'badge badge-muted'   },
  normale: { label: '🟡 Normale', className: 'badge badge-warning' },
  urgente: { label: '🔴 Urgente', className: 'badge badge-danger'  },
};

const DemandesPrestataire = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  useEffect(() => {
    api.get('/demandes/disponibles')
      .then(({ data }) => setDemandes(data.demandes))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? demandes.filter((d) => d.urgence === filter)
    : demandes;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Missions <span>Disponibles</span>
          </h1>
          <p className="dashboard-subtitle">
            Demandes correspondant à vos catégories de service
          </p>
        </div>

        {/* Filtres urgence */}
<div style={{
  display: 'flex',
  gap: 8,
  marginBottom: 28,
  alignItems: 'center',
  flexWrap: 'wrap',
}}>
  <Filter size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
    {[
      { val: '',        label: 'Toutes'      },
      { val: 'faible',  label: '🟢 Faible'  },
      { val: 'normale', label: '🟡 Normale' },
      { val: 'urgente', label: '🔴 Urgente' },
    ].map(f => (
      <button
        key={f.val}
        className={filter === f.val ? 'btn-primary' : 'btn-secondary'}
        onClick={() => setFilter(f.val)}
        style={{ padding: '8px 14px', fontSize: 13 }}
      >
        {f.label}
      </button>
    ))}
  </div>
</div>

        {loading ? (
          <div className="empty-state">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageCircle size={28} />
              </div>
              <p className="empty-state-title">Aucune mission disponible</p>
              <p className="empty-state-text">
                Mettez à jour votre profil avec vos catégories de service
              </p>
            </div>
          </div>
        ) : (
          <div className="demandes-grid">
            {filtered.map((d, i) => {
              const u = urgenceConfig[d.urgence] || urgenceConfig['normale'];
              return (
                <div
                  key={d._id}
                  className="demande-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="demande-card-header">
                    <div>
                      <div className="demande-card-title">{d.titre}</div>
                      <div className="demande-card-cat">{d.categorie}</div>
                    </div>
                    <span className={u.className}>{u.label}</span>
                  </div>

                  <p className="demande-card-body">{d.description}</p>

                  {(d.budget?.min > 0 || d.budget?.max > 0) && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
                      💰 {d.budget.min} – {d.budget.max} {d.budget.devise}
                    </div>
                  )}

                  {/* Client info */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: 'var(--bg3)',
                    borderRadius: 10, marginBottom: 14,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {d.client?.prenom?.[0]}{d.client?.nom?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
                        {d.client?.prenom} {d.client?.nom}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {d.client?.email}
                      </div>
                    </div>
                  </div>

                  <div className="demande-card-footer">
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div className="demande-card-meta">
                        <MapPin size={12} />
                        {d.localisation?.ville || 'Non précisé'}
                      </div>
                      <div className="demande-card-meta">
                        <Calendar size={12} />
                        {formatDate(d.createdAt)}
                      </div>
                      <Link
  to={`/prestataire/missions/${d._id}`}
  className="btn-secondary"
  style={{ padding:'6px 14px', fontSize:12 }}
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
    </div>
  );
};

export default DemandesPrestataire;