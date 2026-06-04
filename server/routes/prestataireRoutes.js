const express = require('express');
const router  = express.Router();

const {
  getTousPrestataires,
  getMonProfil,
  getPrestataire,
  updateProfil,
  updateDisponibilite,
  ajouterPortfolio,      // CORRECTION 1 : brancher les endpoints portfolio
  supprimerPortfolio,
} = require('../controllers/prestataireController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { validateMongoId }    = require('../middleware/demandeValidator');
const { body, validationResult } = require('express-validator');

// ── Validator inline : mise à jour profil ──
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
  body('description')
    .optional().trim()
    .isLength({ max: 1000 }).withMessage('Description trop longue (1000 caractères max)'),

  body('tarifMin')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tarif minimum invalide'),

  body('tarifMax')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tarif maximum invalide'),

  body('experience')
    .optional()
    .isInt({ min: 0, max: 60 }).withMessage('Expérience invalide (0-60 ans)'),

  body('rayon')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Rayon invalide (1-500 km)'),

  handleErrors,
];

const validatePortfolio = [
  body('titre')
    .trim().notEmpty().withMessage('Le titre est obligatoire')
    .isLength({ max: 100 }).withMessage('Titre trop long (100 caractères max)'),

  body('description')
    .optional().trim()
    .isLength({ max: 500 }).withMessage('Description trop longue'),

  body('image')
    .optional()
    .isURL().withMessage('URL image invalide'),

  handleErrors,
];

// ── Public ──
router.get('/',    getTousPrestataires);
router.get('/:id', validateMongoId, getPrestataire);

// ── Privé (prestataire) ──
const prestRouter = express.Router();
prestRouter.use(protect);
prestRouter.use(authorize('prestataire'));

prestRouter.get ('/moi',                    getMonProfil);
prestRouter.put ('/profil',                 validateUpdateProfil,  updateProfil);
prestRouter.put ('/disponibilite',          updateDisponibilite);
prestRouter.post('/portfolio',              validatePortfolio,     ajouterPortfolio);
prestRouter.delete('/portfolio/:projetId',  supprimerPortfolio);

router.use('/', prestRouter);

module.exports = router;