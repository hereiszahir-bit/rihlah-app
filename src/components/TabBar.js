import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCompass, FiHeart, FiUser } from 'react-icons/fi';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const requestsSnapshot = await getDocs(
        query(collection(db, 'connectionRequests'), where('toUserId', '==', currentUser.uid))
      );
      let count = 0;
      requestsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'pending') {
          count++;
        }
      });
      setBadgeCount(count);
    };

    fetchPendingRequests();
  }, []);

  const tabs = [
    { path: '/destinations', icon: FiCompass, label: 'Explore' },
    { path: '/saved', icon: FiHeart, label: 'Saved' },
    { path: '/profile', icon: FiUser, label: 'Profile', badge: badgeCount }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            style={{
              ...styles.tab,
              ...(active ? styles.tabActive : {})
            }}
            onClick={() => navigate(tab.path)}
          >
            <div style={styles.iconContainer}>
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.5}
                color={active ? '#047857' : '#a3a3a3'}
              />
              {tab.badge > 0 && (
                <div style={styles.badge}>{tab.badge}</div>
              )}
            </div>
            <div style={{
              ...styles.label,
              color: active ? '#047857' : '#a3a3a3',
              fontWeight: active ? '600' : '400',
            }}>{tab.label}</div>
          </button>
        );
      })}
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
    background: '#ffffff',
    borderTop: '1px solid #e8e5e0',
    padding: '10px 0 20px',
    zIndex: 100,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {},
  iconContainer: {
    position: 'relative',
    marginBottom: '4px',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-10px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 5px',
    borderRadius: '10px',
    minWidth: '16px',
    textAlign: 'center',
  },
  label: {
    fontSize: '11px',
    letterSpacing: '0.3px',
  },
};

export default TabBar;
