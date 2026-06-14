import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import {
  MapPin, Star, Briefcase, ArrowLeft, ChevronDown, ChevronUp, PlusCircle,
  CheckCircle, XCircle, Trophy, Wallet, Gem, ClipboardList
} from 'lucide-react';
import PropTypes from 'prop-types';

const Stars = ({ note, size = 16 }) => (
  <div style={{ display:'flex', gap:3 }}>
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={size}
        fill={s <= note ? 'var(--warning)' : 'none'}
        color={s <= note ? 'var(--warning)' : 'var(--muted2)'}
      />
    ))}
  </div>
);
Stars.propTypes = {
  note: PropTypes.number.isRequired,
  size: PropTypes.number
};


const ProfilPrestataire = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [prestataire, setPrestataire] = useState(null);
  const [avis,        setAvis]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [avisOpen,    setAvisOpen]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/prestataires/${id}`),
      api.get(`/avis/prestataire/${id}`),
    ])
      .then(([p, a]) => {
        setPrestataire(p.data.prestataire);
        setAvis(a.data.avis);
      })
      .catch(() => navigate('/client/prestataires'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state">
          <span className="spinner-dark" style={{ width:36, height:36, borderWidth:3 }} />
        </div>
      </div>
    </div>
  );

  if (!prestataire) return null;

  const u = prestataire.user;

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">


        <button
          className="btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom:24, padding:'8px 14px' }}
        >
          <ArrowLeft size={15} /> Retour
        </button>


        <div style={{
          background: 'radial-gradient(circle at 12% 0%, rgba(139,92,246,0.58), transparent 34%), radial-gradient(circle at 90% 8%, rgba(255,255,255,0.13), transparent 28%), linear-gradient(135deg, #10051f 0%, #261052 52%, #0d0418 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}>

          <div style={{
            position:'absolute', right:-40, top:-40,
            width:200, height:200, borderRadius:'50%',
            background:'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position:'absolute', right:60, bottom:-60,
            width:150, height:150, borderRadius:'50%',
            background:'rgba(255,255,255,0.05)',
          }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>




              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:6 }}>
                  {u?.prenom} {u?.nom}
                </h1>

                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Stars note={Math.round(prestataire.notemoyenne)} size={16} />
                    <span style={{ color:'rgba(255,255,255,0.9)', fontSize:14, fontWeight:600 }}>
                      {prestataire.notemoyenne > 0 ? `${prestataire.notemoyenne}/5` : 'Nouveau'}
                    </span>
                    <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>
                      ({prestataire.nombreAvis} avis)
                    </span>
                  </div>
                  <span style={{
                    padding:'4px 12px', borderRadius:99,
                    background: prestataire.disponible ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                    color:'#fff', fontSize:12, fontWeight:600,
                    border:`1px solid ${prestataire.disponible ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`,
                  }}>
                    {prestataire.disponible ? <><CheckCircle size={13} /> Disponible</> : <><XCircle size={13} /> Indisponible</>}
                  </span>
                </div>

                {prestataire.zoneGeographique?.ville && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.8)', fontSize:13 }}>
                    <MapPin size={13} />
                    {prestataire.zoneGeographique.ville}
                    {prestataire.zoneGeographique.region && `, ${prestataire.zoneGeographique.region}`}
                    {prestataire.zoneGeographique.rayon && ` (rayon ${prestataire.zoneGeographique.rayon} km)`}
                  </div>
                )}
              </div>


              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Link
                  to="/client/creer"
                  style={{
                    padding:'11px 20px', borderRadius:12,
                    background:'rgba(255,255,255,0.15)',
                    border:'1.5px solid rgba(255,255,255,0.3)',
                    color:'#fff', fontSize:14, fontWeight:600,
                    display:'flex', alignItems:'center', gap:8,
                    transition:'all 0.2s',
                    backdropFilter:'blur(10px)',
                  }}
                >
                  <PlusCircle size={15} /> Créer une demande
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:20 }}>


          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>


            {prestataire.description && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'var(--prest-accent)' }}>
                  À propos
                </h3>
                <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7 }}>
                  {prestataire.description}
                </p>
              </div>
            )}


            <div className="card">
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--prest-accent)' }}>
                Statistiques
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { label:'Missions réussies', value: prestataire.nombreMissionsReussies, icon:<Trophy size={22} /> },
                  { label:'Années d\'exp.',    value: `${prestataire.experience || 0} ans`, icon:<Briefcase size={22} /> },
                  { label:'Tarif min',         value: prestataire.tarifMin > 0 ? `${prestataire.tarifMin} MAD` : 'N/A', icon:<Wallet size={22} /> },
                  { label:'Tarif max',         value: prestataire.tarifMax > 0 ? `${prestataire.tarifMax} MAD` : 'N/A', icon:<Gem size={22} /> },
                ].map((s, i) => (
                  <div key={i} style={{
                    background:'var(--bg3)', borderRadius:12,
                    padding:'14px', textAlign:'center',
                    border:'1px solid var(--border)',
                  }}>
                    <div style={{ marginBottom:4, color:'var(--prest-accent)' }}>{s.icon}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>


            {prestataire.categories?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'var(--prest-accent)' }}>
                  <Briefcase size={15} style={{ marginRight:6, verticalAlign:'middle' }} />
                  Catégories
                </h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {prestataire.categories.map(cat => (
                    <span key={cat} style={{
                      padding:'7px 14px', borderRadius:99,
                      background:'var(--prest-light)',
                      color:'var(--prest-accent2)',
                      fontSize:13, fontWeight:500,
                      border:'1px solid rgba(14,165,233,0.2)',
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}


            {prestataire.competences?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'var(--prest-accent)' }}>
                  Compétences
                </h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {prestataire.competences.map((c, i) => (
                    <span key={i} className="badge badge-muted" style={{ fontSize:12, padding:'5px 12px' }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div>
            <div className="card">
              <button
                onClick={() => setAvisOpen(!avisOpen)}
                style={{
                  width:'100%', display:'flex', alignItems:'center',
                  justifyContent:'space-between', background:'none',
                  border:'none', cursor:'pointer', padding:0, marginBottom: avisOpen ? 16 : 0,
                }}
              >
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--prest-accent)' }}>
                  <Star size={16} fill="var(--warning)" color="var(--warning)" /> Avis clients ({avis.length})
                </h3>
                {avisOpen ? <ChevronUp size={18} color="var(--muted)" /> : <ChevronDown size={18} color="var(--muted)" />}
              </button>

              {avisOpen && (
                <>

                  {prestataire.notemoyenne > 0 && (
                    <div style={{
                      background:'var(--bg3)', borderRadius:12, padding:'16px',
                      marginBottom:16, display:'flex', alignItems:'center', gap:16,
                    }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:40, fontWeight:800, color:'var(--text)', lineHeight:1 }}>
                          {prestataire.notemoyenne}
                        </div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>sur 5</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <Stars note={Math.round(prestataire.notemoyenne)} size={20} />
                        <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>
                          Basé sur {prestataire.nombreAvis} avis
                        </div>
                      </div>
                    </div>
                  )}


                  {avis.length === 0 ? (
                    <div className="empty-state" style={{ padding:'40px 20px' }}>
                      <div className="empty-state-icon">
                        <Star size={24} />
                      </div>
                      <p className="empty-state-title">Aucun avis pour l&apos;instant</p>
                      <p className="empty-state-text">Soyez le premier à laisser un avis !</p>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {avis.map(a => (
                        <div key={a._id} className="avis-card">
                          <div className="avis-header">
                            <div className="avis-user">
                              <div style={{
                                width:34, height:34, borderRadius:'50%',
                                background:'var(--client-gradient)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:12, fontWeight:700, color:'#fff',
                              }}>
                                {a.client?.prenom?.[0]}{a.client?.nom?.[0]}
                              </div>
                              <div>
                                <div className="avis-user-name">
                                  {a.client?.prenom} {a.client?.nom}
                                </div>
                                <div className="avis-date">
                                  {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                                    day:'2-digit', month:'long', year:'numeric',
                                  })}
                                </div>
                              </div>
                            </div>
                            <Stars note={a.note} size={14} />
                          </div>
                          {a.demande?.titre && (
                            <div style={{ fontSize:12, color:'var(--accent)', marginBottom:8, fontWeight:500 }}>
                              <ClipboardList size={13} /> {a.demande.titre}
                            </div>
                          )}
                          {a.commentaire && (
                            <p className="avis-comment">{a.commentaire}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilPrestataire;
