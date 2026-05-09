const User = require('../models/User');

const getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

const updateProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nom, prenom, telephone },
      { new: true }
    );
    res.status(200).json({ message: '✅ Profil mis à jour', user });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

module.exports = { getProfil, updateProfil };