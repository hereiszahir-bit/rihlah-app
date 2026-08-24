// Deep city guide data — each city is a full editorial guide
// This is what powers the Discover feed and City Guide screens

const CITY_GUIDES = [
  {
    id: 'mexico-city',
    city: 'Mexico City',
    country: 'Mexico',
    heroImage: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&w=1200&q=80',
    tagline: 'The city that feeds you first and asks questions later.',
    intro: 'Twenty-two million people, a thousand colonias, and more history layered into one valley than most countries hold in total. CDMX rewards the curious and overwhelms the unprepared. Come hungry — for food, for art, for the weight of a place that has been a capital for seven centuries.',
    prayerNote: 'Small but growing Muslim community. Centro Educativo de la Comunidad Musulmana in Anzures (near Polanco) is the main prayer space — commonly called Mezquita de Polanco. Friday jummah is well attended. Halal options are limited — confirm directly with Middle Eastern restaurants before ordering.',
    neighborhoods: [
      {
        name: 'Roma Norte',
        vibe: 'Art deco walkups. Coffee culture. The neighborhood everyone moves to.',
        description: 'Tree-lined streets, independent bookshops, and the best coffee scene in the city. Alvaro Obregon is the main artery. Walk it slowly. The side streets are where the real finds are.',
        image: 'https://images.unsplash.com/photo-1518659526054-190340b32735?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Condesa',
        vibe: 'Parks, runners, brunch.',
        description: 'Parque Mexico and Parque Espana anchor the neighborhood. The architecture is 1920s art deco at its best. More polished than Roma, less edge. Good for a long walk.',
        image: 'https://images.unsplash.com/photo-1613160717888-faa82ccc3048?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Coyoacan',
        vibe: 'Frida. Cobblestones. Churros in the plaza.',
        description: 'A village swallowed by the city but still feels apart. The Frida Kahlo museum is here. So is the Mercado de Coyoacan. Walk the streets around the church and let it slow you down.',
        image: 'https://images.unsplash.com/photo-1574492351621-f0eb0e37c5d7?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Centro Historico',
        vibe: 'The original city. Dense, loud, alive.',
        description: 'The Zocalo, the Templo Mayor, the Palacio de Bellas Artes — all within walking distance. Come early. The light in the morning hits the colonial buildings differently. Madero Street is pedestrian-only and packed.',
        image: 'https://images.unsplash.com/photo-1529690840038-2e0e0e0e0e0e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Polanco',
        vibe: 'Money. Museums. Masaryk.',
        description: 'The luxury district. Museo Soumaya (free) and Museo Jumex are both here. Avenida Presidente Masaryk is Mexico\'s version of Rodeo Drive. Good Middle Eastern restaurants in this area.',
        image: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=800&q=80',
      },
    ],
    dining: [
      { name: 'Al Andalus', type: 'Lebanese-Mexican', area: 'Centro Historico', note: 'The intersection of Arab and Mexican food culture that CDMX does better than anywhere. Ask specifically about halal sourcing — reports suggest chicken may be halal-sourced but not all meats. The shawarma and Lebanese plates are genuinely good.', halal: false },
      { name: 'Adonis', type: 'Lebanese', area: 'Polanco', note: 'Established upscale Lebanese since 1974. Moorish-style decor. The hummus and grilled meats are excellent. No confirmed halal certification — ask the staff directly about meat sourcing.', halal: false },
      { name: 'Contramar', type: 'Seafood', area: 'Roma Norte', note: 'The most famous restaurant in CDMX. The tuna tostada is iconic. Seafood is naturally halal — no pork, no alcohol in the cooking. Book ahead or arrive at open.', halal: false },
      { name: 'Mercado Roma', type: 'Food hall', area: 'Roma Norte', note: 'Gourmet food hall. Multiple stalls. Plenty of seafood and vegetarian options. Good for a group where everyone wants something different.', halal: false },
      { name: 'Taqueria Orinoco', type: 'Tacos', area: 'Roma Norte', note: 'Monterrey-style tacos. Ask for beef or chicken only — no pork. The flour tortillas are made in front of you. One of the best casual meals in the city.', halal: false },
      { name: 'Pujol', type: 'Fine dining', area: 'Polanco', note: 'Enrique Olvera\'s flagship. World\'s 50 Best. The mole madre has been aging for years. Confirm halal options when booking — they accommodate dietary needs.', halal: false },
    ],
    mosques: [
      { name: 'Centro Educativo de la Comunidad Musulmana', area: 'Anzures (near Polanco)', note: 'The main musalla in CDMX, commonly known as Mezquita de Polanco. Located on Calle Euclides 25, Anzures. Friday jummah is well attended. Welcoming community. This is home base for Muslims in the city.' },
    ],
    coffee: [
      { name: 'Almanegra Cafe', area: 'Roma Norte', note: 'The best specialty coffee in CDMX. Mexican single-origin beans roasted in-house. The space is minimal and intentional. Order the filter.' },
      { name: 'Quentin Cafe', area: 'Roma Norte', note: 'Beautiful corner space. Excellent espresso drinks. Good for working. The pastries are French-Mexican and very good.' },
      { name: 'Cafe Avellaneda', area: 'Coyoacan', note: 'Roastery in Coyoacan. Go after the Frida museum. Single-origin Mexican coffees that rival anything in specialty.' },
      { name: 'Buna', area: 'Condesa', note: 'Mexican-sourced beans from Chiapas, Oaxaca, and Veracruz. Espresso-forward — the flat whites and cortados are excellent. Try the Cafechata (cold brew + horchata). Good for a slow morning in the park neighborhood.' },
      { name: 'Chiquitito Cafe', area: 'Condesa', note: 'Tiny, perfect. Possibly the best cortado in the city. Standing room only.' },
    ],
    experiences: [
      { name: 'Museo Nacional de Antropologia', type: 'Museum', note: 'The best museum in the Americas. The Aztec and Maya halls alone justify the trip. Go early, spend 4 hours minimum. You will not regret it.' },
      { name: 'Xochimilco trajineras', type: 'Cultural', note: 'The floating gardens. Hire a boat on a weekday to avoid the party boats. Bring your own food. The canals are ancient — this is what the entire valley looked like before the Spanish.' },
      { name: 'Teotihuacan', type: 'Day trip', note: 'The pyramids. One hour northeast. Climbing the Pyramid of the Sun and Moon is permanently banned since 2024 — do not attempt it (fines up to 20,000 pesos). Walk the Avenue of the Dead, explore the Ciudadela, and take in the scale from ground level. Arrive at opening (8am) before the heat. Bring water.' },
      { name: 'Palacio de Bellas Artes', type: 'Architecture', note: 'Art nouveau exterior, art deco interior. The Diego Rivera murals inside are breathtaking. Free on Sundays. The cultural heart of the country.' },
      { name: 'Lucha Libre at Arena Mexico', type: 'Entertainment', note: 'Friday night. Buy tickets at the door. Sit in the lower sections. The atmosphere is unlike any sporting event you have attended. Pure joy.' },
    ],
    insiderTips: [
      'Mexico City is built on a lakebed. The altitude (2,240m) will hit you the first two days — drink water constantly and go easy on caffeine.',
      'Uber is safer and cheaper than street taxis. Always use Uber or Didi, never hail a cab on the street.',
      'The Metro is fast, cheap, and generally safe during the day. Line 1 connects most tourist areas. Women-only cars are enforced at all hours, every day — look for the pink "Solo Mujeres" signs.',
      'Street tacos are safe. If the stall is busy with locals, the food is turning over fast and fresh. Trust the crowds.',
      'Sunday is the day. Chapultepec park fills up, museums are free, the city comes out. Plan your cultural day for Sunday.',
      'The best views of the city are from the Torre Latinoamericana observation deck. Go at golden hour.',
    ],
  },
  {
    id: 'istanbul',
    city: 'Istanbul',
    country: 'Turkey',
    heroImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Where two continents meet at the call to prayer.',
    intro: 'Start at Sultanahmet at dawn, lose yourself in the Grand Bazaar by midday, and find your way back over cay at sunset on the Bosphorus. Istanbul does not explain itself. It just is.',
    prayerNote: '5 daily prayers. Mosques on every corner. You will never miss salah here.',
    neighborhoods: [
      {
        name: 'Sultanahmet',
        vibe: 'Historic heart. Tourist-heavy but earned.',
        description: 'The Blue Mosque, Hagia Sophia, and Topkapi Palace are all within walking distance. Come early morning before the crowds.',
        image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Kadikoy',
        vibe: 'Asian side. Locals only energy.',
        description: 'Take the ferry across. The food market is one of the best in the city. Less polish, more soul. This is where Istanbullus actually eat.',
        image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Balat',
        vibe: 'Colors, cobblestones, coffee.',
        description: 'The most photogenic neighborhood in the city. Wander without a plan. The Greek Orthodox Patriarchate is here. So is some of the best street art.',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Besiktas',
        vibe: 'University town. Breakfast culture.',
        description: 'Weekend breakfast here is a religion. The fish market is loud and perfect. Walk along the Bosphorus toward Ortakoy for the mosque with the bridge behind it.',
        image: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&w=800&q=80',
      },
    ],
    dining: [
      { name: 'Hafiz Mustafa 1864', type: 'Dessert & Turkish coffee', area: 'Sultanahmet', note: 'The baklava is as good as everyone says. Go for Turkish coffee and kunefe.', halal: true },
      { name: 'Ciya Sofrasi', type: 'Anatolian kitchen', area: 'Kadikoy', note: 'The best meal you will eat in Istanbul. Regional dishes that change daily. Trust the owner.', halal: true },
      { name: 'Karakoy Lokantasi', type: 'Modern Turkish', area: 'Karakoy', note: 'Elevated Turkish food in a beautiful space. Lunch is better than dinner. The manti is exceptional.', halal: true },
      { name: 'Tarihi Karakoy Balik Lokantasi', type: 'Seafood', area: 'Karakoy', note: 'Fresh fish from the Bosphorus. No menu — they tell you what is good today. Trust them.', halal: true },
      { name: 'Sehzade Cag Kebap', type: 'Kebab', area: 'Fatih', note: 'Cag kebab from Erzurum. One of the best kebabs in the city. Simple, honest, perfect.', halal: true },
    ],
    mosques: [
      { name: 'Sultan Ahmed Mosque (Blue Mosque)', area: 'Sultanahmet', note: 'Pray inside if you can time it. The interior is overwhelming. Go at Fajr for near-empty peace.' },
      { name: 'Suleymaniye Mosque', area: 'Fatih', note: 'Sinan\'s masterpiece. The courtyard at sunset is one of the most beautiful places in the world. The cay garden behind it overlooks the Golden Horn.' },
      { name: 'Ortakoy Mosque', area: 'Besiktas', note: 'Small, baroque, right on the Bosphorus. The bridge towers behind it. Photograph it at dusk.' },
      { name: 'Eyup Sultan Mosque', area: 'Eyup', note: 'The most spiritually significant mosque in Istanbul after Sultanahmet. Take the cable car up to Pierre Loti for the view.' },
    ],
    coffee: [
      { name: 'Kronotrop', area: 'Galata', note: 'Istanbul\'s best specialty coffee. The Cihangir location has a view.' },
      { name: 'Petra Roasting Co.', area: 'Karakoy', note: 'Third wave, excellent pour-over. Small space, big coffee.' },
      { name: 'Mandabatmaz', area: 'Beyoglu', note: 'Turkish coffee only. No filter, no pour-over. Just perfect Turkish coffee in a closet-sized shop.' },
    ],
    experiences: [
      { name: 'Bosphorus ferry at sunset', type: 'Must-do', note: 'Take the public ferry from Eminonu to Anadolu Kavagi. Bring cay from the deck vendor. The whole city unfolds on both sides.' },
      { name: 'Grand Bazaar', type: 'Shopping', note: '4,000 shops. Go with a plan or you will spend 4 hours. The leather and ceramic sections are worth your time.' },
      { name: 'Hamam at Kilic Ali Pasa', type: 'Wellness', note: 'Sinan-designed hamam, impeccably restored. Book in advance. Gender-separated sessions.' },
      { name: 'Princes Islands ferry', type: 'Day trip', note: 'No cars. Electric vehicles and bicycles (horse carriages were banned in 2020). Take the ferry from Kadikoy. Buyukada is the most popular. Heybeliada is quieter.' },
    ],
    insiderTips: [
      'The Istanbul Kart (transit card) works on ferries too. Load it and use ferries as transport — they are faster and more beautiful than taxis.',
      'Avoid restaurants on Istiklal Street. Walk one block in either direction for better food at half the price.',
      'The Asian side is where Istanbullus live. If you only stay on the European side, you saw half a city.',
      'Simit (sesame bread ring) from a street cart with cay is the best breakfast in the city. It costs less than a dollar.',
    ],
  },
  {
    id: 'marrakech',
    city: 'Marrakech',
    country: 'Morocco',
    heroImage: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1200&q=80',
    tagline: 'The medina swallows you whole.',
    intro: 'Ras el hanout at dusk, rooftop calls to prayer, and shadows in the souks that shift with the sun. Marrakech does not ease you in. It pulls you under. You will leave different.',
    prayerNote: 'Morocco follows the Maliki school. The adhan is distinctive and beautiful. Mosques are closed to non-Muslims nationwide (the only exception is Hassan II Mosque in Casablanca). The Ben Youssef Madrasa — a historic theological college, not a mosque — is open to all visitors as a heritage site.',
    neighborhoods: [
      { name: 'Medina', vibe: 'The old city. Get lost on purpose.', description: 'Nine thousand alleyways. No GPS will save you. Ask for directions and enjoy the journey. The riads are hidden behind unmarked doors.', image: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=800&q=80' },
      { name: 'Gueliz', vibe: 'New town. French colonial.', description: 'Wider streets, galleries, French-Moroccan fusion restaurants. This is where the art scene lives.', image: 'https://images.unsplash.com/photo-1560095633-6858ab1e0a0e?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Nomad', type: 'Modern Moroccan', area: 'Medina', note: 'Rooftop with a view. The lamb tangia is worth the visit alone.', halal: true },
      { name: 'Al Fassia', type: 'Traditional Moroccan', area: 'Gueliz', note: 'Run entirely by women. The best traditional Moroccan food in the city.', halal: true },
      { name: 'Jemaa el-Fnaa food stalls', type: 'Street food', area: 'Medina', note: 'The stalls are tourist-oriented but the food is real. Avoid the aggressive ones pulling you in. Harira and msemen at night are the best bets. Stall popularity shifts — ask your riad host for current recommendations.', halal: true },
    ],
    mosques: [
      { name: 'Koutoubia Mosque', area: 'Medina', note: 'The landmark. You cannot enter but the gardens are peaceful. The minaret is visible from everywhere — use it as your compass.' },
    ],
    coffee: [
      { name: 'Cafe des Epices', area: 'Medina', note: 'Rooftop in the spice square. Mint tea, not coffee. The view is the point.' },
    ],
    experiences: [
      { name: 'Ben Youssef Madrasa', type: 'Cultural', note: 'The most beautiful Islamic architecture in Marrakech. The courtyard tiles will stop you.' },
      { name: 'Atlas Mountains day trip', type: 'Adventure', note: 'Imlil valley, 90 minutes from the medina. A different Morocco. Cool air, Berber villages, silence.' },
    ],
    insiderTips: [
      'Negotiate everything in the souks. Start at 30% of the asking price.',
      'Stay in a riad, not a hotel. The courtyard is the experience.',
      'Friday couscous is tradition. Many restaurants serve a special Friday lunch.',
    ],
  },
  {
    id: 'cairo',
    city: 'Cairo',
    country: 'Egypt',
    heroImage: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
    tagline: 'The mother of the world does not whisper.',
    intro: 'Al-Azhar, the Pyramids, and the Nile — layered like the civilization itself. Centuries of Islamic scholarship live in the streets of Fatimid Cairo. The pyramids are the backdrop. The city is the story.',
    prayerNote: 'Egypt is majority Muslim. The adhan is everywhere. Al-Azhar Mosque, founded 970 CE, is one of the oldest and most influential centers of Islamic learning in the world. You will never lack a place to pray.',
    neighborhoods: [
      { name: 'Islamic Cairo', vibe: 'Fatimid. Medieval. The real thing.', description: 'Al-Muizz Street is the spine — mosques, madrasas, and minarets from the 10th century onward. Walk it in the late afternoon light.', image: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=800&q=80' },
      { name: 'Zamalek', vibe: 'Island living. Embassies. Quiet.', description: 'Gezira Island in the Nile. Tree-lined streets, bookshops, and the Opera House. The calm center of a chaotic city.', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80' },
      { name: 'Giza', vibe: 'The pyramids. Obviously.', description: 'The Great Pyramid is the last ancient wonder standing. Come at opening (8am) or at sunset. The sound and light show is tourist bait — skip it and just sit.', image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Abou Tarek', type: 'Koshari', area: 'Downtown', note: 'The most famous koshari in Cairo. Four floors. One dish. Lentils, rice, pasta, tomato sauce, fried onions. Egypt on a plate.', halal: true },
      { name: 'Zooba', type: 'Modern Egyptian', area: 'Zamalek', note: 'Egyptian street food elevated. The foul and taamiya are perfect. Modern space, ancient flavors.', halal: true },
      { name: 'Andrea', type: 'Grilled meats', area: 'Giza', note: 'Outdoor grilling. The chicken is roasted whole over wood. Families come here on weekends. The setting near the pyramids is surreal.', halal: true },
      { name: 'Naguib Mahfouz Cafe', type: 'Traditional Egyptian', area: 'Khan el-Khalili', note: 'Named for the Nobel laureate. In the heart of the bazaar. Good for lunch and shisha after exploring the market.', halal: true },
    ],
    mosques: [
      { name: 'Al-Azhar Mosque', area: 'Islamic Cairo', note: 'Founded in 970 CE. The oldest university in the world. Pray here and feel the weight of a thousand years of scholarship.' },
      { name: 'Sultan Hassan Mosque', area: 'Citadel area', note: 'Mamluk architecture at its peak. The scale is staggering. The courtyard is one of the most impressive in the Islamic world.' },
      { name: 'Ibn Tulun Mosque', area: 'Islamic Cairo', note: 'The oldest intact mosque in Cairo (879 CE). The spiral minaret is unique. The courtyard is vast and usually empty. Peaceful.' },
      { name: 'Muhammad Ali Mosque', area: 'Citadel', note: 'The alabaster mosque. Ottoman style on the Cairo Citadel. The view of the city from here is the best in Cairo.' },
    ],
    coffee: [
      { name: 'El Fishawi', area: 'Khan el-Khalili', note: 'Open since 1773. Mirrors, mint tea, and shisha. Naguib Mahfouz wrote here. Tourist-heavy but historic.' },
      { name: 'Left Bank', area: 'Zamalek', note: 'Modern cafe on the island. Good espresso, quiet setting. Where young Cairo works and reads.' },
    ],
    experiences: [
      { name: 'Pyramids of Giza at dawn', type: 'Must-do', note: 'Arrive at 8am opening. Walk past the Great Pyramid to the viewpoint beyond the third pyramid. The Sphinx is smaller than you expect. The pyramids are larger.' },
      { name: 'Khan el-Khalili bazaar', type: 'Shopping', note: 'The 14th-century bazaar is overwhelming and magnificent. Brass, spices, perfume, papyrus. Negotiate hard. The deeper alleys have the better craftsmen.' },
      { name: 'Nile felucca at sunset', type: 'Must-do', note: 'Hire a felucca (sailboat) from the Corniche. One hour at sunset. The city glows. Bring your own drinks and snacks.' },
      { name: 'Al-Muizz Street walk', type: 'Cultural', note: 'The mile-long spine of Islamic Cairo. Every building is a mosque, madrasa, or caravanserai. Go with a guide or you will miss the context.' },
    ],
    insiderTips: [
      'Cairo traffic is legendary. Use the Metro for anything more than 2 km. Line 3 connects the airport to downtown.',
      'Egyptian hospitality is intense and genuine. If someone invites you for tea, say yes.',
      'The Egyptian Museum in Tahrir is moving to the Grand Egyptian Museum near the pyramids. Check which is open when you visit.',
      'Koshari is the national dish and it is always halal, always cheap, and always available. Eat it at least once.',
    ],
  },
  {
    id: 'dubai',
    city: 'Dubai',
    country: 'UAE',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Halal everything, everywhere.',
    intro: 'The layover that became the destination. Desert dunes at golden hour, the creek at dawn, and a skyline that keeps rewriting itself. Effortless for Muslim travelers — because everyone here is one.',
    prayerNote: 'Everything is halal by default. Prayer rooms in every mall, hotel, and public space. The adhan plays on public speakers. You are in a Muslim country.',
    neighborhoods: [
      { name: 'Old Dubai (Deira & Bur Dubai)', vibe: 'The real city. Before the towers.', description: 'The Creek divides Deira from Bur Dubai. Take an abra (water taxi) across for 1 dirham. The Gold Souk and Spice Souk are here. This is where Dubai started.', image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80' },
      { name: 'Downtown', vibe: 'The Burj. The Mall. The fountain.', description: 'The Burj Khalifa anchors everything. The Dubai Mall is a city inside a city. The fountain show at night is free and worth seeing once.', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80' },
      { name: 'Jumeirah', vibe: 'Beach. Villas. Quiet wealth.', description: 'The beach road, Jumeirah Mosque (open to non-Muslim visitors), and the Burj Al Arab in the distance. This is residential Dubai at its most comfortable.', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Al Ustad Special Kabab', type: 'Iranian kebab', area: 'Bur Dubai', note: 'Open since 1978. The best kebab in Dubai. No frills, no pretense. Just perfect meat and bread. Cash only.', halal: true },
      { name: 'Ravi Restaurant', type: 'Pakistani', area: 'Satwa', note: 'The most famous cheap meal in Dubai. Butter chicken, naan, and dal for less than $10. Open until 3am. Always packed.', halal: true },
      { name: 'Arabian Tea House', type: 'Emirati', area: 'Al Fahidi', note: 'Traditional Emirati breakfast in a courtyard setting. The regag bread and karak chai are the reasons to come. Beautiful space.', halal: true },
      { name: 'Nusr-Et', type: 'Steakhouse', area: 'Jumeirah Beach', note: 'Salt Bae\'s Dubai outpost (the original is in Istanbul). The theater is the point. Expensive but halal-certified. Good for a splurge.', halal: true },
    ],
    mosques: [
      { name: 'Jumeirah Mosque', area: 'Jumeirah', note: 'The most photographed mosque in Dubai. Open to non-Muslim visitors for guided tours. Beautiful Fatimid architecture.' },
      { name: 'Al Farooq Omar Bin Al Khattab Mosque', area: 'Al Safa', note: 'Modeled on the Blue Mosque in Istanbul. The largest mosque in Dubai. Stunning interior. Less crowded than Jumeirah.' },
    ],
    coffee: [
      { name: '%Arabica', area: 'Dubai Mall', note: 'Hong Kong-founded, Kyoto-famous specialty coffee. The Dubai Mall location has a view of the fountain. Clean, minimal, excellent.' },
      { name: 'Tom & Serg', area: 'Al Quoz', note: 'Industrial warehouse cafe in the arts district. The brunch is enormous. Good coffee, better atmosphere.' },
    ],
    experiences: [
      { name: 'Desert safari at sunset', type: 'Must-do', note: 'Dune bashing, camel ride, BBQ dinner under the stars. Every tourist does it because it is genuinely good. Book a private vehicle if you want calm instead of chaos.' },
      { name: 'Abra ride across the Creek', type: 'Cultural', note: 'One dirham. Two minutes. The most authentic Dubai experience. The Creek is where the city was born.' },
      { name: 'Al Fahidi Historical District', type: 'Cultural', note: 'The oldest neighborhood in Dubai. Wind towers, narrow lanes, art galleries. The opposite of everything you expected. Walk it slowly.' },
    ],
    insiderTips: [
      'The Metro is clean, cheap, and connects most tourist areas. Gold class costs a bit more but is worth it in rush hour.',
      'Friday brunch is a Dubai institution. Hotels do elaborate buffets. Book in advance.',
      'The best views of the Burj Khalifa are from the Dubai Frame, not from the Burj itself.',
      'Careem (not Uber) is the ride-hailing app in Dubai. Uber also works but Careem is the local standard.',
      'Old Dubai is where the character is. If you only see Downtown and Marina, you saw a mall, not a city.',
    ],
  },
  {
    id: 'sarajevo',
    city: 'Sarajevo',
    country: 'Bosnia',
    heroImage: 'https://images.unsplash.com/photo-1590074072786-a66914d668f1?auto=format&fit=crop&w=1200&q=80',
    tagline: 'The Jerusalem of Europe remembers everything.',
    intro: 'Ottoman bridges, bullet-scarred walls, and a resilience that hums in every cobblestone. The ummah feels Sarajevo differently — because Sarajevo remembers what was lost and what survived.',
    prayerNote: 'Bosnia has the largest Muslim population in southeastern Europe — roughly half the country identifies as Muslim. The adhan echoes through the old town. Mosques are everywhere in Bascarsija. Halal food is the default in Bosnian restaurants.',
    neighborhoods: [
      { name: 'Bascarsija', vibe: 'Ottoman old town. The heart.', description: 'The Sebilj fountain, copper workshops, and cevapi shops. This is where Sarajevo began. Walk the Ferhadija pedestrian street from Austrian Sarajevo into Ottoman Sarajevo — you cross centuries in 500 meters.', image: 'https://images.unsplash.com/photo-1590074072786-a66914d668f1?auto=format&fit=crop&w=800&q=80' },
      { name: 'Latin Bridge area', vibe: 'History. Weight. Memory.', description: 'Where World War I started. The bridge is small. The consequences were not. The War Childhood Museum nearby is devastating and essential.', image: 'https://images.unsplash.com/photo-1592425535498-5cc5e2b7e94c?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Zeljo', type: 'Cevapi', area: 'Bascarsija', note: 'The great cevapi debate in Sarajevo is between Zeljo and Petica. Zeljo wins on consistency. The somun bread is perfect. This is the national dish.', halal: true },
      { name: 'Dveri', type: 'Bosnian fine dining', area: 'Old Town', note: 'Traditional Bosnian food done with care. The begova corba (chicken soup) is a must. Beautiful courtyard setting.', halal: true },
      { name: 'Apetit', type: 'Modern Bosnian', area: 'Center', note: 'Elevated local cuisine with a seasonal menu. One of the better contemporary restaurants in Sarajevo. Reserve ahead.', halal: true },
    ],
    mosques: [
      { name: 'Gazi Husrev-beg Mosque', area: 'Bascarsija', note: 'The most important mosque in Bosnia. Built in 1531. The courtyard is peaceful. Friday prayers are crowded and moving.' },
      { name: 'Emperor\'s Mosque', area: 'Center', note: 'The first Ottoman mosque built in Sarajevo after the conquest. Smaller, quieter, historically significant.' },
    ],
    coffee: [
      { name: 'Bosnian coffee in Bascarsija', area: 'Old Town', note: 'Not Turkish coffee — Bosnian coffee. Different preparation, served in a dzezva with sugar cubes and rahat lokum. Sit in any kafana in the old town. The ritual is the point.' },
    ],
    experiences: [
      { name: 'Tunnel of Hope', type: 'Historical', note: 'The tunnel that kept Sarajevo alive during the siege. The museum is small but the story is enormous. Essential for understanding what this city endured.' },
      { name: 'Mostar day trip', type: 'Day trip', note: 'Two hours south. The Stari Most bridge, rebuilt after the war. The diving from the bridge. The Old Town. One of the most beautiful small cities in Europe.' },
      { name: 'Trebevic Mountain', type: 'Nature', note: 'Take the cable car up. The 1984 Olympic bobsled track is here, now covered in graffiti. The view of the city in the valley is stunning.' },
    ],
    insiderTips: [
      'Sarajevo is walkable. You do not need a car. The old town to the cathedral to the brewery is a 20-minute walk that crosses 500 years.',
      'Bosnian coffee is a social ritual. Do not rush it. You will be offered it everywhere. Accept every time.',
      'The war is still visible. Bullet holes in buildings, Sarajevo Roses (mortar impact marks) in the pavement. Do not look away. The city earned the right to remember.',
      'Cevapi for lunch is not optional. It is the law.',
    ],
  },
  {
    id: 'fez',
    city: 'Fez',
    country: 'Morocco',
    heroImage: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Islam\'s intellectual inheritance, still breathing.',
    intro: 'Home of the world\'s oldest university. The medina swallows you whole — nine thousand alleyways, tanneries stained in saffron, and the Qarawiyyin standing quiet at the center of it all.',
    prayerNote: 'Fez is deeply traditional. The Qarawiyyin Mosque (founded 859 CE) is the oldest university in the world. Mosques are on every corner of the medina. Non-Muslims cannot enter most mosques in Morocco.',
    neighborhoods: [
      { name: 'Fes el-Bali', vibe: 'The old medina. The largest car-free zone in the world.', description: 'Nine thousand alleyways. Donkeys carry goods because no vehicle fits. The tanneries, the Qarawiyyin, the madrasas — all here. Get a guide for the first visit. Get lost on the second.', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80' },
      { name: 'Ville Nouvelle', vibe: 'French-built new town.', description: 'Wide boulevards, cafes, and the train station. The contrast with the medina is striking. Good restaurants and a calmer pace.', image: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Cafe Clock', type: 'Fusion', area: 'Medina', note: 'The famous camel burger. Rooftop with a view of the medina. Live Gnawa music some evenings. A meeting point for travelers and locals.', halal: true },
      { name: 'Nur', type: 'Fine Moroccan', area: 'Medina', note: 'A riad restaurant with a tasting menu. The pastilla is extraordinary. Book ahead. One of the best meals in Morocco.', halal: true },
      { name: 'Home dining experiences', type: 'Home cooking', area: 'Medina', note: 'Several families in the Medina host meals in their homes — find them through your riad or on Airbnb Experiences. Call ahead. The tagine is made by someone\'s grandmother. This is the Fez you came for.', halal: true },
    ],
    mosques: [
      { name: 'Qarawiyyin Mosque', area: 'Medina', note: 'Founded 859 CE by Fatima al-Fihri. The oldest continuously operating university in the world. Non-Muslims can see the courtyard from the door. The weight of history here is real.' },
      { name: 'Bou Inania Madrasa', area: 'Medina', note: 'The most famous madrasa in Fez open to non-Muslims. The zellige tilework and carved cedar are among the finest in the Islamic world. Come in the morning light.' },
    ],
    coffee: [
      { name: 'Cafe Clock', area: 'Medina', note: 'Double duty — good coffee and the cultural heartbeat of the medina. The rooftop at sunset.' },
      { name: 'Riad cafes in the Medina', area: 'Medina', note: 'Many riads open their courtyards as cafes — hidden behind unmarked doors, gardens with fountains. Ask your host for their favorite. Mint tea and quiet.' },
    ],
    experiences: [
      { name: 'Chouara Tannery', type: 'Cultural', note: 'The medieval tanneries. The colors, the smell, the process unchanged for centuries. View from the leather shops above. They will give you mint to hold under your nose.' },
      { name: 'Bou Inania Madrasa', type: 'Architecture', note: 'Open to visitors. The most beautiful madrasa you can actually enter. The zellige, the cedar, the stucco — layers of craft that took decades.' },
      { name: 'Ceramics in the potters quarter', type: 'Shopping', note: 'Watch artisans paint Fes blue ceramics by hand. Buy directly from the workshop. The cooperative on the hill has the best selection and fair prices.' },
    ],
    insiderTips: [
      'Hire a guide for your first walk through the medina. After that, get lost on purpose. You will always find your way out — just walk downhill toward the river.',
      'The best view of the medina is from the Merinid Tombs at sunset. Free. Quiet. The entire city spreads below you.',
      'Fez is less touristy than Marrakech. The prices are lower, the hassle is less, and the history is deeper.',
      'Every riad in the medina looks like nothing from outside — an unmarked door in a narrow alley. Inside, a courtyard with a fountain and zellige walls. Trust the process.',
    ],
  },
  {
    id: 'kuala-lumpur',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    heroImage: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Southeast Asia\'s halal capital feeds you first.',
    intro: 'The Petronas Towers frame a city where the adhan echoes between street food stalls and Islamic art galleries. KL feeds you first and asks questions later. Halal is the default, not the exception.',
    prayerNote: 'Malaysia is a Muslim-majority country. Halal certification is government-regulated and everywhere. Prayer rooms in every mall and public building. You will feel completely at home.',
    neighborhoods: [
      { name: 'Bukit Bintang', vibe: 'The center. Shopping. Street food.', description: 'Jalan Alor is the street food artery — the best hawker food in KL. Pavilion Mall for air-conditioned luxury. The contrast is the point.', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80' },
      { name: 'Kampung Baru', vibe: 'Malay village. Heritage. Preserved.', description: 'A traditional Malay village in the shadow of the Petronas Towers. Wooden stilt houses, the best nasi lemak in the city, and a community that has resisted development. Walk it with respect.', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Village Park Restaurant', type: 'Nasi Lemak', area: 'Damansara', note: 'The best nasi lemak in KL. Fried chicken, sambal, coconut rice. Worth the drive. Go before noon or it sells out.', halal: true },
      { name: 'Jalan Alor hawker stalls', type: 'Street food', area: 'Bukit Bintang', note: 'The most famous food street in KL. Satay, char kuey teow, roti canai. Look for the halal-certified stalls — most are.', halal: true },
      { name: 'Dewakan', type: 'Fine dining', area: 'KL', note: 'Malaysia\'s best restaurant. Chef Darren Teoh uses indigenous ingredients. Asia\'s 50 Best. Not halal-certified by JAKIM — does not serve pork but verify dietary needs directly with the restaurant before booking.', halal: false },
    ],
    mosques: [
      { name: 'Masjid Negara (National Mosque)', area: 'KL Sentral', note: 'The national mosque. Modernist architecture with a 73-meter minaret. Open to visitors outside prayer times. Robes provided.' },
      { name: 'Masjid Jamek', area: 'Confluence', note: 'The oldest mosque in KL, at the confluence of two rivers. This is where the city began. The surrounding park was recently restored and is beautiful.' },
    ],
    coffee: [
      { name: 'VCR', area: 'Bukit Bintang', note: 'Specialty coffee in a converted shophouse. The brunch menu is excellent. The flat white is the best in KL.' },
      { name: 'Pulp by Papa Palheta', area: 'Bangsar', note: 'Singapore-born specialty roaster with a KL outpost. Single-origin, roasted in-house. The space is industrial and cool. Verify current operating status before visiting.' },
    ],
    experiences: [
      { name: 'Islamic Arts Museum', type: 'Museum', note: 'The best Islamic art collection in Southeast Asia. Scale models of famous mosques from around the world. Beautiful building. Allow 2-3 hours.' },
      { name: 'Petronas Towers Skybridge', type: 'Landmark', note: 'Book online in advance. The skybridge connects the towers at the 41st floor. The observation deck on the 86th floor has the full view.' },
      { name: 'Batu Caves', type: 'Cultural', note: 'Hindu temple in a limestone cave. 272 steps up. Not Muslim-specific but culturally significant and visually stunning. Go early to avoid crowds.' },
    ],
    insiderTips: [
      'Grab (not Uber) is the ride-hailing app in Malaysia. Use it for everything.',
      'Malaysian food is among the best in the world. Eat from hawker stalls and kopitiams (coffee shops), not restaurants.',
      'The halal logo is government-regulated. If it has the JAKIM halal cert, it is verified. No guessing needed.',
      'KL is hot and humid year-round. Every mall has aggressive air conditioning. Bring a layer.',
    ],
  },
  {
    id: 'doha',
    city: 'Doha',
    country: 'Qatar',
    heroImage: 'https://images.unsplash.com/photo-1569551698535-af5c2a9003b1?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Built on ambition. Anchored by the Museum of Islamic Art.',
    intro: 'Where the Gulf\'s future takes shape. World Cup legacy stadiums, the corniche at sunset, and a desert that starts where the skyline ends. Doha is small enough to know in three days and ambitious enough to surprise you.',
    prayerNote: 'Qatar is a Muslim country. Everything is halal. Prayer rooms everywhere. The State Grand Mosque (Imam Abdul Wahhab Mosque) is enormous and open to visitors.',
    neighborhoods: [
      { name: 'Souq Waqif', vibe: 'The old market. Restored. Alive.', description: 'Spices, falcons, perfume, and shisha. The restoration preserved the atmosphere without Disney-fying it. Come in the evening when it fills up.', image: 'https://images.unsplash.com/photo-1569551698535-af5c2a9003b1?auto=format&fit=crop&w=800&q=80' },
      { name: 'The Pearl', vibe: 'Artificial island. Mediterranean fantasy.', description: 'Luxury apartments, marinas, and restaurants on a man-made island. Walk the Qanat Quartier (Venice-inspired canals). The excess is the experience.', image: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=800&q=80' },
    ],
    dining: [
      { name: 'Shay Al Shamous', type: 'Qatari', area: 'Souq Waqif', note: 'Traditional Qatari food that is hard to find even in Doha. The machboos (spiced rice with meat) is the national dish done right.', halal: true },
      { name: 'Damasca One', type: 'Syrian', area: 'Souq Waqif', note: 'Syrian food in the souq. The kibbeh and fattoush are excellent. Lively atmosphere, generous portions.', halal: true },
      { name: 'Jiwan', type: 'Fine dining', area: 'Museum of Islamic Art', note: 'Fine dining inside the MIA, operated by Qatar Museums. Qatari-inspired cuisine with a view of the Doha skyline. Halal. Reserve.', halal: true },
    ],
    mosques: [
      { name: 'Imam Abdul Wahhab Mosque (State Grand Mosque)', area: 'Center', note: 'The national mosque. Room for 30,000 worshippers. The architecture is contemporary Islamic. Open for tours outside prayer times.' },
      { name: 'Katara Mosque', area: 'Katara Cultural Village', note: 'Beautiful Persian and Timurid-inspired mosque in the cultural village. The blue-and-gold tilework is stunning. Quieter than the Grand Mosque.' },
    ],
    coffee: [
      { name: 'Flat White', area: 'Various locations', note: 'Doha\'s homegrown specialty coffee chain. Consistent, well-made. The Katara location is the nicest.' },
    ],
    experiences: [
      { name: 'Museum of Islamic Art', type: 'Museum', note: 'I.M. Pei\'s final masterpiece. The building alone justifies the visit. The collection spans 1,400 years of Islamic civilization. Free. Go at sunset for the skyline view from the park.' },
      { name: 'Desert safari & Inland Sea', type: 'Adventure', note: 'Drive to Khor Al Adaid — where the desert meets the sea. One of the few places in the world this happens. Camp overnight if you can.' },
      { name: 'Katara Cultural Village', type: 'Cultural', note: 'Amphitheater, galleries, beach, and mosques. The cultural heart of Doha. Free to enter. Events most evenings.' },
    ],
    insiderTips: [
      'Doha is small. You can see the highlights in 2-3 days. Use it as a long stopover or a short trip.',
      'The Corniche walk at sunset is the best free activity in the city. 7 km along the waterfront.',
      'Qatar is conservative. Dress modestly in public spaces. Alcohol is limited to hotels.',
      'The MIA park across from the museum has the best skyline view in the city. Go at dusk.',
    ],
  },
];

export const getCityGuide = (cityId) => CITY_GUIDES.find(g => g.id === cityId);
export const getAllCityGuides = () => CITY_GUIDES;

export default CITY_GUIDES;
