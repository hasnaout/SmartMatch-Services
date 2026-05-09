import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Messagerie from './pages/Messagerie';
// Auth
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';
import Carte from './pages/client/Carte';
// Client
import DetailMission from './pages/prestataire/DetailMission';
import ClientDashboard  from './pages/client/Dashboard';
import MesDemandes      from './pages/client/MesDemandes';
import CreerDemande     from './pages/client/CreerDemande';
import Prestataires     from './pages/client/Prestataires';
import DetailDemande from './pages/client/DetailDemande';
import ProfilPrestataire from './pages/client/ProfilPrestataire';
import Paiement            from './pages/client/Paiement';
import HistoriquePaiements from './pages/client/HistoriquePaiements';
// Prestataire
import PrestataireDashboard from './pages/prestataire/Dashboard';
import MonProfil            from './pages/prestataire/MonProfil';
import DemandesPrestataire  from './pages/prestataire/Demandes';
import Revenus from './pages/prestataire/Revenus';
// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import Categories    from './pages/admin/Categories';
import ModerationAvis from './pages/admin/ModerationAvis';
import Analytics     from './pages/admin/Analytics';

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Redirect selon le rôle */}
      <Route path="/"
        element={
          user?.role === 'client'      ? <Navigate to="/client/dashboard" /> :
          user?.role === 'prestataire' ? <Navigate to="/prestataire/dashboard" /> :
          user?.role === 'admin'       ? <Navigate to="/admin/dashboard" /> :
          <Navigate to="/login" />
        }
      />

      {/* Auth */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/messages" element={
  <ProtectedRoute roles={['client', 'prestataire']}>
    <Messagerie />
  </ProtectedRoute>
} />

{/* Client */}
<Route path="/client/dashboard"  element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
<Route path="/client/demandes"   element={<ProtectedRoute roles={['client']}><MesDemandes /></ProtectedRoute>} />
<Route path="/client/demandes/:id" element={<ProtectedRoute roles={['client']}><DetailDemande /></ProtectedRoute>} />
<Route path="/client/creer"      element={<ProtectedRoute roles={['client']}><CreerDemande /></ProtectedRoute>} />
<Route path="/client/prestataires" element={<ProtectedRoute roles={['client']}><Prestataires /></ProtectedRoute>} />
<Route path="/client/prestataires/:id" element={<ProtectedRoute roles={['client']}><ProfilPrestataire /></ProtectedRoute>} />
<Route path="/client/carte"      element={<ProtectedRoute roles={['client']}><Carte /></ProtectedRoute>} />
<Route path="/client/paiement/:demandeId" element={
  <ProtectedRoute roles={['client']}>
    <Paiement />
  </ProtectedRoute>
} />

<Route path="/client/paiements" element={
  <ProtectedRoute roles={['client']}>
    <HistoriquePaiements />
  </ProtectedRoute>
} />
      {/* Prestataire */}

<Route path="/prestataire/missions/:id" element={
  <ProtectedRoute roles={['prestataire']}>
    <DetailMission />
  </ProtectedRoute>
} />
      <Route path="/prestataire/dashboard" element={<ProtectedRoute roles={['prestataire']}><PrestataireDashboard /></ProtectedRoute>} />
      <Route path="/prestataire/profil"    element={<ProtectedRoute roles={['prestataire']}><MonProfil /></ProtectedRoute>} />
      <Route path="/prestataire/demandes"  element={<ProtectedRoute roles={['prestataire']}><DemandesPrestataire /></ProtectedRoute>} />
      <Route path="/prestataire/revenus"   element={<ProtectedRoute roles={['prestataire']}><Revenus /></ProtectedRoute>} />
      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"     element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
       <Route path="/admin/categories"  element={<ProtectedRoute roles={['admin']}><Categories /></ProtectedRoute>} />
      <Route path="/admin/avis"        element={<ProtectedRoute roles={['admin']}><ModerationAvis /></ProtectedRoute>} />
      <Route path="/admin/analytics"   element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;