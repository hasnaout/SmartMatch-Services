const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    titre: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
    },
    categorie: {
      type: String,
      required: [true, 'La catégorie est obligatoire'],
      trim: true,
    },
    urgence: {
      type: String,
      enum: ['faible', 'normale', 'urgente'],
      default: 'normale',
    },
    budget: {
      min:    { type: Number, default: 0 },
      max:    { type: Number, default: 0 },
      devise: { type: String, default: 'MAD' },
    },

    localisation: {
      ville:   { type: String, trim: true },
      region:  { type: String, trim: true },
      adresse: { type: String, trim: true },

      // ── Coordonnées GPS de la demande ────────────────────────────
      // Alimentées par le composant CreerDemande.jsx via
      // l'API Nominatim (OpenStreetMap) au moment de la saisie.
      // Permettent le calcul Haversine dans le moteur de matching.
      coordonnees: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },

    fichiers: [
      {
        url:  { type: String },
        nom:  { type: String },
        type: { type: String },
      },
    ],
    statut: {
      type: String,
      enum: ['publiée', 'en_cours', 'terminée', 'annulée'],
      default: 'publiée',
    },
    prestatairesRecommandes: [
      {
        prestataire: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Prestataire',
        },
        score: { type: Number, default: 0 },
      },
    ],
    prestataireChoisi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prestataire',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Demande', demandeSchema);