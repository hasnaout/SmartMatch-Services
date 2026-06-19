import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Messagerie from './pages/Messagerie';
 import Settings from './pages/Settings';

import LandingPage from './pages/auth/LandingPage';

import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

import Carte               from './pages/client/Carte';
import ClientDashboard     from './pages/client/Dashboard';
import MesDemandes         from './pages/client/MesDemandes';
import CreerDemande        from './pages/client/CreerDemande';
import Prestataires        from './pages/client/Prestataires';
import DetailDemande       from './pages/client/DetailDemande';
import ProfilPrestataire   from './pages/client/ProfilPrestataire';
import Paiement            from './pages/client/Paiement';
import HistoriquePaiements from './pages/client/HistoriquePaiements';

import DetailMission        from './pages/prestataire/DetailMission';
import PrestataireDashboard from './pages/prestataire/Dashboard';
import MonProfil            from './pages/prestataire/MonProfil';
import DemandesPrestataire  from './pages/prestataire/Demandes';
import Revenus              from './pages/prestataire/Revenus';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers     from './pages/admin/Users';
import Categories     from './pages/admin/Categories';
import ModerationAvis from './pages/admin/ModerationAvis';
import Analytics      from './pages/admin/Analytics';

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>

      <Route
        path="/"
        element={
          user?.role === 'client'      ? <Navigate to="/client/dashboard" /> :
          user?.role === 'prestataire' ? <Navigate to="/prestataire/dashboard" /> :
          user?.role === 'admin'       ? <Navigate to="/admin/dashboard" /> :
          <LandingPage />
        }
      />

      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/messages" element={
        <ProtectedRoute roles={['client', 'prestataire']}>
          <Messagerie />
        </ProtectedRoute>
      } />

      <Route path="/client/dashboard"        element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/demandes"         element={<ProtectedRoute roles={['client']}><MesDemandes /></ProtectedRoute>} />
      <Route path="/client/demandes/:id"     element={<ProtectedRoute roles={['client']}><DetailDemande /></ProtectedRoute>} />
      <Route path="/client/creer"            element={<ProtectedRoute roles={['client']}><CreerDemande /></ProtectedRoute>} />
      <Route path="/client/prestataires"     element={<ProtectedRoute roles={['client']}><Prestataires /></ProtectedRoute>} />
      <Route path="/client/prestataires/:id" element={<ProtectedRoute roles={['client']}><ProfilPrestataire /></ProtectedRoute>} />
      <Route path="/client/carte"            element={<ProtectedRoute roles={['client']}><Carte /></ProtectedRoute>} />
      <Route path="/client/paiement/:demandeId" element={
        <ProtectedRoute roles={['client']}><Paiement /></ProtectedRoute>
      } />
      <Route path="/client/paiements" element={
        <ProtectedRoute roles={['client']}><HistoriquePaiements /></ProtectedRoute>
      } />

      <Route path="/prestataire/missions/:id" element={
        <ProtectedRoute roles={['prestataire']}><DetailMission /></ProtectedRoute>
      } />
      <Route path="/prestataire/dashboard" element={<ProtectedRoute roles={['prestataire']}><PrestataireDashboard /></ProtectedRoute>} />
      <Route path="/prestataire/profil"    element={<ProtectedRoute roles={['prestataire']}><MonProfil /></ProtectedRoute>} />
      <Route path="/prestataire/demandes"  element={<ProtectedRoute roles={['prestataire']}><DemandesPrestataire /></ProtectedRoute>} />
      <Route path="/prestataire/revenus"   element={<ProtectedRoute roles={['prestataire']}><Revenus /></ProtectedRoute>} />

      <Route path="/admin/dashboard"  element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"      element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><Categories /></ProtectedRoute>} />
      <Route path="/admin/avis"       element={<ProtectedRoute roles={['admin']}><ModerationAvis /></ProtectedRoute>} />
      <Route path="/admin/analytics"  element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={
  <ProtectedRoute roles={['client', 'prestataire', 'admin']}>
    <Settings />
  </ProtectedRoute>
} />

      <Route path="/unauthorized" element={
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h1>Accès refusé</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <a href="/">Retour à l'accueil</a>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
};

export default App;
