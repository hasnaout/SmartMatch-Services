const { body, validationResult, param } = require('express-validator');

// ─────────────────────────────────────────
// Helper : extraire et renvoyer les erreurs de validation
// ─────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '  Données invalides',
      errors:  errors.array().map(e => ({
        champ:   e.path,
        message: e.msg,
        valeur:  e.value, // BONUS : renvoyer la valeur reçue pour faciliter le debug
      })),
    });
  }
  next();
};

// ─────────────────────────────────────────
// Validation : paramètre :id MongoDB dans l'URL
// Réutilisable sur toutes les routes /:id
// ─────────────────────────────────────────
const validateMongoId = [
  param('id')
    .isMongoId().withMessage('Identifiant invalide dans l\'URL'),
  handleValidationErrors,
];

// ─────────────────────────────────────────
// Validation : création d'une demande
// ─────────────────────────────────────────
const validateCreerDemande = [
  body('titre')
    .trim()
    .notEmpty().withMessage('Le titre est obligatoire')
    .isLength({ max: 100 }).withMessage('Le titre ne peut pas dépasser 100 caractères')
    .escape(), // CORRECTION 1 : échapper les caractères HTML dangereux

  body('description')
    .trim()
    .notEmpty().withMessage('La description est obligatoire')
    .isLength({ min: 10, max: 2000 })
    .withMessage('La description doit contenir entre 10 et 2000 caractères')
    .escape(),

  // CORRECTION 2 : categorie est un ObjectId depuis la correction du modèle
  body('categorie')
    .notEmpty().withMessage('La catégorie est obligatoire')
    .isMongoId().withMessage('Identifiant de catégorie invalide'),

  body('urgence')
    .optional()
    .isIn(['faible', 'normale', 'haute', 'urgente'])
    .withMessage('Urgence invalide — valeurs acceptées : faible, normale, haute, urgente'),

  body('budgetMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le budget minimum doit être un nombre positif')
    .toFloat(), // conversion explicite en nombre

  body('budgetMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le budget maximum doit être un nombre positif')
    .toFloat(),

  // CORRECTION 3 : validation inter-champs budgetMin ≤ budgetMax
  body('budgetMax').custom((budgetMax, { req }) => {
    const budgetMin = req.body.budgetMin;
    if (budgetMin !== undefined && budgetMax !== undefined && budgetMax > 0) {
      if (Number(budgetMin) > Number(budgetMax)) {
        throw new Error('Le budget maximum doit être supérieur au budget minimum');
      }
    }
    return true;
  }),

  // CORRECTION 4 : validation des 3 champs de localisation
  body('ville')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La ville ne peut pas dépasser 100 caractères')
    .escape(),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La région ne peut pas dépasser 100 caractères')
    .escape(),

  body('adresse')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('L\'adresse ne peut pas dépasser 200 caractères')
    .escape(),

  // Validation du tableau de fichiers (si présent)
  body('fichiers')
    .optional()
    .isArray({ max: 5 }).withMessage('Maximum 5 fichiers autorisés'),

  body('fichiers.*.url')
    .optional()
    .isURL().withMessage('URL de fichier invalide'),

  handleValidationErrors,
];

// ─────────────────────────────────────────
// Validation : mise à jour du statut
// ─────────────────────────────────────────
const validateUpdateStatut = [
  body('statut')
    .notEmpty().withMessage('Le statut est obligatoire')
    .isIn(['publiée', 'en_cours', 'terminée', 'annulée'])
    .withMessage('Statut invalide — valeurs acceptées : publiée, en_cours, terminée, annulée'),

  handleValidationErrors,
];

// ─────────────────────────────────────────
// Validation : choix du prestataire
// ─────────────────────────────────────────
const validateChoisirPrestataire = [
  body('prestataireId')
    .notEmpty().withMessage('prestataireId est obligatoire')
    .isMongoId().withMessage('Format prestataireId invalide'),

  handleValidationErrors,
];

// ─────────────────────────────────────────
// Validation : noter un prestataire (avis)
// ─────────────────────────────────────────
const validateCreerAvis = [
  body('note')
    .notEmpty().withMessage('La note est obligatoire')
    .isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5')
    .toInt(),

  body('commentaire')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Le commentaire ne peut pas dépasser 500 caractères')
    .escape(),

  handleValidationErrors,
];

module.exports = {
  validateMongoId,
  validateCreerDemande,
  validateUpdateStatut,
  validateChoisirPrestataire,
  validateCreerAvis,
  handleValidationErrors, // exporté pour être réutilisé dans d'autres validators
};