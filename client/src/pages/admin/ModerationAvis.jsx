import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Star, Eye, EyeOff, Search } from 'lucide-react';

const Stars = ({ note }) => (
  <div style={{ display:'flex', gap:2 }}>
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={13}
        fill={s <= note ? 'var(--warning)' : 'none'}
        color={s <= note ? 'var(--warning)' : 'var(--muted2)'}
      />
    ))}
  </div>
);

const ModerationAvis = () => {
  const [avis,    setAvis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('tous');

  const fetchAvis = () => {
    setLoading(true);
    api.get('/admin/avis')
      .then(({ data }) => setAvis(data.avis))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAvis(); }, []);

  const handleToggleVisibilite = async (avisId, visible) => {
    try {
      await api.put(`/admin/avis/${avisId}/${visible ? 'masquer' : 'afficher'}`);
      toast.success(`Avis ${visible ? 'masqué' : 'affiché'}`);
      fetchAvis();
    } catch { toast.error('Erreur'); }
  };

  const filtered = avis.filter(a => {
    const matchSearch = search
      ? `${a.client?.prenom} ${a.client?.nom} ${a.commentaire}`.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchFilter =
      filter === 'tous'     ? true :
      filter === 'visibles' ? a.isVisible :
      !a.isVisible;
    return matchSearch && matchFilter;
  });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Modération des <span>Avis</span>
          </h1>
          <p className="dashboard-subtitle">
            Gérez et modérez les avis clients de la plateforme
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom:24 }}>
          {[
            { value:avis.length,                                   label:'Total avis',   cls:'stat-icon-accent'  },
            { value:avis.filter(a => a.isVisible).length,          label:'Visibles',     cls:'stat-icon-success' },
            { value:avis.filter(a => !a.isVisible).length,         label:'Masqués',      cls:'stat-icon-danger'  },
            { value:avis.length > 0 ? (avis.reduce((s,a) => s+a.note,0)/avis.length).toFixed(1) : 0, label:'Note moyenne', cls:'stat-icon-warning' },
          ].map((s, i) => (
            <div key={i} className="stat-card prest-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className={`stat-icon ${s.cls}`}><Star size={20} /></div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="card" style={{ marginBottom:20, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
            <input className="form-input" placeholder="Rechercher un avis..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:40 }} />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {['tous', 'visibles', 'masqués'].map(f => (
              <button key={f} className={filter === f ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setFilter(f)} style={{ padding:'8px 16px', fontSize:13 }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Liste avis */}
        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width:32, height:32, borderWidth:3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon"><Star size={28} /></div>
              <p className="empty-state-title">Aucun avis trouvé</p>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(a => (
              <div key={a._id} className="card" style={{
                opacity: a.isVisible ? 1 : 0.6,
                borderLeft: a.isVisible ? '3px solid var(--success)' : '3px solid var(--danger)',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{
                        width:36, height:36, borderRadius:'50%',
                        background:'var(--gradient)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, color:'#fff', flexShrink:0,
                      }}>
                        {a.client?.prenom?.[0]}{a.client?.nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>
                          {a.client?.prenom} {a.client?.nom}
                        </div>
                        <div style={{ fontSize:12, color:'var(--muted)' }}>
                          {formatDate(a.createdAt)}
                        </div>
                      </div>
                      <Stars note={a.note} />
                      <span className={a.isVisible ? 'badge badge-success' : 'badge badge-danger'}>
                        {a.isVisible ? 'Visible' : 'Masqué'}
                      </span>
                    </div>

                    {a.commentaire && (
                      <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6, marginBottom:10 }}>
                        "{a.commentaire}"
                      </p>
                    )}

                    <div style={{ fontSize:12, color:'var(--muted)' }}>
                      Pour le prestataire :
                      <span style={{ fontWeight:600, color:'var(--text)', marginLeft:4 }}>
                        {a.prestataire?.user?.prenom} {a.prestataire?.user?.nom}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVisibilite(a._id, a.isVisible)}
                    className={a.isVisible ? 'btn-danger' : 'btn-success'}
                    style={{ padding:'8px 14px', fontSize:13, whiteSpace:'nowrap', flexShrink:0 }}
                  >
                    {a.isVisible
                      ? <><EyeOff size={14} /> Masquer</>
                      : <><Eye size={14} /> Afficher</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationAvis;