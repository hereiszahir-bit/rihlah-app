import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors, fonts } from '../design';

function About() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={{
        ...styles.header,
        background: scrolled ? 'rgba(245, 241, 234, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}>
        <div style={styles.headerInner}>
          <Link to="/" style={{ ...styles.wordmark, color: scrolled ? colors.text : '#fff' }}>RIHLAH</Link>
          <Link to="/" style={{ ...styles.backLink, color: scrolled ? colors.textSecondary : 'rgba(255,255,255,0.8)' }}>Home</Link>
        </div>
      </header>

      {/* Hero with founder image */}
      <section style={styles.hero}>
        <div style={styles.heroImageWrap}>
          <img src="/zahir.jpg" alt="" style={styles.heroImage} />
          <div style={styles.heroOverlay} />
        </div>
        <div style={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={styles.labelLight}>Our Story</div>
            <h1 style={styles.heroTitle}>
              Why Rihlah exists.
            </h1>
          </motion.div>
        </div>
        <motion.div
          style={styles.scrollIndicator}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={styles.scrollArrow}
          >
            &#8595;
          </motion.div>
        </motion.div>
      </section>

      {/* Story — the message leads */}
      <section style={styles.storySection}>
        <div style={styles.storyInner}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p style={styles.storyLede}>
              I've taken a lot of trips. Some were incredible because of where I went.
              The best ones were incredible because of who I was with.
            </p>
          </motion.div>

          <div style={styles.storyBody}>
            <p>
              There's a specific experience that Muslim travelers know well. You're in a new
              city — somewhere beautiful, somewhere you've wanted to visit — and you're figuring
              things out alone. Where to eat. Where to pray. Where the neighborhood is that
              actually feels like you. You manage. You always do. But there's a version of that
              trip where you're not figuring it out alone, and it's a fundamentally different experience.
            </p>
            <p>
              That's the version Rihlah exists to create.
            </p>
            <p>
              I started this because the best travel intelligence I've ever received came
              through group chats and voice notes — from people who had been where I was going
              and understood what mattered to me without me having to spell it out. That kind
              of knowledge exists everywhere. It just disappears in 24 hours. There is no
              persistent layer where it lives.
            </p>
            <p>
              Rihlah is that layer. Not a travel agency. Not a content platform. A community
              of people who are genuinely curious about the world and want to explore it alongside
              others who share their context. People who are building lives with intention — not
              performing for anyone, just quietly doing the work of becoming who they actually are.
            </p>
            <p>
              The name means "journey" in Arabic. Ibn Battuta called his life's work a rihlah.
              The word carries something heavier than "trip" and lighter than "pilgrimage."
              It felt right.
            </p>
          </div>

          {/* Founder — small, beside the signature */}
          <div style={styles.founderRow}>
            <div style={styles.founderImageWrap}>
              <img src="/zahir.jpg" alt="Zahir" style={styles.founderImage} />
            </div>
            <div style={styles.founderInfo}>
              <div style={styles.founderName}>Zahir</div>
              <div style={styles.founderRole}>Founder, Rihlah</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={styles.valuesSection}>
        <div style={styles.valuesInner}>
          <div style={styles.label}>What we believe</div>
          <div style={styles.valuesGrid}>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>Travel is personal</h3>
              <p style={styles.valueText}>
                Where you go says something about you. We choose destinations with
                intention — places that reward depth over speed, curiosity over checklists.
              </p>
            </div>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>The people are the trip</h3>
              <p style={styles.valueText}>
                You'll forget the hotel. You won't forget the conversation at dinner, the
                laugh at the wrong turn, the friend you made on day three.
              </p>
            </div>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>Identity without performance</h3>
              <p style={styles.valueText}>
                We don't make Islam the headline. It's the context. The comfort of being
                around people who get it — without anyone having to explain or prove anything.
              </p>
            </div>
            <div style={styles.valueCard}>
              <h3 style={styles.valueTitle}>Quality is not optional</h3>
              <p style={styles.valueText}>
                Muslim travelers deserve the same caliber of experience that every other
                community gets. Not budget tours. Not generic packages. Thoughtful, beautiful,
                well-made travel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>See where we're going.</h2>
          <Link to="/destinations" style={styles.ctaBtn}>Explore destinations</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerWordmark}>RIHLAH</div>
          <p style={styles.footerTagline}>Travel with your people.</p>
          <div style={styles.footerLinks}>
            <a href="https://instagram.com/rihlah.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Instagram</a>
            <a href="https://tiktok.com/@rihlah.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>TikTok</a>
          </div>
          <p style={styles.footerCopy}>&copy; 2026 Rihlah</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
  },

  // Header
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '20px 0',
    transition: 'background 0.3s ease',
  },
  headerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '3px',
    color: colors.text,
    textDecoration: 'none',
  },
  backLink: {
    fontSize: '13px',
    fontWeight: '500',
    color: colors.textSecondary,
    textDecoration: 'none',
  },

  // Shared
  label: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: colors.terracotta,
    marginBottom: '20px',
  },

  // Hero
  hero: {
    position: 'relative',
    height: '100vh',
    minHeight: '600px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImageWrap: {
    position: 'absolute',
    inset: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 20%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.65) 100%)',
  },
  heroInner: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '700px',
    textAlign: 'center',
    padding: '0 32px',
  },
  labelLight: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '20px',
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(36px, 6vw, 56px)',
    fontWeight: '500',
    lineHeight: 1.1,
    color: '#fff',
    letterSpacing: '-1px',
  },

  // Scroll indicator
  scrollIndicator: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
  },
  scrollArrow: {
    fontSize: '20px',
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '300',
  },

  // Story
  storySection: {
    padding: '120px 32px 80px',
  },
  storyInner: {
    maxWidth: '620px',
    margin: '0 auto',
  },
  storyLede: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(20px, 3vw, 26px)',
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: '40px',
    fontStyle: 'italic',
  },
  storyBody: {
    fontSize: '16px',
    lineHeight: 1.9,
    color: colors.textSecondary,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  // Founder row — small and understated
  founderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginTop: '48px',
    paddingTop: '32px',
    borderTop: `1px solid ${colors.border}`,
  },
  founderImageWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  founderImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 20%',
  },
  founderInfo: {},
  founderName: {
    fontFamily: fonts.serif,
    fontSize: '18px',
    fontWeight: '500',
    color: colors.text,
  },
  founderRole: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginTop: '2px',
  },
  founderCaption: {
    fontSize: '12px',
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: '2px',
  },

  // Values
  valuesSection: {
    padding: '80px 32px',
    background: colors.surface,
  },
  valuesInner: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '40px',
    marginTop: '16px',
  },
  valueCard: {},
  valueTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '10px',
  },
  valueText: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: colors.textSecondary,
  },

  // CTA
  ctaSection: {
    padding: '100px 32px',
    textAlign: 'center',
  },
  ctaInner: {
    maxWidth: '500px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '24px',
  },
  ctaBtn: {
    display: 'inline-block',
    padding: '14px 36px',
    background: colors.terracotta,
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textDecoration: 'none',
    borderRadius: '2px',
  },

  // Footer
  footer: {
    padding: '60px 32px',
    background: colors.dark,
  },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerWordmark: {
    fontFamily: fonts.serif,
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '3px',
    color: colors.cream,
    marginBottom: '8px',
  },
  footerTagline: {
    fontSize: '14px',
    color: colors.textTertiary,
    marginBottom: '24px',
    fontStyle: 'italic',
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '24px',
  },
  footerLink: {
    fontSize: '13px',
    color: colors.gold,
    textDecoration: 'none',
  },
  footerCopy: {
    fontSize: '12px',
    color: colors.textMuted,
  },
};

export default About;
