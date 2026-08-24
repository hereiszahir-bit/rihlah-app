/**
 * Seed test travelers for development.
 *
 * Usage:
 *   node scripts/seed-test-travelers.js seed     — create test users
 *   node scripts/seed-test-travelers.js cleanup   — remove test users
 *
 * All test users have _testData: true for easy cleanup.
 * Uses Firebase CLI token for auth (no service account needed).
 */

const { execSync } = require('child_process');

const PROJECT_ID = 'rihlah-f2faf';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Get access token from Firebase CLI
function getAccessToken() {
  const token = execSync('firebase login:ci --no-localhost 2>/dev/null || true', { encoding: 'utf8' });
  // Try getting token directly
  const result = execSync(
    `node -e "const c = require('firebase-tools'); c.login.ci().then(t => console.log(t))" 2>/dev/null || true`,
    { encoding: 'utf8' }
  ).trim();
  if (result) return result;

  // Fallback: read from Firebase CLI config
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI config not found. Run: firebase login');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token found in Firebase CLI config');
  }

  // Exchange refresh token for access token
  const resp = execSync(
    `curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=AIzaSyA-placeholder" ` +
    `-H "Content-Type: application/x-www-form-urlencoded" ` +
    `-d "grant_type=refresh_token&refresh_token=${refreshToken}"`,
    { encoding: 'utf8' }
  );
  const data = JSON.parse(resp);
  return data.access_token;
}

// Generate a date string offset from today
const dateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const TEST_USERS = [
  {
    id: 'test-traveler-001',
    name: 'Amira Hassan',
    age: 27,
    gender: 'Female',
    profileVisibility: 'both',
    city: 'London, United Kingdom',
    bio: 'Architecture and coffee. Always looking for the quiet corners.',
    photoURL: 'https://randomuser.me/api/portraits/women/79.jpg',
    photos: [
      'https://randomuser.me/api/portraits/women/79.jpg',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=500&fit=crop',
    ],
    interests: ['Photography', 'History & Culture', 'Food & Culinary', 'Art'],
    identity: ['Young Professional', 'Solo Traveler'],
    upcomingTrips: [
      { destination: 'Mexico City, Mexico', startDate: dateOffset(-2), endDate: dateOffset(8) },
    ],
  },
  {
    id: 'test-traveler-002',
    name: 'Yusuf Demir',
    age: 31,
    gender: 'Male',
    profileVisibility: 'both',
    city: 'Toronto, Canada',
    bio: 'Halal food explorer. If there is a good kebab, I will find it.',
    photoURL: 'https://randomuser.me/api/portraits/men/32.jpg',
    photos: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=500&fit=crop',
    ],
    interests: ['Food & Culinary', 'Hiking', 'Photography', 'Nature'],
    identity: ['Young Professional'],
    upcomingTrips: [
      { destination: 'Istanbul, Turkey', startDate: dateOffset(14), endDate: dateOffset(24) },
    ],
  },
  {
    id: 'test-traveler-003',
    name: 'Nadia Bouazizi',
    age: 25,
    gender: 'Female',
    profileVisibility: 'both',
    city: 'Paris, France',
    bio: 'Between the medina and the museum.',
    photoURL: 'https://randomuser.me/api/portraits/women/44.jpg',
    photos: [
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=500&fit=crop',
    ],
    interests: ['Art', 'History & Culture', 'Shopping', 'Photography'],
    identity: ['Solo Traveler', 'Digital Nomad'],
    upcomingTrips: [
      { destination: 'Marrakech, Morocco', startDate: dateOffset(21), endDate: dateOffset(30) },
    ],
  },
  {
    id: 'test-traveler-004',
    name: 'Omar Abdallah',
    age: 29,
    gender: 'Male',
    profileVisibility: 'both',
    city: 'Houston, United States',
    bio: 'History nerd. Mosque architecture is my thing.',
    photoURL: 'https://randomuser.me/api/portraits/men/86.jpg',
    photos: [
      'https://randomuser.me/api/portraits/men/86.jpg',
      'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1539768942893-daf53e736495?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=500&fit=crop',
    ],
    interests: ['History & Culture', 'Mosque Tours', 'Photography', 'Hiking'],
    identity: ['Young Professional'],
    upcomingTrips: [
      { destination: 'Mexico City, Mexico', startDate: dateOffset(5), endDate: dateOffset(14) },
      { destination: 'Sarajevo, Bosnia and Herzegovina', startDate: dateOffset(45), endDate: dateOffset(52) },
    ],
  },
  {
    id: 'test-traveler-005',
    name: 'Fatima Al-Rashid',
    age: 26,
    gender: 'Female',
    profileVisibility: 'Female',
    city: 'Sydney, Australia',
    bio: 'Traveling solo but never alone.',
    photoURL: 'https://randomuser.me/api/portraits/women/85.jpg',
    photos: [
      'https://randomuser.me/api/portraits/women/85.jpg',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop',
    ],
    interests: ['Beach', 'Food & Culinary', 'Nature', 'Volunteering'],
    identity: ['Solo Traveler'],
    upcomingTrips: [
      { destination: 'Istanbul, Turkey', startDate: dateOffset(18), endDate: dateOffset(28) },
    ],
  },
  {
    id: 'test-traveler-006',
    name: 'Khalid Mensah',
    age: 33,
    gender: 'Male',
    profileVisibility: 'both',
    city: 'Washington DC, United States',
    bio: 'Former consultant. Now I consult on where to eat.',
    photoURL: 'https://randomuser.me/api/portraits/men/46.jpg',
    photos: [
      'https://randomuser.me/api/portraits/men/46.jpg',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400&h=500&fit=crop',
    ],
    interests: ['Food & Culinary', 'Business', 'Sports', 'Adventure'],
    identity: ['Young Professional', 'Digital Nomad'],
    upcomingTrips: [
      { destination: 'Mexico City, Mexico', startDate: dateOffset(-5), endDate: dateOffset(3) },
    ],
  },
  {
    id: 'test-traveler-007',
    name: 'Leila Khoury',
    age: 24,
    gender: 'Female',
    profileVisibility: 'both',
    city: 'New York, United States',
    bio: 'Design student. Every city is a typeface.',
    photoURL: 'https://randomuser.me/api/portraits/women/68.jpg',
    photos: [
      'https://randomuser.me/api/portraits/women/68.jpg',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1460306855393-0410f61241c7?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1492684223f8-e1f9163a81fa?w=400&h=500&fit=crop',
    ],
    interests: ['Art', 'Photography', 'Shopping', 'Food & Culinary'],
    identity: ['Student'],
    upcomingTrips: [
      { destination: 'Marrakech, Morocco', startDate: dateOffset(25), endDate: dateOffset(33) },
    ],
  },
  {
    id: 'test-traveler-008',
    name: 'Ibrahim Syed',
    age: 28,
    gender: 'Male',
    profileVisibility: 'both',
    city: 'Chicago, United States',
    bio: 'Software engineer by day. Traveler by every other day.',
    photoURL: 'https://randomuser.me/api/portraits/men/22.jpg',
    photos: [
      'https://randomuser.me/api/portraits/men/22.jpg',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=500&fit=crop',
    ],
    interests: ['Tech', 'Hiking', 'History & Culture', 'Fitness'],
    identity: ['Young Professional'],
    upcomingTrips: [
      { destination: 'Istanbul, Turkey', startDate: dateOffset(10), endDate: dateOffset(20) },
    ],
  },
];

