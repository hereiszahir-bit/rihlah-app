import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { colors, fonts, radius } from '../design';

function ApplicationRejected() {
  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><span style={{ color: '#f8f6f2' }}>R</span><span style={{ color: '#c4956a' }}>.</span></div>
        <h1 style={styles.title}>Application not accepted</h1>
        <p style={styles.body}>
          We're not able to accept your application at this time. Rihlah is a small, curated community and we're being very selective in this early phase.
        </p>
        <p style={styles.body}>
          You're welcome to reapply in the future.
        </p>

        <div style={styles.note}>
          Questions? Reach out on Instagram{' '}
          <a href="https://instagram.com/rihlah.io" target="_blank" rel="noopener noreferrer" style={styles.link}>
            @rihlah.io
          </a>
        </div>

        <button style={styles.signOutBtn} onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bg,
    padding: '20px',
  },
  card: {
    maxWidth: '460px',
    width: '100%',
    textAlign: 'center',
    padding: '48px 36px',
  },
  logo: {
    width: '64px',
    height: '64px',
    background: '#1a1917',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.serif,
    fontSize: '36px',
    fontWeight: '600',
    color: colors.terracotta,
    margin: '0 auto 32px',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '28px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '20px',
    letterSpacing: '-0.3px',
  },
  body: {
    fontSize: '15px',
    color: colors.textSecondary,
    lineHeight: 1.7,
    marginBottom: '16px',
  },
  note: {
    fontSize: '13px',
    color: colors.textMuted,
    marginTop: '32px',
    lineHeight: 1.6,
  },
  link: {
    color: colors.terracotta,
    textDecoration: 'none',
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: '24px',
    padding: '12px 24px',
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textSecondary,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
};

export default ApplicationRejected;
