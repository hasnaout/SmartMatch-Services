const express = require('express');
const router  = express.Router();

const {
  envoyerMessage,
  getMessages,
  getConversations,
  getNonLus,          // CORRECTION 1 : brancher l'endpoint manquant
} = require('../controllers/messageController');

const { protect }     = require('../middleware/authMiddleware');
const { body, param,
        validationResult } = require('express-validator');

// ── Toutes les routes messages sont protégées ──
router.use(protect);

// ── CORRECTION 2 : validators inline légers ──
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

const validateEnvoyerMessage = [
  body('destinataireId').notEmpty().isMongoId().withMessage('destinataireId invalide'),
  body('demandeId').notEmpty().isMongoId().withMessage('demandeId invalide'),
  body('contenu').trim().notEmpty().withMessage('Le contenu est obligatoire')
    .isLength({ max: 2000 }).withMessage('Message trop long (2000 caractères max)'),
  handleErrors,
];

const validateParamsConversation = [
  param('demandeId').isMongoId().withMessage('demandeId invalide'),
  param('userId').isMongoId().withMessage('userId invalide'),
  handleErrors,
];

// ── Routes ──

// POST /api/messages — envoyer un message
router.post('/',
  validateEnvoyerMessage,
  envoyerMessage
);

// GET /api/messages/conversations — liste des conversations
router.get('/conversations', getConversations);

// GET /api/messages/non-lus — compteur pour le badge UI
router.get('/non-lus', getNonLus);

// GET /api/messages/:demandeId/:userId — messages d'une conversation
router.get('/:demandeId/:userId',
  validateParamsConversation,
  getMessages
);

module.exports = router;