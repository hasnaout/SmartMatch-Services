const mongoose    = require('mongoose');
const Prestataire = require('../models/Prestataire');
const User        = require('../models/User');

// ─────────────────────────────────────────
// @route   GET /api/prestataires
// @access  Public
// ─────────────────────────────────────────
const getTousPrestataires = async (req, res) => {
  try {
    const {
      categorie,
      ville,
      disponible,
      page  = 1,
      limit = 10,
      tri   = 'noteMoyenne', // BONUS : tri paramétrable
    } = req.query;

    const filtre = {};

    // CORRECTION 1 : categorie est un ObjectId
    if (categorie) {
      if (!mongoose.Types.ObjectId.isValid(categorie)) {
        return res.status(400).json({ message: 'Identifiant de catégorie invalide' });
      }
      filtre.categories = { $in: [new mongoose.Types.ObjectId(categorie)] };
    }

    if (ville) {
      filtre['zoneGeographique.ville'] = { $regex: ville, $options: 'i' };
    }

    if (disponible !== undefined) {
      filtre.disponible = disponible === 'true';
    }

    const skip = (page - 1) * Number(limit);

    // CORRECTION 2 : tris autorisés — éviter l'injection de tri arbitraire
    const trisAutorises = {
      noteMoyenne:            { noteMoyenne: -1 },
      nombreMissionsReussies: { nombreMissionsReussies: -1 },
      experience:             { experience: -1 },
      recent:                 { createdAt: -1 },
    };
    const triChoisi = trisAutorises[tri] || trisAutorises.noteMoyenne;

    // CORRECTION 3 : Promise.all — requêtes parallèles
    const [prestataires, total] = await Promise.all([
      Prestataire.find(filtre)
        .populate('user',       'nom prenom avatar isVerified')
        .populate('categories', 'nom icone') // BONUS : infos catégories lisibles
        .sort(triChoisi)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Prestataire.countDocuments(filtre),
    ]);

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      prestataires,
    });
  } catch (error) {
    console.error(' getTousPrestataires:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/prestataires/moi
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const getMonProfil = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user.id }) // CORRECTION 4 : req.user.id
      .populate('user',       'nom prenom email telephone avatar isVerified')
      .populate('categories', 'nom icone ordre');

    if (!prestataire) {
      return res.status(404).json({ message: 'Profil prestataire introuvable' });
    }

    res.status(200).json({ prestataire });
  } catch (error) {
    console.error('getMonProfil:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/prestataires/:id
// @access  Public
// ─────────────────────────────────────────
const getPrestataire = async (req, res) => {
  try {
    const prestataire = await Prestataire.findById(req.params.id)
      // CORRECTION 5 : ne pas exposer email/telephone sur route publique
      .populate('user',       'nom prenom avatar isVerified')
      .populate('categories', 'nom icone');

    if (!prestataire) {
      return res.status(404).json({ message: 'Prestataire introuvable' });
    }

    res.status(200).json({ prestataire });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    console.error('getPrestataire:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/prestataires/profil
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const updateProfil = async (req, res) => {
  try {
    const {
      description,
      competences,
      categories,
      tarifMin,    // reçu du frontend
      tarifMax,
      devise,
      ville,
      region,
      rayon,
      experience,
    } = req.body;

    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: ' Profil prestataire introuvable' });
    }

    // Champs scalaires — mise à jour conditionnelle
    if (description !== undefined) prestataire.description = description.trim();
    if (competences  !== undefined) prestataire.competences = competences;
    if (experience   !== undefined) prestataire.experience  = Number(experience);

    // CORRECTION 6 : categories comme tableau d'ObjectId
    if (categories !== undefined) {
      const invalides = categories.filter(c => !mongoose.Types.ObjectId.isValid(c));
      if (invalides.length > 0) {
        return res.status(400).json({ message: ' Un ou plusieurs identifiants de catégorie invalides' });
      }
      prestataire.categories = categories.map(c => new mongoose.Types.ObjectId(c));
    }

    // CORRECTION 7 : tarif groupé — cohérent avec le modèle corrigé
    if (tarifMin !== undefined) prestataire.tarif.min = Number(tarifMin);
    if (tarifMax !== undefined) prestataire.tarif.max = Number(tarifMax);
    if (devise   !== undefined) prestataire.tarif.devise = devise;

    // Zone géographique — mise à jour partielle
    if (ville  !== undefined) prestataire.zoneGeographique.ville  = ville.trim();
    if (region !== undefined) prestataire.zoneGeographique.region = region.trim();
    if (rayon  !== undefined) prestataire.zoneGeographique.rayon  = Number(rayon);

    // pre('save') recalcule tauxCompletion + valide tarif min ≤ max
    await prestataire.save();

    await prestataire.populate('user',       'nom prenom email telephone avatar isVerified');
    await prestataire.populate('categories', 'nom icone');

    res.status(200).json({
      message:     ' Profil mis à jour avec succès',
      prestataire,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error(' updateProfil:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/prestataires/disponibilite
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const updateDisponibilite = async (req, res) => {
  try {
    const { disponible } = req.body;

    if (disponible === undefined || typeof disponible !== 'boolean') {
      return res.status(400).json({
        message: ' Champ disponible requis (booléen)',
      });
    }

    const prestataire = await Prestataire.findOneAndUpdate(
      { user: req.user.id },
      { disponible },
      { new: true }
    ).select('disponible tauxCompletion noteMoyenne');

    if (!prestataire) {
      return res.status(404).json({ message: ' Prestataire introuvable' });
    }

    res.status(200).json({
      message:    `${disponible ? 'Vous êtes maintenant disponible' : 'Vous êtes maintenant indisponible'}`,
      disponible: prestataire.disponible,
    });
  } catch (error) {
    console.error(' updateDisponibilite:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/prestataires/portfolio
// @access  Privé (prestataire)
// BONUS : gestion du portfolio
// ─────────────────────────────────────────
const ajouterPortfolio = async (req, res) => {
  try {
    const { titre, description, image } = req.body;

    if (!titre?.trim()) {
      return res.status(400).json({ message: ' Le titre est obligatoire' });
    }

    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: ' Profil prestataire introuvable' });
    }

    if (prestataire.portfolio.length >= 10) {
      return res.status(400).json({ message: ' Maximum 10 projets dans le portfolio' });
    }

    prestataire.portfolio.push({
      titre:       titre.trim(),
      description: description?.trim(),
      image,
    });

    await prestataire.save();

    res.status(201).json({
      message:   ' Projet ajouté au portfolio',
      portfolio: prestataire.portfolio,
    });
  } catch (error) {
    console.error(' ajouterPortfolio:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/prestataires/portfolio/:projetId
// @access  Privé (prestataire)
// ─────────────────────────────────────────
const supprimerPortfolio = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: ' Profil prestataire introuvable' });
    }

    const projetExiste = prestataire.portfolio.id(req.params.projetId);
    if (!projetExiste) {
      return res.status(404).json({ message: ' Projet introuvable dans le portfolio' });
    }

    // $pull atomique — plus propre que splice sur le tableau JS
    await Prestataire.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { portfolio: { _id: req.params.projetId } } }
    );

    res.status(200).json({ message: 'Projet supprimé du portfolio' });
  } catch (error) {
    console.error(' supprimerPortfolio:', error.message);
    res.status(500).json({ message: ' Erreur serveur' });
  }
};

module.exports = {
  getTousPrestataires,
  getMonProfil,
  getPrestataire,
  updateProfil,
  updateDisponibilite,
  ajouterPortfolio,
  supprimerPortfolio,
};