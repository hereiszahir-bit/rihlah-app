// Curated destinations — the single source of truth for Rihlah's destination scope.
// Every destination the app surfaces comes from this list.

const CURATED_DESTINATIONS = [
  {
    id: 'mecca',
    name: 'Mecca, Saudi Arabia',
    city: 'Mecca',
    country: 'Saudi Arabia',
    featured: true,
    tags: ['pilgrimage', 'spiritual'],
    description: 'The axis of the ummah. Millions circle the Kaaba year-round, and every prayer in the world points here. There is no place like it — and no preparation fully readies you for the first sight of it.',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 1, name: 'Guided Umrah Support Tour', price: 60, duration: '5 hours', rating: 5.0, reviews: 1023, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/mecca-l4561/umrah-support-tour-t20001/' },
      { id: 2, name: 'Historical Mecca Walking Tour', price: 45, duration: '3 hours', rating: 4.9, reviews: 578, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/mecca-l4561/historical-mecca-tour-t20002/' },
      { id: 3, name: 'Jabal al-Nour Hiking Experience', price: 35, duration: '4 hours', rating: 4.8, reviews: 312, category: 'adventure', bookingUrl: 'https://www.getyourguide.com/mecca-l4561/jabal-al-nour-hike-t20003/' },
      { id: 4, name: 'Mecca Museum & Exhibition Tour', price: 25, duration: '2 hours', rating: 4.7, reviews: 189, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/mecca-l4561/mecca-museum-tour-t20040/' },
      { id: 5, name: 'Arafat & Mina Historical Tour', price: 50, duration: '4 hours', rating: 4.8, reviews: 267, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/mecca-l4561/arafat-mina-tour-t20041/' },
    ],
  },
  {
    id: 'medina',
    name: 'Medina, Saudi Arabia',
    city: 'Medina',
    country: 'Saudi Arabia',
    tags: ['pilgrimage', 'spiritual'],
    description: 'The city of the Prophet, peace be upon him. The green dome draws you forward. The rawdah holds you still. Medina is where urgency gives way to peace — and every pilgrim understands why they came.',
    image: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 6, name: 'Masjid al-Nabawi Guided Visit', price: 40, duration: '3 hours', rating: 5.0, reviews: 876, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/medina-l4562/masjid-nabawi-visit-t20004/' },
      { id: 7, name: 'Historical Sites of Medina Tour', price: 55, duration: '4 hours', rating: 4.9, reviews: 445, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/medina-l4562/historical-medina-tour-t20005/' },
      { id: 8, name: 'Date Farm & Local Market Tour', price: 30, duration: '2.5 hours', rating: 4.7, reviews: 234, category: 'food', bookingUrl: 'https://www.getyourguide.com/medina-l4562/date-farm-tour-t20006/' },
      { id: 9, name: 'Quba Mosque & Seven Mosques Walk', price: 35, duration: '3 hours', rating: 4.8, reviews: 312, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/medina-l4562/quba-seven-mosques-t20042/' },
      { id: 10, name: 'Mount Uhud Battlefield Tour', price: 40, duration: '3 hours', rating: 4.9, reviews: 389, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/medina-l4562/mount-uhud-tour-t20043/' },
    ],
  },
  {
    id: 'istanbul',
    name: 'Istanbul, Turkey',
    city: 'Istanbul',
    country: 'Turkey',
    featured: true,
    tags: ['cultural', 'food', 'history'],
    description: 'Where two continents meet and every neighborhood has its own call to prayer. Start at Sultanahmet at dawn, lose yourself in the Grand Bazaar by midday, and find your way back over cay at sunset on the Bosphorus.',
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 11, name: 'Ottoman Mosques Walking Tour', price: 45, duration: '3 hours', rating: 4.9, reviews: 324, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/istanbul-l56/ottoman-mosques-walking-tour-t12345/' },
      { id: 12, name: 'Halal Food Tour', price: 65, duration: '4 hours', rating: 5.0, reviews: 189, category: 'food', bookingUrl: 'https://www.getyourguide.com/istanbul-l56/halal-food-tour-t23456/' },
      { id: 13, name: 'Sisters Turkish Bath', price: 80, duration: '2.5 hours', rating: 4.8, reviews: 267, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/istanbul-l56/turkish-bath-experience-t34567/' },
      { id: 14, name: 'Bosphorus Sunset Cruise', price: 55, duration: '2 hours', rating: 4.9, reviews: 412, category: 'adventure', bookingUrl: 'https://www.getyourguide.com/istanbul-l56/bosphorus-sunset-cruise-t45678/' },
      { id: 15, name: 'Grand Bazaar Shopping Tour', price: 35, duration: '3 hours', rating: 4.7, reviews: 156, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/istanbul-l56/grand-bazaar-shopping-tour-t56789/' },
    ],
  },
  {
    id: 'cairo',
    name: 'Cairo, Egypt',
    city: 'Cairo',
    country: 'Egypt',
    tags: ['cultural', 'history', 'spiritual'],
    description: 'Al-Azhar, the Pyramids, and the Nile — layered like the civilization itself. Centuries of Islamic scholarship live in the streets of Fatimid Cairo. The pyramids are the backdrop; the city is the story.',
    image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 16, name: 'Pyramids & Sphinx Tour', price: 75, duration: '5 hours', rating: 4.9, reviews: 678, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/cairo-l169/pyramids-sphinx-tour-t90123/' },
      { id: 17, name: 'Islamic Cairo Walking Tour', price: 50, duration: '4 hours', rating: 4.8, reviews: 345, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/cairo-l169/islamic-cairo-walking-tour-t01234/' },
      { id: 18, name: 'Nile River Dinner Cruise', price: 85, duration: '3 hours', rating: 4.7, reviews: 456, category: 'food', bookingUrl: 'https://www.getyourguide.com/cairo-l169/nile-dinner-cruise-t12340/' },
      { id: 19, name: 'Al-Azhar Mosque & Khan el-Khalili', price: 40, duration: '3 hours', rating: 4.9, reviews: 289, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/cairo-l169/al-azhar-khan-khalili-t20044/' },
      { id: 20, name: 'Coptic & Islamic Heritage Tour', price: 55, duration: '5 hours', rating: 4.8, reviews: 234, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/cairo-l169/coptic-islamic-heritage-t20045/' },
    ],
  },
  {
    id: 'marrakech',
    name: 'Marrakech, Morocco',
    city: 'Marrakech',
    country: 'Morocco',
    tags: ['cultural', 'food', 'adventure'],
    description: 'Medina shadows, rooftop calls to prayer, and the scent of ras el hanout at dusk. Marrakech doesn\'t ease you in — it pulls you under. The souks, the riads, the Atlas on the horizon. You\'ll leave different.',
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 21, name: 'Medina Walking Tour', price: 40, duration: '3 hours', rating: 4.8, reviews: 512, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/marrakech-l208/medina-walking-tour-t13456/' },
      { id: 22, name: 'Moroccan Cooking Class', price: 55, duration: '4 hours', rating: 4.9, reviews: 278, category: 'food', bookingUrl: 'https://www.getyourguide.com/marrakech-l208/moroccan-cooking-class-t14567/' },
      { id: 23, name: 'Atlas Mountains Day Trip', price: 70, duration: '8 hours', rating: 4.7, reviews: 389, category: 'adventure', bookingUrl: 'https://www.getyourguide.com/marrakech-l208/atlas-mountains-day-trip-t15678/' },
      { id: 24, name: 'Majorelle Garden & Yves Saint Laurent Museum', price: 30, duration: '2 hours', rating: 4.6, reviews: 445, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/marrakech-l208/majorelle-garden-t20046/' },
      { id: 25, name: 'Jemaa el-Fnaa Night Food Tour', price: 45, duration: '3 hours', rating: 4.9, reviews: 367, category: 'food', bookingUrl: 'https://www.getyourguide.com/marrakech-l208/jemaa-night-food-t20047/' },
    ],
  },
  {
    id: 'dubai',
    name: 'Dubai, UAE',
    city: 'Dubai',
    country: 'UAE',
    featured: true,
    tags: ['modern', 'food', 'adventure'],
    description: 'Halal everything, everywhere. Dubai is the layover that became the destination — desert dunes at golden hour, the creek at dawn, and a skyline that keeps rewriting itself. Effortless for Muslim travelers.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 26, name: 'Desert Safari', price: 90, duration: '6 hours', rating: 4.9, reviews: 892, category: 'adventure', bookingUrl: 'https://www.getyourguide.com/dubai-l173/desert-safari-t67890/' },
      { id: 27, name: 'Burj Khalifa Tour', price: 120, duration: '2 hours', rating: 4.8, reviews: 1245, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/dubai-l173/burj-khalifa-tour-t78901/' },
      { id: 28, name: 'Gold Souk Visit', price: 40, duration: '2 hours', rating: 4.6, reviews: 234, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/dubai-l173/gold-souk-visit-t89012/' },
      { id: 29, name: 'Old Dubai & Creek Abra Tour', price: 35, duration: '3 hours', rating: 4.8, reviews: 356, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/dubai-l173/old-dubai-creek-t20048/' },
      { id: 30, name: 'Halal Brunch Cruise', price: 75, duration: '2.5 hours', rating: 4.7, reviews: 198, category: 'food', bookingUrl: 'https://www.getyourguide.com/dubai-l173/halal-brunch-cruise-t20049/' },
    ],
  },
  {
    id: 'kuala-lumpur',
    name: 'Kuala Lumpur, Malaysia',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    tags: ['food', 'cultural', 'modern'],
    description: 'Southeast Asia\'s halal capital. The Petronas Towers frame a city where the adhan echoes between street food stalls and Islamic art galleries. KL feeds you first and asks questions later.',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 31, name: 'Islamic Arts Museum Tour', price: 30, duration: '2 hours', rating: 4.8, reviews: 198, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/islamic-arts-museum-t16789/' },
      { id: 32, name: 'Halal Street Food Tour', price: 50, duration: '3.5 hours', rating: 4.9, reviews: 345, category: 'food', bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/halal-street-food-tour-t17890/' },
      { id: 33, name: 'Batu Caves & Cultural Tour', price: 45, duration: '4 hours', rating: 4.7, reviews: 267, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/batu-caves-tour-t18901/' },
      { id: 34, name: 'Petronas Towers & KLCC Tour', price: 55, duration: '2.5 hours', rating: 4.8, reviews: 456, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/petronas-towers-t20050/' },
      { id: 35, name: 'Kampung Baru Heritage Walk', price: 25, duration: '2 hours', rating: 4.9, reviews: 178, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/kampung-baru-walk-t20051/' },
    ],
  },
  {
    id: 'sarajevo',
    name: 'Sarajevo, Bosnia',
    city: 'Sarajevo',
    country: 'Bosnia',
    tags: ['history', 'cultural', 'spiritual'],
    description: 'The Jerusalem of Europe. Ottoman bridges, bullet-scarred walls, and a resilience that hums in every cobblestone. The ummah feels Sarajevo differently — because Sarajevo remembers what was lost and what survived.',
    image: 'https://images.unsplash.com/photo-1590074072786-a66914d668f1?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 36, name: 'Old Town & Ottoman Heritage Walk', price: 35, duration: '3 hours', rating: 4.9, reviews: 278, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/ottoman-heritage-walk-t20010/' },
      { id: 37, name: 'Bosnian War & Tunnel Tour', price: 45, duration: '4 hours', rating: 4.8, reviews: 423, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/war-tunnel-tour-t20011/' },
      { id: 38, name: 'Traditional Bosnian Food Tour', price: 40, duration: '3.5 hours', rating: 4.9, reviews: 198, category: 'food', bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/bosnian-food-tour-t20012/' },
      { id: 39, name: 'Mostar & Kravice Waterfalls Day Trip', price: 65, duration: '10 hours', rating: 4.9, reviews: 567, category: 'adventure', bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/mostar-kravice-t20052/' },
      { id: 40, name: 'Gazi Husrev-beg Mosque & Bazaar', price: 20, duration: '2 hours', rating: 4.8, reviews: 234, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/gazi-husrev-beg-t20053/' },
    ],
  },
  {
    id: 'fez',
    name: 'Fez, Morocco',
    city: 'Fez',
    country: 'Morocco',
    tags: ['spiritual', 'cultural', 'food'],
    description: 'Home of the world\'s oldest university. The medina swallows you whole — nine thousand alleyways, tanneries stained in saffron, and the Qarawiyyin standing quiet at the center of it all. Fez is Islam\'s intellectual inheritance, still breathing.',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 41, name: 'Fez Medina Guided Walking Tour', price: 30, duration: '4 hours', rating: 4.9, reviews: 567, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/fez-l571/medina-walking-tour-t20016/' },
      { id: 42, name: 'Traditional Tanneries Visit', price: 20, duration: '1.5 hours', rating: 4.7, reviews: 345, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/fez-l571/tanneries-visit-t20017/' },
      { id: 43, name: 'Moroccan Ceramic Workshop', price: 45, duration: '3 hours', rating: 4.8, reviews: 178, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/fez-l571/ceramic-workshop-t20018/' },
      { id: 44, name: 'Qarawiyyin Mosque & University Tour', price: 35, duration: '2 hours', rating: 4.9, reviews: 289, category: 'spiritual', bookingUrl: 'https://www.getyourguide.com/fez-l571/qarawiyyin-tour-t20054/' },
      { id: 45, name: 'Fez Rooftop Food Tasting', price: 40, duration: '2.5 hours', rating: 4.8, reviews: 198, category: 'food', bookingUrl: 'https://www.getyourguide.com/fez-l571/rooftop-food-tasting-t20055/' },
    ],
  },
  {
    id: 'doha',
    name: 'Doha, Qatar',
    city: 'Doha',
    country: 'Qatar',
    tags: ['modern', 'cultural', 'adventure'],
    description: 'Built on ambition and anchored by the Museum of Islamic Art. Doha is where the Gulf\'s future takes shape — World Cup legacy stadiums, the corniche at sunset, and a desert that starts where the skyline ends.',
    image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
    experiences: [
      { id: 46, name: 'Museum of Islamic Art Tour', price: 25, duration: '2 hours', rating: 4.9, reviews: 456, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/doha-l1234/islamic-art-museum-t20019/' },
      { id: 47, name: 'Souq Waqif & Katara Tour', price: 40, duration: '3 hours', rating: 4.8, reviews: 312, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/doha-l1234/souq-waqif-katara-t20020/' },
      { id: 48, name: 'Desert Safari & Inland Sea', price: 95, duration: '6 hours', rating: 4.9, reviews: 589, category: 'adventure', bookingUrl: 'https://www.getyourguide.com/doha-l1234/desert-safari-inland-sea-t20021/' },
      { id: 49, name: 'Lusail City & Stadium Tour', price: 35, duration: '2.5 hours', rating: 4.7, reviews: 178, category: 'cultural', bookingUrl: 'https://www.getyourguide.com/doha-l1234/lusail-stadium-t20056/' },
      { id: 50, name: 'Pearl-Qatar Island Walk & Dining', price: 30, duration: '2 hours', rating: 4.6, reviews: 234, category: 'food', bookingUrl: 'https://www.getyourguide.com/doha-l1234/pearl-qatar-walk-t20057/' },
    ],
  },
];

// Helper: get destination by ID
export const getDestinationById = (id) =>
  CURATED_DESTINATIONS.find(d => d.id === id);

// Helper: get destination by name (matches "Istanbul, Turkey" or just "Istanbul")
export const getDestinationByName = (name) => {
  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const nameNorm = normalize(name);
  const cityNorm = normalize(name.split(',')[0]);

  return CURATED_DESTINATIONS.find(d => {
    const dNameNorm = normalize(d.name);
    const dCityNorm = normalize(d.city);
    return dNameNorm === nameNorm || dCityNorm === cityNorm || dCityNorm === nameNorm;
  });
};

// Helper: get experiences for a destination name
export const getExperiencesForDestination = (destinationName) => {
  const dest = getDestinationByName(destinationName);
  return dest?.experiences || [];
};

// Helper: all destination names (for matching user trips against curated list)
export const CURATED_DESTINATION_NAMES = CURATED_DESTINATIONS.map(d => d.name);

// Helper: image lookup by city name
export const getDestinationImage = (name) => {
  const dest = getDestinationByName(name);
  return dest?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
};

export default CURATED_DESTINATIONS;
