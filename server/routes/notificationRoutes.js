const express = require('express');
const router  = express.Router();
const {
  getMesNotifications,
  lireTout,
  lireNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',              getMesNotifications);
router.put('/lire-tout',     lireTout);
router.put('/:id/lire',      lireNotification);

module.exports = router;
