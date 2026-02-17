import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TabBar from '../components/TabBar';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [connections, setConnections] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [showConnections, setShowConnections] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);

  useEffect(() => {
    loadUserData();
    loadConnections();
    loadConnectionRequests();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) return;
      const connList = userDoc.data().connections || [];

      // Fetch live data for each connection
      const liveConnections = [];
      for (const conn of connList) {
        try {
          const liveDoc = await getDoc(doc(db, 'users', conn.userId));
          if (liveDoc.exists()) {
            const liveData = liveDoc.data();
            liveConnections.push({
              ...conn,
              upcomingTrips: liveData.upcomingTrips || [],
              whatsapp: liveData.whatsapp,
              instagram: liveData.instagram,
              bio: liveData.bio || conn.bio,
              interests: liveData.interests || conn.interests,
              photoURL: liveData.photoURL || conn.photoURL,
              name: liveData.name || conn.name,
              age: liveData.age || conn.age,
            });
          } else {
            liveConnections.push(conn);
          }
        } catch {
          liveConnections.push(conn);
        }
      }
      setConnections(liveConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadConnectionRequests = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const requestsSnapshot = await getDocs(collection(db, 'connectionRequests'));
      const incomingRequests = [];
      requestsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.toUserId === currentUser.uid && data.status === 'pending') {
          incomingRequests.push({
            id: docSnapshot.id,
            userId: data.fromUserId,
            name: data.fromUserName,
            age: data.fromUserAge,
            gender: data.fromUserGender,
            bio: data.fromUserBio,
            photoURL: data.fromUserPhotoURL,
            interests: data.fromUserInterests,
            requestedAt: data.createdAt
          });
        }
      });
      setConnectionRequests(incomingRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleAccept = async (request) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.data();
      const otherUserDoc = await getDoc(doc(db, 'users', request.userId));
      const otherUserData = otherUserDoc.data();

      const alreadyConnected = (currentUserData.connections || []).some(
        c => c.userId === request.userId
      );
      if (alreadyConnected) {
        await deleteDoc(doc(db, 'connectionRequests', request.id));
        alert('You are already connected!');
        loadConnectionRequests();
        return;
      }

      const connectedAt = new Date().toISOString();
      const myConnections = currentUserData.connections || [];
      myConnections.push({
        userId: request.userId,
        name: request.name,
        age: request.age,
        gender: request.gender,
        bio: request.bio,
        photoURL: request.photoURL,
        interests: request.interests,
        upcomingTrips: otherUserData.upcomingTrips || [],
        whatsapp: otherUserData.whatsapp,
        instagram: otherUserData.instagram,
        connectedAt
      });
      await updateDoc(doc(db, 'users', currentUser.uid), { connections: myConnections });

      const theirConnections = otherUserData.connections || [];
      theirConnections.push({
        userId: currentUser.uid,
        name: currentUserData.name,
        age: currentUserData.age,
        gender: currentUserData.gender,
        bio: currentUserData.bio,
        photoURL: currentUserData.photoURL,
        interests: currentUserData.interests,
        upcomingTrips: currentUserData.upcomingTrips || [],
        whatsapp: currentUserData.whatsapp,
        instagram: currentUserData.instagram,
        connectedAt
      });
      await updateDoc(doc(db, 'users', request.userId), { connections: theirConnections });

      await deleteDoc(doc(db, 'connectionRequests', request.id));
      alert('Connection accepted!');
      loadConnectionRequests();
      loadConnections();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept. Please try again.');
    }
  };

  const handleDecline = async (request) => {
    try {
      await deleteDoc(doc(db, 'connectionRequests', request.id));
      alert('Request declined');
      loadConnectionRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline. Please try again.');
    }
  };

  const handleCleanupDuplicates = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let totalRemoved = 0;
      for (const userDoc of usersSnapshot.docs) {
        const uData = userDoc.data();
        const conns = uData.connections || [];
        if (conns.length <= 1) continue;
        const seen = new Set();
        const unique = [];
        for (const c of conns) {
          if (!seen.has(c.userId)) {
            seen.add(c.userId);
            unique.push(c);
          }
        }
        const removed = conns.length - unique.length;
        if (removed > 0) {
          await updateDoc(doc(db, 'users', userDoc.id), { connections: unique });
          totalRemoved += removed;
        }
      }
      if (totalRemoved === 0) {
        alert('No duplicates found!');
      } else {
        alert(`Cleaned up ${totalRemoved} duplicate connection(s)!`);
        loadConnections();
      }
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      alert('Failed to clean duplicates');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=Hey! We connected on Rihlah`, '_blank');
  };

  const openInstagram = (handle) => {
    const cleanHandle = handle.replace('@', '');
    window.open(`https://instagram.com/${cleanHandle}`, '_blank');
  };

  // Stats
  const tripsCount = userData?.upcomingTrips?.length || 0;
  const connectionsCount = connections.length;
  const experiencesCount = (userData?.upcomingTrips || []).reduce(
    (sum, trip) => sum + (trip.experiences?.length || 0), 0
  );

  if (!userData) {
    return (
      <div style={styles.loading}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <img src="/logo.svg" alt="Rihlah" style={styles.headerLogo} />
        <div style={styles.photoSection}>
          {userData.photoURL ? (
            <img src={userData.photoURL} alt="Profile" style={styles.profilePhoto} />
          ) : (
            <div style={styles.photoPlaceholder}>
              {userData.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 style={styles.name}>{userData.name}, {userData.age}</h2>
        {userData.city && <div style={styles.city}>{userData.city}</div>}
        {userData.bio && <div style={styles.bio}>{userData.bio}</div>}
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <button style={styles.statItem} onClick={() => navigate('/saved')}>
          <div style={styles.statNumber}>{tripsCount}</div>
          <div style={styles.statLabel}>Trips</div>
        </button>
        <div style={styles.statDivider} />
        <button style={styles.statItem} onClick={() => setShowConnections(true)}>
          <div style={styles.statNumber}>{connectionsCount}</div>
          <div style={styles.statLabel}>Connections</div>
        </button>
        <div style={styles.statDivider} />
        <button style={styles.statItem} onClick={() => navigate('/saved')}>
          <div style={styles.statNumber}>{experiencesCount}</div>
          <div style={styles.statLabel}>Experiences</div>
        </button>
      </div>

      {/* Connection Requests Banner */}
      {connectionRequests.length > 0 && (
        <button style={styles.requestsBanner} onClick={() => setShowConnections(true)}>
          <span style={styles.requestsBannerIcon}>🔔</span>
          <span style={styles.requestsBannerText}>
            {connectionRequests.length} connection request{connectionRequests.length > 1 ? 's' : ''}
          </span>
          <span style={styles.requestsBannerArrow}>→</span>
        </button>
      )}

      {/* Interests */}
      {userData.interests && userData.interests.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Interests</div>
          <div style={styles.interestsList}>
            {userData.interests.map((interest, i) => (
              <div key={i} style={styles.interestTag}>{interest}</div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actionsSection}>
        <button style={styles.editProfileBtn} onClick={() => navigate('/edit-profile')}>
          Edit Profile
        </button>
      </div>

      <button style={styles.cleanupBtn} onClick={handleCleanupDuplicates}>
        Clean Up Duplicate Connections
      </button>

      <button style={styles.logoutBtn} onClick={handleLogout}>
        Logout
      </button>

      {/* Connections Modal */}
      {showConnections && (
        <div style={styles.modalOverlay} onClick={() => setShowConnections(false)}>
          <div style={styles.connectionsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Connections</h3>
              <button style={styles.modalClose} onClick={() => setShowConnections(false)}>
                ✕
              </button>
            </div>

            <div style={styles.connectionsModalBody}>
              {/* Requests */}
              {connectionRequests.length > 0 && (
                <div style={styles.modalSection}>
                  <div style={styles.modalSectionTitle}>
                    Requests ({connectionRequests.length})
                  </div>
                  {connectionRequests.map((request, index) => (
                    <div key={index} style={styles.requestCard}>
                      <div style={styles.requestBackdrop}>
                        {request.photoURL ? (
                          <img src={request.photoURL} alt={request.name} style={styles.requestBackdropImg} />
                        ) : (
                          <div style={styles.requestBackdropPlaceholder}>
                            {request.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={styles.requestGradient} />
                      </div>
                      <div style={styles.requestOverlay}>
                        <div style={styles.requestName}>{request.name}, {request.age}</div>
                        {request.bio && <div style={styles.requestBio}>"{request.bio}"</div>}
                        <div style={styles.requestActions}>
                          <button style={styles.acceptBtn} onClick={() => handleAccept(request)}>
                            Accept
                          </button>
                          <button style={styles.declineBtn} onClick={() => handleDecline(request)}>
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Connections */}
              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>
                  All Connections ({connections.length})
                </div>
                {connections.length === 0 ? (
                  <div style={styles.emptyState}>
                    No connections yet. Explore destinations to connect with travelers!
                  </div>
                ) : (
                  connections.map((conn, index) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const trips = (conn.upcomingTrips || []).map(trip => {
                      const start = parseDate(trip.startDate);
                      const end = parseDate(trip.endDate);
                      const isHereNow = today >= start && today <= end;
                      const isUpcoming = today < start;
                      return { ...trip, start, end, isHereNow, isUpcoming };
                    }).filter(t => t.isHereNow || t.isUpcoming)
                      .sort((a, b) => a.isHereNow === b.isHereNow ? a.start - b.start : a.isHereNow ? -1 : 1);

                    return (
                    <div key={index} style={styles.connectionCard} onClick={() => setPreviewUser(conn)}>
                      <div style={styles.connBackdrop}>
                        {conn.photoURL ? (
                          <img src={conn.photoURL} alt={conn.name} style={styles.connBackdropImg} />
                        ) : (
                          <div style={styles.connBackdropPlaceholder}>
                            {conn.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={styles.connGradient} />
                      </div>
                      <div style={styles.connOverlay}>
                        <div style={styles.connName}>{conn.name}, {conn.age}</div>
                        {conn.bio && <div style={styles.connBio}>"{conn.bio}"</div>}

                        {conn.interests && conn.interests.length > 0 && (
                          <div style={styles.connInterests}>
                            {conn.interests.map((interest, i) => (
                              <span key={i} style={styles.connInterestTag}>{interest}</span>
                            ))}
                          </div>
                        )}

                        {trips.length > 0 && (
                          <div style={styles.connTrips}>
                            {trips.map((trip, i) => {
                              const fmt = { month: 'short', day: 'numeric' };
                              const dateRange = `${trip.start.toLocaleDateString('en-US', fmt)} – ${trip.end.toLocaleDateString('en-US', fmt)}`;
                              return (
                                <div key={i} style={{
                                  ...styles.connTrip,
                                  color: trip.isHereNow ? '#6ee7b7' : 'rgba(255,255,255,0.7)'
                                }}>
                                  {trip.isHereNow ? '📍' : '✈️'} {trip.destination} • {dateRange}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={styles.contactButtons}>
                          {conn.whatsapp && (
                            <button style={styles.whatsappBtn} onClick={(e) => { e.stopPropagation(); openWhatsApp(conn.whatsapp); }}>
                              WhatsApp
                            </button>
                          )}
                          {conn.instagram && (
                            <button style={styles.instagramBtn} onClick={(e) => { e.stopPropagation(); openInstagram(conn.instagram); }}>
                              Instagram
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Preview Modal */}
      {previewUser && (
        <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
          <div style={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setPreviewUser(null)}>✕</button>
            <div style={styles.previewHeader}>
              {previewUser.photoURL ? (
                <img src={previewUser.photoURL} alt={previewUser.name} style={styles.previewPhoto} />
              ) : (
                <div style={styles.previewPhotoPlaceholder}>
                  {previewUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={styles.previewName}>{previewUser.name}, {previewUser.age}</div>
            </div>

            {previewUser.bio && <p style={styles.previewBio}>{previewUser.bio}</p>}

            {previewUser.interests && previewUser.interests.length > 0 && (
              <div style={styles.previewInterests}>
                {previewUser.interests.map((interest, i) => (
                  <span key={i} style={styles.previewInterestTag}>{interest}</span>
                ))}
              </div>
            )}

            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const trips = (previewUser.upcomingTrips || []).map(trip => {
                const start = parseDate(trip.startDate);
                const end = parseDate(trip.endDate);
                const isHereNow = today >= start && today <= end;
                const isUpcoming = today < start;
                return { ...trip, start, end, isHereNow, isUpcoming };
              }).filter(t => t.isHereNow || t.isUpcoming)
                .sort((a, b) => a.isHereNow === b.isHereNow ? a.start - b.start : a.isHereNow ? -1 : 1);

              return trips.length > 0 ? (
                <div style={styles.previewTrips}>
                  <div style={styles.previewTripsTitle}>Trips</div>
                  {trips.map((trip, i) => {
                    const fmt = { month: 'short', day: 'numeric' };
                    const dateRange = `${trip.start.toLocaleDateString('en-US', fmt)} – ${trip.end.toLocaleDateString('en-US', fmt)}`;
                    return (
                      <div key={i} style={styles.previewTrip}>
                        <span>{trip.isHereNow ? '📍' : '✈️'} {trip.destination}</span>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>{dateRange}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null;
            })()}

            <div style={styles.previewActions}>
              {previewUser.whatsapp && (
                <button style={styles.whatsappBtn} onClick={() => openWhatsApp(previewUser.whatsapp)}>
                  WhatsApp
                </button>
              )}
              {previewUser.instagram && (
                <button style={styles.instagramBtn} onClick={() => openInstagram(previewUser.instagram)}>
                  Instagram
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f9fafb', paddingBottom: '80px' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#6b7280' },

  // Header
  header: { background: 'linear-gradient(135deg, #059669, #10b981)', padding: '40px 20px 24px', color: '#fff', textAlign: 'center', position: 'relative' },
  headerLogo: { position: 'absolute', top: '16px', left: '16px', width: '28px', height: '28px', borderRadius: '6px', opacity: 0.9 },
  photoSection: { marginBottom: '16px' },
  profilePhoto: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff' },
  photoPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', background: '#fff', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '700', border: '4px solid #fff' },
  name: { fontSize: '22px', fontWeight: '800', margin: '0 0 2px 0' },
  city: { fontSize: '14px', opacity: 0.9, marginBottom: '8px' },
  bio: { fontSize: '14px', opacity: 0.95, fontStyle: 'italic', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' },

  // Stats Row
  statsRow: { display: 'flex', alignItems: 'center', background: '#fff', padding: '16px 0', borderBottom: '1px solid #f0f0f0' },
  statItem: { flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '8px', textAlign: 'center' },
  statNumber: { fontSize: '22px', fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: '13px', color: '#6b7280', fontWeight: '500' },
  statDivider: { width: '1px', height: '36px', background: '#e5e7eb' },

  // Requests Banner
  requestsBanner: { display: 'flex', alignItems: 'center', width: '100%', padding: '14px 20px', background: '#fef3c7', border: 'none', borderBottom: '1px solid #fde68a', cursor: 'pointer', gap: '10px' },
  requestsBannerIcon: { fontSize: '20px' },
  requestsBannerText: { flex: 1, fontSize: '15px', fontWeight: '600', color: '#92400e', textAlign: 'left' },
  requestsBannerArrow: { fontSize: '18px', color: '#92400e' },

  // Interests
  section: { padding: '20px', background: '#fff', marginTop: '8px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '12px' },
  interestsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  interestTag: { padding: '8px 16px', background: '#f0fdf4', color: '#059669', borderRadius: '20px', fontSize: '14px', fontWeight: '600' },

  // Action Buttons
  actionsSection: { padding: '20px 20px 0' },
  editProfileBtn: { width: '100%', padding: '14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  cleanupBtn: { width: 'calc(100% - 40px)', margin: '12px 20px 0', padding: '14px', background: '#f3f4f6', color: '#6b7280', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  logoutBtn: { width: 'calc(100% - 40px)', margin: '12px 20px 0', padding: '14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },

  // Modals shared
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', fontWeight: '800', color: '#1f2937', margin: 0 },
  modalClose: { background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer' },

  // Connections Modal
  connectionsModal: { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  connectionsModalBody: { overflowY: 'auto', flex: 1 },
  modalSection: { marginBottom: '24px' },
  modalSectionTitle: { fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },

  // Request Cards — backdrop style (in modal)
  requestCard: { position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', height: '220px' },
  requestBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  requestBackdropImg: { width: '100%', height: '100%', objectFit: 'cover' },
  requestBackdropPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  requestGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' },
  requestOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', zIndex: 2 },
  requestName: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '2px' },
  requestGender: { fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px' },
  requestBio: { fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: '10px' },
  requestActions: { display: 'flex', gap: '8px' },
  acceptBtn: { flex: 1, padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  declineBtn: { flex: 1, padding: '10px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(4px)' },

  // Connection Cards — backdrop style (in modal)
  connectionCard: { position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', minHeight: '280px' },
  connBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  connBackdropImg: { width: '100%', height: '100%', objectFit: 'cover' },
  connBackdropPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  connGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)' },
  connOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', zIndex: 2, maxHeight: '75%', overflowY: 'auto' },
  connName: { fontSize: '17px', fontWeight: '700', color: '#fff', marginBottom: '2px' },
  connGender: { fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '6px' },
  connBio: { fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: '8px' },
  connInterests: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  connInterestTag: { padding: '4px 10px', background: 'rgba(255,255,255,0.15)', color: '#6ee7b7', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backdropFilter: 'blur(4px)' },
  connTrips: { marginBottom: '10px' },
  connTrip: { fontSize: '13px', color: '#6ee7b7', fontWeight: '600', marginBottom: '4px' },
  contactButtons: { display: 'flex', gap: '8px' },
  whatsappBtn: { flex: 1, padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  instagramBtn: { flex: 1, padding: '10px', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  emptyState: { padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },

  // Preview Modal
  previewModal: { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' },
  previewHeader: { textAlign: 'center', marginBottom: '16px' },
  previewPhoto: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px' },
  previewPhotoPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '700', marginBottom: '12px' },
  previewName: { fontSize: '20px', fontWeight: '800', color: '#1f2937' },
  previewBio: { fontSize: '14px', color: '#4b5563', lineHeight: 1.6, margin: '0 0 16px 0', textAlign: 'center' },
  previewInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  previewInterestTag: { padding: '6px 14px', background: '#f0fdf4', color: '#059669', borderRadius: '16px', fontSize: '13px', fontWeight: '600' },
  previewTrips: { marginBottom: '16px' },
  previewTripsTitle: { fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  previewTrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: '10px', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#1f2937' },
  previewActions: { display: 'flex', gap: '8px', marginTop: '8px' },
};

export default Profile;
