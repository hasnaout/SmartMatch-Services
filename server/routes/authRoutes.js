const express      = require('express');
const router       = express.Router();
const rateLimit    = require('express-rate-limit');

const {
  register,
  login,
  getMe,
  motDePasseOublie,
  reinitialiserMotDePasse,
} = require('../controllers/authController');

const { protect }               = require('../middleware/authMiddleware');
const { validateInscription,
        validateConnexion,
        validateResetDemande,
        validateResetConfirm  } = require('../middleware/authValidator');

// ── CORRECTION 1 : Rate limiting renforcé sur reset password ──
// Plus strict que le limiter global de server.js
const resetLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 heure
  max:             5,              // 5 tentatives max par heure
  message:         { message: '❌ Trop de demandes de réinitialisation — réessayez dans 1 heure' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Routes publiques ──
router.post('/register',                    validateInscription,  register);
router.post('/login',                       validateConnexion,    login);
router.post('/mot-de-passe-oublie',         resetLimiter, validateResetDemande,  motDePasseOublie);
router.post('/reinitialiser-mot-de-passe',  resetLimiter, validateResetConfirm,  reinitialiserMotDePasse);

// ── Routes protégées ──
router.get('/me', protect, getMe);

module.exports = router;