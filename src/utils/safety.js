import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../firebase';

/**
 * Block a user. Adds their UID to the current user's blockedUsers array.
 * Also removes any existing connection between the two users.
 */
export async function blockUser(targetUserId) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  const myRef = doc(db, 'users', currentUser.uid);
  const myDoc = await getDoc(myRef);
  const myData = myDoc.data();

  const blockedUsers = myData.blockedUsers || [];
  if (blockedUsers.includes(targetUserId)) return;

  // Add to blocked list
  const updatedBlocked = [...blockedUsers, targetUserId];

  // Remove from connections if connected
  const connections = (myData.connections || []).filter(c => c.userId !== targetUserId);

  await updateDoc(myRef, {
    blockedUsers: updatedBlocked,
    connections,
  });

  // Remove current user from the blocked user's connections
  const theirRef = doc(db, 'users', targetUserId);
  const theirDoc = await getDoc(theirRef);
  if (theirDoc.exists()) {
    const theirData = theirDoc.data();
    const theirConnections = (theirData.connections || []).filter(c => c.userId !== currentUser.uid);
    await updateDoc(theirRef, { connections: theirConnections });
  }

  // Delete any pending connection requests between the two users
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(collection(db, 'connectionRequests'),
      where('fromUserId', '==', targetUserId),
      where('toUserId', '==', currentUser.uid))),
    getDocs(query(collection(db, 'connectionRequests'),
      where('fromUserId', '==', currentUser.uid),
      where('toUserId', '==', targetUserId))),
  ]);

  const deletes = [];
  incoming.docs.forEach(d => deletes.push(deleteDoc(d.ref)));
  outgoing.docs.forEach(d => deletes.push(deleteDoc(d.ref)));
  if (deletes.length > 0) await Promise.all(deletes);
}

/**
 * Report a user for inappropriate behavior.
 */
export async function reportUser(targetUserId, targetUserName, reason) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  await addDoc(collection(db, 'reports'), {
    reporterId: currentUser.uid,
    reportedUserId: targetUserId,
    reportedUserName: targetUserName || '',
    reason,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Delete the current user's account and all associated data.
 * - Removes user from all other users' connections arrays
 * - Deletes all conversations and messages
 * - Deletes all connection requests
 * - Deletes user doc
 * - Deletes Firebase Auth account
 */
export async function deleteOwnAccount() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  const uid = currentUser.uid;
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();

    // Remove from all connected users' connections arrays
    const myConnections = userData.connections || [];
    const connectionUpdates = myConnections.map(async (conn) => {
      const theirRef = doc(db, 'users', conn.userId);
      const theirDoc = await getDoc(theirRef);
      if (theirDoc.exists()) {
        const theirData = theirDoc.data();
        const filtered = (theirData.connections || []).filter(c => c.userId !== uid);
        await updateDoc(theirRef, { connections: filtered });
      }
    });
    await Promise.all(connectionUpdates);
  }

  // Delete all conversations where user is a participant
  const convSnapshot = await getDocs(
    query(collection(db, 'conversations'), where('participants', 'array-contains', uid))
  );
  const convDeletes = convSnapshot.docs.map(async (convDoc) => {
    // Delete all messages in the conversation
    const messagesSnapshot = await getDocs(collection(db, 'conversations', convDoc.id, 'messages'));
    const msgDeletes = messagesSnapshot.docs.map(m => deleteDoc(m.ref));
    await Promise.all(msgDeletes);
    await deleteDoc(convDoc.ref);
  });
  await Promise.all(convDeletes);

  // Delete all connection requests involving this user
  const [incoming, outgoing] = await Promise.all([
    getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', uid))),
    getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', uid))),
  ]);
  const reqDeletes = [];
  incoming.docs.forEach(d => reqDeletes.push(deleteDoc(d.ref)));
  outgoing.docs.forEach(d => reqDeletes.push(deleteDoc(d.ref)));
  if (reqDeletes.length > 0) await Promise.all(reqDeletes);

  // Delete user document
  await deleteDoc(userRef);

  // Delete Firebase Auth account
  await deleteUser(currentUser);
}
