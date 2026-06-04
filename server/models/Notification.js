const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    destinataire: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le destinataire est obligatoire'],
    },
    type: {
      type:     String,
      required: [true, 'Le type est obligatoire'],
      enum:     [
        'nouvelle_demande',
        'demande_acceptee',
        'demande_terminee',
        'nouveau_message',
        'nouvel_avis',
        'compte_verifie',
        'paiement_recu',      // BONUS : cohérent avec le module paiement
        'profil_verifie',     // BONUS : validation admin du prestataire
      ],
    },
    titre: {
      type:      String,
      required:  [true, 'Le titre est obligatoire'],
      trim:      true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
    },
    message: {
      type:      String,
      required:  [true, 'Le message est obligatoire'],
      trim:      true,
      maxlength: [500, 'Le message ne peut pas dépasser 500 caractères'],
    },
    lu: {
      type:    Boolean,
      default: false,
    },
    // CORRECTION 1 : traquer quand la notification a été lue
    luLe: {
      type:    Date,
      default: null,
    },
    // CORRECTION 2 : null au lieu de '' pour les liens absents
    lien: {
      type:    String,
      trim:    true,
      default: null,
      maxlength: [200, 'Le lien ne peut pas dépasser 200 caractères'],
    },

    // BONUS : données contextuelles pour enrichir la notification
    // ex: { demandeId, prestataireId } pour construire le lien dynamiquement
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Index critiques ──

// Requête principale : notifications d'un user, triées par date
notificationSchema.index({ destinataire: 1, createdAt: -1 });

// Comptage des non lues (badge UI)
notificationSchema.index({ destinataire: 1, lu: 1 });

// CORRECTION 3 : TTL — suppression automatique après 90 jours
// MongoDB supprime les documents où createdAt < now - 90j
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 } // 90 jours
);

// ── Méthodes statiques ──

// Récupérer les notifications d'un user (paginées)
notificationSchema.statics.getForUser = function (userId, page = 1, limit = 20) {
  return this.find({ destinataire: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(); // lean() = objet JS pur, plus rapide pour la lecture seule
};

// Compter les non lues (pour le badge)
notificationSchema.statics.compterNonLues = function (userId) {
  return this.countDocuments({ destinataire: userId, lu: false });
};

// Marquer toutes les notifications d'un user comme lues
notificationSchema.statics.toutMarquerLu = function (userId) {
  return this.updateMany(
    { destinataire: userId, lu: false },
    { $set: { lu: true, luLe: new Date() } }
  );
};

// Marquer une seule notification comme lue
notificationSchema.statics.marquerUneLue = function (notifId, userId) {
  return this.findOneAndUpdate(
    { _id: notifId, destinataire: userId }, // sécurité : vérifier ownership
    { $set: { lu: true, luLe: new Date() } },
    { new: true }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);