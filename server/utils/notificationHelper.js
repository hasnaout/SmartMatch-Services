const Notification = require('../models/Notification');

const creerNotification = async (io, { destinataire, type, titre, message, lien = '' }) => {
  try {
    console.log('📨 Création notification pour :', destinataire);

    const notif = await Notification.create({
      destinataire, type, titre, message, lien,
    });

    console.log('   Notification créée:', notif._id);
    console.log(' Envoi socket vers room:', `user_${destinataire}`);

    io.to(`user_${destinataire}`).emit('nouvelle_notification', {
      _id:       notif._id,
      type:      notif.type,
      titre:     notif.titre,
      message:   notif.message,
      lien:      notif.lien,
      lu:        false,
      createdAt: notif.createdAt,
    });

    console.log('   Socket émis');
    return notif;
  } catch (error) {
    console.error('  Erreur notification:', error.message);
  }
};

module.exports = { creerNotification };
