import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Build a map of userId -> userData for quick lookups
  const allUsersMap = useMemo(() => {
    const map = {};
    allUsers.forEach(u => { map[u.id] = u; });
    return map;
  }, [allUsers]);

  // Derive enriched connections from currentUserData + allUsersMap (eliminates N+1)
  // Note: whatsapp/instagram come from the connection record (stored at accept time),
  // not from allUsersMap, since allUsers no longer includes PII fields.
  const connections = useMemo(() => {
    if (!currentUserData || !currentUserData.connections) return [];
    return currentUserData.connections.map(conn => {
      const liveUser = allUsersMap[conn.userId];
      if (liveUser) {
        return {
          ...conn,
          upcomingTrips: liveUser.upcomingTrips || [],
          bio: liveUser.bio || conn.bio,
          interests: liveUser.interests || conn.interests,
          photoURL: liveUser.photoURL || conn.photoURL,
          name: liveUser.name || conn.name,
          age: liveUser.age || conn.age,
          // Preserve contact info from connection record (not stripped from allUsers)
          whatsapp: conn.whatsapp,
          instagram: conn.instagram,
        };
      }
      return conn;
    });
  }, [currentUserData, allUsersMap]);

  // Derive connection request objects with pending status
  const connectionRequests = useMemo(() => {
    return incomingRequests
      .filter(r => r.status === 'pending')
      .map(r => ({
        id: r.id,
        userId: r.fromUserId,
        name: r.fromUserName,
        age: r.fromUserAge,
        gender: r.fromUserGender,
        bio: r.fromUserBio,
        photoURL: r.fromUserPhotoURL,
        interests: r.fromUserInterests,
        requestedAt: r.createdAt,
      }));
  }, [incomingRequests]);

  // Derive sent request user IDs
  const sentRequestUserIds = useMemo(() => {
    return outgoingRequests
      .filter(r => r.status === 'pending')
      .map(r => r.toUserId);
  }, [outgoingRequests]);

  // Derive received request user IDs (for bidirectional duplicate checks)
  const receivedRequestUserIds = useMemo(() => {
    return incomingRequests
      .filter(r => r.status === 'pending')
      .map(r => r.fromUserId);
  }, [incomingRequests]);

  const fetchCurrentUser = useCallback(async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  }, []);

  // Fetch all users with only public-safe fields (exclude PII like whatsapp, instagram, email)
  const fetchAllUsers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      users.push({
        id: docSnap.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        bio: data.bio,
        photoURL: data.photoURL,
        interests: data.interests,
        identity: data.identity,
        city: data.city,
        profileVisibility: data.profileVisibility,
        upcomingTrips: data.upcomingTrips,
        onboardingComplete: data.onboardingComplete,
      });
    });
    return users;
  }, []);

  const fetchIncomingRequests = useCallback(async (uid) => {
    const snapshot = await getDocs(
      query(collection(db, 'connectionRequests'), where('toUserId', '==', uid))
    );
    const requests = [];
    snapshot.forEach(docSnap => {
      requests.push({ id: docSnap.id, ...docSnap.data() });
    });
    return requests;
  }, []);

  const fetchOutgoingRequests = useCallback(async (uid) => {
    const snapshot = await getDocs(
      query(collection(db, 'connectionRequests'), where('fromUserId', '==', uid))
    );
    const requests = [];
    snapshot.forEach(docSnap => {
      requests.push({ id: docSnap.id, ...docSnap.data() });
    });
    return requests;
  }, []);

  const loadAll = useCallback(async (uid) => {
    const [userData, users, incoming, outgoing] = await Promise.all([
      fetchCurrentUser(uid),
      fetchAllUsers(),
      fetchIncomingRequests(uid),
      fetchOutgoingRequests(uid),
    ]);
    setCurrentUserData(userData);
    setAllUsers(users);
    setIncomingRequests(incoming);
    setOutgoingRequests(outgoing);

    if (userData) {
      setNeedsOnboarding(!userData.onboardingComplete);
    } else {
      setNeedsOnboarding(true);
    }
  }, [fetchCurrentUser, fetchAllUsers, fetchIncomingRequests, fetchOutgoingRequests]);

  // Cleanup: archive past trips from upcomingTrips and delete stale connection requests
  const runCleanup = useCallback(async (uid, userData) => {
    try {
      if (!userData) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Archive past trips
      const upcomingTrips = userData.upcomingTrips || [];
      const stillUpcoming = [];
      const newlyPast = [];

      upcomingTrips.forEach(trip => {
        const endDate = new Date(trip.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (endDate >= today) {
          stillUpcoming.push(trip);
        } else {
          newlyPast.push(trip);
        }
      });

      if (newlyPast.length > 0) {
        const existingPast = userData.pastTrips || [];
        await updateDoc(doc(db, 'users', uid), {
          upcomingTrips: stillUpcoming,
          pastTrips: [...existingPast, ...newlyPast],
        });
      }

      // Delete stale connection requests (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [incoming, outgoing] = await Promise.all([
        getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', uid))),
        getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', uid))),
      ]);

      const staleDeletes = [];
      [...incoming.docs, ...outgoing.docs].forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'pending' && data.createdAt) {
          const createdAt = new Date(data.createdAt);
          if (createdAt < thirtyDaysAgo) {
            staleDeletes.push(deleteDoc(doc(db, 'connectionRequests', docSnap.id)));
          }
        }
      });

      if (staleDeletes.length > 0) {
        await Promise.all(staleDeletes);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, []);

  // Selective refresh functions for after mutations
  const refreshCurrentUser = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userData = await fetchCurrentUser(uid);
    setCurrentUserData(userData);
  }, [fetchCurrentUser]);

  const refreshConnections = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const [incoming, outgoing] = await Promise.all([
      fetchIncomingRequests(uid),
      fetchOutgoingRequests(uid),
    ]);
    setIncomingRequests(incoming);
    setOutgoingRequests(outgoing);
  }, [fetchIncomingRequests, fetchOutgoingRequests]);

  const refreshAll = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await loadAll(uid);
  }, [loadAll]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await loadAll(user.uid);
          // Run cleanup in background (don't block UI)
          const userData = await fetchCurrentUser(user.uid);
          runCleanup(user.uid, userData).then(() => {
            // Refresh after cleanup if trips were archived
            loadAll(user.uid);
          });
        } catch (error) {
          console.error('Error loading user data:', error);
          setNeedsOnboarding(true);
        }
      } else {
        setCurrentUserData(null);
        setAllUsers([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadAll]);

  const value = useMemo(() => ({
    currentUser,
    currentUserData,
    allUsers,
    allUsersMap,
    connections,
    connectionRequests,
    sentRequestUserIds,
    receivedRequestUserIds,
    incomingRequests,
    outgoingRequests,
    loading,
    needsOnboarding,
    refreshCurrentUser,
    refreshConnections,
    refreshAll,
  }), [
    currentUser, currentUserData, allUsers, allUsersMap,
    connections, connectionRequests, sentRequestUserIds,
    incomingRequests, outgoingRequests, loading, needsOnboarding,
    refreshCurrentUser, refreshConnections, refreshAll,
  ]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
