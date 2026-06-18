const express  = require('express');
const router   = express.Router();
const { uploadFichiers }  = require('../controllers/uploadController');
const { protect }         = require('../middleware/authMiddleware');
const { uploadMultiple }  = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadMultiple, uploadFichiers);

module.exports = router;
