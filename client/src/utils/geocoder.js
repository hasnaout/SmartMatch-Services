const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';


export const geocoderVille = async (ville, region = '') => {
  if (!ville || ville.trim() === '') return null;

  const query = region ? `${ville.trim()}, ${region.trim()}, Maroc` : `${ville.trim()}, Maroc`;

  try {
    const response = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ma`,
      {
        headers: {

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
