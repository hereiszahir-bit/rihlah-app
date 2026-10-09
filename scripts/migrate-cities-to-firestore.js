/**
 * Migrate city guides and destinations from hardcoded JS to Firestore.
 *
 * This runs as a React page in the app (must be logged in as admin).
 * Navigate to /admin/migrate to trigger it.
 *
 * Creates two collections:
 *   cityGuides/{cityId}    — deep editorial content
 *   destinations/{cityId}  — lightweight destination cards + experiences
 *
 * Each document gets metadata fields:
 *   status: 'published' | 'draft' | 'needs-review'
 *   lastVerified: ISO date string
 *   verifiedBy: user who last verified
 *   createdAt: ISO date string
 *   updatedAt: ISO date string
 */

// This file documents the schema. The actual migration runs from /admin/migrate.
// See src/pages/AdminMigrate.js

module.exports = {
  cityGuideSchema: {
    id: 'string — URL slug (e.g., "mexico-city")',
    city: 'string — display name',
    country: 'string',
    heroImage: 'string — Unsplash URL',
    tagline: 'string — one-line editorial hook',
    intro: 'string — 2-3 sentence editorial intro',
    prayerNote: 'string — Muslim-specific prayer/halal context',
    neighborhoods: '[{ name, vibe, description, image }]',
    dining: '[{ name, type, area, note, halal: boolean }]',
    mosques: '[{ name, area, note }]',
    coffee: '[{ name, area, note }]',
    experiences: '[{ name, type, note }]',
    insiderTips: '[string]',
    // Metadata
    status: '"published" | "draft" | "needs-review"',
    lastVerified: 'ISO date string',
    verifiedBy: 'string — who verified',
    createdAt: 'ISO date string',
    updatedAt: 'ISO date string',
  },
};
