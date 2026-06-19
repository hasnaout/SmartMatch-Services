import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Search, ShieldCheck, UserX, UserCheck,
  Trash2, Filter, ClipboardList, X, Check,
} from 'lucide-react';

const roleConfig = {
  client:      { label: 'Client',      className: 'badge badge-accent'  },
  prestataire: { label: 'Prestataire', className: 'badge badge-warning' },
  admin:       { label: 'Admin',       className: 'badge badge-danger'  },
};

const AdminUsers = () => {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [tab,           setTab]           = useState('users');
  const [demandesSuppr, setDemandesSuppr] = useState([]);
  const [loadingSuppr,  setLoadingSuppr]  = useState(false);
  const [modalRaison,   setModalRaison]   = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    const params = roleFilter ? `?role=${roleFilter}` : '';
    api.get(`/admin/users${params}`)
      .then(({ data }) => setUsers(data.users))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  const fetchDemandesSuppr = () => {
    setLoadingSuppr(true);
    api.get('/admin/demandes-suppression')
      .then(({ data }) => setDemandesSuppr(data.users))
      .catch(() => toast.error('Erreur chargement demandes'))
      .finally(() => setLoadingSuppr(false));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);
  useEffect(() => { if (tab === 'suppressions') fetchDemandesSuppr(); }, [tab]);

  const handleAction = async (action, id) => {
    try {
      await api.put(`/admin/users/${id}/${action}`);
      toast.success('Action effectuée');
      fetchUsers();
    } catch {
      toast.error('Erreur lors de l\'action');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleValiderSuppression = async (id) => {
    try {
      await api.put(`/admin/users/${id}/valider-suppression`);
      toast.success('Compte supprimé');
      fetchDemandesSuppr();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleRefuserSuppression = async (id) => {
    try {
      await api.put(`/admin/users/${id}/refuser-suppression`);
      toast.success('Demande refusée');
      fetchDemandesSuppr();
    } catch {
      toast.error('Erreur');
    }
  };

  const filtered = users.filter((u) =>
    `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

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
            Gestion des <span>Utilisateurs</span>
          </h1>
          <p className="dashboard-subtitle">
            Validez, suspendez ou supprimez les comptes
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={tab === 'users' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13 }}
          >
            <UserCheck size={15} /> Tous les utilisateurs
          </button>
          <button
            className={tab === 'suppressions' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab('suppressions')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, position: 'relative' }}
          >
            <ClipboardList size={15} /> Demandes de suppression
            {demandesSuppr.length > 0 && tab !== 'suppressions' && (
              <span style={{
                background: '#ef4444', color: '#fff', borderRadius: 999,
                fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 4,
              }}>
                {demandesSuppr.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'users' && (
          <>
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
                      <tr key={u._id} style={u.demandeSuppressionStatut === 'en_attente' ? { background: 'rgba(239,68,68,0.05)' } : {}}>
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
                            <div>
                              <span style={{ fontWeight: 500, color: 'var(--text)', display: 'block' }}>
                                {u.prenom} {u.nom}
                              </span>
                              {u.demandeSuppressionStatut === 'en_attente' && (
                                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                                  ⚠ Demande suppression
                                </span>
                              )}
                            </div>
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
                              <button className="btn-secondary" onClick={() => handleAction('verifier', u._id)} title="Vérifier" style={{ padding: '7px 10px' }}>
                                <ShieldCheck size={14} />
                              </button>
                            )}
                            {u.isActive ? (
                              <button className="btn-secondary" onClick={() => handleAction('suspendre', u._id)} title="Suspendre" style={{ padding: '7px 10px' }}>
                                <UserX size={14} />
                              </button>
                            ) : (
                              <button className="btn-secondary" onClick={() => handleAction('activer', u._id)} title="Activer" style={{ padding: '7px 10px' }}>
                                <UserCheck size={14} />
                              </button>
                            )}
                            <button className="btn-danger" onClick={() => handleDelete(u._id)} title="Supprimer" style={{ padding: '7px 10px' }}>
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
          </>
        )}

        {tab === 'suppressions' && (
          <div className="table-wrap">
            {loadingSuppr ? (
              <div className="empty-state">
                <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : demandesSuppr.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">Aucune demande en attente  </p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Raison</th>
                    <th>Date demande</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandesSuppr.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
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
                      <td style={{ maxWidth: 240 }}>
                        <button
                          className="btn-secondary"
                          onClick={() => setModalRaison(u)}
                          style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <ClipboardList size={13} /> Voir la raison
                        </button>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>
                        {formatDate(u.demandeSuppressionDate)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-danger"
                            onClick={() => handleValiderSuppression(u._id)}
                            title="Valider — supprimer le compte"
                            style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                          >
                            <Check size={14} /> Valider
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => handleRefuserSuppression(u._id)}
                            title="Refuser la demande"
                            style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                          >
                            <X size={14} /> Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {modalRaison && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}>
            <div className="card" style={{ maxWidth: 480, width: '100%', padding: 28, position: 'relative' }}>
              <button
                onClick={() => setModalRaison(null)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)',
                }}
              >
                <X size={20} />
              </button>
              <h3 style={{ marginTop: 0, marginBottom: 4, color: 'var(--text)' }}>
                Raison de suppression
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                {modalRaison.prenom} {modalRaison.nom} — {modalRaison.email}
              </p>
              <div style={{
                background: 'var(--bg-secondary, #f8f9fa)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '14px 16px',
                fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
              }}>
                {modalRaison.demandeSuppressionRaison}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                Demande soumise le {formatDate(modalRaison.demandeSuppressionDate)}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  className="btn-danger"
                  onClick={() => { handleValiderSuppression(modalRaison._id); setModalRaison(null); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Check size={15} /> Valider la suppression
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => { handleRefuserSuppression(modalRaison._id); setModalRaison(null); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <X size={15} /> Refuser
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsers;
