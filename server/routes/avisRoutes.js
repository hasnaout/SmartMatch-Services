const express = require('express');
const router  = express.Router();
const { creerAvis, getAvisPrestataire, getMesAvis } = require('../controllers/avisController');
const { protect }        = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// POST /api/avis — créer un avis (client)
router.post('/', protect, authorizeRoles('client'), creerAvis);

// GET /api/avis/mes-avis — mes avis
router.get('/mes-avis', protect, authorizeRoles('client'), getMesAvis);

// GET /api/avis/prestataire/:id — avis d'un prestataire
router.get('/prestataire/:id', getAvisPrestataire);

module.exports = router;