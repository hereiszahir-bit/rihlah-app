import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';
import { getDestinationImage } from '../data/destinations';
import { colors, fonts, radius } from '../design';

function TripInvite() {
  const { tripIndex } = useParams();
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers } = useUser();
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const idx = parseInt(tripIndex);
  const trips = currentUserData?.upcomingTrips || [];
  const trip = trips[idx];

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Compute overlapping travelers for the invite snapshot
  const travelers = useMemo(() => {
    if (!trip || !currentUser || !currentUserData) return [];
    const myStart = parseDate(trip.startDate);
    const myEnd = parseDate(trip.endDate);
    const myConnections = (currentUserData.connections || []).map(c => c.userId);

    const people = [];
    // Add self first
    people.push({ name: currentUserData.name, photoURL: currentUserData.photoURL || '' });

    allUsers.forEach((u) => {
      if (u.id === currentUser.uid) return;
      if (!Array.isArray(u.upcomingTrips)) return;

      u.upcomingTrips.forEach(ut => {
        if (ut.destination !== trip.destination) return;
        const uStart = parseDate(ut.startDate);
        const uEnd = parseDate(ut.endDate);
        if (uStart <= myEnd && uEnd >= myStart) {
          people.push({ name: u.name, photoURL: u.photoURL || '' });
        }
      });
    });

    const seen = new Set();
    return people.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
  }, [trip, currentUser, currentUserData, allUsers]);

  // Create invite doc in Firestore
  useEffect(() => {
    if (!trip || !currentUser || !currentUserData || inviteUrl || creating) return;

    const createInvite = async () => {
      setCreating(true);
      setInviteError('');
      try {
        const experiences = (trip.experiences || []).map(e => {
          const exp = { name: e.name || '' };
          if (e.price != null) exp.price = e.price;
          return exp;
        });
        const inviteDoc = await addDoc(collection(db, 'invites'), {
          inviterId: currentUser.uid,
          inviterName: currentUserData.name || '',
          inviterPhotoURL: currentUserData.photoURL || '',
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          experiences,
          travelers: travelers.slice(0, 5),
          createdAt: new Date().toISOString(),
        });
        const baseUrl = window.location.origin;
        setInviteUrl(`${baseUrl}/join/${inviteDoc.id}`);
      } catch (err) {
        console.error('Error creating invite:', err);
        setInviteError(err.message || 'Failed to create invite link');
        setCreating(false);
      }
    };
    createInvite();
  }, [trip, currentUser, currentUserData, travelers, inviteUrl, creating]);

  // Build invite text with real link
  const inviteText = useMemo(() => {
    if (!trip || !currentUserData) return '';
    const dest = trip.destination.split(',')[0];
    const startFmt = parseDate(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endFmt = parseDate(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const name = currentUserData.name?.split(' ')[0] || 'Someone';
    const link = inviteUrl || '';
    return `${name} is heading to ${dest} (${startFmt} – ${endFmt}) and wants you to join. Plan your journey on Rihlah: ${link}`;
  }, [trip, currentUserData, inviteUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = inviteText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank');
  };

  const handleiMessage = () => {
    window.open(`sms:&body=${encodeURIComponent(inviteText)}`, '_blank');
  };

  const handleInstagram = () => {
    navigator.clipboard?.writeText(inviteText);
    window.open('https://www.instagram.com/direct/inbox/', '_blank');
  };

  if (!trip) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
          </button>
          <h1 style={styles.title}>Journey not found</h1>
        </div>
      </div>
    );
  }

  const destCity = trip.destination.split(',')[0];
  const destImage = getDestinationImage(trip.destination);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
        </button>
        <h1 style={styles.title}>Invite to {destCity}</h1>
        <p style={styles.subtitle}>Share your journey with friends</p>
      </div>

      <div style={styles.content}>
        {/* Preview Card */}
        <div
          style={{
            ...styles.previewCard,
            backgroundImage: `linear-gradient(rgba(26,26,26,0.65), rgba(26,26,26,0.85)), url(${destImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div style={styles.previewEyebrow}>You're invited to</div>
          <div style={styles.previewDest}>{destCity}</div>
          <div style={styles.previewDates}>
            {parseDate(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {parseDate(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {travelers.length > 0 && (
            <div style={styles.previewTravelers}>
              <div style={styles.previewAvatars}>
                {travelers.slice(0, 3).map((t, i) => (
                  <div key={i} style={styles.previewAvatar}>
                    {t.photoURL ? (
                      <img src={t.photoURL} alt="" style={styles.previewAvatarImg} />
                    ) : (
                      t.name?.charAt(0)
                    )}
                  </div>
                ))}
              </div>
              <span style={styles.previewCount}>{travelers.length} going</span>
            </div>
          )}
          {trip.experiences?.length > 0 && (
            <div style={styles.previewExp}>
              {trip.experiences.length} experience{trip.experiences.length !== 1 ? 's' : ''} planned
            </div>
          )}
        </div>

        {/* Share Options */}
        <div style={styles.shareSection}>
          <div style={styles.shareLabel}>Share via</div>

          {!inviteUrl && !inviteError && (
            <div style={styles.generatingLink}>Generating invite link...</div>
          )}
          {inviteError && (
            <div style={styles.inviteError}>{inviteError}</div>
          )}

          <button style={{...styles.shareOption, opacity: inviteUrl ? 1 : 0.4, pointerEvents: inviteUrl ? 'auto' : 'none'}} onClick={handleWhatsApp}>
            <div style={{ ...styles.shareIconWrap, background: '#25D366' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span style={styles.shareOptionLabel}>WhatsApp</span>
          </button>

          <button style={{...styles.shareOption, opacity: inviteUrl ? 1 : 0.4, pointerEvents: inviteUrl ? 'auto' : 'none'}} onClick={handleiMessage}>
            <div style={{ ...styles.shareIconWrap, background: '#34C759' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
            </div>
            <span style={styles.shareOptionLabel}>iMessage</span>
          </button>

          <button style={{...styles.shareOption, opacity: inviteUrl ? 1 : 0.4, pointerEvents: inviteUrl ? 'auto' : 'none'}} onClick={handleInstagram}>
            <div style={{ ...styles.shareIconWrap, background: '#E1306C' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
            <span style={styles.shareOptionLabel}>Instagram DM</span>
          </button>

          <button style={{...styles.shareOption, opacity: inviteUrl ? 1 : 0.4, pointerEvents: inviteUrl ? 'auto' : 'none'}} onClick={handleCopyLink}>
            <div style={styles.shareIconWrap}>
              {copied ? <FiCheck size={20} color={colors.gold} /> : <FiCopy size={20} color={colors.text} />}
            </div>
            <span style={styles.shareOptionLabel}>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
        </div>

        {/* Invite Message Preview */}
        <div style={styles.messagePreview}>
          <div style={styles.messageLabel}>Invite message</div>
          <div style={styles.messageText}>{inviteText}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg },
  header: { background: colors.surface, padding: '8px 24px 14px', borderBottom: `1px solid ${colors.border}` },
  backBtn: { background: 'none', border: 'none', color: colors.text, fontSize: '15px', fontWeight: '500', cursor: 'pointer', padding: '8px 0', marginBottom: '8px', display: 'inline-flex', alignItems: 'center' },
  title: { fontFamily: fonts.serif, fontSize: '26px', fontWeight: '500', color: colors.text, margin: '0 0 4px 0', letterSpacing: '-0.3px' },
  subtitle: { fontSize: '14px', color: colors.textSecondary, margin: 0 },
  content: { padding: '20px 24px', maxWidth: '500px', margin: '0 auto' },

  // Preview card with image bg
  previewCard: { borderRadius: radius.lg, padding: '32px 24px', textAlign: 'center', marginBottom: '28px' },
  previewEyebrow: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(248,246,242,0.5)', marginBottom: '12px' },
  previewDest: { fontFamily: fonts.serif, fontSize: '28px', fontWeight: '600', color: colors.cream, marginBottom: '6px' },
  previewDates: { fontSize: '14px', color: 'rgba(248,246,242,0.65)', marginBottom: '16px' },
  previewTravelers: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' },
  previewAvatars: { display: 'flex' },
  previewAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', fontFamily: fonts.serif, marginLeft: '-6px', border: '2px solid rgba(26,26,26,0.6)', overflow: 'hidden' },
  previewAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  previewCount: { fontSize: '13px', color: 'rgba(248,246,242,0.7)', fontWeight: '500' },
  previewExp: { fontSize: '12px', color: colors.gold, fontWeight: '600' },

  // Share options with colored icons
  shareSection: { marginBottom: '28px' },
  shareLabel: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textTertiary, marginBottom: '12px' },
  shareOption: { display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '14px 16px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, cursor: 'pointer', marginBottom: '8px', fontFamily: 'inherit' },
  shareIconWrap: { width: '40px', height: '40px', borderRadius: '50%', background: colors.lightGray, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  shareOptionLabel: { fontSize: '15px', fontWeight: '600', color: colors.text },

  generatingLink: { fontSize: '13px', color: colors.textTertiary, fontWeight: '500', textAlign: 'center', padding: '8px 0', marginBottom: '4px' },
  inviteError: { fontSize: '13px', color: '#dc2626', fontWeight: '500', textAlign: 'center', padding: '8px 0', marginBottom: '4px' },
  messagePreview: { background: colors.surface, borderRadius: radius.md, padding: '16px', border: `1px solid ${colors.border}` },
  messageLabel: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.textTertiary, marginBottom: '8px' },
  messageText: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 },
};

export default TripInvite;
