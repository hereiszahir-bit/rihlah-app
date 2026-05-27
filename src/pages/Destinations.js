import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FiX, FiMapPin, FiNavigation, FiMessageCircle, FiCamera, FiPlus } from 'react-icons/fi';

import CURATED_DESTINATIONS from '../data/destinations';

const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function Destinations() {
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers, allUsersMap, connections, refreshAll } = useUser();
  const [previewUser, setPreviewUser] = useState(null);

  useEffect(() => {
    refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { travelerCounts, connectionsGoing } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const myGender = currentUserData?.gender || '';
    const rawMyVis = currentUserData?.profileVisibility || 'both';
    const myVisibility = ['Male', 'Female', 'both'].includes(rawMyVis) ? rawMyVis : 'both';
    const myConnections = (currentUserData?.connections || []).map(c => c.userId);

    // Build traveler counts per curated destination
    const counts = {};
    CURATED_DESTINATIONS.forEach(d => {
      counts[d.id] = { thereNow: 0, planning: 0 };
    });

    allUsers.forEach((user) => {
      if (user.id === currentUser?.uid) return;

      if (!myConnections.includes(user.id)) {
        const rawTheirVis = user.profileVisibility || 'both';
        const theirVisibility = ['Male', 'Female', 'both'].includes(rawTheirVis) ? rawTheirVis : 'both';
        if (theirVisibility !== 'both' && theirVisibility !== myGender) return;
        if (myVisibility !== 'both' && user.gender !== myVisibility) return;
      }

      if (!user.upcomingTrips || user.upcomingTrips.length === 0) return;

      const userDestStatus = {};
      user.upcomingTrips.forEach((trip) => {
        const startDate = parseDate(trip.startDate);
        const endDate = parseDate(trip.endDate);
        const isTripNow = today >= startDate && today <= endDate;

        // Match trip destination to curated destination
        const tripCityNorm = normalize(trip.destination.split(',')[0].trim());
        const matched = CURATED_DESTINATIONS.find(d => normalize(d.city) === tripCityNorm);
        if (!matched) return;

        if (isTripNow) {
          userDestStatus[matched.id] = 'hereNow';
        } else if (today < startDate && userDestStatus[matched.id] !== 'hereNow') {
          userDestStatus[matched.id] = 'planning';
        }
      });

      Object.entries(userDestStatus).forEach(([destId, status]) => {
        if (!counts[destId]) return;
        if (status === 'hereNow') {
          counts[destId].thereNow++;
        } else {
          counts[destId].planning++;
        }
      });
    });

    // Build connections list
    let connTrips = [];
    if (currentUserData && currentUserData.connections) {
      const connMap = {};
      currentUserData.connections.forEach(conn => {
        const connUser = allUsersMap[conn.userId];
        if (!connUser || !connUser.upcomingTrips) return;

        connUser.upcomingTrips.forEach(trip => {
          const startDate = parseDate(trip.startDate);
          const endDate = parseDate(trip.endDate);
          if (endDate < today) return;

          const isThere = today >= startDate && today <= endDate;
          const entry = {
            userId: conn.userId,
            name: connUser.name,
            photoURL: connUser.photoURL || '',
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            isThere,
          };

          const existing = connMap[conn.userId];
          if (!existing) {
            connMap[conn.userId] = entry;
          } else if (isThere && !existing.isThere) {
            connMap[conn.userId] = entry;
          } else if (!existing.isThere && !isThere && parseDate(trip.startDate) < parseDate(existing.startDate)) {
            connMap[conn.userId] = entry;
          }
        });
      });

      connTrips = Object.values(connMap);
      connTrips.sort((a, b) => {
        if (a.isThere && !b.isThere) return -1;
        if (!a.isThere && b.isThere) return 1;
        return parseDate(a.startDate) - parseDate(b.startDate);
      });
    }

    return { travelerCounts: counts, connectionsGoing: connTrips };
  }, [currentUser, currentUserData, allUsers, allUsersMap]);

  return (
    <div style={styles.page}>
      {/* Connections Section */}
      {connectionsGoing.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Connections</h2>
          </div>
          <div style={styles.horizontalScroll}>
            {connectionsGoing.map((conn, index) => (
              <div key={`${conn.userId}-${index}`} style={styles.storyItem}>
                <div
                  style={{
                    ...styles.storyRing,
                    ...(conn.isThere ? styles.storyRingActive : styles.storyRingUpcoming),
                  }}
                  onClick={() => {
                    const baseUser = allUsersMap[conn.userId];
                    const connRecord = connections.find(c => c.userId === conn.userId);
                    setPreviewUser(baseUser ? { ...baseUser, whatsapp: connRecord?.whatsapp, instagram: connRecord?.instagram } : null);
                  }}
                >
                  {conn.photoURL ? (
                    <img src={conn.photoURL} alt={conn.name} style={styles.storyImg} />
                  ) : (
                    <div style={styles.storyPlaceholder}>
                      {conn.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <Link
                  to={`/destination/${encodeURIComponent(conn.destination)}`}
                  style={styles.storyDest}
                >
                  {conn.isThere ? <FiMapPin size={11} style={{ marginRight: '2px', verticalAlign: '-1px' }} /> : <FiNavigation size={11} style={{ marginRight: '2px', verticalAlign: '-1px' }} />} {conn.destination.split(',')[0]}
                </Link>
                <div style={styles.storyName}>{conn.name?.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Destinations Grid */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Destinations</h2>
        </div>
        <div style={styles.destGrid}>
          {CURATED_DESTINATIONS.map((dest) => {
            const counts = travelerCounts[dest.id] || { thereNow: 0, planning: 0 };
            return (
              <Link
                key={dest.id}
                to={`/destination/${encodeURIComponent(dest.name)}`}
                style={styles.destCard}
              >
                <div
                  style={{
                    ...styles.destImage,
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.55)), url(${dest.image})`,
                  }}
                >
                  <div style={styles.destTags}>
                    {dest.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={styles.destTag}>{tag}</span>
                    ))}
                  </div>
                  <div style={styles.destOverlay}>
                    <h3 style={styles.destName}>{dest.city}</h3>
                    <p style={styles.destCountry}>{dest.country}</p>
                    {counts.thereNow === 0 && counts.planning === 0 ? (
                      <div style={styles.destBadge}>Be the first</div>
                    ) : (
                      <div style={styles.destMetrics}>
                        {counts.thereNow > 0 && (
                          <div style={styles.destMetric}>
                            <FiMapPin size={12} /> {counts.thereNow} here now
                          </div>
                        )}
                        {counts.planning > 0 && (
                          <div style={styles.destMetric}>
                            <FiNavigation size={12} /> {counts.planning} planning
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (
        <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setPreviewUser(null)}><FiX size={18} /></button>
            <div style={styles.modalPhotoWrap}>
              {previewUser.photoURL ? (
                <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalPhoto} />
              ) : (
                <div style={styles.modalPhotoPlaceholder}>
                  {previewUser.name?.charAt(0)}
                </div>
              )}
            </div>
            <h2 style={styles.modalName}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</h2>

            {previewUser.bio && (
              <p style={styles.modalBio}>{previewUser.bio}</p>
            )}

            {previewUser.interests && previewUser.interests.length > 0 && (
              <div style={styles.modalInterests}>
                {previewUser.interests.map(interest => (
                  <span key={interest} style={styles.modalInterestChip}>{interest}</span>
                ))}
              </div>
            )}

            {(previewUser.whatsapp || previewUser.instagram) && (
              <div style={styles.modalSocials}>
                {previewUser.whatsapp && (
                  <a href={`https://wa.me/${previewUser.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                    <FiMessageCircle size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> WhatsApp
                  </a>
                )}
                {previewUser.instagram && (
                  <a href={`https://www.instagram.com/${previewUser.instagram}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                    <FiCamera size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> @{previewUser.instagram}
                  </a>
                )}
              </div>
            )}

            {previewUser.upcomingTrips && previewUser.upcomingTrips.length > 0 && (
              <div style={styles.modalTripsSection}>
                <div style={styles.modalTripsTitle}>Trips</div>
                {previewUser.upcomingTrips.map((trip, i) => {
                  const start = new Date(trip.startDate.replace(/-/g, '/'));
                  const end = new Date(trip.endDate.replace(/-/g, '/'));
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const isThere = now >= start && now <= end;
                  const isUpcoming = now < start;
                  return (
                    <div key={i} style={styles.modalTripItem}>
                      <span style={styles.modalTripIcon}>{isThere ? <FiMapPin size={14} color="#047857" /> : isUpcoming ? <FiNavigation size={14} color="#6b7280" /> : null}</span>
                      <div style={styles.modalTripInfo}>
                        <div style={styles.modalTripDest}>{trip.destination.split(',')[0]}</div>
                        <div style={styles.modalTripDates}>
                          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      {isThere && <span style={styles.modalTripBadge}>There now</span>}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.modalConnectedBadge}>Connected</div>
          </div>
        </div>
      )}

      <button
        style={styles.fab}
        onClick={() => navigate('/add-trip')}
      >
        <FiPlus size={28} color="#fff" />
      </button>


    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#faf9f7',
    paddingBottom: '70px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerLogo: {
    width: 'min(80px, 20vw)',
    height: 'auto',
    borderRadius: '8px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: '0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b6b6b',
    margin: '4px 0 0 0',
  },

  // Sections
  section: {
    marginTop: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: 0,
  },

  // Horizontal scroll
  horizontalScroll: {
    display: 'flex',
    overflowX: 'auto',
    gap: '14px',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
  },

  // Destination grid (2-column)
  destGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    padding: '0 20px',
  },
  destCard: {
    borderRadius: '16px',
    overflow: 'hidden',
    textDecoration: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)',
  },
  destImage: {
    width: '100%',
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
  },
  destTags: {
    display: 'flex',
    gap: '4px',
    padding: '10px 10px 0 10px',
  },
  destTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#fff',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(4px)',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  destOverlay: {
    padding: '12px',
  },
  destName: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 1px 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  destCountry: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.85)',
    margin: '0 0 6px 0',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  destBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6ee7b7',
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(4px)',
    padding: '4px 10px',
    borderRadius: '12px',
    display: 'inline-block',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  destMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  destMetric: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  // Stories-style connection items
  storyItem: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '76px', gap: '6px' },
  storyRing: { width: '64px', height: '64px', borderRadius: '50%', padding: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  storyRingActive: { background: 'linear-gradient(135deg, #047857, #059669)' },
  storyRingUpcoming: { background: 'linear-gradient(135deg, #d1d5db, #9ca3af)' },
  storyImg: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' },
  storyPlaceholder: { width: '56px', height: '56px', borderRadius: '50%', background: '#f3f4f6', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: '#6b7280' },
  storyDest: { fontSize: '11px', fontWeight: '700', color: '#047857', textDecoration: 'none', textAlign: 'center', lineHeight: 1.2, maxWidth: '76px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  storyName: { fontSize: '11px', color: '#6b7280', fontWeight: '600', textAlign: 'center', maxWidth: '76px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  // Profile Preview Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: '#fff', borderRadius: '20px', padding: '32px 24px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', textAlign: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)' },
  modalClose: { position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: '20px', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalPhotoWrap: { marginBottom: '16px' },
  modalPhoto: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0fdf4' },
  modalPhotoPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', margin: '0 auto' },
  modalName: { fontSize: '22px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px 0' },
  modalBio: { fontSize: '15px', color: '#374151', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 16px 0', padding: '0 8px' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { padding: '6px 14px', background: '#f5f3f0', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#374151' },
  modalSocials: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: '#f5f3f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { textAlign: 'left', marginBottom: '16px' },
  modalTripsTitle: { fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'left' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#faf9f7', borderRadius: '10px', marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0 },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontSize: '14px', fontWeight: '700', color: '#1f2937' },
  modalTripDates: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '700', color: '#047857', background: '#f0f9f4', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalConnectedBadge: { width: '100%', padding: '14px', background: '#f0f9f4', color: '#047857', border: '2px solid #bbf7d0', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },

  // FAB
  fab: {
    position: 'fixed',
    bottom: '100px',
    right: '20px',
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    background: '#047857',
    border: 'none',
    boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    zIndex: 999,
  },
};

export default Destinations;
