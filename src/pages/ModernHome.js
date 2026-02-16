import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; //
import { 
  FiMapPin, 
  FiUsers, 
  FiHeart, 
  FiStar, 
  FiClock,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi';

function ModernHome({ user }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div style={styles.container}>
      {/* Floating Header */}
      <motion.header 
        style={{
          ...styles.header,
          ...(scrolled ? styles.headerScrolled : {})
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.headerContent}>
          <motion.div 
            style={styles.logoContainer}
            whileHover={{ scale: 1.05 }}
          >
            <img src="/logo.svg" alt="Rihlah" style={styles.logoImg} />
            <span style={styles.logoText}>Rihlah</span>
          </motion.div>

          <nav style={styles.nav}>
            {user ? (
              <div style={styles.userNav}>
                <span style={styles.userName}>
                    <Link to="/local" style={styles.navLink}>
                      Local Travelers
                       </Link> 
                  Hey, {user.displayName?.split(' ')[0]}! 👋
                </span>
                <motion.button 
                  onClick={handleLogout}
                  style={styles.logoutBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Log out
                </motion.button>
              </div>
            ) : (
              <div style={styles.authNav}>
                <Link to="/login" style={styles.loginLink}>
                  Log in
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/signup" style={styles.signupBtn}>
                    Get Started
                  </Link>
                </motion.div>
              </div>
            )}
          </nav>
        </div>
      </motion.header>

{/* Hero Section */}
<section style={styles.hero}>
  <div style={styles.heroContent}>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.span 
        style={styles.badge}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        ✨ Join 1,000+ Muslim travelers
      </motion.span>

      <h2 style={styles.heroTitle}>
        Where curious Muslims
        <br />
        <span style={styles.heroTitleGradient}>begin their journey</span>
      </h2>

      <p style={styles.heroSubtitle}>
        Explore the world with your values intact. Connect with fellow 
        travelers. Book halal experiences together.
      </p>

      {!user && (
        <div style={styles.heroCTA}>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/signup" style={styles.primaryBtn}>
              Start Your Journey
              <FiArrowRight style={{ marginLeft: '8px' }} />
            </Link>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <a href="#experiences" style={styles.secondaryBtn}>
              Explore Experiences
            </a>
          </motion.div>
        </div>
      )}

      {/* Trust Indicators */}
      <div style={styles.trustBar}>
        <div style={styles.trustItem}>
          <FiCheck style={styles.trustIcon} />
          <span>1000+ travelers</span>
        </div>
        <div style={styles.trustItem}>
          <FiCheck style={styles.trustIcon} />
          <span>50+ experiences</span>
        </div>
        <div style={styles.trustItem}>
          <FiCheck style={styles.trustIcon} />
          <span>4.9★ average rating</span>
        </div>
      </div>
    </motion.div>
  </div>
</section>

        {/* Floating Cards */}
        <div style={styles.floatingCards}>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              style={{
                ...styles.floatingCard,
                animationDelay: `${i * 0.5}s`
              }}
              animate={{
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>

      {/* Experiences Section */}
      <section style={styles.section} id="experiences">
        <div style={styles.sectionHeader}>
          <motion.h2 
            style={styles.sectionTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Featured Experiences in Istanbul
          </motion.h2>
          <motion.p 
            style={styles.sectionSubtitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Curated halal experiences, vetted by the community
          </motion.p>
        </div>

        <div style={styles.grid}>
          {experiences.map((exp, index) => (
            <ExperienceCard 
              key={exp.id} 
              experience={exp} 
              user={user}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.howItWorks}>
        <motion.h2 
          style={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          How Rihlah Works
        </motion.h2>

        <div style={styles.stepsGrid}>
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              style={styles.stepCard}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              <div style={styles.stepNumber}>{step.number}</div>
              <div style={styles.stepIcon}>{step.icon}</div>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepText}>{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section style={styles.socialProof}>
        <motion.div 
          style={styles.proofCard}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div style={styles.proofAvatars}>
            {['👨🏽', '👩🏻', '👨🏾', '👩🏽', '👨🏻'].map((emoji, i) => (
              <div 
                key={i} 
                style={{
                  ...styles.avatar,
                  marginLeft: i > 0 ? '-12px' : 0,
                  zIndex: 5 - i
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
          <div>
            <h3 style={styles.proofTitle}>
              Join 1,000+ Muslims exploring the world
            </h3>
            <p style={styles.proofText}>
              "Rihlah helped me find travel buddies in every city. I'm never traveling alone again!" - Sarah A.
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section style={styles.cta}>
          <motion.div
            style={styles.ctaContent}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={styles.ctaTitle}>
              Ready to begin your rihlah?
            </h2>
            <p style={styles.ctaSubtitle}>
              Join thousands of Muslims exploring the world together
            </p>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/signup" style={styles.ctaBtn}>
                Create Free Account
                <FiArrowRight style={{ marginLeft: '8px' }} />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerBrand}>
            <span style={styles.footerLogo}><img src="/logo.svg" alt="Rihlah" style={{ width: '28px', height: '28px', verticalAlign: 'middle', marginRight: '8px' }} />Rihlah</span>
            <p style={styles.footerTagline}>
              Where Muslims travel together
            </p>
          </div>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>About</a>
            <a href="#" style={styles.footerLink}>Blog</a>
            <a href="#" style={styles.footerLink}>Help</a>
            <a href="#" style={styles.footerLink}>Terms</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopy}>
            © 2026 Rihlah. Made with 💚 for the Ummah
          </p>
        </div>
      </footer>
    </div>
  );
}

// Experience Card Component
function ExperienceCard({ experience, user, index }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      style={styles.experienceCard}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ 
        y: -12,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div style={styles.cardImage}>
        <div style={styles.cardImageBg}>{experience.icon}</div>
        <div style={styles.cardBadge}>
          <FiStar style={{ marginRight: '4px' }} />
          {experience.rating}
        </div>
        {experience.travelers && (
          <div style={styles.travelersCount}>
            <FiUsers style={{ marginRight: '4px' }} />
            {experience.travelers} going
          </div>
        )}
      </div>

      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{experience.title}</h3>
        
        <div style={styles.cardMeta}>
          <div style={styles.metaItem}>
            <FiMapPin size={14} />
            <span>{experience.location}</span>
          </div>
          <div style={styles.metaItem}>
            <FiClock size={14} />
            <span>{experience.duration}</span>
          </div>
        </div>

        <div style={styles.cardFooter}>
          <div>
            <span style={styles.price}>${experience.price}</span>
            <span style={styles.priceLabel}> per person</span>
          </div>
          
          {user ? (
            <motion.button 
              style={styles.bookBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Book Now
            </motion.button>
          ) : (
            <Link to="/signup" style={styles.bookBtn}>
              Sign up
            </Link>
          )}
        </div>
      </div>

      {isHovered && (
        <motion.div
          style={styles.cardOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
}

// Data
const experiences = [
  {
    id: 1,
    title: 'Ottoman Mosques Walking Tour',
    location: 'Sultanahmet',
    icon: '🕌',
    rating: 4.9,
    duration: '3 hours',
    price: 45,
    travelers: 12
  },
  {
    id: 2,
    title: 'Halal Food Tour',
    location: 'Old Istanbul',
    icon: '🍽️',
    rating: 5.0,
    duration: '4 hours',
    price: 65,
    travelers: 8
  },
  {
    id: 3,
    title: 'Sisters Turkish Bath',
    location: 'Cağaloğlu',
    icon: '💆‍♀️',
    rating: 4.8,
    duration: '2.5 hours',
    price: 80,
    travelers: 15
  },
];

const steps = [
  {
    number: '1',
    icon: '✨',
    title: 'Create Your Profile',
    text: 'Share your travel style, interests, and the places you want to explore'
  },
  {
    number: '2',
    icon: '🤝',
    title: 'Find Your Tribe',
    text: 'Connect with Muslims heading to the same destination at the same time'
  },
  {
    number: '3',
    icon: '🎉',
    title: 'Experience Together',
    text: 'Book curated halal experiences and create memories that last forever'
  }
];

const styles = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
    position: 'relative',
  },

  // Header
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: '20px 0',
    transition: 'all 0.3s ease',
    background: 'transparent',
  },
  headerScrolled: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoImg: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
  },
  nav: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  userNav: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  userName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
  },
  navLink: {  // 
  color: '#fff',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '500',
  padding: '8px 16px',
  },
  logoutBtn: {
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  authNav: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  loginLink: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    padding: '10px 20px',
  },
  signupBtn: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },

  // Hero
  hero: {
    paddingTop: '140px',
    paddingBottom: '100px',
    background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 24px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  },
  badge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'rgba(5, 150, 105, 0.1)',
    color: '#059669',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: '64px',
    fontWeight: '800',
    lineHeight: 1.1,
    color: '#1f2937',
    marginBottom: '24px',
    letterSpacing: '-0.02em',
  },
  heroTitleGradient: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px',
  },
  heroCTA: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '48px',
  },
  primaryBtn: {
    background: '#059669',
    color: '#fff',
    padding: '16px 32px',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(5, 150, 105, 0.3)',
  },
  secondaryBtn: {
    background: '#fff',
    color: '#059669',
    padding: '16px 32px',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    border: '2px solid #059669',
  },
  trustBar: {
    display: 'flex',
    gap: '32px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#6b7280',
  },
  trustIcon: {
    color: '#059669',
  },

  // Experiences Section
  section: {
    padding: '100px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '64px',
  },
  sectionTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '32px',
  },

  // Experience Card
  experienceCard: {
    background: '#fff',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    position: 'relative',
  },
  cardImage: {
    height: '200px',
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardImageBg: {
    fontSize: '80px',
  },
  cardBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: '#fff',
    padding: '6px 12px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  travelersCount: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '6px 12px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    color: '#059669',
  },
  cardContent: {
    padding: '24px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  cardMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#6b7280',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #f3f4f6',
  },
  price: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#059669',
  },
  priceLabel: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  bookBtn: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 150, 105, 0.05)',
    pointerEvents: 'none',
  },

  // How It Works
  howItWorks: {
    padding: '100px 24px',
    background: '#fff',
  },
  stepsGrid: {
    maxWidth: '1000px',
    margin: '64px auto 0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '40px',
  },
  stepCard: {
    textAlign: 'center',
    padding: '32px',
    background: '#fafafa',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
  },
  stepNumber: {
    width: '48px',
    height: '48px',
    background: '#059669',
    color: '#fff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 auto 16px',
  },
  stepIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  stepText: {
    fontSize: '15px',
    color: '#6b7280',
    lineHeight: 1.6,
  },

  // Social Proof
  socialProof: {
    padding: '100px 24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  proofCard: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    padding: '48px',
    borderRadius: '24px',
    color: '#fff',
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  proofAvatars: {
    display: 'flex',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    border: '3px solid #059669',
  },
  proofTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  proofText: {
    fontSize: '16px',
    opacity: 0.95,
    lineHeight: 1.6,
  },

  // CTA
  cta: {
    padding: '100px 24px',
    background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)',
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '40px',
  },
  ctaBtn: {
    background: '#059669',
    color: '#fff',
    padding: '18px 40px',
    borderRadius: '14px',
    fontSize: '18px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 10px 30px rgba(5, 150, 105, 0.3)',
  },

  // Footer
  footer: {
    background: '#1f2937',
    color: '#fff',
    padding: '60px 24px 24px',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    flexWrap: 'wrap',
    gap: '40px',
  },
  footerBrand: {
    flex: 1,
  },
  footerLogo: {
    fontSize: '24px',
    fontWeight: '700',
    display: 'block',
    marginBottom: '8px',
  },
  footerTagline: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  footerLinks: {
    display: 'flex',
    gap: '32px',
  },
  footerLink: {
    color: '#d1d5db',
    textDecoration: 'none',
    fontSize: '15px',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  footerCopy: {
    color: '#9ca3af',
    fontSize: '14px',
  },
};

export default ModernHome;