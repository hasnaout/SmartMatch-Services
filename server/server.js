const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const mongoose   = require('mongoose');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

dotenv.config();

// ── Connexion DB ──
connectDB();

// ── Initialisation des catégories après connexion stable ──
const initCategories = async () => {
  try {
    const Categorie = require('./models/Categorie');
    const count = await Categorie.countDocuments();
    if (count === 0) {
      await Categorie.insertMany([
        { nom: 'Plomberie',     ordre: 1  },
        { nom: 'Électricité',   ordre: 2  },
        { nom: 'Informatique',  ordre: 3  },
        { nom: 'Jardinage',      ordre: 4  },
        { nom: 'Peinture',       ordre: 5  },
        { nom: 'Maçonnerie',    ordre: 6  },
        { nom: 'Menuiserie',    ordre: 7  },
        { nom: 'Climatisation', ordre: 8  },
        { nom: 'Déménagement',   ordre: 9  },
        { nom: 'Nettoyage',     ordre: 10 },
        { nom: 'Cuisine',       ordre: 11 },
        { nom: 'Design',        ordre: 12 },
        { nom: 'Marketing',     ordre: 13 },
        { nom: 'Traduction',    ordre: 14 },
        { nom: 'Autre',         ordre: 15 },
      ]);
      console.log(' Catégories initialisées');
    }
  } catch (err) {
    console.error(' Erreur initCategories:', err.message);
  }
};

// CORRECTION 1 : attendre que Mongoose soit connecté avant d'initialiser
mongoose.connection.once('open', () => {
  initCategories();
});

const app    = express();
const server = http.createServer(app);

// ── CORRECTION 2 : config CORS unifiée (une seule source de vérité) ──
const corsOptions = {
  origin:  process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};

// ── Socket.io (utilise la même config CORS) ──
const io = new Server(server, { cors: corsOptions });

// Rendre io accessible dans les controllers
app.set('io', io);

io.on('connection', (socket) => {
  // Rejoindre sa room personnelle pour les notifications
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {});
});

// ── CORRECTION 3 : Helmet (sécurité des headers HTTP) ──
app.use(helmet());

// ── CORRECTION 4 : Rate limiting global ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,
  message:  { message: ' Trop de requêtes, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use(globalLimiter);

// Rate limiting renforcé sur les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: ' Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Middlewares ──
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ──
app.use('/api/auth',          authLimiter, require('./routes/authRoutes'));
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

// ── Route de santé ──
app.get('/', (req, res) => res.json({ message: ' SmartMatch API fonctionne !', version: '1.0.0' }));

// ── 404 ──
app.use((req, res) => res.status(404).json({ message: ' Route non trouvée' }));

// ── Gestionnaire d'erreurs global ──
app.use((err, req, res, next) => {
  console.error(' Erreur globale:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || ' Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`  Serveur démarré sur le port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
);