const dotenv = require('dotenv');
dotenv.config();

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

connectDB();

const initCategories = async () => {
  const Categorie = require('./models/Categorie');
  const count = await Categorie.countDocuments();
  if (count === 0) {
    await Categorie.insertMany([
      { nom: 'Plomberie',ordre: 1 },
      { nom: 'Électricité',ordre: 2 },
      { nom: 'Informatique', ordre: 3 },
      { nom: 'Jardinage', ordre: 4 },
      { nom: 'Peinture', ordre: 5 },
      { nom: 'Maçonnerie', ordre: 6 },
      { nom: 'Menuiserie',  ordre: 7 },
      { nom: 'Climatisation', ordre: 8 },
      { nom: 'Déménagement',ordre: 9 },
      { nom: 'Nettoyage', ordre: 10 },
      { nom: 'Cuisine',  ordre: 11 },
      { nom: 'Design', ordre: 12 },
      { nom: 'Marketing', ordre: 13 },
      { nom: 'Traduction',    ordre: 14 },
      { nom: 'Autre',    rdre: 15 },
    ]);
    console.log('   Catégories initialisées');
  }
};
initCategories();

const app    = express();
const server = http.createServer(app);

// ── Socket.io ──
const allowedOrigins = ['http://localhost:5173', 'http://localhost', 'http://localhost:80'];
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Connecté : ${socket.id}`);

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} a rejoint sa room`);
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`  Déconnecté : ${socket.id}`);
  });
});

// ── Middlewares ──
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/prestataires',  require('./routes/prestataireRoutes'));
app.use('/api/demandes',      require('./routes/demandeRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/avis',          require('./routes/avisRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload',        require('./routes/uploadRoutes'));
app.use('/api/paiements',     require('./routes/paiementRoutes'));
app.use('/api/categories',    require('./routes/categorieRoutes'));
app.use('/api/chatbot',       require('./chatbot'));

app.get('/', (req, res) => res.json({ message: '   SmartMatch API fonctionne !' }));

app.use((req, res) => res.status(404).json({ message: '  Route non trouvée' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '  Erreur serveur', error: err.message });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`  Serveur démarré sur le port ${PORT}`));