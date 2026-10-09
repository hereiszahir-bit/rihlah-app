/**
 * Firestore-backed city data layer.
 *
 * Reads from Firestore collection: cityGuides
 * Falls back to unified places data if Firestore is empty or fails.
 * Caches in memory for the session.
 */

import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Fallback — unified places data
import PLACES, { getPlaceById } from './places';

let guidesCache = null;

// --- City Guides (unified) ---

export async function fetchAllCityGuides() {
  if (guidesCache) return guidesCache;

  try {
    const q = query(collection(db, 'cityGuides'), where('status', '==', 'published'));
    const snap = await getDocs(q);

    if (snap.empty) {
      guidesCache = PLACES;
      return guidesCache;
    }

    // Merge Firestore guides with local places data (for bookableExperiences etc.)
    const firestoreGuides = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    const firestoreMap = {};
    firestoreGuides.forEach(g => { firestoreMap[g.id] = g; });

    // Use Firestore data when available, fall back to local places
    guidesCache = PLACES.map(place => {
      const fsGuide = firestoreMap[place.id];
      return fsGuide ? { ...place, ...fsGuide, bookableExperiences: place.bookableExperiences } : place;
    });

    // Add any Firestore-only guides not in local data
    firestoreGuides.forEach(fg => {
      if (!guidesCache.find(g => g.id === fg.id)) {
        guidesCache.push(fg);
      }
    });

    return guidesCache;
  } catch (err) {
    console.warn('Failed to fetch city guides from Firestore, using fallback:', err.message);
    guidesCache = PLACES;
    return guidesCache;
  }
}

export async function fetchCityGuide(cityId) {
  // Try cache first
  if (guidesCache) {
    return guidesCache.find(g => g.id === cityId) || null;
  }

  try {
    const snap = await getDoc(doc(db, 'cityGuides', cityId));
    if (snap.exists() && snap.data().status === 'published') {
      const localPlace = getPlaceById(cityId);
      return { ...(localPlace || {}), ...snap.data(), id: snap.id, bookableExperiences: localPlace?.bookableExperiences || [] };
    }
  } catch (err) {
    console.warn('Failed to fetch city guide, using fallback:', err.message);
  }

  // Fallback to local places data
  return getPlaceById(cityId) || null;
}

// Legacy alias — destinations are now part of places
export async function fetchAllDestinations() {
  const guides = await fetchAllCityGuides();
  return guides;
}

// --- Cache invalidation ---

export function clearCityCache() {
  guidesCache = null;
}
