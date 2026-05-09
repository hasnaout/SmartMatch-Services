const multer = require('multer');
const path   = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const typesAutorises = /jpeg|jpg|png|webp|pdf/;
  const extname = typesAutorises.test(path.extname(file.originalname).toLowerCase());
  const mimetype = typesAutorises.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error('❌ Type non autorisé (jpg, png, webp, pdf)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const uploadMultiple = upload.array('fichiers', 5);

const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '❌ Fichier trop lourd (5MB max)' });
      }
      return res.status(400).json({ message: `❌ Erreur upload : ${err.message}` });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

module.exports = {
  uploadMultiple: handleUploadError(uploadMultiple),
};