import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import TabBar from '../components/TabBar';

function LocalTravelers() {
  const [localUsers, setLocalUsers] = useState([]);
  const [myCity, setMyCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalTravelers();
  }, []);

  const loadLocalTravelers = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get my city
      const myDocRef = doc(db, 'users', user.uid);
      const myDocSnap = await getDoc(myDocRef);
      const myData = myDocSnap.data();
      const city = myData?.city || 'Unknown';
      setMyCity(city);

      // Get others in same city
      const q = query(collection(db, 'users'), where('city', '==', city));
      const snapshot = await getDocs(q);
      
      const users = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id !== user.uid) { // Don't show myself
          users.push({ id: docSnap.id, ...docSnap.data() });
        }
      });

      setLocalUsers(users);
      setLoading(false);
    } catch (error) {
      console.error('Error loading travelers:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading travelers in your area...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/" style={styles.backBtn}>
          <FiArrowLeft size={20} />
          <span>Back</span>
        </Link>
      </div>

      {/* Content */}
      <div style={styles.container}>
        <h1 style={styles.title}>Travelers in {myCity}</h1>
        <p style={styles.subtitle}>
          {localUsers.length} {localUsers.length === 1 ? 'Muslim' : 'Muslims'} in your area
        </p>

        <div style={styles.grid}>
          {localUsers.length === 0 ? (
            <motion.div 
              style={styles.empty}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={styles.emptyIcon}></div>
              <h3 style={styles.emptyTitle}>No travelers in {myCity} yet</h3>
              <p style={styles.emptyText}>
                Be the first! Invite friends to join Rihlah.
              </p>
              <button style={styles.inviteBtn}>
                Invite Friends
              </button>
            </motion.div>
          ) : (
            localUsers.map((traveler, index) => (
              <motion.div
                key={traveler.id}
                style={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {traveler.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={styles.info}>
                    <h3 style={styles.name}>{traveler.name}</h3>
                    <p style={styles.location}>{traveler.city}</p>
                  </div>
                </div>

                <p style={styles.bio}>
                  {traveler.bio || 'New to Rihlah'}
                </p>

                {traveler.interests && traveler.interests.length > 0 && (
                  <div style={styles.interests}>
                    {traveler.interests.slice(0, 3).map((interest, i) => (
                      <span key={i} style={styles.tag}>{interest}</span>
                    ))}
                  </div>
                )}

                <button style={styles.messageBtn}>
                  Message
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
      <TabBar />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#fafafa',
    paddingBottom: '80px',
  },
  header: {
    background: 'linear-gradient(135deg, #059669, #10b981)',
    padding: '20px 24px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 24px',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #059669',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '48px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.2s',
  },
  cardHeader: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    flexShrink: 0,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  location: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  bio: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: 1.6,
  },
  interests: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '6px 12px',
    background: '#d1fae5',
    color: '#059669',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '600',
  },
  messageBtn: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '80px 24px',
    background: '#fff',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  inviteBtn: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default LocalTravelers;