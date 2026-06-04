const mongoose = require('mongoose');
const crypto   = require('crypto'); // CORRECTION 1 : crypto natif Node.js

const paiementSchema = new mongoose.Schema(
  {
    demande: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Demande',
      required: [true, 'La demande est obligatoire'],
    },
    client: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le client est obligatoire'],
    },
    prestataire: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Prestataire',
      required: [true, 'Le prestataire est obligatoire'],
    },
    montant: {
      type:     Number,
      required: [true, 'Le montant est obligatoire'],
      min:      [0.01, 'Le montant doit être supérieur à 0'],
      max:      [100000, 'Le montant ne peut pas dépasser 100 000'],
    },
    devise: {
      type:    String,
      default: 'MAD',
      // CORRECTION 2 : enum sur la devise
      enum:    ['MAD', 'EUR', 'USD'],
    },
    methode: {
      type:     String,
      enum:     ['en_ligne', 'especes', 'virement', 'carte'],
      required: [true, 'La méthode de paiement est obligatoire'],
    },
    statut: {
      type:    String,
      enum:    ['en_attente', 'payé', 'annulé', 'remboursé'],
      default: 'en_attente',
    },
    reference: {
      type:   String,
      unique: true,
      // Générée automatiquement dans pre('save') — ne pas fournir manuellement
    },
    datePaiement: {
      type:    Date,
      default: null,
    },
    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères'],
    },

    // CORRECTION 3 : historique des transitions de statut
    historiqueStatuts: [
      {
        statut:    { type: String, enum: ['en_attente', 'payé', 'annulé', 'remboursé'] },
        changedAt: { type: Date,   default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        raison:    { type: String, trim: true, maxlength: 200 },
      },
    ],

    // BONUS : référence externe (ID Stripe, CIH, CMI, etc.)
    referenceExterne: {
      type:    String,
      trim:    true,
      default: null,
    },

    // BONUS : commission plateforme SmartMatch (%)
    commission: {
      taux:    { type: Number, default: 0, min: 0, max: 100 },
      montant: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Index ──
paiementSchema.index({ client:      1, createdAt: -1 }); // historique client
paiementSchema.index({ prestataire: 1, createdAt: -1 }); // historique prestataire
paiementSchema.index({ demande:     1 }, { unique: true }); // un paiement par demande
paiementSchema.index({ statut:      1, createdAt: -1 }); // dashboard admin

// ── Virtual : montant net prestataire après commission ──
paiementSchema.virtual('montantNet').get(function () {
  return Math.round((this.montant - this.commission.montant) * 100) / 100;
});

// ── Virtual : libellé lisible du statut ──
paiementSchema.virtual('statutLabel').get(function () {
  const labels = {
    en_attente: 'En attente',
    payé:       'Payé',
    annulé:     'Annulé',
    remboursé:  'Remboursé',
  };
  return labels[this.statut] || this.statut;
});

// ── CORRECTION 4 : génération de référence via crypto (pas de collision) ──
const genererReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  // 4 octets aléatoires cryptographiquement sûrs → 8 chars hex
  const random    = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SM-${timestamp}-${random}`;
};

// ── CORRECTION 5 : pre('save') avec next() explicite ──
paiementSchema.pre('save', function (next) {
  // Générer la référence uniquement à la création
  if (this.isNew) {
    this.reference = genererReference();

    // Enregistrer l'état initial dans l'historique
    this.historiqueStatuts.push({
      statut:    this.statut,
      changedAt: new Date(),
    });
  }
  next();
});

// ── CORRECTION 6 : intercepter E11000 sur reference ──
paiementSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Référence de paiement en conflit — veuillez réessayer'));
  } else {
    next(error);
  }
});

// ── Méthode d'instance : changer le statut avec traçabilité ──
paiementSchema.methods.changerStatut = async function (nouveauStatut, userId, raison = '') {
  const statutsValides = ['en_attente', 'payé', 'annulé', 'remboursé'];
  if (!statutsValides.includes(nouveauStatut)) {
    throw new Error(`Statut invalide : ${nouveauStatut}`);
  }

  this.statut = nouveauStatut;

  // Mettre à jour datePaiement si confirmé
  if (nouveauStatut === 'payé') {
    this.datePaiement = new Date();
  }

  // Ajouter à l'historique
  this.historiqueStatuts.push({
    statut:    nouveauStatut,
    changedAt: new Date(),
    changedBy: userId,
    raison,
  });

  return this.save();
};

// ── Méthode statique : stats financières pour le dashboard admin ──
paiementSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id:            '$statut',
        total:          { $sum: '$montant' },
        count:          { $sum: 1 },
        moyenneMontant: { $avg: '$montant' },
      },
    },
  ]);
};

module.exports = mongoose.model('Paiement', paiementSchema);