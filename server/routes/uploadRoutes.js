const express  = require('express');
const router   = express.Router();

const { uploadFichiers,
        supprimerFichier }  = require('../controllers/uploadController');

const { protect }           = require('../middleware/authMiddleware');

const { uploadMultiple,
        uploadSingle,
        verifierFichiers }  = require('../middleware/uploadMiddleware');

// ── Toutes les routes upload sont protégées ──
router.use(protect);

// POST /api/upload
// Limite : 5 fichiers, 5MB chacun (défini dans uploadMiddleware)
// Chaîne : Multer → vérification magic bytes → controller ImgBB
router.post('/',
  uploadMultiple,
  verifierFichiers,   // CORRECTION 1 : vérification contenu réel des fichiers
  uploadFichiers
);

// POST /api/upload/single — pour avatar (1 fichier uniquement)
router.post('/single',
  uploadSingle,
  verifierFichiers,
  uploadFichiers
);


module.exports = router;
