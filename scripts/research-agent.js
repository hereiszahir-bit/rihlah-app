#!/usr/bin/env node

/**
 * Rihlah Research Agent
 *
 * Validates city guide content before it ships. Every place name, location,
 * halal claim, and factual assertion gets verified against web sources.
 *
 * Usage:
 *   node scripts/research-agent.js validate <cityId>     — validate a single city
 *   node scripts/research-agent.js validate-all           — validate all cities
 *   node scripts/research-agent.js add-city <cityId>      — research & generate a new city guide
 *   node scripts/research-agent.js refresh <cityId>       — re-verify existing city data
 *
 * Requirements:
 *   ANTHROPIC_API_KEY env var
 *
 * Output:
 *   Creates/updates files in scripts/research-output/
 *   - <cityId>-validation.json   — structured validation results
 *   - <cityId>-report.md         — human-readable report
 *   - <cityId>-fixes.json        — suggested corrections (auto-applicable)
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'research-output');
const CITY_GUIDES_PATH = path.join(__dirname, '..', 'src', 'data', 'cityGuides.js');

// Validation categories — each has different trust requirements
const VALIDATION_RULES = {
  // CRITICAL: Wrong info here damages trust with the core audience
  mosques: {
    severity: 'critical',
    checks: ['exists', 'location', 'name_accuracy', 'access_policy', 'current_status'],
    description: 'Prayer spaces — wrong info means someone shows up and cannot pray',
  },
  halal_claims: {
    severity: 'critical',
    checks: ['certification_status', 'meat_sourcing', 'alcohol_in_cooking'],
    description: 'Halal status — false claims break dietary trust permanently',
  },
  // HIGH: Wrong info causes bad experiences
  dining: {
    severity: 'high',
    checks: ['exists', 'location', 'cuisine_type', 'still_open', 'halal_status'],
    description: 'Restaurants — need to exist, be in the right area, and halal claims must be verified',
  },
  experiences: {
    severity: 'high',
    checks: ['exists', 'location', 'current_access', 'pricing', 'hours', 'seasonal_restrictions'],
    description: 'Activities — access policies and hours change frequently',
  },
  // MEDIUM: Wrong info is embarrassing but not harmful
  coffee: {
    severity: 'medium',
    checks: ['exists', 'location', 'still_open', 'vibe_accuracy'],
    description: 'Coffee shops — need to exist and be in the right neighborhood',
  },
  neighborhoods: {
    severity: 'medium',
    checks: ['name_accuracy', 'vibe_accuracy', 'description_accuracy'],
    description: 'Neighborhood descriptions — should be directionally correct',
  },
  // LOW: Subjective or general claims
  insider_tips: {
    severity: 'low',
    checks: ['factual_accuracy', 'current_relevance', 'safety_implications'],
    description: 'Tips — factual claims (altitude, transit info) must be correct',
  },
};

// The system prompt that turns Claude into a research validator
const RESEARCH_SYSTEM_PROMPT = `You are a travel content fact-checker for Rihlah, a travel app for Muslim travelers.

Your job is to validate every factual claim in city guide data. You have web search available.

RULES:
1. Search for EVERY place by name + city. Do not assume anything exists.
2. For mosques and prayer spaces: verify exact name, exact address/neighborhood, current operating status, and access policy (open to visitors or not).
3. For halal claims: NEVER mark something as halal unless you find explicit halal certification or multiple reliable sources confirming it. "It's a Lebanese restaurant" does NOT mean halal. Default to halal: false with a note to "verify directly."
4. For restaurants: verify they still exist (check for recent reviews within the last 2 years), correct neighborhood, and cuisine description.
5. For experiences: check current access policies, hours, and pricing. Things change — pyramids get closed to climbing, museums move, fees change.
6. For factual claims (dates, distances, altitudes, transit info): verify against official sources.
7. Flag any claim that could lead someone to a place that doesn't exist, is closed, or has moved.

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "city": "city name",
  "validated_at": "ISO date",
  "overall_status": "pass" | "fail" | "needs_review",
  "critical_issues": [ { "field": "...", "item": "...", "issue": "...", "fix": "..." } ],
  "warnings": [ { "field": "...", "item": "...", "issue": "...", "suggestion": "..." } ],
  "verified": [ { "field": "...", "item": "...", "status": "confirmed" } ],
  "sources": [ "url1", "url2", ... ]
}

SEVERITY GUIDE:
- critical_issues: Place doesn't exist, wrong city/country, halal claim is false, access policy is wrong, dangerous advice
- warnings: Place might have moved, hours might have changed, subjective claim is stretched, minor location inaccuracy
- verified: Confirmed correct via web sources`;

class ResearchAgent {
  constructor() {
    this.client = new Anthropic();
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

  loadCityGuides() {
    // Read the JS file and extract the data
    const content = fs.readFileSync(CITY_GUIDES_PATH, 'utf-8');
    // Use a simple approach: require won't work with ES module exports,
    // so we evaluate the array portion
    const match = content.match(/const CITY_GUIDES = (\[[\s\S]*?\n\]);/);
    if (!match) throw new Error('Could not parse CITY_GUIDES from file');
    // eslint-disable-next-line no-eval
    const guides = eval(match[1]);
    return guides;
  }

  async validateCity(cityId) {
    const guides = this.loadCityGuides();
    const city = guides.find(g => g.id === cityId);
    if (!city) {
      console.error(`City "${cityId}" not found. Available: ${guides.map(g => g.id).join(', ')}`);
      process.exit(1);
    }

    console.log(`\nValidating: ${city.city}, ${city.country}`);
    console.log('='.repeat(50));

    const cityData = JSON.stringify(city, null, 2);

    const prompt = `Validate every factual claim in this city guide data for ${city.city}, ${city.country}.

Search the web for EACH place individually. Do not skip any.

City guide data:
${cityData}

Validation priorities (in order):
1. MOSQUES & PRAYER SPACES — verify name, location, access, current status
2. HALAL CLAIMS — verify any restaurant marked halal:true has actual certification
3. DINING — verify existence, location, still operating
4. EXPERIENCES — verify current access policies (things close, rules change)
5. COFFEE — verify existence and location
6. FACTUAL CLAIMS in tips — dates, distances, transit info, prices

Return ONLY the JSON validation report. No markdown, no explanation outside the JSON.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: RESEARCH_SYSTEM_PROMPT,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 30,
        }],
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract the text response (skip tool use blocks)
      const textBlocks = response.content.filter(b => b.type === 'text');
      const resultText = textBlocks.map(b => b.text).join('\n');

      // Try to parse JSON from the response
      let validation;
      try {
        // Handle case where JSON is wrapped in code blocks
        const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                          [null, resultText];
        validation = JSON.parse(jsonMatch[1].trim());
      } catch (parseErr) {
        // If we can't parse JSON, save the raw response
        console.warn('Could not parse structured JSON. Saving raw response.');
        validation = { raw_response: resultText, parse_error: true };
      }

      // Save results
      const validationPath = path.join(OUTPUT_DIR, `${cityId}-validation.json`);
      fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2));
      console.log(`Validation saved: ${validationPath}`);

      // Generate human-readable report
      this.generateReport(cityId, city, validation);

      // Print summary
      this.printSummary(city, validation);

      return validation;
    } catch (err) {
      console.error(`Validation failed for ${city.city}:`, err.message);
      throw err;
    }
  }

  generateReport(cityId, city, validation) {
    if (validation.parse_error) {
      const reportPath = path.join(OUTPUT_DIR, `${cityId}-report.md`);
      fs.writeFileSync(reportPath, `# ${city.city} — Validation Report\n\nRaw response (could not parse structured JSON):\n\n${validation.raw_response}`);
      return;
    }

    const lines = [
      `# ${city.city}, ${city.country} — Validation Report`,
      `Validated: ${validation.validated_at || new Date().toISOString()}`,
      `Status: ${(validation.overall_status || 'unknown').toUpperCase()}`,
      '',
    ];

    if (validation.critical_issues?.length) {
      lines.push('## CRITICAL ISSUES (must fix before shipping)');
      lines.push('');
      for (const issue of validation.critical_issues) {
        lines.push(`- **${issue.field} > ${issue.item}**: ${issue.issue}`);
        if (issue.fix) lines.push(`  - Fix: ${issue.fix}`);
      }
      lines.push('');
    }

    if (validation.warnings?.length) {
      lines.push('## WARNINGS (should review)');
      lines.push('');
      for (const warn of validation.warnings) {
        lines.push(`- **${warn.field} > ${warn.item}**: ${warn.issue}`);
        if (warn.suggestion) lines.push(`  - Suggestion: ${warn.suggestion}`);
      }
      lines.push('');
    }

    if (validation.verified?.length) {
      lines.push('## VERIFIED');
      lines.push('');
      for (const v of validation.verified) {
        lines.push(`- ${v.field} > ${v.item}: confirmed`);
      }
      lines.push('');
    }

    if (validation.sources?.length) {
      lines.push('## Sources');
      lines.push('');
      for (const src of validation.sources) {
        lines.push(`- ${src}`);
      }
    }

    const reportPath = path.join(OUTPUT_DIR, `${cityId}-report.md`);
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log(`Report saved: ${reportPath}`);
  }

  printSummary(city, validation) {
    if (validation.parse_error) {
      console.log('\n  Could not parse structured results. Check raw report.');
      return;
    }

    const critical = validation.critical_issues?.length || 0;
    const warnings = validation.warnings?.length || 0;
    const verified = validation.verified?.length || 0;

    console.log(`\n  ${city.city} Summary:`);
    console.log(`  ${critical} critical issues | ${warnings} warnings | ${verified} verified`);

    if (critical > 0) {
      console.log('\n  CRITICAL:');
      for (const issue of validation.critical_issues) {
        console.log(`    [${issue.field}] ${issue.item}: ${issue.issue}`);
      }
    }

    console.log(`\n  Status: ${(validation.overall_status || 'unknown').toUpperCase()}`);
  }

  async validateAll() {
    const guides = this.loadCityGuides();
    console.log(`Validating ${guides.length} cities...\n`);

    const results = {};
    // Run sequentially to respect API rate limits
    for (const city of guides) {
      try {
        results[city.id] = await this.validateCity(city.id);
      } catch (err) {
        results[city.id] = { error: err.message };
      }
    }

    // Save aggregate report
    const summaryPath = path.join(OUTPUT_DIR, 'validation-summary.json');
    const summary = {};
    for (const [cityId, result] of Object.entries(results)) {
      summary[cityId] = {
        status: result.overall_status || 'error',
        critical: result.critical_issues?.length || 0,
        warnings: result.warnings?.length || 0,
        verified: result.verified?.length || 0,
      };
    }
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\nAggregate summary saved: ${summaryPath}`);

    return results;
  }
}

// CLI
const [,, command, arg] = process.argv;

if (!command) {
  console.log(`
Rihlah Research Agent — Content Validation

Usage:
  node scripts/research-agent.js validate <cityId>     Validate one city
  node scripts/research-agent.js validate-all           Validate all cities

Available cities:`);

  try {
    const agent = new ResearchAgent();
    const guides = agent.loadCityGuides();
    for (const g of guides) {
      console.log(`  - ${g.id} (${g.city}, ${g.country})`);
    }
  } catch (e) {
    console.log('  (could not load city guides)');
  }
  process.exit(0);
}

const agent = new ResearchAgent();

switch (command) {
  case 'validate':
    if (!arg) { console.error('Usage: validate <cityId>'); process.exit(1); }
    agent.validateCity(arg).catch(err => { console.error(err); process.exit(1); });
    break;
  case 'validate-all':
    agent.validateAll().catch(err => { console.error(err); process.exit(1); });
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
