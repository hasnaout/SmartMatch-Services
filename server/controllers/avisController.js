const Avis        = require('../models/Avis');
const Demande     = require('../models/Demande');
const Prestataire = require('../models/Prestataire');
const { creerNotification } = require('../utils/notificationHelper');

// ─────────────────────────────────────────
// @route   POST /api/avis
// @access  Privé (client)
// ─────────────────────────────────────────
const creerAvis = async (req, res) => {
  try {
    const { prestataireId, demandeId, note, commentaire } = req.body;

    // CORRECTION 1 : validation note entière entre 1 et 5
    const noteInt = parseInt(note, 10);
    if (!prestataireId || !demandeId || !note) {
      return res.status(400).json({
        message: '  Prestataire, demande et note sont obligatoires',
      });
    }
    if (isNaN(noteInt) || noteInt < 1 || noteInt > 5) {
      return res.status(400).json({
        message: '  La note doit être un entier entre 1 et 5',
      });
    }

    // Vérifier que la demande existe et appartient au client
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    if (demande.client.toString() !== req.user.id) {
      return res.status(403).json({ message: '  Non autorisé' });
    }

    if (demande.statut !== 'terminée') {
      return res.status(400).json({
        message: '  Vous ne pouvez noter qu\'une demande terminée',
      });
    }

    // Vérifier que le prestataire est bien celui qui a réalisé la mission
    const prestataireChoisiId = demande.prestataireChoisi?.toString();
    if (!prestataireChoisiId || prestataireChoisiId !== prestataireId) {
      return res.status(400).json({
        message: '  Le prestataire spécifié ne correspond pas à cette mission',
      });
    }

    // CORRECTION 2 : laisser l'index unique gérer le doublon
    // + intercepter E11000 proprement dans le catch
    const avis = await Avis.create({
      client:      req.user.id,
      prestataire: prestataireId,
      demande:     demandeId,
      note:        noteInt,
      commentaire: commentaire?.trim(),
    });

    await avis.populate('client', 'nom prenom avatar');

    // CORRECTION 3 : notifier le prestataire en temps réel
    const prestataire = await Prestataire.findById(prestataireId)
      .select('user');

    if (prestataire?.user) {
      const io = req.app.get('io');
      try {
        await creerNotification(io, {
          destinataire: prestataire.user,
          type:         'nouvel_avis',
          titre:        ' Nouvel avis reçu',
          message:      `Vous avez reçu une note de ${noteInt}/5 pour la mission "${demande.titre}"`,
          lien:         '/prestataire/avis',
          metadata:     { demandeId, note: noteInt },
        });
      } catch (_) {
        // Échec de notification non bloquant
      }
    }

    res.status(201).json({ message: '  Avis publié avec succès', avis });
  } catch (error) {
    // CORRECTION 4 : intercepter E11000 (doublon index unique)
    if (error.code === 11000) {
      return res.status(400).json({
        message: '  Vous avez déjà noté cette prestation',
      });
    }
    // CastError = MongoId malformé dans les params
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: '  Identifiant invalide',
      });
    }
    console.error('  creerAvis:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/avis/prestataire/:id
// @access  Public
// ─────────────────────────────────────────
const getAvisPrestataire = async (req, res) => {
  try {
    // CORRECTION 5 : pagination
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * Number(limit);

    const [avis, total] = await Promise.all([
      Avis.find({ prestataire: req.params.id, isVisible: true })
        .populate('client', 'nom prenom avatar')
        .populate('demande', 'titre categorie')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Avis.countDocuments({ prestataire: req.params.id, isVisible: true }),
    ]);

    // Stats agrégées du prestataire (note moyenne + distribution)
    const statsAvis = await Avis.aggregate([
      { $match: { prestataire: req.params.id, isVisible: true } },  // idée : utiliser mongoose.Types.ObjectId si besoin
      {
        $group: {
          _id:          null,
          moyenne:      { $avg: '$note' },
          total:        { $sum: 1 },
          cinqEtoiles:  { $sum: { $cond: [{ $eq: ['$note', 5] }, 1, 0] } },
          quatreEtoiles:{ $sum: { $cond: [{ $eq: ['$note', 4] }, 1, 0] } },
          troisEtoiles: { $sum: { $cond: [{ $eq: ['$note', 3] }, 1, 0] } },
          deuxEtoiles:  { $sum: { $cond: [{ $eq: ['$note', 2] }, 1, 0] } },
          uneEtoile:    { $sum: { $cond: [{ $eq: ['$note', 1] }, 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats:      statsAvis[0] || { moyenne: 0, total: 0 },
      avis,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant prestataire invalide' });
    }
    console.error('  getAvisPrestataire:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/avis/mes-avis
// @access  Privé (client)
// ─────────────────────────────────────────
const getMesAvis = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * Number(limit);

    const [avis, total] = await Promise.all([
      Avis.find({ client: req.user.id })
        // CORRECTION 6 : select précis sur prestataire — pas de sur-exposition
        .populate({
          path:     'prestataire',
          select:   'noteMoyenne nombreAvis tarif zoneGeographique',
          populate: { path: 'user', select: 'nom prenom avatar' },
        })
        .populate('demande', 'titre categorie statut')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Avis.countDocuments({ client: req.user.id }),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      avis,
    });
  } catch (error) {
    console.error('  getMesAvis:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

module.exports = { creerAvis, getAvisPrestataire, getMesAvis };