import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, setDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiCheck, FiSearch } from 'react-icons/fi';
import DateRangePicker from '../components/DateRangePicker';
import PLACES, { getPlaceById } from '../data/places';
import WORLD_CITIES from '../data/worldCities';
import { colors, fonts, radius, components } from '../design';

const PLACE_IDS = new Set(PLACES.map(p => p.id));
const PLACE_MAP = Object.fromEntries(PLACES.map(p => [p.id, p]));

function AddTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserData, refreshAll } = useUser();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dates, setDates] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overlapError, setOverlapError] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const inputRef = useRef(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const existingTrips = currentUserData?.upcomingTrips || [];
  const existingIds = new Set(existingTrips.map(t => t.destinationId).filter(Boolean));

  useEffect(() => {
    if (location.state?.inviteData) {
      const inv = location.state.inviteData;
      setInviteData(inv);
      // Pre-fill dates from the invite so joining is one tap
      if (inv.startDate && inv.endDate) {
        const [sy, sm, sd] = inv.startDate.split('-').map(Number);
        const [ey, em, ed] = inv.endDate.split('-').map(Number);
        setDates({
          startDate: new Date(sy, sm - 1, sd),
          endDate: new Date(ey, em - 1, ed),
          key: 'selection',
        });
      }
      // Set destination directly from invite if available
      if (inv.destination) {
        setDestination(inv.destination);
        const destId = inv.destinationId || location.state.preselectedDestinationId ||
          inv.destination.split(',')[0].toLowerCase().replace(/\s+/g, '-');
        setDestinationId(destId);
        setStep(2);
        return; // Skip the preselected checks below — invite has everything
      }
    }
    if (location.state?.preselectedDestinationId) {
      const place = getPlaceById(location.state.preselectedDestinationId);
      const city = place || WORLD_CITIES.find(c => c.id === location.state.preselectedDestinationId);
      if (city) {
        setDestination(place ? `${place.city}, ${place.country}` : `${city.city}, ${city.country}`);
        setDestinationId(city.id);
        setStep(2);
      }
    } else if (location.state?.preselectedDestination) {
      const place = PLACES.find(p =>
        `${p.city}, ${p.country}` === location.state.preselectedDestination ||
        p.city === location.state.preselectedDestination
      );
      setDestination(place ? `${place.city}, ${place.country}` : location.state.preselectedDestination);
      setDestinationId(place ? place.id : '');
      setStep(2);
    }
  }, [location]);

  // Search results — curated destinations float to top with images
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      // Show places with guides or experiences when search is empty
      return PLACES.map(p => ({
        id: p.id,
        city: p.city,
        country: p.country,
        hasGuide: p.hasGuide,
        hasPlace: true,
        image: p.image,
        description: p.description,
      }));
    }

    // Search world cities
    const matches = WORLD_CITIES.filter(c =>
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );

    return matches
      .map(c => ({
        id: c.id,
        city: c.city,
        country: c.country,
        hasGuide: PLACE_MAP[c.id]?.hasGuide || false,
        hasPlace: PLACE_IDS.has(c.id),
        image: PLACE_MAP[c.id]?.image || null,
        description: PLACE_MAP[c.id]?.description || null,
      }))
      .sort((a, b) => {
        // Places with guides first, then places, then others
        if (a.hasGuide && !b.hasGuide) return -1;
        if (!a.hasGuide && b.hasGuide) return 1;
        if (a.hasPlace && !b.hasPlace) return -1;
        if (!a.hasPlace && b.hasPlace) return 1;
        return a.city.localeCompare(b.city);
      })
      .slice(0, 20);
  }, [searchQuery]);

  const handleSelect = (item) => {
    setDestination(`${item.city}, ${item.country}`);
    setDestinationId(item.id);
    setSearchQuery('');
    setStep(2);
  };

  const handleDateSelect = (range) => {
    setDates(range);
    setOverlapError('');
  };

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const checkOverlap = (newStart, newEnd) => {
    const ns = parseDate(newStart);
    const ne = parseDate(newEnd);

    for (const trip of existingTrips) {
      const tripStart = parseDate(trip.startDate);
      const tripEnd = parseDate(trip.endDate);
      if (ns.getTime() < tripEnd.getTime() && ne.getTime() > tripStart.getTime()) {
        const dest = trip.destination.split(',')[0];
        const tripStartStr = tripStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const tripEndStr = tripEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `Overlaps with your trip to ${dest} (${tripStartStr} — ${tripEndStr})`;
      }
    }
    return null;
  };

  const connectWithInviter = async (userId, inviterId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const inviterRef = doc(db, 'users', inviterId);
      const inviterDoc = await getDoc(inviterRef);
      if (!inviterDoc.exists()) return;

      const inviterData = inviterDoc.data();
      const myData = currentUserData;

      if ((myData?.connections || []).some(c => c.userId === inviterId)) return;

      await updateDoc(userRef, {
        connections: arrayUnion({
          userId: inviterId,
          name: inviterData.name || '',
          photoURL: inviterData.photoURL || '',
          connectedAt: new Date().toISOString(),
        }),
      });
      await updateDoc(inviterRef, {
        connections: arrayUnion({
          userId: userId,
          name: myData?.name || '',
          photoURL: myData?.photoURL || '',
          connectedAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error connecting with inviter:', error);
    }
  };

  const handleSave = async () => {
    if (!dates) return;

    const newStart = dates.startDate.toISOString().split('T')[0];
    const newEnd = dates.endDate.toISOString().split('T')[0];

    const overlap = checkOverlap(newStart, newEnd);
    if (overlap) {
      setOverlapError(overlap);
      return;
    }

    setSaving(true);
    const user = auth.currentUser;

    if (!user) {
      setOverlapError('You need to be signed in to add a trip.');
      setSaving(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const tripData = {
        destination: destination,
        destinationId: destinationId,
        startDate: newStart,
        endDate: newEnd,
      };

      try {
        await updateDoc(userRef, {
          upcomingTrips: arrayUnion(tripData),
        });
      } catch (updateErr) {
        // Doc doesn't exist yet (new user) — create with merge
        if (updateErr.code === 'not-found') {
          await setDoc(userRef, {
            upcomingTrips: [tripData],
            onboardingComplete: false,
            email: user.email || '',
          }, { merge: true });
        } else {
          throw updateErr;
        }
      }

      if (inviteData?.inviterId && inviteData.inviterId !== user.uid) {
        await connectWithInviter(user.uid, inviteData.inviterId);
      }

      await refreshAll();
      const updatedTrips = [...(currentUserData?.upcomingTrips || []), { destination, startDate: newStart, endDate: newEnd }];
      navigate(`/trip/${updatedTrips.length - 1}`);
    } catch (error) {
      console.error('Error saving trip:', error);
      setOverlapError('Something went wrong saving your trip. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
        </button>
        <h1 style={styles.title}>
          {step === 1 ? 'New Journey' : inviteData ? 'Join the Journey' : 'When are you going?'}
        </h1>
        {step === 1 && (
          <p style={styles.subtitle}>Where are you headed?</p>
        )}
      </div>

      <div style={styles.content}>
        {step === 1 && (
          <div style={styles.step}>
            {/* Search */}
            <div style={styles.searchWrap}>
              <FiSearch size={16} color={colors.textTertiary} style={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any city"
                style={styles.searchInput}
                autoFocus
              />
            </div>

            {/* Results */}
            <div style={styles.destList}>
              {searchResults.length === 0 ? (
                <div style={styles.noResults}>
                  No cities found for "{searchQuery}"
                </div>
              ) : (
                searchResults.map(item => {
                  const hasTrip = existingIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      style={styles.destItem}
                      onClick={() => handleSelect(item)}
                    >
                      {item.image ? (
                        <div
                          style={{
                            ...styles.destThumb,
                            backgroundImage: `url(${item.image})`,
                          }}
                        />
                      ) : (
                        <div style={styles.destThumbPlaceholder}>
                          <FiSearch size={16} color={colors.textTertiary} />
                        </div>
                      )}
                      <div style={styles.destInfo}>
                        <div style={styles.destCity}>
                          {item.city}, {item.country}
                        </div>
                        {item.hasGuide ? (
                          <div style={styles.destGuideTag}>City guide available</div>
                        ) : (
                          <div style={styles.destDesc}>Community page</div>
                        )}
                      </div>
                      {hasTrip ? (
                        <div style={styles.destCheck}><FiCheck size={14} /></div>
                      ) : (
                        <div style={styles.destChevron}>&rsaquo;</div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.step}>
            <div style={styles.selectedDest}>
              <span style={styles.selectedText}>{destination}</span>
              {!inviteData && (
                <button
                  style={styles.changeBtn}
                  onClick={() => { setStep(1); setSearchQuery(''); }}
                >
                  Change
                </button>
              )}
            </div>

            {inviteData && dates && !showCalendar && (
              <div style={styles.inviteDatesCard}>
                <div style={styles.inviteDatesLabel}>
                  {inviteData.inviterName?.split(' ')[0]}'s dates
                </div>
                <div style={styles.inviteDatesRange}>
                  {dates.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {dates.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <button
                  style={styles.changeDatesBtn}
                  onClick={() => setShowCalendar(true)}
                >
                  Pick different dates
                </button>
              </div>
            )}

            {inviteData && showCalendar && (
              <div style={styles.inviteBanner}>
                <div style={styles.inviteBannerText}>
                  {inviteData.inviterName?.split(' ')[0]} is going {inviteData.startDate && inviteData.endDate
                    ? `${new Date(inviteData.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(inviteData.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : ''}
                </div>
              </div>
            )}

            {(!inviteData || showCalendar) && (
              <DateRangePicker onSelect={handleDateSelect} />
            )}

            {overlapError && (
              <div style={styles.overlapError}>{overlapError}</div>
            )}

            {dates && (
              <button
                style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Adding...' : inviteData ? 'Join the Journey' : 'Add Journey'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg },
  header: {
    background: colors.surface,
    padding: '8px 24px 14px',
    borderBottom: `1px solid ${colors.border}`,
  },
  backBtn: {
    background: 'none', border: 'none', color: colors.text,
    fontSize: '15px', fontWeight: '500', cursor: 'pointer',
    padding: '8px 0', marginBottom: '8px',
    display: 'inline-flex', alignItems: 'center',
  },
  title: {
    fontFamily: fonts.serif, fontSize: '26px', fontWeight: '500',
    color: colors.text, margin: 0, letterSpacing: '-0.3px',
  },
  subtitle: { fontSize: '14px', color: colors.textSecondary, margin: '4px 0 0 0' },
  content: { padding: '20px 24px' },
  step: { maxWidth: '600px', margin: '0 auto' },

  // Search
  searchWrap: { position: 'relative', marginBottom: '16px' },
  searchIcon: {
    position: 'absolute', left: '16px', top: '50%',
    transform: 'translateY(-50%)', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '14px 16px 14px 44px',
    background: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md, fontSize: '15px', fontWeight: '500',
    color: colors.text, fontFamily: fonts.sans, outline: 'none',
    boxSizing: 'border-box',
  },

  // Destination list
  destList: {
    background: colors.surface, borderRadius: radius.lg,
    overflow: 'hidden', border: `1px solid ${colors.border}`,
  },
  destItem: {
    display: 'flex', gap: '14px', padding: '14px 20px',
    borderBottom: `1px solid ${colors.lightGray}`,
    alignItems: 'center', background: 'none', border: 'none',
    width: '100%', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit',
  },
  destThumb: {
    width: '52px', height: '52px', borderRadius: radius.sm,
    backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
  },
  destThumbPlaceholder: {
    width: '52px', height: '52px', borderRadius: radius.sm,
    background: colors.warmGray, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  destInfo: { flex: 1, minWidth: 0 },
  destCity: {
    fontFamily: fonts.serif, fontSize: '15px', fontWeight: '600',
    color: colors.text, marginBottom: '2px',
  },
  destGuideTag: {
    fontSize: '11px', fontWeight: '600', color: colors.terracotta,
  },
  destDesc: {
    fontSize: '11px', color: colors.textTertiary, fontWeight: '500',
  },
  destChevron: {
    color: colors.textTertiary, fontSize: '20px', flexShrink: 0,
  },
  destCheck: { color: colors.gold, flexShrink: 0 },
  noResults: {
    padding: '32px 20px', fontSize: '14px',
    color: colors.textTertiary, textAlign: 'center',
  },

  // Step 2
  selectedDest: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '16px', background: colors.surface,
    border: `1px solid ${colors.border}`, borderRadius: radius.md,
    marginBottom: '24px',
  },
  selectedText: {
    flex: 1, fontFamily: fonts.serif, fontSize: '17px',
    fontWeight: '500', color: colors.text,
  },
  changeBtn: {
    padding: '8px 16px', background: colors.lightGray, border: 'none',
    borderRadius: radius.sm, fontSize: '13px', fontWeight: '600',
    color: colors.text, cursor: 'pointer',
  },
  inviteDatesCard: {
    padding: '24px 20px', background: colors.surface,
    border: `1.5px solid ${colors.gold}`, borderRadius: radius.lg,
    marginBottom: '20px', textAlign: 'center',
  },
  inviteDatesLabel: {
    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '1.5px', color: colors.textTertiary, marginBottom: '10px',
  },
  inviteDatesRange: {
    fontFamily: fonts.serif, fontSize: '20px', fontWeight: '600',
    color: colors.text, marginBottom: '16px', lineHeight: 1.4,
  },
  changeDatesBtn: {
    background: 'none', border: 'none', color: colors.textTertiary,
    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
    textDecoration: 'underline', fontFamily: 'inherit',
  },
  inviteBanner: {
    padding: '16px 20px', background: colors.surface,
    border: `1px solid ${colors.gold}`, borderRadius: radius.md,
    marginBottom: '20px',
  },
  inviteBannerText: {
    fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px',
  },
  inviteBannerSub: { fontSize: '13px', color: colors.textSecondary },
  overlapError: {
    padding: '14px 16px', background: colors.errorBg,
    border: `1.5px solid ${colors.error}`, borderRadius: radius.md,
    fontSize: '14px', fontWeight: '500', color: colors.error,
    marginTop: '16px', lineHeight: 1.4,
  },
  saveBtn: {
    ...components.btnPrimary, marginTop: '24px', fontSize: '16px', padding: '16px',
  },
};

export default AddTrip;
