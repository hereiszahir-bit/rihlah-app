import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';
import { colors, fonts, radius } from '../design';
import { getCityGuide } from '../data/cityGuides';

// CDMX is the hero — the only fully verified guide
// These 3 are next in the pipeline, shown as teasers
const COMING_SOON = ['istanbul', 'marrakech', 'sarajevo'];

function Discover() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const hero = getCityGuide('mexico-city');
  const teasers = COMING_SOON.map(id => getCityGuide(id)).filter(Boolean);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brand}>RIHLAH</div>
        <div style={styles.brandSub}>Travel intelligence</div>
      </div>

      <div style={styles.feed} ref={scrollRef}>
        {/* === CDMX Hero — full treatment === */}
        {hero && (
          <motion.div
            style={styles.heroCard}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Featured label */}
            <div style={styles.featuredLabel}>Featured Guide</div>

            {/* Hero image */}
            <div
              style={{
                ...styles.heroImage,
                backgroundImage: `linear-gradient(transparent 30%, rgba(10,10,10,0.95)), url(${hero.heroImage})`,
              }}
            >
              <div style={styles.heroContent}>
                <div style={styles.heroCountry}>{hero.country}</div>
                <h2 style={styles.heroCity}>{hero.city}</h2>
                <p style={styles.heroTagline}>{hero.tagline}</p>

                <div style={styles.heroStats}>
                  <span style={styles.heroStat}>{hero.neighborhoods?.length || 0} neighborhoods</span>
                  <span style={styles.heroDot} />
                  <span style={styles.heroStat}>{hero.dining?.length || 0} dining spots</span>
                  <span style={styles.heroDot} />
                  <span style={styles.heroStat}>{hero.mosques?.length || 0} mosques</span>
                </div>

                <button
                  style={styles.heroCta}
                  onClick={() => navigate(`/city/${hero.id}`)}
                >
                  Open guide <FiChevronRight size={16} style={{ marginLeft: '4px' }} />
                </button>
              </div>
            </div>

            {/* Preview content strip */}
            <div style={styles.previewStrip}>
              {/* Neighborhoods */}
              <div style={styles.previewSection}>
                <div style={styles.previewLabel}>Neighborhoods</div>
                <div style={styles.previewScroll}>
                  {(hero.neighborhoods || []).slice(0, 5).map((n, i) => (
                    <div
                      key={i}
                      style={styles.neighborhoodCard}
                      onClick={() => navigate(`/city/${hero.id}`)}
                    >
                      <div
                        style={{
                          ...styles.neighborhoodImage,
                          backgroundImage: `linear-gradient(transparent 40%, rgba(10,10,10,0.8)), url(${n.image})`,
                        }}
                      >
                        <div style={styles.neighborhoodName}>{n.name}</div>
                        <div style={styles.neighborhoodVibe}>{n.vibe}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dining */}
              <div style={styles.previewSection}>
                <div style={styles.previewLabel}>Where to eat</div>
                <div style={styles.diningList}>
                  {(hero.dining || []).slice(0, 3).map((d, i) => (
                    <div key={i} style={styles.diningItem}>
                      <div style={styles.diningInfo}>
                        <div style={styles.diningName}>{d.name}</div>
                        <div style={styles.diningMeta}>{d.type} — {d.area}</div>
                      </div>
                      {d.halal && <span style={styles.halalBadge}>Halal</span>}
                    </div>
                  ))}
                </div>
                <button
                  style={styles.seeAllLink}
                  onClick={() => navigate(`/city/${hero.id}`)}
                >
                  See all {hero.dining?.length || 0} spots
                </button>
              </div>

              {/* Prayer info */}
              {hero.prayerNote && (
                <div style={styles.tipCard}>
                  <div style={styles.tipLabel}>Prayer</div>
                  <div style={styles.tipText}>{hero.prayerNote}</div>
                </div>
              )}

              {/* Insider tip */}
              {hero.insiderTips?.[0] && (
                <div style={{ ...styles.tipCard, marginTop: '12px' }}>
                  <div style={styles.tipLabel}>Insider tip</div>
                  <div style={styles.tipText}>{hero.insiderTips[0]}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* === Coming Soon — teaser cards === */}
        <div style={styles.comingSoonSection}>
          <div style={styles.comingSoonHeader}>
            <div style={styles.comingSoonTitle}>Next guides</div>
            <div style={styles.comingSoonSub}>Verified and coming soon</div>
          </div>

          <div style={styles.teaserGrid}>
            {teasers.map((guide, index) => (
              <motion.div
                key={guide.id}
                style={styles.teaserCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                onClick={() => navigate(`/city/${guide.id}`)}
              >
                <div
                  style={{
                    ...styles.teaserImage,
                    backgroundImage: `linear-gradient(transparent 20%, rgba(10,10,10,0.85)), url(${guide.heroImage})`,
                  }}
                >
                  <div style={styles.teaserContent}>
                    <div style={styles.teaserCountry}>{guide.country}</div>
                    <div style={styles.teaserCity}>{guide.city}</div>
                    <div style={styles.teaserTagline}>{guide.tagline}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* More cities */}
        <div style={styles.comingSoon}>
          <div style={styles.moreText}>Cairo, Dubai, Fez, Kuala Lumpur, Doha</div>
          <div style={styles.moreSub}>Guides in progress</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '90px',
  },

  // Header
  header: {
    padding: '20px 24px 16px',
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '700',
    color: colors.text,
    letterSpacing: '4px',
  },
  brandSub: {
    fontSize: '11px',
    color: colors.textMuted,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginTop: '2px',
  },

  // Feed
  feed: {
    display: 'flex',
    flexDirection: 'column',
  },

  // Featured label
  featuredLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: colors.terracotta,
    padding: '0 24px',
    marginBottom: '12px',
  },

  // Hero card
  heroCard: {
    marginBottom: '32px',
  },
  heroImage: {
    height: '460px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '0 24px 28px',
  },
  heroContent: {
    width: '100%',
  },
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
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  heroTagline: {
    fontSize: '16px',
    color: colors.textSecondary,
    margin: '0 0 16px',
    lineHeight: 1.5,
    maxWidth: '320px',
  },
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  heroStat: {
    fontSize: '12px',
    color: colors.textTertiary,
    fontWeight: '500',
  },
  heroDot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: colors.textMuted,
  },
  heroCta: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 28px',
    background: colors.terracotta,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: radius.full,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },

  // Preview strip
  previewStrip: {
    padding: '20px 0 0',
  },
  previewSection: {
    marginBottom: '24px',
  },
  previewLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.textTertiary,
    padding: '0 24px',
    marginBottom: '12px',
  },

  // Neighborhood cards
  previewScroll: {
    display: 'flex',
    overflowX: 'auto',
    gap: '12px',
    paddingLeft: '24px',
    paddingRight: '24px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  neighborhoodCard: {
    flexShrink: 0,
    width: '200px',
    borderRadius: radius.lg,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  neighborhoodImage: {
    height: '140px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '14px',
  },
  neighborhoodName: {
    fontFamily: fonts.serif,
    fontSize: '17px',
    fontWeight: '600',
    color: colors.text,
    lineHeight: 1.2,
  },
  neighborhoodVibe: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginTop: '2px',
  },

  // Dining
  diningList: {
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  diningItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  diningInfo: {
    flex: 1,
  },
  diningName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  diningMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '2px',
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
  seeAllLink: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.terracotta,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: fonts.sans,
  },

  // Tip / prayer card
  tipCard: {
    margin: '0 24px',
    padding: '20px',
    background: colors.surfaceElevated,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
  },
  tipLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.terracotta,
    marginBottom: '8px',
  },
  tipText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    fontStyle: 'italic',
  },

  // Coming soon section
  comingSoonSection: {
    padding: '16px 0 0',
    borderTop: `1px solid ${colors.border}`,
    marginTop: '8px',
  },
  comingSoonHeader: {
    padding: '24px 24px 20px',
  },
  comingSoonTitle: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.text,
    letterSpacing: '-0.3px',
  },
  comingSoonSub: {
    fontSize: '13px',
    color: colors.textMuted,
    marginTop: '4px',
  },

  // Teaser cards
  teaserGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 0 8px',
  },
  teaserCard: {
    cursor: 'pointer',
  },
  teaserImage: {
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '0 24px 20px',
  },
  teaserContent: {
    width: '100%',
  },
  teaserCountry: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: colors.terracotta,
    marginBottom: '4px',
  },
  teaserCity: {
    fontFamily: fonts.serif,
    fontSize: '26px',
    fontWeight: '600',
    color: colors.text,
    letterSpacing: '-0.3px',
    lineHeight: 1.1,
  },
  teaserTagline: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginTop: '4px',
    lineHeight: 1.4,
  },

  // Bottom more cities
  comingSoon: {
    padding: '40px 24px 60px',
    textAlign: 'center',
  },
  moreText: {
    fontSize: '13px',
    color: colors.textMuted,
    letterSpacing: '0.3px',
  },
  moreSub: {
    fontSize: '12px',
    color: colors.textMuted,
    marginTop: '4px',
    opacity: 0.6,
  },
};

export default Discover;
