import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function CommunityMap() {
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, cities: 0 });

  useEffect(() => {
    loadUserLocations();
  }, []);

  const loadUserLocations = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      // Group users by city
      const locationMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.city && data.location) {
          const cityKey = data.city;
          if (!locationMap[cityKey]) {
            locationMap[cityKey] = {
              city: data.city,
              country: data.country || '',
              lat: data.location.lat,
              lng: data.location.lng,
              users: []
            };
          }
          locationMap[cityKey].users.push({
            name: data.name,
            id: doc.id
          });
        }
      });

      const locations = Object.values(locationMap);
      setUserLocations(locations);
      setStats({
        total: snapshot.size,
        cities: locations.length
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading locations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading community map...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{stats.total}</span>
          <span style={styles.statLabel}>Travelers</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>{stats.cities}</span>
          <span style={styles.statLabel}>Cities</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statNumber}>15+</span>
          <span style={styles.statLabel}>Countries</span>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={styles.map}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {userLocations.map((location, index) => (
          <React.Fragment key={index}>
            {/* Marker */}
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                <div style={styles.popup}>
                  <h3 style={styles.popupTitle}>
                    {location.city}, {location.country}
                  </h3>
                  <p style={styles.popupCount}>
                    <strong>{location.users.length}</strong> {location.users.length === 1 ? 'traveler' : 'travelers'}
                  </p>
                  <div style={styles.userList}>
                    {location.users.slice(0, 5).map((user, i) => (
                      <div key={i} style={styles.userItem}>
                        {user.name}
                      </div>
                    ))}
                    {location.users.length > 5 && (
                      <div style={styles.moreUsers}>
                        +{location.users.length - 5} more
                      </div>
                    )}
                  </div>
                  <button style={styles.connectBtn}>
                    Connect with travelers here
                  </button>
                </div>
              </Popup>
            </Marker>

            {/* Circle showing concentration */}
            <Circle
              center={[location.lat, location.lng]}
              radius={location.users.length * 50000}
              pathOptions={{
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: 0.2
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={styles.legendDot} />
          <span>Circle size = number of travelers</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    position: 'relative',
  },
  loading: {
    height: '500px',
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
  statsBar: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '24px',
    background: '#fff',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  stat: {
    textAlign: 'center',
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: '700',
    color: '#059669',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  map: {
    height: '500px',
    width: '100%',
    borderRadius: '0 0 16px 16px',
  },
  popup: {
    minWidth: '200px',
  },
  popupTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  popupCount: {
    fontSize: '14px',
    color: '#059669',
    marginBottom: '12px',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  userItem: {
    fontSize: '13px',
    color: '#4b5563',
  },
  moreUsers: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  connectBtn: {
    width: '100%',
    padding: '8px',
    background: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  legend: {
    position: 'absolute',
    bottom: '24px',
    left: '24px',
    background: 'rgba(255,255,255,0.95)',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#10b981',
    border: '2px solid #059669',
  },
};

export default CommunityMap;