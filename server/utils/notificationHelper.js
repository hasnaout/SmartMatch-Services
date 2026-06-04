const Notification = require('../models/Notification');

// Types valides — miroir de l'enum du modèle Notification
const TYPES_VALIDES = new Set([
  'nouvelle_demande',
  'demande_acceptee',
  'demande_terminee',
  'nouveau_message',
  'nouvel_avis',
  'compte_verifie',
  'paiement_recu',
  'profil_verifie',
]);

// ─────────────────────────────────────────
// Helper principal : créer une notification en base + émettre via Socket.io
//
// @param {Object} io          — instance Socket.io (peut être null)
// @param {Object} params      — données de la notification
// @returns {Notification}     — document créé
// @throws {Error}             — si la création échoue (re-throw pour le caller)
// ─────────────────────────────────────────
const creerNotification = async (io, {
  destinataire,
  type,
  titre,
  message,
  lien     = null,   // CORRECTION 1 : null au lieu de ''
  metadata = null,   // CORRECTION 2 : support metadata
}) => {
  // CORRECTION 3 : validation du type avant insertion
  if (!TYPES_VALIDES.has(type)) {
    throw new Error(`Type de notification invalide : "${type}"`);
  }

  if (!destinataire) {
    throw new Error('destinataire est obligatoire pour creerNotification');
  }

  // Création en base
  const notif = await Notification.create({
    destinataire,
    type,
    titre,
    message,
    lien,
    metadata,
  });

  // CORRECTION 4 : guard sur io — Socket.io peut être absent en test/CLI
  if (io) {
    try {
      io.to(`user_${destinataire}`).emit('nouvelle_notification', {
        _id:       notif._id,
        type:      notif.type,
        titre:     notif.titre,
        message:   notif.message,
        lien:      notif.lien,
        lu:        false,
        createdAt: notif.createdAt,
        metadata:  notif.metadata,
      });
    } catch (socketError) {
      // Échec Socket.io non bloquant — la notif est déjà en base
      console.error('⚠️ Socket.io emit échoué:', socketError.message);
    }
  }

  // CORRECTION 5 : retourner la notif sans catch silencieux
  // Le caller est responsable de gérer l'erreur
  return notif;
};

// ─────────────────────────────────────────
// Helper batch : envoyer la même notification à plusieurs destinataires
// Usage : notifier tous les admins, tous les prestataires d'une catégorie
// ─────────────────────────────────────────
const creerNotificationsBatch = async (io, destinataires, params) => {
  if (!Array.isArray(destinataires) || destinataires.length === 0) return [];

  const resultats = await Promise.allSettled(
    destinataires.map(destinataire =>
      creerNotification(io, { ...params, destinataire })
    )
  );

  const succes = resultats.filter(r => r.status === 'fulfilled').length;
  const echecs = resultats.filter(r => r.status === 'rejected').length;

  if (echecs > 0) {
    console.error(`⚠️ Notifications batch : ${succes} succès, ${echecs} échecs`);
  }

  return resultats
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
};

module.exports = { creerNotification, creerNotificationsBatch };