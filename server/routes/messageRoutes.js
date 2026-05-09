const express = require('express');
const router = express.Router();
const {
  envoyerMessage,
  getMessages,
  getConversations,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes messages sont protégées
router.use(protect);

// POST /api/messages — envoyer un message
router.post('/', envoyerMessage);

// GET /api/messages/conversations — liste des conversations
router.get('/conversations', getConversations);

// GET /api/messages/:demandeId/:userId — messages d'une conversation
router.get('/:demandeId/:userId', getMessages);

module.exports = router;