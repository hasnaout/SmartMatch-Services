const axios    = require('axios');
const FormData = require('form-data');

const uploadFichiers = async (req, res) => {
  try {
    console.log(' Fichiers reçus:', req.files?.length);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '  Aucun fichier reçu' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const formData = new FormData();
      // ImgBB attend le fichier en base64 via le champ "image"
      formData.append('image', file.buffer.toString('base64'));

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      return {
        url:  response.data.data.url,
        nom:  file.originalname,
        type: file.mimetype,
      };
    });

    const fichiers = await Promise.all(uploadPromises);
    console.log('   Fichiers uploadés:', fichiers.map(f => f.nom));

    res.status(200).json({
      message: '   Fichiers uploadés avec succès',
      fichiers,
    });

  } catch (error) {
    console.error('  Erreur upload:', error.response?.data || error.message);
    res.status(500).json({ message: '  Erreur upload', error: error.message });
  }
};

module.exports = { uploadFichiers };
