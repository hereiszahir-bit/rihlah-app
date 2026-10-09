#!/usr/bin/env node

/**
 * Rihlah Content Scheduler
 *
 * Reads calendar.json and publishes posts at their scheduled time.
 * Run via cron every 15 minutes, or manually to see what's next.
 *
 * Usage:
 *   node marketing/schedule.js              # Show upcoming posts
 *   node marketing/schedule.js --run        # Publish any due posts
 *   node marketing/schedule.js --dry-run    # Show what would publish now
 *   node marketing/schedule.js --schedule   # Install cron job
 *   node marketing/schedule.js --unschedule # Remove cron job
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CALENDAR_PATH = join(__dirname, 'calendar.json');

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
  const body = { ...params, access_token: IG_TOKEN };
  const res = await fetch(new URL(`${API_BASE}${endpoint}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(`IG API: ${data.error.message}`);
  return data;
}

function loadCalendar() {
  if (!existsSync(CALENDAR_PATH)) {
    console.error('No calendar.json found. Create one first.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(CALENDAR_PATH, 'utf-8'));
}

function saveCalendar(cal) {
  writeFileSync(CALENDAR_PATH, JSON.stringify(cal, null, 2));
}

function getPostDateTime(post, tz) {
  const dateStr = `${post.date}T${post.time || '11:00'}:00`;
  // Parse in the configured timezone
  const d = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: tz }));
  // Return a proper Date for comparison
  return new Date(dateStr);
}

function isDue(post, tz) {
  const now = new Date();
  const postTime = getPostDateTime(post, tz);
  // Due if scheduled time is in the past (within 24h window) and not yet published
  const diffMs = now - postTime;
  return diffMs >= 0 && diffMs < 24 * 60 * 60 * 1000 && post.status === 'ready';
}

async function publishCarousel(slug, caption, hashtags) {
  const slideDir = join(__dirname, 'output', `${slug}-slides`);
  if (!existsSync(slideDir)) {
    console.error(`  No slides found at ${slideDir}`);
    return false;
  }

  const slideImages = readdirSync(slideDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => join(slideDir, f));

  if (!slideImages.length) {
    console.error(`  No PNGs in ${slideDir}`);
    return false;
  }

  // Build caption
  const hashtagStr = hashtags?.length
    ? '\n\n' + hashtags.map(h => `#${h}`).join(' ')
    : '';
  const fullCaption = caption + hashtagStr;

  // Upload to Firebase Hosting
  const publicDir = join(ROOT, 'build', '_ig-temp', slug);
  execSync(`mkdir -p "${publicDir}"`);
  slideImages.forEach(img => execSync(`cp "${img}" "${publicDir}/"`));
  execSync(`cd "${ROOT}" && npx firebase deploy --only hosting 2>&1`, { stdio: 'pipe' });

  const baseUrl = 'https://rihlah-f2faf.web.app/_ig-temp';
  const imageUrls = slideImages.map(img => `${baseUrl}/${slug}/${basename(img)}`);

  // Wait for propagation
  await new Promise(r => setTimeout(r, 5000));

  // Create carousel items
  const containerIds = [];
  for (const url of imageUrls) {
    const result = await igApi(`/${IG_USER_ID}/media`, {
      image_url: url,
      is_carousel_item: true,
    });
    containerIds.push(result.id);
  }

  // Create + publish carousel
  const carousel = await igApi(`/${IG_USER_ID}/media`, {
    media_type: 'CAROUSEL',
    children: containerIds,
    caption: fullCaption,
  });

  const published = await igApi(`/${IG_USER_ID}/media_publish`, {
    creation_id: carousel.id,
  });

  // Cleanup
  execSync(`rm -rf "${publicDir}"`);

  console.error(`  Published carousel: ${published.id}`);
  return true;
}

async function publishReel(slug, caption, hashtags) {
  const reelPath = join(__dirname, 'output', `${slug}-reel.mp4`);
  if (!existsSync(reelPath)) {
    console.error(`  No reel found at ${reelPath}`);
    return false;
  }

  // Build caption
  const hashtagStr = hashtags?.length
    ? '\n\n' + hashtags.map(h => `#${h}`).join(' ')
    : '';
  const fullCaption = caption + hashtagStr;

  // Upload reel to Firebase Hosting
  const publicDir = join(ROOT, 'build', '_ig-temp', slug);
  execSync(`mkdir -p "${publicDir}"`);
  execSync(`cp "${reelPath}" "${publicDir}/reel.mp4"`);
  execSync(`cd "${ROOT}" && npx firebase deploy --only hosting 2>&1`, { stdio: 'pipe' });

  const videoUrl = `https://rihlah-f2faf.web.app/_ig-temp/${slug}/reel.mp4`;

  await new Promise(r => setTimeout(r, 5000));

  // Create reel container
  const container = await igApi(`/${IG_USER_ID}/media`, {
    media_type: 'REELS',
    video_url: videoUrl,
    caption: fullCaption,
  });

  // Poll until ready (video processing takes time)
  console.error(`  Reel container: ${container.id} — waiting for processing...`);
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise(r => setTimeout(r, 5000));
    const check = await fetch(
      `${API_BASE}/${container.id}?fields=status_code&access_token=${IG_TOKEN}`
    );
    const checkData = await check.json();
    status = checkData.status_code;
    attempts++;
    if (attempts % 3 === 0) console.error(`  Still processing... (${attempts * 5}s)`);
  }

  if (status !== 'FINISHED') {
    console.error(`  Reel processing failed. Status: ${status}`);
    return false;
  }

  // Publish
  const published = await igApi(`/${IG_USER_ID}/media_publish`, {
    creation_id: container.id,
  });

  // Cleanup
  execSync(`rm -rf "${publicDir}"`);

  console.error(`  Published reel: ${published.id}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldRun = args.includes('--run');
  const dryRun = args.includes('--dry-run');
  const installCron = args.includes('--schedule');
  const removeCron = args.includes('--unschedule');

  // Cron management
  if (installCron) {
    const cronLine = `*/15 * * * * cd "${ROOT}" && /usr/local/bin/node marketing/schedule.js --run >> /tmp/rihlah-scheduler.log 2>&1`;
    try {
      const existing = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
      if (existing.includes('schedule.js')) {
        console.error('Cron job already installed.');
        return;
      }
      execSync(`(crontab -l 2>/dev/null; echo '${cronLine}') | crontab -`);
    } catch {
      execSync(`echo '${cronLine}' | crontab -`);
    }
    console.error('Cron job installed. Runs every 15 minutes.');
    console.error('Log: /tmp/rihlah-scheduler.log');
    return;
  }

  if (removeCron) {
    try {
      const existing = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
      const filtered = existing.split('\n').filter(l => !l.includes('schedule.js')).join('\n');
      execSync(`echo '${filtered}' | crontab -`);
      console.error('Cron job removed.');
    } catch {
      console.error('No cron job found.');
    }
    return;
  }

  const cal = loadCalendar();
  const tz = cal.timezone || 'America/Chicago';
  const now = new Date();

  console.error(`\n  Rihlah Content Calendar`);
  console.error(`  ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz })}`);
  console.error(`  Timezone: ${tz}\n`);

  // Show all upcoming posts
  const upcoming = cal.posts.filter(p => p.status !== 'published');
  const published = cal.posts.filter(p => p.status === 'published');

  if (!shouldRun && !dryRun) {
    // Display mode
    console.error('  ┌──────────────┬───────────┬──────────────────────┬──────────┐');
    console.error('  │ Date         │ Time      │ Post                 │ Status   │');
    console.error('  ├──────────────┼───────────┼──────────────────────┼──────────┤');

    for (const post of cal.posts) {
      const date = post.date;
      const time = post.time || cal.default_times[post.type] || '11:00';
      const name = `${post.slug} (${post.type})`;
      const status = post.status;
      const due = isDue(post, tz) ? ' <-- DUE' : '';
      console.error(`  │ ${date} │ ${time.padEnd(9)} │ ${name.padEnd(20)} │ ${(status + due).padEnd(8)} │`);
    }

    console.error('  └──────────────┴───────────┴──────────────────────┴──────────┘');
    console.error(`\n  ${published.length} published, ${upcoming.length} upcoming`);
    console.error(`  Run with --run to publish due posts, --dry-run to preview.\n`);
    return;
  }

  // Find posts that are due
  const duePosts = cal.posts.filter(p => isDue(p, tz));

  if (!duePosts.length) {
    console.error('  No posts due right now.\n');
    // Show next upcoming
    const next = upcoming.sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) {
      console.error(`  Next: ${next.slug} (${next.type}) on ${next.date} at ${next.time || cal.default_times[next.type]}\n`);
    }
    return;
  }

  for (const post of duePosts) {
    console.error(`  ── ${post.slug} (${post.type}) ──`);

    if (dryRun) {
      console.error(`  Would publish: ${post.slug} ${post.type}`);
      console.error(`  Scheduled: ${post.date} ${post.time}`);
      console.error(`  Hashtags: ${post.hashtags?.map(h => '#' + h).join(' ') || 'none'}\n`);
      continue;
    }

    if (!IG_TOKEN) {
      console.error('  Skipped — no INSTAGRAM_ACCESS_TOKEN set.\n');
      continue;
    }

    // Load content JSON for caption
    const jsonPath = join(__dirname, 'output', `${post.slug}.json`);
    if (!existsSync(jsonPath)) {
      console.error(`  Skipped — ${jsonPath} not found.\n`);
      continue;
    }

    const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    const caption = post.caption || data.caption;

    let success = false;
    if (post.type === 'carousel') {
      success = await publishCarousel(post.slug, caption, post.hashtags);
    } else if (post.type === 'reel') {
      success = await publishReel(post.slug, caption, post.hashtags);
    }

    if (success) {
      post.status = 'published';
      post.published_at = new Date().toISOString();
      saveCalendar(cal);
      console.error(`  Status updated to "published".\n`);
    } else {
      post.status = 'failed';
      saveCalendar(cal);
      console.error(`  Status updated to "failed".\n`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
