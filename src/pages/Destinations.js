import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import DestinationGrid from '../components/DestinationGrid';
import TabBar from '../components/TabBar';

const FEATURED_CITIES = [
  { name: 'Mecca', country: 'Saudi Arabia', image: 'https://images.pexels.com/photos/2291789/pexels-photo-2291789.jpeg?auto=compress&w=600' },
  { name: 'Istanbul', country: 'Turkey', image: 'https://images.pexels.com/photos/1559825/pexels-photo-1559825.jpeg?auto=compress&w=600' },
  { name: 'Dubai', country: 'UAE', image: 'https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&w=600' },
  { name: 'Kuala Lumpur', country: 'Malaysia', image: 'https://images.pexels.com/photos/3881104/pexels-photo-3881104.jpeg?auto=compress&w=600' },
  { name: 'Marrakech', country: 'Morocco', image: 'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&w=600' },
];

function Destinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [connectionsGoing, setConnectionsGoing] = useState([]);
  const [travelerCounts, setTravelerCounts] = useState({});
  const [featuredFullNames, setFeaturedFullNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [previewUser, setPreviewUser] = useState(null);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = auth.currentUser;
      let currentUserData = null;

      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          currentUserData = userDoc.data();
        }
      }

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const destinationMap = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const myGender = currentUserData?.gender || '';
      const myVisibility = currentUserData?.profileVisibility || 'both';

      // Build a map of userId -> userData for connection lookups
      const allUsersMap = {};

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        allUsersMap[docSnap.id] = { id: docSnap.id, ...userData };

        // Skip current user from counts (they won't see themselves in destination detail either)
        if (docSnap.id === currentUser?.uid) return;

        // Skip users hidden by visibility preferences
        const theirVisibility = userData.profileVisibility || 'both';
        if (theirVisibility !== 'both' && theirVisibility !== myGender) return;
        if (myVisibility !== 'both' && userData.gender !== myVisibility) return;

        if (userData.upcomingTrips && userData.upcomingTrips.length > 0) {
          // Group by destination — each user counts once per destination
          const userDestStatus = {}; // dest -> 'hereNow' | 'planning'

          userData.upcomingTrips.forEach((trip) => {
            const dest = trip.destination;
            const startDate = new Date(trip.startDate);
            const endDate = new Date(trip.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            const isTripNow = today >= startDate && today <= endDate;

            if (isTripNow) {
              userDestStatus[dest] = 'hereNow'; // hereNow takes priority
            } else if (today < startDate && userDestStatus[dest] !== 'hereNow') {
              userDestStatus[dest] = 'planning';
            }
          });

          Object.entries(userDestStatus).forEach(([dest, status]) => {
            if (!destinationMap[dest]) {
              destinationMap[dest] = { name: dest, planningCount: 0, thereNowCount: 0 };
            }
            if (status === 'hereNow') {
              destinationMap[dest].thereNowCount++;
            } else {
              destinationMap[dest].planningCount++;
            }
          });
        }

        if (userData.currentLocation && userData.currentLocation.destination) {
          const dest = userData.currentLocation.destination;
          const checkoutDate = userData.currentLocation.checkingOutAt;
          const isStillThere = !checkoutDate || new Date(checkoutDate) > today;

          if (isStillThere) {
            if (!destinationMap[dest]) {
              destinationMap[dest] = { name: dest, planningCount: 0, thereNowCount: 0 };
            }

            const alreadyCounted = userData.upcomingTrips?.some(trip => {
              if (trip.destination !== dest) return false;
              const start = new Date(trip.startDate);
              const end = new Date(trip.endDate);
              start.setHours(0, 0, 0, 0);
              end.setHours(23, 59, 59, 999);
              return today >= start && today <= end;
            });

            if (!alreadyCounted) {
              destinationMap[dest].thereNowCount++;
            }
          }
        }
      });

      // Build traveler counts for featured cities — match by city name prefix
      const counts = {};
      const fullNames = {};
      const destKeys = Object.keys(destinationMap);
      FEATURED_CITIES.forEach(city => {
        const matchKey = destKeys.find(key =>
          key === city.name || key.split(',')[0].trim() === city.name
        );
        if (matchKey) {
          const cityData = destinationMap[matchKey];
          counts[city.name] = { thereNow: cityData.thereNowCount, planning: cityData.planningCount };
          fullNames[city.name] = matchKey;
        } else {
          counts[city.name] = { thereNow: 0, planning: 0 };
          fullNames[city.name] = city.name;
        }
      });
      setTravelerCounts(counts);
      setFeaturedFullNames(fullNames);

      // Build connections going list — one entry per connection, most relevant trip
      if (currentUserData && currentUserData.connections) {
        const connMap = {}; // userId -> best trip entry

        currentUserData.connections.forEach(conn => {
          const connUser = allUsersMap[conn.userId];
          if (!connUser || !connUser.upcomingTrips) return;

          connUser.upcomingTrips.forEach(trip => {
            const startDate = new Date(trip.startDate);
            const endDate = new Date(trip.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            if (endDate < today) return; // skip past trips

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
              // "there now" takes priority over upcoming
              connMap[conn.userId] = entry;
            } else if (!existing.isThere && !isThere && new Date(trip.startDate) < new Date(existing.startDate)) {
              // soonest upcoming takes priority
              connMap[conn.userId] = entry;
            }
          });
        });

        const connTrips = Object.values(connMap);
        // Sort: there now first, then by start date
        connTrips.sort((a, b) => {
          if (a.isThere && !b.isThere) return -1;
          if (!a.isThere && b.isThere) return 1;
          return new Date(a.startDate) - new Date(b.startDate);
        });
        setConnectionsGoing(connTrips);
      }

      const destinationsArray = Object.values(destinationMap).sort((a, b) => {
        const totalA = a.planningCount + a.thereNowCount;
        const totalB = b.planningCount + b.thereNowCount;
        return totalB - totalA;
      });

      setDestinations(destinationsArray);
      setUsersMap(allUsersMap);
      setLoading(false);
    } catch (error) {
      console.error('Error loading destinations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <img src="/logo.svg" alt="Rihlah" style={styles.headerLogo} />
            <h1 style={styles.title}>Explore</h1>
          </div>
          <p style={styles.subtitle}>Discover where Muslims travel</p>
        </div>
        <div style={styles.loading}>
          <img src="/logo.svg" alt="Loading" style={styles.loadingLogo} />
          <div style={styles.loadingText}>Loading destinations...</div>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <img src="/logo.svg" alt="Rihlah" style={styles.headerLogo} />
          <h1 style={styles.title}>Explore</h1>
        </div>
        <p style={styles.subtitle}>Discover where Muslims travel</p>
      </div>

      {/* Connections Section */}
      {connectionsGoing.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Connections</h2>
          </div>
          <div style={styles.horizontalScroll}>
            {connectionsGoing.map((conn, index) => (
              <div
                key={`${conn.userId}-${conn.destination}-${index}`}
                style={styles.storyItem}
              >
                <div
                  style={{
                    ...styles.storyRing,
                    ...(conn.isThere ? styles.storyRingActive : styles.storyRingUpcoming),
                  }}
                  onClick={() => setPreviewUser(usersMap[conn.userId] || null)}
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
                  {conn.isThere ? '📍' : '✈️'} {conn.destination.split(',')[0]}
                </Link>
                <div style={styles.storyName}>{conn.name?.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Featured</h2>
        </div>
        <div style={styles.horizontalScroll}>
          {FEATURED_CITIES.map((city) => (
            <Link
              key={city.name}
              to={`/destination/${encodeURIComponent(featuredFullNames[city.name] || city.name)}`}
              style={styles.featuredCard}
            >
              <div
                style={{
                  ...styles.featuredImage,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${city.image})`,
                }}
              >
                <div style={styles.featuredOverlay}>
                  <h3 style={styles.featuredName}>{city.name}</h3>
                  <p style={styles.featuredCountry}>{city.country}</p>
                  {(() => {
                    const c = travelerCounts[city.name] || { thereNow: 0, planning: 0 };
                    if (c.thereNow === 0 && c.planning === 0) {
                      return <div style={styles.featuredTravelers}>Be the first</div>;
                    }
                    return (
                      <div style={styles.featuredMetrics}>
                        {c.thereNow > 0 && (
                          <div style={styles.featuredMetric}>
                            <span style={styles.featuredMetricIcon}>📍</span> {c.thereNow} here now
                          </div>
                        )}
                        {c.planning > 0 && (
                          <div style={styles.featuredMetric}>
                            <span style={styles.featuredMetricIcon}>✈️</span> {c.planning} planning
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (() => {
        const allTrips = previewUser.upcomingTrips || [];
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button style={styles.modalClose} onClick={() => setPreviewUser(null)}>×</button>
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
                      💬 WhatsApp
                    </a>
                  )}
                  {previewUser.instagram && (
                    <a href={`https://instagram.com/${previewUser.instagram}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                      📷 @{previewUser.instagram}
                    </a>
                  )}
                </div>
              )}

              {allTrips.length > 0 && (
                <div style={styles.modalTripsSection}>
                  <div style={styles.modalTripsTitle}>Trips</div>
                  {allTrips.map((trip, i) => {
                    const start = new Date(trip.startDate);
                    const end = new Date(trip.endDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isThere = today >= start && today <= end;
                    const isUpcoming = today < start;
                    return (
                      <div key={i} style={styles.modalTripItem}>
                        <span style={styles.modalTripIcon}>{isThere ? '📍' : isUpcoming ? '✈️' : '✓'}</span>
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
        );
      })()}

      {/* More Destinations Section */}
      {(() => {
        const featuredNames = new Set(FEATURED_CITIES.map(c => c.name));
        const nonFeatured = destinations.filter(dest => !featuredNames.has(dest.name.split(',')[0].trim()));
        return nonFeatured.length > 0 ? (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>More Destinations</h2>
            </div>
            <DestinationGrid destinations={nonFeatured} />
          </div>
        ) : null;
      })()}

      <button
        style={styles.fab}
        onClick={() => navigate('/add-trip')}
      >
        <span style={styles.fabIcon}>✈️</span>
      </button>

      <TabBar />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#fafafa',
    paddingBottom: '80px',
  },
  header: {
    padding: '24px 20px 16px 20px',
    background: '#fff',
    borderBottom: '1px solid #f0f0f0',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1f2937',
    margin: '0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b7280',
    margin: 0,
  },
  loading: {
    minHeight: '50vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
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
    color: '#1f2937',
    margin: 0,
  },

  // Horizontal scroll container
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

  // Featured cards
  featuredCard: {
    flexShrink: 0,
    width: '180px',
    borderRadius: '16px',
    overflow: 'hidden',
    textDecoration: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  featuredImage: {
    width: '180px',
    height: '240px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
  },
  featuredOverlay: {
    width: '100%',
    padding: '16px',
  },
  featuredName: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 2px 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  featuredCountry: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    margin: '0 0 8px 0',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  featuredTravelers: {
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
  featuredMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  featuredMetric: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  featuredMetricIcon: {
    fontSize: '13px',
  },

  // Stories-style connection items
  storyItem: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '76px',
    gap: '6px',
  },
  storyRing: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    padding: '3px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    background: 'linear-gradient(135deg, #059669, #10b981)',
  },
  storyRingUpcoming: {
    background: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
  },
  storyImg: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #fff',
  },
  storyPlaceholder: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#f3f4f6',
    border: '3px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#6b7280',
  },
  storyDest: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#059669',
    textDecoration: 'none',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: '76px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  storyName: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '76px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Profile Preview Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: '#fff', borderRadius: '24px', padding: '32px 24px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', textAlign: 'center' },
  modalClose: { position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: '20px', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalPhotoWrap: { marginBottom: '16px' },
  modalPhoto: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0fdf4' },
  modalPhotoPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', margin: '0 auto' },
  modalName: { fontSize: '22px', fontWeight: '800', color: '#1f2937', margin: '0 0 4px 0' },
  modalGender: { fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' },
  modalBio: { fontSize: '15px', color: '#374151', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 16px 0', padding: '0 8px' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { padding: '6px 14px', background: '#f3f4f6', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#374151' },
  modalSocials: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: '#f3f4f6', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { textAlign: 'left', marginBottom: '16px' },
  modalTripsTitle: { fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'left' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '10px', marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0 },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontSize: '14px', fontWeight: '700', color: '#1f2937' },
  modalTripDates: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '700', color: '#059669', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalConnectedBadge: { width: '100%', padding: '14px', background: '#f0fdf4', color: '#059669', border: '2px solid #bbf7d0', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },

  // FAB
  fab: {
    position: 'fixed',
    bottom: '100px',
    right: '20px',
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    border: 'none',
    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
    zIndex: 999,
  },
  fabIcon: {
    fontSize: '28px',
  },
};

export default Destinations;
