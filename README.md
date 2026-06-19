# SmartMatch Services

Plateforme web de mise en relation entre clients et prestataires de services (plomberie, électricité, informatique, jardinage, etc.).

## Fonctionnalités

- **Clients** : créer des demandes de service, choisir un prestataire parmi les recommandations, suivre l'avancement, payer en ligne (Stripe), laisser un avis
- **Prestataires** : gérer leur profil et disponibilité, consulter les demandes correspondant à leurs catégories, terminer des missions, suivre leurs revenus
- **Administrateurs** : gérer les utilisateurs, modérer les avis, consulter les analytics
- **Matching automatique** : algorithme de scoring qui recommande les prestataires les plus adaptés (catégorie, localisation, disponibilité, note, expérience)
- **Messagerie temps réel** : chat entre client et prestataire via Socket.IO
- **Notifications temps réel** : alertes instantanées sur les nouvelles demandes, missions acceptées, etc.
- **Chatbot assistant** : powered by Groq (avec fallback par mots-clés)

## Architecture

```
SmartMatch/
├── client/          # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── pages/       # Pages par rôle (client, prestataire, admin)
│   │   ├── components/  # Composants réutilisables
│   │   ├── context/     # AuthContext (JWT)
│   │   └── services/    # Appels API (axios)
│   ├── Dockerfile
│   └── nginx.conf
├── server/          # Backend Node.js / Express
│   ├── controllers/ # Logique métier
│   ├── routes/      # Routes API REST
│   ├── models/      # Schémas Mongoose
│   ├── middleware/  # Auth JWT, rôles, upload
│   ├── utils/       # matchingEngine, notificationHelper
│   ├── Dockerfile
│   └── server.js
├── docker-compose.yml
└── .env.example
```

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v7 |
| Backend | Node.js, Express, Socket.IO |
| Base de données | MongoDB 7 (Mongoose) |
| Authentification | JWT (jsonwebtoken, bcryptjs) |
| Paiement | Stripe |
| Upload images | ImgBB API |
| IA / Chatbot | Groq API |
| Conteneurisation | Docker, Docker Compose, Nginx |

## Prérequis

- [Docker](https://www.docker.com/) et Docker Compose installés
- Clés API : Stripe, Groq, ImgBB (voir `.env.example`)

## Installation et lancement

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd SmartMatch
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Editer `.env` et remplir toutes les valeurs requises.

### 3. Lancer avec Docker

```bash
docker-compose up --build
```

L'application sera accessible sur **http://localhost**

### Lancement en développement (sans Docker)

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev   # ou: node server.js

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

Frontend : http://localhost:5173  
Backend : http://localhost:5001

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète.

| Variable | Description |
|----------|-------------|
| `MONGO_USER` | Nom d'utilisateur MongoDB |
| `MONGO_PASSWORD` | Mot de passe MongoDB |
| `JWT_SECRET` | Clé secrète pour les tokens JWT |
| `JWT_EXPIRES_IN` | Durée de validité du token (ex: `7d`) |
| `GROQ_API_KEY` | Clé API Groq pour le chatbot |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (paiements) |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (frontend) |
| `IMGBB_API_KEY` | Clé API ImgBB (upload photos) |

## Comptes de test

Après le premier lancement, créer des comptes via l'interface d'inscription :
- Rôle **client** : peut créer des demandes
- Rôle **prestataire** : peut répondre aux demandes
- Rôle **admin** : créer manuellement en base (role: "admin")
