const express = require('express');
const router  = express.Router();
const {
  initierPaiement,
  confirmerPaiement,
  getMesPaiements,
  getMesRevenus,
  getPaiementDemande,
  getTousPaiements,
} = require('../controllers/paiementController');
const { protect }        = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/initier',              protect, authorizeRoles('client'),      initierPaiement);
router.put('/:id/confirmer',         protect, authorizeRoles('client'),      confirmerPaiement);
router.get('/mes-paiements',         protect, authorizeRoles('client'),      getMesPaiements);
router.get('/mes-revenus',           protect, authorizeRoles('prestataire'), getMesRevenus);
router.get('/demande/:id',           protect,                                getPaiementDemande);
router.get('/',                      protect, authorizeRoles('admin'),       getTousPaiements);

module.exports = router;