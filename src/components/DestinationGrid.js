import React from 'react';
import { Link } from 'react-router-dom';

function DestinationGrid({ destinations }) {
  const getDestinationImage = (name) => {
    const images = {
      'Istanbul': 'https://images.pexels.com/photos/1559825/pexels-photo-1559825.jpeg?auto=compress&w=400',
      'Tokyo': 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&w=400',
      'Marrakech': 'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&w=400',
      'Dubai': 'https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&w=400',
      'Kuala Lumpur': 'https://images.pexels.com/photos/3881104/pexels-photo-3881104.jpeg?auto=compress&w=400',
      'Barcelona': 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&w=400',
      'Cairo': 'https://images.pexels.com/photos/3252273/pexels-photo-3252273.jpeg?auto=compress&w=400',
      'Jakarta': 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&w=400',
      'Mecca': 'https://images.pexels.com/photos/2291789/pexels-photo-2291789.jpeg?auto=compress&w=400',
      'Medina': 'https://images.pexels.com/photos/2895185/pexels-photo-2895185.jpeg?auto=compress&w=400',
      'Amman': 'https://images.pexels.com/photos/1631665/pexels-photo-1631665.jpeg?auto=compress&w=400',
      'Sarajevo': 'https://images.pexels.com/photos/5765766/pexels-photo-5765766.jpeg?auto=compress&w=400',
      'Cordoba': 'https://images.pexels.com/photos/3722818/pexels-photo-3722818.jpeg?auto=compress&w=400',
      'Fez': 'https://images.pexels.com/photos/3889704/pexels-photo-3889704.jpeg?auto=compress&w=400',
      'Doha': 'https://images.pexels.com/photos/3551203/pexels-photo-3551203.jpeg?auto=compress&w=400',
      'Muscat': 'https://images.pexels.com/photos/4388167/pexels-photo-4388167.jpeg?auto=compress&w=400',
      'Baku': 'https://images.pexels.com/photos/4388164/pexels-photo-4388164.jpeg?auto=compress&w=400',
      'Zanzibar': 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&w=400',
      'London': 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&w=400',
      'Tunis': 'https://images.pexels.com/photos/3250638/pexels-photo-3250638.jpeg?auto=compress&w=400',
      'Casablanca': 'https://images.pexels.com/photos/3581916/pexels-photo-3581916.jpeg?auto=compress&w=400',
    };
    
    const cityName = name.split(',')[0].trim();
    return images[cityName] || 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&w=400';
  };

  if (destinations.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>🌍</div>
        <h3 style={styles.emptyTitle}>No destinations yet</h3>
        <p style={styles.emptyText}>Be the first to add a trip!</p>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {destinations.map((dest, index) => (
        <Link
          key={index}
          to={`/destination/${encodeURIComponent(dest.name)}`}
          style={styles.card}
        >
          <div 
            style={{
              ...styles.image,
              backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${getDestinationImage(dest.name)})`
            }}
          >
            <div style={styles.overlay}>
              <h3 style={styles.name}>{dest.name}</h3>
              
              {/* Dual Metrics */}
              <div style={styles.metrics}>
                {dest.planningCount > 0 && (
                  <div style={styles.metric}>
                    <span style={styles.metricIcon}>✈️</span>
                    <span style={styles.metricText}>
                      {dest.planningCount} planning
                    </span>
                  </div>
                )}
                
                {dest.thereNowCount > 0 && (
                  <div style={styles.metric}>
                    <span style={styles.metricIcon}>📍</span>
                    <span style={styles.metricText}>
                      {dest.thereNowCount} there now
                    </span>
                  </div>
                )}
                
                {dest.planningCount === 0 && dest.thereNowCount === 0 && (
                  <div style={styles.metric}>
                    <span style={styles.metricText}>No travelers yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    padding: '20px',
  },
  card: {
    borderRadius: '16px',
    overflow: 'hidden',
    textDecoration: 'none',
    aspectRatio: '1',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  image: {
    width: '100%',
    height: '100%',
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
    margin: '0 0 8px 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  metrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metricIcon: {
    fontSize: '14px',
  },
  metricText: {
    fontSize: '13px',
    color: '#fff',
    fontWeight: '600',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
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