const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function tripsOverlap(a, b) {
  const aStart = parseDate(a.startDate);
  const aEnd = parseDate(a.endDate);
  const bStart = parseDate(b.startDate);
  const bEnd = parseDate(b.endDate);

  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

async function cleanupOverlappingTrips() {
  console.log('Scanning for overlapping trips...\n');

  const usersSnapshot = await db.collection('users').get();
  let totalRemoved = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const trips = userData.upcomingTrips || [];

    if (trips.length < 2) continue;

    const sorted = [...trips].sort((a, b) =>
      parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
    );

    const kept = [sorted[0]];
    const removed = [];

    for (let i = 1; i < sorted.length; i++) {
      const lastKept = kept[kept.length - 1];
      if (tripsOverlap(lastKept, sorted[i])) {
        removed.push(sorted[i]);
      } else {
        kept.push(sorted[i]);
      }
    }

    if (removed.length > 0) {
      const email = userData.email || userDoc.id;
      console.log(`${email}`);
      console.log(`  Keeping ${kept.length} trip(s):`);
      kept.forEach(t => console.log(`    ${t.destination} (${t.startDate} -> ${t.endDate})`));
      console.log(`  Removing ${removed.length} overlapping trip(s):`);
      removed.forEach(t => console.log(`    ${t.destination} (${t.startDate} -> ${t.endDate})`));
      console.log('');

      await userDoc.ref.update({ upcomingTrips: kept });
      totalRemoved += removed.length;
    }
  }

  if (totalRemoved === 0) {
    console.log('No overlapping trips found. Database is clean!');
  } else {
    console.log(`Done! Removed ${totalRemoved} overlapping trip(s).`);
  }

  process.exit(0);
}

cleanupOverlappingTrips();
