import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiMapPin, FiCheck } from 'react-icons/fi';
import DateRangePicker from '../components/DateRangePicker';
import CURATED_DESTINATIONS from '../data/destinations';

function AddTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUserData, refreshAll } = useUser();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overlapError, setOverlapError] = useState('');

  const existingTrips = currentUserData?.upcomingTrips || [];

  useEffect(() => {
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
        return `Overlaps with your trip to ${dest} (${tripStartStr} - ${tripEndStr})`;
      }
    }
    return null;
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
      await refreshAll();
      navigate('/destinations');
    } catch (error) {
      console.error('Error saving trip:', error);
      setSaving(false);
    }
  };

  // Check which destinations the user already has trips to
  const existingDestinations = new Set(existingTrips.map(t => t.destination));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
        </button>
        <h1 style={styles.title}>
          {step === 1 ? 'Where to?' : 'When are you going?'}
        </h1>
        {step === 1 && (
          <p style={styles.subtitle}>Pick a destination</p>
        )}
      </div>

      <div style={styles.content}>
        {step === 1 && (
          <div style={styles.step}>
            <div style={styles.grid}>
              {CURATED_DESTINATIONS.map((dest) => {
                const hasTrip = existingDestinations.has(dest.name);
                return (
                  <button
                    key={dest.id}
                    style={styles.destCard}
                    onClick={() => handleDestinationSelect(dest)}
                  >
                    <div
                      style={{
                        ...styles.destImage,
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.05), rgba(0,0,0,0.55)), url(${dest.image})`,
                      }}
                    >
                      {hasTrip && (
                        <div style={styles.hasTrip}>
                          <FiCheck size={12} /> Trip added
                        </div>
                      )}
                      <div style={styles.destOverlay}>
                        <div style={styles.destCity}>{dest.city}</div>
                        <div style={styles.destCountry}>{dest.country}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.step}>
            <div style={styles.selectedDest}>
              <span style={styles.selectedIcon}><FiMapPin size={20} color="#047857" /></span>
              <span style={styles.selectedText}>{destination}</span>
              <button
                style={styles.changeBtn}
                onClick={() => setStep(1)}
              >
                Change
              </button>
            </div>

            <DateRangePicker onSelect={handleDateSelect} />

            {overlapError && (
              <div style={styles.overlapError}>
                <span style={styles.overlapIcon}>!</span>
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
                {saving ? 'Adding Trip...' : 'Add Trip'}
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
    background: '#faf9f7',
  },
  header: {
    background: '#fff',
    padding: '8px 20px 12px',
    borderBottom: '1px solid #e8e5e0',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#059669',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '8px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  content: {
    padding: '20px',
  },
  step: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  destCard: {
    background: 'none',
    border: 'none',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)',
  },
  destImage: {
    width: '100%',
    height: '140px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  destOverlay: {
    padding: '12px',
  },
  destCity: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#fff',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  destCountry: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.85)',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  hasTrip: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(4,120,87,0.9)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  selectedDest: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f0fdf4',
    border: 'none',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  },
  selectedIcon: {
    fontSize: '24px',
  },
  selectedText: {
    flex: 1,
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  changeBtn: {
    padding: '10px 16px',
    background: '#f0f9f4',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#047857',
    cursor: 'pointer',
  },
  overlapError: {
    padding: '14px 16px',
    background: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc2626',
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    lineHeight: 1.4,
  },
  overlapIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  saveBtn: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #047857, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '17px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '24px',
    boxShadow: '0 2px 8px rgba(4,120,87,0.3)',
  },
};

export default AddTrip;
