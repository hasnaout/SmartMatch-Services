const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema(
  {
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
    demande: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Demande',
      required: [true, 'La demande est obligatoire'],
    },
    note: {
      type:     Number,
      required: [true, 'La note est obligatoire'],
      min:      [1, 'La note minimum est 1'],
      max:      [5, 'La note maximum est 5'],
    },
    commentaire: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères'],
    },
    isVisible: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Index ──
// Unicité : un client ne peut laisser qu'un seul avis par demande
avisSchema.index({ client: 1, demande: 1 }, { unique: true });
// Performance : accélérer les agrégations sur prestataire
avisSchema.index({ prestataire: 1, isVisible: 1 });

// ── Méthode statique centralisée pour recalculer la moyenne ──
// Réutilisable depuis post('save') ET post('deleteOne')
avisSchema.statics.recalculerMoyenne = async function (prestataireId) {
  const Prestataire = require('./Prestataire');

  const stats = await this.aggregate([
    { $match: { prestataire: prestataireId, isVisible: true } },
    {
      $group: {
        _id:     '$prestataire',
        moyenne: { $avg: '$note' },
        total:   { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Prestataire.findByIdAndUpdate(prestataireId, {
      noteMoyenne: Math.round(stats[0].moyenne * 10) / 10, // ex: 4.3
      nombreAvis:  stats[0].total,
    });
  } else {
    // CORRECTION : Si tous les avis sont supprimés, remettre à zéro
    await Prestataire.findByIdAndUpdate(prestataireId, {
      noteMoyenne: 0,
      nombreAvis:  0,
    });
  }
};

// ── Hook post save : création ou modification d'un avis ──
avisSchema.post('save', async function () {
  await this.constructor.recalculerMoyenne(this.prestataire);
});

// ── CORRECTION : Hook post deleteOne (document) ──
// Couvre : avis.deleteOne() appelé sur une instance
avisSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.recalculerMoyenne(this.prestataire);
});

// ── CORRECTION : Hook post findOneAndDelete ──
// Couvre : Avis.findByIdAndDelete(id) appelé depuis un controller
avisSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Avis = mongoose.model('Avis');
    await Avis.recalculerMoyenne(doc.prestataire);
  }
});

module.exports = mongoose.model('Avis', avisSchema);