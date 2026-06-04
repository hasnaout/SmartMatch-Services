const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '❌ Données invalides',
      errors:  errors.array().map(e => ({ champ: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Validation inscription ──
const validateInscription = [
  body('nom')
    .trim().notEmpty().withMessage('Le nom est obligatoire')
    .isLength({ max: 50 }).withMessage('Le nom ne peut pas dépasser 50 caractères'),

  body('prenom')
    .trim().notEmpty().withMessage('Le prénom est obligatoire')
    .isLength({ max: 50 }).withMessage('Le prénom ne peut pas dépasser 50 caractères'),

  body('email')
    .trim().notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('Format email invalide')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),

  body('role')
    .notEmpty().withMessage('Le rôle est obligatoire')
    .isIn(['client', 'prestataire']).withMessage('Rôle invalide'),

  body('telephone')
    .optional()
    .matches(/^(\+?\d{1,4})?[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}$/)
    .withMessage('Format téléphone invalide'),

  handleValidationErrors,
];

// ── Validation connexion ──
const validateConnexion = [
  body('email')
    .trim().notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('Format email invalide')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire'),

  handleValidationErrors,
];

// ── Validation demande reset ──
const validateResetDemande = [
  body('email')
    .trim().notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('Format email invalide')
    .normalizeEmail(),

  handleValidationErrors,
];

// ── Validation confirmation reset ──
const validateResetConfirm = [
  body('email')
    .trim().notEmpty().withMessage('L\'email est obligatoire')
    .isEmail().withMessage('Format email invalide'),

  body('code')
    .notEmpty().withMessage('Le code est obligatoire')
    .isLength({ min: 6, max: 6 }).withMessage('Le code doit contenir 6 chiffres')
    .isNumeric().withMessage('Le code doit être numérique'),

  body('nouveauMotDePasse')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),

  handleValidationErrors,
];

module.exports = {
  validateInscription,
  validateConnexion,
  validateResetDemande,
  validateResetConfirm,
};