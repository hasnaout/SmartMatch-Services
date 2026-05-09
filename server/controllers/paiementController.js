const Paiement    = require('../models/Paiement');
const Demande     = require('../models/Demande');
const Prestataire = require('../models/Prestataire');
const { creerNotification } = require('../utils/notificationHelper');

// Catégories en ligne vs présentiel
const CATEGORIES_EN_LIGNE = [
  'Informatique', 'Design', 'Développement web',
  'Rédaction', 'Marketing', 'Traduction',
];

const getTypePaiement = (categorie) => {
  return CATEGORIES_EN_LIGNE.includes(categorie) ? 'en_ligne' : 'presenciel';
};

// ─────────────────────────────────────────
// @route   POST /api/paiements/initier
// @access  Privé (client)
// ─────────────────────────────────────────
const initierPaiement = async (req, res) => {
  try {
    const { demandeId, montant, methode, notes } = req.body;

    if (!demandeId || !montant || !methode) {
      return res.status(400).json({
        message: '❌ Demande, montant et méthode sont obligatoires',
      });
    }

    const demande = await Demande.findById(demandeId)
      .populate('client', 'nom prenom')
      .populate('prestataireChoisi');

    if (!demande) {
      return res.status(404).json({ message: '❌ Demande introuvable' });
    }

    if (demande.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: '❌ Non autorisé' });
    }

    if (demande.statut !== 'terminée') {
      return res.status(400).json({
        message: '❌ La mission doit être terminée pour effectuer le paiement',
      });
    }

    // Vérifier si un paiement existe déjà
    const paiementExiste = await Paiement.findOne({
      demande: demandeId,
      statut:  { $in: ['en_attente', 'payé'] },
    });

    if (paiementExiste) {
      return res.status(400).json({
        message: '❌ Un paiement existe déjà pour cette mission',
        paiement: paiementExiste,
      });
    }

    const paiement = await Paiement.create({
      demande:     demandeId,
      client:      req.user.id,
      prestataire: demande.prestataireChoisi._id,
      montant:     Number(montant),
      methode,
      notes:       notes || '',
      statut:      methode === 'especes' ? 'en_attente' : 'en_attente',
    });

    await paiement.populate('demande', 'titre categorie');
    await paiement.populate('client',  'nom prenom email');

    res.status(201).json({
      message:  '✅ Paiement initié avec succès',
      paiement,
    });
  } catch (error) {
    console.error('❌ ERREUR initierPaiement:', error);
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
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
      .populate('prestataire');

    if (!paiement) {
      return res.status(404).json({ message: '❌ Paiement introuvable' });
    }

    if (paiement.client.toString() !== req.user.id) {
      return res.status(403).json({ message: '❌ Non autorisé' });
    }

    if (paiement.statut === 'payé') {
      return res.status(200).json({
        message:  '✅ Paiement déjà confirmé',
        paiement,
      });
    }

    paiement.statut      = 'payé';
    paiement.datePaiement = new Date();
    await paiement.save();

    if (paiement.prestataire?.user) {
      const io = req.app.get('io');
      await creerNotification(io, {
        destinataire: paiement.prestataire.user,
        type:    'demande_terminee',
        titre:   '💰 Paiement reçu !',
        message: `Vous avez reçu un paiement de ${paiement.montant} ${paiement.devise} pour la mission "${paiement.demande?.titre || 'votre mission'}"`,
        lien:    '/prestataire/dashboard',
      });
    }

    res.status(200).json({
      message:  '✅ Paiement confirmé avec succès',
      paiement,
    });
  } catch (error) {
    console.error('❌ ERREUR confirmerPaiement:', error);
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements/mes-paiements
// @access  Privé (client)
// ─────────────────────────────────────────
const getMesPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find({ client: req.user.id })
      .populate('demande',     'titre categorie statut')
      .populate('prestataire', 'user notemoyenne')
      .populate({
        path:     'prestataire',
        populate: { path: 'user', select: 'nom prenom' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ total: paiements.length, paiements });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements/mes-revenus
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const getMesRevenus = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: '❌ Profil prestataire introuvable' });
    }

    const paiements = await Paiement.find({
      prestataire: prestataire._id,
      statut:      'payé',
    })
      .populate('demande', 'titre categorie')
      .populate('client',  'nom prenom')
      .sort({ createdAt: -1 });

    const totalRevenus = paiements.reduce((sum, p) => sum + p.montant, 0);

    res.status(200).json({
      total:        paiements.length,
      totalRevenus,
      devise:       'MAD',
      paiements,
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements/demande/:id
// @access  Privé
// ─────────────────────────────────────────
const getPaiementDemande = async (req, res) => {
  try {
    const paiement = await Paiement.findOne({ demande: req.params.id })
      .populate('demande', 'titre categorie statut')
      .populate('client',  'nom prenom email');

    res.status(200).json({ paiement: paiement || null });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/paiements (admin)
// @access  Privé (admin)
// ─────────────────────────────────────────
const getTousPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find()
      .populate('demande', 'titre categorie')
      .populate('client',  'nom prenom email')
      .populate({
        path:     'prestataire',
        populate: { path: 'user', select: 'nom prenom' },
      })
      .sort({ createdAt: -1 });

    const stats = {
      total:          paiements.length,
      totalMontant:   paiements.filter(p => p.statut === 'payé').reduce((s, p) => s + p.montant, 0),
      enAttente:      paiements.filter(p => p.statut === 'en_attente').length,
      payes:          paiements.filter(p => p.statut === 'payé').length,
      enLigne:        paiements.filter(p => p.methode === 'en_ligne').length,
      especes:        paiements.filter(p => p.methode === 'especes').length,
    };

    res.status(200).json({ stats, paiements });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
};

module.exports = {
  initierPaiement,
  confirmerPaiement,
  getMesPaiements,
  getMesRevenus,
  getPaiementDemande,
  getTousPaiements,
  getTypePaiement,
  CATEGORIES_EN_LIGNE,
};
