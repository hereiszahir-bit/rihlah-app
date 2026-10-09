import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { colors, fonts, radius } from '../design';
import { sendApplicationReceived, sendApplicationApproved, sendApplicationRejected } from '../utils/sendEmail';

// Only these UIDs can access the admin page
const ADMIN_UIDS = [
  'o5pb2aGXmGRJQgMhZwdXLdY9Mrd2',
];

function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [processing, setProcessing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [emailSent, setEmailSent] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid && ADMIN_UIDS.includes(uid)) {
      setAuthorized(true);
      loadApplications();
    } else {
      setAuthorized(false);
      setLoading(false);
    }
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'users'));
    const users = [];
    let pending = 0, approved = 0, rejected = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const status = data.status || 'approved';
      if (status === 'pending') pending++;
      else if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
      users.push({ id: docSnap.id, ...data });
    });

    setApplications(users);
    setStats({ pending, approved, rejected, total: users.length });

    // Load reports
    try {
      const reportsSnapshot = await getDocs(collection(db, 'reports'));
      const reportsList = [];
      reportsSnapshot.forEach(d => reportsList.push({ id: d.id, ...d.data() }));
      reportsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setReports(reportsList);
    } catch (e) {
      console.error('Error loading reports:', e);
    }

    setLoading(false);
  };

  const cascadeDeleteUser = async (userId) => {
    // Delete connection requests
    const [incoming, outgoing] = await Promise.all([
      getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', userId))),
      getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', userId))),
    ]);
    const deletes = [];
    incoming.forEach(d => deletes.push(deleteDoc(doc(db, 'connectionRequests', d.id))));
    outgoing.forEach(d => deletes.push(deleteDoc(doc(db, 'connectionRequests', d.id))));

    // Remove from other users' connections arrays
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const conns = userDoc.data().connections || [];
      for (const conn of conns) {
        try {
          const otherDoc = await getDoc(doc(db, 'users', conn.userId));
          if (otherDoc.exists()) {
            const otherConns = otherDoc.data().connections || [];
            const filtered = otherConns.filter(c => c.userId !== userId);
            if (filtered.length !== otherConns.length) {
              await updateDoc(doc(db, 'users', conn.userId), { connections: filtered });
            }
          }
        } catch (e) { /* skip if other user already deleted */ }
      }
    }

    // Delete conversations where user is a participant
    try {
      const convSnap = await getDocs(query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      ));
      convSnap.forEach(d => deletes.push(deleteDoc(doc(db, 'conversations', d.id))));
    } catch (e) { /* conversations may not exist */ }

    if (deletes.length) await Promise.all(deletes);

    // Delete user doc last
    await deleteDoc(doc(db, 'users', userId));
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Delete user ${userId}? This cannot be undone.`)) return;
    setProcessing(userId);
    try {
      await cascadeDeleteUser(userId);
      await loadApplications();
    } catch (err) {
      console.error('Delete error:', err);
    }
    setProcessing(null);
  };

  const handlePurgeDummy = async () => {
    const dummyUsers = applications.filter(u => u.id.startsWith('dummy-'));
    if (!dummyUsers.length) { alert('No dummy data found.'); return; }
    if (!window.confirm(`Delete ${dummyUsers.length} dummy accounts and their connection requests?`)) return;
    setProcessing('purge');
    try {
      for (const u of dummyUsers) {
        await cascadeDeleteUser(u.id);
      }
      await loadApplications();
    } catch (err) {
      console.error('Purge error:', err);
    }
    setProcessing(null);
  };

  const filtered = useMemo(() => {
    return applications
      .filter(u => (u.status || 'approved') === activeTab)
      .sort((a, b) => {
        const dateA = a.appliedAt || a.createdAt || '';
        const dateB = b.appliedAt || b.createdAt || '';
        return new Date(dateB) - new Date(dateA);
      });
  }, [applications, activeTab]);

  const handleApprove = async (user) => {
    setProcessing(user.id);
    try {
      // Count current approved users to determine founding member status
      const approvedCount = applications.filter(u => u.status === 'approved').length;
      const isFoundingMember = approvedCount < 100;

      const updates = {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: auth.currentUser.uid,
      };
      if (isFoundingMember) {
        updates.foundingMember = true;
      }

      await updateDoc(doc(db, 'users', user.id), updates);

      // Send approval email (only if user has an email on file)
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const email = userDoc.data()?.email;
      if (email) {
        sendApplicationApproved(email, user.name, isFoundingMember).catch(console.error);
      }

      await loadApplications();
    } catch (err) {
      console.error('Approve error:', err);
    }
    setProcessing(null);
  };

  const handleReject = async (user) => {
    setProcessing(user.id);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: auth.currentUser.uid,
      });

      const userDoc = await getDoc(doc(db, 'users', user.id));
      const email = userDoc.data()?.email;
      if (email) {
        sendApplicationRejected(email, user.name).catch(console.error);
      }

      await loadApplications();
    } catch (err) {
      console.error('Reject error:', err);
    }
    setProcessing(null);
  };

  const handleResendEmail = async (user) => {
    if (!user.email) {
      alert('No email on file for this user.');
      return;
    }
    setProcessing(user.id);
    try {
      const status = user.status || 'approved';
      if (status === 'pending') {
        await sendApplicationReceived(user.email, user.name);
      } else if (status === 'approved') {
        await sendApplicationApproved(user.email, user.name, user.foundingMember || false);
      } else if (status === 'rejected') {
        await sendApplicationRejected(user.email, user.name);
      }
      setEmailSent(user.id);
      setTimeout(() => setEmailSent(null), 3000);
    } catch (err) {
      console.error('Email error:', err);
      alert('Failed to send email.');
    }
    setProcessing(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (!authorized) {
    return (
      <div style={styles.page}>
        <div style={styles.unauthorized}>Not authorized</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading applications...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.title}>Applications</div>
          <div style={styles.subtitle}>{stats.total} total members</div>
        </div>

        {/* Cleanup actions */}
        <div style={styles.cleanupRow}>
          <button
            style={{ ...styles.purgeBtn, opacity: processing === 'purge' ? 0.5 : 1 }}
            onClick={handlePurgeDummy}
            disabled={processing === 'purge'}
          >
            {processing === 'purge' ? 'Purging...' : `Purge dummy data (${applications.filter(u => u.id.startsWith('dummy-')).length})`}
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: 'Pending', value: stats.pending, key: 'pending' },
            { label: 'Approved', value: stats.approved, key: 'approved' },
            { label: 'Rejected', value: stats.rejected, key: 'rejected' },
            { label: 'Reports', value: reports.length, key: 'reports' },
          ].map(s => (
            <div
              key={s.key}
              style={{
                ...styles.statCard,
                ...(activeTab === s.key ? styles.statCardActive : {}),
              }}
              onClick={() => setActiveTab(s.key)}
            >
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Reports list */}
        {activeTab === 'reports' && (
          <div style={styles.list}>
            {reports.length === 0 ? (
              <div style={styles.empty}>No reports</div>
            ) : reports.map(report => (
              <div key={report.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardName}>
                      Report: {report.reportedUserName || report.reportedUserId}
                    </div>
                    <div style={styles.cardMeta}>
                      By {report.reporterId} · {formatDate(report.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ ...styles.cardExpanded, display: 'block' }}>
                  <div style={styles.fieldRow}>
                    <span style={styles.fieldLabel}>Reason</span>
                    <span style={styles.fieldValue}>{report.reason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application list */}
        {activeTab !== 'reports' && <div style={styles.list}>
          {filtered.length === 0 && (
            <div style={styles.empty}>No {activeTab} applications</div>
          )}

          {filtered.map(user => {
            const isExpanded = expandedId === user.id;
            const isProcessing = processing === user.id;

            return (
              <div key={user.id} style={styles.card}>
                <div
                  style={styles.cardHeader}
                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                >
                  <div style={styles.cardPhoto}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} style={styles.avatar} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>{user.name?.charAt(0)}</div>
                    )}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardName}>
                      {user.name}{user.age ? `, ${user.age}` : ''}
                      {user.foundingMember && <span style={styles.founderTag}>FM</span>}
                    </div>
                    <div style={styles.cardMeta}>
                      {user.city || 'No city'} · {user.gender || '—'} · Applied {formatDate(user.appliedAt || user.createdAt)}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.cardExpanded}>
                    {user.bio && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Bio</span><span style={styles.fieldValue}>{user.bio}</span></div>}
                    {user.occupation && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Occupation</span><span style={styles.fieldValue}>{user.occupation}</span></div>}
                    {user.screeningAnswer && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Screening</span><span style={styles.fieldValue}>{user.screeningAnswer}</span></div>}
                    {user.interests?.length > 0 && (
                      <div style={styles.fieldRow}>
                        <span style={styles.fieldLabel}>Interests</span>
                        <div style={styles.chipRow}>
                          {user.interests.map((i, idx) => <span key={idx} style={styles.chip}>{i}</span>)}
                        </div>
                      </div>
                    )}
                    {user.travelStyle && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Travel style</span><span style={styles.fieldValue}>{user.travelStyle}</span></div>}
                    {user.referralSource && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Referral</span><span style={styles.fieldValue}>{user.referralSource}</span></div>}
                    {user.email && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Email</span><span style={styles.fieldValue}>{user.email}</span></div>}
                    {user.reviewedAt && <div style={styles.fieldRow}><span style={styles.fieldLabel}>Reviewed</span><span style={styles.fieldValue}>{formatDate(user.reviewedAt)}</span></div>}

                    <div style={styles.actionRow}>
                      {activeTab === 'pending' && (
                        <>
                          <button
                            style={{ ...styles.approveBtn, opacity: isProcessing ? 0.5 : 1 }}
                            onClick={() => handleApprove(user)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            style={{ ...styles.rejectBtn, opacity: isProcessing ? 0.5 : 1 }}
                            onClick={() => handleReject(user)}
                            disabled={isProcessing}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.email && (
                        <button
                          style={{ ...styles.resendBtn, opacity: isProcessing ? 0.5 : 1 }}
                          onClick={() => handleResendEmail(user)}
                          disabled={isProcessing}
                        >
                          {emailSent === user.id ? 'Sent' : 'Resend email'}
                        </button>
                      )}
                      <button
                        style={{ ...styles.deleteBtn, opacity: isProcessing ? 0.5 : 1 }}
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isProcessing}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    padding: '20px',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    padding: '20px 0 24px',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '28px',
    fontWeight: '600',
    color: colors.text,
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '13px',
    color: colors.textMuted,
    marginTop: '4px',
  },
  unauthorized: {
    textAlign: 'center',
    padding: '80px 20px',
    fontSize: '16px',
    color: colors.textMuted,
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
    fontSize: '14px',
    color: colors.textMuted,
  },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '16px',
    background: colors.surface,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statCardActive: {
    borderColor: colors.terracotta,
    background: 'rgba(196,149,106,0.08)',
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: '28px',
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.textMuted,
    marginTop: '4px',
  },

  // List
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '14px',
    color: colors.textMuted,
  },

  // Card
  card: {
    background: colors.surface,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    cursor: 'pointer',
  },
  cardPhoto: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: colors.warmGray,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '600',
    color: colors.text,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  founderTag: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '1px',
    color: colors.terracotta,
    background: 'rgba(196,149,106,0.12)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  cardMeta: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },

  // Expanded
  cardExpanded: {
    padding: '0 16px 16px',
    borderTop: `1px solid ${colors.border}`,
    marginTop: '0',
    paddingTop: '16px',
  },
  fieldRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '10px',
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: colors.textMuted,
    width: '80px',
    flexShrink: 0,
    paddingTop: '2px',
  },
  fieldValue: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    flex: 1,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    flex: 1,
  },
  chip: {
    fontSize: '11px',
    color: colors.textSecondary,
    background: colors.bg,
    padding: '3px 8px',
    borderRadius: radius.full,
  },

  // Actions
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  approveBtn: {
    flex: 1,
    padding: '12px',
    background: colors.terracotta,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  rejectBtn: {
    padding: '12px 20px',
    background: 'transparent',
    color: colors.textTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  resendBtn: {
    padding: '12px 20px',
    background: 'transparent',
    color: colors.terracotta,
    border: `1px solid ${colors.terracotta}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  deleteBtn: {
    padding: '12px 20px',
    background: 'transparent',
    color: colors.error,
    border: `1px solid ${colors.error}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
    marginLeft: 'auto',
  },

  // Cleanup
  cleanupRow: {
    marginBottom: '16px',
  },
  purgeBtn: {
    padding: '10px 20px',
    background: 'transparent',
    color: colors.error,
    border: `1px solid ${colors.error}`,
    borderRadius: radius.md,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
};

export default Admin;
