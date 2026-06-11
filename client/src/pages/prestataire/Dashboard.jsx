import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import {
  FileText, CheckCircle,
  Star, MapPin, Calendar, Settings,TrendingUp
} from 'lucide-react';

const statusConfig = {
  publiée:  { label: 'Publiée',  className: 'badge badge-accent'  },
  en_cours: { label: 'En cours', className: 'badge badge-warning' },
  terminée: { label: 'Terminée', className: 'badge badge-success' },
  annulée:  { label: 'Annulée',  className: 'badge badge-danger'  },
};


const PrestataireDashboard = () => {
  const { user } = useAuth();
  const [profil,   setProfil]   = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [revenus, setRevenus] = useState(0);

useEffect(() => {
  Promise.all([
    api.get('/prestataires/moi'),
    api.get('/demandes/disponibles'),
    api.get('/paiements/mes-revenus'),
  ])
    .then(([p, d, r]) => {
      setProfil(p.data.prestataire);
      setDemandes(d.data.demandes);
      setRevenus(r.data.totalRevenus || 0);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Bonjour, <span>{user?.prenom}</span>
          </h1>
          <p className="dashboard-subtitle">
            Voici les missions disponibles correspondant à votre profil
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid prestataire-stats-grid">
          {[
            {
              icon: <FileText size={22} />,
              value: demandes.length,
              label: 'Missions disponibles',
              cls: 'stat-icon-accent',
            },
            {
              icon: <CheckCircle size={22} />,
              value: profil?.nombreMissionsReussies || 0,
              label: 'Missions réussies',
              cls: 'stat-icon-success',
            },
            {
              icon: <Star size={22} />,
              value: profil?.notemoyenne
                ? `${profil.notemoyenne}/5`
                : 'N/A',
              label: 'Note moyenne',
              cls: 'stat-icon-warning',
            },
            {
            icon:  <TrendingUp size={22} />,
             value: `${revenus} MAD`,
            label: 'Total revenus',
            cls:   'stat-icon-prest',
            },
          ].map((s, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Missions disponibles */}
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Missions disponibles</h2>
              <p className="section-subtitle">
                Demandes correspondant à vos catégories de service
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <span
                className="spinner"
                style={{ width: 32, height: 32, borderWidth: 3 }}
              />
            </div>
          ) : demandes.length === 0 ? (
            <div className="table-wrap">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText size={28} />
                </div>
                <p className="empty-state-title">
                  Aucune mission disponible
                </p>
                <p className="empty-state-text">
                  Mettez à jour votre profil avec vos catégories de service
                </p>
                <Link to="/prestataire/profil" className="btn-primary">
                  <Settings size={15} /> Mettre à jour le profil
                </Link>
              </div>
            </div>
          ) : (
            <div className="demandes-grid">
              {demandes.map((d, i) => {
                const s = statusConfig[d.statut]   || statusConfig['publiée'];
                return (
                  <div
                    key={d._id}
                    className="demande-card prest-style"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="demande-card-header">
                      <div>
                        <div className="demande-card-title">{d.titre}</div>
                        <div className="demande-card-cat">{d.categorie}</div>
                      </div>
                      <div className="demande-card-badges">
  <span className={s.className}>{s.label}</span>
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
                          <MapPin size={12} />
                          {d.localisation?.ville || 'Non précisé'}
                        </div>
                        <div className="demande-card-meta">
                          <Calendar size={12} />
                          {formatDate(d.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>  
  );
};

export default PrestataireDashboard;
