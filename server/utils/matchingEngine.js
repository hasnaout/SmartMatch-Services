const normaliser = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};


const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.asin(Math.sqrt(a));
};


const coordonneesValides = (coords) =>
  coords &&
  typeof coords.lat === 'number' &&
  typeof coords.lng === 'number' &&
  !isNaN(coords.lat) &&
  !isNaN(coords.lng);


const scorerLocalisation = (prestataire, demande) => {
  const zonePresta  = prestataire.zoneGeographique || {};
  const locClient   = demande.localisation         || {};
  const rayon       = zonePresta.rayon             || 20;


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
