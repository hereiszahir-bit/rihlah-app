import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { FiX, FiEdit2, FiTrash2, FiChevronDown, FiMapPin, FiNavigation, FiMessageCircle, FiCamera, FiSend, FiMap } from 'react-icons/fi';
import { colors, fonts, radius, components, type } from '../design';
import { getDestinationImage } from '../data/destinations';


function Saved() {
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers, connections: myConnections_enriched, sentRequestUserIds, receivedRequestUserIds, refreshCurrentUser } = useUser();
  const [activeSubTab, setActiveSubTab] = useState('upcoming');
  const [expandedYears, setExpandedYears] = useState({});
  const [editingTrip, setEditingTrip] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [expandedTrips, setExpandedTrips] = useState({});
  const [previewUser, setPreviewUser] = useState(null);
  const [localSentRequests, setLocalSentRequests] = useState([]);

  const trips = currentUserData?.upcomingTrips || [];
  const allSentRequests = useMemo(() => [...new Set([...sentRequestUserIds, ...receivedRequestUserIds, ...localSentRequests])], [sentRequestUserIds, receivedRequestUserIds, localSentRequests]);

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const overlappingPeople = useMemo(() => {
    if (!currentUserData || !currentUser) return {};

    const myGender = currentUserData.gender || '';
    const myVisibility = currentUserData.profileVisibility || 'both';
    const myConnections = (currentUserData.connections || []).map(c => c.userId);
    const myTrips = currentUserData.upcomingTrips || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const peopleByTrip = {};

    myTrips.forEach((trip, idx) => {
      const myStart = parseDate(trip.startDate);
      const myEnd = parseDate(trip.endDate);
      const people = [];

      allUsers.forEach((u) => {
        if (u.id === currentUser.uid) return;
        if (!Array.isArray(u.upcomingTrips) || u.upcomingTrips.length === 0) return;

        if (!myConnections.includes(u.id)) {
          const theirVis = u.profileVisibility || 'both';
          if (theirVis !== 'both' && theirVis !== myGender) return;
          if (myVisibility !== 'both' && u.gender !== myVisibility) return;
        }

        u.upcomingTrips.forEach(ut => {
          if (ut.destination !== trip.destination) return;
          const uStart = parseDate(ut.startDate);
          const uEnd = parseDate(ut.endDate);
          if (uStart <= myEnd && uEnd >= myStart) {
            const isThere = today >= uStart && today <= uEnd;
            const isConn = myConnections.includes(u.id);
            const connRecord = isConn ? myConnections_enriched.find(c => c.userId === u.id) : null;
            people.push({
              id: u.id,
              ...u,
              ...(connRecord ? { whatsapp: connRecord.whatsapp, instagram: connRecord.instagram } : {}),
              tripStart: ut.startDate,
              tripEnd: ut.endDate,
              isThere,
              isConnected: isConn,
            });
          }
        });
      });

      const seen = {};
      people.forEach(p => {
        if (!seen[p.id] || (p.isThere && !seen[p.id].isThere)) {
          seen[p.id] = p;
        }
      });
      const deduped = Object.values(seen).sort((a, b) => {
        if (a.isConnected && !b.isConnected) return -1;
        if (!a.isConnected && b.isConnected) return 1;
        if (a.isThere && !b.isThere) return -1;
        if (!a.isThere && b.isThere) return 1;
        return 0;
      });
      peopleByTrip[idx] = deduped;
    });

    return peopleByTrip;
  }, [currentUserData, allUsers, currentUser, myConnections_enriched]);

  const handleSendConnectionRequest = async (toUser) => {
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
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleRemoveTrip = async (tripIndex) => {
    try {
      if (!currentUser) return;
      const updatedTrips = trips.filter((_, index) => index !== tripIndex);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      refreshCurrentUser();
    } catch (error) {
      console.error('Error removing trip:', error);
    }
  };

  const handleRemoveExperience = async (tripIndex, expIndex) => {
    try {
      if (!currentUser) return;
      const updatedTrips = [...trips];
      updatedTrips[tripIndex].experiences.splice(expIndex, 1);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      refreshCurrentUser();
    } catch (error) {
      console.error('Error removing experience:', error);
    }
  };

  const handleStartEditDates = (tripIndex, startDate, endDate) => {
    setEditingTrip(tripIndex);
    setEditStart(startDate);
    setEditEnd(endDate);
  };

  const handleSaveDates = async (tripIndex) => {
    if (!editStart || !editEnd) return;
    if (new Date(editEnd) < new Date(editStart)) return;
    try {
      if (!currentUser) return;
      const updatedTrips = [...trips];
      updatedTrips[tripIndex] = {
        ...updatedTrips[tripIndex],
        startDate: editStart,
        endDate: editEnd,
      };
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      refreshCurrentUser();
      setEditingTrip(null);
    } catch (error) {
      console.error('Error updating trip dates:', error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = [];
  const pastTrips = [];

  trips.forEach((trip, originalIndex) => {
    const endDate = new Date(trip.endDate);
    endDate.setHours(23, 59, 59, 999);
    const tripWithIndex = { ...trip, originalIndex };
    if (endDate >= today) {
      upcomingTrips.push(tripWithIndex);
    } else {
      pastTrips.push(tripWithIndex);
    }
  });

  const archivedPastTrips = currentUserData?.pastTrips || [];
  archivedPastTrips.forEach((trip, i) => {
    pastTrips.push({ ...trip, originalIndex: `past-${i}`, isArchived: true });
  });

  const groupByYear = (tripList) => {
    const groups = {};
    tripList.forEach(trip => {
      const year = new Date(trip.startDate).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(trip);
    });
    Object.keys(groups).forEach(year => {
      groups[year].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    });
    const sortedYears = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return { groups, sortedYears };
  };

  const upcomingGrouped = groupByYear(upcomingTrips);
  const pastGrouped = groupByYear(pastTrips);

  const loading = !currentUserData;
  useEffect(() => {
    if (!loading && Object.keys(expandedYears).length === 0) {
      const initial = {};
      if (upcomingGrouped.sortedYears.length > 0) {
        const nearestYear = upcomingGrouped.sortedYears[upcomingGrouped.sortedYears.length - 1];
        initial[`upcoming-${nearestYear}`] = true;
      }
      if (pastGrouped.sortedYears.length > 0) {
        initial[`past-${pastGrouped.sortedYears[0]}`] = true;
      }
      setExpandedYears(initial);

      if (upcomingTrips.length > 0) {
        setExpandedTrips({ [upcomingTrips[0].originalIndex]: true });
      }
    }
  }, [loading]);

  const toggleYear = (key) => {
    setExpandedYears(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTrip = (tripIndex) => {
    setExpandedTrips(prev => ({ ...prev, [tripIndex]: !prev[tripIndex] }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderUpcomingTrip = (trip) => {
    const people = overlappingPeople[trip.originalIndex] || [];
    const startDate = parseDate(trip.startDate);
    const endDate = parseDate(trip.endDate);
    const isThere = today >= startDate && today <= endDate;
    const daysAway = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    const expCount = trip.experiences?.length || 0;

    return (
      <div key={trip.originalIndex} style={styles.tripCard} onClick={() => navigate(`/trip/${trip.originalIndex}`)}>
        <div
          style={{
            ...styles.tripHeader,
            backgroundImage: `linear-gradient(rgba(26,26,26,0.3), rgba(26,26,26,0.8)), url(${getDestinationImage(trip.destination)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div style={styles.tripDestination}>{trip.destination.split(',')[0]}</div>
          <div style={styles.tripDates}>
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
          </div>
          <div style={styles.tripMeta}>
            <div style={styles.tripMetaLeft}>
              {isThere ? (
                <span style={styles.thereBadge}>There now</span>
              ) : (
                <span style={styles.daysAway}>{daysAway} days away</span>
              )}
            </div>
            {people.length > 0 && (
              <div style={styles.tripAvatars}>
                {people.slice(0, 3).map((p, i) => (
                  <div key={p.id} style={styles.tripAvatar}>
                    {p.photoURL ? (
                      <img src={p.photoURL} alt="" style={styles.tripAvatarImg} />
                    ) : (
                      p.name?.charAt(0)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {(expCount > 0 || people.length > 0) && (
          <div style={styles.tripPills}>
            {expCount > 0 && <span style={styles.pill}>{expCount} experience{expCount !== 1 ? 's' : ''}</span>}
            {people.length > 0 && <span style={styles.pill}>{people.length} traveler{people.length !== 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>
    );
  };

  const renderPastTrip = (trip) => {
    const isExpanded = expandedTrips[`past-${trip.originalIndex}`];
    const expCount = trip.experiences?.length || 0;

    return (
      <div key={trip.originalIndex} style={styles.pastTripCard}>
        <div
          style={styles.pastTripHeader}
          onClick={() => setExpandedTrips(prev => ({ ...prev, [`past-${trip.originalIndex}`]: !prev[`past-${trip.originalIndex}`] }))}
        >
          <div style={styles.tripHeaderLeft}>
            <div style={styles.pastTripDestination}>{trip.destination.split(',')[0]}</div>
            <div style={styles.tripHeaderMeta}>
              <span style={styles.pastTripDatesInline}>
                {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
              </span>
            </div>
          </div>
          <span style={{
            ...styles.tripChevron,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: colors.textTertiary,
          }}><FiChevronDown size={18} /></span>
        </div>
        {isExpanded && expCount > 0 && (
          <div style={styles.pastTripBody}>
            {trip.experiences.map((exp, i) => (
              <div key={i} style={styles.pastExpItem}>
                <span>{exp.name}</span>
                <span style={styles.pastExpPrice}>${exp.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderYearGroups = (grouped, prefix, renderTrip) => {
    if (grouped.sortedYears.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>
            {prefix === 'upcoming' ? 'No upcoming journeys' : 'No past journeys yet'}
          </div>
          <div style={styles.emptyText}>
            {prefix === 'upcoming' ? 'Plan your next journey to get started.' : 'Your travel history will appear here.'}
          </div>
          {prefix === 'upcoming' && (
            <button style={styles.emptyButton} onClick={() => navigate('/add-trip')}>
              Plan a Journey
            </button>
          )}
        </div>
      );
    }

    return (
      <div style={styles.yearList}>
        {grouped.sortedYears.map(year => {
          const key = `${prefix}-${year}`;
          const isExpanded = expandedYears[key];
          const tripCount = grouped.groups[year].length;
          return (
            <div key={year}>
              <button
                style={styles.yearHeader}
                onClick={() => toggleYear(key)}
              >
                <div style={styles.yearLeft}>
                  <span style={styles.yearLabel}>{year}</span>
                  <span style={styles.yearCount}>
                    {tripCount} journey{tripCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{
                  ...styles.yearChevron,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}><FiChevronDown size={16} /></span>
              </button>
              {isExpanded && (
                <div style={styles.yearTrips}>
                  {grouped.groups[year].map(renderTrip)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!currentUserData) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page title */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Journeys</h1>
      </div>

      {/* Sub-tabs */}
      <div style={styles.subTabsWrapper}>
        <div style={styles.subTabs}>
          <button
            style={{...styles.subTab, ...(activeSubTab === 'upcoming' ? styles.subTabActive : {})}}
            onClick={() => setActiveSubTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            style={{...styles.subTab, ...(activeSubTab === 'past' ? styles.subTabActive : {})}}
            onClick={() => setActiveSubTab('past')}
          >
            Past
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {activeSubTab === 'upcoming' && renderYearGroups(upcomingGrouped, 'upcoming', renderUpcomingTrip)}
        {activeSubTab === 'past' && renderYearGroups(pastGrouped, 'past', renderPastTrip)}
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (() => {
        const isConnected = (currentUserData?.connections || []).some(c => c.userId === previewUser.id);
        const isPending = allSentRequests.includes(previewUser.id);
        const allTrips = previewUser.upcomingTrips || [];
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <button style={styles.modalCloseBtn} onClick={() => setPreviewUser(null)}><FiX size={18} /></button>

              <div style={styles.modalContent}>
                <div style={styles.modalAvatarWrap}>
                  {previewUser.photoURL ? (
                    <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalAvatar} />
                  ) : (
                    <div style={styles.modalAvatarPlaceholder}>
                      {previewUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={styles.modalName}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</div>

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
                        <FiMessageCircle size={14} style={{ marginRight: '4px' }} /> WhatsApp
                      </a>
                    )}
                    {previewUser.instagram && (
                      <a href={`https://www.instagram.com/${previewUser.instagram}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                        <FiCamera size={14} style={{ marginRight: '4px' }} /> Instagram
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
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const isThere = now >= start && now <= end;
                      return (
                        <div key={i} style={styles.modalTripItem}>
                          <span style={{ flexShrink: 0 }}>{isThere ? <FiMapPin size={14} color={colors.text} /> : <FiNavigation size={14} color={colors.textTertiary} />}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>{trip.destination.split(',')[0]}</div>
                            <div style={{ fontSize: '12px', color: colors.textTertiary, marginTop: '2px' }}>
                              {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          {isThere && <span style={styles.modalTripBadge}>There now</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isConnected ? (
                  <div style={styles.modalStatusBadge}>Connected</div>
                ) : isPending ? (
                  <div style={{ ...styles.modalStatusBadge, background: colors.warningBg, color: colors.warning }}>Request Pending</div>
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
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: colors.bg, paddingBottom: '90px' },
  loadingState: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: colors.textTertiary, fontSize: '16px' },

  // Page header
  pageHeader: { padding: '20px 24px 0' },
  pageTitle: { fontFamily: fonts.serif, fontSize: '28px', fontWeight: '500', color: colors.text, margin: 0, letterSpacing: '-0.3px' },

  // Sub-tabs
  subTabsWrapper: { padding: '16px 24px 0' },
  subTabs: { display: 'flex', gap: '0', background: colors.lightGray, borderRadius: radius.sm, padding: '3px' },
  subTab: { flex: 1, padding: '10px 16px', background: 'transparent', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: colors.textTertiary, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' },
  subTabActive: { background: colors.surface, color: colors.text, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },

  // Content
  content: { padding: '20px 24px' },

  // Year groups
  yearList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  yearHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'transparent', border: 'none', cursor: 'pointer' },
  yearLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  yearLabel: { fontFamily: fonts.serif, fontSize: '18px', fontWeight: '500', color: colors.text },
  yearCount: { fontSize: '12px', fontWeight: '500', color: colors.textTertiary },
  yearChevron: { color: colors.textTertiary, transition: 'transform 0.2s', display: 'inline-block' },
  yearTrips: { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' },

  // Empty
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' },
  emptyTitle: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' },
  emptyButton: { ...components.btnPrimary, width: 'auto', padding: '12px 28px' },

  // Upcoming Trip Card
  tripCard: { background: colors.surface, borderRadius: radius.lg, overflow: 'hidden', border: `1px solid ${colors.border}`, cursor: 'pointer' },
  tripHeader: { padding: '24px 20px', position: 'relative' },
  tripDestination: { fontFamily: fonts.serif, color: colors.cream, fontSize: '22px', fontWeight: '600', marginBottom: '4px' },
  tripDates: { color: 'rgba(248,246,242,0.65)', fontSize: '13px', marginBottom: '14px' },
  tripMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tripMetaLeft: {},
  thereBadge: { fontSize: '12px', fontWeight: '600', color: colors.gold, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: radius.full },
  daysAway: { fontSize: '13px', fontWeight: '600', color: colors.gold },
  tripAvatars: { display: 'flex' },
  tripAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(248,246,242,0.2)', color: colors.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', fontFamily: fonts.serif, marginLeft: '-6px', border: '2px solid rgba(26,26,26,0.5)', overflow: 'hidden' },
  tripAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  tripPills: { padding: '12px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' },
  pill: { fontSize: '12px', fontWeight: '600', color: colors.text, background: colors.lightGray, padding: '6px 12px', borderRadius: radius.full },

  // Past Trip (shared helper styles for past cards)
  tripHeaderLeft: { flex: 1 },
  tripHeaderMeta: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  tripChevron: { color: 'rgba(248,246,242,0.5)', transition: 'transform 0.2s', display: 'inline-block', flexShrink: 0 },
  pastTripCard: { background: colors.surface, borderRadius: radius.md, overflow: 'hidden', border: `1px solid ${colors.border}`, opacity: 0.8 },
  pastTripHeader: { display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' },
  pastTripDestination: { fontFamily: fonts.serif, color: colors.textSecondary, fontSize: '16px', fontWeight: '500', marginBottom: '2px' },
  pastTripDatesInline: { color: colors.textTertiary, fontSize: '13px' },
  pastTripBody: { padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  pastExpItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: colors.textSecondary, padding: '8px 0', borderBottom: `1px solid ${colors.lightGray}` },
  pastExpPrice: { color: colors.textTertiary, fontWeight: '500' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', background: colors.lightGray, border: 'none', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalContent: { padding: '32px 24px 24px', textAlign: 'center' },
  modalAvatarWrap: { marginBottom: '14px' },
  modalAvatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.warmGray}` },
  modalAvatarPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '600', fontFamily: fonts.serif },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '4px' },
  modalBio: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6, margin: '8px 0 16px' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { ...components.pill },
  modalSocials: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalSocialBtn: { padding: '8px 16px', background: colors.lightGray, borderRadius: radius.sm, fontSize: '13px', fontWeight: '600', color: colors.text, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  modalTripsSection: { textAlign: 'left', marginBottom: '16px' },
  modalTripsTitle: { ...type.label, marginBottom: '10px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '600', color: colors.success, background: colors.successBg, padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalStatusBadge: { width: '100%', padding: '14px', background: colors.lightGray, color: colors.text, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
  modalConnectBtn: { ...components.btnPrimary },
};

export default Saved;
