import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { colors, fonts } from '../design';

const DESTINATION_DATA = {
  istanbul: {
    name: 'Istanbul',
    country: 'Turkey',
    hero: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1400&q=80',
    tagline: 'Where continents meet and centuries overlap.',
    intro: 'Istanbul doesn\'t introduce itself. It overwhelms you — the call to prayer echoing off the Bosphorus at sunset, the weight of Hagia Sophia\'s dome overhead, the chaos of the Grand Bazaar narrowing into a side street where a man has been making the same borek for forty years.',
    body: 'This is where the Ottoman and Byzantine worlds collide, where Europe meets Asia at a strait that has shaped empires. For Muslim travelers, Istanbul isn\'t just a destination — it\'s a homecoming to a city that was the center of the Islamic world for five centuries.',
    highlights: [
      { title: 'Sultan Ahmed at Fajr', text: 'The Blue Mosque before the crowds. Just you, the tilework, and the first light of day.' },
      { title: 'The Bosphorus by ferry', text: 'Skip the tourist boats. The local ferry from Eminonu to Kadikoy costs 4 lira and gives you the best view in the city.' },
      { title: 'Suleymaniye at sunset', text: 'Sinan\'s masterpiece. The courtyard faces west. Bring tea from the garden below.' },
      { title: 'The food', text: 'Balik ekmek by the Galata Bridge. Kunefe in Karakoy. Iskender in Besiktas. Every neighborhood has a meal you\'ll remember.' },
    ],
  },
  marrakech: {
    name: 'Marrakech',
    country: 'Morocco',
    hero: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1400&q=80',
    tagline: 'The medina rewards those who get lost.',
    intro: 'Marrakech operates on a different frequency. The medina walls hold a thousand years of trade, craft, and prayer. You don\'t navigate it — you surrender to it. Every wrong turn leads to a riad courtyard, a leather workshop, or a mint tea invitation you didn\'t expect.',
    body: 'Morocco\'s spiritual heartbeat is quieter than its markets but just as persistent. From the Koutoubia minaret to the zawiyas of Sufi saints, Islam here is woven into the architecture, the hospitality, and the daily rhythm of a city that has welcomed travelers since the Almoravid dynasty.',
    highlights: [
      { title: 'Jemaa el-Fnaa at dusk', text: 'The square transforms. Smoke rises from the food stalls. Musicians set up. The energy shifts from commerce to communion.' },
      { title: 'Ben Youssef Madrasa', text: 'Fourteenth-century Islamic education, preserved in zellige tilework and carved cedar. Stand in the courtyard and look up.' },
      { title: 'The souks, intentionally', text: 'Skip the tourist leather shops. Find the brass workers, the wool dyers, the spice merchants who\'ve been here for generations.' },
      { title: 'A hammam', text: 'Not the spa version. The neighborhood hammam. Bring your own savon beldi. This is how the city has bathed for a thousand years.' },
    ],
  },
  andalusia: {
    name: 'Andalusia',
    country: 'Spain',
    hero: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1400&q=80',
    tagline: 'The architecture remembers what the textbooks forgot.',
    intro: 'Walk into the Mezquita in Cordoba and something happens that no photograph prepares you for. Eight hundred and fifty columns. Double arches in red and white. A forest built for prayer a thousand years ago, still standing, still speaking.',
    body: 'Al-Andalus was home to one of the most extraordinary civilizations in human history — a place where Islamic scholarship, art, and architecture reached heights that shaped the world. Andalusia today carries that inheritance in its buildings, its gardens, its streets. For Muslim travelers, this isn\'t tourism. It\'s witnessing.',
    highlights: [
      { title: 'The Mezquita, Cordoba', text: 'Go at opening. Before the tour groups. Stand in the original mihrab and understand what this building was built for.' },
      { title: 'The Alhambra, Granada', text: 'Book the Nasrid Palaces ticket months ahead. The muqarnas ceilings, the Court of the Lions, the view of the Sierra Nevada. Worth every minute of planning.' },
      { title: 'The Albaicin at sunset', text: 'Granada\'s old Muslim quarter. Narrow streets, whitewashed walls, the Alhambra glowing gold from the Mirador de San Nicolas.' },
      { title: 'Seville\'s Alcazar', text: 'Mudéjar architecture at its finest. Islamic geometric patterns built by Christian kings who knew beauty when they saw it.' },
    ],
  },
  'mexico-city': {
    name: 'Mexico City',
    country: 'Mexico',
    hero: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1400&q=80',
    tagline: 'The city nobody expects. That\'s the point.',
    intro: 'Mexico City is not on any Muslim travel list. That\'s exactly why it should be. Twenty-two million people, a food culture that rivals anywhere on earth, architecture that spans Aztec ruins to Art Deco masterpieces, and a city that rewards the curious more than almost anywhere we\'ve been.',
    body: 'CDMX is a place where you figure it out — find the seafood spots worth knowing, discover the small but real Muslim community, learn how Islam arrived in Latin America. For Muslim travelers willing to go somewhere unexpected, it offers something no Istanbul itinerary can: the thrill of being somewhere genuinely new.',
    highlights: [
      { title: 'Centro Historico', text: 'The Zocalo, the Palacio de Bellas Artes, Templo Mayor. Layer after layer of civilization in a single square mile.' },
      { title: 'The food, navigated', text: 'Seafood tacos, vegetarian street food, markets full of produce you\'ve never seen. Eating well here takes a little more intention — and that makes it more rewarding.' },
      { title: 'Roma and Condesa', text: 'Tree-lined streets, specialty coffee, Art Deco buildings, and some of the best restaurants in the Western Hemisphere. The neighborhoods that made CDMX a global destination.' },
      { title: 'A different kind of trip', text: 'No mosque on every corner. No familiar signage in every window. This is travel that stretches you — and connects you with a small, resilient Muslim community most people don\'t know exists.' },
    ],
  },
};

