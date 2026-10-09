import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { calculateAge } from '../utils/age';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  // Current user's blocked list
  const blockedUsers = useMemo(() => {
    return currentUserData?.blockedUsers || [];
  }, [currentUserData]);

  // Filter blocked users out of allUsers
  const visibleUsers = useMemo(() => {
    if (blockedUsers.length === 0) return allUsers;
    const blockedSet = new Set(blockedUsers);
    return allUsers.filter(u => !blockedSet.has(u.id));
  }, [allUsers, blockedUsers]);

  // Build a map of userId -> userData for quick lookups
  const allUsersMap = useMemo(() => {
    const map = {};
    visibleUsers.forEach(u => { map[u.id] = u; });
    return map;
  }, [visibleUsers]);

  // Derive enriched connections from currentUserData + allUsersMap (eliminates N+1)
  // Note: whatsapp/instagram come from the connection record (stored at accept time),
  // not from allUsersMap, since allUsers no longer includes PII fields.
  const connections = useMemo(() => {
    if (!currentUserData || !currentUserData.connections) return [];
    return currentUserData.connections
      .filter(conn => allUsersMap[conn.userId]) // skip deleted users
      .map(conn => {
        const liveUser = allUsersMap[conn.userId];
        return {
          ...conn,
          upcomingTrips: liveUser.upcomingTrips || [],
          bio: liveUser.bio || conn.bio,
          interests: liveUser.interests || conn.interests,
          photoURL: liveUser.photoURL || conn.photoURL,
          name: liveUser.name || conn.name,
          age: liveUser.age || conn.age,
          whatsapp: conn.whatsapp,
          instagram: conn.instagram,
        };
      });
  }, [currentUserData, allUsersMap]);

  // Derive connection request objects with pending status (filter out blocked users)
  const connectionRequests = useMemo(() => {
    const blockedSet = new Set(blockedUsers);
    return incomingRequests
      .filter(r => r.status === 'pending' && !blockedSet.has(r.fromUserId))
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
  }, [incomingRequests, blockedUsers]);

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
  // Only include approved, onboarded users in the public list
  const fetchAllUsers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      // Skip non-onboarded or non-approved users from public list
      if (!data.onboardingComplete) return;
      const status = data.status || 'approved';
      if (status !== 'approved') return;

      users.push({
        id: docSnap.id,
        name: data.name,
        age: data.dateOfBirth ? calculateAge(data.dateOfBirth) : data.age,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bio: data.bio,
        photoURL: data.photoURL,
        photos: data.photos,
        interests: data.interests,
        identity: data.identity,
        city: data.city,
        profileVisibility: data.profileVisibility,
        upcomingTrips: data.upcomingTrips,
        onboardingComplete: data.onboardingComplete,
        travelStyle: data.travelStyle,
        foundingMember: data.foundingMember,
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
      setApplicationStatus(userData.status || 'approved');
    } else {
      setNeedsOnboarding(true);
      setApplicationStatus(null);
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
          // Run cleanup in background AFTER UI is ready — don't re-fetch unless cleanup changed something
          runCleanup(user.uid, currentUserData);
        } catch (error) {
          console.error('Error loading user data:', error);
          setNeedsOnboarding(true);
          setApplicationStatus(null);
        }
      } else {
        setCurrentUserData(null);
        setAllUsers([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setNeedsOnboarding(false);
        setApplicationStatus(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadAll]);

  const value = useMemo(() => ({
    currentUser,
    currentUserData,
    allUsers: visibleUsers,
    allUsersMap,
    blockedUsers,
    connections,
    connectionRequests,
    sentRequestUserIds,
    receivedRequestUserIds,
    incomingRequests,
    outgoingRequests,
    loading,
    needsOnboarding,
    applicationStatus,
    refreshCurrentUser,
    refreshConnections,
    refreshAll,
  }), [
    currentUser, currentUserData, visibleUsers, allUsersMap, blockedUsers,
    connections, connectionRequests, sentRequestUserIds, receivedRequestUserIds,
    incomingRequests, outgoingRequests, loading, needsOnboarding,
    applicationStatus, refreshCurrentUser, refreshConnections, refreshAll,
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
