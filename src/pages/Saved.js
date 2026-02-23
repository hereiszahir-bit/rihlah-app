import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { FiX, FiEdit2, FiTrash2, FiChevronDown, FiMapPin, FiNavigation, FiMessageCircle, FiCamera } from 'react-icons/fi';
import TabBar from '../components/TabBar';

function Saved() {
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers, sentRequestUserIds, receivedRequestUserIds, refreshCurrentUser } = useUser();
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

  // Derive overlapping people from context data
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

        const theirVis = u.profileVisibility || 'both';
        if (theirVis !== 'both' && theirVis !== myGender) return;
        if (myVisibility !== 'both' && u.gender !== myVisibility) return;
        if (!Array.isArray(u.upcomingTrips) || u.upcomingTrips.length === 0) return;

        u.upcomingTrips.forEach(ut => {
          if (ut.destination !== trip.destination) return;
          const uStart = parseDate(ut.startDate);
          const uEnd = parseDate(ut.endDate);
          if (uStart <= myEnd && uEnd >= myStart) {
            const isThere = today >= uStart && today <= uEnd;
            people.push({
              id: u.id,
              ...u,
              tripStart: ut.startDate,
              tripEnd: ut.endDate,
              isThere,
              isConnected: myConnections.includes(u.id),
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
  }, [currentUserData, allUsers, currentUser]);

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
      alert('Failed to remove trip');
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
      alert('Failed to remove experience');
    }
  };

  const handleStartEditDates = (tripIndex, startDate, endDate) => {
    setEditingTrip(tripIndex);
    setEditStart(startDate);
    setEditEnd(endDate);
  };

  const handleSaveDates = async (tripIndex) => {
    if (!editStart || !editEnd) {
      alert('Please select both dates');
      return;
    }
    if (new Date(editEnd) < new Date(editStart)) {
      alert('End date must be after start date');
      return;
    }
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
      alert('Failed to update dates');
    }
  };

  // Split trips into upcoming and past
  // upcomingTrips array now only contains current/future trips (past ones are archived to pastTrips field)
  // But handle gracefully if cleanup hasn't run yet
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

  // Also include archived past trips
  const archivedPastTrips = currentUserData?.pastTrips || [];
  archivedPastTrips.forEach((trip, i) => {
    pastTrips.push({ ...trip, originalIndex: `past-${i}`, isArchived: true });
  });

  // Group trips by year and sort by month
  const groupByYear = (tripList) => {
    const groups = {};
    tripList.forEach(trip => {
      const year = new Date(trip.startDate).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(trip);
    });

    // Sort trips within each year by start date
    Object.keys(groups).forEach(year => {
      groups[year].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    });

    // Return sorted year keys (upcoming: nearest first, past: most recent first)
    const sortedYears = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return { groups, sortedYears };
  };

  const upcomingGrouped = groupByYear(upcomingTrips);
  const pastGrouped = groupByYear(pastTrips);

  // Auto-expand the current/nearest year and first trip on first render
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

      // Auto-expand the first upcoming trip
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
    const isExpanded = expandedTrips[trip.originalIndex];
    const people = overlappingPeople[trip.originalIndex] || [];
    const startDate = parseDate(trip.startDate);
    const endDate = parseDate(trip.endDate);
    const isThere = today >= startDate && today <= endDate;
    const expCount = trip.experiences?.length || 0;

    return (
      <div key={trip.originalIndex} style={styles.tripCard}>
        {/* Collapsed header — always visible */}
        <div
          style={{
            ...styles.tripHeader,
            ...(isThere ? styles.tripHeaderThere : {}),
          }}
          onClick={() => toggleTrip(trip.originalIndex)}
        >
          <div style={styles.tripHeaderLeft}>
            <div style={styles.tripDestination}>
              {trip.destination.split(',')[0]}
            </div>
            <div style={styles.tripHeaderMeta}>
              <span style={styles.tripDatesInline}>
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
              {isThere && <span style={styles.thereBadge}><FiMapPin size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> There now</span>}
            </div>
            {!isExpanded && (expCount > 0 || people.length > 0) && (
              <div style={styles.tripHeaderSummary}>
                {expCount > 0 && <span>{expCount} experience{expCount !== 1 ? 's' : ''}</span>}
                {expCount > 0 && people.length > 0 && <span> · </span>}
                {people.length > 0 && <span>{people.length} {people.length === 1 ? 'person' : 'people'}</span>}
              </div>
            )}
          </div>
          <span style={{
            ...styles.tripChevron,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}><FiChevronDown size={18} /></span>
        </div>

        {/* Expanded body */}
        {isExpanded && (
          <div style={styles.tripBody}>
            {/* Editable dates */}
            {editingTrip === trip.originalIndex ? (
              <div style={styles.editDatesSection}>
                <div style={styles.editDatesRow}>
                  <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} style={styles.dateInput} />
                  <span style={{ color: '#6b7280' }}>—</span>
                  <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} style={styles.dateInput} />
                  <button style={styles.dateSaveBtn} onClick={() => handleSaveDates(trip.originalIndex)}>Save</button>
                  <button style={styles.dateCancelBtn} onClick={() => setEditingTrip(null)}><FiX size={14} /></button>
                </div>
              </div>
            ) : (
              <div
                style={styles.editDatesTrigger}
                onClick={() => handleStartEditDates(trip.originalIndex, trip.startDate, trip.endDate)}
              >
                <FiEdit2 size={13} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Edit dates
              </div>
            )}

            {/* Experiences */}
            {expCount > 0 && (
              <div style={styles.expSection}>
                <div style={styles.expSectionLabel}>Experiences ({expCount})</div>
                {trip.experiences.map((exp, expIndex) => (
                  <div key={expIndex} style={styles.expCard}>
                    <div style={styles.expIcon}>{exp.icon || '🎯'}</div>
                    <div style={styles.expDetails}>
                      <div style={styles.expName}>{exp.name}</div>
                      <div style={styles.expPrice}>${exp.price}</div>
                    </div>
                    <div style={styles.expActions}>
                      {exp.bookingUrl && (
                        <button style={styles.bookNowBtn} onClick={() => window.open(exp.bookingUrl, '_blank')}>Book</button>
                      )}
                      <button style={styles.removeExpBtn} onClick={() => handleRemoveExperience(trip.originalIndex, expIndex)}><FiX size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Overlapping people */}
            {people.length > 0 && (
              <div style={styles.connectionsSection}>
                <div style={styles.connectionsSectionLabel}>
                  {people.length} {people.length === 1 ? 'person' : 'people'} during your dates
                </div>
                <div style={styles.peopleList}>
                  {people.map((person) => (
                    <div key={person.id} style={styles.personRow} onClick={() => setPreviewUser(person)}>
                      <div style={{
                        ...styles.personAvatar,
                        border: person.isConnected ? '2px solid #059669' : '2px solid #d1d5db',
                      }}>
                        {person.photoURL ? (
                          <img src={person.photoURL} alt={person.name} style={styles.personAvatarImg} />
                        ) : (
                          <div style={styles.personAvatarPlaceholder}>{person.name?.charAt(0)}</div>
                        )}
                      </div>
                      <div style={styles.personInfo}>
                        <div style={styles.personName}>{person.name?.split(' ')[0]}{person.age ? `, ${person.age}` : ''}</div>
                        <div style={styles.personDates}>
                          {formatDate(person.tripStart)} – {formatDate(person.tripEnd)}
                        </div>
                      </div>
                      <div style={styles.personStatus}>
                        {person.isThere ? <FiMapPin size={16} color="#047857" /> : <FiNavigation size={16} color="#6b7280" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.tripActions}>
              <button style={styles.addExpBtn} onClick={() => navigate(`/destination/${encodeURIComponent(trip.destination)}`)}>
                + Add Experiences
              </button>
              <button style={styles.removeTripBtn} onClick={() => handleRemoveTrip(trip.originalIndex)}>
                <FiTrash2 size={16} />
              </button>
            </div>
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
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </span>
              <span style={styles.completedBadge}>Completed</span>
            </div>
            {!isExpanded && expCount > 0 && (
              <div style={styles.tripHeaderSummary}>
                <span>{expCount} experience{expCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <span style={{
            ...styles.tripChevron,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: '#9ca3af',
          }}><FiChevronDown size={18} /></span>
        </div>
        {isExpanded && (
          <div style={styles.pastTripBody}>
            {expCount > 0 && (
              <div style={styles.pastExpList}>
                {trip.experiences.map((exp, i) => (
                  <div key={i} style={styles.pastExpItem}>
                    <span>{exp.icon || '🎯'} {exp.name}</span>
                    <span style={styles.pastExpPrice}>${exp.price}</span>
                    {exp.bookingUrl && (
                      <button style={styles.rebookBtn} onClick={() => window.open(exp.bookingUrl, '_blank')}>
                        Rebook
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderYearGroups = (grouped, prefix, renderTrip) => {
    if (grouped.sortedYears.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>{prefix === 'upcoming' ? '✈️' : '🗺️'}</div>
          <div style={styles.emptyTitle}>
            {prefix === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
          </div>
          <div style={styles.emptyText}>
            {prefix === 'upcoming' ? 'Plan your next adventure' : 'Your travel history will appear here'}
          </div>
          {prefix === 'upcoming' && (
            <button style={styles.emptyButton} onClick={() => navigate('/destinations')}>
              Explore Destinations
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
            <div key={year} style={styles.yearGroup}>
              <button
                style={styles.yearHeader}
                onClick={() => toggleYear(key)}
              >
                <div style={styles.yearLeft}>
                  <span style={styles.yearLabel}>{year}</span>
                  <span style={styles.yearCount}>
                    {tripCount} trip{tripCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{
                  ...styles.yearChevron,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}><FiChevronDown size={18} /></span>
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
        <div style={styles.loading}>Loading...</div>
        <TabBar />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Trips</h1>
        <p style={styles.subtitle}>
          {upcomingTrips.length} upcoming • {pastTrips.length} past
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={styles.subTabsWrapper}>
        <div style={styles.subTabs}>
          <button
            style={{...styles.subTab, ...(activeSubTab === 'upcoming' ? styles.subTabActive : {})}}
            onClick={() => setActiveSubTab('upcoming')}
          >
            Upcoming ({upcomingTrips.length})
          </button>
          <button
            style={{...styles.subTab, ...(activeSubTab === 'past' ? styles.subTabActive : {})}}
            onClick={() => setActiveSubTab('past')}
          >
            Past Trips ({pastTrips.length})
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {activeSubTab === 'upcoming' && renderYearGroups(upcomingGrouped, 'upcoming', renderUpcomingTrip)}
        {activeSubTab === 'past' && renderYearGroups(pastGrouped, 'past', renderPastTrip)}
      </div>

      {/* Profile Preview Modal — Backdrop Photo */}
      {previewUser && (() => {
        const isConnected = (currentUserData?.connections || []).some(c => c.userId === previewUser.id);
        const isPending = allSentRequests.includes(previewUser.id);
        const allTrips = previewUser.upcomingTrips || [];
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              {/* Backdrop photo */}
              <div style={styles.modalBackdrop}>
                {previewUser.photoURL ? (
                  <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalBackdropImg} />
                ) : (
                  <div style={styles.modalBackdropPlaceholder}>
                    {previewUser.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={styles.modalBackdropGradient} />
                <button style={styles.modalCloseBtn} onClick={() => setPreviewUser(null)}><FiX size={18} /></button>
                <div style={styles.modalBackdropInfo}>
                  <div style={styles.modalNameOverlay}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</div>
                  {previewUser.isThere !== undefined && (
                    <span style={styles.modalStatusBadge}>{previewUser.isThere ? <><FiMapPin size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> There now</> : <><FiNavigation size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> Going soon</>}</span>
                  )}
                </div>
              </div>

              {/* Content below backdrop */}
              <div style={styles.modalBody}>
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
                    <div style={styles.modalTripsTitle}>Trips</div>
                    {allTrips.map((trip, i) => {
                      const start = parseDate(trip.startDate);
                      const end = parseDate(trip.endDate);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const isThere = now >= start && now <= end;
                      const isUpcoming = now < start;
                      return (
                        <div key={i} style={styles.modalTripItem}>
                          <span style={styles.modalTripIcon}>{isThere ? <FiMapPin size={14} color="#047857" /> : isUpcoming ? <FiNavigation size={14} color="#6b7280" /> : '✓'}</span>
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

      <TabBar />
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#faf9f7', paddingBottom: '80px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#6b7280', fontSize: '18px' },

  // Header
  header: { background: '#fff', padding: '24px 20px 16px 20px', borderBottom: '1px solid #e8e5e0' },
  title: { fontSize: '28px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b6b6b', margin: 0 },

  // Sub-tabs
  subTabsWrapper: { background: '#fff', padding: '12px 20px', borderBottom: '1px solid #e8e5e0' },
  subTabs: { display: 'flex', gap: '8px' },
  subTab: { flex: 1, padding: '12px 16px', background: '#f5f3f0', border: '2px solid transparent', borderRadius: '12px', fontSize: '15px', fontWeight: '700', color: '#6b6b6b', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' },
  subTabActive: { borderColor: '#047857', color: '#047857', background: '#f0f9f4' },

  // Content
  content: { padding: '20px' },

  // Year groups
  yearList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  yearGroup: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)' },
  yearHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' },
  yearLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  yearLabel: { fontSize: '20px', fontWeight: '800', color: '#1a1a1a' },
  yearCount: { fontSize: '13px', fontWeight: '600', color: '#6b7280', background: '#f5f3f0', padding: '2px 10px', borderRadius: '12px' },
  yearChevron: { fontSize: '18px', color: '#6b7280', transition: 'transform 0.2s', display: 'inline-block' },
  yearTrips: { padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },

  // Empty
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
  emptyText: { fontSize: '15px', color: '#6b7280', marginBottom: '24px' },
  emptyButton: { background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },

  // Upcoming Trip Card
  tripCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)' },
  tripHeader: { display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'linear-gradient(135deg, #047857 0%, #059669 100%)', cursor: 'pointer' },
  tripHeaderThere: { background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' },
  tripHeaderLeft: { flex: 1 },
  tripDestination: { color: '#fff', fontSize: '18px', fontWeight: '800', marginBottom: '4px' },
  tripHeaderMeta: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  tripDatesInline: { color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '500' },
  thereBadge: { fontSize: '11px', fontWeight: '700', color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '8px' },
  tripHeaderSummary: { marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  tripChevron: { fontSize: '20px', color: 'rgba(255,255,255,0.8)', transition: 'transform 0.2s', display: 'inline-block', flexShrink: 0 },
  editDatesSection: { padding: '12px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '12px' },
  editDatesRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  dateInput: { padding: '8px 10px', borderRadius: '8px', border: '2px solid #e5e7eb', background: '#fff', color: '#1f2937', fontSize: '13px', fontFamily: 'inherit' },
  dateSaveBtn: { padding: '8px 14px', background: '#047857', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  dateCancelBtn: { padding: '8px 10px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  editDatesTrigger: { padding: '8px 0', fontSize: '13px', color: '#047857', fontWeight: '600', cursor: 'pointer', marginBottom: '8px' },
  tripBody: { padding: '20px' },

  // Experiences in trip
  expSection: { marginBottom: '16px' },
  expSectionLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  expCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#fff', borderRadius: '12px', marginBottom: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)' },
  expIcon: { fontSize: '24px', flexShrink: 0 },
  expDetails: { flex: 1 },
  expName: { fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' },
  expPrice: { fontSize: '16px', fontWeight: '700', color: '#047857' },
  expActions: { display: 'flex', gap: '6px', alignItems: 'center' },
  bookNowBtn: { padding: '8px 14px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },
  removeExpBtn: { width: '28px', height: '28px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // People list in trip
  connectionsSection: { marginBottom: '16px' },
  connectionsSectionLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  peopleList: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' },
  personRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#fff', borderRadius: '12px', cursor: 'pointer', flexShrink: 0, minWidth: '200px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' },
  personAvatar: { width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden' },
  personAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  personAvatarPlaceholder: { width: '100%', height: '100%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' },
  personInfo: { flex: 1, minWidth: 0 },
  personName: { fontSize: '14px', fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap' },
  personDates: { fontSize: '12px', color: '#6b7280', marginTop: '1px', whiteSpace: 'nowrap' },
  personStatus: { fontSize: '16px', flexShrink: 0 },

  // Trip actions
  tripActions: { display: 'flex', gap: '8px' },
  addExpBtn: { flex: 1, padding: '14px 24px', background: '#f0f9f4', color: '#047857', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  removeTripBtn: { padding: '14px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Past Trip Card
  pastTripCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)', opacity: 0.85 },
  pastTripHeader: { display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)', padding: '16px 20px', cursor: 'pointer' },
  pastTripDestination: { color: '#fff', fontSize: '18px', fontWeight: '800', marginBottom: '4px' },
  pastTripDatesInline: { color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '500' },
  completedBadge: { fontSize: '11px', fontWeight: '700', color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '8px' },
  pastTripBody: { padding: '14px 20px' },
  pastExpList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pastExpItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4b5563' },
  pastExpPrice: { color: '#6b7280', fontWeight: '600', marginLeft: 'auto' },
  rebookBtn: { padding: '8px 14px', background: '#f0f9f4', color: '#047857', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },

  // Profile Preview Modal — Backdrop style
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: '#fff', borderRadius: '20px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)' },
  modalBackdrop: { position: 'relative', width: '100%', height: '240px', flexShrink: 0 },
  modalBackdropImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modalBackdropPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  modalBackdropGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' },
  modalCloseBtn: { position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', fontSize: '18px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(4px)' },
  modalBackdropInfo: { position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 2 },
  modalNameOverlay: { fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' },
  modalStatusBadge: { fontSize: '12px', fontWeight: '700', color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', backdropFilter: 'blur(4px)' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  modalBio: { fontSize: '15px', color: '#374151', lineHeight: 1.6, margin: '0 0 16px 0' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  modalInterestChip: { padding: '6px 14px', background: '#f0f9f4', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#047857' },
  modalSocials: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: '#f5f3f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { marginBottom: '16px' },
  modalTripsTitle: { fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#faf9f7', borderRadius: '10px', marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0 },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontSize: '14px', fontWeight: '700', color: '#1f2937' },
  modalTripDates: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '700', color: '#047857', background: '#f0f9f4', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalConnectedBadge: { width: '100%', padding: '14px', background: '#f0f9f4', color: '#047857', border: '2px solid #bbf7d0', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },
  modalPendingBadge: { width: '100%', padding: '14px', background: '#fffbeb', color: '#d97706', border: '2px solid #fde68a', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },
  modalConnectBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },
};

export default Saved;
