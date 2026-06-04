const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema(
  {
    nom: {
      type:      String,
      required:  [true, 'Le nom de la catégorie est obligatoire'],
      trim:      true,
      unique:    true,           // Index unique géré par Mongoose
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [200, 'La description ne peut pas dépasser 200 caractères'],
      // Pas de default : undefined = champ absent (distinct de '')
    },
    icone: {
      type:    String,
      default: '🔧',
      maxlength: [10, 'Icône invalide'],
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    ordre: {
      type:    Number,
      default: 0,
      min:     [0, "L'ordre ne peut pas être négatif"],
    },
  },
  {
    timestamps: true,
  }
);

// ── Index combiné pour les requêtes les plus fréquentes ──
// GET /api/categories → { isActive: true } trié par ordre ASC
categorieSchema.index({ isActive: 1, ordre: 1 });

// ── Middleware : gestion propre de l'erreur de doublon (E11000) ──
categorieSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Une catégorie avec ce nom existe déjà'));
  } else {
    next(error);
  }
});

// Couvre aussi findOneAndUpdate avec upsert
categorieSchema.post('findOneAndUpdate', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Une catégorie avec ce nom existe déjà'));
  } else {
    next(error);
  }
});

// ── Méthode statique : récupérer uniquement les catégories actives triées ──
// Usage : const cats = await Categorie.getActives();
categorieSchema.statics.getActives = function () {
  return this.find({ isActive: true }).sort({ ordre: 1 }).select('nom description icone ordre');
};

module.exports = mongoose.model('Categorie', categorieSchema);