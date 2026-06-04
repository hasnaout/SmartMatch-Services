const mongoose    = require('mongoose');
const Paiement    = require('../models/Paiement');
const Demande     = require('../models/Demande');
const Prestataire = require('../models/Prestataire');
const { creerNotification } = require('../utils/notificationHelper');

// ─────────────────────────────────────────
// @route   POST /api/paiements/initier
// @access  Privé (client)
// ─────────────────────────────────────────
const initierPaiement = async (req, res) => {
  try {
    const { demandeId, montant, methode, notes } = req.body;

    if (!demandeId || !montant || !methode) {
      return res.status(400).json({
        message: ' Demande, montant et méthode sont obligatoires',
      });
    }

    // CORRECTION 1 : validation methode
    const methodesValides = ['en_ligne', 'especes', 'virement', 'carte'];
    if (!methodesValides.includes(methode)) {
      return res.status(400).json({ message: ' Méthode de paiement invalide' });
    }

    const montantNum = Number(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const demande = await Demande.findById(demandeId)
      .populate('client', 'nom prenom')
      .populate('prestataireChoisi');

    if (!demande) {
      return res.status(404).json({ message: ' Demande introuvable' });
    }

    if (demande.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: ' Non autorisé' });
    }

    if (demande.statut !== 'terminée') {
      return res.status(400).json({
        message: ' La mission doit être terminée pour effectuer le paiement',
      });
    }

    if (!demande.prestataireChoisi) {
      return res.status(400).json({ message: ' Aucun prestataire assigné à cette mission' });
    }

    // Vérifier doublon — index unique sur demande dans le modèle
    const paiementExiste = await Paiement.findOne({
      demande: demandeId,
      statut:  { $in: ['en_attente', 'payé'] },
    });

    if (paiementExiste) {
      return res.status(400).json({
        message:  ' Un paiement existe déjà pour cette mission',
        paiement: paiementExiste,
      });
    }

    // CORRECTION 2 : statut initial selon méthode (espèces = en_attente,
    // en_ligne = en_attente aussi mais avec référence externe possible en V2)
    const paiement = await Paiement.create({
      demande:     demandeId,
      client:      req.user.id,
      prestataire: demande.prestataireChoisi._id,
      montant:     montantNum,
      methode,
      notes:       notes?.trim() || '',
      statut:      'en_attente',
    });

    await paiement.populate('demande', 'titre categorie');
    await paiement.populate('client',  'nom prenom email');

    res.status(201).json({
      message:  ' Paiement initié avec succès',
      paiement,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: ' Identifiant invalide' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un paiement existe déjà pour cette mission' });
    }
    console.error('initierPaiement:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/paiements/:id/confirmer
// @access  Privé (client)
// ─────────────────────────────────────────
const confirmerPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate('demande', 'titre')
      .populate({
        path:     'prestataire',
        select:   'user noteMoyenne',
        populate: { path: 'user', select: 'nom prenom' },
      });

    if (!paiement) {
      return res.status(404).json({ message: ' Paiement introuvable' });
    }

    if (paiement.client.toString() !== req.user.id) {
      return res.status(403).json({ message: ' Non autorisé' });
    }

    if (paiement.statut === 'payé') {
      return res.status(400).json({ message: ' Ce paiement est déjà confirmé' });
    }

    if (paiement.statut === 'annulé') {
      return res.status(400).json({ message: ' Ce paiement a été annulé' });
    }

    // CORRECTION 3 : utiliser changerStatut() — alimente historiqueStatuts
    await paiement.changerStatut('payé', req.user.id, 'Confirmé par le client');

    // CORRECTION 4 : type de notification corrigé
    if (paiement.prestataire?.user?._id) {
      const io = req.app.get('io');
      try {
        await creerNotification(io, {
          destinataire: paiement.prestataire.user._id,
          type:    'paiement_recu',           // ← corrigé
          titre:   'Paiement reçu !',
          message: `Vous avez reçu ${paiement.montant} ${paiement.devise} pour la mission "${paiement.demande?.titre}"`,
          lien:    '/prestataire/dashboard',
          metadata: {
            paiementId: paiement._id,
            montant:    paiement.montant,
            devise:     paiement.devise,
          },
        });
      } catch (_) {
        // Notification non bloquante
      }
    }

    res.status(200).json({
      message:  'Paiement confirmé avec succès',
      paiement,
    });
  } catch (error) {
    console.error('confirmerPaiement:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements/mes-paiements
// @access  Privé (client)
// ─────────────────────────────────────────
const getMesPaiements = async (req, res) => {
  try {
    // CORRECTION 5 : pagination
    const { page = 1, limit = 10, statut } = req.query;
    const filtre = { client: req.user.id };
    if (statut) filtre.statut = statut;

    const skip = (page - 1) * Number(limit);

    const [paiements, total] = await Promise.all([
      Paiement.find(filtre)
        .populate('demande', 'titre categorie statut')
        .populate({
          path:     'prestataire',
          select:   'noteMoyenne nombreAvis', // CORRECTION 6 : camelCase
          populate: { path: 'user', select: 'nom prenom avatar' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Paiement.countDocuments(filtre),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      paiements,
    });
  } catch (error) {
    console.error('getMesPaiements:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements/mes-revenus
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const getMesRevenus = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user.id })
      .select('_id');
    if (!prestataire) {
      return res.status(404).json({ message: 'Profil prestataire introuvable' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * Number(limit);

    // CORRECTION 7 : agrégation MongoDB — totalRevenus calculé côté DB
    const [statsRevenus, paiements, total] = await Promise.all([
      Paiement.aggregate([
        { $match: { prestataire: prestataire._id, statut: 'payé' } },
        {
          $group: {
            _id:           null,
            totalRevenus:  { $sum: '$montant' },
            totalMissions: { $sum: 1 },
            moyenneMission:{ $avg: '$montant' },
          },
        },
      ]),

      Paiement.find({ prestataire: prestataire._id, statut: 'payé' })
        .populate('demande', 'titre categorie')
        .populate('client',  'nom prenom avatar')
        .sort({ datePaiement: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Paiement.countDocuments({ prestataire: prestataire._id, statut: 'payé' }),
    ]);

    const stats = statsRevenus[0] || {
      totalRevenus:   0,
      totalMissions:  0,
      moyenneMission: 0,
    };

    res.status(200).json({
      stats: {
        totalRevenus:    Math.round(stats.totalRevenus * 100) / 100,
        totalMissions:   stats.totalMissions,
        moyenneMission:  Math.round(stats.moyenneMission * 100) / 100,
        devise:          'MAD',
      },
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      paiements,
    });
  } catch (error) {
    console.error('getMesRevenus:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements/demande/:id
// @access  Privé (client ou prestataire de la demande)
// ─────────────────────────────────────────
const getPaiementDemande = async (req, res) => {
  try {
    const paiement = await Paiement.findOne({ demande: req.params.id })
      .populate('demande', 'titre categorie statut')
      .populate('client',  'nom prenom email')
      .populate({
        path:     'prestataire',
        populate: { path: 'user', select: 'nom prenom' },
      });

    if (!paiement) {
      return res.status(404).json({ message: ' Aucun paiement pour cette demande' });
    }

    // CORRECTION 8 : vérification d'autorisation
    const isClient      = paiement.client._id.toString() === req.user.id;
    const isPrestataire = paiement.prestataire?.user?._id?.toString() === req.user.id;
    const isAdmin       = req.user.role === 'admin';

    if (!isClient && !isPrestataire && !isAdmin) {
      return res.status(403).json({ message: ' Non autorisé' });
    }

    res.status(200).json({ paiement });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    console.error('getPaiementDemande:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements
// @access  Privé (admin)
// ─────────────────────────────────────────
const getTousPaiements = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, methode } = req.query;
    const filtre = {};
    if (statut)  filtre.statut  = statut;
    if (methode) filtre.methode = methode;

    const skip = (page - 1) * Number(limit);

    // CORRECTION 9 : stats via méthode statique + pagination
    const [paiements, total, statsParStatut] = await Promise.all([
      Paiement.find(filtre)
        .populate('demande', 'titre categorie')
        .populate('client',  'nom prenom email')
        .populate({
          path:     'prestataire',
          populate: { path: 'user', select: 'nom prenom' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Paiement.countDocuments(filtre),

      // Méthode statique du modèle — agrégation MongoDB propre
      Paiement.getStats(),
    ]);

    // Restructurer les stats pour la réponse
    const stats = {
      total:        0,
      totalMontant: 0,
      parStatut:    {},
    };
    statsParStatut.forEach(s => {
      stats.parStatut[s._id] = { count: s.count, montant: s.total };
      stats.total += s.count;
      if (s._id === 'payé') stats.totalMontant = s.total;
    });

    res.status(200).json({
      stats,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      paiements,
    });
  } catch (error) {
    console.error('getTousPaiements:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

module.exports = {
  initierPaiement,
  confirmerPaiement,
  getMesPaiements,
  getMesRevenus,
  getPaiementDemande,
  getTousPaiements,
};