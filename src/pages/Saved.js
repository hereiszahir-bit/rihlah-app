import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import TabBar from '../components/TabBar';

function Saved() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('upcoming');
  const [expandedYears, setExpandedYears] = useState({});
  const [editingTrip, setEditingTrip] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  useEffect(() => {
    loadUserData();
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
        const userData = userDoc.data();
        setTrips(userData.upcomingTrips || []);
        setConnections(userData.connections || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrip = async (tripIndex) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const updatedTrips = trips.filter((_, index) => index !== tripIndex);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      setTrips(updatedTrips);
    } catch (error) {
      console.error('Error removing trip:', error);
      alert('Failed to remove trip');
    }
  };

  const handleRemoveExperience = async (tripIndex, expIndex) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const updatedTrips = [...trips];
      updatedTrips[tripIndex].experiences.splice(expIndex, 1);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      setTrips(updatedTrips);
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
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const updatedTrips = [...trips];
      updatedTrips[tripIndex] = {
        ...updatedTrips[tripIndex],
        startDate: editStart,
        endDate: editEnd,
      };
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      setTrips(updatedTrips);
      setEditingTrip(null);
    } catch (error) {
      console.error('Error updating trip dates:', error);
      alert('Failed to update dates');
    }
  };

  // Split trips into upcoming and past
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

  // Auto-expand the current/nearest year on first render
  useEffect(() => {
    if (!loading && Object.keys(expandedYears).length === 0) {
      const initial = {};
      if (upcomingGrouped.sortedYears.length > 0) {
        // For upcoming, expand the nearest year (last in desc sort = smallest)
        const nearestYear = upcomingGrouped.sortedYears[upcomingGrouped.sortedYears.length - 1];
        initial[`upcoming-${nearestYear}`] = true;
      }
      if (pastGrouped.sortedYears.length > 0) {
        // For past, expand the most recent year (first in desc sort)
        initial[`past-${pastGrouped.sortedYears[0]}`] = true;
      }
      setExpandedYears(initial);
    }
  }, [loading]);

  const toggleYear = (key) => {
    setExpandedYears(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getConnectionsForDestination = (destination) => {
    const cityName = destination.split(',')[0].trim();
    return connections.filter(conn =>
      conn.upcomingTrips && conn.upcomingTrips.some(trip => {
        const tripCity = trip.destination.split(',')[0].trim();
        return tripCity === cityName || trip.destination === destination;
      })
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderUpcomingTrip = (trip) => {
    const destConnections = getConnectionsForDestination(trip.destination);
    return (
      <div key={trip.originalIndex} style={styles.tripCard}>
        <div style={styles.tripHeader}>
          <div style={styles.tripDestination}>{trip.destination}</div>
          {editingTrip === trip.originalIndex ? (
            <div style={styles.editDatesRow}>
              <input
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                style={styles.dateInput}
              />
              <span style={{ color: '#fff' }}>—</span>
              <input
                type="date"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                style={styles.dateInput}
              />
              <button
                style={styles.dateSaveBtn}
                onClick={() => handleSaveDates(trip.originalIndex)}
              >
                Save
              </button>
              <button
                style={styles.dateCancelBtn}
                onClick={() => setEditingTrip(null)}
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              style={styles.tripDatesClickable}
              onClick={() => handleStartEditDates(trip.originalIndex, trip.startDate, trip.endDate)}
            >
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              <span style={styles.editIcon}>✏️</span>
            </div>
          )}
        </div>

        <div style={styles.tripBody}>
          {trip.experiences && trip.experiences.length > 0 && (
            <div style={styles.expSection}>
              <div style={styles.expSectionLabel}>
                Experiences ({trip.experiences.length})
              </div>
              {trip.experiences.map((exp, expIndex) => (
                <div key={expIndex} style={styles.expCard}>
                  <div style={styles.expIcon}>{exp.icon || '🎯'}</div>
                  <div style={styles.expDetails}>
                    <div style={styles.expName}>{exp.name}</div>
                    <div style={styles.expPrice}>${exp.price}</div>
                  </div>
                  <div style={styles.expActions}>
                    {exp.bookingUrl && (
                      <button
                        style={styles.bookNowBtn}
                        onClick={() => window.open(exp.bookingUrl, '_blank')}
                      >
                        Book
                      </button>
                    )}
                    <button
                      style={styles.removeExpBtn}
                      onClick={() => handleRemoveExperience(trip.originalIndex, expIndex)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {destConnections.length > 0 && (
            <div style={styles.connectionsSection}>
              <div style={styles.connectionsSectionLabel}>
                Connections Going ({destConnections.length})
              </div>
              <div style={styles.connectionAvatars}>
                {destConnections.map((conn, i) => (
                  <div key={i} style={styles.avatarItem}>
                    {conn.photoURL ? (
                      <img src={conn.photoURL} alt={conn.name} style={styles.avatarImg} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>
                        {conn.name?.charAt(0)}
                      </div>
                    )}
                    <div style={styles.avatarName}>{conn.name?.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.tripActions}>
            <button
              style={styles.addExpBtn}
              onClick={() => navigate(`/destination/${encodeURIComponent(trip.destination)}`)}
            >
              + Add Experiences
            </button>
            <button
              style={styles.removeTripBtn}
              onClick={() => handleRemoveTrip(trip.originalIndex)}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPastTrip = (trip) => (
    <div key={trip.originalIndex} style={styles.pastTripCard}>
      <div style={styles.pastTripHeader}>
        <div style={styles.pastTripDestination}>{trip.destination}</div>
        <div style={styles.completedBadge}>Completed</div>
      </div>
      <div style={styles.pastTripBody}>
        <div style={styles.pastTripDates}>
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </div>
        {trip.experiences && trip.experiences.length > 0 && (
          <div style={styles.pastExpList}>
            {trip.experiences.map((exp, i) => (
              <div key={i} style={styles.pastExpItem}>
                <span>{exp.icon || '🎯'} {exp.name}</span>
                <span style={styles.pastExpPrice}>${exp.price}</span>
                {exp.bookingUrl && (
                  <button
                    style={styles.rebookBtn}
                    onClick={() => window.open(exp.bookingUrl, '_blank')}
                  >
                    Rebook
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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
                }}>▾</span>
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

  if (loading) {
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

      <TabBar />
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#fafafa', paddingBottom: '80px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#6b7280', fontSize: '18px' },

  // Header
  header: { background: '#fff', padding: '24px 20px 16px 20px', borderBottom: '1px solid #f0f0f0' },
  title: { fontSize: '28px', fontWeight: '800', color: '#1f2937', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },

  // Sub-tabs
  subTabsWrapper: { background: '#fff', padding: '12px 20px', borderBottom: '1px solid #f0f0f0' },
  subTabs: { display: 'flex', gap: '8px' },
  subTab: { flex: 1, padding: '12px 16px', background: '#f3f4f6', border: '2px solid transparent', borderRadius: '12px', fontSize: '15px', fontWeight: '700', color: '#6b7280', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' },
  subTabActive: { borderColor: '#059669', color: '#059669', background: '#f0fdf4' },

  // Content
  content: { padding: '20px' },

  // Year groups
  yearList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  yearGroup: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  yearHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' },
  yearLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  yearLabel: { fontSize: '20px', fontWeight: '800', color: '#1f2937' },
  yearCount: { fontSize: '13px', fontWeight: '600', color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: '12px' },
  yearChevron: { fontSize: '18px', color: '#6b7280', transition: 'transform 0.2s', display: 'inline-block' },
  yearTrips: { padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },

  // Empty
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
  emptyText: { fontSize: '15px', color: '#6b7280', marginBottom: '24px' },
  emptyButton: { background: '#059669', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },

  // Upcoming Trip Card
  tripCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  tripHeader: { background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '16px 20px' },
  tripDestination: { color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  tripDatesClickable: { color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  editIcon: { fontSize: '12px', opacity: 0.7 },
  editDatesRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  dateInput: { padding: '6px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', fontFamily: 'inherit', colorScheme: 'dark' },
  dateSaveBtn: { padding: '6px 14px', background: '#fff', color: '#059669', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  dateCancelBtn: { padding: '6px 10px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  tripBody: { padding: '16px 20px' },

  // Experiences in trip
  expSection: { marginBottom: '16px' },
  expSectionLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  expCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '12px', marginBottom: '8px' },
  expIcon: { fontSize: '24px', flexShrink: 0 },
  expDetails: { flex: 1 },
  expName: { fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' },
  expPrice: { fontSize: '16px', fontWeight: '700', color: '#059669' },
  expActions: { display: 'flex', gap: '6px', alignItems: 'center' },
  bookNowBtn: { padding: '8px 14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  removeExpBtn: { width: '28px', height: '28px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '50%', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Connections in trip
  connectionsSection: { marginBottom: '16px' },
  connectionsSectionLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' },
  connectionAvatars: { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px' },
  avatarItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  avatarImg: { width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669' },
  avatarPlaceholder: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' },
  avatarName: { fontSize: '11px', color: '#6b7280', fontWeight: '500' },

  // Trip actions
  tripActions: { display: 'flex', gap: '8px' },
  addExpBtn: { flex: 1, padding: '12px', background: '#f0fdf4', color: '#059669', border: '2px solid #059669', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  removeTripBtn: { padding: '12px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' },

  // Past Trip Card
  pastTripCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', opacity: 0.85 },
  pastTripHeader: { background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pastTripDestination: { color: '#fff', fontSize: '16px', fontWeight: '700' },
  completedBadge: { background: 'rgba(255,255,255,0.25)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
  pastTripBody: { padding: '14px 20px' },
  pastTripDates: { fontSize: '13px', color: '#6b7280', marginBottom: '10px' },
  pastExpList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pastExpItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4b5563' },
  pastExpPrice: { color: '#6b7280', fontWeight: '600', marginLeft: 'auto' },
  rebookBtn: { padding: '6px 12px', background: '#f0fdf4', color: '#059669', border: '1px solid #059669', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
};

export default Saved;
