const express = require('express');
const router  = express.Router();

const {
  initierPaiement,
  confirmerPaiement,
  getMesPaiements,
  getMesRevenus,
  getPaiementDemande,
  getTousPaiements,
} = require('../controllers/paiementController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { validateMongoId }    = require('../middleware/demandeValidator');
const { body, validationResult } = require('express-validator');

// ── Toutes les routes paiement sont protégées ──
router.use(protect);

// ── Validator inline : initier un paiement ──
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

const validateInitierPaiement = [
  body('demandeId')
    .notEmpty().withMessage('demandeId est obligatoire')
    .isMongoId().withMessage('demandeId invalide'),

  body('montant')
    .notEmpty().withMessage('Le montant est obligatoire')
    .isFloat({ min: 0.01 }).withMessage('Le montant doit être supérieur à 0'),

  body('methode')
    .notEmpty().withMessage('La méthode est obligatoire')
    .isIn(['en_ligne', 'especes', 'virement', 'carte'])
    .withMessage('Méthode invalide — valeurs : en_ligne, especes, virement, carte'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Les notes ne peuvent pas dépasser 500 caractères'),

  handleErrors,
];

// ── Client ──
router.post('/initier',
  authorize('client'),
  validateInitierPaiement,
  initierPaiement
);

router.put('/:id/confirmer',
  authorize('client'),
  validateMongoId,
  confirmerPaiement
);

router.get('/mes-paiements',
  authorize('client'),
  getMesPaiements
);

// ── Prestataire ──
router.get('/mes-revenus',
  authorize('prestataire'),
  getMesRevenus
);

// ── Tous rôles authentifiés (ownership vérifié dans le controller) ──
router.get('/demande/:id',
  validateMongoId,
  getPaiementDemande
);

// ── Admin ──
router.get('/',
  authorize('admin'),
  getTousPaiements
);

module.exports = router;
