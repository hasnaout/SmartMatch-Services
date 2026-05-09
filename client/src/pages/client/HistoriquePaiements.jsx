import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import { CreditCard, Banknote, CheckCircle, Clock, Calendar } from 'lucide-react';

const HistoriquePaiements = () => {
  const [paiements, setPaiements] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [stats,     setStats]     = useState({ total:0, totalMontant:0, enAttente:0 });

  useEffect(() => {
    api.get('/paiements/mes-paiements')
      .then(({ data }) => {
        setPaiements(data.paiements);
        setStats({
          total:        data.total,
          totalMontant: data.paiements.filter(p => p.statut === 'payé').reduce((s, p) => s + p.montant, 0),
          enAttente:    data.paiements.filter(p => p.statut === 'en_attente').length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Historique <span>Paiements</span>
          </h1>
          <p className="dashboard-subtitle">Suivez tous vos paiements effectués</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom:28 }}>
          {[
            { icon:<CreditCard size={22}/>, value:stats.total, label:'Total paiements', cls:'stat-icon-accent' },
            { icon:<CheckCircle size={22}/>, value:`${stats.totalMontant} MAD`, label:'Total payé', cls:'stat-icon-success' },
            { icon:<Clock size={22}/>, value:stats.enAttente, label:'En attente', cls:'stat-icon-warning' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width:32, height:32, borderWidth:3 }} />
          </div>
        ) : paiements.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard size={28} /></div>
              <p className="empty-state-title">Aucun paiement</p>
              <p className="empty-state-text">Vos paiements apparaîtront ici</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Mission</th>
                  <th>Prestataire</th>
                  <th>Méthode</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent2)' }}>
                      {p.reference}
                    </td>
                    <td style={{ fontWeight:500, color:'var(--text)' }}>
                      {p.demande?.titre}
                    </td>
                    <td>
                      {p.prestataire?.user?.prenom} {p.prestataire?.user?.nom}
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {p.methode === 'en_ligne'
                          ? <><CreditCard size={13} color="var(--accent)" /> En ligne</>
                          : <><Banknote size={13} color="var(--success)" /> Espèces</>
                        }
                      </div>
                    </td>
                    <td style={{ fontWeight:700, color:'var(--success)' }}>
                      {p.montant} {p.devise}
                    </td>
                    <td>
                      <span className={p.statut === 'payé' ? 'badge badge-success' : 'badge badge-warning'}>
                        {p.statut === 'payé' ? '✅ Payé' : '⏳ En attente'}
                      </span>
                    </td>
                    <td style={{ color:'var(--muted)', fontSize:13 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <Calendar size={12} />
                        {formatDate(p.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoriquePaiements;