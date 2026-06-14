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


router.post('/', protect, authorizeRoles('client'), creerDemande);


router.get('/mes-demandes', protect, authorizeRoles('client'), getMesDemandes);


router.get('/disponibles', protect, authorizeRoles('prestataire'), getDemandesDisponibles);


router.get('/:id', protect, getDemande);


router.put('/:id/statut', protect, updateStatut);


router.put('/:id/choisir-prestataire', protect, authorizeRoles('client'), choisirPrestataire);


router.put('/:id/terminer', protect, authorizeRoles('prestataire'), terminerMission);

module.exports = router;
