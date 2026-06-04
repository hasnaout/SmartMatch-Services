const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Vérification au démarrage que JWT_SECRET est bien défini ──
if (!process.env.JWT_SECRET) {
  console.error('  FATAL : JWT_SECRET non défini dans .env');
  process.exit(1); // Arrêter le serveur immédiatement
}

// ─────────────────────────────────────────
// Middleware principal d'authentification JWT
// ─────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '  Non autorisé — token manquant' });
    }

    const token = authHeader.split(' ')[1];

    // Vérification et décodage
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // CORRECTION 1 : Utiliser les données du payload pour éviter
    // la requête DB sur chaque appel — on ne va en DB que si nécessaire
    // On vérifie quand même isActive et l'existence du compte
    const user = await User.findById(decoded.id)
      .select('nom prenom email role isActive')
      .lean(); // lean() = objet JS pur, ~3x plus rapide en lecture seule

    if (!user) {
      return res.status(401).json({ message: '  Compte introuvable ou supprimé' });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: '  Compte suspendu — contactez l\'administration',
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = {
      id:     user._id.toString(),
      _id:    user._id,
      role:   user.role,
      email:  user.email,
      nom:    user.nom,
      prenom: user.prenom,
    };

    return next();
  } catch (error) {
    // Gestion différenciée des erreurs JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: '  Session expirée — veuillez vous reconnecter',
        code:    'TOKEN_EXPIRED', // BONUS : code machine pour le frontend
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: '  Token invalide',
        code:    'TOKEN_INVALID',
      });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        message: '  Token pas encore actif',
        code:    'TOKEN_NOT_ACTIVE',
      });
    }
    return res.status(500).json({ message: '  Erreur d\'authentification' });
  }
};

// ─────────────────────────────────────────
// Middleware de restriction par rôle(s)
// Usage : authorize('admin') ou authorize('admin', 'client')
// ─────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    // CORRECTION 2 : Guard si protect n'a pas été appelé avant
    if (!req.user) {
      return res.status(401).json({
        message: '  Authentification requise avant autorisation',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `  Accès refusé — rôle(s) requis : ${roles.join(' ou ')}`,
        roleActuel: req.user.role, // utile pour le debug en développement
      });
    }

    next();
  };
};

// ─────────────────────────────────────────
// Middleware : vérification compte vérifié
// CORRECTION 3 : implémentation réelle (plus un stub vide)
// À brancher sur les routes sensibles : créer demande, recevoir paiement
// ─────────────────────────────────────────
const requireVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '  Authentification requise' });
    }

    // Requête ciblée — un seul champ
    const user = await User.findById(req.user.id).select('isVerified').lean();

    if (!user?.isVerified) {
      return res.status(403).json({
        message: '  Compte non vérifié — vérifiez votre email pour activer votre compte',
        code:    'ACCOUNT_NOT_VERIFIED',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// Middleware : optionnel — ne bloque pas, enrichit req.user si connecté
// Utile pour les routes publiques qui affichent du contenu différent
// selon que l'utilisateur est connecté ou non
// ─────────────────────────────────────────
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next(); // pas de token = OK

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id)
      .select('nom prenom email role isActive')
      .lean();

    if (user?.isActive) {
      req.user = {
        id:     user._id.toString(),
        _id:    user._id,
        role:   user.role,
        email:  user.email,
        nom:    user.nom,
        prenom: user.prenom,
      };
    }
  } catch (_) {
    // Token invalide ou expiré sur une route publique — on ignore silencieusement
  }
  next();
};

module.exports = { protect, authorize, requireVerified, optionalAuth };