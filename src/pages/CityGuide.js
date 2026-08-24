import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiBookmark, FiMapPin, FiCoffee, FiStar } from 'react-icons/fi';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { colors, fonts, radius, components } from '../design';
import { getCityGuide } from '../data/cityGuides';
import CURATED_DESTINATIONS from '../data/destinations';

function CityGuide() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const { currentUser, currentUserData, refreshCurrentUser } = useUser();
  const guide = getCityGuide(cityId);
  const [activeSection, setActiveSection] = useState('overview');
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    if (currentUserData?.savedPlaces) {
      setSavedPlaces(currentUserData.savedPlaces);
    }
  }, [currentUserData]);

  if (!guide) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.textTertiary }}>City guide not found</div>
      </div>
    );
  }

  const isSaved = (placeName) => savedPlaces.some(p => p.name === placeName && p.city === guide.city);

  const toggleSave = async (place, type) => {
    if (!currentUser) return;

    const placeData = {
      name: place.name,
      city: guide.city,
      cityId: guide.id,
      type,
      area: place.area || '',
      note: place.note || '',
      savedAt: new Date().toISOString(),
    };

    const userRef = doc(db, 'users', currentUser.uid);

    if (isSaved(place.name)) {
      const existing = savedPlaces.find(p => p.name === place.name && p.city === guide.city);
      if (existing) {
        await updateDoc(userRef, { savedPlaces: arrayRemove(existing) });
        setSavedPlaces(prev => prev.filter(p => !(p.name === place.name && p.city === guide.city)));
      }
    } else {
      await updateDoc(userRef, { savedPlaces: arrayUnion(placeData) });
      setSavedPlaces(prev => [...prev, placeData]);
    }
  };

  const destData = CURATED_DESTINATIONS.find(d => d.id === cityId);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'neighborhoods', label: 'Neighborhoods' },
    { id: 'dining', label: 'Dining' },
    { id: 'mosques', label: 'Mosques' },
    { id: 'coffee', label: 'Coffee' },
    { id: 'experiences', label: 'Experiences' },
  ];

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(transparent 20%, rgba(10,10,10,0.98)), url(${guide.heroImage})`,
        }}
      >
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} color={colors.text} />
        </button>

        <div style={styles.heroBottom}>
          <div style={styles.heroCountry}>{guide.country}</div>
          <h1 style={styles.heroCity}>{guide.city}</h1>
          <p style={styles.heroIntro}>{guide.intro}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div style={styles.tabsWrapper}>
        <div style={styles.tabs}>
          {sections.map(s => (
            <button
              key={s.id}
              style={{
                ...styles.tab,
                ...(activeSection === s.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Overview */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Prayer note */}
            <div style={styles.prayerCard}>
              <div style={styles.prayerIcon}><FiMapPin size={14} /></div>
              <div style={styles.prayerText}>{guide.prayerNote}</div>
            </div>

            {/* Quick sections */}
            <div style={styles.overviewGrid}>
              {[
                { label: 'Neighborhoods', count: guide.neighborhoods?.length || 0, section: 'neighborhoods' },
                { label: 'Dining', count: guide.dining?.length || 0, section: 'dining' },
                { label: 'Mosques', count: guide.mosques?.length || 0, section: 'mosques' },
                { label: 'Coffee', count: guide.coffee?.length || 0, section: 'coffee' },
                { label: 'Experiences', count: guide.experiences?.length || 0, section: 'experiences' },
              ].map(item => (
                <button
                  key={item.section}
                  style={styles.overviewCard}
                  onClick={() => setActiveSection(item.section)}
                >
                  <div style={styles.overviewCount}>{item.count}</div>
                  <div style={styles.overviewLabel}>{item.label}</div>
                </button>
              ))}
            </div>

            {/* Insider tips */}
            {guide.insiderTips && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Insider tips</h3>
                {guide.insiderTips.map((tip, i) => (
                  <div key={i} style={styles.tipItem}>
                    <div style={styles.tipNumber}>{i + 1}</div>
                    <div style={styles.tipText}>{tip}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Experiences from affiliate data */}
            {destData?.experiences && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Book experiences</h3>
                {destData.experiences.map((exp, i) => (
                  <a
                    key={i}
                    href={exp.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.expLink}
                  >
                    <div style={styles.expInfo}>
                      <div style={styles.expName}>{exp.name}</div>
                      <div style={styles.expMeta}>
                        {exp.duration} — {exp.rating} <FiStar size={10} style={{ verticalAlign: '-1px' }} /> ({exp.reviews})
                      </div>
                    </div>
                    <div style={styles.expPrice}>From ${exp.price}</div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Neighborhoods */}
        {activeSection === 'neighborhoods' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.neighborhoods || []).map((n, i) => (
              <div key={i} style={styles.neighborhoodFullCard}>
                <div
                  style={{
                    ...styles.neighborhoodFullImage,
                    backgroundImage: `linear-gradient(transparent 50%, rgba(10,10,10,0.9)), url(${n.image})`,
                  }}
                >
                  <h3 style={styles.neighborhoodFullName}>{n.name}</h3>
                  <div style={styles.neighborhoodFullVibe}>{n.vibe}</div>
                </div>
                <div style={styles.neighborhoodFullDesc}>{n.description}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dining */}
        {activeSection === 'dining' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.dining || []).map((d, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{d.name}</div>
                    <div style={styles.placeMeta}>{d.type} — {d.area}</div>
                  </div>
                  <div style={styles.placeActions}>
                    {d.halal && <span style={styles.halalBadge}>Halal</span>}
                    <button
                      style={{
                        ...styles.saveBtn,
                        color: isSaved(d.name) ? colors.terracotta : colors.textMuted,
                      }}
                      onClick={() => toggleSave(d, 'dining')}
                    >
                      <FiBookmark size={18} fill={isSaved(d.name) ? colors.terracotta : 'none'} />
                    </button>
                  </div>
                </div>
                <div style={styles.placeNote}>{d.note}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Mosques */}
        {activeSection === 'mosques' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.mosques || []).map((m, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{m.name}</div>
                    <div style={styles.placeMeta}>{m.area}</div>
                  </div>
                  <button
                    style={{
                      ...styles.saveBtn,
                      color: isSaved(m.name) ? colors.terracotta : colors.textMuted,
                    }}
                    onClick={() => toggleSave(m, 'mosque')}
                  >
                    <FiBookmark size={18} fill={isSaved(m.name) ? colors.terracotta : 'none'} />
                  </button>
                </div>
                <div style={styles.placeNote}>{m.note}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Coffee */}
        {activeSection === 'coffee' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.coffee || []).map((c, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{c.name}</div>
                    <div style={styles.placeMeta}>{c.area}</div>
                  </div>
                  <button
                    style={{
                      ...styles.saveBtn,
                      color: isSaved(c.name) ? colors.terracotta : colors.textMuted,
                    }}
                    onClick={() => toggleSave(c, 'coffee')}
                  >
                    <FiBookmark size={18} fill={isSaved(c.name) ? colors.terracotta : 'none'} />
                  </button>
                </div>
                <div style={styles.placeNote}>{c.note}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Experiences */}
        {activeSection === 'experiences' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.experiences || []).map((e, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{e.name}</div>
                    <div style={styles.placeMeta}>{e.type}</div>
                  </div>
                  <button
                    style={{
                      ...styles.saveBtn,
                      color: isSaved(e.name) ? colors.terracotta : colors.textMuted,
                    }}
                    onClick={() => toggleSave(e, 'experience')}
                  >
                    <FiBookmark size={18} fill={isSaved(e.name) ? colors.terracotta : 'none'} />
                  </button>
                </div>
                <div style={styles.placeNote}>{e.note}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '40px',
  },

  // Hero
  hero: {
    height: '400px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '24px',
  },
  backBtn: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(10,10,10,0.6)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  heroBottom: {},
  heroCountry: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: colors.terracotta,
    marginBottom: '8px',
  },
  heroCity: {
    fontFamily: fonts.serif,
    fontSize: '40px',
    fontWeight: '600',
    color: colors.text,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  heroIntro: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '340px',
  },

  // Tabs
  tabsWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: colors.bg,
    borderBottom: `1px solid ${colors.border}`,
  },
  tabs: {
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    padding: '0 24px',
    gap: '4px',
  },
  tab: {
    padding: '14px 16px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textTertiary,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid transparent',
    fontFamily: fonts.sans,
  },
  tabActive: {
    color: colors.text,
    borderBottomColor: colors.terracotta,
  },

  // Content
  content: {
    padding: '20px 24px',
  },

  // Prayer card
  prayerCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: colors.surfaceElevated,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    marginBottom: '24px',
    alignItems: 'flex-start',
  },
  prayerIcon: {
    color: colors.olive,
    marginTop: '2px',
    flexShrink: 0,
  },
  prayerText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },

  // Overview grid
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '32px',
  },
  overviewCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '16px 12px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  overviewCount: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '4px',
  },
  overviewLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: colors.textTertiary,
  },

  // Section
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
    margin: '0 0 16px',
  },

  // Tips
  tipItem: {
    display: 'flex',
    gap: '14px',
    marginBottom: '16px',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: colors.warmGray,
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  tipText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
  },

  // Experience links (affiliate)
  expLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${colors.border}`,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  expInfo: {
    flex: 1,
  },
  expName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  expMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  expPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.terracotta,
    flexShrink: 0,
  },

  // Neighborhood full cards
  neighborhoodFullCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`,
  },
  neighborhoodFullImage: {
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '20px',
  },
  neighborhoodFullName: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '600',
    color: colors.text,
    margin: '0 0 4px',
  },
  neighborhoodFullVibe: {
    fontSize: '13px',
    color: colors.terracotta,
    fontWeight: '500',
  },
  neighborhoodFullDesc: {
    padding: '16px 20px',
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    background: colors.surface,
  },

  // Place cards (dining, mosques, coffee, experiences)
  placeCard: {
    padding: '16px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  placeHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
  },
  placeMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  placeActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  placeNote: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginTop: '8px',
  },
  halalBadge: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: colors.olive,
    background: colors.successBg,
    padding: '4px 10px',
    borderRadius: radius.full,
  },
  saveBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
  },
};

export default CityGuide;
