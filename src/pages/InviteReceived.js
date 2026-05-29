import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { getDestinationImage } from '../data/destinations';
import { colors, fonts, radius } from '../design';

function InviteReceived() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const inviteDoc = await getDoc(doc(db, 'invites', inviteId));
        if (inviteDoc.exists()) {
          setInvite(inviteDoc.data());
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [inviteId]);

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const handleJoin = () => {
    if (currentUser) {
      navigate('/add-trip', {
        state: {
          preselectedDestination: invite.destination,
          inviteData: {
            inviteId,
            inviterId: invite.inviterId,
            inviterName: invite.inviterName,
            destination: invite.destination,
            startDate: invite.startDate,
            endDate: invite.endDate,
          },
        },
      });
    } else {
      localStorage.setItem('rihlah_pending_invite', inviteId);
      navigate('/signup');
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingWrap}>
          <div style={styles.brandMark}>R</div>
          <div style={styles.brandText}>Rihlah</div>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingWrap}>
          <div style={styles.brandMark}>R</div>
          <div style={styles.brandText}>Rihlah</div>
          <p style={styles.errorText}>This invite is no longer available.</p>
          <button style={styles.joinBtn} onClick={() => navigate('/')}>
            Explore Rihlah
          </button>
        </div>
      </div>
    );
  }

  const destCity = invite.destination.split(',')[0];
  const destImage = getDestinationImage(invite.destination);
  const startFmt = parseDate(invite.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const endFmt = parseDate(invite.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const inviterFirst = invite.inviterName?.split(' ')[0] || 'Someone';
  const experiences = invite.experiences || [];
  const travelers = invite.travelers || [];

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(rgba(26,26,26,0.7), rgba(26,26,26,0.85)), url(${destImage})`,
        }}
      >
        <div style={styles.heroBrand}>RIHLAH</div>
        <div style={styles.heroInvite}>{inviterFirst} invited you to join</div>
        <h1 style={styles.heroDest}>{destCity}</h1>
        <div style={styles.heroDates}>{startFmt} — {endFmt}</div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Travelers */}
        {travelers.length > 0 && (
          <div style={styles.travelersSection}>
            <div style={styles.travelersAvatars}>
              {travelers.slice(0, 4).map((t, i) => (
                <div key={i} style={styles.travelerAvatar}>
                  {t.photoURL ? (
                    <img src={t.photoURL} alt={t.name} style={styles.travelerImg} />
                  ) : (
                    <span style={styles.travelerInitial}>{t.name?.charAt(0)}</span>
                  )}
                </div>
              ))}
            </div>
            <div style={styles.travelersText}>
              {travelers.length === 1
                ? `${travelers[0].name?.split(' ')[0]} is going`
                : travelers.length === 2
                  ? `${travelers[0].name?.split(' ')[0]} & ${travelers[1].name?.split(' ')[0]} are going`
                  : `${travelers[0].name?.split(' ')[0]}, ${travelers[1].name?.split(' ')[0]} & ${travelers.length - 2} more are going`}
            </div>
          </div>
        )}

        {/* Experiences */}
        {experiences.length > 0 && (
          <div style={styles.expSection}>
            <div style={styles.expLabel}>Planned so far</div>
            {experiences.slice(0, 3).map((exp, i) => (
              <div key={i} style={styles.expItem}>
                <div style={styles.expDot} />
                <div style={styles.expInfo}>
                  <div style={styles.expName}>{exp.name}</div>
                  {exp.price && <div style={styles.expPrice}>${exp.price}/person</div>}
                </div>
              </div>
            ))}
            {experiences.length > 3 && (
              <div style={styles.expMore}>+{experiences.length - 3} more experience{experiences.length - 3 !== 1 ? 's' : ''}</div>
            )}
          </div>
        )}

        {/* CTA */}
        <button style={styles.joinBtn} onClick={handleJoin}>
          {currentUser ? `Add ${destCity} to your journeys` : `Join the journey`}
        </button>

        {!currentUser && (
          <button style={styles.loginLink} onClick={() => {
            localStorage.setItem('rihlah_pending_invite', inviteId);
            navigate('/login');
          }}>
            Already on Rihlah? Sign in
          </button>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerBrand}>Rihlah</div>
          <div style={styles.footerText}>Travel with your people.</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg },
  loadingWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  brandMark: { width: '64px', height: '64px', borderRadius: '16px', background: colors.dark, color: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.serif, fontSize: '32px', fontWeight: '600', marginBottom: '16px' },
  brandText: { fontFamily: fonts.serif, fontSize: '24px', fontWeight: '500', color: colors.text, marginBottom: '16px' },
  errorText: { fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' },

  // Hero
  hero: { padding: '60px 24px 40px', backgroundSize: 'cover', backgroundPosition: 'center', textAlign: 'center' },
  heroBrand: { fontSize: '11px', fontWeight: '700', letterSpacing: '3px', color: 'rgba(248,246,242,0.5)', marginBottom: '40px' },
  heroInvite: { fontSize: '14px', color: 'rgba(248,246,242,0.7)', marginBottom: '8px' },
  heroDest: { fontFamily: fonts.serif, fontSize: '42px', fontWeight: '600', color: colors.cream, margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  heroDates: { fontSize: '15px', color: 'rgba(248,246,242,0.6)' },

  // Content
  content: { padding: '28px 24px', maxWidth: '500px', margin: '0 auto' },

  // Travelers
  travelersSection: { display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: '20px' },
  travelersAvatars: { display: 'flex', flexShrink: 0 },
  travelerAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', fontFamily: fonts.serif, marginLeft: '-8px', border: `2px solid ${colors.surface}`, overflow: 'hidden' },
  travelerImg: { width: '100%', height: '100%', objectFit: 'cover' },
  travelerInitial: { fontSize: '14px', fontWeight: '600' },
  travelersText: { fontSize: '14px', fontWeight: '600', color: colors.text, lineHeight: 1.4 },

  // Experiences
  expSection: { marginBottom: '28px' },
  expLabel: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textTertiary, marginBottom: '14px' },
  expItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: colors.surface, borderRadius: radius.md, border: `1px solid ${colors.border}`, marginBottom: '8px' },
  expDot: { width: '8px', height: '8px', borderRadius: '50%', background: colors.gold, flexShrink: 0 },
  expInfo: { flex: 1 },
  expName: { fontSize: '15px', fontWeight: '600', color: colors.text },
  expPrice: { fontSize: '13px', color: colors.textSecondary, marginTop: '2px' },
  expMore: { fontSize: '13px', color: colors.textTertiary, fontWeight: '500', textAlign: 'center', padding: '8px 0' },

  // CTA
  joinBtn: { width: '100%', padding: '18px', background: colors.dark, color: colors.cream, border: 'none', borderRadius: radius.md, fontSize: '16px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px' },
  loginLink: { width: '100%', padding: '14px', background: 'none', border: 'none', color: colors.textTertiary, fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },

  // Footer
  footer: { textAlign: 'center', marginTop: '40px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` },
  footerBrand: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '4px' },
  footerText: { fontSize: '13px', color: colors.textTertiary, fontStyle: 'italic' },
};

export default InviteReceived;
