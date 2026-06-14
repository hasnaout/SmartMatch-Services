const express = require('express');
const router = express.Router();
const {
  getTousPrestataires,
  getMonProfil,
  getPrestataire,
  updateProfil,
  updateDisponibilite,
} = require('../controllers/prestataireController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');


router.get('/', getTousPrestataires);


router.get('/moi', protect, authorizeRoles('prestataire'), getMonProfil);


router.put('/profil', protect, authorizeRoles('prestataire'), updateProfil);


router.put('/disponibilite', protect, authorizeRoles('prestataire'), updateDisponibilite);


router.get('/:id', getPrestataire);

module.exports = router;
