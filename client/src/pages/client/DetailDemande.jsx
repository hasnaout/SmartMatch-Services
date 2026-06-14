import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate ,Link} from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { formatMontant } from '../../utils/paiementHelper';
import {
  ArrowLeft, MapPin, Calendar, Send,
  MessageCircle, CheckCircle, XCircle, User, Star, CreditCard, Banknote,
  ClipboardList, Wallet, UserCheck, Bot, Search, Images, ThumbsUp, Circle
} from 'lucide-react';

const statusConfig = {
  publiée:  { label: 'Publiée',  className: 'badge badge-accent'  },
  en_cours: { label: 'En cours', className: 'badge badge-warning' },
  terminée: { label: 'Terminée', className: 'badge badge-success' },
  annulée:  { label: 'Annulée',  className: 'badge badge-danger'  },
};

const DetailDemande = () => {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [demande,  setDemande]  = useState(null);
  const [paiement, setPaiement] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg,   setNewMsg]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    const chargerDetail = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/demandes/${id}`);
        setDemande(data.demande);

        try {
          const paiementResponse = await api.get(`/paiements/demande/${id}`);
          setPaiement(paiementResponse.data.paiement);
        } catch {
          setPaiement(null);
        }
      } catch {
        toast.error('Erreur chargement');
      } finally {
        setLoading(false);
      }
    };

    chargerDetail();
  }, [id]);


  useEffect(() => {
    if (!demande?.prestataireChoisi) return;

    const autreUserId =
      demande.prestataireChoisi?.user?._id ||
      demande.prestataireChoisi?._id ||
      demande.prestataireChoisi;

    if (!autreUserId) return;

    api.get(`/messages/${id}/${autreUserId}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => {});

    const ids    = [user.id, autreUserId.toString()].sort();
    const roomId = `${id}_${ids[0]}_${ids[1]}`;
    socket.emit('join_room', roomId);

    const handler = (msg) => setMessages(prev => [...prev, msg]);
    socket.on('receive_message', handler);
    return () => socket.off('receive_message', handler);
  }, [demande, id, user]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSend = async () => {
    if (!newMsg.trim() || !demande) return;

    const autreUserId =
      demande.prestataireChoisi?.user?._id ||
      demande.prestataireChoisi?._id ||
      demande.prestataireChoisi;

    if (!autreUserId) {
      toast.error('Aucun prestataire assigné');
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        destinataireId: autreUserId,
        demandeId:      id,
        contenu:        newMsg.trim(),
      });

      const ids    = [user.id, autreUserId.toString()].sort();
      const roomId = `${id}_${ids[0]}_${ids[1]}`;
      socket.emit('send_message', { ...data.data, roomId });
      setMessages(prev => [...prev, data.data]);
      setNewMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi');
    } finally {
      setSending(false);
    }
  };


  const handleChoisirPrestataire = async (prestataireId) => {
    if (!window.confirm('Confirmer le choix de ce prestataire ?')) return;
    try {
      await api.put(`/demandes/${id}/choisir-prestataire`, { prestataireId });
      toast.success('Prestataire choisi ! La mission démarre.');
      const { data } = await api.get(`/demandes/${id}`);
      setDemande(data.demande);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };


  const handleTerminer = async () => {
    if (!window.confirm('Marquer cette demande comme terminée ?')) return;
    try {
      await api.put(`/demandes/${id}/statut`, { statut: 'terminée' });
      toast.success('Demande terminée !');
      const [{ data }, paiementResponse] = await Promise.all([
        api.get(`/demandes/${id}`),
        api.get(`/paiements/demande/${id}`).catch(() => ({ data: { paiement: null } })),
      ]);
      setDemande(data.demande);
      setPaiement(paiementResponse.data.paiement);
    } catch {
      toast.error('Erreur');
    }
  };


  const handleAnnuler = async () => {
    if (!window.confirm('Annuler cette demande ?')) return;
    try {
      await api.put(`/demandes/${id}/statut`, { statut: 'annulée' });
      toast.success('Demande annulée');
      navigate('/client/demandes');
    } catch {
      toast.error('Erreur');
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

  const formatDateTime = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
    });


  if (loading) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state">
          <span className="spinner-dark" style={{ width:36, height:36, borderWidth:3 }} />
        </div>
      </div>
    </div>
  );

  if (!demande) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state"><p>Demande introuvable</p></div>
      </div>
    </div>
  );

  const s              = statusConfig[demande.statut] || statusConfig['publiée'];
  const prestataireUser = demande.prestataireChoisi?.user || null;
  const autreUserId    =
    demande.prestataireChoisi?.user?._id ||
    demande.prestataireChoisi?._id ||
    demande.prestataireChoisi;
  const canPayer = user.role === 'client' && demande.statut === 'terminée';

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">


        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding:'8px 12px' }}>
            <ArrowLeft size={16} />
          </button>

            {canPayer && (
             <Link
             to={`/client/paiement/${id}`}
             className="btn-primary"
             style={{ padding:'10px 20px' }}
             >
    {paiement?.statut === 'payé'
      ? <><CheckCircle size={15} /> Paiement effectué</>
      : paiement
      ? <><CreditCard size={15} /> Finaliser paiement</>
      : <><CreditCard size={15} /> Payer la mission</>
    }
  </Link>
)}
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>{demande.titre}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span className={s.className}>{s.label}</span>
              <span className="badge badge-muted">{demande.categorie}</span>
            </div>
          </div>
          {user.role === 'client' && demande.statut === 'en_cours' && (
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-success" onClick={handleTerminer}>
                <CheckCircle size={15} /> Terminer
              </button>
              <button className="btn-danger" onClick={handleAnnuler}>
                <XCircle size={15} /> Annuler
              </button>
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>


          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>


            <div className="card">
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--accent2)' }}>
                <ClipboardList size={16} /> Détails
              </h3>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:16 }}>
                {demande.description}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {demande.localisation?.ville && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--muted)' }}>
                    <MapPin size={14} color="var(--accent)" />
                    {demande.localisation.ville}
                    {demande.localisation.region && `, ${demande.localisation.region}`}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--muted)' }}>
                  <Calendar size={14} color="var(--accent)" />
                  {formatDate(demande.createdAt)}
                </div>
                {(demande.budget?.min > 0 || demande.budget?.max > 0) && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--success)', fontWeight:500 }}>
                    <Wallet size={14} /> Budget : {demande.budget.min} – {demande.budget.max} {demande.budget.devise}
                  </div>
                )}
              </div>
            </div>


            {canPayer && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--accent2)' }}>
                  <CreditCard size={16} /> Paiement
                </h3>

                {paiement ? (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:42, height:42, borderRadius:12,
                          background: paiement.statut === 'payé' ? 'var(--success-light)' : 'var(--warning-light)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          {paiement.methode === 'en_ligne'
                            ? <CreditCard size={20} color={paiement.statut === 'payé' ? 'var(--success)' : 'var(--warning)'} />
                            : <Banknote size={20} color={paiement.statut === 'payé' ? 'var(--success)' : 'var(--warning)'} />
                          }
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>
                            {formatMontant(paiement.montant, paiement.devise)}
                          </div>
                          <div style={{ fontSize:12, color:'var(--muted)' }}>
                            Réf. {paiement.reference}
                          </div>
                        </div>
                      </div>
                      <span className={paiement.statut === 'payé' ? 'badge badge-success' : 'badge badge-warning'}>
                        {paiement.statut === 'payé' ? 'Payé' : 'En attente'}
                      </span>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                        <span style={{ color:'var(--muted)' }}>Méthode</span>
                        <span style={{ fontWeight:600 }}>
                          {paiement.methode === 'en_ligne' ? 'Paiement en ligne' : 'Paiement en espèces'}
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                        <span style={{ color:'var(--muted)' }}>Date</span>
                        <span style={{ fontWeight:600 }}>
                          {paiement.datePaiement ? formatDateTime(paiement.datePaiement) : formatDateTime(paiement.createdAt)}
                        </span>
                      </div>
                      {paiement.notes && (
                        <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                          <span style={{ color:'var(--muted)' }}>Notes</span>
                          <span style={{ fontWeight:600, textAlign:'right' }}>{paiement.notes}</span>
                        </div>
                      )}
                    </div>

                    {paiement.statut !== 'payé' && (
                      <Link
                        to={`/client/paiement/${id}`}
                        className="btn-primary"
                        style={{ marginTop:16, width:'100%', padding:'10px 14px' }}
                      >
                        <CreditCard size={15} /> Finaliser le paiement
                      </Link>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding:'14px 16px', borderRadius:12,
                    background:'var(--bg3)', border:'1px solid var(--border)',
                  }}>
                    <p style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>
                      Aucun paiement n'a encore été enregistré pour cette mission.
                    </p>
                    <Link
                      to={`/client/paiement/${id}`}
                      className="btn-primary"
                      style={{ width:'100%', padding:'10px 14px' }}
                    >
                      <CreditCard size={15} /> Payer maintenant
                    </Link>
                  </div>
                )}
              </div>
            )}


            {prestataireUser ? (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--accent2)' }}>
                  <UserCheck size={16} /> Prestataire assigné
                </h3>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:'50%',
                    background:'var(--prest-gradient)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, fontWeight:700, color:'#fff',
                  }}>
                    {prestataireUser.prenom?.[0]}{prestataireUser.nom?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>
                      {prestataireUser.prenom} {prestataireUser.nom}
                    </div>
                    <div style={{ fontSize:13, color:'var(--muted)' }}>
                      {prestataireUser.email}
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop:12, padding:'10px 14px',
                  background:'var(--success-light)', borderRadius:10,
                  fontSize:13, color:'var(--success)', fontWeight:500,
                }}>
                  <CheckCircle size={14} /> Mission en cours — utilisez la messagerie pour communiquer
                </div>
              </div>
            ) : (
              <div className="card">
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--muted)' }}>
                  <User size={32} style={{ marginBottom:8, opacity:0.4 }} />
                  <p style={{ fontSize:14 }}>Aucun prestataire assigné</p>
                  <p style={{ fontSize:12, marginTop:4 }}>
                    Choisissez un prestataire dans les recommandations
                  </p>
                </div>
              </div>
            )}


            {!demande.prestataireChoisi && demande.prestatairesRecommandes?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:'var(--accent2)' }}>
                  <Bot size={16} /> Prestataires recommandés ({demande.prestatairesRecommandes.length})
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[...demande.prestatairesRecommandes]
                    .sort((a, b) => b.score - a.score)
                    .map((r, i) => {
                      const p = r.prestataire;
                      if (!p || !p.user) return null;
                      return (
                        <div key={i} style={{
                          display:'flex', alignItems:'center', gap:12,
                          padding:'12px 14px',
                          background:'var(--bg3)',
                          borderRadius:12,
                          border:'1px solid var(--border)',
                        }}>
                          <div style={{
                            width:40, height:40, borderRadius:'50%',
                            background:'var(--prest-gradient)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:14, fontWeight:700, color:'#fff', flexShrink:0,
                          }}>
                            {p.user?.prenom?.[0]}{p.user?.nom?.[0]}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 }}>
                              {p.user?.prenom} {p.user?.nom}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--muted)' }}>
                              <Star size={11} fill="var(--warning)" color="var(--warning)" />
                              Score : {r.score}/100
                            </div>
                          </div>
                          <span style={{
                            padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:600,
                            background: r.score >= 70 ? 'var(--success-light)' : r.score >= 40 ? 'var(--warning-light)' : 'var(--bg3)',
                            color:      r.score >= 70 ? 'var(--success)'       : r.score >= 40 ? 'var(--warning)'       : 'var(--muted)',
                          }}>
                            {r.score >= 70 ? <><Star size={11} fill="currentColor" /> Excellent</> : r.score >= 40 ? <><ThumbsUp size={11} /> Bien</> : <><Circle size={8} fill="currentColor" /> Correct</>}
                          </span>
                          <button
                            className="btn-primary"
                            style={{ padding:'8px 14px', fontSize:12, whiteSpace:'nowrap' }}
                            onClick={() => handleChoisirPrestataire(p._id)}
                          >
                            Choisir
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}


            {!demande.prestataireChoisi && demande.prestatairesRecommandes?.length === 0 && (
              <div className="card">
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--muted)' }}>
                  <p style={{ fontSize:14 }}><Search size={16} /> Aucun prestataire disponible pour cette catégorie</p>
                  <p style={{ fontSize:12, marginTop:4 }}>
                    Consultez la liste des prestataires pour en contacter un directement
                  </p>
                </div>
              </div>
            )}


            {demande.fichiers?.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--accent2)' }}>
                  <Images size={16} /> Photos ({demande.fichiers.length})
                </h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {demande.fichiers.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer">
                      <img
                        src={f.url}
                        alt={f.nom}
                        style={{
                          width:90, height:90, objectFit:'cover',
                          borderRadius:10, border:'1px solid var(--border)',
                          cursor:'pointer', transition:'transform 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div className="chat-box" style={{ height:560 }}>
            <div className="chat-header">
              <MessageCircle size={16} color="var(--accent)" />
              <div>
                <div className="chat-header-name">Messagerie</div>
                <div className="chat-header-sub">
                  {autreUserId
                    ? `Discussion avec ${prestataireUser?.prenom || '...'} ${prestataireUser?.nom || ''}`
                    : 'Choisissez un prestataire pour discuter'
                  }
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {!autreUserId ? (
                <div style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginTop:60 }}>
                  <MessageCircle size={40} style={{ marginBottom:12, opacity:0.3 }} />
                  <p>La messagerie sera disponible</p>
                  <p>après avoir choisi un prestataire</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginTop:60 }}>
                  <MessageCircle size={40} style={{ marginBottom:12, opacity:0.3 }} />
                  <p>Aucun message pour l&apos;instant</p>
                  <p>Démarrez la conversation !</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine =
                    msg.expediteur?._id === user?.id ||
                    msg.expediteur?.id  === user?.id ||
                    msg.expediteur      === user?.id;
                  return (
                    <div key={i} className={`msg-wrap ${isMine ? 'mine' : ''}`}>
                      <div className="msg-avatar">
                        {isMine
                          ? `${user?.prenom?.[0]}${user?.nom?.[0]}`
                          : `${msg.expediteur?.prenom?.[0] || '?'}${msg.expediteur?.nom?.[0] || ''}`
                        }
                      </div>
                      <div>
                        <div className="msg-bubble">{msg.contenu}</div>
                        <div className="msg-time">{formatTime(msg.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {autreUserId && (
              <div className="chat-input-area">
                <textarea
                  className="chat-input"
                  placeholder="Écrivez votre message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                >
                  <Send size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailDemande;
