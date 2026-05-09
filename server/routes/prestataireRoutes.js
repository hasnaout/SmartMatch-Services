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

// GET /api/prestataires — liste publique
router.get('/', getTousPrestataires);

// GET /api/prestataires/moi — profil du prestataire connecté
router.get('/moi', protect, authorizeRoles('prestataire'), getMonProfil);

// PUT /api/prestataires/profil — modifier son profil
router.put('/profil', protect, authorizeRoles('prestataire'), updateProfil);

// PUT /api/prestataires/disponibilite — changer disponibilité
router.put('/disponibilite', protect, authorizeRoles('prestataire'), updateDisponibilite);

// GET /api/prestataires/:id — profil public d'un prestataire
router.get('/:id', getPrestataire);

module.exports = router;