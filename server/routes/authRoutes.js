const express = require('express');
const router = express.Router();
const {
  register, login, getMe,
  motDePasseOublie, reinitialiserMotDePasse,
} =require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');


router.post('/register', register);


router.post('/login', login);


router.get('/me', protect, getMe);


router.post('/mot-de-passe-oublie', motDePasseOublie);


router.post('/reinitialiser-mot-de-passe', reinitialiserMotDePasse);

module.exports = router;
