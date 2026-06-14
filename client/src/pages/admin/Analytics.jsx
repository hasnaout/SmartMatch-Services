import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import {
  Users, FileText, CreditCard, Star,
  TrendingUp, CheckCircle, Clock, XCircle, Wallet
} from 'lucide-react';


const BarChart = ({ data, color = 'var(--accent)', label }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, marginBottom:8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:10, color:'var(--muted)', fontWeight:600 }}>{d.value}</span>
            <div style={{
              width:'100%',
              height:`${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 4 : 0,
              background: color,
              borderRadius:'4px 4px 0 0',
              transition:'height 0.5s ease',
            }} />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex:1, textAlign:'center', fontSize:10, color:'var(--muted)' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};


const DonutChart = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset  = 0;
  const radius    = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="12" />
        {total > 0 && segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const gap  = circumference - dash;
          const el   = (
            <circle key={i} cx="50" cy="50" r={radius}
              fill="none" stroke={seg.color} strokeWidth="12"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition:'stroke-dasharray 0.5s ease' }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>{total}</div>
        <div style={{ fontSize:10, color:'var(--muted)' }}>total</div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [stats,    setStats]    = useState(null);
  const [paiements,setPaiements]= useState([]);
  const [users,    setUsers]    = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/paiements'),
      api.get('/admin/users?limit=100'),
      api.get('/admin/demandes'),
    ])
      .then(([s, p, u, d]) => {
        setStats(s.data);
        setPaiements(p.data.paiements || []);
        setUsers(u.data.users || []);
        setDemandes(d.data.demandes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);


  const getDerniersNMois = (n) => {
    const mois = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      mois.push({
        label: d.toLocaleDateString('fr-FR', { month:'short' }),
        month: d.getMonth(),
        year:  d.getFullYear(),
        value: 0,
      });
    }
    return mois;
  };

  const inscriptionsData = getDerniersNMois(6).map(m => ({
    ...m,
    value: users.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    }).length,
  }));

  const revenusData = getDerniersNMois(6).map(m => ({
    ...m,
    value: paiements
      .filter(p => {
        const d = new Date(p.createdAt);
        return p.statut === 'payé' && d.getMonth() === m.month && d.getFullYear() === m.year;
      })
      .reduce((s, p) => s + p.montant, 0),
  }));

  const missionsData = getDerniersNMois(6).map(m => ({
    ...m,
    value: demandes.filter(d => {
      const date = new Date(d.createdAt);
      return date.getMonth() === m.month && date.getFullYear() === m.year;
    }).length,
  }));

  const totalRevenus = paiements.filter(p => p.statut === 'payé').reduce((s, p) => s + p.montant, 0);

  if (loading) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state">
          <span className="spinner-dark" style={{ width:36, height:36, borderWidth:3 }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Analytics <span>Dashboard</span>
          </h1>
          <p className="dashboard-subtitle">
            Vue d&apos;ensemble et statistiques avancées de la plateforme
          </p>
        </div>


        <div className="stats-grid" style={{ marginBottom:28 }}>
          {[
            { icon:<Users size={22}/>,       value:stats?.users?.total || 0,        label:'Utilisateurs',      cls:'stat-icon-accent'  },
            { icon:<FileText size={22}/>,     value:stats?.demandes?.total || 0,     label:'Demandes total',    cls:'stat-icon-warning' },
            { icon:<CheckCircle size={22}/>,  value:stats?.demandes?.terminees || 0, label:'Missions terminées',cls:'stat-icon-success' },
            { icon:<CreditCard size={22}/>,   value:`${totalRevenus} MAD`,           label:'Revenus totaux',    cls:'stat-icon-prest'   },
            { icon:<Star size={22}/>,         value:stats?.avis?.total || 0,         label:'Avis publiés',      cls:'stat-icon-warning' },
            { icon:<TrendingUp size={22}/>,   value:paiements.filter(p=>p.statut==='payé').length, label:'Paiements reçus', cls:'stat-icon-success' },
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

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>


          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, color:'var(--accent2)' }}>
              <Users size={16} /> Inscriptions (6 derniers mois)
            </h3>
            <BarChart data={inscriptionsData} color="var(--gradient)" />
          </div>


          <div className="card">
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, color:'var(--accent2)' }}>
              <Wallet size={16} /> Revenus MAD (6 derniers mois)
            </h3>
            <BarChart
              data={revenusData.map(d => ({ ...d, value: Math.round(d.value) }))}
              color="linear-gradient(135deg, #10b981, #059669)"
            />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:20 }}>


          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--accent2)', alignSelf:'flex-start' }}>
              <Users size={16} /> Répartition utilisateurs
            </h3>
            <DonutChart segments={[
              { value: stats?.users?.clients || 0,      color:'var(--accent)',  label:'Clients'      },
              { value: stats?.users?.prestataires || 0, color:'var(--prest-accent)', label:'Prestataires' },
            ]} size={140} />
            <div style={{ display:'flex', gap:16, fontSize:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)' }} />
                <span style={{ color:'var(--muted)' }}>Clients ({stats?.users?.clients || 0})</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--prest-accent)' }} />
                <span style={{ color:'var(--muted)' }}>Prestataires ({stats?.users?.prestataires || 0})</span>
              </div>
            </div>
          </div>


          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--accent2)', alignSelf:'flex-start' }}>
              <FileText size={16} /> Statuts demandes
            </h3>
            <DonutChart segments={[
              { value: demandes.filter(d=>d.statut==='publiée').length,  color:'var(--accent)',  },
              { value: demandes.filter(d=>d.statut==='en_cours').length, color:'var(--warning)', },
              { value: demandes.filter(d=>d.statut==='terminée').length, color:'var(--success)', },
              { value: demandes.filter(d=>d.statut==='annulée').length,  color:'var(--danger)',  },
            ]} size={140} />
            <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12, alignSelf:'stretch' }}>
              {[
                { label:'Publiées',  color:'var(--accent)',  val:demandes.filter(d=>d.statut==='publiée').length  },
                { label:'En cours',  color:'var(--warning)', val:demandes.filter(d=>d.statut==='en_cours').length },
                { label:'Terminées', color:'var(--success)', val:demandes.filter(d=>d.statut==='terminée').length },
                { label:'Annulées',  color:'var(--danger)',  val:demandes.filter(d=>d.statut==='annulée').length  },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:item.color }} />
                    <span style={{ color:'var(--muted)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontWeight:600, color:'var(--text)' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>


          <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--accent2)', alignSelf:'flex-start' }}>
              <CreditCard size={16} /> Méthodes paiement
            </h3>
            <DonutChart segments={[
              { value: paiements.filter(p=>p.methode==='en_ligne').length, color:'var(--accent)'  },
              { value: paiements.filter(p=>p.methode==='especes').length,  color:'var(--success)' },
            ]} size={140} />
            <div style={{ display:'flex', gap:16, fontSize:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)' }} />
                <span style={{ color:'var(--muted)' }}>En ligne ({paiements.filter(p=>p.methode==='en_ligne').length})</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--success)' }} />
                <span style={{ color:'var(--muted)' }}>Espèces ({paiements.filter(p=>p.methode==='especes').length})</span>
              </div>
            </div>
          </div>
        </div>


        <div className="card">
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, color:'var(--accent2)' }}>
            <FileText size={16} /> Nouvelles missions (6 derniers mois)
          </h3>
          <BarChart
            data={missionsData}
            color="linear-gradient(135deg, var(--prest-accent), var(--prest-accent2))"
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
