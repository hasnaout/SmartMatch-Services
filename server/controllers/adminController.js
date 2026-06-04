const mongoose    = require('mongoose');
const User        = require('../models/User');
const Prestataire = require('../models/Prestataire');
const Demande     = require('../models/Demande');
const Avis        = require('../models/Avis');
const Message     = require('../models/Message');
const Notification= require('../models/Notification');
const { creerNotification } = require('../utils/notificationHelper');

// ─────────────────────────────────────────
// @route   GET /api/admin/users
// @access  Privé (admin)
// ─────────────────────────────────────────
const getTousUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;

    const filtre = {};
    if (role)                filtre.role     = role;
    if (isActive !== undefined) filtre.isActive = isActive === 'true';

    // BONUS : recherche par nom ou email
    if (search) {
      filtre.$or = [
        { nom:    { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email:  { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * Number(limit);

    // CORRECTION 1 : parallel queries avec Promise.all
    const [users, total] = await Promise.all([
      User.find(filtre)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-password -resetCode -resetCodeExpire -loginAttempts -lockUntil')
        .lean(),
      User.countDocuments(filtre),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    console.error('  getTousUsers:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/activer
// @access  Privé (admin)
// ─────────────────────────────────────────
const activerUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    const io = req.app.get('io');
    try {
      await creerNotification(io, {
        destinataire: user._id,
        type:         'compte_verifie',
        titre:        '  Compte réactivé',
        message:      'Votre compte SmartMatch a été réactivé par l\'administrateur.',
        lien:         '/dashboard',
      });
    } catch (_) {}

    res.status(200).json({ message: '  Compte activé', user });
  } catch (error) {
    console.error('  activerUser:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/suspendre
// CORRECTION 2 : faute de frappe corrigée suspendrUser → suspendreUser
// @access  Privé (admin)
// ─────────────────────────────────────────
const suspendreUser = async (req, res) => {
  try {
    // CORRECTION 3 : un admin ne peut pas se suspendre lui-même
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message: '  Vous ne pouvez pas suspendre votre propre compte',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    res.status(200).json({ message: '  Compte suspendu', user });
  } catch (error) {
    console.error('  suspendreUser:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/verifier
// @access  Privé (admin)
// ─────────────────────────────────────────
const verifierUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    const io = req.app.get('io');
    try {
      await creerNotification(io, {
        destinataire: user._id,
        type:         'compte_verifie',
        titre:        '  Compte vérifié !',
        message:      'Votre compte a été vérifié par l\'administrateur. Vous apparaissez maintenant comme prestataire certifié.',
        lien:         '/prestataire/profil',
      });
    } catch (_) {}

    res.status(200).json({ message: '  Compte vérifié', user });
  } catch (error) {
    console.error('  verifierUser:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/admin/users/:id
// @access  Privé (admin)
// ─────────────────────────────────────────
const supprimerUser = async (req, res) => {
  try {
    // CORRECTION 4 : un admin ne peut pas se supprimer lui-même
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        message: '  Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    // CORRECTION 5 : vérifier qu'aucune mission n'est en cours
    const missionActive = await Demande.findOne({
      $or: [
        { client:             user._id, statut: 'en_cours' },
        { prestataireChoisi:  user._id, statut: 'en_cours' },
      ],
    });

    if (missionActive) {
      return res.status(400).json({
        message: '  Impossible de supprimer — cet utilisateur a une mission en cours',
        demandeId: missionActive._id,
      });
    }

    // CORRECTION 6 : suppression en cascade complète via transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await User.findByIdAndDelete(req.params.id, { session });
      await Prestataire.findOneAndDelete(  { user: req.params.id }, { session });
      await Avis.deleteMany(        { $or: [{ client: req.params.id }] }, { session });
      await Notification.deleteMany({ destinataire: req.params.id },      { session });
      // Note : les Demandes et Messages sont archivés, pas supprimés (traçabilité)

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }

    res.status(200).json({ message: '  Utilisateur et données associées supprimés' });
  } catch (error) {
    console.error('  supprimerUser:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/admin/avis
// @access  Privé (admin)
// ─────────────────────────────────────────
const getTousAvis = async (req, res) => {
  try {
    // CORRECTION 7 : pagination sur les avis
    const { page = 1, limit = 20, isVisible } = req.query;
    const filtre = {};
    if (isVisible !== undefined) filtre.isVisible = isVisible === 'true';

    const skip = (page - 1) * Number(limit);

    const [avis, total] = await Promise.all([
      Avis.find(filtre)
        .populate('client',      'nom prenom email')
        .populate('prestataire', 'noteMoyenne nombreAvis')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Avis.countDocuments(filtre),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      avis,
    });
  } catch (error) {
    console.error('  getTousAvis:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/avis/:id/masquer
// @access  Privé (admin)
// ─────────────────────────────────────────
const masquerAvis = async (req, res) => {
  try {
    const avis = await Avis.findByIdAndUpdate(
      req.params.id,
      { isVisible: false },
      { new: true }
    );
    if (!avis) return res.status(404).json({ message: '  Avis introuvable' });

    // Recalculer la moyenne après masquage (hook ne se déclenche pas sur update)
    await Avis.recalculerMoyenne(avis.prestataire);

    res.status(200).json({ message: '  Avis masqué', avis });
  } catch (error) {
    console.error('  masquerAvis:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/avis/:id/afficher
// @access  Privé (admin)
// ─────────────────────────────────────────
const afficherAvis = async (req, res) => {
  try {
    const avis = await Avis.findByIdAndUpdate(
      req.params.id,
      { isVisible: true },
      { new: true }
    );
    if (!avis) return res.status(404).json({ message: '  Avis introuvable' });

    // Recalculer la moyenne après réaffichage
    await Avis.recalculerMoyenne(avis.prestataire);

    res.status(200).json({ message: '  Avis affiché', avis });
  } catch (error) {
    console.error('  afficherAvis:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/admin/stats
// CORRECTION 8 : Promise.all + stats enrichies
// @access  Privé (admin)
// ─────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    // Toutes les requêtes en parallèle — une seule attente
    const [
      totalUsers,
      totalClients,
      totalPrestataires,
      totalDemandes,
      demandesEnCours,
      demandesTerminees,
      demandesAnnulees,
      totalAvis,
      notesMoyenneGlobale,
      demandesParCategorie,
      inscriptionsParMois,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'prestataire' }),
      Demande.countDocuments(),
      Demande.countDocuments({ statut: 'en_cours' }),
      Demande.countDocuments({ statut: 'terminée' }),
      Demande.countDocuments({ statut: 'annulée' }),
      Avis.countDocuments({ isVisible: true }),

      // Note moyenne globale de la plateforme
      Avis.aggregate([
        { $match: { isVisible: true } },
        { $group: { _id: null, moyenne: { $avg: '$note' } } },
      ]),

      // BONUS : répartition des demandes par catégorie (pour graphique)
      Demande.aggregate([
        { $group: { _id: '$categorie', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // BONUS : inscriptions des 6 derniers mois (pour courbe d'évolution)
      User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            },
          },
        },
        {
          $group: {
            _id: {
              mois: { $month: '$createdAt' },
              annee: { $year: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.annee': 1, '_id.mois': 1 } },
      ]),
    ]);

    const tauxReussite = totalDemandes > 0
      ? Math.round((demandesTerminees / totalDemandes) * 100)
      : 0;

    res.status(200).json({
      users: {
        total:         totalUsers,
        clients:       totalClients,
        prestataires:  totalPrestataires,
      },
      demandes: {
        total:      totalDemandes,
        enCours:    demandesEnCours,
        terminees:  demandesTerminees,
        annulees:   demandesAnnulees,
        tauxReussite: `${tauxReussite}%`,
      },
      avis: {
        total:         totalAvis,
        noteMoyenne:   notesMoyenneGlobale[0]
          ? Math.round(notesMoyenneGlobale[0].moyenne * 10) / 10
          : 0,
      },
      graphiques: {
        demandesParCategorie,
        inscriptionsParMois,
      },
    });
  } catch (error) {
    console.error('  getStats:', error.message);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};
// ─────────────────────────────────────────
// @route   GET /api/admin/demandes
// @access  Privé (admin)
// ─────────────────────────────────────────
const getTousDemandes = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const filtre = {};
    if (statut) filtre.statut = statut;

    const skip = (page - 1) * Number(limit);

    const [demandes, total] = await Promise.all([
      Demande.find(filtre)
        .populate('client', 'nom prenom email')
        .populate('categorie', 'nom icone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Demande.countDocuments(filtre),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      demandes,
    });
  } catch (error) {
    console.error(' getTousDemandes:', error.message);
    res.status(500).json({ message: '❌ Erreur serveur' });
  }
};

module.exports = {
  getTousUsers,
  activerUser,
  suspendreUser,
  verifierUser,
  supprimerUser,
  getTousAvis,
  masquerAvis,
  afficherAvis,
  getStats,
  getTousDemandes,
};
