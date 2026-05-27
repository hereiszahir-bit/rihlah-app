import React, { useState, useMemo } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { FiX, FiMapPin, FiMessageCircle, FiCamera } from 'react-icons/fi';

function PeopleTab({ destination }) {
  const [timeFilter, setTimeFilter] = useState('now');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [localSentRequests, setLocalSentRequests] = useState([]);

  const { currentUserData, allUsers, currentUser, sentRequestUserIds, receivedRequestUserIds, refreshConnections } = useUser();
  const myConnections = currentUserData?.connections || [];

  const allSentRequests = useMemo(() => {
    return [...new Set([...sentRequestUserIds, ...receivedRequestUserIds, ...localSentRequests])];
  }, [sentRequestUserIds, receivedRequestUserIds, localSentRequests]);

  const travelers = useMemo(() => {
    if (!currentUser || !currentUserData) return [];
    const now = new Date();
    const result = [];

    const myGender = currentUserData.gender || '';
    const rawMyVis = currentUserData.profileVisibility || 'both';
    const myVisibility = ['Male', 'Female', 'both'].includes(rawMyVis) ? rawMyVis : 'both';

    allUsers.forEach((userData) => {
      if (userData.id === currentUser.uid) return;

      // Visibility/gender filtering — match logic in Destinations.js & DestinationDetail.js
      const rawTheirVis = userData.profileVisibility || 'both';
      const theirVisibility = ['Male', 'Female', 'both'].includes(rawTheirVis) ? rawTheirVis : 'both';
      if (theirVisibility !== 'both' && theirVisibility !== myGender) return;
      if (myVisibility !== 'both' && userData.gender !== myVisibility) return;

      const trips = userData.upcomingTrips || [];
      trips.forEach(trip => {
        if (trip.destination === destination) {
          const startDate = new Date(trip.startDate);
          const endDate = new Date(trip.endDate);

          const isHereNow = now >= startDate && now <= endDate;
          const isGoingSoon = startDate > now;

          if ((timeFilter === 'now' && isHereNow) || (timeFilter === 'soon' && isGoingSoon)) {
            result.push({
              userId: userData.id,
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

    return result;
  }, [allUsers, currentUser, currentUserData, destination, timeFilter]);

  const handleCardClick = (person) => {
    setSelectedPerson(person);
    setShowProfileModal(true);
  };

  const handleConnect = async () => {
    try {
      if (!currentUser || !currentUserData) {
        alert('Please log in to send connection requests');
        return;
      }

      const existingConnection = myConnections.find(c => c.userId === selectedPerson.userId);
      if (existingConnection) {
        alert('You are already connected!');
        return;
      }

      if (allSentRequests.includes(selectedPerson.userId)) {
        alert('Connection request already exists!');
        return;
      }

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

      setLocalSentRequests(prev => [...prev, selectedPerson.userId]);
      refreshConnections();

      alert('Connection request sent!');
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
    const link = document.createElement('a');
    link.href = `https://www.instagram.com/${username}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isConnected = (userId) => {
    return myConnections.some(c => c.userId === userId);
  };

  const isRequestPending = (userId) => {
    return allSentRequests.includes(userId);
  };

  const interestEmojis = {
    food: '',
    adventure: '',
    culture: '',
    photography: '',
    art: '',
    history: '',
    nature: '',
    shopping: '',
    nightlife: '',
    wellness: ''
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
                      {interestEmojis[interest.toLowerCase()]}
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
              <FiX size={20} />
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
                <FiMapPin size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> {destination.split(',')[0]} • {formatDate(selectedPerson.tripStartDate)}
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
                        {interestEmojis[interest.toLowerCase()]} {interest}
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
                  Request Connection
                </button>
              ) : isRequestPending(selectedPerson.userId) ? (
                <button
                  style={styles.pendingButton}
                  disabled
                >
                  Request Pending
                </button>
              ) : (
                <div style={styles.connectedSection}>
                  <div style={styles.connectedLabel}>
                    Connected
                  </div>
                  <div style={styles.contactButtons}>
                    {selectedPerson.whatsapp && (
                      <button
                        style={styles.contactButton}
                        onClick={handleWhatsApp}
                      >
                        <FiMessageCircle size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> WhatsApp
                      </button>
                    )}
                    {selectedPerson.instagram && (
                      <button
                        style={styles.contactButton}
                        onClick={handleInstagram}
                      >
                        <FiCamera size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> Instagram
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
    borderBottom: '1px solid #e8e5e0',
  },
  subTab: {
    flex: 1,
    padding: '12px',
    background: '#faf9f7',
    color: '#6b6b6b',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  subTabActive: {
    background: '#047857',
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
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
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
    background: 'linear-gradient(135deg, #047857, #059669)',
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
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  tripDates: {
    fontSize: '13px',
    color: '#6b6b6b',
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
    color: '#a3a3a3',
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
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#a3a3a3',
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
    boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#a3a3a3',
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
    background: 'linear-gradient(135deg, #047857, #059669)',
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
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  profileGender: {
    fontSize: '14px',
    color: '#6b6b6b',
    marginBottom: '16px',
  },
  bioSection: {
    fontSize: '14px',
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 1.6,
    marginBottom: '20px',
    padding: '12px',
    background: '#faf9f7',
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
    background: '#f0f9f4',
    color: '#047857',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  connectButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #047857, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '20px',
    boxShadow: '0 2px 8px rgba(4,120,87,0.3)',
  },
  pendingButton: {
    width: '100%',
    padding: '16px',
    background: '#f5f3f0',
    color: '#6b7280',
    border: '1.5px solid #e8e5e0',
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
    color: '#047857',
    marginBottom: '12px',
  },
  contactButtons: {
    display: 'flex',
    gap: '8px',
  },
  contactButton: {
    flex: 1,
    padding: '14px 24px',
    background: '#f0f9f4',
    color: '#047857',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default PeopleTab;
