const mongoose = require('mongoose');

const prestataireSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // un user = un profil prestataire
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    competences: [
      {
        type: String,
        trim: true,
      },
    ],
    categories: [
      {
        type: String,
        trim: true,
        // ex: 'Plomberie', 'Electricité', 'Informatique'
      },
    ],
    tarifMin: {
      type: Number,
      default: 0,
    },
    tarifMax: {
      type: Number,
      default: 0,
    },
    devise: {
      type: String,
      default: 'MAD',
    },
    zoneGeographique: {
      ville: { type: String, trim: true },
      region: { type: String, trim: true },
      rayon: { type: Number, default: 20 }, // en km
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    experience: {
      type: Number, // en années
      default: 0,
    },
    portfolio: [
      {
        titre: String,
        description: String,
        image: String,
      },
    ],
    notemoyenne: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    nombreAvis: {
      type: Number,
      default: 0,
    },
    nombreMissionsReussies: {
      type: Number,
      default: 0,
    },
    tempsReponseHeure: {
      type: Number,
      default: 24, // en heures
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Prestataire', prestataireSchema);