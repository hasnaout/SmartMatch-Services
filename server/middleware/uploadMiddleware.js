const multer = require('multer');
const path   = require('path');

// ── CORRECTION 1 : Whitelist de mimetypes exacts (pas de regex approximative) ──
const MIMETYPES_AUTORISES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const EXTENSIONS_AUTORISEES = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.pdf',
]);

// ── CORRECTION 2 : Magic bytes — vérification de la vraie signature du fichier ──
// Les premiers octets révèlent le vrai type, indépendamment de l'extension
const MAGIC_BYTES = {
  'ffd8ff':   'image/jpeg',         // JPEG
  '89504e47': 'image/png',          // PNG
  '52494646': 'image/webp',         // WEBP (RIFF header)
  '25504446': 'application/pdf',    // PDF (%PDF)
};

const verifierMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.slice(0, 4).toString('hex').toLowerCase();
  return Object.keys(MAGIC_BYTES).some(magic => hex.startsWith(magic));
};

// ── Storage en mémoire (requis pour Cloudinary) ──
const storage = multer.memoryStorage();

// ── CORRECTION 3 : fileFilter avec whitelist stricte ──
const fileFilter = (req, file, cb) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const mime     = file.mimetype.toLowerCase();

  if (!EXTENSIONS_AUTORISEES.has(ext)) {
    return cb(new Error(`  Extension non autorisée : ${ext}`));
  }

  if (!MIMETYPES_AUTORISES.has(mime)) {
    return cb(new Error(`  Type MIME non autorisé : ${mime}`));
  }

  // Note : la vérification magic bytes se fait après upload (buffer disponible)
  cb(null, true);
};

// ── Configuration Multer ──
const upload = multer({
  storage,
  limits: {
    fileSize:  5 * 1024 * 1024, // 5MB par fichier
    files:     5,               // max 5 fichiers par requête
  },
  fileFilter,
});

// ── CORRECTION 4 : Sanitisation du nom de fichier ──
const sanitiserNomFichier = (originalname) => {
  return originalname
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // remplacer les caractères spéciaux
    .replace(/\.{2,}/g, '.')            // empêcher les path traversal (../../)
    .toLowerCase()
    .substring(0, 100);                 // longueur max
};

// ── CORRECTION 5 : Vérification magic bytes post-upload ──
const verifierFichiers = (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  for (const file of req.files) {
    if (!verifierMagicBytes(file.buffer)) {
      return res.status(400).json({
        message: `  Fichier corrompu ou type non autorisé : ${file.originalname}`,
      });
    }
    // Sanitiser le nom pour Cloudinary
    file.originalname = sanitiserNomFichier(file.originalname);
  }

  next();
};

// ── Wrapper de gestion d'erreurs Multer ──
const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE:  '  Fichier trop lourd — 5MB maximum par fichier',
        LIMIT_FILE_COUNT: '  Trop de fichiers — 5 fichiers maximum',
        LIMIT_UNEXPECTED_FILE: '  Champ de fichier inattendu',
      };
      return res.status(400).json({
        message: messages[err.code] || `  Erreur upload : ${err.message}`,
      });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// ── Exports ──
// uploadSingle : pour avatar, document identité (1 fichier)
// uploadMultiple : pour demandes avec pièces jointes (jusqu'à 5 fichiers)

const uploadSingleRaw   = upload.single('fichier');
const uploadMultipleRaw = upload.array('fichiers', 5);

module.exports = {
  // Usage route avatar   : uploadSingle, puis controller
  uploadSingle:   handleUploadError(uploadSingleRaw),

  // Usage route demandes : uploadMultiple, verifierFichiers, puis controller
  uploadMultiple: handleUploadError(uploadMultipleRaw),

  // Middleware de vérification magic bytes — à chaîner après upload
  verifierFichiers,

  // Utilitaire exporté pour les controllers (accès au nom sanitisé)
  sanitiserNomFichier,
};