import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Search, Star, Filter, Wallet, CheckCircle, XCircle } from 'lucide-react';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const createCustomIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(102,126,234,0.4);
    "></div>
  `,
  iconSize:   [36, 36],
  iconAnchor: [18, 36],
  popupAnchor:[0, -36],
});

const CATEGORIES = [
  '', 'Plomberie', 'Électricité', 'Informatique',
  'Jardinage', 'Peinture', 'Maçonnerie',
];


const VILLES_COORDS = {
  'casablanca':       [33.5731, -7.5898],
  'rabat':            [34.0209, -6.8416],
  'marrakech':        [31.6295, -7.9811],
  'fès':              [34.0181, -5.0078],
  'tanger':           [35.7595, -5.8340],
  'agadir':           [30.4278, -9.5981],
  'meknès':           [33.8935, -5.5473],
  'oujda':            [34.6867, -1.9114],
  'tétouan':          [35.5785, -5.3684],
  'salé':             [34.0382, -6.8199],
};

const getCoords = (ville) => {
  if (!ville) return [33.5731, -7.5898];
  const key = ville.toLowerCase().trim();
  return VILLES_COORDS[key] || [33.5731, -7.5898];
};

const Carte = () => {
  const [prestataires, setPrestataires] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [selected,     setSelected]     = useState(null);
  const [mapCenter,    setMapCenter]    = useState([33.5731, -7.5898]);

  useEffect(() => {
    const params = catFilter ? `?categorie=${catFilter}` : '';
    api.get(`/prestataires${params}`)
      .then(({ data }) => setPrestataires(data.prestataires))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [catFilter]);

  const filtered = prestataires.filter(p => {
    const name = `${p.user?.prenom} ${p.user?.nom}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleSelectPrestataire = (p) => {
    setSelected(p);
    const coords = getCoords(p.zoneGeographique?.ville);
    setMapCenter(coords);
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content" style={{ paddingBottom:0 }}>

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Carte des <span>Prestataires</span>
          </h1>
          <p className="dashboard-subtitle">
            Trouvez un prestataire près de chez vous
          </p>
        </div>

        <div style={{
  display: 'grid',
  gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '320px 1fr',
  gap: 20,
  height: window.innerWidth < 768 ? 'auto' : 'calc(100vh - 200px)',
}}>

          <div className="carte-liste" style={{
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    maxHeight: window.innerWidth < 768 ? '300px' : 'none',
  }}>

            <div style={{ padding:16, borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
              <div style={{ position:'relative', marginBottom:12 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
                <input
                  className="form-input"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft:38, fontSize:13 }}
                />
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Filter size={13} style={{ color:'var(--muted)', marginTop:6 }} />
                {CATEGORIES.slice(0, 5).map(cat => (
                  <button
                    key={cat}
                    className={catFilter === cat ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setCatFilter(cat)}
                    style={{ padding:'5px 10px', fontSize:11 }}
                  >
                    {cat === '' ? 'Tous' : cat}
                  </button>
                ))}
              </div>
            </div>


            <div style={{ flex:1, overflowY:'auto' }}>
              {loading ? (
                <div className="empty-state" style={{ padding:40 }}>
                  <span className="spinner-dark" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state" style={{ padding:40 }}>
                  <p className="empty-state-title" style={{ fontSize:14 }}>
                    Aucun prestataire
                  </p>
                </div>
              ) : (
                filtered.map(p => (
                  <div
                    key={p._id}
                    onClick={() => handleSelectPrestataire(p)}
                    style={{
                      padding:'14px 16px',
                      borderBottom:'1px solid var(--border)',
                      cursor:'pointer',
                      background: selected?._id === p._id
                        ? 'var(--accent-light)'
                        : 'transparent',
                      transition:'background var(--transition)',
                      borderLeft: selected?._id === p._id
                        ? '3px solid var(--accent)'
                        : '3px solid transparent',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:38, height:38, borderRadius:'50%',
                        background:'var(--prest-gradient)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
                      }}>
                        {p.user?.prenom?.[0]}{p.user?.nom?.[0]}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>
                          {p.user?.prenom} {p.user?.nom}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {p.categories?.slice(0,2).map(c => (
                            <span key={c} className="badge badge-accent" style={{ fontSize:10, padding:'2px 8px' }}>{c}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className={p.disponible ? 'badge badge-success' : 'badge badge-danger'} style={{ fontSize:10 }}>
                          {p.disponible ? '● Dispo' : '● Indispo'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--warning)' }}>
                        <Star size={11} fill="currentColor" />
                        {p.notemoyenne > 0 ? `${p.notemoyenne}/5` : 'Nouveau'}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}>
                        <MapPin size={11} />
                        {p.zoneGeographique?.ville || 'Non précisé'}
                      </div>
                      {p.tarifMin > 0 && (
                        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--success)', fontWeight:500 }}>
                          <Wallet size={11} /> {p.tarifMin}–{p.tarifMax}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


           <div className="carte-map" style={{
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
    position: 'relative',
    height: window.innerWidth < 768 ? '400px' : '100%',
  }}>
            <MapContainer
              center={mapCenter}
              zoom={6}
              style={{ width:'100%', height:'100%' }}
              key={mapCenter.join(',')}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filtered.map(p => {
                const coords = getCoords(p.zoneGeographique?.ville);
                return (
                  <Marker
                    key={p._id}
                    position={coords}
                    icon={createCustomIcon()}
                    eventHandlers={{ click: () => handleSelectPrestataire(p) }}
                  >
                    <Popup>
                      <div style={{ minWidth:200, fontFamily:"'DM Sans',sans-serif" }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <div style={{
                            width:36, height:36, borderRadius:'50%',
                            background:'linear-gradient(135deg,#667eea,#764ba2)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:13, fontWeight:700, color:'#fff',
                          }}>
                            {p.user?.prenom?.[0]}{p.user?.nom?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14, color:'#1e1b4b' }}>
                              {p.user?.prenom} {p.user?.nom}
                            </div>
                            <div style={{ fontSize:11, color:'#6b7280' }}>
                              {p.zoneGeographique?.ville}
                            </div>
                          </div>
                        </div>

                        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                          {p.categories?.map(c => (
                            <span key={c} style={{
                              background:'#ede9fe', color:'#764ba2',
                              padding:'2px 8px', borderRadius:99,
                              fontSize:11, fontWeight:500,
                            }}>{c}</span>
                          ))}
                        </div>

                        {p.notemoyenne > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#d97706', marginBottom:6 }}>
                            <Star size={12} fill="currentColor" /> {p.notemoyenne}/5 ({p.nombreAvis} avis)
                          </div>
                        )}

                        {p.tarifMin > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#059669', marginBottom:10, fontWeight:500 }}>
                            <Wallet size={12} /> {p.tarifMin} – {p.tarifMax} MAD
                          </div>
                        )}

                        <div style={{
                          fontSize:11,
                          color: p.disponible ? '#059669' : '#dc2626',
                          fontWeight:600, marginBottom:10,
                        }}>
                          {p.disponible ? <><CheckCircle size={12} /> Disponible</> : <><XCircle size={12} /> Indisponible</>}
                        </div>

                        {p.zoneGeographique?.rayon && (
                          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6b7280', marginBottom:10 }}>
                            <MapPin size={11} /> Rayon d&apos;intervention : {p.zoneGeographique.rayon} km
                          </div>
                        )}
                      </div>
                    </Popup>


                    <Circle
                      center={coords}
                      radius={(p.zoneGeographique?.rayon || 20) * 1000}
                      pathOptions={{
                        color:       '#667eea',
                        fillColor:   '#667eea',
                        fillOpacity: 0.08,
                        weight:      1.5,
                      }}
                    />
                  </Marker>
                );
              })}
            </MapContainer>


            <div style={{
              position:'absolute', bottom:16, right:16, zIndex:1000,
              background:'rgba(255,255,255,0.95)',
              borderRadius:12, padding:'12px 16px',
              border:'1px solid var(--border)',
              boxShadow:'var(--shadow-sm)',
              fontSize:12,
            }}>
              <div style={{ fontWeight:700, marginBottom:8, color:'var(--text)' }}>Légende</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:'var(--gradient)' }} />
                <span style={{ color:'var(--muted)' }}>Prestataire</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:'rgba(102,126,234,0.2)', border:'1px solid #667eea' }} />
                <span style={{ color:'var(--muted)' }}>Zone d&apos;intervention</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carte;
