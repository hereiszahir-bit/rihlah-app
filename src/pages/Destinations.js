import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FiX, FiMapPin, FiNavigation, FiMessageCircle, FiCamera } from 'react-icons/fi';
import { colors, fonts, type, components, radius } from '../design';

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
  const [showAll, setShowAll] = useState(false);

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

    return { travelerCounts: counts };
  }, [currentUser, currentUserData, allUsers, allUsersMap]);

  return (
    <div style={styles.page}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Explore</h1>
      </div>

      {/* Destinations */}
      <div style={styles.section}>
        <div style={styles.destList}>
          {(() => {
            const sortByActivity = (a, b) => {
              const aCount = (travelerCounts[a.id]?.thereNow || 0) + (travelerCounts[a.id]?.planning || 0);
              const bCount = (travelerCounts[b.id]?.thereNow || 0) + (travelerCounts[b.id]?.planning || 0);
              return bCount - aCount;
            };
            const featured = CURATED_DESTINATIONS.filter(d => d.featured).sort(sortByActivity);
            const rest = CURATED_DESTINATIONS.filter(d => !d.featured).sort(sortByActivity);
            const renderCard = (dest) => {
              const counts = travelerCounts[dest.id] || { thereNow: 0, planning: 0 };
              const totalTravelers = counts.thereNow + counts.planning;
              return (
                <Link
                  key={dest.id}
                  to={`/destination/${encodeURIComponent(dest.name)}`}
                  style={styles.edCard}
                >
                  <div
                    style={{
                      ...styles.edImage,
                      backgroundImage: `linear-gradient(transparent 40%, rgba(0,0,0,0.5)), url(${dest.image})`,
                    }}
                  >
                    {counts.thereNow > 0 && (
                      <div style={styles.edTag}>{counts.thereNow} here now</div>
                    )}
                  </div>
                  <div style={styles.edBody}>
                    <div style={styles.edTitle}>{dest.city}</div>
                    <div style={styles.edDesc}>{dest.description.length > 100 ? dest.description.slice(0, 100) + '...' : dest.description}</div>
                    <div style={styles.edFooter}>
                      <div style={styles.edTravelers}>
                        {totalTravelers > 0
                          ? `${totalTravelers} traveler${totalTravelers !== 1 ? 's' : ''}`
                          : 'Be the first'}
                      </div>
                      <div style={styles.edArrow}>→</div>
                    </div>
                  </div>
                </Link>
              );
            };
            return (
              <>
                {featured.map(renderCard)}
                {!showAll && rest.length > 0 && (
                  <button
                    style={styles.seeAllBtn}
                    onClick={(e) => { e.preventDefault(); setShowAll(true); }}
                  >
                    See all destinations
                  </button>
                )}
                {showAll && rest.map(renderCard)}
              </>
            );
          })()}
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
                <div style={styles.modalTripsTitle}>Journeys</div>
                {previewUser.upcomingTrips.map((trip, i) => {
                  const start = new Date(trip.startDate.replace(/-/g, '/'));
                  const end = new Date(trip.endDate.replace(/-/g, '/'));
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const isThere = now >= start && now <= end;
                  const isUpcoming = now < start;
                  return (
                    <div key={i} style={styles.modalTripItem}>
                      <span style={styles.modalTripIcon}>{isThere ? <FiMapPin size={14} color={colors.text} /> : isUpcoming ? <FiNavigation size={14} color={colors.textTertiary} /> : null}</span>
                      <div style={styles.modalTripInfo}>
                        <div style={styles.modalTripDest}>{trip.destination.split(',')[0]}</div>
                        <div style={styles.modalTripDates}>
                          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '90px',
  },

  // Page header
  pageHeader: { padding: '20px 24px 0' },
  pageTitle: { fontFamily: fonts.serif, fontSize: '28px', fontWeight: '500', color: colors.text, margin: 0, letterSpacing: '-0.3px' },

  // Sections
  section: { marginTop: '20px' },

  // Editorial destination cards
  destList: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px' },
  edCard: { borderRadius: radius.lg, overflow: 'hidden', background: colors.surface, border: `1px solid ${colors.border}`, textDecoration: 'none' },
  edImage: { height: '200px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  edTag: { position: 'absolute', bottom: '12px', left: '12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '6px' },
  edBody: { padding: '16px' },
  edTitle: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '4px' },
  edDesc: { fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5, marginBottom: '12px' },
  edFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  edTravelers: { fontSize: '12px', color: colors.textTertiary, fontWeight: '500' },
  edArrow: { width: '32px', height: '32px', borderRadius: '50%', background: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' },
  seeAllBtn: { width: '100%', padding: '16px', background: 'none', border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '14px', fontWeight: '600', color: colors.textSecondary, cursor: 'pointer', fontFamily: 'inherit', marginTop: '4px' },

  // Profile Preview Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: colors.surface, borderRadius: radius.lg, padding: '32px 24px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', textAlign: 'center' },
  modalClose: { position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: colors.lightGray, border: 'none', fontSize: '20px', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalPhotoWrap: { marginBottom: '16px' },
  modalPhoto: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.warmGray}` },
  modalPhotoPlaceholder: { width: '88px', height: '88px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', margin: '0 auto', fontFamily: fonts.serif },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, margin: '0 0 4px 0' },
  modalBio: { fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 16px 0', padding: '0 8px' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { ...components.pill },
  modalSocials: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: colors.lightGray, borderRadius: radius.sm, fontSize: '13px', fontWeight: '600', color: colors.text, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { textAlign: 'left', marginBottom: '16px' },
  modalTripsTitle: { ...type.label, marginBottom: '10px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0 },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontSize: '14px', fontWeight: '600', color: colors.text },
  modalTripDates: { fontSize: '12px', color: colors.textTertiary, marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '600', color: colors.success, background: colors.successBg, padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalConnectedBadge: { width: '100%', padding: '14px', background: colors.lightGray, color: colors.text, border: 'none', borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },

};

export default Destinations;
