import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import {
  FiHeart,
  FiArrowDown,
  FiMapPin,
  FiUsers,
  FiMessageCircle,
  FiShield,
  FiGlobe,
  FiInstagram,
} from 'react-icons/fi';
import { colors, fonts, radius } from '../design';

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
  if (!utm.utm_source) {
    utm.utm_source = 'homepage';
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

const IDENTITY_OPTIONS = [
  'Student', 'Young Professional', 'Solo Traveler', 'Couple',
  'Family', 'Retiree', 'Gap Year', 'Digital Nomad',
];

const INTEREST_GROUPS = [
  { label: 'Travel', options: ['Hiking', 'Food & Culinary', 'History & Culture', 'Photography', 'Beach', 'Adventure', 'Shopping', 'Nature'] },
  { label: 'Lifestyle', options: ['Fitness', 'Tech', 'Business', 'Art', 'Reading', 'Sports', 'Volunteering', 'Language Learning'] },
  { label: 'Faith', options: ['Mosque Tours', 'Halal Dining', 'Quran Study', 'Islamic History', 'Dawah', 'Community Service'] },
];

const SEASON_OPTIONS = [
  'Spring 2026', 'Summer 2026', 'Fall 2026', 'Winter 2026/27',
  'Spring 2027', 'Summer 2027', 'Fall 2027', 'Winter 2027/28',
];

function ModernHome({ user }) {
  const [scrolled, setScrolled] = useState(false);
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
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityDebounceRef = useRef(null);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const countryDebounceRef = useRef(null);
  const utmRef = useRef(getUtmParams());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
      if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    };
  }, []);

  const handleLogout = async () => { await signOut(auth); };

  const fetchCitySuggestions = useCallback(async (queryText) => {
    if (!queryText || queryText.length < 2) { setCitySuggestions([]); setShowCitySuggestions(false); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&addressdetails=1&limit=8`, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const cities = data.filter(item => item.address).map(item => {
        const addr = item.address;
        const cityName = addr.city || addr.town || addr.village || addr.state || addr.county || item.name || '';
        const country = addr.country || '';
        return cityName ? `${cityName}, ${country}` : null;
      }).filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 6);
      setCitySuggestions(cities);
      setShowCitySuggestions(cities.length > 0);
    } catch { setCitySuggestions([]); }
  }, []);

  const handleHomeCityChange = (value) => {
    setHomeCity(value);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => fetchCitySuggestions(value), 300);
  };

  const selectCity = (city) => { setHomeCity(city); setCitySuggestions([]); setShowCitySuggestions(false); };

  const fetchCountrySuggestions = useCallback(async (queryText) => {
    if (!queryText || queryText.length < 2) { setCountrySuggestions([]); setShowCountrySuggestions(false); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryText)}&format=json&addressdetails=1&limit=10&featuretype=country`, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      const results = data.filter(item => item.address && item.address.country).map(item => item.address.country).filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).filter(c => !countries.includes(c)).slice(0, 6);
      setCountrySuggestions(results);
      setShowCountrySuggestions(results.length > 0);
    } catch { setCountrySuggestions([]); }
  }, [countries]);

  const handleCountryQueryChange = (value) => {
    setCountryQuery(value);
    if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current);
    countryDebounceRef.current = setTimeout(() => fetchCountrySuggestions(value), 300);
  };

  const selectCountry = (country) => {
    if (!countries.includes(country)) setCountries([...countries, country]);
    setCountryQuery(''); setCountrySuggestions([]); setShowCountrySuggestions(false);
  };

  const removeCountry = (country) => { setCountries(countries.filter(c => c !== country)); };
  const toggleChip = (list, setList, value) => { setList(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      const q = query(collection(db, 'waitlist'), where('email', '==', email.trim().toLowerCase()));
      const existing = await getDocs(q);
      if (!existing.empty) { setError("You're already on the waitlist!"); setLoading(false); return; }
      const docData = {
        email: email.trim().toLowerCase(), name: name.trim(),
        age: age ? parseInt(age, 10) : null, gender: gender || null,
        profileVisibility: profileVisibility || null, homeCity: homeCity.trim() || null,
        identity, interests, travelSeasons, countries, createdAt: serverTimestamp(),
      };
      if (utmRef.current) docData.source = utmRef.current;
      await addDoc(collection(db, 'waitlist'), docData);
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: email.trim().toLowerCase(),
          to_name: name.trim() || 'there',
          countries: countries.join(', ') || 'some amazing places',
        }, EMAILJS_PUBLIC_KEY);
      } catch (emailErr) { console.warn('Confirmation email failed:', emailErr); }
      setSubmitted(true);
    } catch (err) { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const renderChips = (options, selected, onToggle) => (
    <div style={styles.chipGrid}>
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onToggle(opt)}
          style={{ ...styles.chip, ...(selected.includes(opt) ? styles.chipSelected : {}) }}
        >{opt}</button>
      ))}
    </div>
  );

  const scrollToWaitlist = (e) => {
    e.preventDefault();
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      <motion.header
        style={{ ...styles.header, ...(scrolled ? styles.headerScrolled : {}) }}
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      >
        <div style={styles.headerContent}>
          <motion.div style={styles.logoContainer} whileHover={{ scale: 1.05 }}>
            <img src="/logo192.png" alt="Rihlah" style={styles.logoImg} />
          </motion.div>
          <nav style={styles.nav}>
            {user ? (
              <div style={styles.userNav}>
                <span style={styles.userName}>Hey, {user.displayName?.split(' ')[0]}</span>
                <motion.button onClick={handleLogout} style={styles.logoutBtn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Sign Out</motion.button>
              </div>
            ) : (
              <div style={styles.authNav}>
                <Link to="/login" style={styles.loginLink}>Log in</Link>
              </div>
            )}
          </nav>
        </div>
      </motion.header>

      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.span style={styles.badge} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              Coming Soon
            </motion.span>
            <h1 style={styles.heroTitle}>
              Travel is better with<br />
              <span style={styles.heroTitleAccent}>your people.</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Rihlah connects Muslims traveling to the same destination, at the same time.
              Sign up and be the first to know when we launch.
            </p>
            {!user && (
              <div style={styles.heroCTA}>
                <motion.a href="#waitlist" onClick={scrollToWaitlist} style={styles.primaryBtn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  Join the Waitlist <FiArrowDown style={{ marginLeft: '8px' }} />
                </motion.a>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section style={styles.featureSection}>
        <motion.h2 style={styles.sectionTitle} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          What is Rihlah?
        </motion.h2>
        <motion.p style={styles.sectionSubtitle} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          A Muslim travel community — here's how it works
        </motion.p>
        <div style={styles.featureGrid}>
          {[
            { icon: <FiMapPin size={28} color={colors.gold} />, title: 'Share where you\'re headed', text: 'Add your upcoming journeys and dream destinations to your profile.' },
            { icon: <FiUsers size={28} color={colors.gold} />, title: 'Get matched with travelers', text: 'We connect you with Muslims going to the same place, at the same time.' },
            { icon: <FiMessageCircle size={28} color={colors.gold} />, title: 'Connect, plan, and travel', text: 'Coordinate plans and experience your destination together.' },
          ].map((feature, index) => (
            <motion.div key={feature.title} style={styles.featureCard} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }} whileHover={{ y: -8, transition: { duration: 0.2 } }}>
              <div style={styles.featureIconWrap}>{feature.icon}</div>
              <h3 style={styles.featureCardTitle}>{feature.title}</h3>
              <p style={styles.featureCardText}>{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={styles.whySection}>
        <motion.h2 style={styles.sectionTitle} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          Why Rihlah?
        </motion.h2>
        <div style={styles.whyGrid}>
          {[
            { icon: <FiGlobe size={22} color={colors.gold} />, title: 'Matched by interests & travel dates', text: 'Not random connections — we match you based on where you\'re going and what you love.' },
            { icon: <FiShield size={22} color={colors.gold} />, title: 'Gender privacy options', text: 'Choose to connect with brothers only, sisters only, or everyone.' },
            { icon: <FiHeart size={22} color={colors.gold} />, title: 'Built for the Ummah', text: 'Designed from the ground up for Muslim travelers, by Muslim travelers.' },
            { icon: <FiMessageCircle size={22} color={colors.gold} />, title: 'Connect via WhatsApp & Instagram', text: 'Link your socials so you can coordinate plans on the platforms you already use.' },
          ].map((item, index) => (
            <motion.div key={item.title} style={styles.whyCard} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div style={styles.whyIconWrap}>{item.icon}</div>
              <div>
                <h3 style={styles.whyCardTitle}>{item.title}</h3>
                <p style={styles.whyCardText}>{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="waitlist" style={styles.waitlistSection}>
        <motion.div style={styles.waitlistInner} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          {!submitted ? (
            <>
              <h2 style={styles.waitlistTitle}>Join the waitlist</h2>
              <p style={styles.waitlistSubtext}>The more we know, the better we can match you with the right travelers.</p>
              <form onSubmit={handleSubmit} style={styles.form}>
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
                <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                <input type="number" placeholder="Your age" value={age} onChange={(e) => setAge(e.target.value)} min="13" max="120" style={styles.input} />

                <div style={styles.formCard}>
                  <div style={styles.formCardTitle}>Gender</div>
                  <div style={styles.chipGrid}>
                    {['Male', 'Female'].map(opt => (
                      <button key={opt} type="button" onClick={() => setGender(opt)} style={{ ...styles.chip, ...(gender === opt ? styles.chipSelected : {}) }}>{opt}</button>
                    ))}
                  </div>
                </div>

                <div style={styles.formCard}>
                  <div style={styles.formCardTitle}>I want to travel with...</div>
                  <div style={styles.chipGrid}>
                    {[{ label: 'Everyone', value: 'both' }, { label: 'Brothers only', value: 'Male' }, { label: 'Sisters only', value: 'Female' }].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setProfileVisibility(opt.value)} style={{ ...styles.chip, ...(profileVisibility === opt.value ? styles.chipSelected : {}) }}>{opt.label}</button>
                    ))}
                  </div>
                </div>

                <div style={styles.autocompleteWrapper}>
                  <input type="text" placeholder="Home city (e.g. Chicago, London)" value={homeCity} onChange={(e) => handleHomeCityChange(e.target.value)} onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)} onFocus={() => { if (citySuggestions.length > 0) setShowCitySuggestions(true); }} style={styles.input} />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div style={styles.suggestionsDropdown}>
                      {citySuggestions.map((city, i) => (
                        <div key={i} style={styles.suggestionItem} onMouseDown={() => selectCity(city)}>
                          <FiMapPin size={14} color={colors.gold} style={{ flexShrink: 0 }} />{city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.formCard}>
                  <div style={styles.formCardTitle}>I am a...</div>
                  <div style={styles.formCardSub}>Select all that apply</div>
                  {renderChips(IDENTITY_OPTIONS, identity, (val) => toggleChip(identity, setIdentity, val))}
                </div>

                <div style={styles.formCard}>
                  <div style={styles.formCardTitle}>Interests</div>
                  <div style={styles.formCardSub}>What are you into?</div>
                  {INTEREST_GROUPS.map(group => (
                    <div key={group.label} style={{ marginBottom: '12px' }}>
                      <div style={styles.groupLabel}>{group.label}</div>
                      {renderChips(group.options, interests, (val) => toggleChip(interests, setInterests, val))}
                    </div>
                  ))}
                </div>

                <div style={styles.formCard}>
                  <div style={styles.formCardTitle}>When do you want to travel?</div>
                  <div style={styles.formCardSub}>Select all that apply</div>
                  {renderChips(SEASON_OPTIONS, travelSeasons, (val) => toggleChip(travelSeasons, setTravelSeasons, val))}
                </div>

                <div style={styles.formCard}>
                  <div style={styles.formCardTitle}>Countries you want to visit</div>
                  <div style={styles.formCardSub}>Search and add countries</div>
                  <div style={styles.autocompleteWrapper}>
                    <input type="text" placeholder="Search countries (e.g. Turkey, Morocco)" value={countryQuery} onChange={(e) => handleCountryQueryChange(e.target.value)} onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)} onFocus={() => { if (countrySuggestions.length > 0) setShowCountrySuggestions(true); }} style={styles.searchInput} />
                    {showCountrySuggestions && countrySuggestions.length > 0 && (
                      <div style={styles.suggestionsDropdown}>
                        {countrySuggestions.map((country, i) => (
                          <div key={i} style={styles.suggestionItem} onMouseDown={() => selectCountry(country)}>
                            <FiGlobe size={14} color={colors.gold} style={{ flexShrink: 0 }} />{country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {countries.length > 0 && (
                    <div style={{ ...styles.chipGrid, marginTop: '10px' }}>
                      {countries.map(country => (
                        <button key={country} type="button" onClick={() => removeCountry(country)} style={{ ...styles.chip, ...styles.chipSelected }}>{country} &times;</button>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Joining...' : 'Join the Waitlist'}
                </button>
                {error && <div style={styles.error}>{error}</div>}
              </form>
              <p style={styles.privacy}>No spam. We'll only email you when Rihlah launches.</p>
            </>
          ) : (
            <motion.div style={styles.success} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={styles.successIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.gold} strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h2 style={styles.successTitle}>You're on the list.</h2>
              <p style={styles.successText}>We'll let you know as soon as Rihlah is ready. We'll match you with travelers who share your interests and destinations.</p>
              <p style={styles.successText}>Your next journey starts soon.</p>
            </motion.div>
          )}
        </motion.div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p style={styles.footerTagline}>Built for the Ummah, by the Ummah.</p>
          <a href="https://instagram.com/rihlah.io" target="_blank" rel="noopener noreferrer" style={styles.footerInsta}>
            <FiInstagram size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />@rihlah.io
          </a>
          <p style={styles.footerCopy}>&copy; 2026 Rihlah</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: colors.bg },
  header: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '20px 0', transition: 'all 0.3s ease', background: 'transparent' },
  headerScrolled: { background: 'rgba(248, 246, 242, 0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  logoImg: { width: 'min(120px, 25vw)', height: 'auto', borderRadius: '8px' },
  nav: { display: 'flex', alignItems: 'center' },
  userNav: { display: 'flex', gap: '16px', alignItems: 'center' },
  userName: { fontSize: '15px', fontWeight: '500', color: colors.text },
  logoutBtn: { background: colors.lightGray, color: colors.text, border: 'none', padding: '10px 20px', borderRadius: radius.sm, fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  authNav: { display: 'flex', gap: '12px', alignItems: 'center' },
  loginLink: { color: colors.text, textDecoration: 'none', fontSize: '15px', fontWeight: '500', padding: '10px 20px' },

  hero: { paddingTop: '140px', paddingBottom: '80px', background: colors.bg, position: 'relative', overflow: 'hidden' },
  heroContent: { maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 2 },
  badge: { display: 'inline-block', padding: '8px 20px', background: colors.lightGray, color: colors.text, borderRadius: radius.full, fontSize: '13px', fontWeight: '600', marginBottom: '24px', letterSpacing: '0.5px' },
  heroTitle: { fontFamily: fonts.serif, fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: '500', lineHeight: 1.1, color: colors.text, marginBottom: '24px', letterSpacing: '-0.02em' },
  heroTitleAccent: { color: colors.gold },
  heroSubtitle: { fontSize: '17px', color: colors.textSecondary, lineHeight: 1.7, marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px' },
  heroCTA: { display: 'flex', justifyContent: 'center' },
  primaryBtn: { background: colors.dark, color: colors.cream, padding: '16px 32px', borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', border: 'none' },

  featureSection: { padding: '80px 24px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '500', color: colors.text, marginBottom: '12px', letterSpacing: '-0.3px' },
  sectionSubtitle: { fontSize: '16px', color: colors.textSecondary, marginBottom: '48px' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' },
  featureCard: { background: colors.surface, borderRadius: radius.lg, padding: '36px 28px', textAlign: 'center', border: `1px solid ${colors.border}` },
  featureIconWrap: { width: '56px', height: '56px', borderRadius: radius.md, background: colors.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  featureCardTitle: { fontFamily: fonts.serif, fontSize: '17px', fontWeight: '500', color: colors.text, marginBottom: '10px' },
  featureCardText: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 },

  whySection: { padding: '80px 24px', background: colors.surface, textAlign: 'center' },
  whyGrid: { maxWidth: '800px', margin: '48px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', textAlign: 'left' },
  whyCard: { display: 'flex', gap: '16px', padding: '24px', background: colors.bg, borderRadius: radius.lg, alignItems: 'flex-start' },
  whyIconWrap: { width: '44px', height: '44px', borderRadius: radius.sm, background: colors.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  whyCardTitle: { fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '6px' },
  whyCardText: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 },

  waitlistSection: { padding: '80px 24px', background: colors.bg },
  waitlistInner: { maxWidth: '520px', margin: '0 auto', textAlign: 'center' },
  waitlistTitle: { fontFamily: fonts.serif, fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '500', color: colors.text, marginBottom: '12px', lineHeight: 1.3 },
  waitlistSubtext: { fontSize: '15px', color: colors.textSecondary, lineHeight: 1.7, marginBottom: '32px' },

  form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' },
  input: { width: '100%', padding: '14px 18px', fontSize: '15px', border: `1.5px solid ${colors.border}`, borderRadius: radius.md, outline: 'none', background: colors.surface, color: colors.text, fontFamily: fonts.sans, boxSizing: 'border-box' },
  searchInput: { width: '100%', padding: '10px 14px', fontSize: '14px', border: `1.5px solid ${colors.border}`, borderRadius: radius.sm, outline: 'none', background: colors.bg, color: colors.text, fontFamily: fonts.sans, boxSizing: 'border-box' },
  autocompleteWrapper: { position: 'relative' },
  suggestionsDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: radius.sm, marginTop: '4px', zIndex: 10, overflow: 'hidden' },
  suggestionItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '13px', color: colors.text, cursor: 'pointer', borderBottom: `1px solid ${colors.lightGray}` },
  formCard: { width: '100%', background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: radius.md, padding: '16px', textAlign: 'left', marginTop: '4px', boxSizing: 'border-box' },
  formCardTitle: { fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '2px' },
  formCardSub: { fontSize: '12px', color: colors.textMuted, marginBottom: '12px' },
  groupLabel: { fontSize: '11px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' },
  chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' },
  chip: { display: 'inline-flex', alignItems: 'center', padding: '8px 14px', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: radius.full, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' },
  chipSelected: { background: colors.dark, borderColor: colors.dark, color: colors.cream },
  submitBtn: { width: '100%', padding: '16px', fontSize: '16px', fontWeight: '600', color: colors.cream, background: colors.dark, border: 'none', borderRadius: radius.md, cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' },
  error: { fontSize: '13px', color: colors.error, marginTop: '4px', textAlign: 'center' },
  privacy: { fontSize: '12px', color: colors.textMuted, marginTop: '16px' },

  success: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' },
  successIcon: { width: '80px', height: '80px', borderRadius: '50%', background: colors.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' },
  successTitle: { fontFamily: fonts.serif, fontSize: '28px', fontWeight: '500', color: colors.text, margin: '0 0 12px' },
  successText: { fontSize: '15px', color: colors.textSecondary, lineHeight: 1.7, maxWidth: '380px', margin: '0 0 8px' },

  footer: { background: colors.dark, color: '#fff', padding: '40px 24px' },
  footerInner: { maxWidth: '600px', margin: '0 auto', textAlign: 'center' },
  footerTagline: { fontFamily: fonts.serif, fontSize: '16px', fontWeight: '500', color: colors.warmGray, marginBottom: '16px' },
  footerInsta: { display: 'inline-flex', alignItems: 'center', color: colors.gold, textDecoration: 'none', fontSize: '15px', fontWeight: '500', marginBottom: '20px' },
  footerCopy: { color: '#6b6b6b', fontSize: '13px' },
};

export default ModernHome;
