#!/usr/bin/env node

/**
 * Rihlah Content Pipeline
 *
 * Takes a topic and generates a full week of content:
 *   - Instagram carousel copy (5-7 slides)
 *   - Instagram caption
 *   - Blog post draft
 *   - Newsletter section ("The Brief")
 *   - Reel hook lines
 *   - Story ideas
 *
 * Usage:
 *   node marketing/generate.js "Sarajevo" "The City" "Ottoman meets Habsburg, cevapi at Zeljo, Bosnian coffee ritual"
 *   node marketing/generate.js "packing light" "The Detail" "one carry-on, ten days, the art of editing your suitcase"
 *   node marketing/generate.js --interactive
 *
 * Requires: ANTHROPIC_API_KEY env variable
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

// Load .env from marketing/ directory
const __filename = fileURLToPath(import.meta.url);
const envPath = join(dirname(__filename), '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// --- Load brand context ---

function loadContext() {
  const files = [
    { path: join(ROOT, 'BRAND.md'), label: 'Brand Voice' },
    { path: join(ROOT, 'DIRECTION.md'), label: 'Strategic Direction' },
    { path: join(ROOT, 'docs', 'marketing-strategy.md'), label: 'Marketing Strategy' },
  ];

  return files.map(f => {
    try {
      return `## ${f.label}\n\n${readFileSync(f.path, 'utf-8')}`;
    } catch {
      return '';
    }
  }).filter(Boolean).join('\n\n---\n\n');
}

// --- Content pillars ---

const PILLARS = {
  'The City': 'Opinionated, specific destination content. Not listicles. One city, one angle, one opinion.',
  'The Table': 'Food as cultural connector. Specific restaurants, street food, the meal that changed a trip.',
  'The People': 'Real travelers, real stories. Member spotlights, founder perspective.',
  'The Detail': 'Hyper-specific, practical insider knowledge. Prayer logistics, SIM cards, that one phrase.',
  'The Spark': 'Provocative opinion that starts a conversation. Confident, not inflammatory.',
};

// --- System prompt ---

function buildSystemPrompt(brandContext) {
  return `You are the content engine for Rihlah, a curated travel community for Muslims who move with intention.

Your job: take a topic and generate a complete content package — carousel, caption, blog post, newsletter section, Reel hooks, and Story ideas.

${brandContext}

## Output Rules

VOICE:
- Warm, not corporate. Confident, not loud.
- Write like you're talking to a well-traveled friend, not presenting to investors.
- Light touch on faith — Islam is the foundation, not the sales pitch.
- Specific, not generic. "The ceviche at Contramar on a Tuesday afternoon" — not "amazing food experiences."
- No emojis. Ever. No exclamation marks unless absolutely earned.
- No hashtags in any output.

CAROUSEL SLIDES:
- 5-7 slides. First slide is the hook (bold, provocative, stops the scroll). Last slide is CTA or brand closer.
- Each slide: one idea, short text. Think billboard, not paragraph.
- Indicate which text should be headline (large/bold) vs. body (smaller/muted).

CAPTION:
- 1-3 sentences max. Should sound like a text to a friend.
- End with "rihlah.io — link in bio." (no period after bio)

BLOG POST:
- 600-1000 words. Opinionated, editorial, specific.
- Use the block types: text, heading, pullquote, short, break, note.
- Output as JSON array matching the blog.js format.

NEWSLETTER SECTION:
- 150 words max. The "City" or "Detail" or "Table" section of "The Brief."
- Tight, punchy, one strong opinion or recommendation.

REEL HOOKS:
- 3 options. The first line someone hears/reads. Under 10 words each.
- Should make someone stop scrolling.

STORY IDEAS:
- 2-3 interactive Story concepts (polls, questions, sliders).
- Include the actual text for each Story frame.

PHOTO SUGGESTIONS:
- For each carousel slide, indicate whether it needs a photo or works as pure graphic design.
- For slides that need photos, provide 2-3 specific Pexels search terms that would find atmospheric, editorial-quality images.
- CRITICAL: Every search term MUST include the specific city name AND country. Not "old town alley" — instead "sarajevo bosnia old town". Not "coffee copper pot" — instead "bosnian coffee sarajevo". Not "mosque minaret" — instead "sarajevo mosque gazi husrev beg". The city/country name must be in EVERY search term so we get photos from the actual location, not generic lookalikes.
- For food slides: include the dish name AND the city/cuisine origin. "bosnian cevapi sarajevo" not "grilled meat bread". "istanbul turkish breakfast kahvalti" not "breakfast spread table".
- Photos should feel lived-in, not stock. Natural light, warm tones, real moments. No posed tourists, no HDR, no aerial drone shots of beaches.
- Hook slides and CTA slides usually work better as pure graphic (no photo). City/food/detail slides usually need photos.
- The audience is globally curious — photos can be from ANY destination, not just Muslim-majority countries. Tokyo street food, Oaxaca markets, Lisbon trams, Sarajevo minarets — the range is the brand.

FORMAT: Output as JSON with these keys:
{
  "carousel": [{ "type": "hook|body|cta", "headline": "...", "body": "...", "photo": true|false, "photo_search": ["search term 1", "search term 2"] }],
  "caption": "...",
  "blog": { "title": "...", "subtitle": "...", "category": "...", "readTime": "...", "body": [{ "type": "text|heading|pullquote|short|break|note", "content": "..." }] },
  "newsletter": "...",
  "reel_hooks": ["...", "...", "..."],
  "story_ideas": [{ "type": "poll|question|slider", "text": "...", "options": ["...", "..."] }]
}`;
}

// --- Interactive mode ---

async function interactiveMode() {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.error('\n  Rihlah Content Pipeline\n');
  const topic = await ask('  Topic: ');
  console.error('  Pillars: The City | The Table | The People | The Detail | The Spark');
  const pillar = await ask('  Pillar: ');
  const angle = await ask('  Angle (optional — a specific take or detail): ');
  rl.close();
  return { topic, pillar: pillar || 'The City', angle };
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);

  let topic, pillar, angle;

  if (args[0] === '--interactive' || args.length === 0) {
    ({ topic, pillar, angle } = await interactiveMode());
  } else {
    [topic, pillar, angle] = args;
    pillar = pillar || 'The City';
    angle = angle || '';
  }

  if (!topic) {
    console.error('Usage: node marketing/generate.js "topic" "pillar" "angle"');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set.');
    console.error('  export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const pillarDesc = PILLARS[pillar] || PILLARS['The City'];
  const brandContext = loadContext();
  const client = new Anthropic();

  console.error(`\n  Generating content for: "${topic}"`);
  console.error(`  Pillar: ${pillar}`);
  if (angle) console.error(`  Angle: ${angle}`);
  console.error('  Working...\n');

  const userPrompt = [
    `Topic: ${topic}`,
    `Content pillar: ${pillar} — ${pillarDesc}`,
    angle ? `Angle/detail: ${angle}` : '',
    '',
    'Generate the full content package. Return only valid JSON, no markdown fences.',
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: buildSystemPrompt(brandContext),
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].text.trim();

  // Parse and pretty-print
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to extract JSON from response if wrapped in markdown
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      console.error('Failed to parse response as JSON. Raw output:');
      console.log(text);
      process.exit(1);
    }
  }

  // Save to output file
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const outDir = join(__dirname, 'output');
  const photoDir = join(outDir, `${slug}-photos`);
  mkdirSync(outDir, { recursive: true });

  // Fetch photos from Pexels if API key is available
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    const slidesNeedingPhotos = parsed.carousel.filter(s => s.photo && s.photo_search?.length);
    if (slidesNeedingPhotos.length) {
      mkdirSync(photoDir, { recursive: true });
      console.error('  --- FETCHING PHOTOS ---');
      const topicLower = topic.toLowerCase();
      for (let i = 0; i < parsed.carousel.length; i++) {
        const slide = parsed.carousel[i];
        if (!slide.photo || !slide.photo_search?.length) continue;

        let bestPhoto = null;
        // Try each search term, prefer results whose alt text mentions the topic/city
        for (const term of slide.photo_search) {
          if (bestPhoto) break;
          const query = encodeURIComponent(term);
          try {
            const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=10`, {
              headers: { Authorization: pexelsKey },
            });
            const data = await res.json();
            if (!data.photos?.length) continue;

            // First pass: find photo whose alt text mentions the city/topic
            const match = data.photos.find(p =>
              (p.alt || '').toLowerCase().includes(topicLower) ||
              (p.url || '').toLowerCase().includes(topicLower)
            );
            if (match) {
              bestPhoto = match;
              console.error(`  [${i + 1}] "${term}" -> ${match.photographer} (matched: "${topicLower}" in alt)`);
            } else if (!bestPhoto) {
              // No city match — take the first result from the first search term only
              bestPhoto = data.photos[0];
              console.error(`  [${i + 1}] "${term}" -> ${bestPhoto.photographer} (best available)`);
            }
          } catch (err) {
            console.error(`  [${i + 1}] Search failed for "${term}": ${err.message}`);
          }
        }

        if (bestPhoto) {
          const photoUrl = bestPhoto.src.large2x || bestPhoto.src.large;
          const photoPath = join(photoDir, `slide-${i + 1}.jpg`);
          const imgRes = await fetch(photoUrl);
          const buf = Buffer.from(await imgRes.arrayBuffer());
          writeFileSync(photoPath, buf);
          slide.photo_local = `${slug}-photos/slide-${i + 1}.jpg`;
          slide.photo_credit = `${bestPhoto.photographer} / Pexels`;
        }
      }
    }
  } else {
    // No Pexels key — add search URLs for manual download
    parsed.carousel.forEach(slide => {
      if (slide.photo && slide.photo_search?.length) {
        slide.photo_url = `https://www.pexels.com/search/${encodeURIComponent(slide.photo_search[0])}/`;
      }
    });
  }

  const outPath = join(outDir, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(parsed, null, 2));

  // Print human-readable summary to stderr, JSON to stdout
  console.error('  --- CAROUSEL ---');
  parsed.carousel?.forEach((s, i) => {
    const photoInfo = s.photo_local ? ' [photo]' : s.photo_url ? ' [needs photo]' : '';
    console.error(`  [${i + 1}]${photoInfo} ${s.headline || ''}`);
    if (s.body) console.error(`      ${s.body}`);
  });

  console.error('\n  --- CAPTION ---');
  console.error(`  ${parsed.caption}`);

  console.error('\n  --- BLOG ---');
  console.error(`  Title: ${parsed.blog?.title}`);
  console.error(`  Subtitle: ${parsed.blog?.subtitle}`);
  console.error(`  Blocks: ${parsed.blog?.body?.length || 0}`);

  console.error('\n  --- NEWSLETTER ---');
  console.error(`  ${parsed.newsletter?.substring(0, 150)}...`);

  console.error('\n  --- REEL HOOKS ---');
  parsed.reel_hooks?.forEach((h, i) => console.error(`  ${i + 1}. ${h}`));

  console.error('\n  --- STORY IDEAS ---');
  parsed.story_ideas?.forEach((s, i) => console.error(`  ${i + 1}. [${s.type}] ${s.text}`));

  console.error(`\n  Saved to: ${outPath}\n`);

  // Also output clean JSON to stdout for piping
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
