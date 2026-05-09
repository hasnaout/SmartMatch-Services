// ─────────────────────────────────────────
// Algorithme de scoring pour le matching
// Score total sur 100 points
// ─────────────────────────────────────────

const calculerScore = (prestataire, demande) => {
  let score = 0;

  // 1️⃣ Catégorie / Compétences — 40 points
  if (prestataire.categories.includes(demande.categorie)) {
    score += 40;
  }

  // 2️⃣ Localisation — 20 points
  const villePrestataire = prestataire.zoneGeographique?.ville?.toLowerCase();
  const villeClient = demande.localisation?.ville?.toLowerCase();
  if (villePrestataire && villeClient && villePrestataire === villeClient) {
    score += 20;
  } else if (
    prestataire.zoneGeographique?.region?.toLowerCase() ===
    demande.localisation?.region?.toLowerCase()
  ) {
    score += 10; // Même région mais pas même ville
  }

  // 3️⃣ Disponibilité — 15 points
  if (prestataire.disponible) {
    score += 15;
  }

  // 4️⃣ Note moyenne — 15 points
  // note sur 5 → convertir en score sur 15
  if (prestataire.notemoyenne > 0) {
    score += (prestataire.notemoyenne / 5) * 15;
  }

  // 5️⃣ Historique missions réussies — 10 points
  // plafonné à 10 missions
  const missions = Math.min(prestataire.nombreMissionsReussies, 10);
  score += missions; // 1 point par mission réussie

  return Math.round(score);
};

module.exports = { calculerScore };