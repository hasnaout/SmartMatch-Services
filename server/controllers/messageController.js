const Message = require('../models/Message');
const Demande  = require('../models/Demande');

// ── Générer roomId cohérent et toujours identique ──
const genererRoomId = (demandeId, userId1, userId2) => {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${demandeId}_${ids[0]}_${ids[1]}`;
};

const envoyerMessage = async (req, res) => {
  try {
    const { destinataireId, demandeId, contenu } = req.body;

    if (!destinataireId || !demandeId || !contenu) {
      return res.status(400).json({ message: '  Tous les champs sont obligatoires' });
    }

    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ message: '  Demande introuvable' });
    }

    const roomId = genererRoomId(demandeId, req.user.id, destinataireId);
    console.log('💬 RoomId généré:', roomId);

    const message = await Message.create({
      roomId,
      expediteur:   req.user.id,
      destinataire: destinataireId,
      demande:      demandeId,
      contenu,
    });

    await message.populate('expediteur',   'nom prenom avatar');
    await message.populate('destinataire', 'nom prenom avatar');

    res.status(201).json({ message: '   Message envoyé', data: message });
  } catch (error) {
    console.error('  ERREUR envoyerMessage:', error);
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { demandeId, userId } = req.params;
    const roomId = genererRoomId(demandeId, req.user.id, userId);
    console.log('📨 Récupération messages roomId:', roomId);

    const messages = await Message.find({ roomId })
      .populate('expediteur',   'nom prenom avatar')
      .populate('destinataire', 'nom prenom avatar')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { roomId, destinataire: req.user.id, lu: false },
      { lu: true }
    );

    res.status(200).json({ total: messages.length, messages });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { expediteur:   req.user.id },
        { destinataire: req.user.id },
      ],
    })
      .populate('expediteur',   'nom prenom avatar')
      .populate('destinataire', 'nom prenom avatar')
      .populate('demande', 'titre statut')
      .sort({ createdAt: -1 });

    const conversations = {};
    messages.forEach(msg => {
      if (!conversations[msg.roomId]) {
        conversations[msg.roomId] = {
          roomId:         msg.roomId,
          demande:        msg.demande,
          dernierMessage: msg,
          nonLus:         0,
        };
      }
      if (!msg.lu && msg.destinataire?._id?.toString() === req.user.id) {
        conversations[msg.roomId].nonLus++;
      }
    });

    res.status(200).json({
      total:         Object.keys(conversations).length,
      conversations: Object.values(conversations),
    });
  } catch (error) {
    res.status(500).json({ message: '  Erreur serveur', error: error.message });
  }
};

module.exports = { envoyerMessage, getMessages, getConversations };