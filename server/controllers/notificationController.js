const Notification = require('../models/Notification');

// ─────────────────────────────────────────
// @route   GET /api/notifications
// @access  Privé
// ─────────────────────────────────────────
const getMesNotifications = async (req, res) => {
  try {
    // CORRECTION 1 : pagination dynamique
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * Number(limit);

    // CORRECTION 2 : Promise.all — deux requêtes en parallèle
    const [notifications, nonLus, total] = await Promise.all([
      Notification.find({ destinataire: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      // CORRECTION 3 : utiliser la méthode statique du modèle
      Notification.compterNonLues(req.user.id),

      Notification.countDocuments({ destinataire: req.user.id }),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      nonLus,
      notifications,
    });
  } catch (error) {
    console.error('  getMesNotifications:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/notifications/lire-tout
// @access  Privé
// ─────────────────────────────────────────
const lireTout = async (req, res) => {
  try {
    // CORRECTION 4 : méthode statique centralisée + luLe mis à jour
    const result = await Notification.toutMarquerLu(req.user.id);

    res.status(200).json({
      message:  '  Toutes les notifications lues',
      modifiees: result.modifiedCount,
    });
  } catch (error) {
    console.error('  lireTout:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/notifications/:id/lire
// @access  Privé
// ─────────────────────────────────────────
const lireNotification = async (req, res) => {
  try {
    // CORRECTION 5 : méthode statique + vérification ownership intégrée
    const notif = await Notification.marquerUneLue(req.params.id, req.user.id);

    if (!notif) {
      return res.status(404).json({
        message: '  Notification introuvable ou non autorisée',
      });
    }

    res.status(200).json({ message: '  Notification lue', notification: notif });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant de notification invalide' });
    }
    console.error('  lireNotification:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/notifications/:id
// @access  Privé
// CORRECTION 6 : suppression manuelle d'une notification
// ─────────────────────────────────────────
const supprimerNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id:          req.params.id,
      destinataire: req.user.id, // ownership vérifié dans le filtre
    });

    if (!notif) {
      return res.status(404).json({
        message: '  Notification introuvable ou non autorisée',
      });
    }

    res.status(200).json({ message: '  Notification supprimée' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant invalide' });
    }
    console.error('  supprimerNotification:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/notifications
// @access  Privé
// CORRECTION 7 : vider toutes ses notifications
// ─────────────────────────────────────────
const viderNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ destinataire: req.user.id });

    res.status(200).json({
      message:    'Toutes les notifications supprimées',
      supprimees: result.deletedCount,
    });
  } catch (error) {
    console.error(' viderNotifications:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

module.exports = {
  getMesNotifications,
  lireTout,
  lireNotification,
  supprimerNotification,
  viderNotifications,
};