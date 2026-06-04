const express = require('express');
const router  = express.Router();

const {
  getProfil,
  updateProfil,
  updateAvatar,          // CORRECTION 1 : brancher les endpoints manquants
  changerMotDePasse,
} = require('../controllers/userController');

const { protect }     = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// ── Toutes les routes user sont protégées ──
router.use(protect);

// ── Validator : mise à jour profil ──
const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '❌ Données invalides',
      errors:  errors.array().map(e => ({ champ: e.path, message: e.msg })),
    });
  }
  next();
};

const validateUpdateProfil = [
  body('nom')
    .optional().trim()
    .notEmpty().withMessage('Le nom ne peut pas être vide')
    .isLength({ max: 50 }).withMessage('Le nom ne peut pas dépasser 50 caractères'),

  body('prenom')
    .optional().trim()
    .notEmpty().withMessage('Le prénom ne peut pas être vide')
    .isLength({ max: 50 }).withMessage('Le prénom ne peut pas dépasser 50 caractères'),

  body('telephone')
    .optional().trim()
    .matches(/^(\+?\d{1,4})?[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}$/)
    .withMessage('Format téléphone invalide'),

  handleErrors,
];

const validateChangerMotDePasse = [
  body('ancienMotDePasse')
    .notEmpty().withMessage('L\'ancien mot de passe est obligatoire'),

  body('nouveauMotDePasse')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),

  handleErrors,
];

// ── Routes ──
router.get('/profil',        getProfil);
router.put('/profil',        validateUpdateProfil,    updateProfil);
router.put('/avatar',        updateAvatar);            // CORRECTION 2
router.put('/mot-de-passe',  validateChangerMotDePasse, changerMotDePasse); // CORRECTION 3

module.exports = router;