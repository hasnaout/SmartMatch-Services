const mongoose = require('mongoose');

const prestataireSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Le compte utilisateur est obligatoire'],
      unique:   true,
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères'],
    },
    competences: [
      {
        type:      String,
        trim:      true,
        maxlength: 50,
      },
    ],

    // CORRECTION 1 : référence ObjectId vers Categorie (cohérence avec Demande)
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Categorie',
      },
    ],

    // CORRECTION 2 : regroupement cohérent avec le budget de Demande
    tarif: {
      min:    { type: Number, default: 0, min: [0, 'Le tarif min ne peut pas être négatif'] },
      max:    { type: Number, default: 0, min: [0, 'Le tarif max ne peut pas être négatif'] },
      devise: { type: String, default: 'MAD', enum: ['MAD', 'EUR', 'USD'] },
    },

    zoneGeographique: {
      ville:  { type: String, trim: true, maxlength: 100 },
      region: { type: String, trim: true, maxlength: 100 },
      rayon:  { type: Number, default: 20, min: [1, 'Le rayon minimum est 1 km'], max: [500, 'Le rayon maximum est 500 km'] },
    },

    disponible: {
      type:    Boolean,
      default: true,
    },

    experience: {
      type:    Number,
      default: 0,
      min:     [0,  "L'expérience ne peut pas être négative"],
      max:     [60, "L'expérience ne peut pas dépasser 60 ans"],
    },

    portfolio: {
      type: [
        {
          titre:       { type: String, trim: true, maxlength: 100 },
          description: { type: String, trim: true, maxlength: 500 },
          image:       {
            type:  String,
            trim:  true,
            match: [/^https?:\/\/.+/, 'URL image invalide'],
          },
        },
      ],
      // CORRECTION 3 : limite du nombre d'entrées portfolio
      validate: {
        validator: function (val) { return val.length <= 10; },
        message:   'Le portfolio ne peut pas contenir plus de 10 projets',
      },
    },

    // CORRECTION 4 : noteMoyenne en camelCase — cohérence avec Avis.js
    noteMoyenne: {
      type:    Number,
      default: 0,
      min:     [0, 'La note ne peut pas être négative'],
      max:     [5, 'La note ne peut pas dépasser 5'],
    },

    nombreAvis: {
      type:    Number,
      default: 0,
      min:     0,
    },

    nombreMissionsReussies: {
      type:    Number,
      default: 0,
      min:     0,
    },

    tempsReponseHeure: {
      type:    Number,
      default: 24,
      min:     [1,    'Le temps de réponse minimum est 1 heure'],
      max:     [168,  'Le temps de réponse maximum est 168 heures (1 semaine)'],
    },

    // BONUS : statut de vérification du prestataire (documents, diplômes)
    estVerifie: {
      type:    Boolean,
      default: false,
    },
    dateVerification: {
      type:    Date,
      default: null,
    },

    // BONUS : taux de complétion du profil (calculé, mis à jour à chaque save)
    tauxCompletion: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Index pour le matching et les recherches fréquentes ──
prestataireSchema.index({ categories: 1, disponible: 1 });      // requête matching principale
prestataireSchema.index({ 'zoneGeographique.ville': 1 });        // recherche par ville
prestataireSchema.index({ noteMoyenne: -1, nombreAvis: -1 });    // tri par réputation
prestataireSchema.index({ estVerifie: 1, disponible: 1 });       // filtre admin

// ── Virtual : badge de réputation ──
prestataireSchema.virtual('badgeReputation').get(function () {
  if (this.noteMoyenne >= 4.5 && this.nombreMissionsReussies >= 10) return 'Expert';
  if (this.noteMoyenne >= 4.0 && this.nombreMissionsReussies >= 5)  return 'Confirmé';
  if (this.nombreMissionsReussies >= 1)                              return 'Actif';
  return 'Nouveau';
});

// ── Virtual : profil complet (pour le matching) ──
prestataireSchema.virtual('profilComplet').get(function () {
  return (
    !!this.description &&
    this.categories.length > 0 &&
    this.competences.length > 0 &&
    !!this.zoneGeographique.ville
  );
});

// ── Pre-save : calcul automatique du taux de complétion ──
prestataireSchema.pre('save', function (next) {
  // Validation tarif min ≤ max
  if (this.tarif.max > 0 && this.tarif.min > this.tarif.max) {
    return next(new Error('Le tarif minimum ne peut pas dépasser le tarif maximum'));
  }

  // Calcul du taux de complétion (6 critères)
  const criteres = [
    !!this.description,
    this.categories.length > 0,
    this.competences.length > 0,
    !!this.zoneGeographique.ville,
    this.portfolio.length > 0,
    this.experience > 0,
  ];
  const remplis = criteres.filter(Boolean).length;
  this.tauxCompletion = Math.round((remplis / criteres.length) * 100);

  next();
});

module.exports = mongoose.model('Prestataire', prestataireSchema);