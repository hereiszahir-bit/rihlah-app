import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, deleteDoc, runTransaction } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FiX, FiMapPin, FiNavigation, FiMessageCircle, FiCamera } from 'react-icons/fi';
import { colors, fonts, radius, components, type } from '../design';


const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function Profile() {
  const navigate = useNavigate();
  const { currentUserData: userData, connections, connectionRequests, refreshAll, refreshConnections } = useUser();
  const [showConnections, setShowConnections] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);

  const handleAccept = async (request) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const myRef = doc(db, 'users', currentUser.uid);
      const theirRef = doc(db, 'users', request.userId);
      const requestRef = doc(db, 'connectionRequests', request.id);

      await runTransaction(db, async (transaction) => {
        const currentUserDoc = await transaction.get(myRef);
        const otherUserDoc = await transaction.get(theirRef);

        const currentUserData = currentUserDoc.data();
        const otherUserData = otherUserDoc.data();

        const alreadyConnected = (currentUserData.connections || []).some(
          c => c.userId === request.userId
        );
        if (alreadyConnected) {
          transaction.delete(requestRef);
          return;
        }

        const connectedAt = new Date().toISOString();
        const myConnections = [...(currentUserData.connections || [])];
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

        const theirConnections = [...(otherUserData.connections || [])];
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

        transaction.update(myRef, { connections: myConnections });
        transaction.update(theirRef, { connections: theirConnections });
        transaction.delete(requestRef);
      });

      refreshAll();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleDecline = async (request) => {
    try {
      await deleteDoc(doc(db, 'connectionRequests', request.id));
      refreshConnections();
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  const handleRemoveConnection = async (conn) => {
    const confirmed = window.confirm(`Remove ${conn.name} from your connections?`);
    if (!confirmed) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const myRef = doc(db, 'users', currentUser.uid);
      const theirRef = doc(db, 'users', conn.userId);

      await runTransaction(db, async (transaction) => {
        const currentUserDoc = await transaction.get(myRef);
        const otherUserDoc = await transaction.get(theirRef);

        const myData = currentUserDoc.data();
        const theirData = otherUserDoc.data();

        const myConnections = (myData.connections || []).filter(
          c => c.userId !== conn.userId
        );
        const theirConnections = (theirData.connections || []).filter(
          c => c.userId !== currentUser.uid
        );

        transaction.update(myRef, { connections: myConnections });
        transaction.update(theirRef, { connections: theirConnections });
      });

      setPreviewUser(null);
      refreshAll();
    } catch (error) {
      console.error('Error removing connection:', error);
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
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const openInstagram = (handle) => {
    const cleanHandle = handle.replace('@', '');
    window.open(`https://www.instagram.com/${cleanHandle}`, '_blank');
  };

  // Stats
  const tripsCount = userData?.upcomingTrips?.length || 0;
  const pastTripsCount = userData?.pastTrips?.length || 0;
  const connectionsCount = connections.length;
  const countriesCount = new Set([
    ...(userData?.upcomingTrips || []).map(t => t.destination?.split(',').pop()?.trim()),
    ...(userData?.pastTrips || []).map(t => t.destination?.split(',').pop()?.trim()),
  ].filter(Boolean)).size;

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
        <div style={styles.photoSection}>
          {userData.photoURL ? (
            <img src={userData.photoURL} alt="Profile" style={styles.profilePhoto} />
          ) : (
            <div style={styles.photoPlaceholder}>
              {userData.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 style={styles.name}>{userData.name}{userData.age ? `, ${userData.age}` : ''}</h2>
        {userData.city && <div style={styles.city}>{userData.city}</div>}
        {userData.bio && <div style={styles.bio}>{userData.bio}</div>}
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <div style={styles.statNumber}>{countriesCount}</div>
          <div style={styles.statLabel}>Countries</div>
        </div>
        <div style={styles.statDivider} />
        <button style={styles.statItem} onClick={() => navigate('/trips')}>
          <div style={styles.statNumber}>{tripsCount + pastTripsCount}</div>
          <div style={styles.statLabel}>Journeys</div>
        </button>
        <div style={styles.statDivider} />
        <button style={styles.statItem} onClick={() => setShowConnections(true)}>
          <div style={styles.statNumber}>{connectionsCount}</div>
          <div style={styles.statLabel}>Companions</div>
        </button>
      </div>

      {/* Connection Requests */}
      {connectionRequests.length > 0 && (
        <button style={styles.requestsBanner} onClick={() => setShowConnections(true)}>
          <span style={styles.requestsBannerText}>
            {connectionRequests.length} connection request{connectionRequests.length > 1 ? 's' : ''}
          </span>
          <span style={styles.requestsBannerArrow}>View</span>
        </button>
      )}

      {/* Identity */}
      {userData.identity && userData.identity.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Identity</div>
          <div style={styles.tagsList}>
            {userData.identity.map((item, i) => (
              <div key={i} style={styles.tag}>{item}</div>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {userData.interests && userData.interests.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Interests</div>
          <div style={styles.tagsList}>
            {userData.interests.map((interest, i) => (
              <div key={i} style={styles.tag}>{interest}</div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actionsSection}>
        <button style={styles.editProfileBtn} onClick={() => navigate('/edit-profile')}>
          Edit Profile
        </button>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {/* Connections Modal */}
      {showConnections && (
        <div style={styles.modalOverlay} onClick={() => setShowConnections(false)}>
          <div style={styles.connectionsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Companions</h3>
              <button style={styles.modalClose} onClick={() => setShowConnections(false)}>
                <FiX size={20} />
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
                      <div style={styles.requestInfo}>
                        {request.photoURL ? (
                          <img src={request.photoURL} alt={request.name} style={styles.requestAvatar} />
                        ) : (
                          <div style={styles.requestAvatarPlaceholder}>
                            {request.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={styles.requestDetails}>
                          <div style={styles.requestName}>{request.name}{request.age ? `, ${request.age}` : ''}</div>
                          {request.bio && <div style={styles.requestBio}>{request.bio}</div>}
                        </div>
                      </div>
                      <div style={styles.requestActions}>
                        <button style={styles.acceptBtn} onClick={() => handleAccept(request)}>Accept</button>
                        <button style={styles.declineBtn} onClick={() => handleDecline(request)}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Connections */}
              <div style={styles.modalSection}>
                <div style={styles.modalSectionTitle}>
                  All ({connections.length})
                </div>
                {connections.length === 0 ? (
                  <div style={styles.emptyState}>
                    No companions yet. Explore destinations and connect with travelers.
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
                      <div style={styles.connInfo}>
                        {conn.photoURL ? (
                          <img src={conn.photoURL} alt={conn.name} style={styles.connAvatar} />
                        ) : (
                          <div style={styles.connAvatarPlaceholder}>
                            {conn.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={styles.connDetails}>
                          <div style={styles.connName}>{conn.name}{conn.age ? `, ${conn.age}` : ''}</div>
                          {trips.length > 0 && (
                            <div style={styles.connTrip}>
                              {trips[0].isHereNow ? 'In ' : 'Going to '}{trips[0].destination.split(',')[0]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={styles.connActions}>
                        {conn.whatsapp && (
                          <button style={styles.connSocialBtn} onClick={(e) => { e.stopPropagation(); openWhatsApp(conn.whatsapp); }}>
                            <FiMessageCircle size={16} />
                          </button>
                        )}
                        {conn.instagram && (
                          <button style={styles.connSocialBtn} onClick={(e) => { e.stopPropagation(); openInstagram(conn.instagram); }}>
                            <FiCamera size={16} />
                          </button>
                        )}
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
            <button style={styles.modalClose} onClick={() => setPreviewUser(null)}><FiX size={20} /></button>
            <div style={styles.previewHeader}>
              {previewUser.photoURL ? (
                <img src={previewUser.photoURL} alt={previewUser.name} style={styles.previewPhoto} />
              ) : (
                <div style={styles.previewPhotoPlaceholder}>
                  {previewUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={styles.previewName}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</div>
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
                  <div style={styles.previewTripsTitle}>Journeys</div>
                  {trips.map((trip, i) => {
                    const fmt = { month: 'short', day: 'numeric' };
                    const dateRange = `${trip.start.toLocaleDateString('en-US', fmt)} — ${trip.end.toLocaleDateString('en-US', fmt)}`;
                    return (
                      <div key={i} style={styles.previewTrip}>
                        <span>{trip.isHereNow ? <FiMapPin size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> : <FiNavigation size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />}{trip.destination}</span>
                        <span style={{ color: colors.textTertiary, fontSize: '13px' }}>{dateRange}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null;
            })()}

            <div style={styles.previewSocials}>
              {previewUser.whatsapp && (
                <button style={styles.socialBtn} onClick={(e) => { e.preventDefault(); openWhatsApp(previewUser.whatsapp); }}>
                  <FiMessageCircle size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> WhatsApp
                </button>
              )}
              {previewUser.instagram && (
                <button style={styles.socialBtn} onClick={(e) => { e.preventDefault(); openInstagram(previewUser.instagram); }}>
                  <FiCamera size={14} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Instagram
                </button>
              )}
            </div>

            <button
              style={styles.removeConnectionBtn}
              onClick={() => handleRemoveConnection(previewUser)}
            >
              Remove Connection
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: colors.bg, paddingBottom: '90px' },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: colors.textTertiary },

  // Header
  header: { padding: '24px 24px 28px', textAlign: 'center' },
  photoSection: { marginBottom: '14px' },
  profilePhoto: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.warmGray}` },
  photoPlaceholder: { width: '88px', height: '88px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', fontFamily: fonts.serif },
  name: { fontFamily: fonts.serif, fontSize: '22px', fontWeight: '500', margin: '0 0 2px 0', color: colors.text },
  city: { fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' },
  bio: { fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' },

  // Stats Row
  statsRow: { display: 'flex', alignItems: 'center', background: colors.surface, padding: '18px 0', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` },
  statItem: { flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', textAlign: 'center' },
  statNumber: { fontFamily: fonts.serif, fontSize: '24px', fontWeight: '600', color: colors.text },
  statLabel: { fontSize: '12px', color: colors.textTertiary, marginTop: '2px', fontWeight: '500' },
  statDivider: { width: '1px', height: '32px', background: colors.border },

  // Requests Banner
  requestsBanner: { display: 'flex', alignItems: 'center', width: '100%', padding: '14px 24px', background: colors.surface, border: 'none', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', gap: '10px' },
  requestsBannerText: { flex: 1, fontSize: '14px', fontWeight: '600', color: colors.text, textAlign: 'left' },
  requestsBannerArrow: { fontSize: '13px', color: colors.textTertiary, fontWeight: '500' },

  // Sections
  section: { padding: '20px 24px', background: colors.surface, marginTop: '8px' },
  sectionTitle: { ...type.label, marginBottom: '12px' },
  tagsList: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { ...components.pill },

  // Action Buttons
  actionsSection: { padding: '24px' },
  editProfileBtn: { ...components.btnPrimary, marginBottom: '10px' },
  logoutBtn: { ...components.btnOutline, color: colors.textTertiary, borderColor: colors.warmGray },

  // Modals shared
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, margin: 0 },
  modalClose: { background: 'none', border: 'none', color: colors.textTertiary, cursor: 'pointer', padding: '4px' },

  // Connections Modal
  connectionsModal: { background: colors.surface, borderRadius: `${radius.lg} ${radius.lg} 0 0`, padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  connectionsModalBody: { overflowY: 'auto', flex: 1 },
  modalSection: { marginBottom: '24px' },
  modalSectionTitle: { ...type.label, marginBottom: '12px' },

  // Request Cards (simplified)
  requestCard: { background: colors.bg, borderRadius: radius.md, padding: '16px', marginBottom: '10px' },
  requestInfo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  requestAvatar: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' },
  requestAvatarPlaceholder: { width: '48px', height: '48px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', fontFamily: fonts.serif },
  requestDetails: { flex: 1 },
  requestName: { fontSize: '15px', fontWeight: '600', color: colors.text },
  requestBio: { fontSize: '13px', color: colors.textSecondary, marginTop: '2px', fontStyle: 'italic' },
  requestActions: { display: 'flex', gap: '8px' },
  acceptBtn: { flex: 1, padding: '10px', background: colors.dark, color: colors.cream, border: 'none', borderRadius: radius.sm, fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  declineBtn: { flex: 1, padding: '10px', background: 'transparent', color: colors.textTertiary, border: `1px solid ${colors.warmGray}`, borderRadius: radius.sm, fontSize: '14px', fontWeight: '500', cursor: 'pointer' },

  // Connection Cards (simplified list)
  connectionCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${colors.lightGray}`, cursor: 'pointer' },
  connInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  connAvatar: { width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  connAvatarPlaceholder: { width: '44px', height: '44px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', fontFamily: fonts.serif, flexShrink: 0 },
  connDetails: { flex: 1, minWidth: 0 },
  connName: { fontSize: '15px', fontWeight: '600', color: colors.text },
  connTrip: { fontSize: '13px', color: colors.textTertiary, marginTop: '2px' },
  connActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  connSocialBtn: { width: '36px', height: '36px', borderRadius: '50%', background: colors.lightGray, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: colors.text },
  emptyState: { padding: '32px 16px', textAlign: 'center', color: colors.textTertiary, fontSize: '14px', lineHeight: 1.5 },

  // Preview Modal
  previewModal: { background: colors.surface, borderRadius: `${radius.lg} ${radius.lg} 0 0`, padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' },
  previewHeader: { textAlign: 'center', marginBottom: '16px' },
  previewPhoto: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: `3px solid ${colors.warmGray}` },
  previewPhotoPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '600', fontFamily: fonts.serif, marginBottom: '12px' },
  previewName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text },
  previewBio: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6, margin: '0 0 16px 0', textAlign: 'center' },
  previewInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  previewInterestTag: { ...components.pill },
  previewTrips: { marginBottom: '16px' },
  previewTripsTitle: { ...type.label, marginBottom: '10px' },
  previewTrip: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: colors.text },
  previewSocials: { display: 'flex', gap: '8px', marginTop: '8px' },
  socialBtn: { flex: 1, padding: '12px', background: colors.lightGray, color: colors.text, border: 'none', borderRadius: radius.sm, fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  removeConnectionBtn: { background: 'none', border: 'none', color: colors.textMuted, fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '16px 0 0', margin: '0 auto', display: 'block' },
};

export default Profile;
