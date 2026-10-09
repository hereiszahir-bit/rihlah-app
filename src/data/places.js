// Unified places data — single source of truth for all destinations in Rihlah.
// Each place may have: editorial guide content, bookable experiences, or both.
// CityGuide.js renders everything from this one model.

import CURATED_DESTINATIONS from './destinations';
import CITY_GUIDES from './cityGuides';

// Merge destinations (bookable experiences) and city guides (editorial) into one model.
// A place always has: id, city, country, image.
// It may have: guide content (neighborhoods, dining, etc.) and/or bookable experiences.
const PLACES = (() => {
  const guidesMap = {};
  CITY_GUIDES.forEach(g => { guidesMap[g.id] = g; });

  const destsMap = {};
  CURATED_DESTINATIONS.forEach(d => { destsMap[d.id] = d; });

  // Start with all guides (they have the deepest content)
  const merged = {};

  CITY_GUIDES.forEach(g => {
    const dest = destsMap[g.id];
    merged[g.id] = {
      ...g,
      // Add destination-level metadata if available
      featured: dest?.featured || false,
      tags: dest?.tags || [],
      description: dest?.description || g.tagline || '',
      image: dest?.image || g.heroImage,
      // Rename GYG experiences to avoid collision with editorial experiences
      bookableExperiences: dest?.experiences || [],
      hasGuide: true,
    };
  });

  // Add destinations that don't have guides yet (Mecca, Medina)
  CURATED_DESTINATIONS.forEach(d => {
    if (!merged[d.id]) {
      merged[d.id] = {
        id: d.id,
        city: d.city,
        country: d.country,
        heroImage: d.image,
        image: d.image,
        tagline: d.description,
        intro: d.description,
        featured: d.featured || false,
        tags: d.tags || [],
        description: d.description,
        prayerNote: '',
        neighborhoods: [],
        dining: [],
        mosques: [],
        coffee: [],
        experiences: [],
        insiderTips: [],
        bookableExperiences: d.experiences || [],
        hasGuide: false,
      };
    }
  });

  return Object.values(merged);
})();

// --- Lookup helpers ---

export const getPlaceById = (id) => PLACES.find(p => p.id === id);

export const getPlaceByName = (name) => {
  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const nameNorm = normalize(name);
  const cityNorm = normalize(name.split(',')[0]);

  return PLACES.find(p => {
    const pCityNorm = normalize(p.city);
    const pFullNorm = normalize(`${p.city}, ${p.country}`);
    return pFullNorm === nameNorm || pCityNorm === cityNorm || pCityNorm === nameNorm;
  });
};

// Get the city ID from a destination name string (for linking trips to places)
export const getPlaceId = (name) => {
  const place = getPlaceByName(name);
  return place?.id || name?.split(',')[0]?.toLowerCase().replace(/\s+/g, '-') || '';
};

// All places with editorial guides
export const getGuidedPlaces = () => PLACES.filter(p => p.hasGuide);

// All places (guided + bookable-only)
export const getAllPlaces = () => PLACES;

// Featured places (for Discover hero/teasers)
export const getFeaturedPlaces = () => PLACES.filter(p => p.featured);

// Image lookup
export const getPlaceImage = (name) => {
  const place = getPlaceByName(name);
  return place?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
};

// Bookable experiences lookup
export const getBookableExperiences = (name) => {
  const place = getPlaceByName(name);
  return place?.bookableExperiences || [];
};

export default PLACES;
