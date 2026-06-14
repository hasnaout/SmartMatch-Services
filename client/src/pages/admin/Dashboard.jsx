import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import {
  Users, FileText, CheckCircle,
  Star, ShieldCheck, TrendingUp,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users?limit=5'),
    ])
      .then(([s, u]) => {
        setStats(s.data);
        setUsers(u.data.users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const roleConfig = {
    client:      { label: 'Client',      className: 'badge badge-accent'   },
    prestataire: { label: 'Prestataire', className: 'badge badge-warning'  },
    admin:       { label: 'Admin',       className: 'badge badge-danger'   },
  };

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
            Dashboard <span>Admin</span>
          </h1>
          <p className="dashboard-subtitle">
            Vue d'ensemble de la plateforme SmartMatch
          </p>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : (
          <>

            <div className="stats-grid prestataire-stats-grid">
              {[
                { icon: <Users size={22} />,       value: stats?.users?.total        || 0, label: 'Utilisateurs',         cls: 'stat-icon-accent'  },
                { icon: <ShieldCheck size={22} />, value: stats?.users?.clients      || 0, label: 'Clients',              cls: 'stat-icon-success' },
                { icon: <TrendingUp size={22} />,  value: stats?.users?.prestataires || 0, label: 'Prestataires',         cls: 'stat-icon-warning' },
                { icon: <FileText size={22} />,    value: stats?.demandes?.total     || 0, label: 'Demandes total',       cls: 'stat-icon-accent'  },
                { icon: <CheckCircle size={22} />, value: stats?.demandes?.terminees || 0, label: 'Demandes terminées',   cls: 'stat-icon-success' },
                { icon: <Star size={22} />,        value: stats?.avis?.total         || 0, label: 'Avis publiés',         cls: 'stat-icon-warning' },
              ].map((s, i) => (
                <div key={i} className="stat-card prest-card" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                  <div className="stat-info">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>


            <div>
              <div className="section-header">
                <div>
                  <h2 className="section-title">Derniers utilisateurs</h2>
                  <p className="section-subtitle">Les 5 derniers comptes créés</p>
                </div>
                <Link to="/admin/users" className="btn-secondary">
                  Voir tous les utilisateurs
                </Link>
              </div>

              <div className="table-wrap">
                {users.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={28} /></div>
                    <p className="empty-state-title">Aucun utilisateur</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                              }}>
                                {u.prenom?.[0]}{u.nom?.[0]}
                              </div>
                              <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                                {u.prenom} {u.nom}
                              </span>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={roleConfig[u.role]?.className || 'badge badge-muted'}>
                              {roleConfig[u.role]?.label || u.role}
                            </span>
                          </td>
                          <td>
                            <span className={u.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                              {u.isActive ? 'Actif' : 'Suspendu'}
                            </span>
                          </td>
                          <td>{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
