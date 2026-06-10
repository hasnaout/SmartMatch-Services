const express = require('express');
const router = express.Router();
const {
  getTousUsers,
  activerUser,
  suspendrUser,
  verifierUser,
  supprimerUser,
  getDemandesSuppression,
  validerSuppression,
  refuserSuppression,
  getTousAvis,
  masquerAvis,
  afficherAvis,
  getStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect, authorizeRoles('admin'));

// Users
router.get('/users',                          getTousUsers);
router.put('/users/:id/activer',              activerUser);
router.put('/users/:id/suspendre',            suspendrUser);
router.put('/users/:id/verifier',             verifierUser);
router.delete('/users/:id',                   supprimerUser);

// Demandes de suppression
router.get('/demandes-suppression',           getDemandesSuppression);
router.put('/users/:id/valider-suppression',  validerSuppression);
router.put('/users/:id/refuser-suppression',  refuserSuppression);

// Avis
router.get('/avis',                           getTousAvis);
router.put('/avis/:id/masquer',               masquerAvis);
router.put('/avis/:id/afficher',              afficherAvis);

// Stats
router.get('/stats',                          getStats);

// Demandes (existant)
router.get('/demandes', async (req, res) => {
  try {
    const Demande = require('../models/Demande');
    const demandes = await Demande.find()
      .populate('client', 'nom prenom')
      .sort({ createdAt: -1 });
    res.status(200).json({ total: demandes.length, demandes });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