function PublicDestination() {
  const { slug } = useParams();
  const dest = DESTINATION_DATA[slug];

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset scroll and form state when destination changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
    setEmail('');
    setSubmitted(false);
    setError('');
  }, [slug]);

  if (!dest) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: fonts.serif, fontSize: '32px', marginBottom: '16px' }}>Destination not found</h1>
          <Link to="/" style={{ color: colors.terracotta }}>Back to Rihlah</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'subscribers'),
        where('email', '==', email.trim().toLowerCase()),
        where('destination', '==', slug)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        setError("You're already on this list.");
        setLoading(false);
        return;
      }
      await addDoc(collection(db, 'subscribers'), {
        email: email.trim().toLowerCase(),
        destination: slug,
        source: `destination-${slug}`,
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
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link to="/" style={styles.wordmark}>RIHLAH</Link>
          <Link to="/" style={styles.backLink}>All destinations</Link>
        </div>
      </header>

      {/* Hero image */}
      <div style={styles.heroWrap}>
        <img src={dest.hero} alt={dest.name} style={styles.heroImage} />
        <div style={styles.heroOverlay} />
        <motion.div
          style={styles.heroText}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={styles.heroCountry}>{dest.country}</div>
          <h1 style={styles.heroTitle}>{dest.name}</h1>
          <p style={styles.heroTagline}>{dest.tagline}</p>
        </motion.div>
      </div>

      {/* Editorial content */}
      <section style={styles.editorialSection}>
        <div style={styles.editorialInner}>
          <p style={styles.intro}>{dest.intro}</p>
          <p style={styles.body}>{dest.body}</p>
        </div>
      </section>

      {/* Highlights */}
      <section style={styles.highlightsSection}>
        <div style={styles.highlightsInner}>
          <div style={styles.highlightsLabel}>What we'd show you</div>
          <div style={styles.highlightsGrid}>
            {dest.highlights.map((h, i) => (
              <motion.div
                key={h.title}
                style={styles.highlightCard}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 style={styles.highlightTitle}>{h.title}</h3>
                <p style={styles.highlightText}>{h.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destination-specific email capture */}
      <section style={styles.captureSection}>
        <div style={styles.captureInner}>
          {!submitted ? (
            <>
              <h2 style={styles.captureTitle}>
                Interested in {dest.name}?
              </h2>
              <p style={styles.captureSub}>
                We're planning curated experiences here. Leave your email and we'll
                notify you when dates and details are set.
              </p>
              <form onSubmit={handleSubmit} style={styles.captureForm}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.captureInput}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.captureBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Joining...' : 'Notify me'}
                </button>
              </form>
              {error && <div style={styles.captureError}>{error}</div>}
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={styles.captureTitle}>Noted.</h2>
              <p style={styles.captureSub}>
                We'll reach out when the {dest.name} experience is ready. No spam.
              </p>
            </motion.div>
          )}
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
    background: 'rgba(245, 241, 234, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
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

  // Hero
  heroWrap: {
    position: 'relative',
    width: '100%',
    height: '70vh',
    minHeight: '400px',
    maxHeight: '600px',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
  },
  heroText: {
    position: 'absolute',
    bottom: '48px',
    left: '32px',
    right: '32px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  heroCountry: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
  },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(40px, 8vw, 64px)',
    fontWeight: '500',
    color: '#fff',
    letterSpacing: '-1px',
    marginBottom: '8px',
  },
  heroTagline: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    fontWeight: '300',
  },

  // Editorial
  editorialSection: {
    padding: '80px 32px',
  },
  editorialInner: {
    maxWidth: '640px',
    margin: '0 auto',
  },
  intro: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(18px, 2.5vw, 22px)',
    lineHeight: 1.7,
    color: colors.text,
    marginBottom: '24px',
  },
  body: {
    fontSize: '16px',
    lineHeight: 1.8,
    color: colors.textSecondary,
  },

  // Highlights
  highlightsSection: {
    padding: '80px 32px',
    background: colors.surface,
  },
  highlightsInner: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  highlightsLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: colors.terracotta,
    marginBottom: '40px',
  },
  highlightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '32px',
  },
  highlightCard: {
    padding: '28px',
    background: colors.bg,
    borderRadius: '2px',
    borderLeft: `3px solid ${colors.terracotta}`,
  },
  highlightTitle: {
    fontFamily: fonts.serif,
    fontSize: '18px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '8px',
  },
  highlightText: {
    fontSize: '14px',
    lineHeight: 1.7,
    color: colors.textSecondary,
  },

  // Email capture
  captureSection: {
    padding: '100px 32px',
    background: colors.dark,
  },
  captureInner: {
    maxWidth: '520px',
    margin: '0 auto',
    textAlign: 'center',
  },
  captureTitle: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(24px, 4vw, 32px)',
    fontWeight: '500',
    color: colors.cream,
    marginBottom: '12px',
  },
  captureSub: {
    fontSize: '15px',
    color: colors.textSecondary,
    lineHeight: 1.7,
    marginBottom: '32px',
  },
  captureForm: {
    display: 'flex',
    gap: '10px',
    maxWidth: '440px',
    margin: '0 auto',
  },
  captureInput: {
    flex: 1,
    padding: '14px 18px',
    fontSize: '15px',
    border: `1px solid ${colors.warmGray}`,
    borderRadius: '2px',
    background: 'transparent',
    color: colors.cream,
    fontFamily: fonts.sans,
    outline: 'none',
    boxSizing: 'border-box',
  },
  captureBtn: {
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '600',
    background: colors.terracotta,
    color: colors.dark,
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: fonts.sans,
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  captureError: {
    fontSize: '13px',
    color: '#e07c6a',
    marginTop: '12px',
  },

  // Footer
  footer: {
    padding: '60px 32px',
    background: colors.dark,
    borderTop: '1px solid #2a2a2a',
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
    color: colors.terracotta,
    textDecoration: 'none',
  },
  footerCopy: {
    fontSize: '12px',
    color: colors.textMuted,
  },
};

export default PublicDestination;
