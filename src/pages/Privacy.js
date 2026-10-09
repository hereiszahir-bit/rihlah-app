import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { colors, fonts } from '../design';

function Privacy() {
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
      <header style={{
        ...styles.header,
        background: scrolled ? 'rgba(245, 241, 234, 0.95)' : 'rgba(245, 241, 234, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={styles.headerInner}>
          <Link to="/" style={styles.wordmark}>rihlah</Link>
          <Link to="/" style={styles.backLink}>Home</Link>
        </div>
      </header>

      <section style={styles.content}>
        <div style={styles.inner}>
          <div style={styles.label}>Legal</div>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.updated}>Last updated: September 25, 2026</p>

          <div style={styles.body}>
            <h2 style={styles.heading}>Overview</h2>
            <p>
              Rihlah ("we," "us," or "our") operates the website rihlah.io and the Rihlah mobile
              application (collectively, the "Service"). This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our Service.
            </p>

            <h2 style={styles.heading}>Information We Collect</h2>
            <h3 style={styles.subheading}>Account Information</h3>
            <p>
              When you create an account, we collect your name, email address, date of birth, and
              profile photo. If you sign up with Google, we receive your name, email, and profile
              picture from your Google account.
            </p>
            <h3 style={styles.subheading}>Profile Information</h3>
            <p>
              You may optionally provide additional information including your bio, city, interests,
              travel style, and additional photos. This information is visible to other members of
              the community.
            </p>
            <h3 style={styles.subheading}>Travel Information</h3>
            <p>
              When you add trips, we store your destination, travel dates, and trip details. This
              information is used to connect you with other travelers and is visible to community
              members.
            </p>
            <h3 style={styles.subheading}>Messages</h3>
            <p>
              We store messages you send through the Service to deliver them to other users. Messages
              are stored in our database and are accessible only to conversation participants.
            </p>
            <h3 style={styles.subheading}>Usage Data</h3>
            <p>
              We automatically collect certain information when you access the Service, including your
              device type, browser type, and general usage patterns. We use Firebase Analytics for
              this purpose.
            </p>

            <h2 style={styles.heading}>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul style={styles.list}>
              <li>Provide, maintain, and improve the Service</li>
              <li>Connect you with other travelers based on shared destinations and interests</li>
              <li>Send you service-related communications (account verification, trip updates)</li>
              <li>Publish content to our Instagram account on behalf of our brand (not user content)</li>
              <li>Monitor and analyze usage trends to improve the experience</li>
            </ul>

            <h2 style={styles.heading}>Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul style={styles.list}>
              <li><strong>Firebase (Google)</strong> — authentication, database, hosting, and analytics</li>
              <li><strong>Google Sign-In</strong> — optional authentication method</li>
              <li><strong>Instagram Graph API (Meta)</strong> — to publish brand content to our Instagram account. We do not access or publish any user data through this API.</li>
              <li><strong>GetYourGuide</strong> — affiliate links for experiences and activities</li>
            </ul>
            <p>
              Each third-party service has its own privacy policy governing the use of your information.
            </p>

            <h2 style={styles.heading}>Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share
              your information only in the following circumstances:
            </p>
            <ul style={styles.list}>
              <li>With other Rihlah members as part of the community features you opt into</li>
              <li>With service providers who assist us in operating the Service (Firebase, hosting)</li>
              <li>If required by law or to protect our rights</li>
            </ul>

            <h2 style={styles.heading}>Data Security</h2>
            <p>
              We use commercially reasonable measures to protect your information, including encryption
              in transit (HTTPS), Firebase security rules, and access controls. However, no method of
              electronic transmission or storage is 100% secure.
            </p>

            <h2 style={styles.heading}>Data Retention</h2>
            <p>
              We retain your information for as long as your account is active. You may request
              deletion of your account and associated data by contacting us at hello@rihlah.io.
            </p>

            <h2 style={styles.heading}>Your Rights</h2>
            <p>You have the right to:</p>
            <ul style={styles.list}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at hello@rihlah.io.
            </p>

            <h2 style={styles.heading}>Children's Privacy</h2>
            <p>
              The Service is not intended for anyone under the age of 18. We do not knowingly collect
              information from children under 18.
            </p>

            <h2 style={styles.heading}>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 style={styles.heading}>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at hello@rihlah.io.
            </p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerWordmark}>rihlah</div>
          <p style={styles.footerTagline}>Travel with your people.</p>
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
  content: {
    paddingTop: '120px',
    paddingBottom: '80px',
    padding: '120px 32px 80px',
  },
  inner: {
    maxWidth: '680px',
    margin: '0 auto',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: colors.terracotta,
    marginBottom: '20px',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  updated: {
    fontSize: '14px',
    color: colors.textTertiary,
    marginBottom: '48px',
  },
  body: {
    fontSize: '15px',
    lineHeight: 1.8,
    color: colors.textSecondary,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
    marginTop: '40px',
    marginBottom: '12px',
  },
  subheading: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    marginTop: '20px',
    marginBottom: '8px',
  },
  list: {
    paddingLeft: '20px',
    marginTop: '8px',
    marginBottom: '16px',
  },
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
  footerCopy: {
    fontSize: '12px',
    color: colors.textMuted,
  },
};

export default Privacy;
