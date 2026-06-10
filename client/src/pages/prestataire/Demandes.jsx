import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, MessageCircle } from 'lucide-react';


const DemandesPrestataire = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/demandes/disponibles')
      .then(({ data }) => setDemandes(data.demandes))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = demandes;

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
                  </div>

                  <p className="demande-card-body">{d.description}</p>

                  {(d.budget?.min > 0 || d.budget?.max > 0) && (
                    <div className="demande-budget">
                      Budget : {d.budget.min} - {d.budget.max} {d.budget.devise}
                    </div>
                  )}

                  {/* Client info */}
                  <div className="client-info-card">
                    <div className="client-avatar">
                      {d.client?.prenom?.[0]}{d.client?.nom?.[0]}
                    </div>
                    <div className="client-info-details">
                      <div className="client-info-name">
                        {d.client?.prenom} {d.client?.nom}
                      </div>
                      <div className="client-info-email">
                        {d.client?.email}
                      </div>
                    </div>
                  </div>

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
                    <div className="demande-card-actions">
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
