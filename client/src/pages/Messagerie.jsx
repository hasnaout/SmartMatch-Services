import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Send, MessageCircle } from 'lucide-react';
import socket from '../services/socket';

const Messagerie = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [newMsg,        setNewMsg]        = useState('');
  const [sending,       setSending]       = useState(false);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    api.get('/messages/conversations')
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => {});
  }, []);


  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });
    return () => socket.off('receive_message');
  }, []);


  const openConversation = async (conv) => {
    setActiveConv(conv);
    const autreUserId = getAutreUser(conv)?.id;
    if (!autreUserId) return;
    try {
      const { data } = await api.get(
        `/messages/${conv.demande._id}/${autreUserId}`
      );
      setMessages(data.messages);
      socket.emit('join_room', conv.roomId);
    } catch {
      toast.error('Erreur chargement messages');
    }
  };


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSend = async () => {
    if (!newMsg.trim() || !activeConv) return;
    const autreUser = getAutreUser(activeConv);
    if (!autreUser) return;

    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        destinataireId: autreUser.id,
        demandeId:      activeConv.demande._id,
        contenu:        newMsg.trim(),
      });

      const msgData = {
        ...data.data,
        roomId: activeConv.roomId,
      };

      setMessages((prev) => [...prev, msgData]);
      socket.emit('send_message', msgData);
      setNewMsg('');
    } catch {
      toast.error('Erreur envoi message');
    } finally {
      setSending(false);
    }
  };


  const getAutreUser = (conv) => {
    if (!conv) return null;
    const msg = conv.dernierMessage;
    if (!msg) return null;
    const exp = msg.expediteur;
    const dest = msg.destinataire;
    if (exp?._id === user?.id || exp?.id === user?.id) {
      return { id: dest?._id || dest?.id, nom: dest?.nom, prenom: dest?.prenom };
    }
    return { id: exp?._id || exp?.id, nom: exp?.nom, prenom: exp?.prenom };
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content" style={{ paddingBottom: 0 }}>

        <div className="dashboard-header" style={{ marginBottom: 20 }}>
          <h1 className="dashboard-greeting">
            <span>Messagerie</span>
          </h1>
          <p className="dashboard-subtitle">
            Communiquez avec vos clients et prestataires
          </p>
        </div>

        <div className="messages-layout">


          <div className="conversations-list">
            <div className="conversations-header">Conversations</div>
            {conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">
                  <MessageCircle size={24} />
                </div>
                <p className="empty-state-title" style={{ fontSize: 14 }}>
                  Aucune conversation
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const autre = getAutreUser(conv);
                return (
                  <div
                    key={conv.roomId}
                    className={`conversation-item ${activeConv?.roomId === conv.roomId ? 'active' : ''}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className="conv-avatar">
                      {autre?.prenom?.[0]}{autre?.nom?.[0]}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div className="conv-name">
                        {autre?.prenom} {autre?.nom}
                      </div>
                      <div className="conv-last">
                        {conv.demande?.titre}
                      </div>
                    </div>
                    {conv.nonLus > 0 && (
                      <div className="conv-badge">{conv.nonLus}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>


          <div className="chat-box">
            {!activeConv ? (
              <div className="chat-empty">
                <MessageCircle size={48} strokeWidth={1} />
                <p style={{ fontSize: 15, fontWeight: 500 }}>
                  Sélectionnez une conversation
                </p>
                <p style={{ fontSize: 13 }}>
                  Choisissez une conversation dans la liste
                </p>
              </div>
            ) : (
              <>

                <div className="chat-header">
                  <div className="conv-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                    {getAutreUser(activeConv)?.prenom?.[0]}
                    {getAutreUser(activeConv)?.nom?.[0]}
                  </div>
                  <div>
                    <div className="chat-header-name">
                      {getAutreUser(activeConv)?.prenom}{' '}
                      {getAutreUser(activeConv)?.nom}
                    </div>
                    <div className="chat-header-sub">
                      {activeConv.demande?.titre}
                    </div>
                  </div>
                </div>


                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 40 }}>
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
                              : `${msg.expediteur?.prenom?.[0]}${msg.expediteur?.nom?.[0]}`
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
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messagerie;
