const express = require('express');
const router  = express.Router();
const { creerAvis, getAvisPrestataire, getMesAvis } = require('../controllers/avisController');
const { protect }        = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');


router.post('/', protect, authorizeRoles('client'), creerAvis);


router.get('/mes-avis', protect, authorizeRoles('client'), getMesAvis);


router.get('/prestataire/:id', getAvisPrestataire);

module.exports = router;
