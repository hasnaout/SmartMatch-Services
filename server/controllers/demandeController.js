const mongoose     = require('mongoose');
const Demande      = require('../models/Demande');
const Prestataire  = require('../models/Prestataire');
const { calculerScore }     = require('../utils/matchingEngine');
const { creerNotification } = require('../utils/notificationHelper');

// ─────────────────────────────────────────
// @route   POST /api/demandes
// @access  Privé (client)
// ─────────────────────────────────────────
const creerDemande = async (req, res) => {
  try {
    const {
      titre, description, categorie, urgence,
      budgetMin, budgetMax, ville, region, adresse, fichiers,
    } = req.body;

    if (!titre?.trim() || !description?.trim() || !categorie) {
      return res.status(400).json({
        message: '  Titre, description et catégorie sont obligatoires',
      });
    }

    const budgetMinNum = Number(budgetMin) || 0;
    const budgetMaxNum = Number(budgetMax) || 0;

    if (budgetMinNum < 0 || budgetMaxNum < 0) {
      return res.status(400).json({ message: '  Le budget ne peut pas être négatif' });
    }
    if (budgetMaxNum > 0 && budgetMinNum > budgetMaxNum) {
      return res.status(400).json({ message: '  Le budget minimum ne peut pas dépasser le maximum' });
    }

    const demande = await Demande.create({
      client:      req.user.id,
      titre:       titre.trim(),
      description: description.trim(),
      categorie,           // CORRECTION 1 : ObjectId — pas de .trim()
      urgence:     urgence || 'normale',
      budget: {
        min: budgetMinNum,
        max: budgetMaxNum,
      },
      localisation: {
        ville:   ville?.trim()   || '',
        region:  region?.trim()  || '',
        adresse: adresse?.trim() || '',
      },
      fichiers: Array.isArray(fichiers) ? fichiers : [],
    });

    // CORRECTION 2 : matching avec ObjectId — cohérent avec le modèle Prestataire
    const prestataires = await Prestataire.find({
      categories: { $in: [new mongoose.Types.ObjectId(categorie)] },
      disponible:  true,
    }).populate('user', 'nom prenom email telephone avatar isVerified');

    const recommandations = prestataires
      .map(p => ({ prestataire: p._id, score: calculerScore(p, demande) }))
      .filter(r => r.score > 0)          // exclure les scores nuls
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    demande.prestatairesRecommandes = recommandations;
    await demande.save();

    // Notifications non bloquantes
    const io = req.app.get('io');
    const notifPromises = recommandations.map(async (r) => {
      const prest = prestataires.find(
        p => p._id.toString() === r.prestataire.toString()
      );
      if (prest?.user?._id) {
        try {
          await creerNotification(io, {
            destinataire: prest.user._id,
            type:    'nouvelle_demande',
            titre:   '   Nouvelle mission disponible',
            message: `Une nouvelle demande "${titre}" correspond à votre profil`,
            lien:    '/prestataire/demandes',
            metadata: { demandeId: demande._id, score: r.score },
          });
        } catch (notifErr) {
          console.error('  Notification non envoyée:', notifErr.message);
        }
      }
    });
    await Promise.allSettled(notifPromises);

    await demande.populate([
      { path: 'client', select: 'nom prenom email' },
      {
        path: 'prestatairesRecommandes.prestataire',
        populate: { path: 'user', select: 'nom prenom email telephone avatar isVerified' },
      },
    ]);

    res.status(201).json({
      message: '  Demande créée avec succès',
      demande,
      matchingCount: recommandations.length,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant de catégorie invalide' });
    }
    console.error('  creerDemande:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/demandes/mes-demandes
// @access  Privé (client)
// ─────────────────────────────────────────
const getMesDemandes = async (req, res) => {
  try {
    // CORRECTION 3 : pagination + filtre par statut
    const { page = 1, limit = 10, statut } = req.query;
    const filtre = { client: req.user.id };
    if (statut) filtre.statut = statut;

    const skip = (page - 1) * Number(limit);

    const [demandes, total] = await Promise.all([
      Demande.find(filtre)
        .populate('client', 'nom prenom email')
        .populate({
          path:     'prestatairesRecommandes.prestataire',
          populate: { path: 'user', select: 'nom prenom email telephone avatar isVerified' },
        })
        .populate({
          path:     'prestataireChoisi',
          populate: { path: 'user', select: 'nom prenom email telephone avatar isVerified' },
        })
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
    console.error('  getMesDemandes:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/demandes/disponibles
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const getDemandesDisponibles = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: '  Profil prestataire introuvable' });
    }

    // CORRECTION 4 : pagination
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * Number(limit);

    const [demandes, total] = await Promise.all([
      Demande.find({
        // CORRECTION 5 : ObjectIds dans le $in — cohérent avec le modèle
        categorie: { $in: prestataire.categories },
        statut:    'publiée',
      })
        .populate('client', 'nom prenom email avatar')
        .populate('categorie', 'nom icone')   // BONUS : infos catégorie lisibles
        .sort({ urgence: -1, createdAt: -1 }) // BONUS : urgentes en premier
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Demande.countDocuments({
        categorie: { $in: prestataire.categories },
        statut:    'publiée',
      }),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      demandes,
    });
  } catch (error) {
    console.error('  getDemandesDisponibles:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/demandes/:id
// @access  Privé
// ─────────────────────────────────────────
const getDemande = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom email telephone')
      .populate('categorie', 'nom icone')
      .populate({
        path:     'prestatairesRecommandes.prestataire',
        populate: { path: 'user', select: 'nom prenom email avatar' },
      })
      .populate({
        path:     'prestataireChoisi',
        populate: { path: 'user', select: 'nom prenom email telephone avatar' },
      });

    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    const isClient = demande.client._id.toString() === req.user.id;
    const isAdmin  = req.user.role === 'admin';

    let isPrestataireChoisi     = false;
    let isPrestataireRecommande = false;

    // CORRECTION 6 : requête conditionnelle — seulement si rôle prestataire
    if (req.user.role === 'prestataire') {
      const prestataire = await Prestataire.findOne({ user: req.user.id })
        .select('_id').lean();

      if (prestataire) {
        const pId = prestataire._id.toString();

        isPrestataireChoisi =
          demande.prestataireChoisi?._id?.toString() === pId ||
          demande.prestataireChoisi?.toString()       === pId;

        isPrestataireRecommande = demande.prestatairesRecommandes?.some(
          r => r.prestataire?._id?.toString() === pId ||
               r.prestataire?.toString()       === pId
        );
      }
    }

    if (!isClient && !isPrestataireChoisi && !isPrestataireRecommande && !isAdmin) {
      return res.status(403).json({ message: '  Non autorisé' });
    }

    res.status(200).json({ demande });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant de demande invalide' });
    }
    console.error('  getDemande:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/demandes/:id/statut
// @access  Privé (client ou admin)
// ─────────────────────────────────────────
const updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['publiée', 'en_cours', 'terminée', 'annulée'];

    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: '  Statut invalide' });
    }

    const demande = await Demande.findById(req.params.id);
    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    if (demande.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '  Non autorisé' });
    }

    const ancienStatut = demande.statut;
    demande.statut = statut;

    if (
      statut === 'terminée' &&
      ancienStatut !== 'terminée' &&
      !demande.dateTerminee &&
      demande.prestataireChoisi
    ) {
      demande.dateTerminee = new Date();
      await demande.save();

      await Prestataire.findByIdAndUpdate(demande.prestataireChoisi, {
        $inc: { nombreMissionsReussies: 1 },
      });

      const prest = await Prestataire.findById(demande.prestataireChoisi)
        .select('user');
      if (prest) {
        const io = req.app.get('io');
        try {
          await creerNotification(io, {
            destinataire: prest.user,
            type:    'demande_terminee',
            titre:   '  Mission terminée',
            message: `La mission "${demande.titre}" a été marquée comme terminée`,
            lien:    '/prestataire/dashboard',
          });
        } catch (_) {}
      }
    } else {
      await demande.save();
    }

    res.status(200).json({ message: `  Statut mis à jour : ${statut}`, demande });
  } catch (error) {
    console.error('  updateStatut:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/demandes/:id/choisir-prestataire
// @access  Privé (client)
// ─────────────────────────────────────────
const choisirPrestataire = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { prestataireId } = req.body;

    if (!prestataireId || !mongoose.Types.ObjectId.isValid(prestataireId)) {
      return res.status(400).json({ message: '  prestataireId invalide ou manquant' });
    }

    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom')
      .session(session);

    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }
    if (demande.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: '  Non autorisé' });
    }
    if (demande.statut !== 'publiée') {
      return res.status(400).json({ message: '  La demande n\'est plus disponible' });
    }

    demande.prestataireChoisi = prestataireId;
    demande.statut            = 'en_cours';
    await demande.save({ session });

    await session.commitTransaction();

    // Notification hors transaction
    const prest = await Prestataire.findById(prestataireId).select('user');
    if (prest) {
      const io = req.app.get('io');
      try {
        await creerNotification(io, {
          destinataire: prest.user,
          type:    'demande_acceptee',
          titre:   '🎉 Mission acceptée !',
          message: `Vous avez été choisi pour la mission "${demande.titre}"`,
          lien:    '/prestataire/demandes',
        });
      } catch (_) {}
    }

    res.status(200).json({ message: '  Prestataire choisi', demande });
  } catch (error) {
    await session.abortTransaction();
    console.error('  choisirPrestataire:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  } finally {
    // CORRECTION 7 : finally garantit que la session est toujours fermée
    session.endSession();
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/demandes/:id/terminer
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const terminerMission = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom _id');

    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    const prestataire = await Prestataire.findOne({ user: req.user.id })
      .select('_id');
    if (!prestataire) {
      return res.status(404).json({ message: '  Profil prestataire introuvable' });
    }

    const prestataireChoisiId =
      demande.prestataireChoisi?._id?.toString() ||
      demande.prestataireChoisi?.toString();

    if (prestataireChoisiId !== prestataire._id.toString()) {
      return res.status(403).json({ message: '  Vous n\'êtes pas assigné à cette mission' });
    }

    if (demande.statut !== 'en_cours') {
      return res.status(400).json({ message: '  La mission doit être en cours pour être terminée' });
    }

    if (demande.dateTerminee) {
      return res.status(400).json({ message: '  Mission déjà marquée comme terminée' });
    }

    demande.statut       = 'terminée';
    demande.dateTerminee = new Date();
    await demande.save();

    await Prestataire.findByIdAndUpdate(prestataire._id, {
      $inc: { nombreMissionsReussies: 1 },
    });

    const io = req.app.get('io');
    try {
      await creerNotification(io, {
        destinataire: demande.client._id,
        type:    'demande_terminee',
        titre:   '  Mission terminée !',
        message: `Le prestataire a terminé la mission "${demande.titre}"`,
        lien:    `/client/demandes/${demande._id}`,
      });
    } catch (_) {}

    res.status(200).json({ message: '  Mission marquée comme terminée', demande });
  } catch (error) {
    console.error('  terminerMission:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

module.exports = {
  creerDemande,
  getMesDemandes,
  getDemandesDisponibles,
  getDemande,
  updateStatut,
  choisirPrestataire,
  terminerMission,
};