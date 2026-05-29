import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCompass, FiUser, FiPlus, FiMap } from 'react-icons/fi';
import { colors } from '../design';

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/home', icon: FiHome, label: 'Home' },
    { path: '/destinations', icon: FiCompass, label: 'Explore' },
    { path: '/add-trip', icon: FiPlus, label: '', isCenter: true },
    { path: '/trips', icon: FiMap, label: 'Journeys' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              style={styles.centerTab}
              onClick={() => navigate(tab.path)}
            >
              <div style={styles.centerButton}>
                <Icon size={24} strokeWidth={2.5} color="#f8f6f2" />
              </div>
            </button>
          );
        }

        return (
          <button
            key={tab.path}
            style={styles.tab}
            onClick={() => navigate(tab.path)}
          >
            <div style={styles.iconContainer}>
              <Icon
                size={21}
                strokeWidth={active ? 2.2 : 1.5}
                color={active ? colors.text : colors.textMuted}
              />
            </div>
            <div style={{
              ...styles.label,
              color: active ? colors.text : colors.textMuted,
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
    display: 'flex',
    justifyContent: 'space-around',
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '4px 0 env(safe-area-inset-bottom, 0px)',
    zIndex: 9999,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '6px 4px 4px',
    cursor: 'pointer',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: '2px',
  },
  label: {
    fontSize: '10px',
    letterSpacing: '0.3px',
  },
  centerTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    marginTop: '-18px',
  },
  centerButton: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: colors.dark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(26, 26, 26, 0.25)',
  },
};

export default TabBar;