// Convert JS value to Firestore REST API value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function buildDocument(user) {
  const { id, ...data } = user;
  const doc = {
    ...data,
    email: `${id}@test.rihlah.io`,
    _testData: true,
    connections: [],
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  };
  const fields = {};
  for (const [k, v] of Object.entries(doc)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function seed() {
  // Read token from Firebase CLI config
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    console.error('Firebase CLI config not found. Run: firebase login');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) {
    console.error('No refresh token in Firebase CLI config.');
    process.exit(1);
  }

  // Exchange refresh token for access token using Google OAuth
  console.log('Authenticating via Firebase CLI token...');
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    }),
  });
  const tokenData = await tokenResp.json();
  if (!tokenData.access_token) {
    console.error('Failed to get access token:', tokenData);
    process.exit(1);
  }
  const accessToken = tokenData.access_token;

  console.log(`Seeding ${TEST_USERS.length} test travelers...\n`);

  for (const user of TEST_USERS) {
    const doc = buildDocument(user);
    const url = `${BASE_URL}/users?documentId=${user.id}`;

    // Try PATCH (upsert) first
    const patchUrl = `${BASE_URL}/users/${user.id}`;
    const resp = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doc),
    });

    if (resp.ok) {
      const trips = user.upcomingTrips.map(t => `${t.destination.split(',')[0]} (${t.startDate})`).join(', ');
      console.log(`  + ${user.name} — ${trips}`);
    } else {
      const err = await resp.json();
      console.error(`  ! Failed: ${user.name}`, err.error?.message || err);
    }
  }

  console.log('\nDone. Run with "cleanup" to remove.');
}

async function cleanup() {
  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    }),
  });
  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;

  console.log('Cleaning up test travelers...\n');

  // Query for _testData == true
  const queryUrl = `${BASE_URL}:runQuery`;
  const resp = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: '_testData' },
            op: 'EQUAL',
            value: { booleanValue: true },
          },
        },
      },
    }),
  });

  const results = await resp.json();

  if (!Array.isArray(results) || results.length === 0 || !results[0].document) {
    console.log('  No test users found.');
    return;
  }

  let count = 0;
  for (const result of results) {
    if (!result.document) continue;
    const docPath = result.document.name;
    const name = result.document.fields?.name?.stringValue || docPath.split('/').pop();

    const delResp = await fetch(`https://firestore.googleapis.com/v1/${docPath}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (delResp.ok) {
      console.log(`  - ${name} (${docPath.split('/').pop()})`);
      count++;
    } else {
      console.error(`  ! Failed to delete ${name}`);
    }
  }

  console.log(`\nRemoved ${count} test users.`);
}

const command = process.argv[2];
if (command === 'seed') {
  seed().catch(e => { console.error(e); process.exit(1); });
} else if (command === 'cleanup') {
  cleanup().catch(e => { console.error(e); process.exit(1); });
} else {
  console.log('Usage:');
  console.log('  node scripts/seed-test-travelers.js seed      — create test users');
  console.log('  node scripts/seed-test-travelers.js cleanup   — remove test users');
  process.exit(1);
}
