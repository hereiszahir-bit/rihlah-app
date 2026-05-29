import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FiArrowRight } from 'react-icons/fi';
import CURATED_DESTINATIONS, { getDestinationImage } from '../data/destinations';
import { colors, fonts, radius, components } from '../design';

const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function Home() {
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers, allUsersMap, connections, needsOnboarding } = useUser();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Assalamu Alaykum';
    if (hour < 17) return 'Assalamu Alaykum';
    return 'Assalamu Alaykum';
  }, []);

  const firstName = currentUserData?.name?.split(' ')[0] || '';

  // Find active trip (user is there now)
  const activeTrip = useMemo(() => {
    const trips = currentUserData?.upcomingTrips || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < trips.length; i++) {
      const start = parseDate(trips[i].startDate);
      const end = parseDate(trips[i].endDate);
      if (today >= start && today <= end) {
        const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return { ...trips[i], index: i, daysLeft };
      }
    }
    return null;
  }, [currentUserData]);

  // Next upcoming trip (if no active trip)
  const nextTrip = useMemo(() => {
    if (activeTrip) return null;
    const trips = currentUserData?.upcomingTrips || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nearest = null;
    let nearestIdx = -1;
    trips.forEach((trip, i) => {
      const start = parseDate(trip.startDate);
      if (start > today && (!nearest || start < parseDate(nearest.startDate))) {
        nearest = trip;
        nearestIdx = i;
      }
    });
    if (!nearest) return null;
    const daysUntil = Math.ceil((parseDate(nearest.startDate) - today) / (1000 * 60 * 60 * 24));
    return { ...nearest, index: nearestIdx, daysUntil };
  }, [currentUserData, activeTrip]);

  // Traveler count for active/next trip
  const tripTravelers = useMemo(() => {
    const trip = activeTrip || nextTrip;
    if (!trip || !currentUser) return 0;

    const myGender = currentUserData?.gender || '';
    const myVisibility = currentUserData?.profileVisibility || 'both';
    const myConnections = (currentUserData?.connections || []).map(c => c.userId);

    let count = 0;
    const myStart = parseDate(trip.startDate);
    const myEnd = parseDate(trip.endDate);

    allUsers.forEach((u) => {
      if (u.id === currentUser.uid) return;
      if (!Array.isArray(u.upcomingTrips)) return;

      if (!myConnections.includes(u.id)) {
        const theirVis = u.profileVisibility || 'both';
        if (theirVis !== 'both' && theirVis !== myGender) return;
        if (myVisibility !== 'both' && u.gender !== myVisibility) return;
      }

      u.upcomingTrips.forEach(ut => {
        if (ut.destination !== trip.destination) return;
        const uStart = parseDate(ut.startDate);
        const uEnd = parseDate(ut.endDate);
        if (uStart <= myEnd && uEnd >= myStart) count++;
      });
    });
    return count;
  }, [activeTrip, nextTrip, currentUser, currentUserData, allUsers]);

  // Connections going somewhere
  const connectionsGoing = useMemo(() => {
    if (!currentUserData?.connections) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const connMap = {};
    currentUserData.connections.forEach(conn => {
      const connUser = allUsersMap[conn.userId];
      if (!connUser?.upcomingTrips) return;

      connUser.upcomingTrips.forEach(trip => {
        const start = parseDate(trip.startDate);
        const end = parseDate(trip.endDate);
        if (end < today) return;
        const isThere = today >= start && today <= end;

        const entry = {
          userId: conn.userId, name: connUser.name, photoURL: connUser.photoURL || '',
          destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, isThere,
        };

        const existing = connMap[conn.userId];
        if (!existing || (isThere && !existing.isThere)) {
          connMap[conn.userId] = entry;
        }
      });
    });

    return Object.values(connMap).sort((a, b) => {
      if (a.isThere && !b.isThere) return -1;
      if (!a.isThere && b.isThere) return 1;
      return parseDate(a.startDate) - parseDate(b.startDate);
    });
  }, [currentUserData, allUsersMap]);

  // Featured destinations for "Curated for you"
  const topDestinations = useMemo(() => {
    return CURATED_DESTINATIONS.filter(d => d.featured);
  }, []);

  const featuredTrip = activeTrip || nextTrip;
  const tripConnections = (currentUserData?.connections || []).filter(c => {
    const cu = allUsersMap[c.userId];
    if (!cu?.upcomingTrips || !featuredTrip) return false;
    return cu.upcomingTrips.some(t => t.destination === featuredTrip.destination);
  }).length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}>Rihlah</div>
        <div
          style={styles.avatar}
          onClick={() => navigate('/profile')}
        >
          {currentUserData?.photoURL ? (
            <img src={currentUserData.photoURL} alt="" style={styles.avatarImg} />
          ) : (
            firstName?.charAt(0) || 'R'
          )}
        </div>
      </div>

      {/* Greeting */}
      <div style={styles.greeting}>
        <div style={styles.greetingText}>
          {greeting}, <em style={styles.greetingName}>{firstName}.</em>
        </div>
        <div style={styles.greetingSub}>Your next journey awaits.</div>
      </div>

      {/* Onboarding Banner */}
      {needsOnboarding && (
        <div style={styles.banner} onClick={() => navigate('/onboarding')}>
          <div style={{ flex: 1 }}>
            <div style={styles.bannerTitle}>Complete your profile</div>
            <div style={styles.bannerText}>Set up your profile to connect with travelers.</div>
          </div>
          <FiArrowRight size={18} color={colors.text} />
        </div>
      )}

      {/* Active / Next Trip Card */}
      {featuredTrip && (
        <div
          style={{
            ...styles.tripCard,
            backgroundImage: `linear-gradient(rgba(26,26,26,0.7), rgba(26,26,26,0.85)), url(${getDestinationImage(featuredTrip.destination)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => navigate(`/trip/${featuredTrip.index}`)}
        >
          <div style={styles.tripEyebrow}>
            {activeTrip ? 'Currently traveling' : 'Up next'}
          </div>
          <div style={styles.tripDest}>{featuredTrip.destination}</div>
          <div style={styles.tripDates}>
            {parseDate(featuredTrip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {parseDate(featuredTrip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={styles.tripStats}>
            <div style={styles.tripStat}>
              <div style={styles.tripStatValue}>{tripTravelers}</div>
              <div style={styles.tripStatLabel}>Travelers {activeTrip ? 'here' : 'going'}</div>
            </div>
            <div style={styles.tripStat}>
              <div style={styles.tripStatValue}>{tripConnections}</div>
              <div style={styles.tripStatLabel}>Connections</div>
            </div>
            <div style={styles.tripStat}>
              <div style={styles.tripStatValue}>
                {activeTrip ? activeTrip.daysLeft : nextTrip?.daysUntil}
              </div>
              <div style={styles.tripStatLabel}>
                {activeTrip ? 'Days left' : 'Days away'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No trip prompt */}
      {!featuredTrip && !needsOnboarding && (
        <div style={styles.banner} onClick={() => navigate('/add-trip')}>
          <div style={{ flex: 1 }}>
            <div style={styles.bannerTitle}>Where are you headed?</div>
            <div style={styles.bannerText}>Add your first journey to see who else will be there.</div>
          </div>
          <FiArrowRight size={18} color={colors.textTertiary} />
        </div>
      )}


      {/* Companions Going */}
      {connectionsGoing.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Companions</h2>
          </div>
          <div style={styles.companionScroll}>
            {connectionsGoing.map((conn, index) => (
              <Link
                key={`${conn.userId}-${index}`}
                to={`/destination/${encodeURIComponent(conn.destination)}`}
                style={styles.companionItem}
              >
                <div style={{
                  ...styles.companionRing,
                  background: conn.isThere ? colors.dark : colors.warmGray,
                }}>
                  {conn.photoURL ? (
                    <img src={conn.photoURL} alt={conn.name} style={styles.companionImg} />
                  ) : (
                    <div style={styles.companionPlaceholder}>{conn.name?.charAt(0)}</div>
                  )}
                </div>
                <div style={styles.companionDest}>{conn.destination.split(',')[0]}</div>
                <div style={styles.companionName}>{conn.name?.split(' ')[0]}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Curated for you */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionEyebrow}>Curated for you</div>
          <h2 style={styles.sectionTitle}>Where to next</h2>
        </div>
        <div style={styles.curatedList}>
          {topDestinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/destination/${encodeURIComponent(dest.name)}`}
              style={styles.curatedCard}
            >
              <div
                style={{
                  ...styles.curatedImg,
                  backgroundImage: `url(${dest.image})`,
                }}
              />
              <div style={styles.curatedBody}>
                <div style={styles.curatedTitle}>{dest.city}</div>
                <div style={styles.curatedDesc}>
                  {dest.description.length > 70 ? dest.description.slice(0, 70) + '...' : dest.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ padding: '0 24px', marginTop: '4px' }}>
          <button style={styles.seeAllBtn} onClick={() => navigate('/destinations')}>
            See all destinations
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg, paddingBottom: '90px' },

  // Header
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 0' },
  brand: { fontFamily: fonts.serif, fontSize: '28px', fontWeight: '700', color: colors.text, letterSpacing: '-0.5px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: colors.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.cream, fontWeight: '600', fontSize: '12px', cursor: 'pointer', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  // Greeting
  greeting: { padding: '16px 24px 24px' },
  greetingText: { fontFamily: fonts.serif, fontSize: '32px', fontWeight: '500', color: colors.text, lineHeight: 1.2, letterSpacing: '-0.3px' },
  greetingName: { fontStyle: 'italic', color: colors.textSecondary },
  greetingSub: { marginTop: '8px', fontSize: '14px', color: colors.textSecondary },

  // Banner
  banner: { margin: '0 24px 24px', padding: '16px 20px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' },
  bannerTitle: { fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' },
  bannerText: { fontSize: '13px', color: colors.textSecondary, lineHeight: 1.4 },

  // Active Trip Card
  tripCard: { margin: '0 24px 24px', padding: '20px', background: colors.dark, borderRadius: radius.lg, color: colors.cream, cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  tripEyebrow: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textMuted, marginBottom: '8px' },
  tripDest: { fontFamily: fonts.serif, fontSize: '24px', fontWeight: '600', marginBottom: '4px' },
  tripDates: { fontSize: '13px', color: 'rgba(248,246,242,0.6)', marginBottom: '16px' },
  tripStats: { display: 'flex', gap: '20px' },
  tripStat: {},
  tripStatValue: { fontSize: '20px', fontWeight: '700', color: colors.cream },
  tripStatLabel: { fontSize: '11px', color: 'rgba(248,246,242,0.5)', fontWeight: '500' },


  // Sections
  section: { marginBottom: '28px' },
  sectionHeader: { padding: '0 24px', marginBottom: '14px' },
  sectionEyebrow: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textTertiary, marginBottom: '6px' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: '22px', fontWeight: '600', color: colors.text, margin: 0 },

  // Companions
  companionScroll: { display: 'flex', overflowX: 'auto', gap: '16px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' },
  companionItem: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '72px', gap: '5px', textDecoration: 'none' },
  companionRing: { width: '60px', height: '60px', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  companionImg: { width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.bg}` },
  companionPlaceholder: { width: '54px', height: '54px', borderRadius: '50%', background: colors.lightGray, border: `2px solid ${colors.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600', color: colors.textSecondary },
  companionDest: { fontSize: '11px', fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 1.2, maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  companionName: { fontSize: '10px', color: colors.textTertiary, fontWeight: '500', textAlign: 'center' },

  // Curated destinations
  curatedList: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 24px' },
  curatedCard: { display: 'flex', borderRadius: radius.lg, overflow: 'hidden', background: colors.surface, border: `1px solid ${colors.border}`, textDecoration: 'none' },
  curatedImg: { width: '120px', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 },
  curatedBody: { padding: '16px', flex: 1 },
  curatedTitle: { fontFamily: fonts.serif, fontSize: '17px', fontWeight: '600', color: colors.text, marginBottom: '4px' },
  curatedDesc: { fontSize: '12px', color: colors.textSecondary, lineHeight: 1.5 },
  seeAllBtn: { width: '100%', padding: '14px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '14px', fontWeight: '600', color: colors.text, cursor: 'pointer', fontFamily: 'inherit' },
};

export default Home;
