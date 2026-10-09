const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'rihlah-f2faf' });
const db = admin.firestore();

const ADMIN_UID = 'o5pb2aGXmGRJQgMhZwdXLdY9Mrd2';

(async () => {
  // Check admin user doc
  const userDoc = await db.collection('users').doc(ADMIN_UID).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log('=== ADMIN USER DOC ===');
    console.log('Fields:', Object.keys(data).sort().join(', '));
    console.log('status:', data.status);
    console.log('onboardingComplete:', data.onboardingComplete);
    console.log('connections count:', (data.connections || []).length);
    console.log('photos:', JSON.stringify(data.photos));
    console.log('whatsapp:', data.whatsapp);
    console.log('occupation:', data.occupation);
    console.log('email:', data.email || '(none)');
    console.log('foundingMember:', data.foundingMember);

    // Show connection details
    if (data.connections && data.connections.length > 0) {
      console.log('\nConnections:');
      data.connections.forEach(c => {
        console.log('  userId:', c.userId, '- name:', c.name);
      });
    }
  } else {
    console.log('Admin user doc NOT FOUND');
  }

  // Check conversations
  const convSnap = await db.collection('conversations')
    .where('participants', 'array-contains', ADMIN_UID).get();

  // Get all existing user IDs
  const usersSnap = await db.collection('users').get();
  const existingIds = new Set();
  usersSnap.forEach(d => existingIds.add(d.id));

  console.log('\n=== CONVERSATIONS ===');
  console.log('Total:', convSnap.size);
  const staleConvs = [];
  convSnap.forEach(d => {
    const data = d.data();
    const otherUser = data.participants.find(p => p !== ADMIN_UID);
    const exists = existingIds.has(otherUser);
    console.log('  conv', d.id.substring(0, 16), '- other:', (otherUser || '?').substring(0, 20), exists ? '(exists)' : '(DELETED USER)');
    if (!exists) staleConvs.push(d.id);
  });
  if (staleConvs.length > 0) {
    console.log('\nStale conversations (other user deleted):', staleConvs.length);
  }

  console.log('\n=== ALL USERS ===');
  console.log('Total:', existingIds.size);
  usersSnap.forEach(d => {
    const data = d.data();
    console.log(' ', d.id.substring(0, 24).padEnd(26), (data.name || '?').padEnd(18), 'status:', (data.status || '(none)').padEnd(10), 'onboarding:', data.onboardingComplete);
  });

  // Check connection requests
  const reqSnap = await db.collection('connectionRequests').get();
  console.log('\n=== CONNECTION REQUESTS ===');
  console.log('Total:', reqSnap.size);
  reqSnap.forEach(d => {
    const data = d.data();
    const fromExists = existingIds.has(data.fromUserId);
    const toExists = existingIds.has(data.toUserId);
    const stale = !fromExists || !toExists;
    if (stale) {
      console.log('  STALE:', d.id.substring(0, 16), 'from:', data.fromUserId?.substring(0, 15), fromExists ? '' : '(DELETED)', 'to:', data.toUserId?.substring(0, 15), toExists ? '' : '(DELETED)');
    }
  });

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
