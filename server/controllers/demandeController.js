const Demande      = require('../models/Demande');
const Prestataire  = require('../models/Prestataire');
const { calculerScore }     = require('../utils/matchingEngine');
const { creerNotification } = require('../utils/notificationHelper');


const creerDemande = async (req, res) => {
  try {
    const {
      titre, description, categorie,
      budgetMin, budgetMax, ville, region, adresse, fichiers, coordonneesLat, coordonneesLng,
    } = req.body;

    if (!titre || !description || !categorie) {
      return res.status(400).json({
        message: '  Titre, description et catégorie sont obligatoires',
      });
    }

    const demande = await Demande.create({
      client:      req.user.id,
      titre,
      description,
      categorie,
      budget: {
        min: Number(budgetMin) || 0,
        max: Number(budgetMax) || 0,
      },
      localisation: {
        ville:   ville   || '',
        region:  region  || '',
        adresse: adresse || '',

        coordonnees: {
          lat: coordonneesLat ? Number(coordonneesLat) : null,
          lng: coordonneesLng ? Number(coordonneesLng) : null,
        },
      },
      fichiers: Array.isArray(fichiers) ? fichiers : [],
    });

    const prestataires = await Prestataire.find({
      categories: { $in: [categorie] },
      disponible:  true,
    }).populate('user', 'nom prenom email telephone avatar isVerified');

    const recommandations = prestataires
      .map(p => ({ prestataire: p._id, score: calculerScore(p, demande) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    demande.prestatairesRecommandes = recommandations;
    await demande.save();


    const io = req.app.get('io');
    for (const r of recommandations) {
      const prest = prestataires.find(
        p => p._id.toString() === r.prestataire.toString()
      );
      if (prest?.user?._id) {
        await creerNotification(io, {
          destinataire: prest.user._id,
          type:    'nouvelle_demande',
          titre:   ' Nouvelle mission disponible',
          message: `Une nouvelle demande "${titre}" correspond à votre profil`,
          lien:    '/prestataire/demandes',
        });
      }
    }

    await demande.populate([
      { path: 'client', select: 'nom prenom email' },
      {
        path: 'prestatairesRecommandes.prestataire',
        populate: { path: 'user', select: 'nom prenom email telephone avatar isVerified' },
      },
    ]);

    res.status(201).json({
      message: '   Demande créée avec succès',
      demande,
    });
  } catch (error) {
    console.error('  ERREUR creerDemande:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const getMesDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find({ client: req.user.id })
      .populate('client', 'nom prenom email')
      .populate({
        path: 'prestatairesRecommandes.prestataire',
        populate: { path: 'user', select: 'nom prenom email telephone avatar isVerified' },
      })
      .populate({
        path: 'prestataireChoisi',
        populate: { path: 'user', select: 'nom prenom email telephone avatar isVerified' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ total: demandes.length, demandes });
  } catch (error) {
    console.error('  ERREUR getMesDemandes:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const getDemandesDisponibles = async (req, res) => {
  try {
    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: '  Profil prestataire introuvable' });
    }

    const demandes = await Demande.find({
      categorie: { $in: prestataire.categories },
      statut:    'publiée',
    })
      .populate('client', 'nom prenom email')
      .sort({ createdAt: -1 });

    res.status(200).json({ total: demandes.length, demandes });
  } catch (error) {
    console.error('  ERREUR getDemandesDisponibles:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const getDemande = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom email telephone')
      .populate({
        path: 'prestatairesRecommandes.prestataire',
        populate: { path: 'user', select: 'nom prenom email' },
      })
      .populate({
        path: 'prestataireChoisi',
        populate: { path: 'user', select: 'nom prenom email telephone' },
      });

    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    const isClient = demande.client._id.toString() === req.user.id;
    const isAdmin  = req.user.role === 'admin';

    let isPrestataireAutorise = false;

    if (req.user.role === 'prestataire') {
      const prestataire = await Prestataire.findOne({ user: req.user.id });
      if (prestataire) {
        const pid = prestataire._id.toString();


        const choisi = demande.prestataireChoisi?._id?.toString()
          || demande.prestataireChoisi?.toString();


        const recommande = demande.prestatairesRecommandes?.some(
          r => r.prestataire?._id?.toString() === pid
            || r.prestataire?.toString() === pid
        );


        const categorieMatch = prestataire.categories?.includes(demande.categorie);

        isPrestataireAutorise = choisi === pid || recommande || categorieMatch;
      }
    }

    if (!isClient && !isPrestataireAutorise && !isAdmin) {
      return res.status(403).json({ message: '  Non autorisé' });
    }

    res.status(200).json({ demande });
  } catch (error) {
    console.error('  ERREUR getDemande:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


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
    await demande.save();


    if (statut === 'terminée' && ancienStatut !== 'terminée' && demande.prestataireChoisi) {
      await Prestataire.findByIdAndUpdate(demande.prestataireChoisi, {
        $inc: { nombreMissionsReussies: 1 },
      });

      const prest = await Prestataire.findById(demande.prestataireChoisi);
      if (prest) {
        const io = req.app.get('io');
        await creerNotification(io, {
          destinataire: prest.user,
          type:    'demande_terminee',
          titre:   '   Mission terminée',
          message: `La mission "${demande.titre}" a été marquée comme terminée`,
          lien:    '/prestataire/dashboard',
        });
      }
    }

    res.status(200).json({
      message: `   Statut mis à jour : ${statut}`,
      demande,
    });
  } catch (error) {
    console.error('  ERREUR updateStatut:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const choisirPrestataire = async (req, res) => {
  try {
    const { prestataireId } = req.body;
    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom');

    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    if (demande.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: '  Non autorisé' });
    }

    demande.prestataireChoisi = prestataireId;
    demande.statut = 'en_cours';
    await demande.save();

    const prest = await Prestataire.findById(prestataireId);
    if (prest) {
      const io = req.app.get('io');
      await creerNotification(io, {
        destinataire: prest.user,
        type:    'demande_acceptee',
        titre:   '  Mission acceptée !',
        message: `Vous avez été choisi pour la mission "${demande.titre}"`,
        lien:    '/prestataire/demandes',
      });
    }

    res.status(200).json({ message: '   Prestataire choisi', demande });
  } catch (error) {
    console.error('  ERREUR choisirPrestataire:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};


const terminerMission = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('client', 'nom prenom');

    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    const prestataire = await Prestataire.findOne({ user: req.user.id });
    if (!prestataire) {
      return res.status(404).json({ message: '  Profil prestataire introuvable' });
    }

    const prestataireChoisiId = demande.prestataireChoisi?._id?.toString()
      || demande.prestataireChoisi?.toString();

    if (prestataireChoisiId !== prestataire._id.toString()) {
      return res.status(403).json({
        message: '  Vous n\'êtes pas assigné à cette mission',
      });
    }

    if (demande.statut !== 'en_cours') {
      return res.status(400).json({
        message: '  La mission doit être en cours pour être terminée',
      });
    }

    demande.statut = 'terminée';
    await demande.save();

    const io = req.app.get('io');
    await creerNotification(io, {
      destinataire: demande.client._id,
      type:    'demande_terminee',
      titre:   '   Mission terminée !',
      message: `Le prestataire a terminé la mission "${demande.titre}"`,
      lien:    `/client/demandes/${demande._id}`,
    });

    res.status(200).json({
      message: '   Mission marquée comme terminée',
      demande,
    });
  } catch (error) {
    console.error('  ERREUR terminerMission:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
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
