const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema(
  {
    client: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le client est obligatoire'],
    },
    titre: {
      type:      String,
      required:  [true, 'Le titre est obligatoire'],
      trim:      true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères'],
    },
    description: {
      type:      String,
      required:  [true, 'La description est obligatoire'],
      trim:      true,
      minlength: [10,   'La description doit contenir au moins 10 caractères'],
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    },

    // CORRECTION 1 : référence vers Categorie au lieu d'une String libre
    categorie: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Categorie',
      required: [true, 'La catégorie est obligatoire'],
    },

    // CORRECTION 2 : alignement avec le validator ('haute' ajouté)
    urgence: {
      type:    String,
      enum:    ['faible', 'normale', 'haute', 'urgente'],
      default: 'normale',
    },

    budget: {
      min:    { type: Number, default: 0, min: [0, 'Le budget min ne peut pas être négatif'] },
      max:    { type: Number, default: 0, min: [0, 'Le budget max ne peut pas être négatif'] },
      devise: { type: String, default: 'MAD', enum: ['MAD', 'EUR', 'USD'] },
    },

    localisation: {
      ville:   { type: String, trim: true, maxlength: 100 },
      region:  { type: String, trim: true, maxlength: 100 },
      adresse: { type: String, trim: true, maxlength: 200 },
    },

    fichiers: [
      {
        url:  { type: String, trim: true, maxlength: 500 },
        nom:  { type: String, trim: true, maxlength: 255 },
        type: {
          type: String,
          enum: ['image', 'document', 'video', 'autre'],
          default: 'autre',
        },
      },
    ],

    statut: {
      type:    String,
      enum:    ['publiée', 'en_cours', 'terminée', 'annulée'],
      default: 'publiée',
    },

    prestatairesRecommandes: [
      {
        prestataire: {
          type: mongoose.Schema.Types.ObjectId,
          ref:  'Prestataire',
        },
        // CORRECTION 3 : contraintes sur le score de matching
        score: {
          type:    Number,
          default: 0,
          min:     [0,   'Le score ne peut pas être négatif'],
          max:     [100, 'Le score ne peut pas dépasser 100'],
        },
      },
    ],

    prestataireChoisi: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Prestataire',
      default: null,
    },

    // CORRECTION 4 : champ officiel pour éviter la double incrémentation
    // Défini ici pour être cohérent avec le controller corrigé
    dateTerminee: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true }, // exposer les virtuals dans les réponses API
    toObject:   { virtuals: true },
  }
);

// ── Index pour les requêtes les plus fréquentes ──
demandeSchema.index({ client: 1, createdAt: -1 });           // mes-demandes (client)
demandeSchema.index({ categorie: 1, statut: 1 });            // matching + disponibles
demandeSchema.index({ statut: 1, createdAt: -1 });           // dashboard admin
demandeSchema.index({ prestataireChoisi: 1, statut: 1 });    // missions prestataire

// ── Virtuals ──

// Durée de la mission en jours (de création à dateTerminee)
demandeSchema.virtual('dureeEnJours').get(function () {
  if (!this.dateTerminee) return null;
  const diff = this.dateTerminee - this.createdAt;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Statut binaire rapide — utile dans les conditions frontend
demandeSchema.virtual('estTerminee').get(function () {
  return this.statut === 'terminée';
});

demandeSchema.virtual('estActive').get(function () {
  return ['publiée', 'en_cours'].includes(this.statut);
});

// Meilleur prestataire recommandé (score le plus élevé)
demandeSchema.virtual('meilleurMatch').get(function () {
  if (!this.prestatairesRecommandes?.length) return null;
  return this.prestatairesRecommandes.reduce(
    (best, curr) => (curr.score > best.score ? curr : best)
  );
});

// ── Validation inter-champs (budget min ≤ max) ──
demandeSchema.pre('save', function (next) {
  if (
    this.budget.max > 0 &&
    this.budget.min > this.budget.max
  ) {
    return next(new Error('Le budget minimum ne peut pas dépasser le budget maximum'));
  }
  next();
});

module.exports = mongoose.model('Demande', demandeSchema);