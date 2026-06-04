const mongoose = require('mongoose');
const Message  = require('../models/Message');
const Demande  = require('../models/Demande');

// ─────────────────────────────────────────
// @route   POST /api/messages
// @access  Privé
// ─────────────────────────────────────────
const envoyerMessage = async (req, res) => {
  try {
    const { destinataireId, demandeId, contenu } = req.body;

    if (!destinataireId || !demandeId || !contenu?.trim()) {
      return res.status(400).json({ message: '  Tous les champs sont obligatoires' });
    }

    if (contenu.trim().length > 2000) {
      return res.status(400).json({ message: '  Message trop long (2000 caractères max)' });
    }

    // CORRECTION 1 : vérifier les droits d'accès à la demande
    const demande = await Demande.findById(demandeId).select(
      'client prestataireChoisi statut titre'
    );
    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    const clientId            = demande.client.toString();
    const prestataireChoisiId = demande.prestataireChoisi?.toString();
    const userId              = req.user.id;

    const estAutorise =
      userId === clientId ||
      userId === prestataireChoisiId ||
      req.user.role === 'admin';

    if (!estAutorise) {
      return res.status(403).json({
        message: '  Vous n\'êtes pas autorisé à envoyer des messages sur cette demande',
      });
    }

    // Vérifier que la demande est active (pas annulée)
    if (demande.statut === 'annulée') {
      return res.status(400).json({
        message: '  Impossible d\'envoyer un message sur une demande annulée',
      });
    }

    // CORRECTION 2 : utiliser la méthode statique du modèle Message
    const roomId = Message.genererRoomId(demandeId, userId, destinataireId);

    const message = await Message.create({
      roomId,
      expediteur:   userId,
      destinataire: destinataireId,
      demande:      demandeId,
      contenu:      contenu.trim(),
      // Expéditeur marque son propre message comme lu immédiatement
      luspar: [{ utilisateur: new mongoose.Types.ObjectId(userId), luLe: new Date() }],
    });

    await message.populate('expediteur',   'nom prenom avatar');
    await message.populate('destinataire', 'nom prenom avatar');

    // Émettre via Socket.io pour le temps réel
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('receive_message', message);
      // Notifier le destinataire sur sa room personnelle
      io.to(`user_${destinataireId}`).emit('nouvelle_notification_message', {
        roomId,
        expediteur: { nom: req.user.nom, prenom: req.user.prenom },
        apercu:     contenu.trim().substring(0, 50),
      });
    }

    res.status(201).json({ message: '  Message envoyé', data: message });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant invalide' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('  envoyerMessage:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/messages/:demandeId/:userId
// @access  Privé
// ─────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { demandeId, userId } = req.params;

    // CORRECTION 3 : utiliser la méthode statique du modèle
    const roomId = Message.genererRoomId(demandeId, req.user.id, userId);

    // CORRECTION 4 : pagination
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ roomId })
        .populate('expediteur',   'nom prenom avatar')
        .populate('destinataire', 'nom prenom avatar')
        .sort({ createdAt: -1 })  // du plus récent au plus ancien
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Message.countDocuments({ roomId }),
    ]);

    // CORRECTION 5 : marquer comme lus avec le nouveau schéma luspar
    const messagesNonLus = messages
      .filter(m =>
        m.destinataire?._id?.toString() === req.user.id &&
        !m.luspar?.some(l => l.utilisateur?.toString() === req.user.id)
      )
      .map(m => m._id);

    if (messagesNonLus.length > 0) {
      await Message.updateMany(
        { _id: { $in: messagesNonLus } },
        {
          $addToSet: {
            luspar: {
              utilisateur: new mongoose.Types.ObjectId(req.user.id),
              luLe:        new Date(),
            },
          },
        }
      );
    }

    res.status(200).json({
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      messages:   messages.reverse(), // remettre dans l'ordre chronologique
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: '  Identifiant invalide' });
    }
    console.error('  getMessages:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/messages/conversations
// @access  Privé
// ─────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // CORRECTION 6 : agrégation MongoDB — zéro message chargé inutilement
    // On récupère uniquement le dernier message par roomId + le compteur non lus
    const conversations = await Message.aggregate([
      // Filtrer les messages impliquant cet utilisateur
      {
        $match: {
          $or: [
            { expediteur:   userId },
            { destinataire: userId },
          ],
        },
      },
      // Trier par date décroissante avant le groupBy
      { $sort: { createdAt: -1 } },
      // Grouper par roomId — garder uniquement le premier (= le plus récent)
      {
        $group: {
          _id:            '$roomId',
          dernierMessage: { $first: '$$ROOT' },
          totalMessages:  { $sum: 1 },
          nonLus: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$destinataire', userId] },
                    {
                      $not: {
                        $in: [userId, '$luspar.utilisateur'],
                      },
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      // Lookup pour enrichir la demande
      {
        $lookup: {
          from:         'demandes',
          localField:   'dernierMessage.demande',
          foreignField: '_id',
          as:           'demandeInfo',
        },
      },
      {
        $addFields: {
          demande: { $arrayElemAt: ['$demandeInfo', 0] },
        },
      },
      // Lookup pour enrichir l'expéditeur
      {
        $lookup: {
          from:         'users',
          localField:   'dernierMessage.expediteur',
          foreignField: '_id',
          as:           'expediteurInfo',
        },
      },
      {
        $addFields: {
          expediteur: { $arrayElemAt: ['$expediteurInfo', 0] },
        },
      },
      // Projeter uniquement ce dont le frontend a besoin
      {
        $project: {
          roomId:         '$_id',
          _id:            0,
          nonLus:         1,
          totalMessages:  1,
          dernierMessage: {
            contenu:   '$dernierMessage.contenu',
            createdAt: '$dernierMessage.createdAt',
          },
          demande: {
            _id:    '$demande._id',
            titre:  '$demande.titre',
            statut: '$demande.statut',
          },
          expediteur: {
            _id:    '$expediteur._id',
            nom:    '$expediteur.nom',
            prenom: '$expediteur.prenom',
            avatar: '$expediteur.avatar',
          },
        },
      },
      { $sort: { 'dernierMessage.createdAt': -1 } },
    ]);

    res.status(200).json({
      total: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error('  getConversations:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

// ─────────────────────────────────────────
// @route   GET /api/messages/non-lus
// @access  Privé
// ─────────────────────────────────────────
const getNonLus = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // CORRECTION 7 : utiliser la méthode statique du modèle
    const count = await Message.compterNonLus(null, req.user.id);

    res.status(200).json({ nonLus: count });
  } catch (error) {
    console.error('  getNonLus:', error.message);
    res.status(500).json({ message: '  Erreur serveur' });
  }
};

module.exports = { envoyerMessage, getMessages, getConversations, getNonLus };