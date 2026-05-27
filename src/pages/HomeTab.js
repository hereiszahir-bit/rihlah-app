import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion } from 'framer-motion';
import { FiMapPin, FiStar, FiClock } from 'react-icons/fi';
import TabBar from '../components/TabBar';

function HomeTab() {
  const [experiences, setExperiences] = useState([]);
  const [myCity, setMyCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalExperiences();
  }, []);

  const loadLocalExperiences = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const myDocRef = doc(db, 'users', user.uid);
      const myDocSnap = await getDoc(myDocRef);
      const city = myDocSnap.data()?.city || 'Unknown';
      setMyCity(city);

      // For now, show sample experiences
      // Later you can filter by city from database
      setExperiences([
        {
          id: 1,
          title: 'Ottoman Mosques Walking Tour',
          location: city,
          icon: '',
          rating: 4.9,
          duration: '3 hours',
          price: 45,
          travelers: 12
        },
        {
          id: 2,
          title: 'Halal Food Tour',
          location: city,
          icon: '',
          rating: 5.0,
          duration: '4 hours',
          price: 65,
          travelers: 8
        },
        {
          id: 3,
          title: 'Sisters Spa Day',
          location: city,
          icon: '',
          rating: 4.8,
          duration: '2.5 hours',
          price: 80,
          travelers: 15
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading experiences:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading experiences...</div>
        <TabBar />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Discover {myCity}</h1>
            <p style={styles.subtitle}>Curated halal experiences near you</p>
          </div>
          <div style={styles.locationBadge}>
            <FiMapPin size={14} />
            <span>{myCity}</span>
          </div>
        </div>

        {/* Experiences Grid */}
        <div style={styles.grid}>
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              style={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div style={styles.cardImage}>
                <div style={styles.cardIcon}>{exp.icon}</div>
                <div style={styles.badge}>
                  <FiStar size={12} />
                  <span>{exp.rating}</span>
                </div>
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>{exp.title}</h3>
                <div style={styles.cardMeta}>
                  <span style={styles.metaItem}>
                    <FiMapPin size={12} />
                    {exp.location}
                  </span>
                  <span style={styles.metaItem}>
                    <FiClock size={12} />
                    {exp.duration}
                  </span>
                </div>
                <div style={styles.cardFooter}>
                  <div style={styles.price}>${exp.price}</div>
                  <button style={styles.bookBtn}>Book</button>
                </div>
              </div>
            </motion.div>
          ))}
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
    paddingBottom: '80px', // Space for tab bar
  },
  container: {
    padding: '20px 16px',
  },
  loading: {
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
  },
  header: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  locationBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: '#d1fae5',
    color: '#059669',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gap: '16px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardImage: {
    height: '140px',
    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardIcon: {
    fontSize: '64px',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#fff',
    padding: '4px 10px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  cardContent: {
    padding: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6b7280',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  price: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
  },
  bookBtn: {
    background: '#059669',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default HomeTab;