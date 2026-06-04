const express = require('express');
const router  = express.Router();

const {
  getTousUsers,
  activerUser,
  suspendreUser,    // CORRECTION 1 : nom corrigé
  verifierUser,
  supprimerUser,
  getTousAvis,
  masquerAvis,
  afficherAvis,
  getStats,
  getTousDemandes
} = require('../controllers/adminController');


const { protect, authorize } = require('../middleware/authMiddleware');

// CORRECTION 2 : middleware global sur tout le router admin
// Toutes les routes ci-dessous exigent un token valide + rôle admin
router.use(protect);
router.use(authorize('admin'));

// ── Stats ──
router.get('/stats',                getStats);

// ── Gestion des utilisateurs ──
router.get   ('/users',              getTousUsers);
router.put   ('/users/:id/activer',  activerUser);
router.put   ('/users/:id/suspendre',suspendreUser);
router.put   ('/users/:id/verifier', verifierUser);
router.delete('/users/:id',          supprimerUser);

// ── Gestion des avis ──
router.get('/avis',                  getTousAvis);
router.put('/avis/:id/masquer',      masquerAvis);
router.put('/avis/:id/afficher',     afficherAvis);

// ── Gestion des demandes ──
// CORRECTION 3 : logique déplacée dans adminController
router.get('/demandes', getTousDemandes);

module.exports = router;