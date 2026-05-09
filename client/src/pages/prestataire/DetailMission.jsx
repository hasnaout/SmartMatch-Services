import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { ArrowLeft, MapPin, Calendar, Send, MessageCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const socket = io('http://localhost:5000');

const statusConfig = {
  publiée:  { label: 'Publiée',  className: 'badge badge-accent'  },
  en_cours: { label: 'En cours', className: 'badge badge-warning' },
  terminée: { label: 'Terminée', className: 'badge badge-success' },
  annulée:  { label: 'Annulée',  className: 'badge badge-danger'  },
};

const DetailMission = () => {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demande,  setDemande]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg,   setNewMsg]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const messagesEndRef = React.useRef(null);

  const [terminant, setTerminant] = useState(false);

 const handleTerminer = async () => {
  if (!window.confirm('Marquer cette mission comme terminée ?')) return;
  setTerminant(true);
  try {
    await api.put(`/demandes/${id}/terminer`);
    toast.success('✅ Mission terminée !');
    setDemande(prev => ({ ...prev, statut: 'terminée' }));
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur');
  } finally {
    setTerminant(false);
  }
};
  useEffect(() => {
    api.get(`/demandes/${id}`)
      .then(({ data }) => setDemande(data.demande))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!demande?.client?._id) return;

    const clientId = demande.client._id;

    api.get(`/messages/${id}/${clientId}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => {});

    const roomId = `${id}_${[user.id, clientId].sort().join('_')}`;
    socket.emit('join_room', roomId);

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off('receive_message');
  }, [demande, id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !demande?.client?._id) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        destinataireId: demande.client._id,
        demandeId:      id,
        contenu:        newMsg.trim(),
      });
      const roomId = `${id}_${[user.id, demande.client._id].sort().join('_')}`;
      socket.emit('send_message', { ...data.data, roomId });
      setMessages(prev => [...prev, data.data]);
      setNewMsg('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi');
    } finally {
      setSending(false);
    }
  };

  const formatDate  = (d) => new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  const formatTime  = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

  if (loading) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state"><span className="spinner-dark" style={{ width:32, height:32 }} /></div>
      </div>
    </div>
  );

  if (!demande) return (
    <div className="layout"><Navbar />
      <div className="page-content">
        <div className="empty-state"><p>Mission introuvable</p></div>
      </div>
    </div>
  );

  const s = statusConfig[demande.statut] || statusConfig['publiée'];

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <button className="btn-secondary" onClick={() => navigate(-1)} style={{ padding:'8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>{demande.titre}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className={s.className}>{s.label}</span>
              <span className="badge badge-muted">{demande.categorie}</span>
            </div>
          </div>
          {demande.statut === 'en_cours' && (
  <button
    className="btn-success"
    onClick={handleTerminer}
    disabled={terminant}
    style={{ padding:'10px 20px' }}
  >
    {terminant
      ? <><span className="spinner-dark" /> En cours...</>
      : <><CheckCircle size={15} /> Terminer la mission</>
    }
  </button>
)}
{demande.statut === 'terminée' && (
  <span className="badge badge-success" style={{ padding:'10px 16px', fontSize:14 }}>
    ✅ Mission terminée
  </span>
)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Infos */}
          <div>
            <div className="card" style={{ marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--prest-accent)' }}>
                📋 Détails de la mission
              </h3>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:16 }}>
                {demande.description}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--muted)' }}>
                  <MapPin size={14} color="var(--prest-accent)" />
                  {demande.localisation?.ville || 'Non précisé'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--muted)' }}>
                  <Calendar size={14} color="var(--prest-accent)" />
                  {formatDate(demande.createdAt)}
                </div>
                {(demande.budget?.min > 0 || demande.budget?.max > 0) && (
                  <div style={{ fontSize:13, color:'var(--success)', fontWeight:500 }}>
                    💰 Budget : {demande.budget.min} – {demande.budget.max} {demande.budget.devise}
                  </div>
                )}
              </div>
            </div>

            {/* Client info */}
            <div className="card">
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--prest-accent)' }}>
                👤 Client
              </h3>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:'50%',
                  background:'var(--client-gradient)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:16, fontWeight:700, color:'#fff',
                }}>
                  {demande.client?.prenom?.[0]}{demande.client?.nom?.[0]}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>
                    {demande.client?.prenom} {demande.client?.nom}
                  </div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>
                    {demande.client?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Photos */}
            {demande.fichiers?.length > 0 && (
              <div className="card" style={{ marginTop:16 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14, color:'var(--prest-accent)' }}>
                  📸 Photos
                </h3>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {demande.fichiers.map((f, i) => (
                    <img key={i} src={f.url} alt={f.nom}
                      style={{ width:90, height:90, objectFit:'cover', borderRadius:10, border:'1px solid var(--border)' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="chat-box" style={{ height:500 }}>
            <div className="chat-header">
              <MessageCircle size={16} color="var(--prest-accent)" />
              <div>
                <div className="chat-header-name">Messagerie</div>
                <div className="chat-header-sub">
                  Discussion avec {demande.client?.prenom} {demande.client?.nom}
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--muted)', fontSize:13, marginTop:40 }}>
                  Aucun message — démarrez la conversation !
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailMission;