import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { colors, fonts } from '../design';

function ModernHome() {
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useUser();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'subscribers'), where('email', '==', email.trim().toLowerCase()));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("You're already on the list.");
        setLoading(false);
        return;
      }
      await addDoc(collection(db, 'subscribers'), {
        email: email.trim().toLowerCase(),
        source: 'homepage',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={{ ...styles.header, ...(scrolled ? styles.headerScrolled : {}) }}>
        <div style={styles.headerInner}>
          <Link to="/" style={{ ...styles.wordmark, color: '#fff' }}>RIHLAH</Link>
          <nav style={styles.nav}>
            <Link to="/about" style={{ ...styles.navLink, color: 'rgba(255,255,255,0.8)' }}>Our Story</Link>
            <Link to="/blog" style={{ ...styles.navLink, color: 'rgba(255,255,255,0.8)' }}>Journal</Link>
            {currentUser ? (
              <Link to="/home" style={{ ...styles.navLinkCTA, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Open App</Link>
            ) : (
              <Link to="/login" style={{ ...styles.navLinkCTA, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroImageWrap}>
          <img src="/hero.jpg" alt="" style={styles.heroImage} />
          <div style={styles.heroOverlay} />
        </div>
        <motion.div
          style={styles.heroContent}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1 style={styles.heroTitle}>
            Curiosity is an<br />act of faith.
          </h1>
          <p style={styles.heroSub}>
            A travel community for Muslims who believe the world is a gift from God — and want to open it with people who get it.
          </p>
          <a href="#apply" style={styles.heroBtn}>Request access</a>
        </motion.div>
      </section>

      {/* What Rihlah is — single statement */}
      <section style={styles.statementSection}>
        <div style={styles.statementInner}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <p style={styles.statementText}>
              Millions of Muslims list "travel" as an interest.
              Almost none of them ever connect over it.
            </p>
            <p style={styles.statementSub}>
              Rihlah is where curious Muslims find each other — in the cities that change how you see the world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What you get */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresInner}>
          <div style={styles.sectionLabel}>What you get</div>
          <div className="rihlah-features-grid" style={styles.featuresGrid}>
            <motion.div
              style={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div style={styles.featureNumber}>01</div>
              <h3 style={styles.featureTitle}>See who's going</h3>
              <p style={styles.featureText}>
                Browse travelers by destination and dates. See who overlaps with your trip.
                Connect before you land — so you arrive knowing someone.
              </p>
            </motion.div>
            <motion.div
              style={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div style={styles.featureNumber}>02</div>
              <h3 style={styles.featureTitle}>City intelligence</h3>
              <p style={styles.featureText}>
                Where to pray. Where to eat. What to skip.
                Guides written by people who have been there — not algorithms that have not.
              </p>
            </motion.div>
            <motion.div
              style={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div style={styles.featureNumber}>03</div>
              <h3 style={styles.featureTitle}>Your people</h3>
              <p style={styles.featureText}>
                Not a tour group. Not a dating app. Just curious Muslims
                in the same city at the same time. Who knows what happens from there.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section style={styles.forSection}>
        <div style={styles.forInner}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div style={styles.sectionLabelLight}>Who this is for</div>
            <div className="rihlah-for-grid" style={styles.forGrid}>
              <div style={styles.forCard}>
                <p style={styles.forText}>
                  The one whose culture handed them a blueprint — school, career,
                  marriage, house — and they followed it, but always felt like
                  something was missing.
                </p>
              </div>
              <div style={styles.forCard}>
                <p style={styles.forText}>
                  The one who prays five times a day and also wants to eat
                  street tacos in Mexico City at midnight. Who does not see
                  a contradiction in that.
                </p>
              </div>
              <div style={styles.forCard}>
                <p style={styles.forText}>
                  The one who wants to live a life where what they want and
                  what they do are the same thing — and knows that travel is
                  part of how you get there.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founder voice */}
      <section style={styles.founderSection}>
        <div style={styles.founderInner}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <blockquote style={styles.founderQuote}>
              "I built Rihlah because I was tired of being curious alone.
              Every Muslim I know loves to travel. Almost none of us
              ever connect over it. I wanted to change that."
            </blockquote>
            <div style={styles.founderAttr}>
              <div style={styles.founderImageWrap}>
                <img src="/zahir.jpg" alt="Zahir" style={styles.founderImage} />
              </div>
              <div>
                <div style={styles.founderName}>Zahir</div>
                <div style={styles.founderRole}>Founder</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" style={styles.applySection}>
        <div style={styles.applyInner}>
          {!submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div style={styles.sectionLabel}>Early access</div>
              <h2 style={styles.applyTitle}>The world is a gift. Open it.</h2>
              <p style={styles.applySub}>
                Rihlah is not for everyone. It is for the ones who are curious enough to go
                and intentional enough to go well. If that sounds like you, we want you here.
              </p>
              <form onSubmit={handleSubmit} className="rihlah-apply-form" style={styles.applyForm}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.applyInput}
                />
                <button type="submit" disabled={loading} style={{ ...styles.applyBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Requesting...' : 'Request access'}
                </button>
              </form>
              {error && <div style={styles.applyError}>{error}</div>}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={styles.applyTitle}>You're on the list.</h2>
              <p style={styles.applySub}>We'll reach out when it's your turn.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div className="rihlah-footer-top" style={styles.footerTop}>
            <div>
              <div style={styles.footerWordmark}>RIHLAH</div>
              <p style={styles.footerTagline}>Travel with your people.</p>
            </div>
            <div style={styles.footerLinks}>
              <Link to="/about" style={styles.footerLink}>Our Story</Link>
              <a href="https://instagram.com/rihlah.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Instagram</a>
              <a href="https://tiktok.com/@rihlah.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>TikTok</a>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p style={styles.footerCopy}>&copy; 2026 Rihlah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg },

  // Header
  header: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '20px 0', transition: 'all 0.3s ease', background: 'transparent' },
  headerScrolled: { background: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${colors.glassBorder}` },
  headerInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '600', letterSpacing: '3px', textDecoration: 'none', transition: 'color 0.3s' },
  nav: { display: 'flex', gap: '24px', alignItems: 'center' },
  navLink: { fontSize: '13px', fontWeight: '500', textDecoration: 'none', letterSpacing: '0.5px', transition: 'color 0.3s' },
  navLinkCTA: { fontSize: '12px', fontWeight: '600', textDecoration: 'none', letterSpacing: '0.5px', padding: '10px 20px', borderRadius: '2px', transition: 'background 0.3s' },

  // Shared
  sectionLabel: { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '3px', color: colors.terracotta, marginBottom: '20px' },
  sectionLabelLight: { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '3px', color: colors.gold, marginBottom: '32px' },

  // Hero
  hero: { position: 'relative', height: '100vh', minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroImageWrap: { position: 'absolute', inset: 0 },
  heroImage: { width: '100%', height: '100%', objectFit: 'cover' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,25,23,0.3) 0%, rgba(28,25,23,0.65) 100%)' },
  heroContent: { position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 32px' },
  heroTitle: { fontFamily: fonts.serif, fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: '500', lineHeight: 1.05, color: '#fff', letterSpacing: '-1px', marginBottom: '20px' },
  heroSub: { fontSize: 'clamp(16px, 2vw, 19px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '36px', fontWeight: '300' },
  heroBtn: { display: 'inline-block', padding: '16px 40px', background: colors.terracotta, color: '#fff', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', textDecoration: 'none', borderRadius: '2px' },

  // Statement
  statementSection: { padding: '100px 32px' },
  statementInner: { maxWidth: '750px', margin: '0 auto', textAlign: 'center' },
  statementText: { fontFamily: fonts.serif, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '400', lineHeight: 1.45, color: colors.text, marginBottom: '16px' },
  statementSub: { fontSize: '16px', color: colors.textSecondary, letterSpacing: '0.3px' },

  // Features
  featuresSection: { padding: '80px 32px 100px', background: colors.surface },
  featuresInner: { maxWidth: '1100px', margin: '0 auto' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px' },
  featureCard: { paddingTop: '24px', borderTop: `2px solid ${colors.terracotta}` },
  featureNumber: { fontFamily: fonts.serif, fontSize: '14px', color: colors.terracotta, marginBottom: '20px' },
  featureTitle: { fontFamily: fonts.serif, fontSize: '22px', fontWeight: '500', color: colors.text, marginBottom: '12px' },
  featureText: { fontSize: '15px', color: colors.textSecondary, lineHeight: 1.75 },

  // Who this is for
  forSection: { padding: '100px 32px', background: colors.dark },
  forInner: { maxWidth: '1100px', margin: '0 auto' },
  forGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  forCard: { padding: '36px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px' },
  forText: { fontFamily: fonts.serif, fontSize: '17px', lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', margin: 0 },

  // Founder
  founderSection: { padding: '100px 32px' },
  founderInner: { maxWidth: '620px', margin: '0 auto', textAlign: 'center' },
  founderQuote: { fontFamily: fonts.serif, fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: '400', lineHeight: 1.55, color: colors.text, fontStyle: 'italic', margin: '0 0 32px 0', padding: 0, border: 'none' },
  founderAttr: { display: 'inline-flex', alignItems: 'center', gap: '16px' },
  founderImageWrap: { width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 },
  founderImage: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' },
  founderName: { fontSize: '15px', fontWeight: '600', color: colors.text, textAlign: 'left' },
  founderRole: { fontSize: '13px', color: colors.textSecondary, textAlign: 'left' },

  // Apply
  applySection: { padding: '100px 32px', background: colors.dark, textAlign: 'center' },
  applyInner: { maxWidth: '520px', margin: '0 auto' },
  applyTitle: { fontFamily: fonts.serif, fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: '500', color: '#fff', marginBottom: '16px' },
  applySub: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: '36px' },
  applyForm: { display: 'flex', gap: '10px', maxWidth: '440px', margin: '0 auto' },
  applyInput: { flex: 1, padding: '14px 18px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontFamily: fonts.sans, outline: 'none', boxSizing: 'border-box' },
  applyBtn: { padding: '14px 28px', fontSize: '14px', fontWeight: '600', background: colors.terracotta, color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: fonts.sans, letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  applyError: { fontSize: '13px', color: '#e07c6a', marginTop: '12px' },

  // Footer
  footer: { padding: '60px 32px 40px', background: colors.dark, borderTop: '1px solid rgba(255,255,255,0.06)' },
  footerInner: { maxWidth: '1100px', margin: '0 auto' },
  footerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '48px' },
  footerWordmark: { fontFamily: fonts.serif, fontSize: '18px', fontWeight: '600', letterSpacing: '3px', color: colors.cream, marginBottom: '8px' },
  footerTagline: { fontSize: '14px', color: colors.textTertiary, fontStyle: 'italic' },
  footerLinks: { display: 'flex', gap: '32px' },
  footerLink: { fontSize: '14px', color: colors.textSecondary, textDecoration: 'none' },
  footerBottom: { borderTop: `1px solid ${colors.glassBorder}`, paddingTop: '24px' },
  footerCopy: { fontSize: '12px', color: colors.textMuted },
};

if (!document.getElementById('rihlah-styles')) {
  const style = document.createElement('style');
  style.id = 'rihlah-styles';
  style.textContent = `
    @media (max-width: 768px) {
      .rihlah-features-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
      .rihlah-for-grid { grid-template-columns: 1fr !important; }
      .rihlah-apply-form { flex-direction: column !important; }
      .rihlah-footer-top { flex-direction: column !important; gap: 32px !important; }
    }
  `;
  document.head.appendChild(style);
}

export default ModernHome;
