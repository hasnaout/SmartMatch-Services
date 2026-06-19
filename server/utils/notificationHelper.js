const Notification = require('../models/Notification');

const creerNotification = async (io, { destinataire, type, titre, message, lien = '' }) => {
  try {
    const notif = await Notification.create({
      destinataire, type, titre, message, lien,
    });

    io.to(`user_${destinataire}`).emit('nouvelle_notification', {
      _id:       notif._id,
      type:      notif.type,
      titre:     notif.titre,
      message:   notif.message,
      lien:      notif.lien,
      lu:        false,
      createdAt: notif.createdAt,
    });

    return notif;
  } catch (error) {
    console.error('  Erreur notification:', error.message);
  }
};

module.exports = { creerNotification };
