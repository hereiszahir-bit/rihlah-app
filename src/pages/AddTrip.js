import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import DateRangePicker from '../components/DateRangePicker';
import CURATED_DESTINATIONS from '../data/destinations';
import { colors, fonts, radius, components } from '../design';

function AddTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserData, refreshAll } = useUser();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overlapError, setOverlapError] = useState('');
  const [inviteData, setInviteData] = useState(null);

  const existingTrips = currentUserData?.upcomingTrips || [];

  useEffect(() => {
    if (location.state?.inviteData) {
      setInviteData(location.state.inviteData);
    }
    if (location.state?.preselectedDestination) {
      setDestination(location.state.preselectedDestination);
      setStep(2);
    }
  }, [location]);

  const handleDestinationSelect = (dest) => {
    setDestination(dest.name);
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
      const newStartsBeforeExistingEnds = ns.getTime() < tripEnd.getTime();
      const newEndsAfterExistingStarts = ne.getTime() > tripStart.getTime();
      const overlaps = newStartsBeforeExistingEnds && newEndsAfterExistingStarts;

      if (overlaps) {
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

      // Check if already connected
      const alreadyConnected = (myData?.connections || []).some(c => c.userId === inviterId);
      if (alreadyConnected) return;

      // Add mutual connection
      const myConnection = {
        userId: inviterId,
        name: inviterData.name || '',
        photoURL: inviterData.photoURL || '',
        connectedAt: new Date().toISOString(),
      };
      const theirConnection = {
        userId: userId,
        name: myData?.name || '',
        photoURL: myData?.photoURL || '',
        connectedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, {
        connections: arrayUnion(myConnection),
      });
      await updateDoc(inviterRef, {
        connections: arrayUnion(theirConnection),
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

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        upcomingTrips: arrayUnion({
          destination: destination,
          startDate: newStart,
          endDate: newEnd
        })
      });

      // Auto-connect with inviter if this came from an invite
      if (inviteData?.inviterId && inviteData.inviterId !== user.uid) {
        await connectWithInviter(user.uid, inviteData.inviterId);
      }

      await refreshAll();
      // Navigate to the new trip (it's the last one in the array)
      const updatedTrips = [...(currentUserData?.upcomingTrips || []), { destination, startDate: newStart, endDate: newEnd }];
      navigate(`/trip/${updatedTrips.length - 1}`);
    } catch (error) {
      console.error('Error saving trip:', error);
      setSaving(false);
    }
  };

  const existingDestinations = new Set(existingTrips.map(t => t.destination));

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
          <p style={styles.subtitle}>Pick a destination</p>
        )}
      </div>

      <div style={styles.content}>
        {step === 1 && (
          <div style={styles.step}>
            <div style={styles.destList}>
              {(() => {
                const featured = CURATED_DESTINATIONS.filter(d => d.featured);
                const rest = CURATED_DESTINATIONS.filter(d => !d.featured);
                const renderItem = (dest) => {
                  const hasTrip = existingDestinations.has(dest.name);
                  return (
                    <button
                      key={dest.id}
                      style={styles.destItem}
                      onClick={() => handleDestinationSelect(dest)}
                    >
                      <div
                        style={{
                          ...styles.destThumb,
                          backgroundImage: `url(${dest.image})`,
                        }}
                      />
                      <div style={styles.destInfo}>
                        <div style={styles.destCity}>{dest.city}, {dest.country}</div>
                        <div style={styles.destDesc}>
                          {dest.description.length > 60 ? dest.description.slice(0, 60) + '...' : dest.description}
                        </div>
                      </div>
                      {hasTrip ? (
                        <div style={styles.destCheck}><FiCheck size={14} /></div>
                      ) : (
                        <div style={styles.destChevron}>›</div>
                      )}
                    </button>
                  );
                };
                return (
                  <>
                    {featured.map(renderItem)}
                    {rest.length > 0 && (
                      <div style={styles.destSeparator}>More destinations</div>
                    )}
                    {rest.map(renderItem)}
                  </>
                );
              })()}
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
                  onClick={() => setStep(1)}
                >
                  Change
                </button>
              )}
            </div>

            {inviteData && (
              <div style={styles.inviteBanner}>
                <div style={styles.inviteBannerText}>
                  {inviteData.inviterName?.split(' ')[0]} is going {inviteData.startDate && inviteData.endDate
                    ? `${new Date(inviteData.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(inviteData.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : ''}
                </div>
                <div style={styles.inviteBannerSub}>Pick your dates to join them.</div>
              </div>
            )}

            <DateRangePicker onSelect={handleDateSelect} />

            {overlapError && (
              <div style={styles.overlapError}>
                {overlapError}
              </div>
            )}

            {dates && (
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: saving ? 0.7 : 1
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Journey'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
  },
  header: {
    background: colors.surface,
    padding: '8px 24px 14px',
    borderBottom: `1px solid ${colors.border}`,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: colors.text,
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '8px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '26px',
    fontWeight: '500',
    color: colors.text,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '4px 0 0 0',
  },
  content: {
    padding: '20px 24px',
  },
  step: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  destList: {
    background: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    border: `1px solid ${colors.border}`,
  },
  destItem: {
    display: 'flex',
    gap: '14px',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.lightGray}`,
    alignItems: 'center',
    background: 'none',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  destThumb: {
    width: '64px',
    height: '64px',
    borderRadius: radius.md,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
  },
  destInfo: {
    flex: 1,
    minWidth: 0,
  },
  destCity: {
    fontFamily: fonts.serif,
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '2px',
  },
  destDesc: {
    fontSize: '12px',
    color: colors.textSecondary,
    lineHeight: 1.4,
  },
  destChevron: {
    color: colors.textTertiary,
    fontSize: '18px',
    flexShrink: 0,
  },
  destCheck: {
    color: colors.gold,
    flexShrink: 0,
  },
  destSeparator: {
    padding: '12px 20px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    color: colors.textTertiary,
    borderBottom: `1px solid ${colors.lightGray}`,
  },
  selectedDest: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    marginBottom: '24px',
  },
  selectedText: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: '17px',
    fontWeight: '500',
    color: colors.text,
  },
  changeBtn: {
    padding: '8px 16px',
    background: colors.lightGray,
    border: 'none',
    borderRadius: radius.sm,
    fontSize: '13px',
    fontWeight: '600',
    color: colors.text,
    cursor: 'pointer',
  },
  inviteBanner: {
    padding: '16px 20px',
    background: colors.surface,
    border: `1px solid ${colors.gold}`,
    borderRadius: radius.md,
    marginBottom: '20px',
  },
  inviteBannerText: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '4px',
  },
  inviteBannerSub: {
    fontSize: '13px',
    color: colors.textSecondary,
  },
  overlapError: {
    padding: '14px 16px',
    background: colors.errorBg,
    border: `1.5px solid #fecaca`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '500',
    color: colors.error,
    marginTop: '16px',
    lineHeight: 1.4,
  },
  saveBtn: {
    ...components.btnPrimary,
    marginTop: '24px',
    fontSize: '16px',
    padding: '16px',
  },
};

export default AddTrip;
