#!/usr/bin/env node

/**
 * Rihlah Content Pipeline — End to End
 *
 * One command: topic in, reviewed post out.
 *
 * Usage:
 *   node marketing/pipeline.js "Sarajevo" "The City" "Ottoman meets Habsburg, cevapi"
 *   node marketing/pipeline.js "Fez" "The City" "medina, getting lost" --publish
 *   node marketing/pipeline.js --interactive
 *
 * Steps:
 *   1. generate.js  — content + photos
 *   2. qa.js        — fact-check + brand voice review
 *   3. slides.js    — HTML preview
 *   4. render.js    — 1080x1080 PNGs
 *   5. reels.js     — 1080x1920 vertical MP4
 *   6. Opens everything for your review
 *   7. publish.js   — post to Instagram (only with --publish)
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function run(cmd, label) {
  console.error(`\n  ── ${label} ──`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT, timeout: 180000 });
    return true;
  } catch (err) {
    console.error(`  FAILED: ${label}`);
    return false;
  }
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const shouldPublish = args.includes('--publish');
  const interactive = args.includes('--interactive');
  const skipQA = args.includes('--skip-qa');
  const filteredArgs = args.filter(a => !a.startsWith('--'));

  let topic, pillar, angle;

  if (interactive || filteredArgs.length === 0) {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    const q = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.error('\n  Rihlah Content Pipeline\n');
    topic = await q('  Topic: ');
    console.error('  Pillars: The City | The Table | The People | The Detail | The Spark');
    pillar = await q('  Pillar: ');
    angle = await q('  Angle: ');
    rl.close();
  } else {
    [topic, pillar, angle] = filteredArgs;
  }

  pillar = pillar || 'The City';
  angle = angle || '';

  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const jsonPath = `marketing/output/${slug}.json`;

  console.error(`\n  ╔═══════════════════════════════════════════╗`);
  console.error(`  ║  RIHLAH CONTENT PIPELINE                  ║`);
  console.error(`  ╠═══════════════════════════════════════════╣`);
  console.error(`  ║  Topic:  ${topic.padEnd(33)}║`);
  console.error(`  ║  Pillar: ${pillar.padEnd(33)}║`);
  console.error(`  ║  Slug:   ${slug.padEnd(33)}║`);
  console.error(`  ╚═══════════════════════════════════════════╝`);

  // Step 1: Generate content + photos
  const genArgs = `"${topic}" "${pillar}" "${angle}"`;
  if (!run(`node marketing/generate.js ${genArgs}`, 'GENERATE — content + photos')) {
    process.exit(1);
  }

  // Step 2: QA review
  if (!skipQA) {
    const qaPass = run(`node marketing/qa.js ${jsonPath}`, 'QA — fact-check + brand voice');
    if (!qaPass) {
      console.error('\n  QA FAILED. Review issues above.');
      const proceed = await ask('  Continue anyway? (y/n): ');
      if (proceed !== 'y') {
        console.error('  Aborted.\n');
        process.exit(1);
      }
    }
  }

  // Step 3: Generate slides HTML
  run(`node marketing/slides.js ${jsonPath}`, 'SLIDES — HTML preview');

  // Step 4: Render PNGs
  if (!run(`node marketing/render.js ${jsonPath}`, 'RENDER — 1080x1080 PNGs')) {
    console.error('  PNG render failed. Continuing...');
  }

  // Step 5: Generate Reel
  if (!run(`node marketing/reels.js ${jsonPath} --duration 30`, 'REELS — 30s vertical video')) {
    console.error('  Reel generation failed. Continuing...');
  }

  // Step 6: Open everything for review
  console.error('\n  ── REVIEW ──');
  console.error('  Opening slides and reel for review...\n');

  try {
    execSync(`open "marketing/output/${slug}-slides/"`, { cwd: ROOT, stdio: 'ignore' });
    execSync(`open "marketing/output/${slug}-reel.mp4"`, { cwd: ROOT, stdio: 'ignore' });
    execSync(`open "marketing/output/${slug}-slides.html"`, { cwd: ROOT, stdio: 'ignore' });
  } catch {}

  // Step 7: Publish (if --publish flag)
  if (shouldPublish) {
    const confirm = await ask('  Publish to Instagram? (y/n): ');
    if (confirm === 'y') {
      run(`node marketing/publish.js ${jsonPath}`, 'PUBLISH — posting to Instagram');
    } else {
      console.error('  Skipped publishing.\n');
    }
  } else {
    console.error('  Run with --publish to post to Instagram.');
    console.error(`  Or manually: node marketing/publish.js ${jsonPath}\n`);
  }

  console.error(`  ╔═══════════════════════════════════════════╗`);
  console.error(`  ║  PIPELINE COMPLETE                        ║`);
  console.error(`  ╠═══════════════════════════════════════════╣`);
  console.error(`  ║  Carousel PNGs: output/${slug}-slides/    ║`);
  console.error(`  ║  Reel MP4:      output/${slug}-reel.mp4   ║`);
  console.error(`  ║  Blog JSON:     output/${slug}.json       ║`);
  console.error(`  ╚═══════════════════════════════════════════╝\n`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
