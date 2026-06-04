const Categorie   = require('../models/Categorie');
const Demande     = require('../models/Demande');
const Prestataire = require('../models/Prestataire');

// ─────────────────────────────────────────
// @route   GET /api/categories
// @access  Privé (admin) — toutes les catégories avec pagination
// ─────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;
    const filtre = {};
    if (isActive !== undefined) filtre.isActive = isActive === 'true';

    const skip = (page - 1) * Number(limit);

    const [categories, total] = await Promise.all([
      Categorie.find(filtre)
        .sort({ ordre: 1, createdAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Categorie.countDocuments(filtre),
    ]);

    res.status(200).json({ total, page: Number(page), categories });
  } catch (error) {
    console.error('  getCategories:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/categories/actives
// @access  Public — pour le formulaire de création de demande
// ─────────────────────────────────────────
const getCategoriesActives = async (req, res) => {
  try {
    // CORRECTION 1 : utiliser la méthode statique définie dans le modèle
    const categories = await Categorie.getActives();
    res.status(200).json({ total: categories.length, categories });
  } catch (error) {
    console.error('  getCategoriesActives:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/categories
// @access  Privé (admin)
// ─────────────────────────────────────────
const creerCategorie = async (req, res) => {
  try {
    const { nom, description, icone, ordre } = req.body;

    if (!nom?.trim()) {
      return res.status(400).json({ message: '  Le nom est obligatoire' });
    }

    // CORRECTION 2 : laisser l'index unique gérer le doublon atomiquement
    // La vérification RegExp préalable reste pour un message d'erreur clair
    const existe = await Categorie.findOne({
      nom: { $regex: `^${nom.trim()}$`, $options: 'i' },
    });
    if (existe) {
      return res.status(400).json({ message: '  Cette catégorie existe déjà' });
    }

    const categorie = await Categorie.create({
      nom:         nom.trim(),
      description: description?.trim(),
      icone:       icone || '🔧',
      ordre:       ordre || 0,
    });

    res.status(201).json({ message: '  Catégorie créée', categorie });
  } catch (error) {
    // CORRECTION 3 : intercepter E11000 proprement
    if (error.code === 11000) {
      return res.status(400).json({ message: '  Cette catégorie existe déjà' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('  creerCategorie:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/categories/:id
// @access  Privé (admin)
// ─────────────────────────────────────────
const updateCategorie = async (req, res) => {
  try {
    const { nom, description, icone, isActive, ordre } = req.body;

    // CORRECTION 4 : construire dynamiquement — ne mettre à jour que les champs fournis
    const miseAJour = {};
    if (nom         !== undefined) miseAJour.nom         = nom.trim();
    if (description !== undefined) miseAJour.description = description.trim();
    if (icone       !== undefined) miseAJour.icone       = icone;
    if (isActive    !== undefined) miseAJour.isActive    = isActive;
    if (ordre       !== undefined) miseAJour.ordre       = ordre;

    if (Object.keys(miseAJour).length === 0) {
      return res.status(400).json({ message: '  Aucun champ à mettre à jour' });
    }

    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      { $set: miseAJour },
      {
        new:          true,
        runValidators: true, // CORRECTION 5 : déclencher les validateurs Mongoose
      }
    );

    if (!categorie) {
      return res.status(404).json({ message: '  Catégorie introuvable' });
    }

    res.status(200).json({ message: '  Catégorie mise à jour', categorie });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '  Ce nom de catégorie existe déjà' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('  updateCategorie:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/categories/:id
// @access  Privé (admin)
// ─────────────────────────────────────────
const supprimerCategorie = async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);
    if (!categorie) {
      return res.status(404).json({ message: '  Catégorie introuvable' });
    }

    // CORRECTION 6 : vérifier les dépendances avant suppression
    const [demandesCount, prestatairesCount] = await Promise.all([
      Demande.countDocuments({ categorie: req.params.id }),
      Prestataire.countDocuments({ categories: req.params.id }),
    ]);

    if (demandesCount > 0 || prestatairesCount > 0) {
      // Désactiver plutôt que supprimer — suppression logique
      await Categorie.findByIdAndUpdate(req.params.id, { isActive: false });

      return res.status(200).json({
        message:   `  Catégorie désactivée (non supprimée) — ${demandesCount} demande(s) et ${prestatairesCount} prestataire(s) l'utilisent encore`,
        desactivee: true,
        stats: { demandesCount, prestatairesCount },
      });
    }

    // Aucune dépendance — suppression réelle
    await Categorie.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '  Catégorie supprimée', desactivee: false });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant invalide' });
    }
    console.error('  supprimerCategorie:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

module.exports = {
  getCategories,
  getCategoriesActives,
  creerCategorie,
  updateCategorie,
  supprimerCategorie,
};