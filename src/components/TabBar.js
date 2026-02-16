import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const requestsSnapshot = await getDocs(collection(db, 'connectionRequests'));
      let count = 0;
      requestsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.toUserId === currentUser.uid && data.status === 'pending') {
          count++;
        }
      });
      setBadgeCount(count);
    };

    fetchPendingRequests();
  }, []);

  const tabs = [
    { path: '/destinations', icon: '🧭', label: 'Explore' },
    { path: '/saved', icon: '💾', label: 'Saved' },
    { path: '/profile', icon: '👤', label: 'Profile', badge: badgeCount }
  ];

  return (
    <div style={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab.path}
          style={{
            ...styles.tab,
            ...(location.pathname === tab.path ? styles.tabActive : {})
          }}
          onClick={() => navigate(tab.path)}
        >
          <div style={styles.iconContainer}>
            <div style={styles.icon}>{tab.icon}</div>
            {tab.badge > 0 && (
              <div style={styles.badge}>{tab.badge}</div>
            )}
          </div>
          <div style={styles.label}>{tab.label}</div>
        </button>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    background: '#fff',
    borderTop: '1px solid #e5e7eb',
    padding: '8px 0',
    zIndex: 100,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#059669',
  },
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-8px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
  },
};

export default TabBar;
