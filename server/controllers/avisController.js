const Avis = require('../models/Avis');
const Demande = require('../models/Demande');
const Prestataire = require('../models/Prestataire');

// ─────────────────────────────────────────
// @route   POST /api/avis
// @access  Privé (client)
// ─────────────────────────────────────────
const creerAvis = async (req, res) => {
  try {
    const { prestataireId, demandeId, note, commentaire } = req.body;

    if (!prestataireId || !demandeId || !note) {
      return res.status(400).json({ message: '  Prestataire, demande et note sont obligatoires' });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({ message: '  La note doit être entre 1 et 5' });
    }

    // Vérifier que la demande existe et est terminée
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }
    if (demande.statut !== 'terminée') {
      return res.status(400).json({ message: '  Vous ne pouvez noter que les demandes terminées' });
    }

    // Vérifier que c'est bien le client de cette demande
    if (demande.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '  Non autorisé' });
    }

    // Vérifier que le prestataireId correspond au prestataire choisi pour cette demande
    if (demande.prestataireChoisi?.toString() !== prestataireId) {
      return res.status(400).json({ message: '  Le prestataire spécifié ne correspond pas à cette demande' });
    }

    // Vérifier si un avis existe déjà
    const avisExiste = await Avis.findOne({
      client: req.user._id,
      demande: demandeId,
    });
    if (avisExiste) {
      return res.status(400).json({ message: '  Vous avez déjà noté cette prestation' });
    }

    const avis = await Avis.create({
      client:      req.user._id,
      prestataire: prestataireId,
      demande:     demandeId,
      note,
      commentaire,
    });

    await avis.populate('client', 'nom prenom avatar');

    res.status(201).json({ message: '   Avis publié avec succès', avis });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/avis/prestataire/:id
// @access  Public
// ─────────────────────────────────────────
const getAvisPrestataire = async (req, res) => {
  try {
    const avis = await Avis.find({
      prestataire: req.params.id,
      isVisible:   true,
    })
      .populate('client', 'nom prenom avatar')
      .populate('demande', 'titre categorie')
      .sort({ createdAt: -1 });

    res.status(200).json({ total: avis.length, avis });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/avis/mes-avis
// @access  Privé (client)
// ─────────────────────────────────────────
const getMesAvis = async (req, res) => {
  try {
    const avis = await Avis.find({ client: req.user.id })
      .populate('prestataire')
      .populate('demande', 'titre categorie')
      .sort({ createdAt: -1 });

    res.status(200).json({ total: avis.length, avis });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = { creerAvis, getAvisPrestataire, getMesAvis };