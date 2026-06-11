import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';
import socket from '../../services/socket';
import logo from '../../assets/logo.png';

import {
  Zap, LayoutDashboard, FileText, PlusCircle,
  Users, Settings, LogOut, ShieldCheck,
  MessageCircle, Bell, CheckCheck, MapPin, CreditCard, TrendingUp, Tag, Star,
  CheckCircle, PartyPopper, BadgeCheck
} from 'lucide-react';

const typeIcon = {
  nouvelle_demande: Bell,
  demande_acceptee: PartyPopper,
  demande_terminee: CheckCircle,
  nouveau_message:  MessageCircle,
  nouvel_avis:      Star,
  compte_verifie:   BadgeCheck,
};

const NotificationIcon = ({ type, size = 18 }) => {
  const Icon = typeIcon[type] || Bell;
  return <Icon size={size} strokeWidth={2.2} />;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs,    setNotifs]    = useState([]);
  const [nonLus,    setNonLus]    = useState(0);
  const notifRef = useRef(null);

  // Charger notifications
  const fetchNotifs = () => {
    api.get('/notifications')
      .then(({ data }) => {
        setNotifs(data.notifications);
        setNonLus(data.nonLus);
      })
      .catch(() => {});
  };

useEffect(() => {
  if (!user) return;
  fetchNotifs();

  console.log('Socket join_user:', user.id);
  socket.emit('join_user', user.id);

  socket.on('nouvelle_notification', (notif) => {
    console.log('Notification reçue:', notif);
    setNotifs(prev => [notif, ...prev]);
    setNonLus(prev => prev + 1);
    toast(notif.message, { icon: <NotificationIcon type={notif.type} size={18} /> });
  });

  return () => socket.off('nouvelle_notification');
}, [user]);
  // Fermer en cliquant dehors
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLireTout = async () => {
    await api.put('/notifications/lire-tout');
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    setNonLus(0);
  };

  const handleClickNotif = async (notif) => {
    if (!notif.lu) {
      await api.put(`/notifications/${notif._id}/lire`);
      setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, lu: true } : n));
      setNonLus(prev => Math.max(0, prev - 1));
    }
    if (notif.lien) navigate(notif.lien);
    setNotifOpen(false);
  };

  const formatTime = (d) => {
    const diff = Date.now() - new Date(d).getTime();
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(diff / 3600000);
    const j    = Math.floor(diff / 86400000);
    if (min < 1)  return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    if (h < 24)   return `Il y a ${h}h`;
    return `Il y a ${j}j`;
  };

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté avec succès');
    navigate('/login');
  };

  const initiales = user
    ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
    : '?';

  const role = user?.role || 'admin';

  const linksClient = [
    { to: '/client/dashboard',    icon: <LayoutDashboard size={15} />, label: 'Tableau de bord' },
    { to: '/client/demandes',     icon: <FileText size={15} />,        label: 'Mes demandes'    },
    { to: '/messages',            icon: <MessageCircle size={15} />,   label: 'Messages'        },
    { to: '/client/carte', icon: <MapPin size={15} />, label: 'Carte' },
        { to: '/client/prestataires', icon: <Users size={15} />,           label: 'Prestataires'    },
        { to: '/client/paiements', icon: <CreditCard size={15} />, label: 'Paiements' },
        { to: '/settings', icon: <Settings size={15} />, label: 'Paramètres' },
  ];

  const linksPrestataire = [
    { to: '/prestataire/dashboard', icon: <LayoutDashboard size={15} />, label: 'Tableau de bord' },
    { to: '/prestataire/demandes',  icon: <FileText size={15} />,        label: 'Missions'        },
    { to: '/messages',              icon: <MessageCircle size={15} />,   label: 'Messages'        },
     { to: '/prestataire/profil',    icon: <Settings size={15} />,        label: 'Mon profil'      },
     { to: '/prestataire/revenus', icon: <TrendingUp size={15} />, label: 'Revenus' },
     { to: '/settings', icon: <Settings size={15} />, label: 'Paramètres' },
  ];

  const linksAdmin = [
  { to: '/admin/dashboard',   icon: <LayoutDashboard size={15} />, label: 'Dashboard'   },
  { to: '/admin/analytics',   icon: <TrendingUp size={15} />,      label: 'Analytics'   },
  { to: '/admin/users',       icon: <ShieldCheck size={15} />,     label: 'Utilisateurs'},
  { to: '/admin/categories',  icon: <Tag size={15} />,             label: 'Catégories'  },
  { to: '/admin/avis',        icon: <Star size={15} />,            label: 'Avis'        },
];

  const links =
    role === 'client'      ? linksClient :
    role === 'prestataire' ? linksPrestataire :
    linksAdmin;

  return (
    <>
      <nav className={`navbar ${role}`}>
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          <img src={logo} alt="SmartMatch logo" className="navbar-logo-image" />
        </NavLink>

        {/* Links desktop */}
        <div className="navbar-links">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {l.icon} {l.label}
            </NavLink>
          ))}
        </div>

        {/* Droite */}
        <div className="navbar-right">

           {/* Notifications */}
  {role !== 'admin' && (
    <div ref={notifRef} style={{ position: 'relative' }}>
      <button
        className="notif-btn"
        onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifs(); }}
      >
        <Bell size={16} />
        {nonLus > 0 && (
          <span className="notif-badge">{nonLus > 9 ? '9+' : nonLus}</span>
        )}
      </button>

      {notifOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">
              Notifications {nonLus > 0 && `(${nonLus})`}
            </span>
            {nonLus > 0 && (
              <button onClick={handleLireTout} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <CheckCheck size={13} /> Tout lire
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                Aucune notification
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.lu ? 'unread' : ''}`}
                  onClick={() => handleClickNotif(n)}
                >
                  <div className="notif-icon" style={{ background: 'var(--accent-light)' }}>
                    <NotificationIcon type={n.type} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="notif-text" style={{ fontWeight: n.lu ? 400 : 600 }}>
                      {n.titre}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div className="notif-time">{formatTime(n.createdAt)}</div>
                  </div>
                  {!n.lu && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )}

          {/* User */}
          <div className="navbar-user">
    <div className={`navbar-avatar ${role}`}>{initiales}</div>
    <span className="navbar-username">{user?.prenom} {user?.nom}</span>
  </div>

          <button className="navbar-logout" onClick={handleLogout}>
    <LogOut size={14} /> Déconnecter
  </button>

          {/* Hamburger mobile */}
  <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
    {menuOpen
      ? <span style={{ fontSize: 20, color: 'var(--accent)', lineHeight: 1 }}>✕</span>
      : <>
          <span /><span /><span />
        </>
    }
    </button>
        </div>   
      </nav>

      {/* Menu mobile */}
{menuOpen && (
  <div className="navbar-mobile-menu">
    {/* Avatar user en haut */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', marginBottom: 8,
      background: 'var(--bg3)', borderRadius: 12,
    }}>
      <div className={`navbar-avatar ${role}`} style={{ width: 36, height: 36, fontSize: 13 }}>
        {initiales}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {user?.prenom} {user?.nom}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </div>
      </div>
    </div>

    <div className="divider" style={{ margin: '4px 0' }} />

    {/* Liens */}
    {links.map(l => (
      <NavLink
        key={l.to}
        to={l.to}
        className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        {l.icon} {l.label}
      </NavLink>
    ))}

    <div className="divider" style={{ margin: '4px 0' }} />

    {/* Logout */}
    <button
      className="navbar-logout-mobile"
      onClick={() => { handleLogout(); setMenuOpen(false); }}
    >
      <LogOut size={15} /> Se déconnecter
    </button>
  </div>
)}
    </>
  );
};

export default Navbar;
