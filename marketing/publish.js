#!/usr/bin/env node

/**
 * Rihlah Instagram Publisher
 *
 * Publishes carousel posts to Instagram via the Instagram Graph API.
 *
 * Usage:
 *   node marketing/publish.js marketing/output/sarajevo.json
 *   node marketing/publish.js marketing/output/sarajevo.json --dry-run
 *
 * Requires:
 *   - INSTAGRAM_ACCESS_TOKEN in marketing/.env
 *   - Slide images already rendered (run slides.js first, then download PNGs)
 *   - Images must be publicly accessible URLs (uploaded to Firebase Hosting)
 *
 * Flow:
 *   1. Uploads slide PNGs to a temp directory in Firebase Hosting
 *   2. Creates carousel container items for each slide
 *   3. Creates the carousel post with caption
 *   4. Publishes
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = '38910390231907626';
const API_BASE = 'https://graph.instagram.com/v21.0';

async function igApi(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  const body = { ...params, access_token: IG_TOKEN };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`IG API error: ${data.error.message}`);
  }
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonPath = args.find(a => !a.startsWith('--'));

  if (!jsonPath || !existsSync(jsonPath)) {
    console.error('Usage: node marketing/publish.js marketing/output/sarajevo.json [--dry-run]');
    process.exit(1);
  }

  if (!IG_TOKEN) {
    console.error('Error: INSTAGRAM_ACCESS_TOKEN not set in marketing/.env');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const slug = basename(jsonPath, '.json');
  const photoDir = join(dirname(jsonPath), `${slug}-photos`);
  const slideDir = join(dirname(jsonPath), `${slug}-slides`);

  // Check for rendered slide PNGs
  let slideImages = [];
  if (existsSync(slideDir)) {
    slideImages = readdirSync(slideDir)
      .filter(f => f.endsWith('.png'))
      .sort()
      .map(f => join(slideDir, f));
  }

  if (!slideImages.length) {
    console.error(`No slide PNGs found in ${slideDir}/`);
    console.error('First render slides, open in browser, click "Download All Slides", then move PNGs to:');
    console.error(`  ${slideDir}/`);
    console.error('Name them: slide-1.png, slide-2.png, etc.');
    process.exit(1);
  }

  console.error(`\n  Rihlah Instagram Publisher`);
  console.error(`  Post: ${slug}`);
  console.error(`  Slides: ${slideImages.length}`);
  console.error(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Build caption with hashtags from calendar or fallback
  const calendarPath = join(__dirname, 'calendar.json');
  let hashtags = '';
  if (existsSync(calendarPath)) {
    const cal = JSON.parse(readFileSync(calendarPath, 'utf-8'));
    const entry = cal.posts.find(p => p.slug === slug && p.type === 'carousel');
    if (entry && entry.hashtags) {
      hashtags = '\n\n' + entry.hashtags.map(h => `#${h}`).join(' ');
    }
  }
  if (!hashtags) {
    hashtags = '\n\n#muslimtravel #halaltravel #culturaltravel #rihlah';
  }
  const caption = data.caption + (data.caption.includes('#') ? '' : hashtags);
  console.error(`  Caption: ${caption.substring(0, 100)}...\n`);

  // Upload slides to Firebase Hosting as temp public URLs
  console.error('  Uploading slides to Firebase Hosting...');
  const publicDir = join(__dirname, '..', 'build', '_ig-temp', slug);
  execSync(`mkdir -p "${publicDir}"`);
  slideImages.forEach(img => {
    execSync(`cp "${img}" "${publicDir}/"`);
  });

  // Deploy only the temp directory
  if (!dryRun) {
    execSync(`cd "${join(__dirname, '..')}" && npx firebase deploy --only hosting 2>&1`, { stdio: 'pipe' });
  }

  const baseUrl = 'https://rihlah-f2faf.web.app/_ig-temp';
  const imageUrls = slideImages.map(img => `${baseUrl}/${slug}/${basename(img)}`);

  console.error('  Image URLs:');
  imageUrls.forEach((url, i) => console.error(`    [${i + 1}] ${url}`));

  if (dryRun) {
    console.error('\n  DRY RUN — would publish carousel with above images and caption.');
    console.error('  Run without --dry-run to publish.\n');
    return;
  }

  // Wait for hosting to propagate
  console.error('\n  Waiting for hosting to propagate...');
  await new Promise(r => setTimeout(r, 5000));

  // Step 1: Create carousel item containers
  console.error('  Creating carousel items...');
  const containerIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const result = await igApi(`/${IG_USER_ID}/media`, {
      image_url: imageUrls[i],
      is_carousel_item: true,
    });
    containerIds.push(result.id);
    console.error(`    [${i + 1}] Container: ${result.id}`);
  }

  // Step 2: Create carousel container
  console.error('  Creating carousel post...');
  const carousel = await igApi(`/${IG_USER_ID}/media`, {
    media_type: 'CAROUSEL',
    children: containerIds,
    caption: caption,
  });
  console.error(`  Carousel container: ${carousel.id}`);

  // Step 3: Publish
  console.error('  Publishing...');
  const published = await igApi(`/${IG_USER_ID}/media_publish`, {
    creation_id: carousel.id,
  });
  console.error(`\n  Published! Media ID: ${published.id}`);
  console.error(`  View at: https://www.instagram.com/rihlah.io/\n`);

  // Cleanup temp files from build
  execSync(`rm -rf "${publicDir}"`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
