import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiX, FiMapPin, FiNavigation } from 'react-icons/fi';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { colors, fonts, radius, components, type } from '../design';
import { fetchAllCityGuides } from '../data/firestoreCities';
import { useUser } from '../context/UserContext';


const FILTERS = ['All', 'Traveling', 'Near you'];

function Discover() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { currentUser, currentUserData, allUsers, sentRequestUserIds, receivedRequestUserIds, refreshAll } = useUser();
  const [hero, setHero] = useState(null);
  const [teasers, setTeasers] = useState([]);
  const [previewUser, setPreviewUser] = useState(null);
  const [localSentRequests, setLocalSentRequests] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');

  const allSentRequests = useMemo(
    () => [...new Set([...sentRequestUserIds, ...receivedRequestUserIds, ...localSentRequests])],
    [sentRequestUserIds, receivedRequestUserIds, localSentRequests]
  );

  // Unified member list — everyone ranked by relevance with contextual signals
  const members = useMemo(() => {
    if (!allUsers) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const myCity = (currentUserData?.city || '').toLowerCase().trim();

    // Precompute my trip ranges for overlap detection
    const myTrips = (currentUserData?.upcomingTrips || [])
      .filter(t => {
        const [y, m, d] = (t.endDate || '').split('-').map(Number);
        return new Date(y, m - 1, d) >= today;
      })
      .map(t => ({
        ...t,
        start: new Date(t.startDate),
        end: new Date(t.endDate),
        dest: (t.destination || '').split(',')[0].toLowerCase().trim(),
      }));

    return allUsers
      .filter(u => {
        if (u.id === currentUser?.uid) return false;
        if (!u.onboardingComplete || !u.photoURL) return false;
        return true;
      })
      .map(u => {
        const futureTrips = (u.upcomingTrips || []).filter(t => {
          const [y, m, d] = (t.endDate || '').split('-').map(Number);
          return new Date(y, m - 1, d) >= today;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        const nextTrip = futureTrips[0] || null;
        const isLocal = myCity && (u.city || '').toLowerCase().trim() === myCity;
        const isTraveling = futureTrips.length > 0;

        // Check for trip overlap
        let overlap = null;
        if (myTrips.length > 0) {
          for (const myTrip of myTrips) {
            for (const theirTrip of futureTrips) {
              const theirDest = (theirTrip.destination || '').split(',')[0].toLowerCase().trim();
              if (theirDest !== myTrip.dest) continue;
              const theirStart = new Date(theirTrip.startDate);
              const theirEnd = new Date(theirTrip.endDate);
              if (myTrip.start <= theirEnd && myTrip.end >= theirStart) {
                const overlapStart = myTrip.start > theirStart ? myTrip.start : theirStart;
                const overlapEnd = myTrip.end < theirEnd ? myTrip.end : theirEnd;
                const days = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                overlap = { days, destination: theirTrip.destination?.split(',')[0], trip: theirTrip };
                break;
              }
            }
            if (overlap) break;
          }
        }

        // Rank: overlap=0, local+traveling=1, local=2, traveling=3, everyone=4
        let rank = 4;
        if (overlap) rank = 0;
        else if (isLocal && isTraveling) rank = 1;
        else if (isLocal) rank = 2;
        else if (isTraveling) rank = 3;

        // Contextual signal — the single line that tells you why this person matters
        let signal = null;
        if (overlap) {
          signal = { type: 'overlap', label: `${overlap.days}d overlap in ${overlap.destination}` };
        } else if (isLocal && nextTrip) {
          signal = { type: 'local-traveling', label: `${nextTrip.destination?.split(',')[0]}` };
        } else if (isLocal) {
          signal = { type: 'local', label: `In ${u.city}` };
        } else if (nextTrip) {
          signal = { type: 'traveling', label: `${nextTrip.destination?.split(',')[0]}` };
        }

        return { ...u, nextTrip, isLocal, isTraveling, overlap, rank, signal };
      })
      .sort((a, b) => a.rank - b.rank);
  }, [allUsers, currentUser, currentUserData]);

  // "For you" — top picks based on shared interests, overlap, locality
  const forYou = useMemo(() => {
    if (!members.length) return [];
    const myInterests = new Set((currentUserData?.interests || []).map(i => i.toLowerCase()));

    const scored = members.map(m => {
      let score = 0;
      // Shared interests — strongest signal
      const shared = (m.interests || []).filter(i => myInterests.has(i.toLowerCase()));
      score += shared.length * 3;
      // Trip overlap
      if (m.overlap) score += 5;
      // Local
      if (m.isLocal) score += 2;
      // Traveling
      if (m.isTraveling) score += 1;
      return { ...m, matchScore: score, sharedInterests: shared };
    });

    return scored
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }, [members, currentUserData]);

  // Apply filter tab to full member list
  const filteredMembers = useMemo(() => {
    if (activeFilter === 'Traveling') return members.filter(m => m.isTraveling);
    if (activeFilter === 'Near you') return members.filter(m => m.isLocal);
    return members;
  }, [members, activeFilter]);

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
        toUserId: toUser.id,
        toUserName: toUser.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error sending request:', err);
      setLocalSentRequests(prev => prev.filter(id => id !== toUser.id));
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDateRange = (start, end) => {
    const fmt = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', fmt)} — ${end.toLocaleDateString('en-US', fmt)}`;
  };

  // Check for pending invite (new user who signed up via invite link)
  useEffect(() => {
    const pendingInvite = localStorage.getItem('rihlah_pending_invite');
    if (pendingInvite) {
      localStorage.removeItem('rihlah_pending_invite');
      navigate(`/join/${pendingInvite}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllCityGuides().then(guides => {
      const withGuides = guides.filter(g => g.hasGuide);
      setHero(withGuides[0] || null);
      setTeasers(withGuides.slice(1));
    });
  }, []);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}><span style={{ color: colors.terracotta }}>r</span>ihlah</div>
        <div style={styles.brandSub}>Travel with your people.</div>
      </div>

      <div style={styles.feed} ref={scrollRef}>
        {/* === FOR YOU — curated picks === */}
        {forYou.length > 0 && (
          <div style={styles.forYouSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}>For you</div>
              <div style={styles.sectionSub}>Based on shared interests and travel plans</div>
            </div>
            <div style={styles.forYouScroll}>
              {forYou.map((member, index) => (
                <motion.div
                  key={member.id}
                  style={styles.forYouCard}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.06, duration: 0.35 }}
                  onClick={() => { setPhotoIndex(0); setPreviewUser(member); }}
                >
                  <div
                    style={{
                      ...styles.forYouPhoto,
                      backgroundImage: `linear-gradient(transparent 40%, rgba(10,10,10,0.9)), url(${member.photoURL})`,
                    }}
                  >
                    {member.overlap && (
                      <div style={styles.forYouBadge}>{member.overlap.days}d overlap</div>
                    )}
                    <div style={styles.forYouContent}>
                      <div style={styles.forYouName}>{member.name}{member.age ? `, ${member.age}` : ''}</div>
                      {member.city && <div style={styles.forYouCity}>{member.city}</div>}
                      {member.sharedInterests?.length > 0 && (
                        <div style={styles.forYouMatch}>
                          {member.sharedInterests.slice(0, 2).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* === DESTINATION INTEL — always accessible === */}
        {hero && (
          <div
            style={styles.guideBanner}
            onClick={() => navigate(`/city/${hero.id}`)}
          >
            <div
              style={{
                ...styles.guideBannerBg,
                backgroundImage: `linear-gradient(90deg, rgba(10,10,10,0.92) 55%, transparent), url(${hero.heroImage})`,
              }}
            >
              <div style={styles.guideBannerContent}>
                <div style={styles.guideBannerLabel}>Destination Intel</div>
                <div style={styles.guideBannerCity}>{hero.city}</div>
                <div style={styles.guideBannerTagline}>{hero.tagline}</div>
              </div>
              <FiChevronRight size={20} color={colors.textTertiary} style={{ flexShrink: 0 }} />
            </div>
          </div>
        )}

        {teasers.length > 0 && (
          <div style={styles.guideTeaser}>
            {teasers.map(guide => (
              <div
                key={guide.id}
                style={styles.guideTeaserItem}
                onClick={() => navigate(`/city/${guide.id}`)}
              >
                <div style={styles.guideTeaserName}>{guide.city}</div>
                <div style={styles.guideTeaserStatus}>Guide</div>
              </div>
            ))}
          </div>
        )}

        {/* === ALL MEMBERS — filterable grid === */}
        <div style={styles.allMembersSection}>
          <div style={styles.allMembersHeader}>
            <div style={styles.sectionTitle}>All members</div>
            <div style={styles.filterBar}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  style={{
                    ...styles.filterTab,
                    ...(activeFilter === f ? styles.filterTabActive : {}),
                  }}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.memberCount}>
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </div>

          {filteredMembers.length > 0 ? (
            <div style={styles.peopleGrid}>
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  style={styles.personCard}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
                  onClick={() => { setPhotoIndex(0); setPreviewUser(member); }}
                >
                  <div style={styles.personPhotoWrap}>
                    <img src={member.photoURL} alt={member.name} style={styles.personPhoto} />
                    {member.signal && member.signal.type === 'overlap' && (
                      <div style={styles.signalOverlap}>{member.signal.label}</div>
                    )}
                  </div>
                  <div style={styles.personInfo}>
                    <div style={styles.personName}>{member.name}{member.age ? `, ${member.age}` : ''}</div>
                    {member.city && <div style={styles.personCity}>{member.city}</div>}
                    {member.signal && member.signal.type !== 'overlap' && (
                      <div style={styles.personSignal}>
                        <FiNavigation size={10} />
                        <span>{member.signal.label}</span>
                      </div>
                    )}
                    {!member.signal && member.travelStyle && (
                      <div style={styles.personStyle}>{member.travelStyle} traveler</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyTitle}>
                {activeFilter === 'Traveling' ? 'No upcoming trips yet' : 'No members nearby'}
              </div>
              <div style={styles.emptySub}>
                {activeFilter === 'Traveling'
                  ? 'Members will appear here when they add trips'
                  : 'Invite friends in your city to join'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile preview modal */}
      <AnimatePresence>
        {previewUser && (() => {
          const isConn = (currentUserData?.connections || []).some(c => c.userId === previewUser.id);
          const isPending = allSentRequests.includes(previewUser.id);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
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
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <button style={styles.modalClose} onClick={() => setPreviewUser(null)}>
                  <FiX size={18} />
                </button>

                <div style={styles.modalContent}>
                  {(() => {
                    const photos = previewUser.photos || (previewUser.photoURL ? [previewUser.photoURL] : []);
                    if (photos.length > 1) {
                      return (
                        <div style={styles.carouselWrap}>
                          <div style={styles.carouselImageWrap}>
                            <img src={photos[photoIndex]} alt={`${previewUser.name} ${photoIndex + 1}`} style={styles.carouselImage} />
                            <div style={styles.carouselTapLeft} onClick={() => setPhotoIndex(i => i > 0 ? i - 1 : photos.length - 1)} />
                            <div style={styles.carouselTapRight} onClick={() => setPhotoIndex(i => i < photos.length - 1 ? i + 1 : 0)} />
                          </div>
                          <div style={styles.carouselDots}>
                            {photos.map((_, i) => (
                              <div key={i} style={{ ...styles.carouselDot, ...(i === photoIndex ? styles.carouselDotActive : {}) }} onClick={() => setPhotoIndex(i)} />
                            ))}
                          </div>
                        </div>
                      );
                    } else if (photos.length === 1) {
                      return (
                        <div style={styles.carouselWrap}>
                          <div style={styles.carouselImageWrap}>
                            <img src={photos[0]} alt={previewUser.name} style={styles.carouselImage} />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div style={styles.modalAvatarWrap}>
                          <div style={styles.modalAvatarPlaceholder}>{previewUser.name?.charAt(0).toUpperCase()}</div>
                        </div>
                      );
                    }
                  })()}

                  <div style={styles.modalTextContent}>
                    <div style={styles.modalName}>
                      {previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}
                    </div>
                    {previewUser.foundingMember && (
                      <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: colors.terracotta, marginBottom: '4px' }}>Founding Member</div>
                    )}
                    {previewUser.city && (
                      <div style={styles.modalCity}>{previewUser.city}</div>
                    )}
                    {previewUser.travelStyle && (
                      <div style={{ fontSize: '12px', color: colors.textTertiary, marginBottom: '8px' }}>{previewUser.travelStyle} traveler</div>
                    )}

                    {previewUser.bio && <p style={styles.modalBio}>{previewUser.bio}</p>}

                    {previewUser.interests && previewUser.interests.length > 0 && (
                      <div style={styles.modalInterests}>
                        {previewUser.interests.map((interest, i) => (
                          <span key={i} style={styles.modalInterestChip}>{interest}</span>
                        ))}
                      </div>
                    )}

                    {allTrips.length > 0 && (
                      <div style={styles.modalTrips}>
                        <div style={styles.modalTripsLabel}>Journeys</div>
                        {allTrips.map((trip, i) => (
                          <div
                            key={i}
                            style={styles.modalTripItem}
                            onClick={() => {
                              const tripCityId = trip.destinationId || trip.destination?.split(',')[0]?.toLowerCase().replace(/\s+/g, '-');
                              setPreviewUser(null);
                              navigate(`/city/${tripCityId}`);
                            }}
                          >
                            <span style={{ flexShrink: 0 }}>
                              {trip.isThere
                                ? <FiMapPin size={14} color={colors.terracotta} />
                                : <FiNavigation size={14} color={colors.textTertiary} />}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={styles.modalTripDest}>{trip.destination?.split(',')[0]}</div>
                              <div style={styles.modalTripDates}>{formatDateRange(trip.start, trip.end)}</div>
                            </div>
                            {trip.isThere && <span style={styles.modalTripBadge}>Active trip</span>}
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
      </AnimatePresence>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '90px',
  },

  // Header
  header: {
    padding: '20px 24px 12px',
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '500',
    color: colors.text,
    letterSpacing: '3px',
  },
  brandSub: {
    fontSize: '11px',
    color: colors.textMuted,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginTop: '2px',
  },

  // Feed
  feed: {
    display: 'flex',
    flexDirection: 'column',
  },

  // Shared section header
  sectionHeader: {
    padding: '24px 24px 16px',
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '600',
    color: colors.text,
    letterSpacing: '-0.3px',
  },
  sectionSub: {
    fontSize: '12px',
    color: colors.textMuted,
    marginTop: '3px',
  },

  // For You — horizontal scroll, larger cards
  forYouSection: {
    marginBottom: '8px',
  },
  forYouScroll: {
    display: 'flex',
    overflowX: 'auto',
    gap: '12px',
    paddingLeft: '24px',
    paddingRight: '24px',
    paddingBottom: '20px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  forYouCard: {
    flexShrink: 0,
    width: '200px',
    borderRadius: radius.lg,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  forYouPhoto: {
    height: '280px',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '16px',
    position: 'relative',
  },
  forYouBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#fff',
    background: colors.terracotta,
    padding: '4px 8px',
    borderRadius: radius.sm,
    letterSpacing: '0.3px',
  },
  forYouContent: {},
  forYouName: {
    fontFamily: fonts.serif,
    fontSize: '18px',
    fontWeight: '600',
    color: colors.text,
    lineHeight: 1.2,
  },
  forYouCity: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '3px',
  },
  forYouMatch: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.terracotta,
    marginTop: '6px',
    letterSpacing: '0.2px',
  },

  // All members section
  allMembersSection: {
    borderTop: `1px solid ${colors.border}`,
    marginTop: '8px',
  },
  allMembersHeader: {
    padding: '24px 24px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },

  // Filter tabs — inline with header
  filterBar: {
    display: 'flex',
    gap: '4px',
  },
  filterTab: {
    padding: '6px 12px',
    borderRadius: radius.full,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textTertiary,
    fontSize: '12px',
    fontWeight: '500',
    fontFamily: fonts.sans,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterTabActive: {
    background: colors.text,
    color: colors.bg,
    borderColor: colors.text,
  },

  memberCount: {
    fontSize: '12px',
    color: colors.textMuted,
    padding: '12px 24px 8px',
  },

  // People grid — 2 col
  peopleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    padding: '0 16px 24px',
  },
  personCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    background: colors.surface,
    cursor: 'pointer',
    border: `1px solid ${colors.border}`,
  },
  personPhotoWrap: {
    position: 'relative',
    aspectRatio: '3/4',
    overflow: 'hidden',
  },
  personPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  signalOverlap: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#fff',
    background: colors.terracotta,
    padding: '4px 8px',
    borderRadius: radius.sm,
    letterSpacing: '0.3px',
  },
  personInfo: {
    padding: '10px 12px 12px',
  },
  personName: {
    fontFamily: fonts.serif,
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    lineHeight: 1.2,
  },
  personCity: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  personSignal: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: colors.terracotta,
    marginTop: '6px',
  },
  personStyle: {
    fontSize: '11px',
    color: colors.textMuted,
    marginTop: '4px',
  },

  // Empty state
  emptyState: {
    padding: '60px 24px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '8px',
  },
  emptySub: {
    fontSize: '14px',
    color: colors.textMuted,
    lineHeight: 1.5,
  },

  // Guide banner — compact
  guideBanner: {
    margin: '8px 16px 16px',
    borderRadius: radius.lg,
    overflow: 'hidden',
    cursor: 'pointer',
    border: `1px solid ${colors.border}`,
  },
  guideBannerBg: {
    height: '100px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
  },
  guideBannerContent: {
    flex: 1,
  },
  guideBannerLabel: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: colors.terracotta,
    marginBottom: '4px',
  },
  guideBannerCity: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '600',
    color: colors.text,
    lineHeight: 1.1,
  },
  guideBannerTagline: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '3px',
    lineHeight: 1.3,
  },

  // Guide teasers — minimal list
  guideTeaser: {
    padding: '0 16px 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  guideTeaserItem: {
    padding: '14px 16px',
    background: colors.surface,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
  },
  guideTeaserName: {
    fontFamily: fonts.serif,
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  guideTeaserStatus: {
    fontSize: '10px',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '2px',
  },

  // Photo carousel
  carouselWrap: { position: 'relative', marginBottom: '4px' },
  carouselImageWrap: { position: 'relative', width: '100%', aspectRatio: '4/5', borderRadius: `${radius.lg} ${radius.lg} 0 0`, overflow: 'hidden' },
  carouselImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease' },
  carouselTapLeft: { position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', cursor: 'pointer' },
  carouselTapRight: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', cursor: 'pointer' },
  carouselDots: { display: 'flex', justifyContent: 'center', gap: '6px', padding: '12px 0 4px' },
  carouselDot: { width: '6px', height: '6px', borderRadius: '50%', background: colors.warmGray, cursor: 'pointer', transition: 'all 0.2s' },
  carouselDotActive: { background: colors.terracotta, width: '18px', borderRadius: '3px' },

  // Profile modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' },
  modalClose: { position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalContent: { textAlign: 'center' },
  modalAvatarWrap: { padding: '32px 0 14px' },
  modalAvatar: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.warmGray}` },
  modalAvatarPlaceholder: { width: '88px', height: '88px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', fontFamily: fonts.serif },
  modalTextContent: { padding: '16px 24px 24px' },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '2px' },
  modalCity: { fontSize: '13px', color: colors.textTertiary, marginBottom: '12px' },
  modalBio: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6, margin: '8px 0 16px', fontStyle: 'italic' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { ...components.pill },
  modalTrips: { textAlign: 'left', marginBottom: '16px' },
  modalTripsLabel: { ...type.label, marginBottom: '10px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px', cursor: 'pointer' },
  modalTripDest: { fontSize: '14px', fontWeight: '600', color: colors.text },
  modalTripDates: { fontSize: '12px', color: colors.textTertiary, marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '600', color: colors.terracotta, background: colors.warningBg, padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalStatusBadge: { width: '100%', padding: '14px', background: colors.warmGray, color: colors.text, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
  modalConnectBtn: { ...components.btnPrimary },
};

export default Discover;
