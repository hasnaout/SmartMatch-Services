import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Briefcase, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const CATEGORIES = ['', 'Plomberie', 'Électricité', 'Informatique', 'Jardinage', 'Peinture', 'Maçonnerie'];

// ── Composant étoiles ──
const Stars = ({ note, size = 14 }) => (
  <div style={{ display:'flex', gap:2 }}>
    {[1,2,3,4,5].map(s => (
      <Star
        key={s} size={size}
        fill={s <= note ? 'var(--warning)' : 'none'}
        color={s <= note ? 'var(--warning)' : 'var(--muted2)'}
      />
    ))}
  </div>
);

// ── Avis d'un prestataire ──
const AvisPrestataire = ({ prestataireId }) => {
  const [avis,    setAvis]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get(`/avis/prestataire/${prestataireId}`)
      .then(({ data }) => setAvis(data.avis))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, prestataireId]);

  return (
    <div style={{ marginTop:12 }}>
      <button
        className="btn-secondary"
        onClick={() => setOpen(!open)}
        style={{ width:'100%', justifyContent:'space-between', fontSize:13, padding:'9px 14px' }}
      >
        <span>Voir les avis</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{ marginTop:10 }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:20 }}>
              <span className="spinner-dark" />
            </div>
          ) : avis.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--muted)', textAlign:'center', padding:16 }}>
              Aucun avis pour l&apos;instant
            </p>
          ) : (
            avis.map(a => (
              <div key={a._id} className="avis-card">
                <div className="avis-header">
                  <div className="avis-user">
                    <div style={{
                      width:32, height:32, borderRadius:'50%',
                      background:'var(--gradient)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:700, color:'#fff',
                    }}>
                      {a.client?.prenom?.[0]}{a.client?.nom?.[0]}
                    </div>
                    <div>
                      <div className="avis-user-name">{a.client?.prenom} {a.client?.nom}</div>
                      <div className="avis-date">
                        {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <Stars note={a.note} />
                </div>
                {a.commentaire && <p className="avis-comment">{a.commentaire}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Prestataires = () => {
  const [prestataires, setPrestataires] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');

  useEffect(() => {
    setLoading(true);
    const params = catFilter ? `?categorie=${catFilter}` : '';
    api.get(`/prestataires${params}`)
      .then(({ data }) => setPrestataires(data.prestataires))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [catFilter]);

  const filtered = prestataires.filter(p =>
    `${p.user?.prenom} ${p.user?.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">Nos <span>Prestataires</span></h1>
          <p className="dashboard-subtitle">Trouvez le professionnel idéal pour votre besoin</p>
        </div>

        {/* Filtres */}
        <div className="card" style={{ marginBottom:28, display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
            <input
              className="form-input"
              placeholder="Rechercher un prestataire..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:40 }}
            />
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={catFilter === cat ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setCatFilter(cat)}
                style={{ padding:'8px 14px', fontSize:13 }}
              >
                {cat === '' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width:32, height:32, borderWidth:3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon"><Briefcase size={28} /></div>
              <p className="empty-state-title">Aucun prestataire trouvé</p>
            </div>
          </div>
        ) : (
          <div className="demandes-grid">
            {filtered.map((p, i) => (
              <div key={p._id} className="demande-card" style={{ animationDelay:`${i*0.06}s` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                  <div style={{
                    width:50, height:50, borderRadius:14, flexShrink:0,
                    background:'var(--prest-gradient)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, fontWeight:700, color:'#fff',
                    boxShadow:'0 4px 12px rgba(14,165,233,0.2)',
                  }}>
                    {p.user?.prenom?.[0]}{p.user?.nom?.[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="demande-card-title" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    {p.user?.prenom} {p.user?.nom}
                  {p.user?.isVerified && (
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:3,
                 padding:'2px 8px', borderRadius:99,
                 background:'var(--info-light)',
                 border:'1px solid rgba(37,99,235,0.2)',
                 fontSize:11, fontWeight:600, color:'var(--info)',
                    }}>
                     <CheckCircle size={12} /> Vérifié
                 </span>
                    )}
                   </div>
                  </div>
                  <span className={p.disponible ? 'badge badge-success' : 'badge badge-danger'}>
                    {p.disponible ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>

                {p.description && <p className="demande-card-body">{p.description}</p>}

                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                  {p.categories?.map(cat => (
                    <span key={cat} className="badge badge-accent">{cat}</span>
                  ))}
                </div>

                <div className="demande-card-footer" style={{ marginBottom:0 }}>
  <div className="demande-card-meta">
    <MapPin size={12} /> {p.zoneGeographique?.ville || 'Non précisé'}
  </div>
  <Link
    to={`/client/prestataires/${p._id}`}
    className="btn-secondary"
    style={{ padding:'6px 14px', fontSize:12 }}
  >
    Voir profil
  </Link>
</div>

                {/* Avis dépliables */}
                <AvisPrestataire prestataireId={p._id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prestataires;
