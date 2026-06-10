// ─────────────────────────────────────────────────────────────────
// geocoder.js — Utilitaire de géocodage OpenStreetMap (Nominatim)
//
// Utilisation :
//   import { geocoderVille } from '../utils/geocoder';
//   const coords = await geocoderVille('Casablanca', 'Grand Casablanca-Settat');
//   // → { lat: 33.5731, lng: -7.5898 } ou null si introuvable
//
// Aucune clé API requise. Limite : 1 requête/seconde (Nominatim ToS).
// Pour la production, envisager un proxy backend ou l'API Google Maps.
// ─────────────────────────────────────────────────────────────────

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Géocode une ville au Maroc via l'API Nominatim.
 * @param {string} ville   - Nom de la ville (ex: "Casablanca")
 * @param {string} region  - Région optionnelle pour affiner (ex: "Grand Casablanca")
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export const geocoderVille = async (ville, region = '') => {
  if (!ville || ville.trim() === '') return null;

  const query = region ? `${ville.trim()}, ${region.trim()}, Maroc` : `${ville.trim()}, Maroc`;

  try {
    const response = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ma`,
      {
        headers: {
          // Nominatim exige un User-Agent identifiable
          'User-Agent': 'SmartMatch-PFE/1.0',
        },
      }
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (!results || results.length === 0) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
  } catch (err) {
    console.warn('[geocoderVille] Échec du géocodage:', err.message);
    return null;
  }
};