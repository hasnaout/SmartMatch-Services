const Notification = require('../models/Notification');


const getMesNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      destinataire: req.user._id,
    }).sort({ createdAt: -1 }).limit(20);

    const nonLus = await Notification.countDocuments({
      destinataire: req.user._id,
      lu: false,
    });

    res.status(200).json({ notifications, nonLus });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const lireTout = async (req, res) => {
  try {
    await Notification.updateMany(
      { destinataire: req.user._id, lu: false },
      { lu: true }
    );
    res.status(200).json({ message: '   Toutes les notifications lues' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const lireNotification = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { lu: true });
    res.status(200).json({ message: '   Notification lue' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = { getMesNotifications, lireTout, lireNotification };
