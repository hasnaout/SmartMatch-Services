const User = require('../models/User');
const Prestataire = require('../models/Prestataire');
const Demande = require('../models/Demande');
const Avis = require('../models/Avis');
const { creerNotification } = require('../utils/notificationHelper');

// ─────────────────────────────────────────
// @route   GET /api/admin/users
// @access  Privé (admin)
// ─────────────────────────────────────────
const getTousUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;

    const filtre = {};
    if (role) filtre.role = role;
    if (isActive !== undefined) filtre.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(filtre)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filtre);

    res.status(200).json({ total, page: Number(page), users });
  } catch (error) {
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
    );

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    res.status(200).json({ message: '   Compte activé', user });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/suspendre
// @access  Privé (admin)
// ─────────────────────────────────────────
const suspendrUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    res.status(200).json({ message: '   Compte suspendu', user });
  } catch (error) {
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
    );

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    const io = req.app.get('io');
    await creerNotification(io, {
      destinataire: user._id,
      type:    'compte_verifie',
      titre:   '   Compte vérifié !',
      message: 'Votre compte a été vérifié par l\'administrateur. Vous apparaissez maintenant comme prestataire certifié.',
      lien:    '/prestataire/profil',
    });

    res.status(200).json({ message: '   Compte vérifié', user });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/admin/users/:id
// @access  Privé (admin)
// ─────────────────────────────────────────
const supprimerUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '  Utilisateur introuvable' });
    }

    await Prestataire.findOneAndDelete({ user: req.params.id });

    res.status(200).json({ message: '   Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/admin/demandes-suppression
// @access  Privé (admin)
// Retourne tous les users ayant une demande en attente
// ─────────────────────────────────────────
const getDemandesSuppression = async (req, res) => {
  try {
    const users = await User.find({ demandeSuppressionStatut: 'en_attente' })
      .select('nom prenom email role demandeSuppressionRaison demandeSuppressionDate createdAt')
      .sort({ demandeSuppressionDate: -1 });

    res.status(200).json({ total: users.length, users });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/valider-suppression
// @access  Privé (admin)
// Valide la demande → supprime le compte
// ─────────────────────────────────────────
const validerSuppression = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: '  Utilisateur introuvable' });

    await Prestataire.findOneAndDelete({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: '   Compte supprimé suite à la demande utilisateur' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/refuser-suppression
// @access  Privé (admin)
// Refuse la demande → remet les champs à null
// ─────────────────────────────────────────
const refuserSuppression = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        demandeSuppressionStatut: 'refusee',
        demandeSuppressionRaison: null,
        demandeSuppressionDate:   null,
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: '  Utilisateur introuvable' });

    res.status(200).json({ message: '   Demande de suppression refusée', user });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/admin/avis
// ─────────────────────────────────────────
const getTousAvis = async (req, res) => {
  try {
    const avis = await Avis.find()
      .populate('client', 'nom prenom email')
      .populate('prestataire')
      .sort({ createdAt: -1 });

    res.status(200).json({ total: avis.length, avis });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const masquerAvis = async (req, res) => {
  try {
    const avis = await Avis.findByIdAndUpdate(
      req.params.id,
      { isVisible: false },
      { new: true }
    );
    if (!avis) return res.status(404).json({ message: '  Avis introuvable' });
    res.status(200).json({ message: '   Avis masqué', avis });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const afficherAvis = async (req, res) => {
  try {
    const avis = await Avis.findByIdAndUpdate(
      req.params.id,
      { isVisible: true },
      { new: true }
    );
    if (!avis) return res.status(404).json({ message: '  Avis introuvable' });
    res.status(200).json({ message: '   Avis affiché', avis });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const totalUsers        = await User.countDocuments();
    const totalClients      = await User.countDocuments({ role: 'client' });
    const totalPrestataires = await User.countDocuments({ role: 'prestataire' });
    const totalDemandes     = await Demande.countDocuments();
    const demandesEnCours   = await Demande.countDocuments({ statut: 'en_cours' });
    const demandesTerminees = await Demande.countDocuments({ statut: 'terminée' });
    const totalAvis         = await Avis.countDocuments();
    const demandesSuppr     = await User.countDocuments({ demandeSuppressionStatut: 'en_attente' });

    res.status(200).json({
      users:    { total: totalUsers, clients: totalClients, prestataires: totalPrestataires },
      demandes: { total: totalDemandes, enCours: demandesEnCours, terminees: demandesTerminees },
      avis:     { total: totalAvis },
      suppressions: { enAttente: demandesSuppr },
    });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = {
  getTousUsers,
  activerUser,
  suspendrUser,
  verifierUser,
  supprimerUser,
  getDemandesSuppression,
  validerSuppression,
  refuserSuppression,
  getTousAvis,
  masquerAvis,
  afficherAvis,
  getStats,
};
