import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useUser } from '../context/UserContext';
import { colors, fonts, radius } from '../design';

function ApplicationPending() {
  const { currentUserData } = useUser();

  const [position, setPosition] = useState(null);

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const q = query(collection(db, 'users'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        // Position is based on how many pending users exist
        setPosition(snap.size);
      } catch (err) {
        console.warn('Could not fetch position:', err);
      }
    };
    fetchPosition();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><span style={{ color: '#f8f6f2' }}>R</span><span style={{ color: '#c4956a' }}>.</span></div>
        <h1 style={styles.title}>You're in the queue.</h1>
        <p style={styles.body}>
          Rihlah is invitation-only. We review every application personally to keep this community intentional.
        </p>
        <p style={styles.body}>
          You will hear from us within 48 hours.
        </p>

        {position && (
          <div style={styles.positionBadge}>
            <div style={styles.positionNumber}>#{position}</div>
            <div style={styles.positionLabel}>in queue</div>
          </div>
        )}

        {currentUserData?.name && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryName}>{currentUserData.name}</div>
            {currentUserData.occupation && (
              <div style={styles.summaryDetail}>{currentUserData.occupation}</div>
            )}
            {currentUserData.city && (
              <div style={styles.summaryDetail}>{currentUserData.city}</div>
            )}
          </div>
        )}

        <div style={styles.founderCallout}>
          <div style={styles.founderBadge}>FOUNDING MEMBER</div>
          <p style={styles.founderText}>
            The first 100 accepted members receive permanent Founding Member status with lifetime free access.
          </p>
        </div>

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
  summaryCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '20px',
    margin: '28px 0',
  },
  summaryName: {
    fontFamily: fonts.serif,
    fontSize: '18px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '4px',
  },
  summaryDetail: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '2px',
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
  positionBadge: {
    margin: '28px auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  positionNumber: {
    fontFamily: fonts.serif,
    fontSize: '48px',
    fontWeight: '500',
    color: colors.terracotta,
  },
  positionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  founderCallout: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center',
  },
  founderBadge: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    color: colors.terracotta,
    marginBottom: '8px',
  },
  founderText: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
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

export default ApplicationPending;
