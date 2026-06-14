const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '  Non autorisé, token manquant' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: '  Utilisateur introuvable' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: '  Compte suspendu' });
    }


    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
    };
    return next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '  Token expiré, reconnectez-vous' });
    }
    return res.status(401).json({ message: '  Token invalide' });
  }
};

module.exports = { protect };
