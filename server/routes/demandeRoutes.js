const express = require('express');
const router = express.Router();
const {
  creerDemande,
  getMesDemandes,
  getDemandesDisponibles,
  getDemande,
  updateStatut,
  choisirPrestataire,
  terminerMission
} = require('../controllers/demandeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// POST /api/demandes — créer une demande (client)
router.post('/', protect, authorizeRoles('client'), creerDemande);

// GET /api/demandes/mes-demandes — demandes du client connecté
router.get('/mes-demandes', protect, authorizeRoles('client'), getMesDemandes);

// GET /api/demandes/disponibles — demandes visibles par le prestataire
router.get('/disponibles', protect, authorizeRoles('prestataire'), getDemandesDisponibles);

// GET /api/demandes/:id — détail d'une demande
router.get('/:id', protect, getDemande);

// PUT /api/demandes/:id/statut — changer le statut
router.put('/:id/statut', protect, updateStatut);

// PUT /api/demandes/:id/choisir-prestataire — choisir un prestataire
router.put('/:id/choisir-prestataire', protect, authorizeRoles('client'), choisirPrestataire);

// PUT /api/demandes/:id/terminer — prestataire termine la mission
router.put('/:id/terminer', protect, authorizeRoles('prestataire'), terminerMission);

module.exports = router;