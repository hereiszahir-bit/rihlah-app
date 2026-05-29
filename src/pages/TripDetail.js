import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiMoreHorizontal, FiPlus, FiTrash2, FiStar, FiX, FiMessageCircle, FiCamera, FiMapPin, FiNavigation, FiCheck, FiShare2 } from 'react-icons/fi';
import { getDestinationImage } from '../data/destinations';
import { colors, fonts, radius, components } from '../design';

function TripDetail() {
  const { tripIndex } = useParams();
  const navigate = useNavigate();
  const { currentUser, currentUserData, allUsers, connections: myConnections_enriched, sentRequestUserIds, refreshCurrentUser, refreshConnections } = useUser();
  const [previewUser, setPreviewUser] = useState(null);
  const [localSentRequests, setLocalSentRequests] = useState([]);
  const [removingExp, setRemovingExp] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const idx = parseInt(tripIndex);
  const trips = currentUserData?.upcomingTrips || [];
  const trip = trips[idx];

  const allSentRequests = useMemo(() => [...new Set([...sentRequestUserIds, ...localSentRequests])], [sentRequestUserIds, localSentRequests]);

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isThere = useMemo(() => {
    if (!trip) return false;
    return today >= parseDate(trip.startDate) && today <= parseDate(trip.endDate);
  }, [trip, today]);

  const daysAway = useMemo(() => {
    if (!trip) return null;
    const start = parseDate(trip.startDate);
    if (start <= today) return null;
    return Math.ceil((start - today) / (1000 * 60 * 60 * 24));
  }, [trip, today]);

  const nightCount = useMemo(() => {
    if (!trip) return 0;
    const s = parseDate(trip.startDate);
    const e = parseDate(trip.endDate);
    return Math.round((e - s) / (1000 * 60 * 60 * 24));
  }, [trip]);

  // Overlapping travelers
  const travelers = useMemo(() => {
    if (!trip || !currentUser || !currentUserData) return [];

    const myGender = currentUserData.gender || '';
    const myVisibility = currentUserData.profileVisibility || 'both';
    const myConnIds = (currentUserData.connections || []).map(c => c.userId);
    const myStart = parseDate(trip.startDate);
    const myEnd = parseDate(trip.endDate);
    const people = [];

    allUsers.forEach(u => {
      if (u.id === currentUser.uid) return;
      if (!Array.isArray(u.upcomingTrips) || u.upcomingTrips.length === 0) return;

      if (!myConnIds.includes(u.id)) {
        const theirVis = u.profileVisibility || 'both';
        if (theirVis !== 'both' && theirVis !== myGender) return;
        if (myVisibility !== 'both' && u.gender !== myVisibility) return;
      }

      u.upcomingTrips.forEach(ut => {
        if (ut.destination !== trip.destination) return;
        const uStart = parseDate(ut.startDate);
        const uEnd = parseDate(ut.endDate);
        if (uStart <= myEnd && uEnd >= myStart) {
          const isConn = myConnIds.includes(u.id);
          const connRecord = isConn ? myConnections_enriched.find(c => c.userId === u.id) : null;
          people.push({
            ...u,
            tripStart: ut.startDate,
            tripEnd: ut.endDate,
            isThere: today >= uStart && today <= uEnd,
            isConnected: isConn,
            whatsapp: connRecord?.whatsapp,
            instagram: connRecord?.instagram,
          });
        }
      });
    });

    const seen = {};
    return people.filter(p => {
      if (seen[p.id]) return false;
      seen[p.id] = true;
      return true;
    }).sort((a, b) => {
      if (a.isConnected && !b.isConnected) return -1;
      if (!a.isConnected && b.isConnected) return 1;
      return 0;
    });
  }, [trip, currentUser, currentUserData, allUsers, myConnections_enriched, today]);

  const handleSendConnectionRequest = async (toUser) => {
    try {
      if (!currentUser || !currentUserData) return;
      const alreadyConnected = (currentUserData.connections || []).some(c => c.userId === toUser.id);
      if (alreadyConnected) return;

      const [fromMeSnapshot, toMeSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', currentUser.uid)))
      ]);
      const allDocs = [...fromMeSnapshot.docs, ...toMeSnapshot.docs];
      const exists = allDocs.find(d => {
        const data = d.data();
        return (data.fromUserId === currentUser.uid && data.toUserId === toUser.id) ||
               (data.fromUserId === toUser.id && data.toUserId === currentUser.uid);
      });
      if (exists) return;

      setLocalSentRequests(prev => [...prev, toUser.id]);
      await addDoc(collection(db, 'connectionRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: currentUserData.name,
        fromUserAge: currentUserData.age,
        fromUserGender: currentUserData.gender,
        fromUserBio: currentUserData.bio || '',
        fromUserPhotoURL: currentUserData.photoURL || '',
        fromUserInterests: currentUserData.interests || [],
        toUserId: toUser.id,
        toUserName: toUser.name || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      refreshConnections();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRemoveExperience = async (expId) => {
    if (!currentUser || !currentUserData) return;
    setRemovingExp(expId);
    try {
      const updatedTrips = [...currentUserData.upcomingTrips];
      updatedTrips[idx] = {
        ...updatedTrips[idx],
        experiences: (updatedTrips[idx].experiences || []).filter(e => e.id !== expId),
      };
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      await refreshCurrentUser();
    } catch (error) {
      console.error('Error removing experience:', error);
    }
    setRemovingExp(null);
  };

  const handleDeleteTrip = async () => {
    if (!currentUser || !currentUserData) return;
    const updatedTrips = currentUserData.upcomingTrips.filter((_, i) => i !== idx);
    await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
    await refreshCurrentUser();
    navigate('/trips');
  };

  if (!trip) {
    return (
      <div style={styles.page}>
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.serif, fontSize: '20px', color: colors.text, marginBottom: '12px' }}>Journey not found</div>
          <button style={styles.linkBtn} onClick={() => navigate('/trips')}>Back to journeys</button>
        </div>
      </div>
    );
  }

  const destCity = trip.destination.split(',')[0];
  const destImage = getDestinationImage(trip.destination);
  const startFmt = parseDate(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const endFmt = parseDate(trip.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const experiences = trip.experiences || [];
  const connectedTravelers = travelers.filter(t => t.isConnected);
  const discoveryTravelers = travelers.filter(t => !t.isConnected);

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(rgba(26,26,26,0.3), rgba(26,26,26,0.8)), url(${destImage})`,
        }}
      >
        <div style={styles.heroNav}>
          <button style={styles.heroBtn} onClick={() => navigate('/trips')}>
            <FiArrowLeft size={20} />
          </button>
          <button style={styles.heroBtn} onClick={() => setShowOptions(!showOptions)}>
            <FiMoreHorizontal size={20} />
          </button>
        </div>
        {showOptions && (
          <div style={styles.optionsMenu}>
            <button style={styles.optionItem} onClick={() => { setShowOptions(false); navigate(`/trip/${idx}/invite`); }}>
              <FiShare2 size={14} style={{ marginRight: '8px' }} /> Share invite
            </button>
            <button style={{ ...styles.optionItem, color: colors.error }} onClick={() => { setShowOptions(false); handleDeleteTrip(); }}>
              <FiTrash2 size={14} style={{ marginRight: '8px' }} /> Remove journey
            </button>
          </div>
        )}
        <div style={styles.heroBottom}>
          <h1 style={styles.heroCity}>{destCity}</h1>
          <div style={styles.heroDates}>{startFmt} — {endFmt}</div>
        </div>
      </div>

      {/* Travelers summary bar */}
      <div style={styles.travelersBar}>
        <div style={styles.travelersAvatars}>
          {travelers.slice(0, 4).map((t) => (
            <div key={t.id} style={styles.miniAvatar}>
              {t.photoURL ? (
                <img src={t.photoURL} alt={t.name} style={styles.miniAvatarImg} />
              ) : (
                <span style={styles.miniAvatarInitial}>{t.name?.charAt(0)}</span>
              )}
            </div>
          ))}
          {travelers.length > 4 && (
            <div style={styles.miniAvatarMore}>+{travelers.length - 4}</div>
          )}
        </div>
        <span style={styles.travelersCount}>
          {travelers.length} traveler{travelers.length !== 1 ? 's' : ''}
        </span>
        <button style={styles.inviteChip} onClick={() => navigate(`/trip/${idx}/invite`)}>
          <FiPlus size={14} style={{ marginRight: '4px' }} /> Invite
        </button>
      </div>

      <div style={styles.content}>
        {/* Status pills */}
        <div style={styles.pills}>
          {isThere && <span style={styles.pillGold}>There now</span>}
          {daysAway && <span style={styles.pill}>{daysAway} days away</span>}
          <span style={styles.pill}>{nightCount} night{nightCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Your crew — connected travelers */}
        {connectedTravelers.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Your crew</h2>
              <span style={styles.sectionCount}>{connectedTravelers.length}</span>
            </div>
            <div style={styles.peopleList}>
              {connectedTravelers.map(user => (
                <div key={user.id} style={styles.personCard} onClick={() => setPreviewUser(user)}>
                  <div style={styles.personAvatar}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} style={styles.personAvatarImg} />
                    ) : (
                      <div style={styles.personAvatarPlaceholder}>{user.name?.charAt(0)}</div>
                    )}
                  </div>
                  <div style={styles.personInfo}>
                    <div style={styles.personName}>{user.name}</div>
                    <div style={styles.personMeta}>
                      {parseDate(user.tripStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {parseDate(user.tripEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {user.isThere && <span style={styles.thereTag}> · There now</span>}
                    </div>
                  </div>
                  <div style={styles.connectedBadge}>Connected</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discovery — other travelers */}
        {discoveryTravelers.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Also going</h2>
              <span style={styles.sectionCount}>{discoveryTravelers.length}</span>
            </div>
            <div style={styles.peopleList}>
              {discoveryTravelers.map(user => {
                const isPending = allSentRequests.includes(user.id);
                return (
                  <div key={user.id} style={styles.personCard} onClick={() => setPreviewUser(user)}>
                    <div style={styles.personAvatar}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} style={styles.personAvatarImg} />
                      ) : (
                        <div style={styles.personAvatarPlaceholder}>{user.name?.charAt(0)}</div>
                      )}
                    </div>
                    <div style={styles.personInfo}>
                      <div style={styles.personName}>{user.name}{user.age ? `, ${user.age}` : ''}</div>
                      <div style={styles.personMeta}>
                        {parseDate(user.tripStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {parseDate(user.tripEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {user.isThere && <span style={styles.thereTag}> · There now</span>}
                      </div>
                    </div>
                    {isPending ? (
                      <div style={styles.pendingBadge}>Pending</div>
                    ) : (
                      <button style={styles.connectBtn} onClick={(e) => { e.stopPropagation(); handleSendConnectionRequest(user); }}>
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No travelers prompt */}
        {travelers.length === 0 && (
          <div style={styles.emptySection}>
            <div style={styles.emptyTitle}>No one else is going yet</div>
            <div style={styles.emptyText}>Invite friends or check back — we'll match you with travelers headed to {destCity} during your dates.</div>
            <button style={styles.inviteBtnFull} onClick={() => navigate(`/trip/${idx}/invite`)}>
              Invite someone
            </button>
          </div>
        )}

        {/* Experiences */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Experiences</h2>
            <span style={styles.sectionCount}>{experiences.length}</span>
          </div>

          {experiences.length > 0 ? (
            <div style={styles.expList}>
              {experiences.map(exp => (
                <div key={exp.id} style={styles.expCard}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.expName}>{exp.name}</div>
                    <div style={styles.expMeta}>
                      <FiStar size={12} style={{ marginRight: '3px', verticalAlign: '-1px', color: colors.gold }} />
                      {exp.rating} · {exp.duration} · ${exp.price}
                    </div>
                  </div>
                  <button
                    style={styles.removeExpBtn}
                    onClick={() => handleRemoveExperience(exp.id)}
                    disabled={removingExp === exp.id}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyExp}>
              <div style={styles.emptyText}>No experiences saved yet.</div>
            </div>
          )}
          <button
            style={styles.addExpBtn}
            onClick={() => navigate(`/destination/${encodeURIComponent(trip.destination)}`)}
          >
            Browse {destCity} experiences
          </button>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (() => {
        const isPending = allSentRequests.includes(previewUser.id);
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div style={styles.modalTop}>
                <button style={styles.modalCloseBtn} onClick={() => setPreviewUser(null)}><FiX size={18} /></button>
                <div style={styles.modalAvatarWrap}>
                  {previewUser.photoURL ? (
                    <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalAvatarImg} />
                  ) : (
                    <div style={styles.modalAvatarPlaceholder}>{previewUser.name?.charAt(0)?.toUpperCase()}</div>
                  )}
                </div>
                <div style={styles.modalName}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</div>
                {previewUser.isThere && <span style={styles.modalBadge}><FiMapPin size={11} style={{ marginRight: '4px' }} /> There now</span>}
              </div>
              <div style={styles.modalBody}>
                {previewUser.bio && <p style={styles.modalBio}>{previewUser.bio}</p>}
                {previewUser.interests?.length > 0 && (
                  <div style={styles.modalInterests}>
                    {previewUser.interests.map(i => <span key={i} style={styles.modalChip}>{i}</span>)}
                  </div>
                )}
                {previewUser.isConnected && (previewUser.whatsapp || previewUser.instagram) && (
                  <div style={styles.modalSocials}>
                    {previewUser.whatsapp && (
                      <a href={`https://wa.me/${previewUser.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                        <FiMessageCircle size={14} style={{ marginRight: '4px' }} /> WhatsApp
                      </a>
                    )}
                    {previewUser.instagram && (
                      <a href={`https://www.instagram.com/${previewUser.instagram}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                        <FiCamera size={14} style={{ marginRight: '4px' }} /> @{previewUser.instagram}
                      </a>
                    )}
                  </div>
                )}
                {previewUser.isConnected ? (
                  <div style={styles.modalConnectedBadge}>Connected</div>
                ) : isPending ? (
                  <div style={styles.modalPendingBadge}>Request Pending</div>
                ) : (
                  <button style={styles.modalConnectBtn} onClick={() => { handleSendConnectionRequest(previewUser); setPreviewUser(null); }}>Connect</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: colors.bg, paddingBottom: '40px' },

  // Hero
  hero: {
    position: 'relative',
    height: '280px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  heroNav: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  heroBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(8px)',
    border: 'none',
    color: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  optionsMenu: {
    position: 'absolute',
    top: '64px',
    right: '16px',
    background: colors.surface,
    borderRadius: radius.md,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: 10,
    minWidth: '180px',
  },
  optionItem: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '14px 18px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderBottom: `1px solid ${colors.border}`,
  },
  heroBottom: { padding: '0 24px 24px' },
  heroCity: {
    fontFamily: fonts.serif,
    fontSize: '38px',
    fontWeight: '600',
    color: colors.cream,
    margin: 0,
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  heroDates: {
    fontSize: '15px',
    color: 'rgba(248,246,242,0.6)',
    marginTop: '6px',
  },

  // Travelers bar
  travelersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderBottom: `1px solid ${colors.border}`,
  },
  travelersAvatars: { display: 'flex', flexShrink: 0 },
  miniAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: colors.warmGray,
    border: `2px solid ${colors.bg}`,
    marginLeft: '-8px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  miniAvatarInitial: { fontSize: '13px', fontWeight: '600', color: colors.textSecondary },
  miniAvatarMore: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: colors.lightGray,
    border: `2px solid ${colors.bg}`,
    marginLeft: '-8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  travelersCount: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  inviteChip: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 18px',
    background: colors.dark,
    color: colors.cream,
    border: 'none',
    borderRadius: radius.full,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },

  content: { padding: '20px 24px' },

  // Pills
  pills: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  pill: {
    padding: '8px 16px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.full,
    fontSize: '13px',
    fontWeight: '600',
    color: colors.text,
  },
  pillGold: {
    padding: '8px 16px',
    background: colors.dark,
    border: 'none',
    borderRadius: radius.full,
    fontSize: '13px',
    fontWeight: '600',
    color: colors.gold,
  },

  // Sections
  section: { marginBottom: '28px' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '600',
    color: colors.text,
    margin: 0,
  },
  sectionCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textMuted,
    background: colors.lightGray,
    padding: '2px 8px',
    borderRadius: radius.full,
  },

  // People list
  peopleList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  personCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    background: colors.surface,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    cursor: 'pointer',
  },
  personAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  personAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  personAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: colors.warmGray,
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
  },
  personInfo: { flex: 1, minWidth: 0 },
  personName: { fontSize: '15px', fontWeight: '600', color: colors.text },
  personMeta: { fontSize: '12px', color: colors.textSecondary, marginTop: '2px' },
  thereTag: { color: colors.gold, fontWeight: '600' },
  connectedBadge: { padding: '6px 12px', background: colors.lightGray, color: colors.text, borderRadius: radius.sm, fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  pendingBadge: { padding: '6px 12px', background: colors.warningBg, color: colors.warning, borderRadius: radius.sm, fontSize: '12px', fontWeight: '600', flexShrink: 0 },
  connectBtn: { padding: '10px 16px', background: colors.dark, color: colors.cream, border: 'none', borderRadius: radius.sm, fontSize: '13px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },

  // Empty states
  emptySection: {
    textAlign: 'center',
    padding: '32px 20px',
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    marginBottom: '28px',
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: '17px', fontWeight: '600', color: colors.text, marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5, marginBottom: '16px' },
  emptyExp: {
    padding: '20px',
    background: colors.surface,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    marginBottom: '8px',
  },
  inviteBtnFull: {
    padding: '14px 28px',
    background: colors.dark,
    color: colors.cream,
    border: 'none',
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Experiences
  expList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' },
  expCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: colors.surface,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  expName: { fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '4px' },
  expMeta: { fontSize: '13px', color: colors.textSecondary },
  removeExpBtn: { background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '4px', flexShrink: 0 },
  addExpBtn: {
    width: '100%',
    padding: '14px',
    background: 'none',
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '4px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: colors.text,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '380px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalTop: { padding: '24px 24px 16px', textAlign: 'center', borderBottom: `1px solid ${colors.border}`, position: 'relative' },
  modalCloseBtn: { position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: colors.lightGray, border: 'none', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalAvatarWrap: { width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px' },
  modalAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modalAvatarPlaceholder: { width: '100%', height: '100%', background: colors.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', color: '#fff' },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '8px' },
  modalBadge: { fontSize: '12px', fontWeight: '600', color: colors.text, background: colors.lightGray, padding: '4px 12px', borderRadius: radius.full, display: 'inline-flex', alignItems: 'center' },
  modalBody: { padding: '20px 24px', overflowY: 'auto', flex: 1 },
  modalBio: { fontSize: '15px', color: colors.textSecondary, lineHeight: 1.6, margin: '0 0 16px 0' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  modalChip: { padding: '6px 14px', background: colors.lightGray, borderRadius: radius.full, fontSize: '13px', fontWeight: '500', color: colors.text },
  modalSocials: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: colors.lightGray, borderRadius: radius.sm, fontSize: '13px', fontWeight: '600', color: colors.text, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
  modalConnectBtn: { ...components.btnPrimary },
  modalConnectedBadge: { width: '100%', padding: '14px', background: colors.lightGray, color: colors.text, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
  modalPendingBadge: { width: '100%', padding: '14px', background: colors.warningBg, color: colors.warning, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
};

export default TripDetail;
