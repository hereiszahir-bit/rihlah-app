#!/usr/bin/env node

/**
 * Rihlah Content QA Agent
 *
 * Reviews generated content for accuracy, brand voice, and photo quality.
 * Uses Claude to fact-check claims and flag issues.
 *
 * Usage:
 *   node marketing/qa.js marketing/output/sarajevo.json
 *
 * Output: QA report to stderr + updated JSON with qa field
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

// Load brand context
function loadBrandContext() {
  const root = join(__dirname, '..');
  const files = [
    join(root, 'BRAND.md'),
    join(root, 'DIRECTION.md'),
  ];
  return files.map(f => {
    try { return readFileSync(f, 'utf-8'); } catch { return ''; }
  }).filter(Boolean).join('\n\n---\n\n');
}

async function main() {
  const args = process.argv.slice(2);
  const jsonPath = args.find(a => !a.startsWith('--'));

  if (!jsonPath || !existsSync(jsonPath)) {
    console.error('Usage: node marketing/qa.js marketing/output/sarajevo.json');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not set.');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const slug = basename(jsonPath, '.json');
  const brandContext = loadBrandContext();

  console.error(`\n  Rihlah QA Agent`);
  console.error(`  Post: ${slug}`);
  console.error(`  Running checks...\n`);

  const client = new Anthropic();

  const qaPrompt = `You are a senior editorial QA reviewer for Rihlah, a curated travel brand for Muslim travelers.

## Brand Context
${brandContext}

## Content to Review
${JSON.stringify(data, null, 2)}

## Your Job

Review this content package across 5 dimensions. Be specific and actionable. Do NOT praise — only flag problems or pass.

### 1. FACTUAL ACCURACY
Check every specific claim:
- Restaurant names, locations, years — are they real and correct?
- Historical dates, facts, statistics — verified?
- Cultural claims — accurate representation?
- Price claims — plausible?
- Flag anything you cannot verify or that seems wrong.
- Flag anything that sounds made up or hallucinated.

### 2. PHOTO RELEVANCE
For each photo slide:
- Does the photo_search term match the slide content?
- Could the search term return photos from the wrong city/country?
- Is the photo_credit present?
- Flag any slide where the photo might not match (e.g., "Ottoman alley" could return Istanbul instead of Sarajevo)

### 3. BRAND VOICE
Check against Rihlah brand guidelines:
- No emojis (flag any)
- No exclamation marks (unless truly earned)
- No hashtags in content (only in meta)
- Warm, not corporate
- Specific, not generic ("the ceviche at Contramar" not "amazing food")
- Light touch on faith — Islam is foundation, not sales pitch
- No "hidden gem" or "bucket list" or "must-visit" cliches
- Caption ends with "rihlah.io — link in bio" (no period after bio)

### 4. CONTENT QUALITY
- Is there AI slop? (overly perfect structure, generic transitions, "tapestry of cultures", "nestled in")
- Does each carousel slide have ONE idea, not two?
- Is the blog post opinionated or just informative?
- Are the reel hooks under 10 words each?
- Do story ideas have actual interactive text, not just concepts?

### 5. DESIGN/TECHNICAL
- Hook slide: is it provocative enough to stop a scroll?
- CTA slide: does it have a clear action?
- Are any slides too text-heavy for a 1080x1080 format?
- Caption: is it 1-3 sentences?

## Output Format

Return JSON only, no markdown fences. Keep issues BRIEF — one sentence each, max 20 words per issue. Max 10 issues total. Do not explain reasoning, just state the problem and fix:
{
  "score": 1-10,
  "pass": true/false,
  "issues": [
    { "severity": "critical|warning|note", "category": "accuracy|photos|voice|quality|design", "slide": null|number, "issue": "brief description", "fix": "brief fix" }
  ],
  "summary": "One sentence overall assessment"
}

A score of 7+ is a pass. Critical issues = auto-fail regardless of score.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: qaPrompt }],
  });

  const text = response.content[0].text.trim();

  let qa;
  try {
    qa = JSON.parse(text);
  } catch {
    // Try to extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        qa = JSON.parse(match[0]);
      } catch {
        // Try fixing common JSON issues — trailing commas, unescaped quotes
        let cleaned = match[0]
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/[\x00-\x1F]/g, ' ');
        try {
          qa = JSON.parse(cleaned);
        } catch (e) {
          console.error('Failed to parse QA response. Raw output:');
          console.error(text);
          console.error('Parse error:', e.message);
          process.exit(1);
        }
      }
    } else {
      console.error('No JSON found in QA response. Raw output:');
      console.error(text);
      process.exit(1);
    }
  }

  // Display report
  const passLabel = qa.pass ? '  PASS' : '  FAIL';
  const scoreBar = '█'.repeat(qa.score) + '░'.repeat(10 - qa.score);

  console.error(`  ┌─────────────────────────────────────────────┐`);
  console.error(`  │  QA REPORT: ${slug.padEnd(32)}│`);
  console.error(`  ├─────────────────────────────────────────────┤`);
  console.error(`  │  Score: ${scoreBar} ${qa.score}/10${passLabel.padStart(10)}  │`);
  console.error(`  └─────────────────────────────────────────────┘`);
  console.error(`  ${qa.summary}\n`);

  if (qa.issues?.length) {
    const criticals = qa.issues.filter(i => i.severity === 'critical');
    const warnings = qa.issues.filter(i => i.severity === 'warning');
    const notes = qa.issues.filter(i => i.severity === 'note');

    if (criticals.length) {
      console.error(`  CRITICAL (${criticals.length}):`);
      criticals.forEach(i => {
        console.error(`    [${i.category}]${i.slide ? ` Slide ${i.slide}:` : ''} ${i.issue}`);
        if (i.fix) console.error(`      Fix: ${i.fix}`);
      });
      console.error('');
    }

    if (warnings.length) {
      console.error(`  WARNINGS (${warnings.length}):`);
      warnings.forEach(i => {
        console.error(`    [${i.category}]${i.slide ? ` Slide ${i.slide}:` : ''} ${i.issue}`);
        if (i.fix) console.error(`      Fix: ${i.fix}`);
      });
      console.error('');
    }

    if (notes.length) {
      console.error(`  NOTES (${notes.length}):`);
      notes.forEach(i => {
        console.error(`    [${i.category}]${i.slide ? ` Slide ${i.slide}:` : ''} ${i.issue}`);
      });
      console.error('');
    }
  } else {
    console.error('  No issues found.\n');
  }

  // Save QA results to the JSON
  data.qa = qa;
  writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.error(`  QA results saved to ${jsonPath}\n`);

  // Exit with error code if failed
  if (!qa.pass) process.exit(1);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
