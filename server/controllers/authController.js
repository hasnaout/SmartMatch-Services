const jwt         = require('jsonwebtoken');
const User        = require('../models/User');
const Prestataire = require('../models/Prestataire');

// ── Vérification critique au démarrage ──
if (!process.env.JWT_SECRET) {
  console.error('  FATAL : JWT_SECRET non défini');
  process.exit(1);
}

// ─────────────────────────────────────────
// Helper : générer un token JWT signé
// CORRECTION 1 : fallback explicite sur JWT_EXPIRES_IN
// ─────────────────────────────────────────
const generateToken = (id) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'; // fallback sécurisé
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// Helper : formater l'objet user pour la réponse (DRY)
const formatUserResponse = (user) => ({
  id:         user._id,
  nom:        user.nom,
  prenom:     user.prenom,
  email:      user.email,
  role:       user.role,
  isVerified: user.isVerified,
  avatar:     user.avatar,
});

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role, telephone } = req.body;

    // CORRECTION 2 : validation explicite des champs
    if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !password || !role) {
      return res.status(400).json({ message: '  Tous les champs sont obligatoires' });
    }

    // CORRECTION 3 : forcer uniquement client/prestataire — jamais admin
    if (!['client', 'prestataire'].includes(role)) {
      return res.status(400).json({ message: '  Rôle invalide' });
    }

    // Vérification email existant
    const userExiste = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExiste) {
      return res.status(400).json({ message: '  Cet email est déjà utilisé' });
    }

    // Création de l'utilisateur (password hashé via pre('save'))
    const user = await User.create({
      nom:       nom.trim(),
      prenom:    prenom.trim(),
      email:     email.toLowerCase().trim(),
      password,
      role,
      telephone: telephone?.trim(),
    });

    // Créer le profil prestataire si nécessaire
    if (role === 'prestataire') {
      await Prestataire.create({ user: user._id });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      message: '  Compte créé avec succès',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    // CORRECTION 4 : erreur de validation Mongoose → 400 au lieu de 500
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    // Doublon email (index unique)
    if (error.code === 11000) {
      return res.status(400).json({ message: '  Cet email est déjà utilisé' });
    }
    console.error('  register:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '  Email et mot de passe requis' });
    }

    // Récupérer les champs sécurisés nécessaires
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password +loginAttempts +lockUntil');

    if (!user) {
      // Réponse générique — anti-user enumeration
      return res.status(401).json({ message: '  Email ou mot de passe incorrect' });
    }

    // CORRECTION 5 : vérifier le verrouillage anti-brute-force
    if (user.isLocked()) {
      const minutesRestantes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `  Compte temporairement verrouillé. Réessayez dans ${minutesRestantes} minute(s)`,
        code:    'ACCOUNT_LOCKED',
      });
    }

    const passwordCorrect = await user.comparePassword(password);

    if (!passwordCorrect) {
      // CORRECTION 6 : incrémenter les tentatives échouées
      await user.incrementLoginAttempts();
      return res.status(401).json({ message: '  Email ou mot de passe incorrect' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: '  Compte suspendu — contactez l\'administrateur',
      });
    }

    // CORRECTION 7 : réinitialiser les tentatives après succès
    await user.resetLoginAttempts();

    const token = generateToken(user._id);

    res.status(200).json({
      message: '  Connexion réussie',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('  login:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Privé
// ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // CORRECTION 8 : req.user est déjà disponible via protect — pas de requête DB
    // On fait quand même une requête pour avoir les données fraîches + avatar
    const user = await User.findById(req.user.id)
      .select('nom prenom email role isVerified isActive avatar telephone')
      .lean();

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('  getMe:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/mot-de-passe-oublie
// @access  Public
// ─────────────────────────────────────────
const motDePasseOublie = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: '  Email requis' });
    }

    // Réponse générique dans tous les cas — anti-user enumeration
    const REPONSE_GENERIQUE = {
      message: '  Si cet email existe, un code de réinitialisation a été envoyé',
    };

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+resetCode +resetCodeExpire');

    if (!user) {
      return res.status(200).json(REPONSE_GENERIQUE);
    }

    // CORRECTION 9 : utiliser genererResetCode() du modèle (hash SHA-256)
    const codeEnClair = user.genererResetCode();
    await user.save({ validateBeforeSave: false });

    // En développement : retourner le code dans la réponse
    // En production : envoyer par email (Nodemailer / SendGrid)
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        ...REPONSE_GENERIQUE,
        code: codeEnClair, // visible uniquement en dev
      });
    }

    // TODO production : await envoyerEmailReset(user.email, codeEnClair);
    res.status(200).json(REPONSE_GENERIQUE);
  } catch (error) {
    console.error('  motDePasseOublie:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/reinitialiser-mot-de-passe
// @access  Public
// ─────────────────────────────────────────
const reinitialiserMotDePasse = async (req, res) => {
  try {
    const { email, code, nouveauMotDePasse } = req.body;

    if (!email || !code || !nouveauMotDePasse) {
      return res.status(400).json({ message: '  Tous les champs sont requis' });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({
        message: '  Le mot de passe doit contenir au moins 6 caractères',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+resetCode +resetCodeExpire +password');

    if (!user) {
      return res.status(400).json({ message: '  Code invalide ou expiré' });
    }

    // CORRECTION 10 : utiliser verifierResetCode() — compare les hashes SHA-256
    if (!user.verifierResetCode(code)) {
      return res.status(400).json({ message: '  Code invalide ou expiré' });
    }

    // Mettre à jour le mot de passe (hashé via pre('save'))
    user.password        = nouveauMotDePasse;
    user.resetCode       = undefined;
    user.resetCodeExpire = undefined;

    // Réinitialiser aussi le brute-force au cas où
    user.loginAttempts   = 0;
    user.lockUntil       = undefined;

    await user.save();

    res.status(200).json({ message: '  Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('  reinitialiserMotDePasse:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  motDePasseOublie,
  reinitialiserMotDePasse,
};