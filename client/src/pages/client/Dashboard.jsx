import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import {
  FileText, PlusCircle, Clock, CheckCircle,
  XCircle, Users, MapPin, Calendar,
} from 'lucide-react';

const statusConfig = {
  publiée:    { label: 'Publiée',    className: 'badge badge-accent'   },
  en_cours:   { label: 'En cours',   className: 'badge badge-warning'  },
  terminée:   { label: 'Terminée',   className: 'badge badge-success'  },
  annulée:    { label: 'Annulée',    className: 'badge badge-danger'   },
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/demandes/mes-demandes')
      .then(({ data }) => setDemandes(data.demandes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:    demandes.length,
    enCours:  demandes.filter(d => d.statut === 'en_cours').length,
    terminees:demandes.filter(d => d.statut === 'terminée').length,
    publiees: demandes.filter(d => d.statut === 'publiée').length,
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Bonjour, <span>{user?.prenom}</span> 👋
          </h1>
          <p className="dashboard-subtitle">
            Voici un aperçu de vos demandes de service
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: <FileText size={22} />, value: stats.total,     label: 'Total demandes',  cls: 'stat-icon-accent'  },
            { icon: <Clock size={22} />,    value: stats.publiees,  label: 'En attente',      cls: 'stat-icon-warning' },
            { icon: <CheckCircle size={22}/>,value: stats.terminees,label: 'Terminées',        cls: 'stat-icon-success' },
            { icon: <XCircle size={22} />,  value: stats.enCours,   label: 'En cours',        cls: 'stat-icon-danger'  },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Section demandes */}
        <div>
          <div className="section-header">
            <div>
              <h2 className="section-title">Mes dernières demandes</h2>
              <p className="section-subtitle">Suivez l'état de vos demandes en temps réel</p>
            </div>
            <Link to="/client/creer" className="btn-primary">
              <PlusCircle size={16} /> Nouvelle demande
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : demandes.length === 0 ? (
            <div className="table-wrap">
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={28} /></div>
                <p className="empty-state-title">Aucune demande pour l'instant</p>
                <p className="empty-state-text">Créez votre première demande pour trouver un prestataire</p>
                <Link to="/client/creer" className="btn-primary">
                  <PlusCircle size={15} /> Créer une demande
                </Link>
              </div>
            </div>
          ) : (
            <div className="demandes-grid">
              {demandes.slice(0, 6).map((d, i) => {
                const s = statusConfig[d.statut] || statusConfig['publiée'];
                return (
                  <div key={d._id} className="demande-card" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="demande-card-header">
                      <div>
                        <div className="demande-card-title">{d.titre}</div>
                        <div className="demande-card-cat">{d.categorie}</div>
                      </div>
                      <span className={s.className}>{s.label}</span>
                    </div>
                    <p className="demande-card-body">{d.description}</p>
                    <div className="demande-card-footer">
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;