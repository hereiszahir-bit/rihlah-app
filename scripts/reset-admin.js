const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc, collection, getDocs, query, where, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const app = initializeApp({
  apiKey: "AIzaSyDmJ6B1gyLfBIxzJzjNgZUVjwdAMHQTmlM",
  authDomain: "rihlah-f2faf.firebaseapp.com",
  projectId: "rihlah-f2faf",
});
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_UID = 'o5pb2aGXmGRJQgMhZwdXLdY9Mrd2';

(async () => {
  // Need to sign in as admin to have permissions
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.log('Usage: node scripts/reset-admin.js <email> <password>');
    process.exit(1);
  }

  console.log('Signing in...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in as', auth.currentUser.uid);

  // Delete conversations
  console.log('\nDeleting conversations...');
  const convSnap = await getDocs(query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', ADMIN_UID)
  ));
  console.log('Found', convSnap.size, 'conversations');
  for (const d of convSnap.docs) {
    await deleteDoc(doc(db, 'conversations', d.id));
    console.log('  Deleted conv:', d.id);
  }

  // Delete connection requests
  console.log('\nDeleting connection requests...');
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', ADMIN_UID))),
    getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', ADMIN_UID))),
  ]);
  const allReqs = [...incoming.docs, ...outgoing.docs];
  console.log('Found', allReqs.length, 'connection requests');
  for (const d of allReqs) {
    await deleteDoc(doc(db, 'connectionRequests', d.id));
    console.log('  Deleted req:', d.id);
  }

  // Remove from other users' connections arrays
  console.log('\nCleaning up other users connections arrays...');
  const userDoc = await getDoc(doc(db, 'users', ADMIN_UID));
  if (userDoc.exists()) {
    const conns = userDoc.data().connections || [];
    for (const conn of conns) {
      try {
        const otherDoc = await getDoc(doc(db, 'users', conn.userId));
        if (otherDoc.exists()) {
          const otherConns = otherDoc.data().connections || [];
          const filtered = otherConns.filter(c => c.userId !== ADMIN_UID);
          if (filtered.length !== otherConns.length) {
            const { updateDoc } = require('firebase/firestore');
            await updateDoc(doc(db, 'users', conn.userId), { connections: filtered });
            console.log('  Cleaned connection from', conn.userId);
          }
        }
      } catch (e) { /* skip */ }
    }
  }

  // Delete user doc
  console.log('\nDeleting user doc...');
  await deleteDoc(doc(db, 'users', ADMIN_UID));
  console.log('Done. User doc deleted.');

  console.log('\nSign out and sign back in at rihlah.io to go through fresh onboarding.');
  process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
