const express  = require('express');
const router   = express.Router();

const {
  creerAvis,
  getAvisPrestataire,
  getMesAvis,
} = require('../controllers/avisController');

const { protect, authorize }        = require('../middleware/authMiddleware');
const { validateCreerAvis,
        validateMongoId   }         = require('../middleware/demandeValidator');

// ── Public ──
// GET /api/avis/prestataire/:id — avis visibles d'un prestataire
router.get('/prestataire/:id',   validateMongoId, getAvisPrestataire);

// ── Privé (client) ──
// POST /api/avis — créer un avis après mission terminée
router.post('/',                 protect, authorize('client'), validateCreerAvis, creerAvis);

// GET /api/avis/mes-avis — historique des avis du client connecté
router.get('/mes-avis',          protect, authorize('client'), getMesAvis);

module.exports = router;