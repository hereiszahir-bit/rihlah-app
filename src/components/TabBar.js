import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCompass, FiUsers, FiMessageCircle, FiUser } from 'react-icons/fi';
import { colors, fonts } from '../design';

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/home', icon: FiCompass, label: 'Discover' },
    { path: '/travelers', icon: FiUsers, label: 'Travelers' },
    { path: '/messages', icon: FiMessageCircle, label: 'Messages' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
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
            style={styles.tab}
            onClick={() => navigate(tab.path)}
          >
            <div style={styles.iconContainer}>
              <Icon
                size={21}
                strokeWidth={active ? 2.2 : 1.5}
                color={active ? colors.terracotta : colors.textMuted}
              />
            </div>
            <div style={{
              ...styles.label,
              color: active ? colors.terracotta : colors.textMuted,
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
    padding: '6px 0 env(safe-area-inset-bottom, 0px)',
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
};

export default TabBar;
