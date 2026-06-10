// server/chatbot.js
const express = require("express");
const router = express.Router();

// ─────────────────────────────────────────────
//  Base de connaissances : mots-clés → réponses
// ─────────────────────────────────────────────
const knowledgeBase = [
  // ── Fonctionnement général ──────────────────
  {
    keywords: ["fonctionne", "marche", "comment", "utiliser", "démarrer", "principe", "etape"],
    response:
      " Créez un compte, publiez votre demande en précisant vos besoins, recevez des propositions de prestataires et communiquez via la messagerie intégrée pour choisir le bon profil.",
  },
  // ── Tarifs ─────────────────────────────────
  {
    keywords: ["prix", "tarif", "cout", "combien", "abonnement", "forfait", "gratuit", "payer"],
    response:
      "L'inscription est entièrement gratuite. Les tarifs des prestations sont fixés par chaque prestataire et varient selon le service demandé.",
  },
  // ── Contact ────────────────────────────────
  {
    keywords: ["contact", "joindre", "appeler", "email", "mail", "ecrire", "support"],
    response:
      " Écrivez-nous à contact@smartmatch.com — nous répondons généralement sous 48h.",
  },
  // ── Inscription prestataire ────────────────
  {
    keywords: ["prestataire", "inscrire", "inscription", "rejoindre", "activer", "competence", "disponibilite"],
    response:
      " Créez un compte, complétez votre profil (compétences, tarifs, photos, disponibilités) et activez-le pour commencer à recevoir des missions.",
  },
  // ── Publier une demande (client) ───────────
  {
    keywords: ["publier", "creer", "demande", "projet", "budget", "localisation", "poster"],
    response:
      " Connectez-vous, cliquez sur « Créer une demande », décrivez le projet (budget, délai, localisation) et publiez — les prestataires pourront postuler.",
  },
  // ── Choisir un prestataire ─────────────────
  {
    keywords: ["choisir", "comparer", "selectionner", "engager", "devis", "profils"],
    response:
      " Comparez les profils, avis, tarifs et échanges ; demandez un devis ou discutez via la messagerie avant d'engager un prestataire.",
  },
  // ── Messagerie ─────────────────────────────
  {
    keywords: ["messagerie", "message", "chat", "echanger", "communication", "fichier", "interne"],
    response:
      " La messagerie interne vous permet d'échanger en privé avec les prestataires, clarifier vos besoins et partager des fichiers directement sur la plateforme.",
  },
  // ── Paiement ───────────────────────────────
  {
    keywords: ["paiement", "payer", "virement", "carte", "moyen", "transaction", "reglement"],
    response:
      " Les modalités de paiement sont définies par chaque prestataire. La plateforme peut proposer des options sécurisées selon les intégrations disponibles.",
  },
  // ── Avis / notation ────────────────────────
  {
    keywords: ["avis", "note", "notation", "commentaire", "evaluer", "mission", "retour"],
    response:
      " Après une mission, vous pouvez noter et laisser un commentaire sur le profil du prestataire pour aider les futurs clients.",
  },
  // ── Profils vérifiés ───────────────────────
  {
    keywords: ["verifie", "badge", "certifie", "verifier", "confiance", "fiable"],
    response:
      "Certains prestataires peuvent être marqués « vérifié » si leurs informations ont été contrôlées. Vérifiez le badge directement sur leur profil.",
  },
  // ── Documents profil pro ───────────────────
  {
    keywords: ["document", "cv", "portfolio", "reference", "certification", "realisation"],
    response:
      " Pour un profil pro convaincant : ajoutez votre CV/portfolio, références, certifications et exemples de réalisations. Cela augmente vos chances d'être choisi.",
  },
  // ── Litige ─────────────────────────────────
  {
    keywords: ["litige", "probleme", "plainte", "conflit", "desaccord", "preuve", "resolution"],
    response:
      "⚖️ En cas de litige avec un prestataire, contactez le support à contact@smartmatch.com avec les détails et preuves — nous faciliterons la résolution.",
  },
  // ── Suppression de compte ──────────────────
  {
    keywords: ["supprimer", "suppression", "fermer", "cloturer", "compte", "desactiver"],
    response:
      " Vous pouvez supprimer votre compte depuis les paramètres → « Supprimer le compte ». Contactez le support si vous avez besoin d'aide.",
  },
  // ── Sécurité / Confidentialité ─────────────
  {
    keywords: ["securite", "confidentialite", "donnees", "rgpd", "protection", "prive", "securise"],
    response:
      " Votre compte et vos données sont protégés par de bonnes pratiques de sécurité. Consultez notre politique de confidentialité pour plus de détails.",
  },
  // ── API / Intégrations ─────────────────────
  {
    keywords: ["api", "integration", "entreprise", "connecter", "webhook", "developpeur"],
    response:
      " Nous proposons ou prévoyons des intégrations selon le plan produit. Contactez-nous à contact@smartmatch.com pour vos besoins d'entreprise.",
  },
  // ── Horaires ───────────────────────────────
  {
    keywords: ["horaire", "heure", "ouverture", "disponible", "equipe", "semaine"],
    response:
      " Nos équipes sont disponibles du lundi au vendredi de 9h à 18h (GMT+1).",
  },
  // ── Salutations ────────────────────────────
  {
    keywords: ["bonjour", "salut", "hello", "bonsoir", "coucou", "hi"],
    response:
      " Bonjour ! Je suis l'assistant SmartMatch. Posez-moi vos questions ou choisissez une suggestion ci-dessous.",
  },
  // ── Remerciements ──────────────────────────
  {
    keywords: ["merci", "parfait", "super", "genial", "excellent", "nickel", "top"],
    response:
      " Avec plaisir ! N'hésitez pas si vous avez d'autres questions sur SmartMatch.",
  },
];

// ─────────────────────────────────────────────
//  Fonction : détection d'intention par mots-clés
// ─────────────────────────────────────────────
function detectIntent(message) {
  const normalised = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // supprime les accents

  for (const entry of knowledgeBase) {
    const matched = entry.keywords.some((kw) =>
      normalised.includes(
        kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      )
    );
    if (matched) return entry.response;
  }

  // Réponse par défaut
  return " Je ne suis pas sûr de comprendre votre demande. Pouvez-vous reformuler ? Ou choisissez une option ci-dessous pour que je puisse mieux vous aider.";
}

// ─────────────────────────────────────────────
//  POST /api/chatbot
// ─────────────────────────────────────────────
router.post("/", (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Message manquant ou invalide." });
  }

  const response = detectIntent(message.trim());

  // Légère pause simulée (optionnel — peut être supprimée)
  setTimeout(() => {
    res.json({ response });
  }, 300);
});

module.exports = router;