// server/chatbot.js
// ─────────────────────────────────────────────────────────────────
//  Chatbot intelligent — propulsé par un LLM (claude-haiku)
//  Interface identique à l'ancienne version :
//    POST /api/chatbot  { message: string } → { response: string }
// ─────────────────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const axios   = require("axios");

// ─────────────────────────────────────────────
//  Prompt système — contexte de la plateforme
//  Le LLM connaît SmartMatch et répond en son nom
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es l'assistant virtuel de SmartMatch, une plateforme marocaine de mise en relation entre clients et prestataires de services (plomberie, électricité, informatique, design, jardinage, etc.).

Voici tout ce que tu sais sur SmartMatch :

FONCTIONNEMENT :
- Un client crée un compte, publie une demande (titre, description, budget min/max, localisation, catégorie).
- Un algorithme de matching automatique sélectionne les 5 meilleurs prestataires selon : catégorie (40pts), localisation (20pts), disponibilité (15pts), note (15pts), missions réussies (10pts).
- Les prestataires recommandés reçoivent une notification.
- Le client choisit son prestataire parmi les recommandés.
- Une fois assigné, client et prestataire peuvent échanger via la messagerie interne.
- À la fin, le prestataire marque la mission comme terminée. Le client peut noter et payer.

RÔLES :
- Client : crée des demandes, choisit un prestataire, note, paye.
- Prestataire : complète son profil, reçoit des recommandations, accepte les missions, communique, termine les missions.
- Admin : gère les utilisateurs, valide les litiges, supervise les paiements.

PAIEMENT :
- Le paiement s'effectue après la fin de la mission.
- Méthodes acceptées : espèces (présentiel) ou en ligne selon la catégorie.
- Catégories en ligne : Informatique, Design, Développement web, Rédaction, Marketing, Traduction.
- Un historique de paiement horodaté est conservé en base de données.

INSCRIPTION :
- Gratuite pour clients et prestataires.
- Le prestataire doit compléter son profil : compétences, tarifs, zone géographique, disponibilité, portfolio.

CONTACT :
- Email support : contact@smartmatch.com
- Disponible du lundi au vendredi, 9h–18h (GMT+1).

RÈGLES DE RÉPONSE :
- Réponds toujours en français, de manière claire, concise et professionnelle.
- Ne réponds qu'aux questions liées à SmartMatch ou à ses services.
- Si la question est hors sujet, redirige poliment vers le support.
- N'invente jamais de fonctionnalités inexistantes.
- Maximum 3 phrases par réponse — sois précis, pas verbeux.`;

// ─────────────────────────────────────────────
//  Historique de conversation par session
//  Clé = sessionId (généré côté client), Valeur = tableau de messages
// ─────────────────────────────────────────────
const conversationHistory = new Map();

// Nettoyage automatique des sessions inactives (30 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of conversationHistory.entries()) {
    if (now - session.lastActivity > 30 * 60 * 1000) {
      conversationHistory.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─────────────────────────────────────────────
//  POST /api/chatbot
// ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { message, sessionId } = req.body;

  // Validation
  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Message manquant ou invalide." });
  }

  const apiKey = process.env.GROQ_API_KEY;

  // ── Fallback rule-based si pas de clé API ──────────────
  if (!apiKey) {
    console.warn("⚠️  Aucune clé GROQ_API_KEY trouvée — fallback rule-based actif.");
    return res.json({ response: getFallbackResponse(message.trim()) });
  }

  // ── Gestion de l'historique de conversation ────────────
  const sid = sessionId || "default";
  if (!conversationHistory.has(sid)) {
    conversationHistory.set(sid, { messages: [], lastActivity: Date.now() });
  }
  const session = conversationHistory.get(sid);
  session.lastActivity = Date.now();

  // Ajouter le message utilisateur
  session.messages.push({ role: "user", content: message.trim() });

  // Limiter l'historique à 10 échanges (20 messages) pour économiser les tokens
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }

  try {
    let botResponse;

    // ── Groq (LLaMA 3 — 100% gratuit) ─────────────────
    const result = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model:     "llama-3.1-8b-instant",   // modèle gratuit et rapide
        max_tokens: 300,
        messages:   [
          { role: "system", content: SYSTEM_PROMPT },
          ...session.messages,
        ],
      },
      {
        headers: {
          Authorization:  `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    botResponse = result.data.choices[0].message.content;

    // Ajouter la réponse du bot à l'historique
    session.messages.push({ role: "assistant", content: botResponse });

    return res.json({ response: botResponse });

  } catch (error) {
    console.error("  Erreur LLM :", error.response?.data || error.message);

    // Fallback gracieux si l'API est indisponible
    const fallback = getFallbackResponse(message.trim());
    return res.json({ response: fallback });
  }
});

// ─────────────────────────────────────────────
//  Fallback rule-based (si pas de clé API ou erreur réseau)
//  Conservé comme filet de sécurité
// ─────────────────────────────────────────────
const knowledgeBase = [
  { keywords: ["fonctionne", "marche", "comment", "utiliser", "principe"],
    response:  "Créez un compte, publiez votre demande, notre algorithme vous recommande les meilleurs prestataires. Vous choisissez, échangez via la messagerie, puis notez à la fin." },
  { keywords: ["prix", "tarif", "cout", "combien", "gratuit"],
    response:  "L'inscription est entièrement gratuite. Les tarifs sont fixés par chaque prestataire selon le service demandé." },
  { keywords: ["contact", "joindre", "email", "support"],
    response:  "Écrivez-nous à contact@smartmatch.com — nous répondons du lundi au vendredi, 9h–18h." },
  { keywords: ["prestataire", "inscrire", "rejoindre", "competence"],
    response:  "Créez un compte prestataire, complétez votre profil (compétences, tarifs, zone, disponibilité) et commencez à recevoir des missions." },
  { keywords: ["paiement", "payer", "virement", "transaction"],
    response:  "Le paiement s'effectue après la fin de la mission. Les modalités varient selon la catégorie (en ligne ou en espèces)." },
  { keywords: ["avis", "note", "notation", "evaluer"],
    response:  "Après chaque mission terminée, le client peut noter et commenter le prestataire pour aider les futurs utilisateurs." },
  { keywords: ["bonjour", "salut", "hello", "bonsoir"],
    response:  "Bonjour ! Je suis l'assistant SmartMatch. Comment puis-je vous aider ?" },
];

function getFallbackResponse(message) {
  const normalised = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const entry of knowledgeBase) {
    if (entry.keywords.some(kw => normalised.includes(kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return entry.response;
    }
  }
  return "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ? Ou contactez-nous à contact@smartmatch.com.";
}

module.exports = router;