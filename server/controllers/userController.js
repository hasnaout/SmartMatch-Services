const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
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
    res.status(200).json({ message: '   Profil mis à jour', user });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const changerMotDePasse = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse, confirmation } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmation) {
      return res.status(400).json({ message: '  Tous les champs sont obligatoires' });
    }

    if (nouveauMotDePasse !== confirmation) {
      return res.status(400).json({ message: '  Les nouveaux mots de passe ne correspondent pas' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: '  Le mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    const correct = await user.comparePassword(ancienMotDePasse);
    if (!correct) {
      return res.status(401).json({ message: '  Ancien mot de passe incorrect' });
    }

    user.password = nouveauMotDePasse;
    await user.save();

    res.status(200).json({ message: '   Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const demanderSuppression = async (req, res) => {
  try {
    const { raison } = req.body;

    if (!raison || raison.trim().length < 10) {
      return res.status(400).json({
        message: '  Veuillez préciser la raison (minimum 10 caractères)',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    if (user.demandeSuppressionStatut === 'en_attente') {
      return res.status(400).json({
        message: '  Vous avez déjà une demande de suppression en attente',
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      demandeSuppressionStatut: 'en_attente',
      demandeSuppressionRaison: raison.trim(),
      demandeSuppressionDate:   new Date(),
    });

    res.status(200).json({ message: '   Votre demande de suppression a été transmise à l\'administrateur' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const annulerDemandeSuppressionUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '  Utilisateur introuvable' });

    if (user.demandeSuppressionStatut !== 'en_attente') {
      return res.status(400).json({ message: '  Aucune demande en attente à annuler' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      demandeSuppressionStatut: null,
      demandeSuppressionRaison: null,
      demandeSuppressionDate:   null,
    });

    res.status(200).json({ message: '   Demande de suppression annulée' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = { getProfil, updateProfil, changerMotDePasse, demanderSuppression, annulerDemandeSuppressionUser };
