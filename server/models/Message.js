const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      // format : "demandeId_clientId_prestataireId"
    },
    expediteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande',
      required: true,
    },
    contenu: {
      type: String,
      required: true,
      trim: true,
    },
    lu: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);