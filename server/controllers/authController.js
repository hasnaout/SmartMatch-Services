const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Prestataire = require('../models/Prestataire');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};


const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role, telephone } = req.body;

    if (!nom || !prenom || !email || !password || !role) {
      return res.status(400).json({ message: '  Tous les champs sont obligatoires' });
    }

    if (!['client', 'prestataire'].includes(role)) {
      return res.status(400).json({ message: '  Rôle invalide' });
    }

    const userExiste = await User.findOne({ email });
    if (userExiste) {
      return res.status(400).json({ message: '  Cet email est déjà utilisé' });
    }

    const user = await User.create({ nom, prenom, email, password, role, telephone });

    if (role === 'prestataire') {
      await Prestataire.create({ user: user._id });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      message: '   Compte créé avec succès',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ message: '  Email et mot de passe requis' });
    }


    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '  Email ou mot de passe incorrect' });
    }


    const passwordCorrect = await user.comparePassword(password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: '  Email ou mot de passe incorrect' });
    }


    if (!user.isActive) {
      return res.status(403).json({ message: '  Compte suspendu, contactez l\'administrateur' });
    }


    const token = generateToken(user._id);

    res.status(200).json({
      message: '   Connexion réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const crypto = require('crypto');


const motDePasseOublie = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: '  Email requis' });
    }

    const user = await User.findOne({ email });
    if (!user) {

      return res.status(200).json({
        message: '   Si cet email existe, un code a été envoyé',
      });
    }


    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = Date.now() + 15 * 60 * 1000;


    user.resetCode       = code;
    user.resetCodeExpire = expiration;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: '   Code de réinitialisation généré.',
      code,
    });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const reinitialiserMotDePasse = async (req, res) => {
  try {
    const { email, code, nouveauMotDePasse } = req.body;

    if (!email || !code || !nouveauMotDePasse) {
      return res.status(400).json({ message: '  Tous les champs sont requis' });
    }

    const user = await User.findOne({
      email,
      resetCode:       code,
      resetCodeExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: '  Code invalide ou expiré' });
    }

    user.password        = nouveauMotDePasse;
    user.resetCode       = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    res.status(200).json({ message: '   Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = { register, login, getMe, motDePasseOublie, reinitialiserMotDePasse };
