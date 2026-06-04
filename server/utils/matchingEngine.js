// ─────────────────────────────────────────
// Algorithme de scoring SmartMatch
// Score total sur 100 points
//
// Critères et pondération :
//   Catégorie    : 40 pts  (critère éliminatoire)
//   Localisation : 20 pts  (ville=20, région=10)
//   Budget       : 15 pts  (compatibilité fourchettes)
//   Note moyenne : 15 pts  (réputation)
//   Expérience   : 10 pts  (missions réussies + années)
// ─────────────────────────────────────────

const calculerScore = (prestataire, demande) => {
  let score = 0;

  // ─────────────────────────────────────────
  // 1️⃣ Catégorie — 40 points (critère principal)
  // CORRECTION 1 : comparaison ObjectId → toString()
  // ─────────────────────────────────────────
  const categorieDemandeId = demande.categorie?.toString();

  const categorieMatch = prestataire.categories?.some(
    cat => cat?.toString() === categorieDemandeId
  );

  if (!categorieMatch) {
    // Critère éliminatoire — inutile de scorer le reste
    return 0;
  }
  score += 40;

  // ─────────────────────────────────────────
  // 2️⃣ Localisation — 20 points max
  // ─────────────────────────────────────────
  const villePrestataire = prestataire.zoneGeographique?.ville?.toLowerCase().trim();
  const villeClient      = demande.localisation?.ville?.toLowerCase().trim();
  const regionPrestataire= prestataire.zoneGeographique?.region?.toLowerCase().trim();
  const regionClient     = demande.localisation?.region?.toLowerCase().trim();

  if (villePrestataire && villeClient && villePrestataire === villeClient) {
    score += 20; // Même ville — score maximum
  } else if (regionPrestataire && regionClient && regionPrestataire === regionClient) {
    score += 10; // Même région — score partiel
  }

  // ─────────────────────────────────────────
  // 3️⃣ Compatibilité budget — 15 points
  // CORRECTION 2 : nouveau critère remplace disponibilité (redondante)
  // ─────────────────────────────────────────
  const tarifMin  = prestataire.tarif?.min || 0;
  const tarifMax  = prestataire.tarif?.max || Infinity;
  const budgetMin = demande.budget?.min    || 0;
  const budgetMax = demande.budget?.max    || Infinity;

  if (budgetMax > 0 && tarifMin > 0) {
    // Chevauchement des fourchettes
    const chevauchement = tarifMin <= budgetMax && tarifMax >= budgetMin;
    if (chevauchement) {
      score += 15;
    } else if (tarifMin <= budgetMax * 1.2) {
      // Légèrement hors budget — score partiel (proche du budget)
      score += 7;
    }
    // Totalement incompatible → 0 points
  } else {
    // Budget non spécifié — attribuer le score par défaut
    score += 10;
  }

  // ─────────────────────────────────────────
  // 4️⃣ Note moyenne — 15 points
  // CORRECTION 3 : noteMoyenne camelCase
  // ─────────────────────────────────────────
  const noteMoyenne = prestataire.noteMoyenne || 0;
  if (noteMoyenne > 0) {
    score += (noteMoyenne / 5) * 15;
  }

  // ─────────────────────────────────────────
  // 5️⃣ Expérience — 10 points
  // Combinaison missions réussies + années d'expérience
  // CORRECTION 4 : intégrer l'expérience en années
  // ─────────────────────────────────────────
  const missions   = Math.min(prestataire.nombreMissionsReussies || 0, 10);
  const experience = Math.min(prestataire.experience             || 0, 10);

  // 7 points pour missions (prouve la pratique réelle)
  // 3 points pour expérience déclarée
  score += (missions / 10) * 7;
  score += (experience / 10) * 3;

  // ─────────────────────────────────────────
  // 6️⃣ Bonus : temps de réponse rapide
  // CORRECTION 5 : valoriser les prestataires réactifs
  // ─────────────────────────────────────────
  const tempsReponse = prestataire.tempsReponseHeure || 24;
  if (tempsReponse <= 2) {
    score += 3;  // Très réactif
  } else if (tempsReponse <= 6) {
    score += 1;  // Réactif
  }

  // Plafonner à 100 et arrondir
  return Math.min(Math.round(score), 100);
};

// ─────────────────────────────────────────
// Helper : expliquer le score (pour le debug et l'UI)
// Retourne le détail des points par critère
// ─────────────────────────────────────────
const expliquerScore = (prestataire, demande) => {
  const detail = {
    categorie:    0,
    localisation: 0,
    budget:       0,
    note:         0,
    experience:   0,
    reactivite:   0,
    total:        0,
  };

  const categorieDemandeId = demande.categorie?.toString();
  const categorieMatch = prestataire.categories?.some(
    cat => cat?.toString() === categorieDemandeId
  );
  if (!categorieMatch) return { ...detail, elimination: 'catégorie incompatible' };
  detail.categorie = 40;

  const villeP = prestataire.zoneGeographique?.ville?.toLowerCase().trim();
  const villeC = demande.localisation?.ville?.toLowerCase().trim();
  const regionP= prestataire.zoneGeographique?.region?.toLowerCase().trim();
  const regionC= demande.localisation?.region?.toLowerCase().trim();

  if (villeP && villeC && villeP === villeC)       detail.localisation = 20;
  else if (regionP && regionC && regionP === regionC) detail.localisation = 10;

  const tarifMin  = prestataire.tarif?.min || 0;
  const tarifMax  = prestataire.tarif?.max || Infinity;
  const budgetMin = demande.budget?.min    || 0;
  const budgetMax = demande.budget?.max    || Infinity;

  if (budgetMax > 0 && tarifMin > 0) {
    if (tarifMin <= budgetMax && tarifMax >= budgetMin) detail.budget = 15;
    else if (tarifMin <= budgetMax * 1.2)               detail.budget = 7;
  } else {
    detail.budget = 10;
  }

  const noteMoyenne = prestataire.noteMoyenne || 0;
  detail.note = Math.round((noteMoyenne / 5) * 15);

  const missions   = Math.min(prestataire.nombreMissionsReussies || 0, 10);
  const experience = Math.min(prestataire.experience             || 0, 10);
  detail.experience = Math.round((missions / 10) * 7 + (experience / 10) * 3);

  const tempsReponse = prestataire.tempsReponseHeure || 24;
  if (tempsReponse <= 2)      detail.reactivite = 3;
  else if (tempsReponse <= 6) detail.reactivite = 1;

  detail.total = Math.min(
    detail.categorie + detail.localisation + detail.budget +
    detail.note + detail.experience + detail.reactivite,
    100
  );

  return detail;
};

module.exports = { calculerScore, expliquerScore };