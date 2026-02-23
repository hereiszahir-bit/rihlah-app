import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

function ExperiencesTab({ destination }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userTrips, setUserTrips] = useState([]);
  const [showWhosGoing, setShowWhosGoing] = useState(false);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [experienceCounts, setExperienceCounts] = useState({});
  const [whosGoingData, setWhosGoingData] = useState([]);

  useEffect(() => {
    loadUserTrips();
    loadExperienceCounts();
  }, [destination]);

  const loadUserTrips = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const allTrips = userData.upcomingTrips || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const relevantTrips = allTrips.filter(trip => {
          if (trip.destination !== destination) return false;
          const endDate = new Date(trip.endDate);
          endDate.setHours(23, 59, 59, 999);
          return endDate >= today;
        });

        setUserTrips(relevantTrips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadExperienceCounts = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const counts = {};
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const trips = userData.upcomingTrips || [];
        
        trips.forEach(trip => {
          if (trip.destination === destination && trip.experiences) {
            trip.experiences.forEach(exp => {
              if (!counts[exp.name]) {
                counts[exp.name] = 0;
              }
              counts[exp.name]++;
            });
          }
        });
      });
      
      setExperienceCounts(counts);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const handleSaveToTrip = (experience) => {
    if (userTrips.length === 0) {
      alert(`Add a trip to ${destination.split(',')[0]} first!`);
      return;
    }
    
    setSelectedExperience(experience);
    
    // If only one trip, auto-select it
    if (userTrips.length === 1) {
      confirmSaveToTrip(userTrips[0]);
    } else {
      setShowTripPicker(true);
    }
  };

  const confirmSaveToTrip = async (trip) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      
      const updatedTrips = userData.upcomingTrips.map(t => {
        if (t.destination === trip.destination && t.startDate === trip.startDate) {
          const experiences = t.experiences || [];
          
          // Check if already saved
          if (experiences.find(e => e.name === selectedExperience.name)) {
            alert('Already saved to this trip!');
            return t;
          }
          
          return {
            ...t,
            experiences: [
              ...experiences,
              {
                name: selectedExperience.name,
                description: selectedExperience.description,
                price: selectedExperience.price,
                image: selectedExperience.image,
                bookingUrl: selectedExperience.bookingUrl,
                tripStartDate: t.startDate,
                tripEndDate: t.endDate,
                status: 'interested',
                savedAt: new Date().toISOString()
              }
            ]
          };
        }
        return t;
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        upcomingTrips: updatedTrips
      });

      setShowTripPicker(false);
      
      // Reload counts
      await loadExperienceCounts();
      
      alert(`✅ Saved to your ${trip.destination} trip!`);
      
    } catch (error) {
      console.error('Error saving experience:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleBookNow = (experience) => {
    // Just open booking - NO auto-save
    window.open(experience.bookingUrl, '_blank');
  };

  const handleShowWhosGoing = async (experience) => {
    await loadWhosGoing(experience);
    setSelectedExperience(experience);
    setShowWhosGoing(true);
  };

  const datesOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 <= e2 && s2 <= e1;
  };

  const loadWhosGoing = async (experience) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const currentUser = auth.currentUser;
      const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const currentUserData = currentUserDoc.data();
      const myConnections = currentUserData.connections || [];
      
      // Get current user's upcoming trip dates for this destination
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const myTrip = (currentUserData.upcomingTrips || []).find(t => {
        if (t.destination !== destination) return false;
        const endDate = new Date(t.endDate);
        endDate.setHours(23, 59, 59, 999);
        return endDate >= today;
      });
      if (!myTrip) {
        setWhosGoingData([]);
        return;
      }

      const myStartDate = myTrip.startDate;
      const myEndDate = myTrip.endDate;
      
      const going = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const userId = doc.id;
        const trips = userData.upcomingTrips || [];
        
        if (userId === currentUser.uid) return;
        
        trips.forEach(trip => {
          if (trip.destination === destination && trip.experiences) {
            trip.experiences.forEach(exp => {
              if (exp.name === experience.name) {
                // Only show if trip dates overlap
                const hasOverlap = datesOverlap(
                  myStartDate, 
                  myEndDate, 
                  trip.startDate, 
                  trip.endDate
                );
                
                if (hasOverlap) {
                  const isConnection = myConnections.some(c => c.userId === userId);
                  
                  going.push({
                    userId: userId,
                    name: userData.name,
                    phone: userData.whatsapp,
                    instagram: userData.instagram,
                    tripStartDate: trip.startDate,
                    tripEndDate: trip.endDate,
                    isConnection: isConnection
                  });
                }
              }
            });
          }
        });
      });
      
      going.sort((a, b) => {
        if (a.isConnection && !b.isConnection) return -1;
        if (!a.isConnection && b.isConnection) return 1;
        return 0;
      });
      
      setWhosGoingData(going);
      
    } catch (error) {
      console.error('Error loading travelers:', error);
    }
  };

  const handleWhatsAppDirect = (traveler) => {
    const message = `Hey ${traveler.name}! I saw on Rihlah you're interested in ${selectedExperience.name}. I'm going too! Want to coordinate?`;
    const url = `https://wa.me/${traveler.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCreateWhatsAppGroup = () => {
    const travelers = whosGoingData.map(t => t.name).join(', ');
    alert(`To create a WhatsApp group:\n\n1. Open WhatsApp\n2. Create new group: "${selectedExperience.name}"\n3. Add travelers: ${travelers}\n4. Coordinate your experience!`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const allExperiences = [
    {
      name: 'Bosphorus Sunset Cruise',
      description: 'Experience Istanbul from the water with stunning sunset views of palaces and mosques.',
      price: 35,
      category: 'tour',
      image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=bosphorus%20cruise%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Turkish Food Tour',
      description: 'Taste authentic Turkish cuisine with a local guide through historic neighborhoods.',
      price: 45,
      category: 'food',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=food%20tour%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Traditional Hammam Experience',
      description: 'Relax in a centuries-old Turkish bath with traditional scrub and massage.',
      price: 50,
      category: 'wellness',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=hammam%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Hagia Sophia & Blue Mosque Tour',
      description: 'Explore two of Istanbul\'s most iconic landmarks with an expert guide.',
      price: 30,
      category: 'culture',
      image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=hagia%20sophia%20blue%20mosque%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Grand Bazaar Shopping Tour',
      description: 'Navigate the world\'s oldest covered market with a local shopping expert.',
      price: 25,
      category: 'shopping',
      image: 'https://images.unsplash.com/photo-1582655299221-2736ab6b6c55?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=grand%20bazaar%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Whirling Dervish Ceremony',
      description: 'Witness the mesmerizing spiritual dance of the Sufi whirling dervishes.',
      price: 20,
      category: 'culture',
      image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=whirling%20dervish%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Full-Day Cappadocia Tour',
      description: 'Explore the otherworldly landscapes of Cappadocia with flights from Istanbul.',
      price: 180,
      category: 'tour',
      image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=cappadocia%20from%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Turkish Cooking Class',
      description: 'Learn to prepare traditional Turkish dishes with a local chef.',
      price: 55,
      category: 'food',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=cooking%20class%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Princes Islands Boat Tour',
      description: 'Escape the city with a relaxing boat tour to the peaceful Princes Islands.',
      price: 40,
      category: 'tour',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=princes%20islands%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
    {
      name: 'Topkapi Palace Skip-the-Line',
      description: 'Skip the queues and explore the magnificent palace of Ottoman sultans.',
      price: 38,
      category: 'culture',
      image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400',
      bookingUrl: 'https://www.getyourguide.com/s/?q=topkapi%20palace%20istanbul&searchSource=2',
      vendor: 'GetYourGuide',
    },
  ];

  const categories = [
    { value: 'all', label: 'All', emoji: '✨' },
    { value: 'tour', label: 'Tours', emoji: '🗺️' },
    { value: 'food', label: 'Food', emoji: '🍽️' },
    { value: 'culture', label: 'Culture', emoji: '🕌' },
    { value: 'wellness', label: 'Wellness', emoji: '🧘' },
    { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  ];

  const filteredExperiences = selectedCategory === 'all'
    ? allExperiences
    : allExperiences.filter(exp => exp.category === selectedCategory);

  return (
    <div style={styles.container}>
      {/* Category Filter */}
      <div style={styles.filterSection}>
        <div style={styles.categoryScroll}>
          {categories.map((cat) => (
            <button
              key={cat.value}
              style={{
                ...styles.categoryBtn,
                ...(selectedCategory === cat.value ? styles.categoryBtnActive : {}),
              }}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Experiences Grid */}
      <div style={styles.experiencesList}>
        {filteredExperiences.map((exp, index) => {
          const count = experienceCounts[exp.name] || 0;
          
          return (
            <div key={index} style={styles.experienceCard}>
              <img 
                src={exp.image} 
                alt={exp.name}
                style={styles.experienceImage}
              />
              
              {/* Who's Going Badge */}
              {count > 0 && (
                <div style={styles.travelersGoing}>
                  👥 {count} {count === 1 ? 'traveler' : 'travelers'} interested
                </div>
              )}
              
              <div style={styles.experienceContent}>
                <div style={styles.experienceHeader}>
                  <div style={styles.experienceName}>{exp.name}</div>
                  <div style={styles.experiencePrice}>${exp.price}</div>
                </div>
                <div style={styles.experienceDescription}>
                  {exp.description}
                </div>
                
                {/* Who's Going Button (if count > 0 AND user has trip) */}
                {count > 0 && userTrips.length > 0 && (
                  <button
                    style={styles.whosGoingBtn}
                    onClick={() => handleShowWhosGoing(exp)}
                  >
                    👥 See who's going your dates
                  </button>
                )}
                
                {/* Actions */}
                <div style={styles.experienceActions}>
                  <button
                    style={styles.saveBtn}
                    onClick={() => handleSaveToTrip(exp)}
                  >
                    ⭐ Save
                  </button>
                  
                  <button
                    style={styles.bookNowBtn}
                    onClick={() => handleBookNow(exp)}
                  >
                    🎫 Book Now
                  </button>
                </div>
                
                {/* Vendor Badge */}
                <div style={styles.vendorBadge}>
                  Powered by {exp.vendor}
                </div>
                
                {/* No trip warning */}
                {userTrips.length === 0 && (
                  <div style={styles.noTripHint}>
                    💡 Add a trip to {destination.split(',')[0]} to save experiences
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredExperiences.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔍</div>
          <div style={styles.emptyText}>No experiences in this category</div>
          <div style={styles.emptySubtext}>Try selecting a different category</div>
        </div>
      )}

      {/* Trip Picker Modal */}
      {showTripPicker && (
        <div style={styles.modalOverlay} onClick={() => setShowTripPicker(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Save to which trip?</h3>
              <button 
                style={styles.modalClose}
                onClick={() => setShowTripPicker(false)}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.tripList}>
              {userTrips.map((trip, index) => (
                <button
                  key={index}
                  style={styles.tripOption}
                  onClick={() => confirmSaveToTrip(trip)}
                >
                  <div style={styles.tripOptionDest}>{trip.destination}</div>
                  <div style={styles.tripOptionDates}>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Who's Going Modal */}
      {showWhosGoing && (
        <div style={styles.modalOverlay} onClick={() => setShowWhosGoing(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Who's Going</h3>
              <button 
                style={styles.modalClose}
                onClick={() => setShowWhosGoing(false)}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.experienceTitle}>{selectedExperience?.name}</div>
            
            <div style={styles.dateRangeHint}>
              Showing travelers going during your trip dates
            </div>
            
            {whosGoingData.length === 0 ? (
              <div style={styles.noTravelers}>
                No other Rihlah users going during your trip dates yet. Be the first! 🎉
              </div>
            ) : (
              <>
                {/* Connections */}
                {whosGoingData.filter(t => t.isConnection).length > 0 && (
                  <div style={styles.travelerSection}>
                    <div style={styles.travelerSectionTitle}>
                      🟢 Your Connections ({whosGoingData.filter(t => t.isConnection).length})
                    </div>
                    {whosGoingData.filter(t => t.isConnection).map((traveler, index) => (
                      <div key={index} style={styles.travelerCard}>
                        <div style={styles.travelerInfo}>
                          <div style={styles.travelerAvatar}>
                            {traveler.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.travelerName}>{traveler.name}</div>
                            <div style={styles.travelerDate}>
                              {formatDate(traveler.tripStartDate)} - {formatDate(traveler.tripEndDate)}
                            </div>
                          </div>
                        </div>
                        {traveler.phone && (
                          <button
                            style={styles.whatsappBtn}
                            onClick={() => handleWhatsAppDirect(traveler)}
                          >
                            💬
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Other Users */}
                {whosGoingData.filter(t => !t.isConnection).length > 0 && (
                  <div style={styles.travelerSection}>
                    <div style={styles.travelerSectionTitle}>
                      ⚪ Other Rihlah Users ({whosGoingData.filter(t => !t.isConnection).length})
                    </div>
                    {whosGoingData.filter(t => !t.isConnection).map((traveler, index) => (
                      <div key={index} style={styles.travelerCard}>
                        <div style={styles.travelerInfo}>
                          <div style={styles.travelerAvatar}>
                            {traveler.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.travelerName}>{traveler.name}</div>
                            <div style={styles.travelerDate}>
                              {formatDate(traveler.tripStartDate)} - {formatDate(traveler.tripEndDate)}
                            </div>
                          </div>
                        </div>
                        <div style={styles.connectHint}>
                          Connect to message
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Group Chat */}
                {whosGoingData.filter(t => t.phone).length >= 2 && (
                  <button
                    style={styles.groupChatBtn}
                    onClick={handleCreateWhatsAppGroup}
                  >
                    📱 Create WhatsApp Group
                  </button>
                )}
              </>
            )}
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
  filterSection: {
    padding: '20px 20px 0 20px',
    marginBottom: '20px',
  },
  categoryScroll: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: '8px',
  },
  categoryBtn: {
    padding: '10px 16px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  categoryBtnActive: {
    background: '#059669',
    color: '#fff',
  },
  experiencesList: {
    padding: '0 20px',
  },
  experienceCard: {
    background: '#fff',
    borderRadius: '16px',
    marginBottom: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    position: 'relative',
  },
  experienceImage: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
  },
  travelersGoing: {
    position: 'absolute',
    top: '150px',
    left: '12px',
    padding: '6px 12px',
    background: 'rgba(5, 150, 105, 0.95)',
    color: '#fff',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    backdropFilter: 'blur(4px)',
  },
  experienceContent: {
    padding: '16px',
  },
  experienceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  experienceName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: '12px',
  },
  experiencePrice: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#059669',
    flexShrink: 0,
  },
  experienceDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
    marginBottom: '12px',
  },
  whosGoingBtn: {
    width: '100%',
    padding: '10px',
    background: '#f0fdf4',
    color: '#059669',
    border: '2px solid #d1fae5',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  experienceActions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  saveBtn: {
    flex: 1,
    padding: '12px',
    background: '#f0fdf4',
    color: '#059669',
    border: '2px solid #059669',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  bookNowBtn: {
    flex: 2,
    padding: '14px',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
  },
  vendorBadge: {
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noTripHint: {
    padding: '10px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '8px',
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
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1f2937',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
  },
  tripList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tripOption: {
    padding: '16px',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  tripOptionDest: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  tripOptionDates: {
    fontSize: '13px',
    color: '#6b7280',
  },
  experienceTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  dateRangeHint: {
    padding: '10px',
    background: '#fef3c7',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#92400e',
    textAlign: 'center',
    marginBottom: '16px',
  },
  noTravelers: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
  },
  travelerSection: {
    marginBottom: '20px',
  },
  travelerSectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: '12px',
  },
  travelerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  travelerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  travelerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
  },
  travelerName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  travelerDate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  whatsappBtn: {
    padding: '8px 12px',
    background: '#25D366',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  connectHint: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  groupChatBtn: {
    width: '100%',
    padding: '14px',
    background: '#25D366',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default ExperiencesTab;