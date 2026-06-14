// ─────────────────────────────────────────────────────────────────
// Algorithme de scoring pour le matching — SmartMatch
// Score total sur 100 points
//
// Critères :
//   1. Catégorie / Compétences   — 40 pts
//   2. Localisation géospatiale  — 20 pts  ← amélioré (Haversine + rayon)
//   3. Disponibilité             — 15 pts
//   4. Note moyenne              — 15 pts
//   5. Missions réussies         — 10 pts
// ─────────────────────────────────────────────────────────────────

// ── Utilitaire : normalisation de chaîne ──────────────────────────
// Supprime les accents, espaces en trop, et met en minuscules.
// Évite les faux négatifs du type "Casablanca " ≠ "casablanca".
const normaliser = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')                    // décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '')     // retire les diacritiques
    .replace(/\s+/g, ' ');              // normalise les espaces multiples
};

// ── Formule de Haversine ──────────────────────────────────────────
// Calcule la distance en km entre deux points GPS (lat/lng en degrés).
// Précision suffisante pour des distances < 500 km.
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // rayon moyen de la Terre en km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.asin(Math.sqrt(a));
};

// ── Vérification des coordonnées GPS ─────────────────────────────
const coordonneesValides = (coords) =>
  coords &&
  typeof coords.lat === 'number' &&
  typeof coords.lng === 'number' &&
  !isNaN(coords.lat) &&
  !isNaN(coords.lng);

// ── Score de localisation (20 points) ────────────────────────────
//
// Stratégie par priorité décroissante :
//
//   A) Géospatiale (si les deux parties ont des coordonnées GPS)
//      • distance ≤ rayon du prestataire        → 20 pts (dans la zone)
//      • distance ≤ rayon × 2                   → 10 pts (zone élargie)
//      • distance > rayon × 2                   →  0 pts (hors zone)
//
//   B) Textuelle normalisée (fallback sans GPS)
//      • même ville (après normalisation)        → 20 pts
//      • même région (après normalisation)       → 10 pts
//      • aucune correspondance                   →  0 pts
//
const scorerLocalisation = (prestataire, demande) => {
  const zonePresta  = prestataire.zoneGeographique || {};
  const locClient   = demande.localisation         || {};
  const rayon       = zonePresta.rayon             || 20; // km, défaut 20

  // ── Stratégie A : géospatiale ──
  const coordsPresta  = zonePresta.coordonnees;
  const coordsClient  = locClient.coordonnees;

  if (coordonneesValides(coordsPresta) && coordonneesValides(coordsClient)) {
    const distance = haversineKm(
      coordsPresta.lat, coordsPresta.lng,
      coordsClient.lat, coordsClient.lng
    );

    if (distance <= rayon)        return { points: 20, methode: 'gps_exact',   distance };
    if (distance <= rayon * 2)    return { points: 10, methode: 'gps_elargi',  distance };
    return                               { points:  0, methode: 'gps_hors_zone', distance };
  }

  // ── Stratégie B : textuelle normalisée (fallback) ──
  const villePresta  = normaliser(zonePresta.ville);
  const villeClient  = normaliser(locClient.ville);
  const regionPresta = normaliser(zonePresta.region);
  const regionClient = normaliser(locClient.region);

  if (villePresta && villeClient && villePresta === villeClient)
    return { points: 20, methode: 'ville_normalisee' };

  if (regionPresta && regionClient && regionPresta === regionClient)
    return { points: 10, methode: 'region_normalisee' };

  return { points: 0, methode: 'aucune_correspondance' };
};

// ── Fonction principale de scoring ───────────────────────────────
const calculerScore = (prestataire, demande) => {
  let score = 0;


  if (prestataire.categories.includes(demande.categorie)) {
    score += 40;
  }


  const { points: pointsLoc } = scorerLocalisation(prestataire, demande);
  score += pointsLoc;


  if (prestataire.disponible) {
    score += 15;
  }


  if (prestataire.notemoyenne > 0) {
    score += (prestataire.notemoyenne / 5) * 15;
  }


  const missions = Math.min(prestataire.nombreMissionsReussies || 0, 10);
  score += missions;

  return Math.round(score);
};

// ── Export du détail pour les logs/debug ─────────────────────────
const calculerScoreDetaille = (prestataire, demande) => {
  const categorie    = prestataire.categories.includes(demande.categorie) ? 40 : 0;
  const localisation = scorerLocalisation(prestataire, demande);
  const dispo        = prestataire.disponible ? 15 : 0;
  const note         = prestataire.notemoyenne > 0
    ? Math.round((prestataire.notemoyenne / 5) * 15)
    : 0;
  const missions     = Math.min(prestataire.nombreMissionsReussies || 0, 10);

  const total = Math.round(categorie + localisation.points + dispo + note + missions);

  return {
    total,
    detail: {
      categorie,
      localisation: { points: localisation.points, methode: localisation.methode, distance: localisation.distance },
      disponibilite: dispo,
      note,
      missions,
    },
  };
};

module.exports = { calculerScore, calculerScoreDetaille, haversineKm, normaliser };