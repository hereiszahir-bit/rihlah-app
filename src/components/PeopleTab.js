import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

function PeopleTab({ destination }) {
  const [timeFilter, setTimeFilter] = useState('now');
  const [travelers, setTravelers] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [myConnections, setMyConnections] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    loadTravelers();
    loadMyConnections();
    loadSentRequests();
  }, [destination, timeFilter]);

  const loadMyConnections = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setMyConnections(userData.connections || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadSentRequests = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const requestsSnapshot = await getDocs(collection(db, 'connectionRequests'));
      const sent = [];

      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.fromUserId === currentUser.uid && data.status === 'pending') {
          sent.push(data.toUserId);
        }
      });

      setSentRequests(sent);
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  const loadTravelers = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const now = new Date();
      const travelers = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const userId = doc.id;

        if (userId === currentUser.uid) return;

        const trips = userData.upcomingTrips || [];
        trips.forEach(trip => {
          if (trip.destination === destination) {
            const startDate = new Date(trip.startDate);
            const endDate = new Date(trip.endDate);

            const isHereNow = now >= startDate && now <= endDate;
            const isGoingSoon = startDate > now;

            if ((timeFilter === 'now' && isHereNow) || (timeFilter === 'soon' && isGoingSoon)) {
              travelers.push({
                userId: userId,
                name: userData.name,
                age: userData.age,
                gender: userData.gender,
                bio: userData.bio,
                photoURL: userData.photoURL,
                interests: userData.interests || [],
                whatsapp: userData.whatsapp,
                instagram: userData.instagram,
                tripStartDate: trip.startDate,
                tripEndDate: trip.endDate,
                isHereNow: isHereNow
              });
            }
          }
        });
      });

      setTravelers(travelers);
    } catch (error) {
      console.error('Error loading travelers:', error);
    }
  };

  const handleCardClick = (person) => {
    setSelectedPerson(person);
    setShowProfileModal(true);
  };

  const handleConnect = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Please log in to send connection requests');
        return;
      }

      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.data();

      // Check if already connected
      const existingConnection = myConnections.find(c => c.userId === selectedPerson.userId);
      if (existingConnection) {
        alert('You are already connected!');
        return;
      }

      // Check if request already sent
      if (sentRequests.includes(selectedPerson.userId)) {
        alert('Connection request already sent!');
        return;
      }

      // Create connection request in separate collection
      const requestData = {
        fromUserId: currentUser.uid,
        fromUserName: currentUserData.name,
        fromUserAge: currentUserData.age,
        fromUserGender: currentUserData.gender,
        fromUserBio: currentUserData.bio || '',
        fromUserPhotoURL: currentUserData.photoURL || '',
        fromUserInterests: currentUserData.interests || [],
        toUserId: selectedPerson.userId,
        toUserName: selectedPerson.name,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'connectionRequests'), requestData);

      // Update sent requests list
      setSentRequests([...sentRequests, selectedPerson.userId]);

      alert('Connection request sent! 🎉');
      setShowProfileModal(false);

    } catch (error) {
      console.error('Error sending connection:', error);
      alert(`Failed to send request: ${error.message}`);
    }
  };

  const handleWhatsApp = () => {
    const message = `Hey ${selectedPerson.name}! I saw you on Rihlah. Want to connect?`;
    const url = `https://wa.me/${selectedPerson.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleInstagram = () => {
    const username = selectedPerson.instagram?.replace('@', '');
    window.open(`https://instagram.com/${username}`, '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isConnected = (userId) => {
    return myConnections.some(c => c.userId === userId);
  };

  const isRequestPending = (userId) => {
    return sentRequests.includes(userId);
  };

  const interestEmojis = {
    food: '🍽️',
    adventure: '⛰️',
    culture: '🏛️',
    photography: '📸',
    art: '🎨',
    history: '🏛️',
    nature: '🌿',
    shopping: '🛍️',
    nightlife: '🌃',
    wellness: '🧘'
  };

  return (
    <div style={styles.container}>
      {/* Time Filter Tabs */}
      <div style={styles.subTabs}>
        <button
          style={{
            ...styles.subTab,
            ...(timeFilter === 'now' ? styles.subTabActive : {})
          }}
          onClick={() => setTimeFilter('now')}
        >
          Here Now
        </button>
        <button
          style={{
            ...styles.subTab,
            ...(timeFilter === 'soon' ? styles.subTabActive : {})
          }}
          onClick={() => setTimeFilter('soon')}
        >
          Going Soon
        </button>
      </div>

      {/* Minimal Cards List */}
      <div style={styles.travelersList}>
        {travelers.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              {timeFilter === 'now' ? '📍' : '✈️'}
            </div>
            <div style={styles.emptyText}>
              {timeFilter === 'now' 
                ? 'No travelers here right now'
                : 'No travelers going soon'}
            </div>
            <div style={styles.emptySubtext}>
              Check back later or switch tabs
            </div>
          </div>
        ) : (
          travelers.map((person, index) => (
            <div 
              key={index} 
              style={styles.minimalCard}
              onClick={() => handleCardClick(person)}
            >
              {/* Small Photo */}
              <div style={styles.photoSection}>
                {person.photoURL ? (
                  <img 
                    src={person.photoURL} 
                    alt={person.name}
                    style={styles.smallPhoto}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div style={styles.infoSection}>
                <div style={styles.nameAge}>
                  {person.name}, {person.age}
                </div>
                <div style={styles.tripDates}>
                  {destination.split(',')[0]} • {formatDate(person.tripStartDate)}
                  {person.tripStartDate !== person.tripEndDate && ` - ${formatDate(person.tripEndDate)}`}
                </div>
                <div style={styles.interestIcons}>
                  {person.interests.slice(0, 4).map((interest, i) => (
                    <span key={i} style={styles.interestIcon}>
                      {interestEmojis[interest.toLowerCase()] || '✨'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div style={styles.arrowSection}>
                →
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expanded Profile Modal */}
      {showProfileModal && selectedPerson && (
        <div style={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.modalClose}
              onClick={() => setShowProfileModal(false)}
            >
              ✕
            </button>

            {/* Large Photo */}
            <div style={styles.largePhotoContainer}>
              {selectedPerson.photoURL ? (
                <img 
                  src={selectedPerson.photoURL} 
                  alt={selectedPerson.name}
                  style={styles.largePhoto}
                />
              ) : (
                <div style={styles.largeAvatarPlaceholder}>
                  {selectedPerson.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div style={styles.profileInfo}>
              <div style={styles.profileName}>
                {selectedPerson.name}, {selectedPerson.age}
              </div>
              <div style={styles.profileGender}>
                {selectedPerson.gender}
              </div>

              {/* Bio */}
              {selectedPerson.bio && (
                <div style={styles.bioSection}>
                  "{selectedPerson.bio}"
                </div>
              )}

              {/* Trip */}
              <div style={styles.sectionTitle}>UPCOMING TRIP:</div>
              <div style={styles.tripInfo}>
                📍 {destination.split(',')[0]} • {formatDate(selectedPerson.tripStartDate)}
                {selectedPerson.tripStartDate !== selectedPerson.tripEndDate && 
                  ` - ${formatDate(selectedPerson.tripEndDate)}`}
              </div>

              {/* Interests */}
              {selectedPerson.interests.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>INTERESTS:</div>
                  <div style={styles.interestsList}>
                    {selectedPerson.interests.map((interest, i) => (
                      <div key={i} style={styles.interestTag}>
                        {interestEmojis[interest.toLowerCase()] || '✨'} {interest}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Connect Button */}
              {!isConnected(selectedPerson.userId) && !isRequestPending(selectedPerson.userId) ? (
                <button 
                  style={styles.connectButton}
                  onClick={handleConnect}
                >
                  ➕ Request Connection
                </button>
              ) : isRequestPending(selectedPerson.userId) ? (
                <button 
                  style={styles.pendingButton}
                  disabled
                >
                  ⏳ Request Pending
                </button>
              ) : (
                <div style={styles.connectedSection}>
                  <div style={styles.connectedLabel}>
                    ✅ Already Connected
                  </div>
                  <div style={styles.contactButtons}>
                    {selectedPerson.whatsapp && (
                      <button 
                        style={styles.contactButton}
                        onClick={handleWhatsApp}
                      >
                        💬 WhatsApp
                      </button>
                    )}
                    {selectedPerson.instagram && (
                      <button 
                        style={styles.contactButton}
                        onClick={handleInstagram}
                      >
                        📷 Instagram
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0 0 20px 0',
  },
  subTabs: {
    display: 'flex',
    gap: '8px',
    padding: '20px 20px 16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  subTab: {
    flex: 1,
    padding: '12px',
    background: '#f9fafb',
    color: '#6b7280',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  subTabActive: {
    background: '#059669',
    color: '#fff',
  },
  travelersList: {
    padding: '16px 20px',
  },
  minimalCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#fff',
    borderRadius: '12px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent',
  },
  photoSection: {
    flexShrink: 0,
  },
  smallPhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
  },
  infoSection: {
    flex: 1,
  },
  nameAge: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  tripDates: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  interestIcons: {
    display: 'flex',
    gap: '6px',
  },
  interestIcon: {
    fontSize: '16px',
  },
  arrowSection: {
    fontSize: '20px',
    color: '#9ca3af',
    flexShrink: 0,
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '90%',
    width: '400px',
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#9ca3af',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    zIndex: 10,
  },
  largePhotoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  largePhoto: {
    width: '250px',
    height: '250px',
    borderRadius: '16px',
    objectFit: 'cover',
  },
  largeAvatarPlaceholder: {
    width: '250px',
    height: '250px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px',
    fontWeight: '700',
  },
  profileInfo: {
    textAlign: 'center',
  },
  profileName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '4px',
  },
  profileGender: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  bioSection: {
    fontSize: '14px',
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 1.6,
    marginBottom: '20px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    marginTop: '16px',
    textAlign: 'left',
  },
  tripInfo: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: '12px',
  },
  interestsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-start',
    marginBottom: '20px',
  },
  interestTag: {
    padding: '6px 12px',
    background: '#f0fdf4',
    color: '#059669',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  connectButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
  },
  pendingButton: {
    width: '100%',
    padding: '16px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'not-allowed',
    marginTop: '20px',
  },
  connectedSection: {
    marginTop: '20px',
  },
  connectedLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
    marginBottom: '12px',
  },
  contactButtons: {
    display: 'flex',
    gap: '8px',
  },
  contactButton: {
    flex: 1,
    padding: '12px',
    background: '#f0fdf4',
    color: '#059669',
    border: '2px solid #059669',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default PeopleTab;