const mongoose = require('mongoose');

// ── Helper statique : générer un roomId déterministe et canonique ──
// Peu importe l'ordre client/prestataire, le roomId sera toujours identique
// Usage : Message.genererRoomId(demandeId, userId1, userId2)
const genererRoomId = (demandeId, userId1, userId2) => {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${demandeId}_${ids[0]}_${ids[1]}`;
};

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type:     String,
      required: [true, 'Le roomId est obligatoire'],
      trim:     true,
      // CORRECTION : validation du format attendu
      match: [
        /^[a-f\d]{24}_[a-f\d]{24}_[a-f\d]{24}$/i,
        'Format roomId invalide — attendu : demandeId_userId_userId',
      ],
    },
    expediteur: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, "L'expéditeur est obligatoire"],
    },
    destinataire: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le destinataire est obligatoire'],
    },
    demande: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Demande',
      required: [true, 'La demande associée est obligatoire'],
    },
    contenu: {
      type:      String,
      required:  [true, 'Le contenu du message est obligatoire'],
      trim:      true,
      maxlength: [2000, 'Un message ne peut pas dépasser 2000 caractères'],
    },

    // CORRECTION : remplacer lu (booléen) par un tableau de lecteurs
    // Permet de savoir précisément qui a lu le message et quand
    luspar: [
      {
        utilisateur: {
          type: mongoose.Schema.Types.ObjectId,
          ref:  'User',
        },
        luLe: {
          type:    Date,
          default: Date.now,
        },
      },
    ],

    // BONUS : support pièces jointes (cohérent avec Cloudinary)
    fichiers: [
      {
        url:  { type: String, trim: true },
        nom:  { type: String, trim: true },
        type: {
          type: String,
          enum: ['image', 'document', 'autre'],
          default: 'autre',
        },
      },
    ],

    // BONUS : permet de supprimer un message sans le perdre en DB
    supprimePar: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Index critiques pour les performances ──
// Chargement d'une conversation : roomId + tri par date
messageSchema.index({ roomId: 1, createdAt: 1 });

// Comptage des messages non lus par destinataire
messageSchema.index({ destinataire: 1, 'luspar.utilisateur': 1 });

// Lien avec le workflow demande
messageSchema.index({ demande: 1 });

// ── Méthodes d'instance ──

// Marquer comme lu par un utilisateur
messageSchema.methods.marquerLu = function (userId) {
  const dejaLu = this.luspar.some(
    l => l.utilisateur.toString() === userId.toString()
  );
  if (!dejaLu) {
    this.luspar.push({ utilisateur: userId, luLe: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

// Vérifier si lu par un utilisateur spécifique
messageSchema.methods.estLuPar = function (userId) {
  return this.luspar.some(
    l => l.utilisateur.toString() === userId.toString()
  );
};

// ── Méthodes statiques ──

// Générer le roomId canonique (exporté aussi séparément)
messageSchema.statics.genererRoomId = genererRoomId;

// Compter les messages non lus pour un utilisateur dans une room
messageSchema.statics.compterNonLus = function (roomId, userId) {
  return this.countDocuments({
    roomId,
    destinataire:        userId,
    'luspar.utilisateur': { $ne: userId },
  });
};

// Récupérer les messages d'une room avec pagination
messageSchema.statics.getMessages = function (roomId, page = 1, limit = 50) {
  return this.find({ roomId })
    .populate('expediteur', 'nom prenom avatar')
    .sort({ createdAt: -1 })          // du plus récent au plus ancien
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('Message', messageSchema);
module.exports.genererRoomId = genererRoomId;