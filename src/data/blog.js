/**
 * Blog posts — stored as JS data, rendered by Blog and BlogPost pages.
 *
 * Block types:
 *   text       — body paragraph
 *   heading    — section heading (h2)
 *   pullquote  — large italic emphasis with left border
 *   short      — punchy single-line statement (bolder, tighter spacing)
 *   break      — visual section break (* * *)
 *   note       — practical info block (muted, boxed)
 *
 * Add new posts at the top of the array (newest first).
 */

const BLOG_POSTS = [
  {
    slug: 'traveling-solo-as-a-muslim-woman',
    title: 'Traveling Solo as a Muslim Woman',
    subtitle: 'Not a manifesto. Just what we keep hearing from sisters who do it.',
    author: 'Rihlah',
    date: '2026-08-24',
    readTime: '5 min',
    category: 'Community',
    image: null,
    body: [
      { type: 'text', content: 'We did not set out to write a think piece about solo female travel. We set out to build a travel product. But every conversation we had with Muslim women during development circled back to the same set of concerns — and none of them were the ones we expected.' },
      { type: 'short', content: 'Nobody asked for a safety score or a panic button.' },
      { type: 'text', content: 'What they asked for was specific. Which neighborhoods in Istanbul can I walk alone after Isha without thinking about it. Where in Marrakech can I pray Dhuhr that is not a tourist mosque with no women\'s section. Is there a sister who has been to Mexico City recently who I can just ask things.' },
      { type: 'text', content: 'The gap is not courage. The gap is intelligence — the kind that only travels through networks of women who have already been there and are willing to be honest about it.' },
      { type: 'break' },
      { type: 'heading', content: 'The visibility decision' },
      { type: 'text', content: 'One of the first things we built into Rihlah was a profile visibility toggle. You can set your profile to be visible to everyone, or only to other women.' },
      { type: 'text', content: 'We debated this internally. It felt like it could be read as segregation, or as a limitation. But every woman we showed it to had the same reaction: "Oh, thank God."' },
      { type: 'pullquote', content: 'The recommendation a sister gives another sister is different. The honesty is different. The trust is built differently.' },
      { type: 'text', content: 'A woman planning a solo trip to Istanbul who opens Rihlah and sees three other Muslim women overlapping with her dates — that changes the entire calculus. Not because she needs a travel buddy. Because she knows there is someone in the same city who shares her context, her frame of reference, her shorthand. Someone she can message if she needs a restaurant recommendation at 10pm.' },
      { type: 'text', content: 'That is not a feature. That is infrastructure.' },
      { type: 'break' },
      { type: 'heading', content: 'What we actually hear' },
      { type: 'text', content: '"I spent 45 minutes on Google trying to figure out if there was a women\'s prayer area at the mosque near my hotel in Kuala Lumpur. Forty-five minutes. For something any local sister could answer in one sentence."' },
      { type: 'text', content: '"My mom was fine with me going to London alone but I had to have a whole presentation for Morocco. She just needed to hear that other girls had done it and it was fine."' },
      { type: 'text', content: '"I don\'t need a travel app to tell me to \'be brave.\' I need it to tell me which side of Sultanahmet has the cheaper lahmacun."' },
      { type: 'text', content: 'We hear versions of these every week. The pattern is always the same: the information exists, but it is scattered across group chats and Instagram stories that disappear in 24 hours. There is no persistent layer where sisters can find each other and share what they know.' },
      { type: 'short', content: 'We are trying to build that layer.' },
      { type: 'break' },
      { type: 'text', content: 'Solo does not mean alone. It means you chose how you move. Rihlah is not trying to convince anyone to travel solo. We are trying to make sure that the women who already do — or want to — have the intelligence and the community they deserve when they get there.' },
    ],
  },
  {
    slug: '48-hours-in-mexico-city',
    title: '48 Hours in Mexico City',
    subtitle: 'You were not planning to go. That is exactly why you should.',
    author: 'Zahir',
    date: '2026-08-22',
    readTime: '7 min',
    category: 'City Guides',
    image: null,
    body: [
      { type: 'text', content: 'I had never considered Mexico City. I think most Muslim travelers have not. It is not on the circuit. No one\'s uncle went there. There is no "top 10 halal-friendly" listicle that includes it. When I told my family I was going, the first question was not "where will you pray" — it was "why."' },
      { type: 'short', content: 'I went because a friend who lives there said: "You will not want to leave." He was right.' },
      { type: 'break' },
      { type: 'heading', content: 'The first thing you notice' },
      { type: 'text', content: 'The scale. This is a city of 22 million people built in a volcanic valley, and every direction you look there is a mountain. The air at 7,300 feet is thinner than you expect. You will feel it on the first morning when you walk uphill in Roma Norte and wonder why you are breathing hard.' },
      { type: 'text', content: 'Roma Norte is where you should stay. The streets are wide, tree-lined, early 20th-century European architecture that looks like it was airlifted from Paris and left to develop its own personality for a hundred years. There are coffee shops on every block and most of them are genuinely good — not "good for Mexico City," just good.' },
      { type: 'text', content: 'I stayed in a hotel on Calle Orizaba for $65 a night. The room had 14-foot ceilings, a balcony, and a courtyard with a fountain. In London this would cost four hundred pounds. In New York it would not exist.' },
      { type: 'break' },
      { type: 'heading', content: 'Eating' },
      { type: 'text', content: 'This is a seafood city. I mean, Mexico is a seafood country, and the quality of what you can eat here without ever touching a questionable protein is extraordinary. Ceviches, aguachiles, fish tacos, shrimp cocktails the size of your head served in a styrofoam cup on the street for 80 pesos.' },
      { type: 'pullquote', content: 'I ate a ceviche at Contramar on a Tuesday afternoon that I am still thinking about four months later.' },
      { type: 'text', content: 'Contramar is the restaurant every food person in the world tells you to go to, and they are all correct. Get the tostadas de atun and the red-and-green grilled fish. Book a reservation or go at 1pm on a weekday. It is worth the effort.' },
      { type: 'text', content: 'For halal meat — and I looked hard — there are a few Middle Eastern spots in Zona Rosa. A place called Al Andalus on Liverpool street does a solid shawarma. There is a small halal butcher in Polanco if you are cooking. Beyond that, stick to seafood and vegetarian and you will eat better than you have in most "Muslim-friendly" destinations.' },
      { type: 'note', content: 'Practical: Most taquerias cook with lard (manteca). Ask "sin manteca?" and they will usually accommodate. Street corn (elote) and fruit vendors are always safe. The green and red salsas are almost always vegetarian.' },
      { type: 'break' },
      { type: 'heading', content: 'Prayer' },
      { type: 'text', content: 'There is a mosque. It is called Centro Educativo de la Comunidad Musulmana and it is in Polanco, which is the wealthy neighborhood north of Chapultepec Park. It is small — maybe 40 people at Jummah when I went. The community is a mix of Mexican converts, a few Arab families, some Pakistanis. Everyone was warm. The khutbah was in Spanish with Arabic portions.' },
      { type: 'text', content: 'I prayed Dhuhr and Asr there on Friday and a brother invited me to his house for dinner afterward. His wife made birria. This is the kind of thing that happens in small Muslim communities in unexpected cities — you show up as a stranger and leave as someone\'s guest.' },
      { type: 'text', content: 'For daily prayers, I mostly used parks. Chapultepec has quiet corners everywhere. I kept a small travel prayer mat in my daypack and never had an issue.' },
      { type: 'break' },
      { type: 'heading', content: 'What you should actually do' },
      { type: 'text', content: 'Forget the itinerary listicle format. Here is what I would tell a friend:' },
      { type: 'short', content: 'Go to the Frida Kahlo museum but book the first slot of the day. By 11am it is miserable.' },
      { type: 'short', content: 'Walk the Zocalo and go inside the National Palace. The Diego Rivera murals are the most ambitious single artwork I have ever seen in person. Free entry.' },
      { type: 'short', content: 'Take an Uber to Xochimilco on a Sunday morning before the party boats arrive. Float through the canals with a coffee.' },
      { type: 'short', content: 'Chapultepec Castle has the best view of the city. The museum inside is mid. The view is the point.' },
      { type: 'short', content: 'Roma Norte on a weeknight is better than Roma Norte on a weekend.' },
      { type: 'break' },
      { type: 'text', content: 'I went for five days and rebooked to stay nine. The city does that to people. It is absurdly affordable, genuinely beautiful, deeply cultured, and safer than its reputation suggests by a wide margin. The only thing missing is other Muslims — which is exactly why it felt like something Rihlah should cover first.' },
      { type: 'text', content: 'You were not planning to go. Reconsider.' },
    ],
  },
  {
    slug: 'why-we-built-rihlah',
    title: 'Why We Built Rihlah',
    subtitle: 'It started with a question nobody had a good answer to.',
    author: 'Zahir',
    date: '2026-08-20',
    readTime: '4 min',
    category: 'From the Founders',
    image: null,
    body: [
      { type: 'text', content: 'Last year I was planning a trip to Istanbul. I had been before, but not in seven years, and I wanted updated recommendations — specifically for halal restaurants that were actually good (not just halal), neighborhoods that were walkable and interesting (not just touristic), and prayer spaces that were worth visiting for the architecture as much as the salah.' },
      { type: 'text', content: 'I spent three hours on Google. I found seven "top halal restaurants in Istanbul" articles that all listed the same five places. I found a Reddit thread from 2019 with broken links. I found a YouTube video where someone reviewed a hotel buffet for eleven minutes.' },
      { type: 'short', content: 'Three hours. For Istanbul. A city with 3,000 mosques.' },
      { type: 'text', content: 'The information I actually needed came from a WhatsApp message to a friend of a friend who had been there six months ago. She sent me a voice note with more useful intel in 90 seconds than everything Google had given me in an afternoon.' },
      { type: 'pullquote', content: 'The best travel intelligence for Muslim travelers lives in group chats. It disappears in 24 hours. We wanted to build the layer where it persists.' },
      { type: 'break' },
      { type: 'heading', content: 'The actual problem' },
      { type: 'text', content: 'There are 1.8 billion Muslims worldwide. The Muslim travel market is projected to be worth $230 billion by 2028. And the tools we have are either generic platforms that ignore us, or "halal travel" sites that reduce our entire identity to a dietary restriction.' },
      { type: 'text', content: 'Neither works. I do not want a halal filter bolted onto Booking.com. I also do not want a niche app that only shows me "Muslim-friendly" destinations — as if the only places worth visiting are the ones that already cater to us.' },
      { type: 'text', content: 'I want to go to Mexico City and know where to pray. I want to go to Sarajevo and understand the history before I get there. I want to go to Marrakech and know which riads are actually worth the price and which are Instagram traps.' },
      { type: 'short', content: 'I want travel intelligence from people like me, for people like me.' },
      { type: 'break' },
      { type: 'heading', content: 'What Rihlah is' },
      { type: 'text', content: 'Rihlah is a travel platform. We curate city guides that answer the questions our community actually asks. We show you who else from the community is going where you are going, so you can connect before you arrive. And we are building a layer of travel intelligence that gets better as the community grows — because the best recommendations come from people who share your context.' },
      { type: 'text', content: 'The name means "journey" in Arabic. Not trip, not vacation — journey. Ibn Battuta called his life\'s work a rihlah. The word carries intention. That felt right.' },
      { type: 'break' },
      { type: 'heading', content: 'Where we are' },
      { type: 'text', content: 'We launched with Mexico City because it is the least obvious choice — a world-class destination that Muslim travelers almost never consider. If Rihlah can make CDMX accessible and exciting for our community, it can do it anywhere.' },
      { type: 'text', content: 'Istanbul, Marrakech, and Sarajevo are in progress. Not because they are "Muslim cities" — because our community is already going there and deserves better intelligence when they arrive.' },
      { type: 'text', content: 'If any of this resonates, we built it for you.' },
    ],
  },
];

export default BLOG_POSTS;
