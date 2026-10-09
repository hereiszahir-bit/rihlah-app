/**
 * World cities dataset for trip destination search.
 * Covers major global cities — travel-relevant, sorted by region.
 * Each entry: { city, country, id }
 * The id is the canonical key used for matching across the app.
 */

const WORLD_CITIES = [
  // Middle East & North Africa
  { city: 'Mecca', country: 'Saudi Arabia', id: 'mecca' },
  { city: 'Medina', country: 'Saudi Arabia', id: 'medina' },
  { city: 'Riyadh', country: 'Saudi Arabia', id: 'riyadh' },
  { city: 'Jeddah', country: 'Saudi Arabia', id: 'jeddah' },
  { city: 'Dubai', country: 'UAE', id: 'dubai' },
  { city: 'Abu Dhabi', country: 'UAE', id: 'abu-dhabi' },
  { city: 'Doha', country: 'Qatar', id: 'doha' },
  { city: 'Muscat', country: 'Oman', id: 'muscat' },
  { city: 'Kuwait City', country: 'Kuwait', id: 'kuwait-city' },
  { city: 'Manama', country: 'Bahrain', id: 'manama' },
  { city: 'Amman', country: 'Jordan', id: 'amman' },
  { city: 'Beirut', country: 'Lebanon', id: 'beirut' },
  { city: 'Jerusalem', country: 'Palestine', id: 'jerusalem' },
  { city: 'Ramallah', country: 'Palestine', id: 'ramallah' },
  { city: 'Baghdad', country: 'Iraq', id: 'baghdad' },
  { city: 'Erbil', country: 'Iraq', id: 'erbil' },
  { city: 'Tehran', country: 'Iran', id: 'tehran' },
  { city: 'Isfahan', country: 'Iran', id: 'isfahan' },
  { city: 'Shiraz', country: 'Iran', id: 'shiraz' },
  { city: 'Cairo', country: 'Egypt', id: 'cairo' },
  { city: 'Alexandria', country: 'Egypt', id: 'alexandria' },
  { city: 'Luxor', country: 'Egypt', id: 'luxor' },
  { city: 'Casablanca', country: 'Morocco', id: 'casablanca' },
  { city: 'Marrakech', country: 'Morocco', id: 'marrakech' },
  { city: 'Fez', country: 'Morocco', id: 'fez' },
  { city: 'Tangier', country: 'Morocco', id: 'tangier' },
  { city: 'Chefchaouen', country: 'Morocco', id: 'chefchaouen' },
  { city: 'Tunis', country: 'Tunisia', id: 'tunis' },
  { city: 'Algiers', country: 'Algeria', id: 'algiers' },
  { city: 'Tripoli', country: 'Libya', id: 'tripoli' },

  // Turkey
  { city: 'Istanbul', country: 'Turkey', id: 'istanbul' },
  { city: 'Ankara', country: 'Turkey', id: 'ankara' },
  { city: 'Antalya', country: 'Turkey', id: 'antalya' },
  { city: 'Cappadocia', country: 'Turkey', id: 'cappadocia' },
  { city: 'Izmir', country: 'Turkey', id: 'izmir' },
  { city: 'Bursa', country: 'Turkey', id: 'bursa' },
  { city: 'Konya', country: 'Turkey', id: 'konya' },
  { city: 'Trabzon', country: 'Turkey', id: 'trabzon' },
  { city: 'Bodrum', country: 'Turkey', id: 'bodrum' },

  // South & Southeast Asia
  { city: 'Kuala Lumpur', country: 'Malaysia', id: 'kuala-lumpur' },
  { city: 'Penang', country: 'Malaysia', id: 'penang' },
  { city: 'Langkawi', country: 'Malaysia', id: 'langkawi' },
  { city: 'Jakarta', country: 'Indonesia', id: 'jakarta' },
  { city: 'Bali', country: 'Indonesia', id: 'bali' },
  { city: 'Yogyakarta', country: 'Indonesia', id: 'yogyakarta' },
  { city: 'Bandung', country: 'Indonesia', id: 'bandung' },
  { city: 'Singapore', country: 'Singapore', id: 'singapore' },
  { city: 'Bangkok', country: 'Thailand', id: 'bangkok' },
  { city: 'Phuket', country: 'Thailand', id: 'phuket' },
  { city: 'Chiang Mai', country: 'Thailand', id: 'chiang-mai' },
  { city: 'Dhaka', country: 'Bangladesh', id: 'dhaka' },
  { city: "Cox's Bazar", country: 'Bangladesh', id: 'coxs-bazar' },
  { city: 'Lahore', country: 'Pakistan', id: 'lahore' },
  { city: 'Islamabad', country: 'Pakistan', id: 'islamabad' },
  { city: 'Karachi', country: 'Pakistan', id: 'karachi' },
  { city: 'Delhi', country: 'India', id: 'delhi' },
  { city: 'Mumbai', country: 'India', id: 'mumbai' },
  { city: 'Hyderabad', country: 'India', id: 'hyderabad' },
  { city: 'Kolkata', country: 'India', id: 'kolkata' },
  { city: 'Srinagar', country: 'India', id: 'srinagar' },
  { city: 'Lucknow', country: 'India', id: 'lucknow' },
  { city: 'Colombo', country: 'Sri Lanka', id: 'colombo' },
  { city: 'Male', country: 'Maldives', id: 'male' },
  { city: 'Hanoi', country: 'Vietnam', id: 'hanoi' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', id: 'ho-chi-minh-city' },
  { city: 'Manila', country: 'Philippines', id: 'manila' },
  { city: 'Phnom Penh', country: 'Cambodia', id: 'phnom-penh' },

  // Central Asia
  { city: 'Tashkent', country: 'Uzbekistan', id: 'tashkent' },
  { city: 'Samarkand', country: 'Uzbekistan', id: 'samarkand' },
  { city: 'Bukhara', country: 'Uzbekistan', id: 'bukhara' },
  { city: 'Almaty', country: 'Kazakhstan', id: 'almaty' },
  { city: 'Astana', country: 'Kazakhstan', id: 'astana' },
  { city: 'Bishkek', country: 'Kyrgyzstan', id: 'bishkek' },
  { city: 'Dushanbe', country: 'Tajikistan', id: 'dushanbe' },
  { city: 'Baku', country: 'Azerbaijan', id: 'baku' },
  { city: 'Tbilisi', country: 'Georgia', id: 'tbilisi' },

  // East Asia
  { city: 'Tokyo', country: 'Japan', id: 'tokyo' },
  { city: 'Osaka', country: 'Japan', id: 'osaka' },
  { city: 'Kyoto', country: 'Japan', id: 'kyoto' },
  { city: 'Seoul', country: 'South Korea', id: 'seoul' },
  { city: 'Beijing', country: 'China', id: 'beijing' },
  { city: 'Shanghai', country: 'China', id: 'shanghai' },
  { city: 'Hong Kong', country: 'China', id: 'hong-kong' },
  { city: 'Taipei', country: 'Taiwan', id: 'taipei' },

  // Europe
  { city: 'London', country: 'United Kingdom', id: 'london' },
  { city: 'Manchester', country: 'United Kingdom', id: 'manchester' },
  { city: 'Birmingham', country: 'United Kingdom', id: 'birmingham' },
  { city: 'Edinburgh', country: 'United Kingdom', id: 'edinburgh' },
  { city: 'Paris', country: 'France', id: 'paris' },
  { city: 'Lyon', country: 'France', id: 'lyon' },
  { city: 'Marseille', country: 'France', id: 'marseille' },
  { city: 'Barcelona', country: 'Spain', id: 'barcelona' },
  { city: 'Madrid', country: 'Spain', id: 'madrid' },
  { city: 'Granada', country: 'Spain', id: 'granada' },
  { city: 'Cordoba', country: 'Spain', id: 'cordoba' },
  { city: 'Seville', country: 'Spain', id: 'seville' },
  { city: 'Rome', country: 'Italy', id: 'rome' },
  { city: 'Milan', country: 'Italy', id: 'milan' },
  { city: 'Venice', country: 'Italy', id: 'venice' },
  { city: 'Florence', country: 'Italy', id: 'florence' },
  { city: 'Berlin', country: 'Germany', id: 'berlin' },
  { city: 'Munich', country: 'Germany', id: 'munich' },
  { city: 'Frankfurt', country: 'Germany', id: 'frankfurt' },
  { city: 'Amsterdam', country: 'Netherlands', id: 'amsterdam' },
  { city: 'Brussels', country: 'Belgium', id: 'brussels' },
  { city: 'Vienna', country: 'Austria', id: 'vienna' },
  { city: 'Zurich', country: 'Switzerland', id: 'zurich' },
  { city: 'Geneva', country: 'Switzerland', id: 'geneva' },
  { city: 'Prague', country: 'Czech Republic', id: 'prague' },
  { city: 'Budapest', country: 'Hungary', id: 'budapest' },
  { city: 'Warsaw', country: 'Poland', id: 'warsaw' },
  { city: 'Krakow', country: 'Poland', id: 'krakow' },
  { city: 'Athens', country: 'Greece', id: 'athens' },
  { city: 'Lisbon', country: 'Portugal', id: 'lisbon' },
  { city: 'Porto', country: 'Portugal', id: 'porto' },
  { city: 'Dublin', country: 'Ireland', id: 'dublin' },
  { city: 'Copenhagen', country: 'Denmark', id: 'copenhagen' },
  { city: 'Stockholm', country: 'Sweden', id: 'stockholm' },
  { city: 'Oslo', country: 'Norway', id: 'oslo' },
  { city: 'Helsinki', country: 'Finland', id: 'helsinki' },
  { city: 'Reykjavik', country: 'Iceland', id: 'reykjavik' },
  { city: 'Moscow', country: 'Russia', id: 'moscow' },
  { city: 'St. Petersburg', country: 'Russia', id: 'st-petersburg' },

  // Balkans
  { city: 'Sarajevo', country: 'Bosnia', id: 'sarajevo' },
  { city: 'Mostar', country: 'Bosnia', id: 'mostar' },
  { city: 'Tirana', country: 'Albania', id: 'tirana' },
  { city: 'Pristina', country: 'Kosovo', id: 'pristina' },
  { city: 'Skopje', country: 'North Macedonia', id: 'skopje' },
  { city: 'Belgrade', country: 'Serbia', id: 'belgrade' },
  { city: 'Zagreb', country: 'Croatia', id: 'zagreb' },
  { city: 'Dubrovnik', country: 'Croatia', id: 'dubrovnik' },
  { city: 'Sofia', country: 'Bulgaria', id: 'sofia' },
  { city: 'Bucharest', country: 'Romania', id: 'bucharest' },

  // Sub-Saharan Africa
  { city: 'Lagos', country: 'Nigeria', id: 'lagos' },
  { city: 'Abuja', country: 'Nigeria', id: 'abuja' },
  { city: 'Accra', country: 'Ghana', id: 'accra' },
  { city: 'Dakar', country: 'Senegal', id: 'dakar' },
  { city: 'Nairobi', country: 'Kenya', id: 'nairobi' },
  { city: 'Mombasa', country: 'Kenya', id: 'mombasa' },
  { city: 'Dar es Salaam', country: 'Tanzania', id: 'dar-es-salaam' },
  { city: 'Zanzibar', country: 'Tanzania', id: 'zanzibar' },
  { city: 'Cape Town', country: 'South Africa', id: 'cape-town' },
  { city: 'Johannesburg', country: 'South Africa', id: 'johannesburg' },
  { city: 'Addis Ababa', country: 'Ethiopia', id: 'addis-ababa' },
  { city: 'Kigali', country: 'Rwanda', id: 'kigali' },
  { city: 'Kampala', country: 'Uganda', id: 'kampala' },
  { city: 'Mogadishu', country: 'Somalia', id: 'mogadishu' },
  { city: 'Khartoum', country: 'Sudan', id: 'khartoum' },
  { city: 'Nouakchott', country: 'Mauritania', id: 'nouakchott' },
  { city: 'Bamako', country: 'Mali', id: 'bamako' },
  { city: 'Marrakech', country: 'Morocco', id: 'marrakech' },

  // North America
  { city: 'New York', country: 'United States', id: 'new-york' },
  { city: 'Los Angeles', country: 'United States', id: 'los-angeles' },
  { city: 'Chicago', country: 'United States', id: 'chicago' },
  { city: 'Houston', country: 'United States', id: 'houston' },
  { city: 'Miami', country: 'United States', id: 'miami' },
  { city: 'San Francisco', country: 'United States', id: 'san-francisco' },
  { city: 'Washington DC', country: 'United States', id: 'washington-dc' },
  { city: 'Seattle', country: 'United States', id: 'seattle' },
  { city: 'Atlanta', country: 'United States', id: 'atlanta' },
  { city: 'Dallas', country: 'United States', id: 'dallas' },
  { city: 'Boston', country: 'United States', id: 'boston' },
  { city: 'Denver', country: 'United States', id: 'denver' },
  { city: 'Nashville', country: 'United States', id: 'nashville' },
  { city: 'Toronto', country: 'Canada', id: 'toronto' },
  { city: 'Montreal', country: 'Canada', id: 'montreal' },
  { city: 'Vancouver', country: 'Canada', id: 'vancouver' },
  { city: 'Ottawa', country: 'Canada', id: 'ottawa' },

  // Latin America & Caribbean
  { city: 'Mexico City', country: 'Mexico', id: 'mexico-city' },
  { city: 'Cancun', country: 'Mexico', id: 'cancun' },
  { city: 'Guadalajara', country: 'Mexico', id: 'guadalajara' },
  { city: 'Oaxaca', country: 'Mexico', id: 'oaxaca' },
  { city: 'Bogota', country: 'Colombia', id: 'bogota' },
  { city: 'Medellin', country: 'Colombia', id: 'medellin' },
  { city: 'Cartagena', country: 'Colombia', id: 'cartagena' },
  { city: 'Lima', country: 'Peru', id: 'lima' },
  { city: 'Cusco', country: 'Peru', id: 'cusco' },
  { city: 'Buenos Aires', country: 'Argentina', id: 'buenos-aires' },
  { city: 'Santiago', country: 'Chile', id: 'santiago' },
  { city: 'Sao Paulo', country: 'Brazil', id: 'sao-paulo' },
  { city: 'Rio de Janeiro', country: 'Brazil', id: 'rio-de-janeiro' },
  { city: 'Havana', country: 'Cuba', id: 'havana' },
  { city: 'San Juan', country: 'Puerto Rico', id: 'san-juan' },
  { city: 'Panama City', country: 'Panama', id: 'panama-city' },

  // Oceania
  { city: 'Sydney', country: 'Australia', id: 'sydney' },
  { city: 'Melbourne', country: 'Australia', id: 'melbourne' },
  { city: 'Auckland', country: 'New Zealand', id: 'auckland' },
  { city: 'Queenstown', country: 'New Zealand', id: 'queenstown' },
  { city: 'Fiji', country: 'Fiji', id: 'fiji' },
];

// Deduplicate by id (Marrakech appears twice above)
const seen = new Set();
const CITIES = WORLD_CITIES.filter(c => {
  if (seen.has(c.id)) return false;
  seen.add(c.id);
  return true;
});

export default CITIES;

// Search helper — returns top matches, curated destinations first
export const searchCities = (query, curatedIds = []) => {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  const matches = CITIES.filter(c =>
    c.city.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q)
  );
  // Sort: curated first, then alphabetical
  return matches.sort((a, b) => {
    const aIsCurated = curatedIds.includes(a.id);
    const bIsCurated = curatedIds.includes(b.id);
    if (aIsCurated && !bIsCurated) return -1;
    if (!aIsCurated && bIsCurated) return 1;
    return a.city.localeCompare(b.city);
  });
};
