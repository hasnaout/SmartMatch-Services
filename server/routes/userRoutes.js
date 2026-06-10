const express = require('express');
const router = express.Router();
const {
  getProfil,
  updateProfil,
  changerMotDePasse,
  demanderSuppression,
  annulerDemandeSuppressionUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profil',                   protect, getProfil);
router.put('/profil',                   protect, updateProfil);
router.put('/changer-mot-de-passe',     protect, changerMotDePasse);
router.post('/demande-suppression',     protect, demanderSuppression);
router.delete('/demande-suppression',   protect, annulerDemandeSuppressionUser);

module.exports = router;
