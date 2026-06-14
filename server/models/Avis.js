const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema(
  {
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
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Demande',
      required: true,
    },
    note: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    commentaire: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


avisSchema.index({ client: 1, demande: 1 }, { unique: true });


avisSchema.post('save', async function () {
  const Prestataire = require('./Prestataire');
  const Avis = this.constructor;

  const stats = await Avis.aggregate([
    { $match: { prestataire: this.prestataire, isVisible: true } },
    {
      $group: {
        _id: '$prestataire',
        moyenne: { $avg: '$note' },
        total: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Prestataire.findByIdAndUpdate(this.prestataire, {
      notemoyenne: Math.round(stats[0].moyenne * 10) / 10,
      nombreAvis: stats[0].total,
    });
  }
});

module.exports = mongoose.model('Avis', avisSchema);
