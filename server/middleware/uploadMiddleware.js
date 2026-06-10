const multer = require('multer');
const path   = require('path');

// memoryStorage — ImgBB reçoit le buffer en base64
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|pdf/;
  const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime    = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('❌ Type non autorisé (jpg, png, webp, pdf)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ message: '❌ Fichier trop lourd (5MB max)' });
      return res.status(400).json({ message: `❌ Erreur upload : ${err.message}` });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

module.exports = {
  uploadMultiple: handleUploadError(upload.array('fichiers', 5)),
};
