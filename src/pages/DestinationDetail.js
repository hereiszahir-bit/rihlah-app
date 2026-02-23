import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, updateDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { FiX, FiArrowLeft, FiChevronDown, FiMapPin, FiNavigation, FiStar, FiClock, FiMessageCircle, FiCamera, FiPlus, FiCheck } from 'react-icons/fi';
import TabBar from '../components/TabBar';

function DestinationDetail() {
  const { destination } = useParams();
  const navigate = useNavigate();
  const destinationName = decodeURIComponent(destination);
  const { currentUser, currentUserData, allUsers, sentRequestUserIds, refreshConnections, refreshCurrentUser, refreshAll } = useUser();

  // Refresh data on mount to pick up other users' changes
  useEffect(() => {
    refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab, setActiveTab] = useState('experiences');
  const [peopleSubTab, setPeopleSubTab] = useState('hereNow');
  const [localSentRequests, setLocalSentRequests] = useState([]);

  const [expandedSaversExp, setExpandedSaversExp] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);

  // Filters
  const [expSort, setExpSort] = useState('rating');
  const [expPriceRange, setExpPriceRange] = useState('all');
  const [showExpFilters, setShowExpFilters] = useState(false);

  // Here Now filters
  const [hereNowGender, setHereNowGender] = useState('all');
  const [hereNowAgeRange, setHereNowAgeRange] = useState('all');
  const [hereNowInterests, setHereNowInterests] = useState([]);
  const [showHereNowFilters, setShowHereNowFilters] = useState(false);

  // Going Soon filters
  const [goingSoonGender, setGoingSoonGender] = useState('all');
  const [goingSoonAgeRange, setGoingSoonAgeRange] = useState('all');
  const [goingSoonInterests, setGoingSoonInterests] = useState([]);
  const [showGoingSoonFilters, setShowGoingSoonFilters] = useState(false);

  // Combine context + local optimistic sent requests
  const allSentRequests = useMemo(() => {
    return [...new Set([...sentRequestUserIds, ...localSentRequests])];
  }, [sentRequestUserIds, localSentRequests]);

  // Derive destination users from context
  const destinationUsers = useMemo(() => {
    if (!currentUser) return [];
    const currentUserGender = currentUserData?.gender || '';
    const rawVisibility = currentUserData?.profileVisibility || 'both';
    const myVisibility = ['Male', 'Female', 'both'].includes(rawVisibility) ? rawVisibility : 'both';

    return allUsers.filter(user => {
      if (user.id === currentUser.uid) return false;
      if (!Array.isArray(user.upcomingTrips) || user.upcomingTrips.length === 0) return false;
      if (!user.upcomingTrips.some(trip => trip.destination === destinationName)) return false;

      const rawTheirVis = user.profileVisibility || 'both';
      const theirVisibility = ['Male', 'Female', 'both'].includes(rawTheirVis) ? rawTheirVis : 'both';
      if (theirVisibility !== 'both' && theirVisibility !== currentUserGender) return false;
      if (myVisibility !== 'both' && user.gender !== myVisibility) return false;

      return true;
    });
  }, [allUsers, currentUser, currentUserData, destinationName]);

  // Experiences (static data)
  const experiences = useMemo(() => {
    const allExperiences = {
      'Istanbul': [
        { id: 1, name: 'Ottoman Mosques Walking Tour', price: 45, icon: '🕌', duration: '3 hours', rating: 4.9, reviews: 324, bookingUrl: 'https://www.getyourguide.com/istanbul-l56/ottoman-mosques-walking-tour-t12345/' },
        { id: 2, name: 'Halal Food Tour', price: 65, icon: '🍽️', duration: '4 hours', rating: 5.0, reviews: 189, bookingUrl: 'https://www.getyourguide.com/istanbul-l56/halal-food-tour-t23456/' },
        { id: 3, name: 'Sisters Turkish Bath', price: 80, icon: '💆‍♀️', duration: '2.5 hours', rating: 4.8, reviews: 267, bookingUrl: 'https://www.getyourguide.com/istanbul-l56/turkish-bath-experience-t34567/' },
        { id: 4, name: 'Bosphorus Sunset Cruise', price: 55, icon: '🚢', duration: '2 hours', rating: 4.9, reviews: 412, bookingUrl: 'https://www.getyourguide.com/istanbul-l56/bosphorus-sunset-cruise-t45678/' },
        { id: 5, name: 'Grand Bazaar Shopping Tour', price: 35, icon: '🛍️', duration: '3 hours', rating: 4.7, reviews: 156, bookingUrl: 'https://www.getyourguide.com/istanbul-l56/grand-bazaar-shopping-tour-t56789/' },
      ],
      'Dubai': [
        { id: 6, name: 'Desert Safari', price: 90, icon: '🏜️', duration: '6 hours', rating: 4.9, reviews: 892, bookingUrl: 'https://www.getyourguide.com/dubai-l173/desert-safari-t67890/' },
        { id: 7, name: 'Burj Khalifa Tour', price: 120, icon: '🏙️', duration: '2 hours', rating: 4.8, reviews: 1245, bookingUrl: 'https://www.getyourguide.com/dubai-l173/burj-khalifa-tour-t78901/' },
        { id: 8, name: 'Gold Souk Visit', price: 40, icon: '💍', duration: '2 hours', rating: 4.6, reviews: 234, bookingUrl: 'https://www.getyourguide.com/dubai-l173/gold-souk-visit-t89012/' },
      ],
      'Cairo': [
        { id: 9, name: 'Pyramids & Sphinx Tour', price: 75, icon: '🔺', duration: '5 hours', rating: 4.9, reviews: 678, bookingUrl: 'https://www.getyourguide.com/cairo-l169/pyramids-sphinx-tour-t90123/' },
        { id: 10, name: 'Islamic Cairo Walking Tour', price: 50, icon: '🕌', duration: '4 hours', rating: 4.8, reviews: 345, bookingUrl: 'https://www.getyourguide.com/cairo-l169/islamic-cairo-walking-tour-t01234/' },
        { id: 11, name: 'Nile River Dinner Cruise', price: 85, icon: '🚢', duration: '3 hours', rating: 4.7, reviews: 456, bookingUrl: 'https://www.getyourguide.com/cairo-l169/nile-dinner-cruise-t12340/' },
      ],
      'Marrakech': [
        { id: 12, name: 'Medina Walking Tour', price: 40, icon: '🕌', duration: '3 hours', rating: 4.8, reviews: 512, bookingUrl: 'https://www.getyourguide.com/marrakech-l208/medina-walking-tour-t13456/' },
        { id: 13, name: 'Moroccan Cooking Class', price: 55, icon: '🍽️', duration: '4 hours', rating: 4.9, reviews: 278, bookingUrl: 'https://www.getyourguide.com/marrakech-l208/moroccan-cooking-class-t14567/' },
        { id: 14, name: 'Atlas Mountains Day Trip', price: 70, icon: '🏔️', duration: '8 hours', rating: 4.7, reviews: 389, bookingUrl: 'https://www.getyourguide.com/marrakech-l208/atlas-mountains-day-trip-t15678/' },
      ],
      'Kuala Lumpur': [
        { id: 15, name: 'Islamic Arts Museum Tour', price: 30, icon: '🕌', duration: '2 hours', rating: 4.8, reviews: 198, bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/islamic-arts-museum-t16789/' },
        { id: 16, name: 'Halal Street Food Tour', price: 50, icon: '🍽️', duration: '3.5 hours', rating: 4.9, reviews: 345, bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/halal-street-food-tour-t17890/' },
        { id: 17, name: 'Batu Caves & Cultural Tour', price: 45, icon: '🏛️', duration: '4 hours', rating: 4.7, reviews: 267, bookingUrl: 'https://www.getyourguide.com/kuala-lumpur-l246/batu-caves-tour-t18901/' },
      ],
      'Mecca': [
        { id: 18, name: 'Guided Umrah Support Tour', price: 60, icon: '🕋', duration: '5 hours', rating: 5.0, reviews: 1023, bookingUrl: 'https://www.getyourguide.com/mecca-l4561/umrah-support-tour-t20001/' },
        { id: 19, name: 'Historical Mecca Walking Tour', price: 45, icon: '🕌', duration: '3 hours', rating: 4.9, reviews: 578, bookingUrl: 'https://www.getyourguide.com/mecca-l4561/historical-mecca-tour-t20002/' },
        { id: 20, name: 'Jabal al-Nour Hiking Experience', price: 35, icon: '🏔️', duration: '4 hours', rating: 4.8, reviews: 312, bookingUrl: 'https://www.getyourguide.com/mecca-l4561/jabal-al-nour-hike-t20003/' },
      ],
      'Medina': [
        { id: 21, name: 'Masjid al-Nabawi Guided Visit', price: 40, icon: '🕌', duration: '3 hours', rating: 5.0, reviews: 876, bookingUrl: 'https://www.getyourguide.com/medina-l4562/masjid-nabawi-visit-t20004/' },
        { id: 22, name: 'Historical Sites of Medina Tour', price: 55, icon: '🏛️', duration: '4 hours', rating: 4.9, reviews: 445, bookingUrl: 'https://www.getyourguide.com/medina-l4562/historical-medina-tour-t20005/' },
        { id: 23, name: 'Date Farm & Local Market Tour', price: 30, icon: '🌴', duration: '2.5 hours', rating: 4.7, reviews: 234, bookingUrl: 'https://www.getyourguide.com/medina-l4562/date-farm-tour-t20006/' },
      ],
      'Amman': [
        { id: 24, name: 'Citadel & Roman Theater Tour', price: 40, icon: '🏛️', duration: '3 hours', rating: 4.8, reviews: 356, bookingUrl: 'https://www.getyourguide.com/amman-l347/citadel-roman-theater-t20007/' },
        { id: 25, name: 'Jordanian Cooking Class', price: 55, icon: '🍽️', duration: '4 hours', rating: 4.9, reviews: 189, bookingUrl: 'https://www.getyourguide.com/amman-l347/jordanian-cooking-class-t20008/' },
        { id: 26, name: 'Dead Sea Day Trip', price: 75, icon: '🏖️', duration: '8 hours', rating: 4.8, reviews: 512, bookingUrl: 'https://www.getyourguide.com/amman-l347/dead-sea-day-trip-t20009/' },
      ],
      'Sarajevo': [
        { id: 27, name: 'Old Town & Ottoman Heritage Walk', price: 35, icon: '🕌', duration: '3 hours', rating: 4.9, reviews: 278, bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/ottoman-heritage-walk-t20010/' },
        { id: 28, name: 'Bosnian War & Tunnel Tour', price: 45, icon: '🏛️', duration: '4 hours', rating: 4.8, reviews: 423, bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/war-tunnel-tour-t20011/' },
        { id: 29, name: 'Traditional Bosnian Food Tour', price: 40, icon: '🍽️', duration: '3.5 hours', rating: 4.9, reviews: 198, bookingUrl: 'https://www.getyourguide.com/sarajevo-l917/bosnian-food-tour-t20012/' },
      ],
      'Cordoba': [
        { id: 30, name: 'Mezquita-Cathedral Guided Tour', price: 35, icon: '🕌', duration: '2 hours', rating: 4.9, reviews: 867, bookingUrl: 'https://www.getyourguide.com/cordoba-l488/mezquita-cathedral-tour-t20013/' },
        { id: 31, name: 'Jewish Quarter & Alcazar Visit', price: 40, icon: '🏛️', duration: '3 hours', rating: 4.8, reviews: 345, bookingUrl: 'https://www.getyourguide.com/cordoba-l488/jewish-quarter-alcazar-t20014/' },
        { id: 32, name: 'Andalusian Patios Walking Tour', price: 25, icon: '🌺', duration: '2 hours', rating: 4.7, reviews: 234, bookingUrl: 'https://www.getyourguide.com/cordoba-l488/patios-walking-tour-t20015/' },
      ],
      'Fez': [
        { id: 33, name: 'Fez Medina Guided Walking Tour', price: 30, icon: '🕌', duration: '4 hours', rating: 4.9, reviews: 567, bookingUrl: 'https://www.getyourguide.com/fez-l571/medina-walking-tour-t20016/' },
        { id: 34, name: 'Traditional Tanneries Visit', price: 20, icon: '🎨', duration: '1.5 hours', rating: 4.7, reviews: 345, bookingUrl: 'https://www.getyourguide.com/fez-l571/tanneries-visit-t20017/' },
        { id: 35, name: 'Moroccan Ceramic Workshop', price: 45, icon: '🏺', duration: '3 hours', rating: 4.8, reviews: 178, bookingUrl: 'https://www.getyourguide.com/fez-l571/ceramic-workshop-t20018/' },
      ],
      'Doha': [
        { id: 36, name: 'Museum of Islamic Art Tour', price: 25, icon: '🏛️', duration: '2 hours', rating: 4.9, reviews: 456, bookingUrl: 'https://www.getyourguide.com/doha-l1234/islamic-art-museum-t20019/' },
        { id: 37, name: 'Souq Waqif & Katara Tour', price: 40, icon: '🛍️', duration: '3 hours', rating: 4.8, reviews: 312, bookingUrl: 'https://www.getyourguide.com/doha-l1234/souq-waqif-katara-t20020/' },
        { id: 38, name: 'Desert Safari & Inland Sea', price: 95, icon: '🏜️', duration: '6 hours', rating: 4.9, reviews: 589, bookingUrl: 'https://www.getyourguide.com/doha-l1234/desert-safari-inland-sea-t20021/' },
      ],
      'Muscat': [
        { id: 39, name: 'Sultan Qaboos Grand Mosque Visit', price: 20, icon: '🕌', duration: '2 hours', rating: 4.9, reviews: 423, bookingUrl: 'https://www.getyourguide.com/muscat-l1456/grand-mosque-visit-t20022/' },
        { id: 40, name: 'Muttrah Souq & Corniche Walk', price: 30, icon: '🛍️', duration: '2.5 hours', rating: 4.7, reviews: 234, bookingUrl: 'https://www.getyourguide.com/muscat-l1456/muttrah-souq-walk-t20023/' },
        { id: 41, name: 'Wadi Shab Day Trip', price: 70, icon: '🏞️', duration: '8 hours', rating: 4.9, reviews: 345, bookingUrl: 'https://www.getyourguide.com/muscat-l1456/wadi-shab-day-trip-t20024/' },
      ],
      'Baku': [
        { id: 42, name: 'Old City & Maiden Tower Tour', price: 30, icon: '🏰', duration: '3 hours', rating: 4.8, reviews: 312, bookingUrl: 'https://www.getyourguide.com/baku-l1789/old-city-maiden-tower-t20025/' },
        { id: 43, name: 'Flame Towers & Modern Baku', price: 35, icon: '🏙️', duration: '2.5 hours', rating: 4.7, reviews: 198, bookingUrl: 'https://www.getyourguide.com/baku-l1789/flame-towers-modern-baku-t20026/' },
        { id: 44, name: 'Fire Temple & Mud Volcanoes', price: 50, icon: '🔥', duration: '5 hours', rating: 4.8, reviews: 267, bookingUrl: 'https://www.getyourguide.com/baku-l1789/fire-temple-mud-volcanoes-t20027/' },
      ],
      'Zanzibar': [
        { id: 45, name: 'Stone Town Spice Tour', price: 35, icon: '🌿', duration: '3 hours', rating: 4.8, reviews: 456, bookingUrl: 'https://www.getyourguide.com/zanzibar-l2345/stone-town-spice-tour-t20028/' },
        { id: 46, name: 'Jozani Forest & Beach Day', price: 55, icon: '🌴', duration: '6 hours', rating: 4.7, reviews: 278, bookingUrl: 'https://www.getyourguide.com/zanzibar-l2345/jozani-forest-beach-t20029/' },
        { id: 47, name: 'Dhow Sunset Sailing Cruise', price: 45, icon: '⛵', duration: '2.5 hours', rating: 4.9, reviews: 389, bookingUrl: 'https://www.getyourguide.com/zanzibar-l2345/dhow-sunset-cruise-t20030/' },
      ],
      'Barcelona': [
        { id: 48, name: 'Gothic Quarter Walking Tour', price: 30, icon: '🏛️', duration: '2.5 hours', rating: 4.8, reviews: 789, bookingUrl: 'https://www.getyourguide.com/barcelona-l45/gothic-quarter-tour-t20031/' },
        { id: 49, name: 'Sagrada Familia Guided Tour', price: 50, icon: '⛪', duration: '2 hours', rating: 4.9, reviews: 1567, bookingUrl: 'https://www.getyourguide.com/barcelona-l45/sagrada-familia-tour-t20032/' },
        { id: 50, name: 'Halal Tapas & Food Tour', price: 65, icon: '🍽️', duration: '3.5 hours', rating: 4.8, reviews: 234, bookingUrl: 'https://www.getyourguide.com/barcelona-l45/halal-tapas-food-tour-t20033/' },
      ],
      'London': [
        { id: 51, name: 'East London Muslim Heritage Walk', price: 25, icon: '🕌', duration: '2.5 hours', rating: 4.8, reviews: 345, bookingUrl: 'https://www.getyourguide.com/london-l57/muslim-heritage-walk-t20034/' },
        { id: 52, name: 'British Museum Guided Tour', price: 35, icon: '🏛️', duration: '3 hours', rating: 4.9, reviews: 1234, bookingUrl: 'https://www.getyourguide.com/london-l57/british-museum-tour-t20035/' },
        { id: 53, name: 'Halal Food Tour: Brick Lane & Beyond', price: 55, icon: '🍽️', duration: '3.5 hours', rating: 4.8, reviews: 278, bookingUrl: 'https://www.getyourguide.com/london-l57/halal-food-brick-lane-t20036/' },
      ],
      'Jakarta': [
        { id: 54, name: 'Istiqlal Mosque & Old Town Tour', price: 25, icon: '🕌', duration: '3 hours', rating: 4.8, reviews: 345, bookingUrl: 'https://www.getyourguide.com/jakarta-l294/istiqlal-mosque-old-town-t20037/' },
        { id: 55, name: 'Jakarta Street Food Adventure', price: 35, icon: '🍽️', duration: '4 hours', rating: 4.9, reviews: 456, bookingUrl: 'https://www.getyourguide.com/jakarta-l294/street-food-adventure-t20038/' },
        { id: 56, name: 'Thousand Islands Day Trip', price: 65, icon: '🏝️', duration: '8 hours', rating: 4.7, reviews: 189, bookingUrl: 'https://www.getyourguide.com/jakarta-l294/thousand-islands-trip-t20039/' },
      ],
    };

    const cityName = destinationName.split(',')[0].trim();
    return allExperiences[cityName] || allExperiences[destinationName] || [];
  }, [destinationName]);

  const [localCurrentUserData, setLocalCurrentUserData] = useState(null);
  // Use context data but allow local overrides for optimistic updates
  const effectiveUserData = localCurrentUserData || currentUserData;

  // Trip picker state for when multiple upcoming trips match
  const [tripPickerData, setTripPickerData] = useState(null); // { experience, matchingTrips: [{ index, trip }] }

  const saveExperienceToTrip = async (experience, tripIndex) => {
    try {
      const updatedTrips = [...effectiveUserData.upcomingTrips];
      if (!updatedTrips[tripIndex].experiences) {
        updatedTrips[tripIndex].experiences = [];
      }

      const alreadyAdded = updatedTrips[tripIndex].experiences.some(
        exp => exp.id === experience.id
      );
      if (alreadyAdded) {
        alert('Already saved to this trip!');
        return;
      }

      updatedTrips[tripIndex].experiences.push(experience);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      setLocalCurrentUserData({ ...effectiveUserData, upcomingTrips: updatedTrips });
      refreshCurrentUser();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save');
    }
  };

  const handleAddExperience = async (experience) => {
    if (!currentUser || !effectiveUserData) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchingTrips = [];
    (effectiveUserData.upcomingTrips || []).forEach((trip, index) => {
      if (trip.destination !== destinationName) return;
      const endDate = new Date(trip.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (endDate >= today) {
        matchingTrips.push({ index, trip });
      }
    });

    if (matchingTrips.length === 0) {
      alert('Please add an upcoming trip to this destination first!');
      return;
    }

    if (matchingTrips.length === 1) {
      await saveExperienceToTrip(experience, matchingTrips[0].index);
      return;
    }

    // Multiple trips — show picker
    setTripPickerData({ experience, matchingTrips });
  };

  const handleSendConnectionRequest = async (toUser) => {
    try {
      if (!currentUser || !effectiveUserData) return;

      const alreadyConnected = (effectiveUserData.connections || []).some(
        c => c.userId === toUser.id
      );
      if (alreadyConnected) {
        alert('You are already connected!');
        return;
      }

      const [fromMeSnapshot, toMeSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'connectionRequests'), where('fromUserId', '==', currentUser.uid))),
        getDocs(query(collection(db, 'connectionRequests'), where('toUserId', '==', currentUser.uid)))
      ]);
      const allDocs = [...fromMeSnapshot.docs, ...toMeSnapshot.docs];
      const existingRequest = allDocs.find(docSnap => {
        const data = docSnap.data();
        return (
          (data.fromUserId === currentUser.uid && data.toUserId === toUser.id) ||
          (data.fromUserId === toUser.id && data.toUserId === currentUser.uid)
        );
      });

      if (existingRequest) {
        alert('Request already exists!');
        return;
      }

      setLocalSentRequests(prev => [...prev, toUser.id]);

      await addDoc(collection(db, 'connectionRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: effectiveUserData.name,
        fromUserAge: effectiveUserData.age,
        fromUserGender: effectiveUserData.gender,
        fromUserBio: effectiveUserData.bio || '',
        fromUserPhotoURL: effectiveUserData.photoURL || '',
        fromUserInterests: effectiveUserData.interests || [],
        toUserId: toUser.id,
        toUserName: toUser.name || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      refreshConnections();
      alert('Request sent!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed');
    }
  };

  // Filter and sort experiences
  const filteredExperiences = useMemo(() => {
    let filtered = [...experiences];

    if (expPriceRange === 'under50') {
      filtered = filtered.filter(e => e.price < 50);
    } else if (expPriceRange === '50to80') {
      filtered = filtered.filter(e => e.price >= 50 && e.price <= 80);
    } else if (expPriceRange === 'over80') {
      filtered = filtered.filter(e => e.price > 80);
    }

    if (expSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (expSort === 'priceLow') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (expSort === 'priceHigh') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (expSort === 'popular') {
      filtered.sort((a, b) => b.reviews - a.reviews);
    }

    return filtered;
  }, [experiences, expPriceRange, expSort]);

  const parseDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Split users into here now / going soon
  const { allHereNow, allGoingSoon } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = [];
    const soon = [];

    destinationUsers.forEach(user => {
      let status = null;
      user.upcomingTrips.forEach(trip => {
        if (trip.destination !== destinationName) return;
        const startDate = parseDate(trip.startDate);
        const endDate = parseDate(trip.endDate);

        if (today >= startDate && today <= endDate) {
          status = 'hereNow';
        } else if (today < startDate && status !== 'hereNow') {
          status = 'planning';
        }
      });

      if (status === 'hereNow') now.push(user);
      else if (status === 'planning') soon.push(user);
    });

    return { allHereNow: now, allGoingSoon: soon };
  }, [destinationUsers, destinationName]);

  const applyPeopleFilters = (users, gender, ageRange, interests) => {
    return users.filter(user => {
      if (gender !== 'all' && user.gender !== gender) return false;

      if (ageRange !== 'all') {
        const age = user.age;
        if (ageRange === '18-25' && (age < 18 || age > 25)) return false;
        if (ageRange === '26-35' && (age < 26 || age > 35)) return false;
        if (ageRange === '36-45' && (age < 36 || age > 45)) return false;
        if (ageRange === '46+' && age < 46) return false;
      }

      if (interests.length > 0) {
        const userInterests = user.interests || [];
        const hasMatch = interests.some(i => userInterests.includes(i));
        if (!hasMatch) return false;
      }

      return true;
    });
  };

  const hereNow = applyPeopleFilters(allHereNow, hereNowGender, hereNowAgeRange, hereNowInterests);
  const goingSoon = applyPeopleFilters(allGoingSoon, goingSoonGender, goingSoonAgeRange, goingSoonInterests);

  const hereNowGenderOptions = [...new Set(allHereNow.map(u => u.gender).filter(Boolean))];
  const goingSoonGenderOptions = [...new Set(allGoingSoon.map(u => u.gender).filter(Boolean))];

  const availableInterests = [
    'Food', 'Adventure', 'Culture', 'Photography',
    'Art', 'History', 'Nature', 'Shopping',
    'Nightlife', 'Wellness'
  ];

  const isExperienceSaved = (expId) => {
    return effectiveUserData?.upcomingTrips
      ?.find(trip => trip.destination === destinationName)
      ?.experiences?.some(e => e.id === expId) || false;
  };

  const getOverlappingSavers = (expId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the user's upcoming/current trips to this destination
    const myTrips = (effectiveUserData?.upcomingTrips || []).filter(trip => {
      if (trip.destination !== destinationName) return false;
      const endDate = new Date(trip.endDate);
      endDate.setHours(23, 59, 59, 999);
      return endDate >= today;
    });

    // No upcoming trip — don't show any savers
    if (myTrips.length === 0) return [];

    return destinationUsers.filter(user => {
      const userTrips = (user.upcomingTrips || []).filter(t => t.destination === destinationName);

      return userTrips.some(userTrip => {
        if (!userTrip.experiences) return false;
        const hasSaved = userTrip.experiences.some(e => e.id === expId);
        if (!hasSaved) return false;

        // Check if any of their trips overlap with any of my upcoming trips
        const theirStart = new Date(userTrip.startDate);
        const theirEnd = new Date(userTrip.endDate);
        return myTrips.some(myTrip => {
          const myStart = new Date(myTrip.startDate);
          const myEnd = new Date(myTrip.endDate);
          return theirStart <= myEnd && theirEnd >= myStart;
        });
      });
    });
  };

  const renderPersonCard = (user) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchingTrips = user.upcomingTrips.filter(t => t.destination === destinationName);
    const trip = matchingTrips.find(t => {
      const s = parseDate(t.startDate);
      const e = parseDate(t.endDate);
      return today >= s && today <= e;
    }) || matchingTrips.find(t => parseDate(t.startDate) > today) || matchingTrips[0];
    const isConnected = (effectiveUserData?.connections || []).some(c => c.userId === user.id);
    const isPending = allSentRequests.includes(user.id);
    const fmt = { month: 'short', day: 'numeric' };
    return (
      <div key={user.id} style={styles.personRow} onClick={() => setPreviewUser(user)}>
        <div style={{
          ...styles.personAvatar,
          border: isConnected ? '2px solid #059669' : '2px solid #d1d5db',
        }}>
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} style={styles.personAvatarImg} />
          ) : (
            <div style={styles.personAvatarPlaceholder}>{user.name?.charAt(0)}</div>
          )}
        </div>
        <div style={styles.personInfo}>
          <div style={styles.personName}>{user.name}{user.age ? `, ${user.age}` : ''}</div>
          <div style={styles.personDates}>
            {parseDate(trip.startDate).toLocaleDateString('en-US', fmt)} – {parseDate(trip.endDate).toLocaleDateString('en-US', fmt)}
          </div>
        </div>
        {isConnected ? (
          <div style={styles.personConnectedTag}>Connected</div>
        ) : isPending ? (
          <div style={styles.personPendingTag}>Pending</div>
        ) : (
          <button style={styles.personConnectBtn} onClick={(e) => { e.stopPropagation(); handleSendConnectionRequest(user); }}>
            Connect
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/destinations')}>
          <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
        </button>
        <h1 style={styles.title}>{destinationName}</h1>
        <p style={styles.subtitle}>
          {allHereNow.length + allGoingSoon.length} travelers • {experiences.length} experiences
        </p>
      </div>

      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(activeTab === 'experiences' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('experiences')}
        >
          Experiences ({experiences.length})
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'people' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('people')}
        >
          People ({allHereNow.length + allGoingSoon.length})
        </button>
      </div>

      <div style={styles.content}>
        {/* EXPERIENCES TAB */}
        {activeTab === 'experiences' && (
          <div>
            <button
              style={styles.filterToggle}
              onClick={() => setShowExpFilters(!showExpFilters)}
            >
              <span>Filters {expPriceRange !== 'all' || expSort !== 'rating' ? '•' : ''}</span>
              <span style={{ transform: showExpFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-flex' }}><FiChevronDown size={16} /></span>
            </button>
            {showExpFilters && (
              <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel}>Sort</div>
                  <div style={styles.filterChips}>
                    {[
                      { key: 'rating', label: 'Top Rated' },
                      { key: 'priceLow', label: 'Price: Low' },
                      { key: 'priceHigh', label: 'Price: High' },
                      { key: 'popular', label: 'Most Popular' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        style={{...styles.chip, ...(expSort === opt.key ? styles.chipActive : {})}}
                        onClick={() => setExpSort(opt.key)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel}>Price</div>
                  <div style={styles.filterChips}>
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'under50', label: 'Under $50' },
                      { key: '50to80', label: '$50-$80' },
                      { key: 'over80', label: '$80+' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        style={{...styles.chip, ...(expPriceRange === opt.key ? styles.chipActive : {})}}
                        onClick={() => setExpPriceRange(opt.key)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={styles.experiencesGrid}>
              {filteredExperiences.length === 0 && (
                <div style={styles.empty}>
                  <p>No experiences match your filters</p>
                </div>
              )}
              {filteredExperiences.map(exp => {
                const savers = getOverlappingSavers(exp.id);
                return (
                  <div key={exp.id} style={styles.expCard}>
                    <div style={styles.expIcon}>{exp.icon}</div>
                    <h3 style={styles.expName}>{exp.name}</h3>
                    <div style={styles.expMeta}>
                      <span><FiStar size={14} style={{ marginRight: '3px', verticalAlign: '-2px', color: '#f59e0b' }} />{exp.rating}</span>
                      <span style={{marginLeft: '8px'}}>({exp.reviews})</span>
                    </div>
                    <div style={styles.expDuration}><FiClock size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />{exp.duration}</div>
                    <div style={styles.expPrice}>${exp.price}</div>

                    {savers.length > 0 && (
                      <div>
                        <div
                          style={styles.saversRow}
                          onClick={() => setExpandedSaversExp(expandedSaversExp === exp.id ? null : exp.id)}
                        >
                          <div style={styles.saversAvatars}>
                            {savers.slice(0, 5).map(user => (
                              user.photoURL ? (
                                <img key={user.id} src={user.photoURL} alt={user.name} style={styles.saverAvatar} />
                              ) : (
                                <div key={user.id} style={styles.saverAvatarPlaceholder}>
                                  {user.name?.charAt(0)}
                                </div>
                              )
                            ))}
                          </div>
                          <span style={styles.saversText}>
                            {savers.length === 1
                              ? `${savers[0].name?.split(' ')[0]} saved this`
                              : savers.length <= 3
                                ? `${savers.map(s => s.name?.split(' ')[0]).join(', ')} saved this`
                                : `${savers[0].name?.split(' ')[0]} + ${savers.length - 1} others saved this`
                            }
                          </span>
                          <span style={{ ...styles.saversChevron, transform: expandedSaversExp === exp.id ? 'rotate(180deg)' : 'rotate(0deg)' }}><FiChevronDown size={14} /></span>
                        </div>

                        {expandedSaversExp === exp.id && (
                          <div style={styles.saversExpanded}>
                            {savers.map(user => {
                              const userTrip = user.upcomingTrips.find(t => t.destination === destinationName);
                              const isConnected = (effectiveUserData?.connections || []).some(c => c.userId === user.id);
                              const isPending = allSentRequests.includes(user.id);
                              return (
                                <div key={user.id} style={styles.saverProfile}>
                                  <div style={styles.saverProfileLeft} onClick={() => setPreviewUser(user)}>
                                    {user.photoURL ? (
                                      <img src={user.photoURL} alt={user.name} style={styles.saverProfileImg} />
                                    ) : (
                                      <div style={styles.saverProfilePlaceholder}>
                                        {user.name?.charAt(0)}
                                      </div>
                                    )}
                                    <div style={styles.saverProfileInfo}>
                                      <div style={styles.saverProfileName}>{user.name}{user.age ? `, ${user.age}` : ''}</div>
                                      {userTrip && (
                                        <div style={styles.saverProfileDates}>
                                          {new Date(userTrip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(userTrip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {isConnected ? (
                                    <div style={styles.saverConnectedBadge}>Connected</div>
                                  ) : isPending ? (
                                    <div style={styles.saverPendingBadge}>Pending</div>
                                  ) : (
                                    <button style={styles.saverConnectBtn} onClick={() => handleSendConnectionRequest(user)}>
                                      Connect
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={styles.expActions}>
                      <button
                        style={isExperienceSaved(exp.id) ? styles.savedBtn : styles.saveBtn}
                        onClick={() => handleAddExperience(exp)}
                      >
                        {isExperienceSaved(exp.id) ? <><FiCheck size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />Saved</> : <><FiPlus size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />Save</>}
                      </button>
                      <button
                        style={styles.bookBtn}
                        onClick={() => window.open(exp.bookingUrl, '_blank')}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PEOPLE TAB */}
        {activeTab === 'people' && (
          <div>
            <div style={styles.subTabs}>
              <button
                style={{...styles.subTab, ...(peopleSubTab === 'hereNow' ? styles.subTabActive : {})}}
                onClick={() => setPeopleSubTab('hereNow')}
              >
                <div style={styles.subTabDot} />
                Here Now ({allHereNow.length})
              </button>
              <button
                style={{...styles.subTab, ...(peopleSubTab === 'goingSoon' ? styles.subTabActive : {})}}
                onClick={() => setPeopleSubTab('goingSoon')}
              >
                <div style={{...styles.subTabDot, background: '#f59e0b'}} />
                Going Soon ({allGoingSoon.length})
              </button>
            </div>

            {peopleSubTab === 'hereNow' && (
              <div>
                {allHereNow.length > 0 ? (
                  <>
                    <button
                      style={styles.filterToggle}
                      onClick={() => setShowHereNowFilters(!showHereNowFilters)}
                    >
                      <span>Filters {hereNowGender !== 'all' || hereNowAgeRange !== 'all' || hereNowInterests.length > 0 ? '•' : ''}</span>
                      <span style={{ transform: showHereNowFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-flex' }}><FiChevronDown size={16} /></span>
                    </button>
                    {showHereNowFilters && (
                      <div style={styles.filterBar}>
                        {(effectiveUserData?.profileVisibility || 'both') === 'both' && (
                          <div style={styles.filterGroup}>
                            <div style={styles.filterLabel}>Gender</div>
                            <div style={styles.filterChips}>
                              <button
                                style={{...styles.chip, ...(hereNowGender === 'all' ? styles.chipActive : {})}}
                                onClick={() => setHereNowGender('all')}
                              >All</button>
                              {hereNowGenderOptions.map(g => (
                                <button
                                  key={g}
                                  style={{...styles.chip, ...(hereNowGender === g ? styles.chipActive : {})}}
                                  onClick={() => setHereNowGender(g)}
                                >{g}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={styles.filterGroup}>
                          <div style={styles.filterLabel}>Age</div>
                          <div style={styles.filterChips}>
                            {[
                              { key: 'all', label: 'All' },
                              { key: '18-25', label: '18-25' },
                              { key: '26-35', label: '26-35' },
                              { key: '36-45', label: '36-45' },
                              { key: '46+', label: '46+' },
                            ].map(opt => (
                              <button
                                key={opt.key}
                                style={{...styles.chip, ...(hereNowAgeRange === opt.key ? styles.chipActive : {})}}
                                onClick={() => setHereNowAgeRange(opt.key)}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                        <div style={styles.filterGroup}>
                          <div style={styles.filterLabel}>Interests</div>
                          <div style={styles.filterChips}>
                            {availableInterests.map(interest => (
                              <button
                                key={interest}
                                style={{...styles.chip, ...(hereNowInterests.includes(interest) ? styles.chipActive : {})}}
                                onClick={() => {
                                  setHereNowInterests(prev =>
                                    prev.includes(interest)
                                      ? prev.filter(i => i !== interest)
                                      : [...prev, interest]
                                  );
                                }}
                              >{interest}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {hereNow.length > 0 ? (
                      <div style={styles.peopleList}>
                        {hereNow.map(renderPersonCard)}
                      </div>
                    ) : (
                      <div style={styles.empty}>
                        <div style={{fontSize: '48px', marginBottom: '12px'}}>🔍</div>
                        <p>No travelers match your filters</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.empty}>
                    <div style={{fontSize: '64px', marginBottom: '16px'}}>📍</div>
                    <p>No one is here right now</p>
                  </div>
                )}
              </div>
            )}

            {peopleSubTab === 'goingSoon' && (
              <div>
                {allGoingSoon.length > 0 ? (
                  <>
                    <button
                      style={styles.filterToggle}
                      onClick={() => setShowGoingSoonFilters(!showGoingSoonFilters)}
                    >
                      <span>Filters {goingSoonGender !== 'all' || goingSoonAgeRange !== 'all' || goingSoonInterests.length > 0 ? '•' : ''}</span>
                      <span style={{ transform: showGoingSoonFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-flex' }}><FiChevronDown size={16} /></span>
                    </button>
                    {showGoingSoonFilters && (
                      <div style={styles.filterBar}>
                        {(effectiveUserData?.profileVisibility || 'both') === 'both' && (
                          <div style={styles.filterGroup}>
                            <div style={styles.filterLabel}>Gender</div>
                            <div style={styles.filterChips}>
                              <button
                                style={{...styles.chip, ...(goingSoonGender === 'all' ? styles.chipActive : {})}}
                                onClick={() => setGoingSoonGender('all')}
                              >All</button>
                              {goingSoonGenderOptions.map(g => (
                                <button
                                  key={g}
                                  style={{...styles.chip, ...(goingSoonGender === g ? styles.chipActive : {})}}
                                  onClick={() => setGoingSoonGender(g)}
                                >{g}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={styles.filterGroup}>
                          <div style={styles.filterLabel}>Age</div>
                          <div style={styles.filterChips}>
                            {[
                              { key: 'all', label: 'All' },
                              { key: '18-25', label: '18-25' },
                              { key: '26-35', label: '26-35' },
                              { key: '36-45', label: '36-45' },
                              { key: '46+', label: '46+' },
                            ].map(opt => (
                              <button
                                key={opt.key}
                                style={{...styles.chip, ...(goingSoonAgeRange === opt.key ? styles.chipActive : {})}}
                                onClick={() => setGoingSoonAgeRange(opt.key)}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                        <div style={styles.filterGroup}>
                          <div style={styles.filterLabel}>Interests</div>
                          <div style={styles.filterChips}>
                            {availableInterests.map(interest => (
                              <button
                                key={interest}
                                style={{...styles.chip, ...(goingSoonInterests.includes(interest) ? styles.chipActive : {})}}
                                onClick={() => {
                                  setGoingSoonInterests(prev =>
                                    prev.includes(interest)
                                      ? prev.filter(i => i !== interest)
                                      : [...prev, interest]
                                  );
                                }}
                              >{interest}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {goingSoon.length > 0 ? (
                      <div style={styles.peopleList}>
                        {goingSoon.map(renderPersonCard)}
                      </div>
                    ) : (
                      <div style={styles.empty}>
                        <div style={{fontSize: '48px', marginBottom: '12px'}}>🔍</div>
                        <p>No travelers match your filters</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.empty}>
                    <div style={{fontSize: '64px', marginBottom: '16px'}}>✈️</div>
                    <p>No upcoming travelers yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Preview Modal */}
      {previewUser && (() => {
        const isConnected = (effectiveUserData?.connections || []).some(c => c.userId === previewUser.id);
        const isPending = allSentRequests.includes(previewUser.id);
        const allTrips = previewUser.upcomingTrips || [];
        const todayModal = new Date();
        todayModal.setHours(0, 0, 0, 0);
        const destTrips = allTrips.filter(t => t.destination === destinationName);
        const isThereDest = destTrips.some(t => {
          const s = parseDate(t.startDate); const e = parseDate(t.endDate);
          return todayModal >= s && todayModal <= e;
        });
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
              <div style={styles.modalBackdrop}>
                {previewUser.photoURL ? (
                  <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalBackdropImg} />
                ) : (
                  <div style={styles.modalBackdropPlaceholder}>
                    {previewUser.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={styles.modalBackdropGradient} />
                <button style={styles.modalCloseBtn} onClick={() => setPreviewUser(null)}><FiX size={18} /></button>
                <div style={styles.modalBackdropInfo}>
                  <div style={styles.modalNameOverlay}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</div>
                  {destTrips.length > 0 && (
                    <span style={styles.modalStatusBadge}>{isThereDest ? <><FiMapPin size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> Here now</> : <><FiNavigation size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} /> Going soon</>}</span>
                  )}
                </div>
              </div>

              <div style={styles.modalBody}>
                {previewUser.bio && (
                  <p style={styles.modalBio}>{previewUser.bio}</p>
                )}

                {previewUser.interests && previewUser.interests.length > 0 && (
                  <div style={styles.modalInterests}>
                    {previewUser.interests.map(interest => (
                      <span key={interest} style={styles.modalInterestChip}>{interest}</span>
                    ))}
                  </div>
                )}

                {isConnected && (previewUser.whatsapp || previewUser.instagram) && (
                  <div style={styles.modalSocials}>
                    {previewUser.whatsapp && (
                      <a href={`https://wa.me/${previewUser.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                        <FiMessageCircle size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> WhatsApp
                      </a>
                    )}
                    {previewUser.instagram && (
                      <a href={`https://www.instagram.com/${previewUser.instagram}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                        <FiCamera size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> @{previewUser.instagram}
                      </a>
                    )}
                  </div>
                )}

                {allTrips.length > 0 && (
                  <div style={styles.modalTripsSection}>
                    <div style={styles.modalTripsTitle}>Trips</div>
                    {allTrips.map((trip, i) => {
                      const start = parseDate(trip.startDate);
                      const end = parseDate(trip.endDate);
                      const isThere = todayModal >= start && todayModal <= end;
                      const isUpcoming = todayModal < start;
                      return (
                        <div key={i} style={styles.modalTripItem}>
                          <span style={styles.modalTripIcon}>{isThere ? <FiMapPin size={14} color="#047857" /> : isUpcoming ? <FiNavigation size={14} color="#6b7280" /> : '✓'}</span>
                          <div style={styles.modalTripInfo}>
                            <div style={styles.modalTripDest}>{trip.destination.split(',')[0]}</div>
                            <div style={styles.modalTripDates}>
                              {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          {isThere && <span style={styles.modalTripBadge}>There now</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isConnected ? (
                  <div style={styles.modalConnectedBadge}>Connected</div>
                ) : isPending ? (
                  <div style={styles.modalPendingBadge}>Request Pending</div>
                ) : (
                  <button style={styles.modalConnectBtn} onClick={() => { handleSendConnectionRequest(previewUser); setPreviewUser(null); }}>
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <button
        style={styles.fab}
        onClick={() => navigate('/add-trip', { state: { preselectedDestination: destinationName } })}
      >
        <FiPlus size={28} color="#fff" />
      </button>

      {/* Trip Picker Modal */}
      {tripPickerData && (
        <div style={styles.tripPickerOverlay} onClick={() => setTripPickerData(null)}>
          <div style={styles.tripPickerCard} onClick={e => e.stopPropagation()}>
            <div style={styles.tripPickerHeader}>
              <div style={styles.tripPickerTitle}>Which trip?</div>
              <button style={styles.tripPickerClose} onClick={() => setTripPickerData(null)}><FiX size={18} /></button>
            </div>
            <div style={styles.tripPickerBody}>
              {tripPickerData.matchingTrips.map(({ index, trip }) => {
                const start = new Date(trip.startDate);
                const end = new Date(trip.endDate);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const isThere = now >= start && now <= end;
                return (
                  <button
                    key={index}
                    style={styles.tripPickerOption}
                    onClick={async () => {
                      await saveExperienceToTrip(tripPickerData.experience, index);
                      setTripPickerData(null);
                    }}
                  >
                    <div style={styles.tripPickerOptionLeft}>
                      <div style={styles.tripPickerDest}>{trip.destination.split(',')[0]}</div>
                      <div style={styles.tripPickerDates}>
                        {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    {isThere && <span style={styles.tripPickerBadge}><FiMapPin size={11} /> Now</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#faf9f7', paddingBottom: '80px' },
  header: { background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)', padding: '24px 20px', color: '#fff' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px', display: 'inline-flex', alignItems: 'center' },
  title: { fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', opacity: 0.9, margin: 0 },
  tabs: { display: 'flex', background: '#fff', borderBottom: '1px solid #e8e5e0', position: 'sticky', top: 0, zIndex: 10 },
  tab: { flex: 1, padding: '16px', background: 'transparent', border: 'none', fontSize: '15px', fontWeight: '600', color: '#6b6b6b', cursor: 'pointer' },
  tabActive: { color: '#047857', borderBottom: '3px solid #047857' },
  content: { padding: '20px' },

  filterToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: '#fff', border: '1px solid #e8e5e0', borderRadius: '12px', fontSize: '15px', fontWeight: '600', color: '#374151', cursor: 'pointer', marginBottom: '12px' },
  filterBar: { marginBottom: '20px', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' },
  filterGroup: { marginBottom: '12px' },
  filterLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  filterChips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  chip: { padding: '8px 14px', background: '#f5f3f0', color: '#6b6b6b', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  chipActive: { background: '#047857', color: '#fff' },

  experiencesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  expCard: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.08)' },
  expIcon: { fontSize: '48px', marginBottom: '12px' },
  expName: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' },
  expMeta: { display: 'flex', marginBottom: '8px', fontSize: '14px', color: '#6b7280' },
  expDuration: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' },
  expPrice: { fontSize: '24px', fontWeight: '800', color: '#047857', marginBottom: '16px' },
  saversRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f0f9f4', borderRadius: '10px', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' },
  saversAvatars: { display: 'flex', flexShrink: 0 },
  saverAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0fdf4', marginLeft: '-8px' },
  saverAvatarPlaceholder: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', border: '2px solid #f0fdf4', marginLeft: '-8px' },
  saversText: { fontSize: '13px', fontWeight: '600', color: '#047857', lineHeight: 1.3, flex: 1 },
  saversChevron: { fontSize: '14px', color: '#047857', transition: 'transform 0.2s', flexShrink: 0 },
  saversExpanded: { background: '#f0f9f4', borderRadius: '0 0 10px 10px', padding: '8px 12px 12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  saverProfile: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' },
  saverProfileLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: 'pointer' },
  saverProfileImg: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  saverProfilePlaceholder: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 },
  saverProfileInfo: { flex: 1, minWidth: 0 },
  saverProfileName: { fontSize: '14px', fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  saverProfileDates: { fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '2px' },
  saverConnectBtn: { padding: '10px 16px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },
  saverConnectedBadge: { padding: '8px 12px', background: '#f0f9f4', color: '#047857', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  saverPendingBadge: { padding: '8px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: '700', flexShrink: 0 },

  expActions: { display: 'flex', gap: '8px' },
  saveBtn: { flex: 1, padding: '14px 24px', background: '#f0f9f4', color: '#047857', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  savedBtn: { flex: 1, padding: '14px 24px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },
  bookBtn: { flex: 1, padding: '14px 24px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },

  subTabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  subTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', fontWeight: '700', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' },
  subTabActive: { borderColor: '#047857', color: '#047857', background: '#f0f9f4' },
  subTabDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' },

  peopleList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  personRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#fff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' },
  personAvatar: { width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden' },
  personAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  personAvatarPlaceholder: { width: '100%', height: '100%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700' },
  personInfo: { flex: 1, minWidth: 0 },
  personName: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a' },
  personDates: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  personConnectBtn: { padding: '10px 16px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },
  personConnectedTag: { padding: '6px 12px', background: '#f0f9f4', color: '#047857', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  personPendingTag: { padding: '6px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: '700', flexShrink: 0 },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: '#fff', borderRadius: '20px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)' },
  modalBackdrop: { position: 'relative', width: '100%', height: '240px', flexShrink: 0 },
  modalBackdropImg: { width: '100%', height: '100%', objectFit: 'cover' },
  modalBackdropPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  modalBackdropGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' },
  modalCloseBtn: { position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', fontSize: '18px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, backdropFilter: 'blur(4px)' },
  modalBackdropInfo: { position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 2 },
  modalNameOverlay: { fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '4px' },
  modalStatusBadge: { fontSize: '12px', fontWeight: '700', color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', backdropFilter: 'blur(4px)' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  modalBio: { fontSize: '15px', color: '#374151', lineHeight: 1.6, margin: '0 0 16px 0' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  modalInterestChip: { padding: '6px 14px', background: '#f0f9f4', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#047857' },
  modalSocials: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: '#f5f3f0', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { marginBottom: '16px' },
  modalTripsTitle: { fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#faf9f7', borderRadius: '10px', marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0 },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontSize: '14px', fontWeight: '700', color: '#1f2937' },
  modalTripDates: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '700', color: '#047857', background: '#f0f9f4', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalConnectBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #047857, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(4,120,87,0.3)' },
  modalConnectedBadge: { width: '100%', padding: '14px', background: '#f0f9f4', color: '#047857', border: '2px solid #bbf7d0', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },
  modalPendingBadge: { width: '100%', padding: '14px', background: '#fffbeb', color: '#d97706', border: '2px solid #fde68a', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },

  fab: { position: 'fixed', bottom: '100px', right: '20px', width: '64px', height: '64px', borderRadius: '32px', background: 'linear-gradient(135deg, #047857, #059669)', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', zIndex: 999 },

  empty: { textAlign: 'center', padding: '60px 20px', fontSize: '18px', color: '#6b7280' },

  // Trip Picker Modal
  tripPickerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1100, padding: '20px' },
  tripPickerCard: { background: '#fff', borderRadius: '20px', maxWidth: '400px', width: '100%', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)', marginBottom: '20px' },
  tripPickerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 12px' },
  tripPickerTitle: { fontSize: '18px', fontWeight: '800', color: '#1a1a1a' },
  tripPickerClose: { width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' },
  tripPickerBody: { padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  tripPickerOption: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#faf9f7', border: '2px solid #e8e5e0', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' },
  tripPickerOptionLeft: { flex: 1 },
  tripPickerDest: { fontSize: '16px', fontWeight: '700', color: '#1f2937', marginBottom: '2px' },
  tripPickerDates: { fontSize: '13px', color: '#6b7280' },
  tripPickerBadge: { fontSize: '11px', fontWeight: '700', color: '#047857', background: '#f0f9f4', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 },
};

export default DestinationDetail;
