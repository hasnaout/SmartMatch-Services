const Prestataire = require('../models/Prestataire');
const User = require('../models/User');


const getTousPrestataires = async (req, res) => {
  try {
    const { categorie, ville, disponible, page = 1, limit = 10 } = req.query;


    const filtre = {};
    if (categorie) filtre.categories = { $in: [categorie] };
    if (ville) filtre['zoneGeographique.ville'] = new RegExp(ville, 'i');
    if (disponible) filtre.disponible = disponible === 'true';

    const skip = (page - 1) * limit;

    const prestataires = await Prestataire.find(filtre)
      .populate('user', 'nom prenom email telephone avatar isVerified')
      .sort({ notemoyenne: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Prestataire.countDocuments(filtre);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      prestataires,
    });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const getMonProfil = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user._id })
      .populate('user', 'nom prenom email telephone avatar isVerified');

    if (!prestataire) {
      return res.status(404).json({ message: '  Profil prestataire introuvable' });
    }

    res.status(200).json({ prestataire });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const getPrestataire = async (req, res) => {
  try {
    const prestataire = await Prestataire.findById(req.params.id)
      .populate('user', 'nom prenom email telephone avatar isVerified');

    if (!prestataire) {
      return res.status(404).json({ message: '  Prestataire introuvable' });
    }

    res.status(200).json({ prestataire });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const updateProfil = async (req, res) => {
  try {
    const {
      description,
      competences,
      categories,
      tarifMin,
      tarifMax,
      ville,
      region,
      rayon,
      experience,
      coordonneesLat,
      coordonneesLng,
    } = req.body;

    const prestataire = await Prestataire.findOne({ user: req.user._id });

    if (!prestataire) {
      return res.status(404).json({ message: '  Profil prestataire introuvable' });
    }


    if (description !== undefined) prestataire.description = description;
    if (competences !== undefined) prestataire.competences = competences;
    if (categories !== undefined) prestataire.categories = categories;
    if (tarifMin !== undefined) prestataire.tarifMin = tarifMin;
    if (tarifMax !== undefined) prestataire.tarifMax = tarifMax;
    if (experience !== undefined) prestataire.experience = experience;

    if (ville || region || rayon || coordonneesLat || coordonneesLng) {
      prestataire.zoneGeographique = {
        ville:  ville  || prestataire.zoneGeographique?.ville,
        region: region || prestataire.zoneGeographique?.region,
        rayon:  rayon  || prestataire.zoneGeographique?.rayon || 20,

        coordonnees: {
          lat: coordonneesLat ? Number(coordonneesLat) : (prestataire.zoneGeographique?.coordonnees?.lat || null),
          lng: coordonneesLng ? Number(coordonneesLng) : (prestataire.zoneGeographique?.coordonnees?.lng || null),
        },
      };
    }

    await prestataire.save();

    res.status(200).json({
      message: '   Profil mis à jour avec succès',
      prestataire,
    });
  } catch (error) {
    console.error('  ERREUR updateProfil:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
}
};


const updateDisponibilite = async (req, res) => {
  try {
    const { disponible } = req.body;

    if (disponible === undefined) {
      return res.status(400).json({ message: '  Champ disponible requis' });
    }

    const prestataire = await Prestataire.findOneAndUpdate(
      { user: req.user._id },
      { disponible },
      { returnDocument: 'after' }
    );

    if (!prestataire) {
      return res.status(404).json({ message: '  Prestataire introuvable' });
    }

    res.status(200).json({
      message: `   Disponibilité mise à jour : ${disponible ? 'Disponible' : 'Non disponible'}`,
      disponible: prestataire.disponible,
    });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = {
  getTousPrestataires,
  getMonProfil,
  getPrestataire,
  updateProfil,
  updateDisponibilite,
};
