import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { FiX, FiMapPin, FiNavigation, FiMessageCircle, FiCamera, FiPlus, FiUserPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, fonts, radius, components, type } from '../design';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function Travelers() {
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers, connections, sentRequestUserIds, receivedRequestUserIds, refreshAll } = useUser();
  const [previewUser, setPreviewUser] = useState(null);
  const [localSentRequests, setLocalSentRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allSentRequests = useMemo(
    () => [...new Set([...sentRequestUserIds, ...receivedRequestUserIds, ...localSentRequests])],
    [sentRequestUserIds, receivedRequestUserIds, localSentRequests]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Current user's trips
  const myTrips = useMemo(() => {
    if (!currentUserData?.upcomingTrips) return [];
    return currentUserData.upcomingTrips
      .map(trip => {
        const start = parseDate(trip.startDate);
        const end = parseDate(trip.endDate);
        if (end < today) return null;
        const isThere = today >= start && today <= end;
        return { ...trip, start, end, isThere };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }, [currentUserData, today]);

  // Build unified feed
  const feed = useMemo(() => {
    if (!currentUser || !currentUserData) return [];

    const myGender = currentUserData.gender || '';
    const myVis = currentUserData.profileVisibility || 'both';
    const myConnIds = (currentUserData.connections || []).map(c => c.userId);
    const myInterests = currentUserData.interests || [];
    const myDests = (currentUserData.upcomingTrips || []).map(t => t.destination.split(',')[0].trim().toLowerCase());

    const entries = [];

    allUsers.forEach(user => {
      if (user.id === currentUser.uid) return;
      if (!user.upcomingTrips || user.upcomingTrips.length === 0) return;

      // Visibility filtering
      if (!myConnIds.includes(user.id)) {
        const theirVis = user.profileVisibility || 'both';
        if (theirVis !== 'both' && theirVis !== myGender) return;
        if (myVis !== 'both' && user.gender !== myVis) return;
      }

      const isConn = myConnIds.includes(user.id);
      const connRecord = isConn ? connections.find(c => c.userId === user.id) : null;
      const theirInterests = user.interests || [];
      const sharedInterests = myInterests.filter(i => theirInterests.includes(i));

      let bestTrip = null;
      let bestScore = -1;

      user.upcomingTrips.forEach(trip => {
        const start = parseDate(trip.startDate);
        const end = parseDate(trip.endDate);
        if (end < today) return;

        const isThere = today >= start && today <= end;
        const cityName = trip.destination.split(',')[0].trim();
        const isMyDest = myDests.includes(cityName.toLowerCase());

        let score = 0;
        if (isMyDest) score += 1000;
        if (isThere) score += 500;
        if (isConn) score += 200;
        score += sharedInterests.length * 50;
        score += Math.max(0, 365 - Math.ceil((start - today) / (1000 * 60 * 60 * 24)));

        if (score > bestScore) {
          bestScore = score;
          bestTrip = { ...trip, start, end, isThere, cityName, isMyDest };
        }
      });

      if (!bestTrip) return;

      entries.push({
        id: user.id,
        name: user.name,
        age: user.age,
        photoURL: user.photoURL,
        photos: user.photos || (user.photoURL ? [user.photoURL] : []),
        bio: user.bio,
        city: user.city,
        interests: user.interests,
        gender: user.gender,
        upcomingTrips: user.upcomingTrips,
        destination: bestTrip.destination,
        cityName: bestTrip.cityName,
        start: bestTrip.start,
        end: bestTrip.end,
        isThere: bestTrip.isThere,
        isMyDest: bestTrip.isMyDest,
        isConnected: isConn,
        sharedInterests: sharedInterests,
        sharedInterestCount: sharedInterests.length,
        whatsapp: connRecord?.whatsapp,
        instagram: connRecord?.instagram,
        score: bestScore,
      });
    });

    const seen = {};
    entries.forEach(e => {
      if (!seen[e.id] || e.score > seen[e.id].score) seen[e.id] = e;
    });

    return Object.values(seen).sort((a, b) => b.score - a.score);
  }, [currentUser, currentUserData, allUsers, connections, today]);

  // Destination filter chips
  const destinations = useMemo(() => {
    const counts = {};
    feed.forEach(p => {
      counts[p.cityName] = (counts[p.cityName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([city, count]) => ({ city, count }));
  }, [feed]);

  // Filtered feed
  const filteredFeed = useMemo(() => {
    if (activeFilter === 'all') return feed;
    if (activeFilter === 'here-now') return feed.filter(p => p.isThere);
    return feed.filter(p => p.cityName === activeFilter);
  }, [feed, activeFilter]);

  // Stats
  const hereNowCount = useMemo(() => feed.filter(p => p.isThere).length, [feed]);

  const handleSendRequest = async (toUser) => {
    try {
      if (!currentUser || !currentUserData) return;
      if ((currentUserData.connections || []).some(c => c.userId === toUser.id)) return;
      if (allSentRequests.includes(toUser.id)) return;

      setLocalSentRequests(prev => [...prev, toUser.id]);
      await addDoc(collection(db, 'connectionRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: currentUserData.name,
        fromUserAge: currentUserData.age,
        fromUserGender: currentUserData.gender,
        fromUserBio: currentUserData.bio || '',
        fromUserPhotoURL: currentUserData.photoURL || '',
        fromUserInterests: currentUserData.interests || [],
        fromUserUpcomingTrips: currentUserData.upcomingTrips || [],
        fromUserWhatsapp: currentUserData.whatsapp || '',
        fromUserInstagram: currentUserData.instagram || '',
        toUserId: toUser.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const formatDateRange = (start, end) => {
    const fmt = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', fmt)} — ${end.toLocaleDateString('en-US', fmt)}`;
  };

  const daysUntil = (start) => {
    const diff = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return null;
    if (diff === 1) return 'Tomorrow';
    if (diff <= 7) return `${diff} days`;
    if (diff <= 30) return `${Math.ceil(diff / 7)} weeks`;
    return start.toLocaleDateString('en-US', { month: 'short' });
  };

  const isRequestable = (person) => {
    return !person.isConnected && !allSentRequests.includes(person.id);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Travelers</h1>
        {feed.length > 0 && (
          <div style={styles.headerCount}>{feed.length} on the move</div>
        )}
      </div>

      {/* Destination filter strip */}
      {destinations.length > 0 && (
        <div style={styles.filterStrip}>
          <div style={styles.filterScroll}>
            <button
              style={{
                ...styles.filterChip,
                ...(activeFilter === 'all' ? styles.filterChipActive : {}),
              }}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            {hereNowCount > 0 && (
              <button
                style={{
                  ...styles.filterChip,
                  ...(activeFilter === 'here-now' ? styles.filterChipActive : {}),
                }}
                onClick={() => setActiveFilter('here-now')}
              >
                <span style={styles.filterLiveDot} />
                Here now ({hereNowCount})
              </button>
            )}
            {destinations.map(({ city, count }) => (
              <button
                key={city}
                style={{
                  ...styles.filterChip,
                  ...(activeFilter === city ? styles.filterChipActive : {}),
                }}
                onClick={() => setActiveFilter(activeFilter === city ? 'all' : city)}
              >
                {city} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Your journeys strip */}
      {myTrips.length > 0 ? (
        <div style={styles.myTripsSection}>
          {myTrips.map((trip, i) => {
            const cityName = trip.destination.split(',')[0].trim();
            const overlap = feed.filter(p => p.cityName.toLowerCase() === cityName.toLowerCase()).length;
            return (
              <div key={i} style={styles.myTripCard}>
                <div style={styles.myTripLeft}>
                  <div style={styles.myTripIcon}>
                    {trip.isThere
                      ? <FiMapPin size={14} color={colors.terracotta} />
                      : <FiNavigation size={14} color={colors.textTertiary} />}
                  </div>
                  <div>
                    <div style={styles.myTripDest}>{cityName}</div>
                    <div style={styles.myTripDates}>{formatDateRange(trip.start, trip.end)}</div>
                  </div>
                </div>
                {overlap > 0 && (
                  <div style={styles.overlapBadge}>
                    {overlap} other{overlap !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.myTripsSection}>
          <button style={styles.addTripCta} onClick={() => navigate('/add-trip')}>
            <FiPlus size={16} style={{ marginRight: '8px' }} />
            Plan your first journey
          </button>
        </div>
      )}

      {/* Feed */}
      <div style={styles.feed}>
        <AnimatePresence mode="popLayout">
          {filteredFeed.length > 0 ? (
            filteredFeed.map((person, index) => {
              const isPending = allSentRequests.includes(person.id);
              return (
                <motion.div
                  key={person.id}
                  style={person.isThere ? styles.cardLive : styles.card}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  {/* Clickable area */}
                  <div style={styles.cardClickable} onClick={() => { setPhotoIndex(0); setPreviewUser(person); }}>
                    {/* Avatar */}
                    <div style={styles.cardAvatarWrap}>
                      {person.photoURL ? (
                        <img src={person.photoURL} alt={person.name} style={styles.cardAvatar} />
                      ) : (
                        <div style={styles.cardAvatarPlaceholder}>
                          {person.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {person.isThere && <div style={styles.liveDot} />}
                    </div>

                    {/* Info */}
                    <div style={styles.cardBody}>
                      <div style={styles.cardNameRow}>
                        <span style={styles.cardName}>
                          {person.name}{person.age ? `, ${person.age}` : ''}
                        </span>
                        {person.isConnected && <span style={styles.connIndicator} />}
                      </div>

                      <div style={styles.cardDestLine}>
                        {person.isThere ? (
                          <><span style={styles.cardLiveLabel}>In </span><span style={styles.cardCityName}>{person.cityName}</span></>
                        ) : (
                          <>
                            <span style={styles.cardCityName}>{person.cityName}</span>
                            {daysUntil(person.start) && (
                              <span style={styles.cardTiming}> · {daysUntil(person.start)}</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Shared interests — the hook */}
                      {person.sharedInterests.length > 0 && (
                        <div style={styles.cardSharedLine}>
                          {person.sharedInterests.slice(0, 3).join(' · ')}
                        </div>
                      )}

                      <div style={styles.cardMeta}>
                        <span style={styles.cardDateRange}>{formatDateRange(person.start, person.end)}</span>
                        {person.city && (
                          <span style={styles.cardFrom}>from {person.city.split(',')[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick action */}
                  {!person.isConnected && (
                    <button
                      style={{
                        ...styles.quickAction,
                        ...(isPending ? styles.quickActionPending : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isPending) handleSendRequest(person);
                      }}
                    >
                      {isPending ? 'Sent' : <FiUserPlus size={16} />}
                    </button>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyTitle}>
                {activeFilter !== 'all' ? 'No one here yet' : 'Your people are out there'}
              </div>
              <div style={styles.emptyText}>
                {activeFilter !== 'all'
                  ? 'Try a different destination or check back soon.'
                  : 'Plan a journey and see who else is going. You should not have to be curious alone.'}
              </div>
              {activeFilter !== 'all' ? (
                <button style={styles.emptyCta} onClick={() => setActiveFilter('all')}>
                  Show all travelers
                </button>
              ) : myTrips.length === 0 ? (
                <button style={styles.emptyCta} onClick={() => navigate('/add-trip')}>
                  Plan a journey
                </button>
              ) : null}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (() => {
        const isConn = (currentUserData?.connections || []).some(c => c.userId === previewUser.id);
        const isPending = allSentRequests.includes(previewUser.id);
        const allTrips = (previewUser.upcomingTrips || []).map(trip => {
          const start = parseDate(trip.startDate);
          const end = parseDate(trip.endDate);
          const isThere = today >= start && today <= end;
          return { ...trip, start, end, isThere };
        }).filter(t => t.end >= today);

        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <motion.div
              style={styles.modalCard}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button style={styles.modalClose} onClick={() => setPreviewUser(null)}>
                <FiX size={18} />
              </button>

              <div style={styles.modalContent}>
                {/* Photo carousel */}
                {previewUser.photos && previewUser.photos.length > 1 ? (
                  <div style={styles.carouselWrap}>
                    <div style={styles.carouselImageWrap}>
                      <img
                        src={previewUser.photos[photoIndex]}
                        alt={`${previewUser.name} ${photoIndex + 1}`}
                        style={styles.carouselImage}
                      />
                      {/* Tap zones */}
                      <div
                        style={styles.carouselTapLeft}
                        onClick={() => setPhotoIndex(i => i > 0 ? i - 1 : previewUser.photos.length - 1)}
                      />
                      <div
                        style={styles.carouselTapRight}
                        onClick={() => setPhotoIndex(i => i < previewUser.photos.length - 1 ? i + 1 : 0)}
                      />
                    </div>
                    {/* Dots */}
                    <div style={styles.carouselDots}>
                      {previewUser.photos.map((_, i) => (
                        <div
                          key={i}
                          style={{
                            ...styles.carouselDot,
                            ...(i === photoIndex ? styles.carouselDotActive : {}),
                          }}
                          onClick={() => setPhotoIndex(i)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={styles.modalAvatarWrap}>
                    {previewUser.photoURL ? (
                      <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalAvatar} />
                    ) : (
                      <div style={styles.modalAvatarPlaceholder}>
                        {previewUser.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div style={styles.modalTextContent}>
                  <div style={styles.modalName}>
                    {previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}
                  </div>
                  {previewUser.city && (
                    <div style={styles.modalCity}>{previewUser.city}</div>
                  )}

                  {previewUser.bio && <p style={styles.modalBio}>{previewUser.bio}</p>}

                  {previewUser.interests && previewUser.interests.length > 0 && (
                    <div style={styles.modalInterests}>
                      {previewUser.interests.map((interest, i) => (
                        <span key={i} style={styles.modalInterestChip}>{interest}</span>
                      ))}
                    </div>
                  )}

                  {isConn && (previewUser.whatsapp || previewUser.instagram) && (
                    <div style={styles.modalSocials}>
                      {previewUser.whatsapp && (
                        <a
                          href={`https://wa.me/${previewUser.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.modalSocialBtn}
                        >
                          <FiMessageCircle size={14} style={{ marginRight: '4px' }} /> WhatsApp
                        </a>
                      )}
                      {previewUser.instagram && (
                        <a
                          href={`https://www.instagram.com/${previewUser.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.modalSocialBtn}
                        >
                          <FiCamera size={14} style={{ marginRight: '4px' }} /> Instagram
                        </a>
                      )}
                    </div>
                  )}

                  {allTrips.length > 0 && (
                    <div style={styles.modalTrips}>
                      <div style={styles.modalTripsLabel}>Journeys</div>
                      {allTrips.map((trip, i) => (
                        <div key={i} style={styles.modalTripItem}>
                          <span style={{ flexShrink: 0 }}>
                            {trip.isThere
                              ? <FiMapPin size={14} color={colors.terracotta} />
                              : <FiNavigation size={14} color={colors.textTertiary} />}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={styles.modalTripDest}>{trip.destination.split(',')[0]}</div>
                            <div style={styles.modalTripDates}>{formatDateRange(trip.start, trip.end)}</div>
                          </div>
                          {trip.isThere && <span style={styles.modalTripBadge}>There now</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {isConn ? (
                    <div style={styles.modalStatusBadge}>Connected</div>
                  ) : isPending ? (
                    <div style={{ ...styles.modalStatusBadge, background: colors.warningBg, color: colors.warning }}>Request Pending</div>
                  ) : (
                    <button style={styles.modalConnectBtn} onClick={() => { handleSendRequest(previewUser); setPreviewUser(null); }}>
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg, paddingBottom: '90px' },

  // Header
  header: { padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  pageTitle: { fontFamily: fonts.serif, fontSize: '28px', fontWeight: '500', color: colors.text, margin: 0, letterSpacing: '-0.3px' },
  headerCount: { fontSize: '13px', color: colors.textTertiary, fontWeight: '500' },

  // Filter strip
  filterStrip: { padding: '16px 0 0', overflow: 'hidden' },
  filterScroll: {
    display: 'flex', gap: '8px', padding: '0 24px',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
    msOverflowStyle: 'none', scrollbarWidth: 'none',
  },
  filterChip: {
    padding: '8px 16px', background: colors.surface, border: `1px solid ${colors.border}`,
    borderRadius: radius.full, fontSize: '13px', fontWeight: '500',
    color: colors.textSecondary, cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
    flexShrink: 0,
  },
  filterChipActive: {
    background: colors.warmGray, borderColor: colors.warmGray, color: colors.text,
  },
  filterLiveDot: {
    width: '6px', height: '6px', borderRadius: '50%', background: colors.olive,
  },

  // Your journeys
  myTripsSection: { padding: '16px 24px 0' },
  myTripCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', background: colors.surface,
    borderRadius: radius.md, border: `1px solid ${colors.border}`,
    marginBottom: '8px',
  },
  myTripLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  myTripIcon: { flexShrink: 0 },
  myTripDest: { fontSize: '15px', fontWeight: '600', color: colors.text },
  myTripDates: { fontSize: '12px', color: colors.textTertiary, marginTop: '1px' },
  overlapBadge: { fontSize: '11px', fontWeight: '600', color: colors.terracotta, flexShrink: 0 },
  addTripCta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '16px',
    background: 'none', border: `1px dashed ${colors.warmGray}`,
    borderRadius: radius.md,
    fontSize: '14px', fontWeight: '600', color: colors.textSecondary,
    cursor: 'pointer', fontFamily: 'inherit',
  },

  // Feed
  feed: { padding: '20px 24px 0' },

  // Traveler card — standard
  card: {
    display: 'flex', alignItems: 'center', gap: '0',
    padding: '18px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  // Traveler card — live (there now)
  cardLive: {
    display: 'flex', alignItems: 'center', gap: '0',
    padding: '18px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  cardClickable: {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    flex: 1, cursor: 'pointer', minWidth: 0,
  },
  cardAvatarWrap: { position: 'relative', flexShrink: 0 },
  cardAvatar: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' },
  cardAvatarPlaceholder: {
    width: '56px', height: '56px', borderRadius: '50%',
    background: colors.dark, color: colors.gold,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', fontWeight: '600', fontFamily: fonts.serif,
  },
  liveDot: {
    position: 'absolute', bottom: '1px', right: '1px',
    width: '14px', height: '14px', borderRadius: '50%',
    background: colors.olive, border: `3px solid ${colors.bg}`,
  },
  cardBody: { flex: 1, minWidth: 0, paddingTop: '2px' },
  cardNameRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  cardName: { fontSize: '16px', fontWeight: '600', color: colors.text },
  connIndicator: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: colors.terracotta, flexShrink: 0,
  },
  cardDestLine: {
    fontSize: '14px', color: colors.textSecondary,
    marginTop: '3px', lineHeight: 1.4,
  },
  cardLiveLabel: { color: colors.olive, fontWeight: '600' },
  cardCityName: { fontWeight: '600', color: colors.text },
  cardTiming: { color: colors.textTertiary, fontWeight: '400' },
  cardSharedLine: {
    fontSize: '12px', color: colors.terracotta, fontWeight: '500',
    marginTop: '4px',
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginTop: '5px',
  },
  cardDateRange: { fontSize: '12px', color: colors.textTertiary },
  cardFrom: { fontSize: '12px', color: colors.textMuted },

  // Quick connect button
  quickAction: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: colors.surface, border: `1px solid ${colors.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: colors.terracotta, flexShrink: 0,
    marginLeft: '12px', alignSelf: 'center',
  },
  quickActionPending: {
    background: colors.warmGray, borderColor: colors.warmGray,
    color: colors.textTertiary, fontSize: '11px', fontWeight: '600',
    cursor: 'default',
  },

  // Empty state
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 20px 60px', textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.serif, fontSize: '22px', fontWeight: '500',
    color: colors.text, marginBottom: '12px', letterSpacing: '-0.3px',
  },
  emptyText: {
    fontSize: '14px', color: colors.textSecondary,
    lineHeight: 1.7, maxWidth: '260px', marginBottom: '28px',
  },
  emptyCta: { ...components.btnPrimary, width: 'auto', padding: '14px 32px' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' },
  modalClose: { position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalContent: { textAlign: 'center' },

  // Photo carousel
  carouselWrap: { position: 'relative', marginBottom: '4px' },
  carouselImageWrap: {
    position: 'relative', width: '100%', aspectRatio: '4/5',
    borderRadius: `${radius.lg} ${radius.lg} 0 0`, overflow: 'hidden',
  },
  carouselImage: {
    width: '100%', height: '100%', objectFit: 'cover',
    transition: 'opacity 0.2s ease',
  },
  carouselTapLeft: {
    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
    cursor: 'pointer',
  },
  carouselTapRight: {
    position: 'absolute', top: 0, right: 0, width: '60%', height: '100%',
    cursor: 'pointer',
  },
  carouselDots: {
    display: 'flex', justifyContent: 'center', gap: '6px',
    padding: '12px 0 4px',
  },
  carouselDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: colors.warmGray, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  carouselDotActive: {
    background: colors.terracotta, width: '18px', borderRadius: '3px',
  },

  // Single avatar fallback
  modalAvatarWrap: { padding: '32px 0 14px' },
  modalAvatar: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.warmGray}` },
  modalAvatarPlaceholder: { width: '88px', height: '88px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', fontFamily: fonts.serif },
  modalTextContent: { padding: '16px 24px 24px' },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '2px' },
  modalCity: { fontSize: '13px', color: colors.textTertiary, marginBottom: '12px' },
  modalBio: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6, margin: '8px 0 16px', fontStyle: 'italic' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { ...components.pill },
  modalSocials: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalSocialBtn: { padding: '8px 16px', background: colors.warmGray, borderRadius: radius.sm, fontSize: '13px', fontWeight: '600', color: colors.text, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  modalTrips: { textAlign: 'left', marginBottom: '16px' },
  modalTripsLabel: { ...type.label, marginBottom: '10px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px' },
  modalTripDest: { fontSize: '14px', fontWeight: '600', color: colors.text },
  modalTripDates: { fontSize: '12px', color: colors.textTertiary, marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '600', color: colors.olive, background: colors.successBg, padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalStatusBadge: { width: '100%', padding: '14px', background: colors.warmGray, color: colors.text, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
  modalConnectBtn: { ...components.btnPrimary },
};

export default Travelers;
