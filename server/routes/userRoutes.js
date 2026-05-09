const express = require('express');
const router = express.Router();
const { getProfil, updateProfil } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profil', protect, getProfil);
router.put('/profil', protect, updateProfil);

module.exports = router;