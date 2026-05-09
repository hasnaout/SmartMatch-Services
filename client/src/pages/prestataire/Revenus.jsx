import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import {
  CreditCard, Banknote, TrendingUp,
  Calendar, CheckCircle, Clock,
} from 'lucide-react';

const Revenus = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('tout');

  useEffect(() => {
    api.get('/paiements/mes-revenus')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const paiements = data?.paiements || [];

  const filtered = filter === 'tout' ? paiements
    : paiements.filter(p => p.methode === filter);

  // Stats par mois
  const parMois = paiements.reduce((acc, p) => {
    const mois = new Date(p.createdAt).toLocaleDateString('fr-FR', {
      month: 'long', year: 'numeric',
    });
    if (!acc[mois]) acc[mois] = { total: 0, count: 0 };
    acc[mois].total += p.montant;
    acc[mois].count += 1;
    return acc;
  }, {});

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-greeting prest">
            Mes <span>Revenus</span>
          </h1>
          <p className="dashboard-subtitle">
            Historique de tous vos paiements reçus
          </p>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width:36, height:36, borderWidth:3 }} />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom:28 }}>
              {[
                {
                  icon:  <TrendingUp size={22} />,
                  value: `${data?.totalRevenus || 0} MAD`,
                  label: 'Total revenus',
                  cls:   'stat-icon-prest',
                },
                {
                  icon:  <CheckCircle size={22} />,
                  value: data?.total || 0,
                  label: 'Missions payées',
                  cls:   'stat-icon-success',
                },
                {
                  icon:  <CreditCard size={22} />,
                  value: paiements.filter(p => p.methode === 'en_ligne').length,
                  label: 'Paiements en ligne',
                  cls:   'stat-icon-accent',
                },
                {
                  icon:  <Banknote size={22} />,
                  value: paiements.filter(p => p.methode === 'especes').length,
                  label: 'Paiements espèces',
                  cls:   'stat-icon-warning',
                },
              ].map((s, i) => (
                <div key={i} className="stat-card prest-card" style={{ animationDelay:`${i*0.08}s` }}>
                  <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                  <div className="stat-info">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenus par mois */}
            {Object.keys(parMois).length > 0 && (
              <div className="card" style={{ marginBottom:24 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--prest-accent)' }}>
                  📅 Revenus par mois
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {Object.entries(parMois).map(([mois, stats]) => (
                    <div key={mois} style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'12px 16px',
                      background:'var(--bg3)',
                      borderRadius:10,
                      border:'1px solid var(--border)',
                    }}>
                      <div style={{
                        width:40, height:40, borderRadius:10,
                        background:'var(--prest-light)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0,
                      }}>
                        <Calendar size={18} color="var(--prest-accent)" />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', textTransform:'capitalize' }}>
                          {mois}
                        </div>
                        <div style={{ fontSize:12, color:'var(--muted)' }}>
                          {stats.count} mission{stats.count > 1 ? 's' : ''}
                        </div>
                      </div>
                      {/* Barre de progression */}
                      <div style={{ flex:2, marginRight:12 }}>
                        <div style={{
                          height:6, borderRadius:99,
                          background:'var(--border)',
                          overflow:'hidden',
                        }}>
                          <div style={{
                            height:'100%',
                            width:`${Math.min((stats.total / (data?.totalRevenus || 1)) * 100, 100)}%`,
                            background:'var(--prest-gradient)',
                            borderRadius:99,
                            transition:'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--prest-accent)', whiteSpace:'nowrap' }}>
                        {stats.total} MAD
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filtres */}
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {[
                { val:'tout',     label:'Tous' },
                { val:'en_ligne', label:'💳 En ligne' },
                { val:'especes',  label:'💵 Espèces' },
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

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="table-wrap">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <TrendingUp size={28} />
                  </div>
                  <p className="empty-state-title">Aucun revenu</p>
                  <p className="empty-state-text">
                    Vos revenus apparaîtront ici une fois les missions payées
                  </p>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Mission</th>
                      <th>Client</th>
                      <th>Méthode</th>
                      <th>Montant</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--prest-accent)' }}>
                          {p.reference}
                        </td>
                        <td style={{ fontWeight:500, color:'var(--text)', maxWidth:180 }}>
                          <div style={{
                            overflow:'hidden', textOverflow:'ellipsis',
                            whiteSpace:'nowrap',
                          }}>
                            {p.demande?.titre}
                          </div>
                          <span className="badge badge-muted" style={{ fontSize:10, marginTop:2 }}>
                            {p.demande?.categorie}
                          </span>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{
                              width:28, height:28, borderRadius:'50%',
                              background:'var(--client-gradient)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:11, fontWeight:700, color:'#fff', flexShrink:0,
                            }}>
                              {p.client?.prenom?.[0]}{p.client?.nom?.[0]}
                            </div>
                            <span style={{ fontSize:13, color:'var(--text)' }}>
                              {p.client?.prenom} {p.client?.nom}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                            {p.methode === 'en_ligne'
                              ? <><CreditCard size={13} color="var(--accent)" /> En ligne</>
                              : <><Banknote size={13} color="var(--success)" /> Espèces</>
                            }
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize:16, fontWeight:800, color:'var(--success)' }}>
                            +{p.montant} MAD
                          </span>
                        </td>
                        <td style={{ color:'var(--muted)', fontSize:13 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <Clock size={12} />
                            {formatDate(p.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total en bas */}
                <div style={{
                  padding:'16px 20px',
                  borderTop:'2px solid var(--border)',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background:'var(--bg3)',
                }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--muted)' }}>
                    Total affiché ({filtered.length} paiement{filtered.length > 1 ? 's' : ''})
                  </span>
                  <span style={{ fontSize:20, fontWeight:800, color:'var(--success)' }}>
                    {filtered.reduce((s, p) => s + p.montant, 0)} MAD
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Revenus;