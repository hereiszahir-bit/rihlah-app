import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, updateDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiX, FiMapPin, FiNavigation, FiClock, FiMessageCircle, FiCamera, FiPlus, FiCheck } from 'react-icons/fi';
import { getExperiencesForDestination, getDestinationByName, getDestinationImage } from '../data/destinations';
import { colors, fonts, radius, components } from '../design';

function DestinationDetail() {
  const { destination } = useParams();
  const navigate = useNavigate();
  const destinationName = decodeURIComponent(destination);
  const { currentUser, currentUserData, allUsers, sentRequestUserIds, refreshConnections, refreshCurrentUser, refreshAll } = useUser();

  useEffect(() => {
    refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [localSentRequests, setLocalSentRequests] = useState([]);
  const [previewUser, setPreviewUser] = useState(null);
  const [tripPickerData, setTripPickerData] = useState(null);
  const [localCurrentUserData, setLocalCurrentUserData] = useState(null);
  const effectiveUserData = localCurrentUserData || currentUserData;

  const allSentRequests = useMemo(() => {
    return [...new Set([...sentRequestUserIds, ...localSentRequests])];
  }, [sentRequestUserIds, localSentRequests]);

  const destinationData = useMemo(() => getDestinationByName(destinationName), [destinationName]);
  const experiences = useMemo(() => getExperiencesForDestination(destinationName), [destinationName]);
  const destImage = getDestinationImage(destinationName);
  const destCity = destinationName.split(',')[0];
  const destCountry = destinationName.split(',').slice(1).join(',').trim();

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Compute travelers going to this destination (with visibility filtering)
  const destinationUsers = useMemo(() => {
    if (!currentUser) return [];
    const currentUserGender = currentUserData?.gender || '';
    const rawVisibility = currentUserData?.profileVisibility || 'both';
    const myVisibility = ['Male', 'Female', 'both'].includes(rawVisibility) ? rawVisibility : 'both';
    const myConnections = (currentUserData?.connections || []).map(c => c.userId);

    return allUsers.filter(user => {
      if (user.id === currentUser.uid) return false;
      if (!Array.isArray(user.upcomingTrips) || user.upcomingTrips.length === 0) return false;
      if (!user.upcomingTrips.some(trip => trip.destination === destinationName)) return false;

      if (!myConnections.includes(user.id)) {
        const rawTheirVis = user.profileVisibility || 'both';
        const theirVisibility = ['Male', 'Female', 'both'].includes(rawTheirVis) ? rawTheirVis : 'both';
        if (theirVisibility !== 'both' && theirVisibility !== currentUserGender) return false;
        if (myVisibility !== 'both' && user.gender !== myVisibility) return false;
      }

      return true;
    });
  }, [allUsers, currentUser, currentUserData, destinationName]);

  // Travelers with their trip month (only current or future trips)
  const travelersWithMonth = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return destinationUsers.map(user => {
      const trips = user.upcomingTrips.filter(t => {
        if (t.destination !== destinationName) return false;
        const end = parseDate(t.endDate);
        return end >= today; // exclude past trips
      });
      if (trips.length === 0) return null;

      // Pick the most relevant trip (here now > upcoming)
      const trip = trips.find(t => {
        const s = parseDate(t.startDate);
        const e = parseDate(t.endDate);
        return today >= s && today <= e;
      }) || trips.find(t => parseDate(t.startDate) > today) || trips[0];

      const start = parseDate(trip.startDate);
      const end = parseDate(trip.endDate);
      const isThere = today >= start && today <= end;
      const month = start.toLocaleDateString('en-US', { month: 'short' });

      return { ...user, trip, month, isThere };
    }).filter(Boolean).sort((a, b) => {
      if (a.isThere && !b.isThere) return -1;
      if (!a.isThere && b.isThere) return 1;
      return parseDate(a.trip.startDate) - parseDate(b.trip.startDate);
    });
  }, [destinationUsers, destinationName]);

  // Experience save logic
  const saveExperienceToTrip = async (experience, tripIndex) => {
    try {
      const updatedTrips = [...effectiveUserData.upcomingTrips];
      if (!updatedTrips[tripIndex].experiences) {
        updatedTrips[tripIndex].experiences = [];
      }
      const alreadyAdded = updatedTrips[tripIndex].experiences.some(exp => exp.id === experience.id);
      if (alreadyAdded) return;
      updatedTrips[tripIndex].experiences.push(experience);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      setLocalCurrentUserData({ ...effectiveUserData, upcomingTrips: updatedTrips });
      refreshCurrentUser();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddExperience = async (experience) => {
    if (!currentUser || !effectiveUserData) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchingTrips = [];
    (effectiveUserData.upcomingTrips || []).forEach((trip, index) => {
      if (trip.destination !== destinationName) return;
      const endDate = new Date(trip.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (endDate >= today) matchingTrips.push({ index, trip });
    });

    if (matchingTrips.length === 0) return;
    if (matchingTrips.length === 1) {
      await saveExperienceToTrip(experience, matchingTrips[0].index);
      return;
    }
    setTripPickerData({ experience, matchingTrips });
  };

  const handleSendConnectionRequest = async (toUser) => {
    try {
      if (!currentUser || !effectiveUserData) return;
      const alreadyConnected = (effectiveUserData.connections || []).some(c => c.userId === toUser.id);
      if (alreadyConnected) return;

      const [fromMeSnapshot, toMeSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', currentUser.uid)))
      ]);
      const allDocs = [...fromMeSnapshot.docs, ...toMeSnapshot.docs];
      const existingRequest = allDocs.find(docSnap => {
        const data = docSnap.data();
        return (
          (data.fromUserId === currentUser.uid && data.toUserId === toUser.id) ||
          (data.fromUserId === toUser.id && data.toUserId === currentUser.uid)
        );
      });
      if (existingRequest) return;

      setLocalSentRequests(prev => [...prev, toUser.id]);
      await addDoc(collection(db, 'connectionRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: effectiveUserData.name,
        fromUserAge: effectiveUserData.age,
        fromUserGender: effectiveUserData.gender,
        fromUserBio: effectiveUserData.bio || '',
        fromUserPhotoURL: effectiveUserData.photoURL || '',
        fromUserInterests: effectiveUserData.interests || [],
        toUserId: toUser.id,
        toUserName: toUser.name || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      refreshConnections();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const isExperienceSaved = (expId) => {
    return effectiveUserData?.upcomingTrips
      ?.find(trip => trip.destination === destinationName)
      ?.experiences?.some(e => e.id === expId) || false;
  };

  const existingTripIndex = (effectiveUserData?.upcomingTrips || []).findIndex(t => t.destination === destinationName);
  const hasTrip = existingTripIndex !== -1;

  // Experience card color palette for placeholder backgrounds
  const expColors = ['#2c3e6b', '#7c5c3a', '#3a5c4c', '#5c3a5c', '#3a4c5c', '#6b4c2c'];

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(rgba(26,26,26,0.3), rgba(26,26,26,0.75)), url(${destImage})`,
        }}
      >
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <div style={styles.heroBottom}>
          <h1 style={styles.heroCity}>{destCity}</h1>
          <div style={styles.heroCountry}>{destCountry}</div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Tags */}
        {destinationData?.tags && destinationData.tags.length > 0 && (
          <div style={styles.tags}>
            {destinationData.tags.map(tag => (
              <span key={tag} style={styles.tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {destinationData?.description && (
          <p style={styles.description}>{destinationData.description}</p>
        )}

        {/* Travelers */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Travelers</h2>
            <span style={styles.sectionCount}>
              {travelersWithMonth.length} going
            </span>
          </div>
          {travelersWithMonth.length > 0 ? (
            <div style={styles.travelerScroll}>
              {travelersWithMonth.slice(0, 8).map((user) => (
                <div
                  key={user.id}
                  style={styles.travelerItem}
                  onClick={() => setPreviewUser(user)}
                >
                  <div style={{
                    ...styles.travelerAvatar,
                    border: user.isThere ? `2px solid ${colors.gold}` : `2px solid ${colors.warmGray}`,
                  }}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} style={styles.travelerAvatarImg} />
                    ) : (
                      <span style={styles.travelerInitial}>{user.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div style={styles.travelerMonth}>{user.month}</div>
                </div>
              ))}
              {travelersWithMonth.length > 8 && (
                <div style={styles.travelerItem}>
                  <div style={styles.travelerMore}>
                    +{travelersWithMonth.length - 8}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={styles.emptyText}>Be the first to plan a journey here.</p>
          )}
        </div>

        {/* Experiences */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Experiences</h2>
            <span style={styles.sectionCount}>
              {experiences.length} available
            </span>
          </div>
          {experiences.length > 0 ? (
            <div style={styles.expScroll}>
              {experiences.map((exp, i) => {
                const saved = isExperienceSaved(exp.id);
                return (
                  <div key={exp.id} style={styles.expCard}>
                    <div
                      style={{
                        ...styles.expImage,
                        background: expColors[i % expColors.length],
                      }}
                    />
                    <div style={styles.expBody}>
                      <div style={styles.expName}>{exp.name}</div>
                      <div style={styles.expMeta}>
                        {exp.duration}{exp.category ? ` · ${exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}` : ''}
                      </div>
                      <div style={styles.expPriceRow}>
                        <span style={styles.expPrice}>From ${exp.price}</span>
                        {hasTrip && (
                          <button
                            style={saved ? styles.expSavedBtn : styles.expSaveBtn}
                            onClick={() => handleAddExperience(exp)}
                          >
                            {saved ? <FiCheck size={14} /> : <FiPlus size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={styles.emptyText}>Experiences coming soon.</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={styles.ctaWrap}>
        <button
          style={styles.ctaBtn}
          onClick={() => hasTrip
            ? navigate(`/trip/${existingTripIndex}`)
            : navigate('/add-trip', { state: { preselectedDestination: destinationName } })
          }
        >
          {hasTrip ? `View your ${destCity} journey` : `Add ${destCity} to a Trip`}
        </button>
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (() => {
        const isConnected = (effectiveUserData?.connections || []).some(c => c.userId === previewUser.id);
        const isPending = allSentRequests.includes(previewUser.id);
        const allTrips = previewUser.upcomingTrips || [];
        const todayModal = new Date();
        todayModal.setHours(0, 0, 0, 0);
        const destTrips = allTrips.filter(t => t.destination === destinationName && parseDate(t.endDate) >= todayModal);
        const isThereDest = destTrips.some(t => {
          const s = parseDate(t.startDate); const e = parseDate(t.endDate);
          return todayModal >= s && todayModal <= e;
        });
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div style={styles.modalTop}>
                <button style={styles.modalCloseBtn} onClick={() => setPreviewUser(null)}><FiX size={18} /></button>
                <div style={styles.modalAvatarWrap}>
                  {previewUser.photoURL ? (
                    <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalAvatarImg} />
                  ) : (
                    <div style={styles.modalAvatarPlaceholder}>
                      {previewUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={styles.modalName}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</div>
                {destTrips.length > 0 && (
                  <span style={styles.modalStatusBadge}>
                    {isThereDest
                      ? <><FiMapPin size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> Here now</>
                      : <><FiNavigation size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> Going soon</>}
                  </span>
                )}
              </div>

              <div style={styles.modalBody}>
                {previewUser.bio && <p style={styles.modalBio}>{previewUser.bio}</p>}

                {previewUser.interests && previewUser.interests.length > 0 && (
                  <div style={styles.modalInterests}>
                    {previewUser.interests.map(interest => (
                      <span key={interest} style={styles.modalInterestChip}>{interest}</span>
                    ))}
                  </div>
                )}

                {isConnected && (previewUser.whatsapp || previewUser.instagram) && (
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

                {allTrips.length > 0 && (
                  <div style={styles.modalTripsSection}>
                    <div style={styles.modalTripsTitle}>Journeys</div>
                    {allTrips.map((trip, i) => {
                      const start = parseDate(trip.startDate);
                      const end = parseDate(trip.endDate);
                      const isThere = todayModal >= start && todayModal <= end;
                      const isUpcoming = todayModal < start;
                      return (
                        <div key={i} style={styles.modalTripItem}>
                          <span style={styles.modalTripIcon}>
                            {isThere ? <FiMapPin size={14} color={colors.gold} /> : isUpcoming ? <FiNavigation size={14} color={colors.textTertiary} /> : <FiCheck size={14} color={colors.textTertiary} />}
                          </span>
                          <div style={styles.modalTripInfo}>
                            <div style={styles.modalTripDest}>{trip.destination.split(',')[0]}</div>
                            <div style={styles.modalTripDates}>
                              {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          {isThere && <span style={styles.modalTripBadge}>There now</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isConnected ? (
                  <div style={styles.modalConnectedBadge}>Connected</div>
                ) : isPending ? (
                  <div style={styles.modalPendingBadge}>Request Pending</div>
                ) : (
                  <button style={styles.modalConnectBtn} onClick={() => { handleSendConnectionRequest(previewUser); setPreviewUser(null); }}>
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Trip Picker Modal */}
      {tripPickerData && (
        <div style={styles.tripPickerOverlay} onClick={() => setTripPickerData(null)}>
          <div style={styles.tripPickerCard} onClick={e => e.stopPropagation()}>
            <div style={styles.tripPickerHeader}>
              <div style={styles.tripPickerTitle}>Which journey?</div>
              <button style={styles.tripPickerClose} onClick={() => setTripPickerData(null)}><FiX size={18} /></button>
            </div>
            <div style={styles.tripPickerBody}>
              {tripPickerData.matchingTrips.map(({ index, trip }) => {
                const start = new Date(trip.startDate);
                const end = new Date(trip.endDate);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const isThere = now >= start && now <= end;
                return (
                  <button
                    key={index}
                    style={styles.tripPickerOption}
                    onClick={async () => {
                      await saveExperienceToTrip(tripPickerData.experience, index);
                      setTripPickerData(null);
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={styles.tripPickerDest}>{trip.destination.split(',')[0]}</div>
                      <div style={styles.tripPickerDates}>
                        {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    {isThere && <span style={styles.tripPickerBadge}><FiMapPin size={11} /> Now</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg, paddingBottom: '100px' },

  // Hero
  hero: {
    position: 'relative',
    height: '320px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  backBtn: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)',
    border: 'none',
    color: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  heroBottom: { padding: '0 24px 28px' },
  heroCity: {
    fontFamily: fonts.serif,
    fontSize: '42px',
    fontWeight: '600',
    color: colors.cream,
    margin: 0,
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  heroCountry: {
    fontSize: '16px',
    color: 'rgba(248,246,242,0.6)',
    marginTop: '6px',
    fontWeight: '500',
  },

  // Content
  content: { padding: '24px' },

  // Tags
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' },
  tag: {
    padding: '8px 16px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.full,
    fontSize: '13px',
    fontWeight: '600',
    color: colors.text,
  },

  // Description
  description: {
    fontSize: '16px',
    lineHeight: 1.7,
    color: colors.text,
    margin: '0 0 32px 0',
    fontWeight: '400',
  },

  // Sections
  section: { marginBottom: '32px' },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '600',
    color: colors.text,
    margin: 0,
  },
  sectionCount: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.textTertiary,
  },

  // Travelers
  travelerScroll: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  travelerItem: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  travelerAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: colors.warmGray,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  travelerAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  travelerInitial: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  travelerMonth: {
    fontSize: '12px',
    fontWeight: '500',
    color: colors.textTertiary,
  },
  travelerMore: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: colors.lightGray,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textSecondary,
  },

  emptyText: {
    fontSize: '14px',
    color: colors.textTertiary,
    margin: 0,
  },

  // Experience cards (horizontal scroll)
  expScroll: {
    display: 'flex',
    gap: '14px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  expCard: {
    flexShrink: 0,
    width: '260px',
    background: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
  },
  expImage: {
    width: '100%',
    height: '160px',
  },
  expBody: { padding: '14px 16px 16px' },
  expName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '4px',
    lineHeight: 1.3,
  },
  expMeta: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: '10px',
  },
  expPriceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expPrice: {
    fontSize: '15px',
    fontWeight: '700',
    color: colors.text,
  },
  expSaveBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: colors.lightGray,
    border: 'none',
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  expSavedBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: colors.dark,
    border: 'none',
    color: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  // CTA
  ctaWrap: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 24px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
    background: colors.bg,
    borderTop: `1px solid ${colors.border}`,
    zIndex: 100,
  },
  ctaBtn: {
    width: '100%',
    padding: '18px',
    background: colors.dark,
    color: colors.cream,
    border: 'none',
    borderRadius: radius.md,
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Profile Preview Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '380px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' },
  modalTop: { padding: '24px 24px 16px', textAlign: 'center', borderBottom: `1px solid ${colors.border}`, position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: colors.lightGray, border: 'none', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalAvatarWrap: { width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px' },
  modalAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modalAvatarPlaceholder: { width: '100%', height: '100%', background: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', color: '#fff' },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '8px' },
  modalStatusBadge: { fontSize: '12px', fontWeight: '600', color: colors.text, background: colors.lightGray, padding: '4px 12px', borderRadius: radius.full, display: 'inline-flex', alignItems: 'center' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalBio: { fontSize: '15px', color: colors.textSecondary, lineHeight: 1.6, margin: '0 0 16px 0' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  modalInterestChip: { padding: '6px 14px', background: colors.lightGray, borderRadius: radius.full, fontSize: '13px', fontWeight: '500', color: colors.text },
  modalSocials: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: colors.lightGray, borderRadius: radius.sm, fontSize: '13px', fontWeight: '600', color: colors.text, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { marginBottom: '16px' },
  modalTripsTitle: { fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0, display: 'flex', alignItems: 'center' },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontFamily: fonts.serif, fontSize: '14px', fontWeight: '500', color: colors.text },
  modalTripDates: { fontSize: '12px', color: colors.textSecondary, marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '600', color: colors.gold, background: colors.lightGray, padding: '4px 8px', borderRadius: radius.sm, flexShrink: 0 },
  modalConnectBtn: { ...components.btnPrimary, marginTop: '4px' },
  modalConnectedBadge: { width: '100%', padding: '14px', background: colors.lightGray, color: colors.text, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
  modalPendingBadge: { width: '100%', padding: '14px', background: colors.warningBg, color: colors.warning, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },

  // Trip Picker Modal
  tripPickerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1100, padding: '20px' },
  tripPickerCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '400px', width: '100%', overflow: 'hidden', marginBottom: '20px' },
  tripPickerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 12px' },
  tripPickerTitle: { fontFamily: fonts.serif, fontSize: '18px', fontWeight: '500', color: colors.text },
  tripPickerClose: { width: '32px', height: '32px', borderRadius: '50%', background: colors.lightGray, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary },
  tripPickerBody: { padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  tripPickerOption: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: radius.md, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' },
  tripPickerDest: { fontFamily: fonts.serif, fontSize: '16px', fontWeight: '500', color: colors.text, marginBottom: '2px' },
  tripPickerDates: { fontSize: '13px', color: colors.textSecondary },
  tripPickerBadge: { fontSize: '11px', fontWeight: '600', color: colors.gold, background: colors.lightGray, padding: '4px 10px', borderRadius: radius.sm, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 },
};

export default DestinationDetail;
