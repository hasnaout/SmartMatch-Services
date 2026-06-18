const express = require('express');
const router  = express.Router();

const { protect }       = require('../middleware/authMiddleware');
const { validateMongoId } = require('../middleware/demandeValidator');

const {
  getMesNotifications,
  lireTout,
  lireNotification,
  supprimerNotification,
  viderNotifications,
} = require('../controllers/notificationController');

// ── Toutes les routes notifications sont protégées ──
router.use(protect);

// ── Lecture ──
router.get('/', getMesNotifications);

// ── Marquage lu ──
router.put('/lire-tout',   lireTout);
router.put('/:id/lire',    validateMongoId, lireNotification);

// ── Suppression ──
router.delete('/:id', validateMongoId, supprimerNotification);
router.delete('/',    viderNotifications);

module.exports = router;
