# 🔧 Flux d'Assignation des Prestataires

## Vue d'ensemble

Voici le processus complet d'une demande, de sa création à sa termination :

---

## 1️⃣ **Création de la demande** (Client)

**Endpoint:** `POST /api/demandes`
**Route:** `client/CreerDemande.jsx` → envoie `{ titre, description, categorie, budgetMin, budgetMax, localisation, fichiers }`

**Backend (`crierDemande`):**
```javascript
POST /api/demandes
Body: {
  titre, description, categorie, urgence,
  budgetMin, budgetMax, ville, region, adresse,
  fichiers: [] //    Maintenant supporté
}
```

-    Crée une nouvelle demande avec `statut: 'publiée'`
-    Stocke les fichiers reçus (`fichiers` array)
-    **Matching automatique** : trouve les prestataires recommandés (0-5 meilleurs scores)
  - Critères : catégorie, disponibilité, zone géographique, note, historique
-    Les prestataires recommandés reçoivent une **notification** : "Nouvelle mission disponible"

**Structure de la demande après création :**
```javascript
{
  _id: "...",
  client: "userId_du_client",
  statut: "publiée",
  prestataireChoisi: null,  //   Pas encore assigné
  prestatairesRecommandes: [
    { prestataire: prestataire_id_1, score: 95 },
    { prestataire: prestataire_id_2, score: 89 },
    { prestataire: prestataire_id_3, score: 84 },
    ...
  ],
  fichiers: [ { url: "...", nom: "...", type: "..." } ],
  ...
}
```

---

## 2️⃣ **Client voit les prestataires recommandés**

**Frontend:** `client/MesDemandes.jsx` (dans le détail d'une demande)
- Affiche la liste des prestataires recommandés (avec note, avis, etc.)
- Client clique sur "Choisir ce prestataire"

---

## 3️⃣ **Client choisit un prestataire**    **C'EST L'ASSIGNATION**

**Endpoint:** `PUT /api/demandes/:id/choisir-prestataire`
**Route:** `client/MesDemandes.jsx` → appelle `choisirPrestataire`

**Backend (`choisirPrestataire`):**
```javascript
PUT /api/demandes/{id}/choisir-prestataire
Body: { prestataireId: "prestataire_id" }

// Vérifie que le client est propriétaire de la demande
// Assigne le prestataire
demande.prestataireChoisi = prestataireId;
demande.statut = "en_cours";
// Notifie le prestataire : "Vous avez été choisi pour la mission..."
```

**Après assignation :**
```javascript
{
  _id: "...",
  client: "userId_du_client",
  prestataireChoisi: "prestataire_id",  //    Assigné !
  statut: "en_cours",
  ...
}
```

---

## 4️⃣ **Le prestataire assigné peut maintenant :**

###    Voir le détail de la mission
**Endpoint:** `GET /api/demandes/:id`
- **Vérification d'accès corrigée** :
  - Si vous êtes le **client propriétaire** →    Accès
  - Si vous êtes le **prestataire recommandé** (dans la liste) →    Accès (voir la mission avant de décider)
  - Si vous êtes le **prestataire choisi** →    Accès (c'est votre mission assignée)
  - Si vous êtes **admin** →    Accès

###    Échanger des messages avec le client
**Endpoint:** `POST /api/messages`
```javascript
Body: {
  destinataireId: "userId_du_client",
  demandeId: "...",
  contenu: "Bonjour, j'ai quelques questions..."
}

//    Vérification d'accès corrigée :
// - L'expéditeur doit être client OU prestataire CHOISI de cette demande
// - Le destinataire doit être client OU prestataire CHOISI de cette demande
```

###    Terminer la mission
**Endpoint:** `PUT /api/demandes/:id/terminer`
```javascript
// Marque la mission comme 'terminée'
// Incrémente le compteur de missions réussies du prestataire
// Notifie le client
```

---

## 5️⃣ **Client peut noter le prestataire** (après termination)

**Endpoint:** `POST /api/avis`
```javascript
Body: {
  prestataireId: "...",
  demandeId: "...",
  note: 5,
  commentaire: "Excellent travail !"
}

//    Vérification d'accès corrigée :
// - La demande doit être TERMINÉE
// - Le client doit être propriétaire
// - Le prestataire spécifié doit correspondre au prestataireChoisi
```

---

## 6️⃣ **Changement de statut (Client ou Admin)**

**Endpoint:** `PUT /api/demandes/:id/statut`
```javascript
Body: { statut: "annulée" | "terminée" }

// Vérifications :
// - Doit être client propriétaire OU admin
// - updateStatut : évite les incréments multiples (vérifie l'ancien statut)
```

---

## 📊 Diagramme de statuts

```
┌─────────────┐
│   publiée   │  ← Demande créée, prestataires recommandés notifiés
└──────┬──────┘
       │ client choisit un prestataire
       ↓
┌─────────────┐
│  en_cours   │  ← Prestataire assigné, peut accéder et messager
└──────┬──────┘
       │ client/admin marque comme terminée
       ├───→ ┌──────────┐
       │     │ terminée │  ← Prestataire +1 mission réussie, client peut noter
       ↓     └──────────┘
┌─────────────┐
│  annulée    │  ← Client/admin annule la demande
└─────────────┘
```

---

## 🔐 Résumé des corrections d'accès

| Endpoint | Client | Prestataire Recommandé | Prestataire Choisi | Admin | Notes |
|----------|--------|--------|--------|-------|-------|
| `GET /api/demandes/:id` |    |    |    |    | Voir la demande |
| `POST /api/messages` |    |   |    |   | Seul le client et prestataire CHOISI peuvent messager |
| `POST /api/avis` |    |   |   |   | Seul le client, demande terminée, prestataire doit correspondre |
| `PUT /api/demandes/:id/choisir-prestataire` |    |   |   |   | Seul le client propriétaire |
| `PUT /api/demandes/:id/terminer` |   |   |    |   | Seul le prestataire CHOISI |
| `PUT /api/demandes/:id/statut` |    |   |   |    | Client ou Admin |

---

##    Problèmes corrigés

1. **Double `getDemande`** →   Supprimé
2. **`getMesDemandes` manquante** →    Implémentée (demandes du client connecté)
3. **`getDemande` accès trop permissif** →    Vérification d'accès basée sur le rôle et l'assignation
4. **`envoyerMessage` sans vérification** →    Vérifie que les deux sont client/prestataire CHOISI
5. **`creerAvis` sans vérification prestataire** →    Vérifie que le prestataire noté = prestataire CHOISI
6. **`updateStatut` incréments multiples** →    Vérifie l'ancien statut avant incrémenter
7. **Fichiers ignorés** →    `crierDemande` stocke maintenant les fichiers

---

##   Points clés

- **Assignation = Choix du prestataire par le client**
  - Avant : prestataire peut voir la demande (si recommandé), mais c'est une demande "publique"
  - Après : prestataire a une mission assignée et exclusive avec le client

- **Les prestataires ne peuvent que messager avec le client APRÈS assignation**
  - Pas de messagerie entre prestataires recommandés et clients avant assignation
  - Évite les spams et maintient une relation professionnelle claire

- **Sécurité renforcée**
  - Toutes les opérations vérifient les droits d'accès
  - Impossible de voir/modifier les demandes des autres utilisateurs
