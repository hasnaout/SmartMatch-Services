import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Search, ShieldCheck, UserX,
  UserCheck, Trash2, Filter,
} from 'lucide-react';

const roleConfig = {
  client:      { label: 'Client',      className: 'badge badge-accent'  },
  prestataire: { label: 'Prestataire', className: 'badge badge-warning' },
  admin:       { label: 'Admin',       className: 'badge badge-danger'  },
};

const AdminUsers = () => {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    const params = roleFilter ? `?role=${roleFilter}` : '';
    api.get(`/admin/users${params}`)
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const handleAction = async (action, id) => {
    try {
      await api.put(`/admin/users/${id}/${action}`);
      toast.success('✅ Action effectuée');
      fetchUsers();
    } catch {
      toast.error('Erreur lors de l\'action');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('✅ Utilisateur supprimé');
      fetchUsers();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const filtered = users.filter((u) =>
    `${u.nom} ${u.prenom} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
            Gestion des <span>Utilisateurs</span>
          </h1>
          <p className="dashboard-subtitle">
            Validez, suspendez ou supprimez les comptes
          </p>
        </div>

        {/* Filtres */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              className="form-input"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} style={{ color: 'var(--muted)' }} />
            {['', 'client', 'prestataire', 'admin'].map((r) => (
              <button
                key={r}
                className={roleFilter === r ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setRoleFilter(r)}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                {r === '' ? 'Tous' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Vérifié</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
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
                    <td style={{ color: 'var(--muted)' }}>{u.email}</td>
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
                    <td>
                      <span className={u.isVerified ? 'badge badge-success' : 'badge badge-muted'}>
                        {u.isVerified ? 'Vérifié' : 'En attente'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!u.isVerified && (
                          <button
                            className="btn-secondary"
                            onClick={() => handleAction('verifier', u._id)}
                            title="Vérifier"
                            style={{ padding: '7px 10px' }}
                          >
                            <ShieldCheck size={14} />
                          </button>
                        )}
                        {u.isActive ? (
                          <button
                            className="btn-secondary"
                            onClick={() => handleAction('suspendre', u._id)}
                            title="Suspendre"
                            style={{ padding: '7px 10px' }}
                          >
                            <UserX size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            onClick={() => handleAction('activer', u._id)}
                            title="Activer"
                            style={{ padding: '7px 10px' }}
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(u._id)}
                          title="Supprimer"
                          style={{ padding: '7px 10px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;