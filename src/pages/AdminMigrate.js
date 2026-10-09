import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import CITY_GUIDES from '../data/cityGuides';
import CURATED_DESTINATIONS from '../data/destinations';
import { colors, fonts, radius } from '../design';

const ADMIN_UIDS = [
  // Add your UID here — check Firebase Auth console
];

function AdminMigrate() {
  const { currentUser } = useUser();
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const runMigration = async () => {
    if (running) return;
    setRunning(true);
    setLog([]);
    const now = new Date().toISOString();

    try {
      // Migrate city guides
      addLog('--- City Guides ---');
      for (const guide of CITY_GUIDES) {
        const docData = {
          ...guide,
          status: 'published',
          lastVerified: now,
          verifiedBy: 'initial-migration',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'cityGuides', guide.id), docData);
        addLog(`cityGuides/${guide.id} — ${guide.city}, ${guide.country}`);
      }

      // Migrate destinations
      addLog('');
      addLog('--- Destinations ---');
      for (const dest of CURATED_DESTINATIONS) {
        const docData = {
          ...dest,
          status: 'published',
          lastVerified: now,
          verifiedBy: 'initial-migration',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'destinations', dest.id), docData);
        addLog(`destinations/${dest.id} — ${dest.city || dest.name}`);
      }

      addLog('');
      addLog(`Done. ${CITY_GUIDES.length} city guides + ${CURATED_DESTINATIONS.length} destinations.`);
      setDone(true);
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
    }
    setRunning(false);
  };

  if (!currentUser) {
    return <div style={styles.page}><p style={styles.text}>Sign in first.</p></div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Migrate City Data to Firestore</h1>
      <p style={styles.text}>
        This will write {CITY_GUIDES.length} city guides and {CURATED_DESTINATIONS.length} destinations
        to Firestore. Each document gets metadata fields (status, lastVerified, etc.).
        Existing documents with the same ID will be overwritten.
      </p>

      {!done && (
        <button style={styles.btn} onClick={runMigration} disabled={running}>
          {running ? 'Migrating...' : 'Run Migration'}
        </button>
      )}

      {log.length > 0 && (
        <pre style={styles.log}>
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </pre>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    padding: '40px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    color: colors.text,
    marginBottom: '16px',
  },
  text: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.7,
    marginBottom: '24px',
  },
  btn: {
    padding: '14px 28px',
    background: colors.terracotta,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: '24px',
  },
  log: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '16px',
    fontSize: '12px',
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 1.8,
    maxHeight: '400px',
    overflowY: 'auto',
  },
};

export default AdminMigrate;
