import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import DateRangePicker from '../components/DateRangePicker';

function AddTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overlapError, setOverlapError] = useState('');
  const [existingTrips, setExistingTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityDebounceRef = useRef(null);

  // Load existing trips and check for preselected destination
  useEffect(() => {
    const loadTrips = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setExistingTrips(userDoc.data().upcomingTrips || []);
        }
      }
    };
    loadTrips();

    if (location.state?.preselectedDestination) {
      setDestination(location.state.preselectedDestination);
      setStep(2);
    }
  }, [location]);

  const searchCities = useCallback(async (query) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&featuretype=city`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const cities = data
        .filter(item => item.address && (item.address.city || item.address.town || item.address.village || item.address.state))
        .map(item => {
          const addr = item.address;
          const cityName = addr.city || addr.town || addr.village || addr.state || '';
          const country = addr.country || '';
          return `${cityName}, ${country}`;
        })
        .filter((v, i, arr) => arr.indexOf(v) === i);
      setCitySuggestions(cities);
    } catch {
      setCitySuggestions([]);
    }
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => searchCities(value), 300);
  };

  const selectSearchCity = (city) => {
    setDestination(city);
    setSearchQuery('');
    setShowSuggestions(false);
    setCitySuggestions([]);
    setStep(2);
  };

  const popularDestinations = [
    'Istanbul, Turkey',
    'Dubai, UAE',
    'Kuala Lumpur, Malaysia',
    'Marrakech, Morocco',
    'Cairo, Egypt',
    'Jakarta, Indonesia',
    'Barcelona, Spain',
    'London, UK',
  ];

  const handleDestinationSelect = (dest) => {
    setDestination(dest);
    setStep(2);
  };


  const handleDateSelect = (range) => {
    setDates(range);
    setOverlapError('');
  };

  const parseDate = (dateStr) => {
    // Parse "YYYY-MM-DD" as local date to avoid timezone issues
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const checkOverlap = (newStart, newEnd) => {
    const ns = parseDate(newStart);
    const ne = parseDate(newEnd);

    for (const trip of existingTrips) {
      const tripStart = parseDate(trip.startDate);
      const tripEnd = parseDate(trip.endDate);

      // Allow same-day transitions: new starts on day existing ends, or new ends on day existing starts
      // Block: new start is before existing end AND new end is after existing start (true overlap)
      // But exclude the boundary case where they share exactly one day
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

    // Check for overlapping trips
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
      navigate('/destinations');
    } catch (error) {
      console.error('Error saving trip:', error);
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 style={styles.title}>
          {step === 1 ? 'Where to?' : 'When are you going?'}
        </h1>
      </div>

      <div style={styles.content}>
        {/* Step 1: Destination Selection */}
        {step === 1 && (
          <div style={styles.step}>
            {/* Search Input with Autocomplete */}
            <div style={styles.searchWrapper}>
              <div style={styles.searchBox}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search any city..."
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => citySuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="off"
                />
              </div>
              {showSuggestions && citySuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  {citySuggestions.map((city, i) => (
                    <button
                      key={i}
                      style={styles.suggestionItem}
                      onMouseDown={() => selectSearchCity(city)}
                    >
                      <span style={{ marginRight: '8px' }}>📍</span> {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Destinations */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Popular Destinations</h3>
              <div style={styles.grid}>
                {popularDestinations.map((dest, index) => (
                  <button
                    key={index}
                    style={styles.destCard}
                    onClick={() => handleDestinationSelect(dest)}
                  >
                    <span style={styles.destIcon}>📍</span>
                    <span style={styles.destName}>{dest}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Date Selection */}
        {step === 2 && (
          <div style={styles.step}>
            {/* Selected Destination */}
            <div style={styles.selectedDest}>
              <span style={styles.selectedIcon}>📍</span>
              <span style={styles.selectedText}>{destination}</span>
              <button
                style={styles.changeBtn}
                onClick={() => setStep(1)}
              >
                Change
              </button>
            </div>

            {/* Date Picker */}
            <DateRangePicker onSelect={handleDateSelect} />

            {/* Overlap Error */}
            {overlapError && (
              <div style={styles.overlapError}>
                <span style={styles.overlapIcon}>⚠️</span>
                {overlapError}
              </div>
            )}

            {/* Add Trip Button */}
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
    background: '#fafafa',
  },
  header: {
    background: '#fff',
    padding: '20px',
    borderBottom: '1px solid #f0f0f0',
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
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    margin: 0,
  },
  content: {
    padding: '20px',
  },
  step: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: '32px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
  },
  searchIcon: {
    fontSize: '20px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    color: '#1f2937',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 16px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  destCard: {
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  destIcon: {
    fontSize: '24px',
  },
  destName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
    zIndex: 50,
    maxHeight: '240px',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  suggestionItem: {
    width: '100%',
    padding: '14px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '15px',
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
  },
  selectedDest: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#f0fdf4',
    border: '2px solid #059669',
    borderRadius: '12px',
    marginBottom: '24px',
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
    padding: '8px 16px',
    background: '#fff',
    border: '2px solid #059669',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#059669',
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
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '17px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '24px',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
  },
};

export default AddTrip;