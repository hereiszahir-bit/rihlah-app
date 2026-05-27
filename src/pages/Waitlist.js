import React, { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

// EmailJS credentials — replace with your actual IDs from emailjs.com
const EMAILJS_SERVICE_ID = 'service_60j9t2o';
const EMAILJS_TEMPLATE_ID = 'template_vs5ri2j';
const EMAILJS_PUBLIC_KEY = 'ghSmKpzOnS5PvRcYj';

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'ref'].forEach(key => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  if (document.referrer && !document.referrer.includes(window.location.hostname)) {
    utm.referrer = document.referrer;
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

const IDENTITY_OPTIONS = [
  'Student', 'Young Professional', 'Solo Traveler', 'Couple',
  'Family', 'Retiree', 'Gap Year', 'Digital Nomad',
];

const INTEREST_GROUPS = [
  {
    label: 'Travel',
    options: ['Hiking', 'Food & Culinary', 'History & Culture', 'Photography', 'Beach', 'Adventure', 'Shopping', 'Nature'],
  },
  {
    label: 'Events',
    options: ['World Cup 2026', 'Hajj', 'Umrah', 'Conferences', 'Festivals', 'Sporting Events'],
  },
  {
    label: 'Lifestyle',
    options: ['Fitness', 'Tech', 'Business', 'Art', 'Reading', 'Sports', 'Volunteering', 'Language Learning'],
  },
  {
    label: 'Faith',
    options: ['Mosque Tours', 'Halal Dining', 'Quran Study', 'Islamic History', 'Dawah', 'Community Service'],
  },
];

const SEASON_OPTIONS = [
  'Spring 2026', 'Summer 2026', 'Fall 2026', 'Winter 2026/27',
  'Spring 2027', 'Summer 2027', 'Fall 2027', 'Winter 2027/28',
];

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [identity, setIdentity] = useState([]);
  const [interests, setInterests] = useState([]);
  const [travelSeasons, setTravelSeasons] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryQuery, setCountryQuery] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nominatim state for home city
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityDebounceRef = useRef(null);

  // Nominatim state for countries
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const countryDebounceRef = useRef(null);

  const utmRef = useRef(getUtmParams());

  // City search
  const fetchCitySuggestions = useCallback(async (queryText) => {
    if (!queryText || queryText.length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&addressdetails=1&limit=8`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const cities = data
        .filter(item => item.address)
        .map(item => {
          const addr = item.address;
          const cityName = addr.city || addr.town || addr.village || addr.state || addr.county || item.name || '';
          const country = addr.country || '';
          if (!cityName) return null;
          return `${cityName}, ${country}`;
        })
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 6);
      setCitySuggestions(cities);
      setShowCitySuggestions(cities.length > 0);
    } catch {
      setCitySuggestions([]);
    }
  }, []);

  const handleHomeCityChange = (value) => {
    setHomeCity(value);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => fetchCitySuggestions(value), 300);
  };

  const selectCity = (city) => {
    setHomeCity(city);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  // Country search
  const fetchCountrySuggestions = useCallback(async (queryText) => {
    if (!queryText || queryText.length < 2) {
      setCountrySuggestions([]);
      setShowCountrySuggestions(false);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&addressdetails=1&limit=10&featuretype=country`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const results = data
        .filter(item => item.address && item.address.country)
        .map(item => item.address.country)
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .filter(c => !countries.includes(c))
        .slice(0, 6);
      setCountrySuggestions(results);
      setShowCountrySuggestions(results.length > 0);
    } catch {
      setCountrySuggestions([]);
    }
  }, [countries]);

  const handleCountryQueryChange = (value) => {
    setCountryQuery(value);
    if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    countryDebounceRef.current = setTimeout(() => fetchCountrySuggestions(value), 300);
  };

  const selectCountry = (country) => {
    if (!countries.includes(country)) {
      setCountries([...countries, country]);
    }
    setCountryQuery('');
    setCountrySuggestions([]);
    setShowCountrySuggestions(false);
  };

  const removeCountry = (country) => {
    setCountries(countries.filter(c => c !== country));
  };

  useEffect(() => {
    return () => {
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
      if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    };
  }, []);

  // Multi-select toggle helpers
  const toggleChip = (list, setList, value) => {
    setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'waitlist'), where('email', '==', email.trim().toLowerCase()));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("You're already on the waitlist!");
        setLoading(false);
        return;
      }

      const docData = {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        profileVisibility: profileVisibility || null,
        homeCity: homeCity.trim() || null,
        identity,
        interests,
        travelSeasons,
        countries,
        createdAt: serverTimestamp(),
      };
      if (utmRef.current) {
        docData.source = utmRef.current;
      }
      await addDoc(collection(db, 'waitlist'), docData);

      // Send confirmation email (non-blocking)
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: email.trim().toLowerCase(),
          to_name: name.trim() || 'there',
          countries: countries.join(', ') || 'some amazing places',
        }, EMAILJS_PUBLIC_KEY);
      } catch (e) {
        console.warn('Confirmation email failed:', e);
      }

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const renderChips = (options, selected, onToggle) => (
    <div style={styles.chipGrid}>
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              ...styles.chip,
              ...(isSelected ? styles.chipSelected : {}),
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <img src="/logo512.png" alt="Rihlah" style={styles.logo} />

        {!submitted ? (
          <>
            <h1 style={styles.headline}>
              Travel is better<br />with your <span style={styles.highlight}>people</span>.
            </h1>
            <p style={styles.subtext}>
              Rihlah connects Muslims traveling to the same destination, at the same time. Join the waitlist and tell us about yourself.
            </p>

            {/* Features */}
            <div style={styles.features}>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <div>
                  <div style={styles.featureTitle}>Explore destinations</div>
                  <div style={styles.featureDesc}>See where the Ummah is headed</div>
                </div>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <div style={styles.featureTitle}>Find your people</div>
                  <div style={styles.featureDesc}>Matched by interests and travel style</div>
                </div>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div style={styles.featureTitle}>Connect and travel</div>
                  <div style={styles.featureDesc}>Brothers see brothers. Sisters see sisters.</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="13"
                max="120"
                style={styles.input}
              />

              {/* Gender */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>Gender</div>
                <div style={styles.chipGrid}>
                  {['Male', 'Female'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGender(opt)}
                      style={{
                        ...styles.chip,
                        ...(gender === opt ? styles.chipSelected : {}),
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Preference (profileVisibility) */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>I want to travel with...</div>
                <div style={styles.chipGrid}>
                  {[
                    { label: 'Everyone', value: 'both' },
                    { label: 'Brothers only', value: 'Male' },
                    { label: 'Sisters only', value: 'Female' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProfileVisibility(opt.value)}
                      style={{
                        ...styles.chip,
                        ...(profileVisibility === opt.value ? styles.chipSelected : {}),
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home City */}
              <div style={styles.autocompleteWrapper}>
                <input
                  type="text"
                  placeholder="Home city (e.g. Chicago, London)"
                  value={homeCity}
                  onChange={(e) => handleHomeCityChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true); }}
                  style={styles.input}
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div style={styles.suggestionsDropdown}>
                    {citySuggestions.map((city, i) => (
                      <div
                        key={i}
                        style={styles.suggestionItem}
                        onMouseDown={() => selectCity(city)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Identity */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>I am a...</div>
                <div style={styles.sectionSubtitle}>Select all that apply</div>
                {renderChips(IDENTITY_OPTIONS, identity, (val) => toggleChip(identity, setIdentity, val))}
              </div>

              {/* Interests */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>Interests</div>
                <div style={styles.sectionSubtitle}>What are you into?</div>
                {INTEREST_GROUPS.map(group => (
                  <div key={group.label} style={{ marginBottom: '12px' }}>
                    <div style={styles.groupLabel}>{group.label}</div>
                    {renderChips(group.options, interests, (val) => toggleChip(interests, setInterests, val))}
                  </div>
                ))}
              </div>

              {/* Travel Seasons */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>When do you want to travel?</div>
                <div style={styles.sectionSubtitle}>Select all that apply</div>
                {renderChips(SEASON_OPTIONS, travelSeasons, (val) => toggleChip(travelSeasons, setTravelSeasons, val))}
              </div>

              {/* Countries */}
              <div style={styles.sectionCard}>
                <div style={styles.sectionTitle}>Countries you want to visit</div>
                <div style={styles.sectionSubtitle}>Search and add countries</div>
                <div style={styles.autocompleteWrapper}>
                  <input
                    type="text"
                    placeholder="Search countries (e.g. Turkey, Morocco)"
                    value={countryQuery}
                    onChange={(e) => handleCountryQueryChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
                    onFocus={() => { if (countrySuggestions.length > 0) setShowCountrySuggestions(true); }}
                    style={styles.searchInput}
                  />
                  {showCountrySuggestions && countrySuggestions.length > 0 && (
                    <div style={styles.suggestionsDropdown}>
                      {countrySuggestions.map((country, i) => (
                        <div
                          key={i}
                          style={styles.suggestionItem}
                          onMouseDown={() => selectCountry(country)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          {country}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {countries.length > 0 && (
                  <div style={styles.chipGrid}>
                    {countries.map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => removeCountry(country)}
                        style={{ ...styles.chip, ...styles.chipSelected }}
                      >
                        {country}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Joining...' : 'Join the Waitlist'}
              </button>
              {error && <div style={styles.error}>{error}</div>}
            </form>

            <p style={styles.privacy}>
              No spam. We'll only email you when Rihlah launches.
            </p>
          </>
        ) : (
          <div style={styles.success}>
            <div style={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 style={styles.successTitle}>You're on the list.</h2>
            <p style={styles.successText}>
              We'll let you know as soon as Rihlah is ready. We'll match you with travelers who share your interests and destinations.
            </p>
            <p style={styles.successText}>Your next journey starts soon.</p>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        Built for the Ummah, by the Ummah.
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #faf9f7 0%, #f0f9f4 50%, #faf9f7 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: {
    maxWidth: '480px',
    width: '100%',
    padding: '60px 24px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
  },
  logo: {
    width: '120px',
    height: 'auto',
    marginBottom: '32px',
  },
  headline: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
    margin: '0 0 16px',
  },
  highlight: {
    color: '#047857',
  },
  subtext: {
    fontSize: '15px',
    color: '#6b6b6b',
    lineHeight: '1.7',
    margin: '0 0 32px',
    maxWidth: '380px',
  },
  features: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
    textAlign: 'left',
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#f0f9f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '2px',
  },
  featureDesc: {
    fontSize: '12px',
    color: '#6b7280',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    fontSize: '15px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    background: '#fff',
    color: '#1a1a1a',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1.5px solid #e8e5e0',
    borderRadius: '10px',
    outline: 'none',
    background: '#faf9f7',
    color: '#1a1a1a',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  autocompleteWrapper: {
    position: 'relative',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    marginTop: '4px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    zIndex: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1a1a1a',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
  },
  sectionCard: {
    width: '100%',
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    borderRadius: '14px',
    padding: '16px',
    textAlign: 'left',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '2px',
  },
  sectionSubtitle: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '12px',
  },
  groupLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    background: '#fff',
    border: '1.5px solid #d1d5db',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  chipSelected: {
    background: '#047857',
    borderColor: '#047857',
    color: '#fff',
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '8px',
    boxShadow: '0 2px 8px rgba(4,120,87,0.3)',
  },
  error: {
    fontSize: '13px',
    color: '#dc2626',
    marginTop: '4px',
  },
  privacy: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '16px',
  },
  success: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '40px',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f0f9f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: '0 0 12px',
  },
  successText: {
    fontSize: '15px',
    color: '#6b6b6b',
    lineHeight: '1.7',
    maxWidth: '320px',
    margin: '0 0 8px',
  },
  footer: {
    padding: '24px',
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
  },
};
