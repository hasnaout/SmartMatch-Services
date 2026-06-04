const express = require('express');
const router  = express.Router();

const {
  creerDemande,
  getMesDemandes,
  getDemandesDisponibles,
  getDemande,
  updateStatut,
  choisirPrestataire,
  terminerMission,
} = require('../controllers/demandeController');

const { protect, authorize }  = require('../middleware/authMiddleware');

const {
  validateMongoId,
  validateCreerDemande,
  validateUpdateStatut,
  validateChoisirPrestataire,
} = require('../middleware/demandeValidator');

// ── Client ──
router.post('/',
  protect, authorize('client'),
  validateCreerDemande,
  creerDemande
);

router.get('/mes-demandes',
  protect, authorize('client'),
  getMesDemandes
);

router.put('/:id/choisir-prestataire',
  protect, authorize('client'),
  validateMongoId, validateChoisirPrestataire,
  choisirPrestataire
);

// ── Prestataire ──
router.get('/disponibles',
  protect, authorize('prestataire'),
  getDemandesDisponibles
);

router.put('/:id/terminer',
  protect, authorize('prestataire'),
  validateMongoId,
  terminerMission
);

// ── Client + Admin ──
// CORRECTION : authorize explicite — prestataire ne peut pas changer le statut
router.put('/:id/statut',
  protect, authorize('client', 'admin'),
  validateMongoId, validateUpdateStatut,
  updateStatut
);

// ── Tous rôles authentifiés ──
router.get('/:id',
  protect,
  validateMongoId,
  getDemande
);

module.exports = router;