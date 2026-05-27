import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiNavigation } from 'react-icons/fi';
import { getDestinationImage } from '../data/destinations';

function DestinationGrid({ destinations }) {

  if (destinations.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}></div>
        <h3 style={styles.emptyTitle}>No destinations yet</h3>
        <p style={styles.emptyText}>Be the first to add a trip!</p>
      </div>
    );
  }

  return (
    <div style={styles.scroll}>
      {destinations.map((dest, index) => {
        const cityName = dest.name.split(',')[0].trim();
        const country = dest.name.includes(',') ? dest.name.split(',').slice(1).join(',').trim() : '';
        return (
          <Link
            key={index}
            to={`/destination/${encodeURIComponent(dest.name)}`}
            style={styles.card}
          >
            <div
              style={{
                ...styles.image,
                backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${getDestinationImage(dest.name)})`,
              }}
            >
              <div style={styles.overlay}>
                <h3 style={styles.name}>{cityName}</h3>
                {country && <p style={styles.country}>{country}</p>}
                {(() => {
                  if (dest.thereNowCount === 0 && dest.planningCount === 0) {
                    return <div style={styles.badge}>Be the first</div>;
                  }
                  return (
                    <div style={styles.metrics}>
                      {dest.thereNowCount > 0 && (
                        <div style={styles.metric}>
                          <FiMapPin size={12} style={{ marginRight: '3px' }} /> {dest.thereNowCount} here now
                        </div>
                      )}
                      {dest.planningCount > 0 && (
                        <div style={styles.metric}>
                          <FiNavigation size={12} style={{ marginRight: '3px' }} /> {dest.planningCount} planning
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const styles = {
  scroll: {
    display: 'flex',
    overflowX: 'auto',
    gap: '14px',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  card: {
    flexShrink: 0,
    width: '180px',
    borderRadius: '16px',
    overflow: 'hidden',
    textDecoration: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)',
  },
  image: {
    width: '180px',
    height: '240px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
  },
  overlay: {
    width: '100%',
    padding: '16px',
  },
  name: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 2px 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  country: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    margin: '0 0 8px 0',
    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  badge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6ee7b7',
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(4px)',
    padding: '4px 10px',
    borderRadius: '12px',
    display: 'inline-block',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  metrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metric: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#9ca3af',
  },
};

export default DestinationGrid;
