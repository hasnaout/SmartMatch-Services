const Categorie = require('../models/Categorie');

const getCategories = async (req, res) => {
  try {
    const categories = await Categorie.find().sort({ ordre: 1, createdAt: 1 });
    res.status(200).json({ total: categories.length, categories });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const getCategoriesActives = async (req, res) => {
  try {
    const categories = await Categorie.find({ isActive: true }).sort({ ordre: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const creerCategorie = async (req, res) => {
  try {
    const { nom, description, icone, ordre } = req.body;
    if (!nom) return res.status(400).json({ message: '  Le nom est obligatoire' });

    const existe = await Categorie.findOne({ nom: new RegExp(`^${nom}$`, 'i') });
    if (existe) return res.status(400).json({ message: '  Cette catégorie existe déjà' });

    const categorie = await Categorie.create({ nom, description, icone, ordre });
    res.status(201).json({ message: '   Catégorie créée', categorie });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const updateCategorie = async (req, res) => {
  try {
    const { nom, description, icone, isActive, ordre } = req.body;
    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      { nom, description, icone, isActive, ordre },
      { new: true }
    );
    if (!categorie) return res.status(404).json({ message: '  Catégorie introuvable' });
    res.status(200).json({ message: '   Catégorie mise à jour', categorie });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const supprimerCategorie = async (req, res) => {
  try {
    const categorie = await Categorie.findByIdAndDelete(req.params.id);
    if (!categorie) return res.status(404).json({ message: '  Catégorie introuvable' });
    res.status(200).json({ message: '   Catégorie supprimée' });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = { getCategories, getCategoriesActives, creerCategorie, updateCategorie, supprimerCategorie };