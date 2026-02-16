const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function resetFirebase() {
  console.log('🔄 Starting Firebase reset...');

  // Delete all users
  try {
    const listUsersResult = await auth.listUsers();
    for (const user of listUsersResult.users) {
      await auth.deleteUser(user.uid);
      console.log(`✅ Deleted user: ${user.email}`);
    }
  } catch (error) {
    console.error('Error deleting users:', error);
  }

  // Delete all documents in users collection
  const usersSnapshot = await db.collection('users').get();
  for (const doc of usersSnapshot.docs) {
    await doc.ref.delete();
    console.log(`✅ Deleted user document: ${doc.id}`);
  }

  // Delete all connection requests
  const requestsSnapshot = await db.collection('connectionRequests').get();
  for (const doc of requestsSnapshot.docs) {
    await doc.ref.delete();
    console.log(`✅ Deleted connection request: ${doc.id}`);
  }

  console.log('🎉 Firebase reset complete!');
  process.exit(0);
}

resetFirebase();