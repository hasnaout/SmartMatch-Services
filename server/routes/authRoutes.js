const express = require('express');
const router = express.Router();
const {
  register, login, getMe,
  motDePasseOublie, reinitialiserMotDePasse,
} =require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  (token requis)
router.get('/me', protect, getMe);
    
// POST /api/auth/mot-de-passe-oublie
router.post('/mot-de-passe-oublie', motDePasseOublie);

// POST /api/auth/reinitialiser-mot-de-passe
router.post('/reinitialiser-mot-de-passe', reinitialiserMotDePasse);

module.exports = router;