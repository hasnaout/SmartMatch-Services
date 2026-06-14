const express = require('express');
const router = express.Router();
const {
  envoyerMessage,
  getMessages,
  getConversations,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');


router.use(protect);


router.post('/', envoyerMessage);


router.get('/conversations', getConversations);


router.get('/:demandeId/:userId', getMessages);

module.exports = router;
