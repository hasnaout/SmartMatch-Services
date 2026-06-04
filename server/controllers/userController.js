const User = require('../models/User');

// ─────────────────────────────────────────
// @route   GET /api/users/profil
// @access  Privé
// ─────────────────────────────────────────
const getProfil = async (req, res) => {
  try {
    // CORRECTION 1 : req.user.id (string) — cohérent avec tous les controllers
    // CORRECTION 2 : select explicite + lean pour la performance
    const user = await User.findById(req.user.id)
      .select('nom prenom email telephone avatar role isVerified isActive createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ message: '❌ Utilisateur introuvable' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ getProfil:', error.message);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/users/profil
// @access  Privé
// ─────────────────────────────────────────
const updateProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone } = req.body;

    // CORRECTION 3 : construction dynamique — ne mettre à jour que les champs fournis
    const miseAJour = {};
    if (nom       !== undefined) miseAJour.nom       = nom.trim();
    if (prenom    !== undefined) miseAJour.prenom     = prenom.trim();
    if (telephone !== undefined) miseAJour.telephone  = telephone.trim();

    if (Object.keys(miseAJour).length === 0) {
      return res.status(400).json({ message: '❌ Aucun champ à mettre à jour' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: miseAJour },
      {
        new:           true,
        runValidators: true, // CORRECTION 4 : déclencher maxlength, regex téléphone
        select:        'nom prenom email telephone avatar role isVerified',
      }
    );

    if (!user) {
      return res.status(404).json({ message: '❌ Utilisateur introuvable' });
    }

    res.status(200).json({ message: '✅ Profil mis à jour', user });
  } catch (error) {
    // CORRECTION 5 : erreurs de validation Mongoose → 400
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('❌ updateProfil:', error.message);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/users/avatar
// @access  Privé
// CORRECTION 6 : endpoint dédié à la mise à jour de l'avatar
// ─────────────────────────────────────────
const updateAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl?.trim()) {
      return res.status(400).json({ message: '❌ URL de l\'avatar requise' });
    }

    // Validation basique d'URL
    try {
      new URL(avatarUrl);
    } catch {
      return res.status(400).json({ message: '❌ URL de l\'avatar invalide' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: avatarUrl.trim() } },
      { new: true, select: 'nom prenom email avatar' }
    );

    if (!user) {
      return res.status(404).json({ message: '❌ Utilisateur introuvable' });
    }

    res.status(200).json({ message: '✅ Avatar mis à jour', user });
  } catch (error) {
    console.error('❌ updateAvatar:', error.message);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/users/mot-de-passe
// @access  Privé
// CORRECTION 7 : changement de mot de passe authentifié
// ─────────────────────────────────────────
const changerMotDePasse = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return res.status(400).json({
        message: '❌ Ancien et nouveau mot de passe requis',
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        message: '❌ Le nouveau mot de passe doit contenir au moins 6 caractères',
      });
    }

    if (ancienMotDePasse === nouveauMotDePasse) {
      return res.status(400).json({
        message: '❌ Le nouveau mot de passe doit être différent de l\'ancien',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: '❌ Utilisateur introuvable' });
    }

    const correct = await user.comparePassword(ancienMotDePasse);
    if (!correct) {
      return res.status(401).json({ message: '❌ Ancien mot de passe incorrect' });
    }

    // pre('save') hashera automatiquement le nouveau mot de passe
    user.password = nouveauMotDePasse;
    await user.save();

    res.status(200).json({ message: '✅ Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('❌ changerMotDePasse:', error.message);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
};

module.exports = {
  getProfil,
  updateProfil,
  updateAvatar,
  changerMotDePasse,
};