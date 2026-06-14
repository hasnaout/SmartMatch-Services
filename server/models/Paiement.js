const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema(
  {
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prestataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prestataire',
      required: true,
    },
    montant: {
      type: Number,
      required: true,
      min: 0,
    },
    devise: {
      type: String,
      default: 'MAD',
    },
    methode: {
      type: String,
      enum: ['en_ligne', 'especes'],
      required: true,
    },
    statut: {
      type: String,
      enum: ['en_attente', 'payé', 'annulé', 'remboursé'],
      default: 'en_attente',
    },
    reference: {
      type: String,
      unique: true,
    },
    datePaiement: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);


paiementSchema.pre('save', function () {
  if (!this.reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random    = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.reference  = `SM-${timestamp}-${random}`;
  }
});

module.exports = mongoose.model('Paiement', paiementSchema);
