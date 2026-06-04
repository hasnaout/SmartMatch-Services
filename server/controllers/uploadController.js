const axios    = require('axios');
const FormData = require('form-data');

// Vérification au démarrage
if (!process.env.IMGBB_API_KEY) {
  console.error(' FATAL : IMGBB_API_KEY manquante dans .env');
  process.exit(1);
}

// ── Helper : mapper mimetype → type métier ──
const getTypeFichier = (mimetype) => {
  if (mimetype.startsWith('image/'))  return 'image';
  if (mimetype === 'application/pdf') return 'document';
  return 'autre';
};

// ── Helper : uploader un fichier vers ImgBB ──
const uploaderVerImgBB = async (file) => {
  // ImgBB n'accepte que les images — bloquer les PDFs explicitement
  if (!file.mimetype.startsWith('image/')) {
    throw new Error(`Type non supporté par ImgBB : ${file.mimetype}`);
  }

  const formData = new FormData();
  formData.append('image', file.buffer.toString('base64'));
  formData.append('name',  file.originalname);

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
    formData,
    {
      headers: formData.getHeaders(),
      timeout: 15000, // CORRECTION : timeout 15s — évite les requêtes bloquées
    }
  );

  if (!response.data?.success) {
    throw new Error(response.data?.error?.message || 'Échec ImgBB');
  }

  return {
    url:  response.data.data.url,
    nom:  file.originalname,
    type: getTypeFichier(file.mimetype), // CORRECTION : type métier
  };
};

// ─────────────────────────────────────────
// @route   POST /api/upload
// @access  Privé
// ─────────────────────────────────────────
const uploadFichiers = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: ' Aucun fichier reçu' });
    }

    // CORRECTION : Promise.allSettled — un échec n'annule pas les autres
    const resultats = await Promise.allSettled(
      req.files.map(file => uploaderVerImgBB(file))
    );

    const fichiers = [];
    const echecs   = [];

    resultats.forEach((resultat, index) => {
      if (resultat.status === 'fulfilled') {
        fichiers.push(resultat.value);
      } else {
        echecs.push({
          fichier: req.files[index].originalname,
          erreur:  resultat.reason?.message || 'Erreur inconnue',
        });
      }
    });

    if (fichiers.length === 0) {
      return res.status(500).json({
        message: ' Tous les uploads ont échoué',
        echecs,
      });
    }

    const statusCode = echecs.length > 0 ? 207 : 200;

    res.status(statusCode).json({
      message: fichiers.length === req.files.length
        ? ' Fichiers uploadés avec succès'
        : ` ${fichiers.length}/${req.files.length} fichier(s) uploadé(s)`,
      fichiers,
      ...(echecs.length > 0 && { echecs }),
    });

  } catch (error) {
    console.error('uploadFichiers:', error.message);
    res.status(500).json({ message: ' Erreur serveur lors de l\'upload' });
  }
};

module.exports = { uploadFichiers };