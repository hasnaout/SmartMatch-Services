const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'nouvelle_demande',
        'demande_acceptee',
        'demande_terminee',
        'nouveau_message',
        'nouvel_avis',
        'compte_verifie',
      ],
      required: true,
    },
    titre:   { type: String, required: true },
    message: { type: String, required: true },
    lu:      { type: Boolean, default: false },
    lien:    { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
