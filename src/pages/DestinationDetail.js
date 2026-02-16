import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import TabBar from '../components/TabBar';

function DestinationDetail() {
  const { destination } = useParams();
  const navigate = useNavigate();
  const destinationName = decodeURIComponent(destination);

  const [activeTab, setActiveTab] = useState('experiences');
  const [peopleSubTab, setPeopleSubTab] = useState('hereNow');
  const [destinationUsers, setDestinationUsers] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);

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

  useEffect(() => {
    loadData();
  }, [destinationName]);

  const loadData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      let fetchedUserData = null;
      if (userDoc.exists()) {
        fetchedUserData = userDoc.data();
        setCurrentUserData(fetchedUserData);
      }

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];

      const currentUserGender = fetchedUserData?.gender || '';
      const myVisibility = fetchedUserData?.profileVisibility || 'both';

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        if (docSnap.id !== currentUser.uid && userData.upcomingTrips) {
          const hasDestination = userData.upcomingTrips.some(
            trip => trip.destination === destinationName
          );
          if (hasDestination) {
            // Their visibility: do they want to be seen by my gender?
            const theirVisibility = userData.profileVisibility || 'both';
            if (theirVisibility !== 'both' && theirVisibility !== currentUserGender) {
              return;
            }
            // My visibility: do I only want to see a specific gender?
            if (myVisibility !== 'both' && userData.gender !== myVisibility) {
              return;
            }
            users.push({ id: docSnap.id, ...userData });
          }
        }
      });

      const requestsSnapshot = await getDocs(collection(db, 'connectionRequests'));
      const pending = [];
      requestsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.fromUserId === currentUser.uid && data.status === 'pending') {
          pending.push(data.toUserId);
        }
      });
      setSentRequests(pending);

      setDestinationUsers(users);
      loadExperiences();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExperiences = () => {
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
    const experiencesForDestination = allExperiences[cityName] || allExperiences[destinationName] || [];
    setExperiences(experiencesForDestination);
  };

  const handleAddExperience = async (experience) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUserData) return;

      const tripIndex = currentUserData.upcomingTrips?.findIndex(
        trip => trip.destination === destinationName
      );

      if (tripIndex === -1) {
        alert('Please add a trip to this destination first!');
        return;
      }

      const updatedTrips = [...currentUserData.upcomingTrips];
      if (!updatedTrips[tripIndex].experiences) {
        updatedTrips[tripIndex].experiences = [];
      }

      const alreadyAdded = updatedTrips[tripIndex].experiences.some(
        exp => exp.id === experience.id
      );
      if (alreadyAdded) {
        alert('Already saved!');
        return;
      }

      updatedTrips[tripIndex].experiences.push(experience);
      await updateDoc(doc(db, 'users', currentUser.uid), { upcomingTrips: updatedTrips });
      setCurrentUserData({ ...currentUserData, upcomingTrips: updatedTrips });
      alert('Saved!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save');
    }
  };

  const handleSendConnectionRequest = async (toUser) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUserData) return;

      const alreadyConnected = (currentUserData.connections || []).some(
        c => c.userId === toUser.id
      );
      if (alreadyConnected) {
        alert('You are already connected!');
        return;
      }

      const requestsSnapshot = await getDocs(collection(db, 'connectionRequests'));
      const existingRequest = requestsSnapshot.docs.find(docSnap => {
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

      setSentRequests(prev => [...prev, toUser.id]);

      await addDoc(collection(db, 'connectionRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: currentUserData.name,
        fromUserAge: currentUserData.age,
        fromUserGender: currentUserData.gender,
        fromUserBio: currentUserData.bio || '',
        fromUserPhotoURL: currentUserData.photoURL || '',
        fromUserInterests: currentUserData.interests || [],
        fromUserUpcomingTrips: currentUserData.upcomingTrips || [],
        fromUserWhatsapp: currentUserData.whatsapp || '',
        fromUserInstagram: currentUserData.instagram || '',
        toUserId: toUser.id,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      alert('Request sent!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed');
    }
  };

  // Filter and sort experiences
  const getFilteredExperiences = () => {
    let filtered = [...experiences];

    // Price filter
    if (expPriceRange === 'under50') {
      filtered = filtered.filter(e => e.price < 50);
    } else if (expPriceRange === '50to80') {
      filtered = filtered.filter(e => e.price >= 50 && e.price <= 80);
    } else if (expPriceRange === 'over80') {
      filtered = filtered.filter(e => e.price > 80);
    }

    // Sort
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
  };

  // Split all users into here now / going soon (unfiltered)
  const splitUsers = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = [];
    const soon = [];

    destinationUsers.forEach(user => {
      const trip = user.upcomingTrips.find(t => t.destination === destinationName);
      if (trip) {
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (today >= startDate && today <= endDate) {
          now.push(user);
        } else if (today < startDate) {
          soon.push(user);
        }
      }
    });

    return { allHereNow: now, allGoingSoon: soon };
  };

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

  const { allHereNow, allGoingSoon } = splitUsers();
  const hereNow = applyPeopleFilters(allHereNow, hereNowGender, hereNowAgeRange, hereNowInterests);
  const goingSoon = applyPeopleFilters(allGoingSoon, goingSoonGender, goingSoonAgeRange, goingSoonInterests);
  const filteredExperiences = getFilteredExperiences();

  // Get unique genders per group
  const hereNowGenderOptions = [...new Set(allHereNow.map(u => u.gender).filter(Boolean))];
  const goingSoonGenderOptions = [...new Set(allGoingSoon.map(u => u.gender).filter(Boolean))];

  // Interests list (matches onboarding)
  const availableInterests = [
    'Food', 'Adventure', 'Culture', 'Photography',
    'Art', 'History', 'Nature', 'Shopping',
    'Nightlife', 'Wellness'
  ];

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
        <TabBar />
      </div>
    );
  }

  const isExperienceSaved = (expId) => {
    return currentUserData?.upcomingTrips
      ?.find(trip => trip.destination === destinationName)
      ?.experiences?.some(e => e.id === expId) || false;
  };

  // Find users who saved a specific experience and overlap with current user's dates
  const getOverlappingSavers = (expId) => {
    const myTrip = currentUserData?.upcomingTrips?.find(
      trip => trip.destination === destinationName
    );

    return destinationUsers.filter(user => {
      const userTrip = user.upcomingTrips.find(t => t.destination === destinationName);
      if (!userTrip || !userTrip.experiences) return false;

      const hasSaved = userTrip.experiences.some(e => e.id === expId);
      if (!hasSaved) return false;

      // If current user has a trip, only show users with overlapping dates
      if (myTrip) {
        const myStart = new Date(myTrip.startDate);
        const myEnd = new Date(myTrip.endDate);
        const theirStart = new Date(userTrip.startDate);
        const theirEnd = new Date(userTrip.endDate);
        return theirStart <= myEnd && theirEnd >= myStart;
      }

      // No trip booked — show all savers
      return true;
    });
  };

  const renderPersonCard = (user) => {
    const trip = user.upcomingTrips.find(t => t.destination === destinationName);
    const hasPhoto = !!user.photoURL;
    return (
      <div key={user.id} style={styles.personCard}>
        {/* Full backdrop photo */}
        <div style={styles.personBackdrop}>
          {hasPhoto ? (
            <img src={user.photoURL} alt={user.name} style={styles.personBackdropImg} />
          ) : (
            <div style={styles.personBackdropPlaceholder}>
              {user.name?.charAt(0)}
            </div>
          )}
          <div style={styles.personGradientOverlay} />
        </div>

        {/* Overlaid details */}
        <div style={styles.personOverlay}>
          <h4 style={styles.personName}>{user.name}, {user.age}</h4>
          {user.bio && <p style={styles.personBio}>"{user.bio.substring(0, 60)}..."</p>}
          <div style={styles.personDates}>
            {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>

          {(currentUserData?.connections || []).some(c => c.userId === user.id) ? (
            <div style={styles.connectedLabel}>Connected</div>
          ) : sentRequests.includes(user.id) ? (
            <div style={styles.pendingLabel}>Request Pending</div>
          ) : (
            <button style={styles.connectBtn} onClick={() => handleSendConnectionRequest(user)}>
              Connect
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/destinations')}>
          ← Back
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
            {/* Filters Toggle */}
            <button
              style={styles.filterToggle}
              onClick={() => setShowExpFilters(!showExpFilters)}
            >
              <span>Filters {expPriceRange !== 'all' || expSort !== 'rating' ? '•' : ''}</span>
              <span style={{ transform: showExpFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
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
                      <span>⭐ {exp.rating}</span>
                      <span style={{marginLeft: '8px'}}>({exp.reviews})</span>
                    </div>
                    <div style={styles.expDuration}>🕐 {exp.duration}</div>
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
                          <span style={{ ...styles.saversChevron, transform: expandedSaversExp === exp.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                        </div>

                        {expandedSaversExp === exp.id && (
                          <div style={styles.saversExpanded}>
                            {savers.map(user => {
                              const userTrip = user.upcomingTrips.find(t => t.destination === destinationName);
                              const isConnected = (currentUserData?.connections || []).some(c => c.userId === user.id);
                              const isPending = sentRequests.includes(user.id);
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
                        {isExperienceSaved(exp.id) ? '✓ Saved' : '+ Save'}
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
            {/* Sub-tabs: Here Now / Going Soon */}
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

            {/* HERE NOW PAGE */}
            {peopleSubTab === 'hereNow' && (
              <div>
                {allHereNow.length > 0 ? (
                  <>
                    <button
                      style={styles.filterToggle}
                      onClick={() => setShowHereNowFilters(!showHereNowFilters)}
                    >
                      <span>Filters {hereNowGender !== 'all' || hereNowAgeRange !== 'all' || hereNowInterests.length > 0 ? '•' : ''}</span>
                      <span style={{ transform: showHereNowFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
                    </button>
                    {showHereNowFilters && (
                      <div style={styles.filterBar}>
                        {(currentUserData?.profileVisibility || 'both') === 'both' && (
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
                      <div style={styles.peopleGrid}>
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

            {/* GOING SOON PAGE */}
            {peopleSubTab === 'goingSoon' && (
              <div>
                {allGoingSoon.length > 0 ? (
                  <>
                    <button
                      style={styles.filterToggle}
                      onClick={() => setShowGoingSoonFilters(!showGoingSoonFilters)}
                    >
                      <span>Filters {goingSoonGender !== 'all' || goingSoonAgeRange !== 'all' || goingSoonInterests.length > 0 ? '•' : ''}</span>
                      <span style={{ transform: showGoingSoonFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
                    </button>
                    {showGoingSoonFilters && (
                      <div style={styles.filterBar}>
                        {(currentUserData?.profileVisibility || 'both') === 'both' && (
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
                      <div style={styles.peopleGrid}>
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
        const isConnected = (currentUserData?.connections || []).some(c => c.userId === previewUser.id);
        const isPending = sentRequests.includes(previewUser.id);
        const allTrips = previewUser.upcomingTrips || [];
        return (
          <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button style={styles.modalClose} onClick={() => setPreviewUser(null)}>×</button>

              {/* Photo */}
              <div style={styles.modalPhotoWrap}>
                {previewUser.photoURL ? (
                  <img src={previewUser.photoURL} alt={previewUser.name} style={styles.modalPhoto} />
                ) : (
                  <div style={styles.modalPhotoPlaceholder}>
                    {previewUser.name?.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name & Age */}
              <h2 style={styles.modalName}>{previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}</h2>

              {/* Interests */}
              {previewUser.interests && previewUser.interests.length > 0 && (
                <div style={styles.modalInterests}>
                  {previewUser.interests.map(interest => (
                    <span key={interest} style={styles.modalInterestChip}>{interest}</span>
                  ))}
                </div>
              )}

              {/* Socials — only for connected users */}
              {isConnected && (previewUser.whatsapp || previewUser.instagram) && (
                <div style={styles.modalSocials}>
                  {previewUser.whatsapp && (
                    <a href={`https://wa.me/${previewUser.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                      💬 WhatsApp
                    </a>
                  )}
                  {previewUser.instagram && (
                    <a href={`https://instagram.com/${previewUser.instagram}`} target="_blank" rel="noopener noreferrer" style={styles.modalSocialBtn}>
                      📷 @{previewUser.instagram}
                    </a>
                  )}
                </div>
              )}

              {/* All Trips */}
              {allTrips.length > 0 && (
                <div style={styles.modalTripsSection}>
                  <div style={styles.modalTripsTitle}>Trips</div>
                  {allTrips.map((trip, i) => {
                    const start = new Date(trip.startDate);
                    const end = new Date(trip.endDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isThere = today >= start && today <= end;
                    const isUpcoming = today < start;
                    return (
                      <div key={i} style={styles.modalTripItem}>
                        <span style={styles.modalTripIcon}>{isThere ? '📍' : isUpcoming ? '✈️' : '✓'}</span>
                        <div style={styles.modalTripInfo}>
                          <div style={styles.modalTripDest}>{trip.destination.split(',')[0]}</div>
                          <div style={styles.modalTripDates}>
                            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        {isThere && <span style={styles.modalTripBadge}>There now</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Connect action */}
              <div style={styles.modalAction}>
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
        <span style={styles.fabIcon}>✈️</span>
      </button>

      <TabBar />
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px' },
  header: { background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '24px 20px', color: '#fff' },
  backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' },
  title: { fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', opacity: 0.9, margin: 0 },
  tabs: { display: 'flex', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  tab: { flex: 1, padding: '16px', background: 'transparent', border: 'none', fontSize: '15px', fontWeight: '600', color: '#6b7280', cursor: 'pointer' },
  tabActive: { color: '#059669', borderBottom: '3px solid #059669' },
  content: { padding: '20px' },

  // Filters
  filterToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', fontWeight: '600', color: '#374151', cursor: 'pointer', marginBottom: '12px' },
  filterBar: { marginBottom: '20px', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  filterGroup: { marginBottom: '12px' },
  filterLabel: { fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  filterChips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  chip: { padding: '8px 14px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  chipActive: { background: '#059669', color: '#fff' },

  // Experiences
  experiencesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  expCard: { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  expIcon: { fontSize: '48px', marginBottom: '12px' },
  expName: { fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' },
  expMeta: { display: 'flex', marginBottom: '8px', fontSize: '14px', color: '#6b7280' },
  expDuration: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' },
  expPrice: { fontSize: '24px', fontWeight: '800', color: '#059669', marginBottom: '16px' },
  // Savers row
  saversRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' },
  saversAvatars: { display: 'flex', flexShrink: 0 },
  saverAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0fdf4', marginLeft: '-8px' },
  saverAvatarPlaceholder: { width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', border: '2px solid #f0fdf4', marginLeft: '-8px' },
  saversText: { fontSize: '13px', fontWeight: '600', color: '#059669', lineHeight: 1.3, flex: 1 },
  saversChevron: { fontSize: '14px', color: '#059669', transition: 'transform 0.2s', flexShrink: 0 },
  saversExpanded: { background: '#f0fdf4', borderRadius: '0 0 10px 10px', padding: '8px 12px 12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  saverProfile: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', background: '#fff', borderRadius: '12px' },
  saverProfileLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: 'pointer' },
  saverProfileImg: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  saverProfilePlaceholder: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 },
  saverProfileInfo: { flex: 1, minWidth: 0 },
  saverProfileName: { fontSize: '14px', fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  saverProfileDates: { fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '2px' },
  saverConnectBtn: { padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },
  saverConnectedBadge: { padding: '8px 12px', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  saverPendingBadge: { padding: '8px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: '700', flexShrink: 0 },

  expActions: { display: 'flex', gap: '8px' },
  saveBtn: { flex: 1, padding: '12px', background: '#f0fdf4', color: '#059669', border: '2px solid #059669', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  savedBtn: { flex: 1, padding: '12px', background: '#059669', color: '#fff', border: '2px solid #059669', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  bookBtn: { flex: 1, padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },

  // People sub-tabs
  subTabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  subTab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: '#fff', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', fontWeight: '700', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' },
  subTabActive: { borderColor: '#059669', color: '#059669', background: '#f0fdf4' },
  subTabDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' },

  // People sections
  peopleSection: { marginBottom: '28px' },

  // People cards — photo backdrop style
  peopleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  personCard: { position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', height: '380px' },
  personBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  personBackdropImg: { width: '100%', height: '100%', objectFit: 'cover' },
  personBackdropPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '96px', fontWeight: '800', color: 'rgba(255,255,255,0.4)' },
  personGradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' },
  personOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', zIndex: 2 },
  personName: { fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0', textShadow: '0 1px 3px rgba(0,0,0,0.3)' },
  personGender: { fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 6px 0' },
  personBio: { fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', margin: '0 0 8px 0', lineHeight: 1.4 },
  personDates: { fontSize: '13px', color: '#6ee7b7', fontWeight: '600', marginBottom: '12px' },
  connectBtn: { width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  connectedLabel: { width: '100%', padding: '12px', background: 'rgba(255,255,255,0.15)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.4)', borderRadius: '12px', fontSize: '15px', fontWeight: '700', textAlign: 'center', backdropFilter: 'blur(4px)' },
  pendingLabel: { width: '100%', padding: '12px', background: 'rgba(255,255,255,0.15)', color: '#fcd34d', border: '1px solid rgba(252,211,77,0.4)', borderRadius: '12px', fontSize: '15px', fontWeight: '700', textAlign: 'center', backdropFilter: 'blur(4px)' },

  // Profile Preview Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: '#fff', borderRadius: '24px', padding: '32px 24px', maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', textAlign: 'center' },
  modalClose: { position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: '20px', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalPhotoWrap: { marginBottom: '16px' },
  modalPhoto: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0fdf4' },
  modalPhotoPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', margin: '0 auto' },
  modalName: { fontSize: '22px', fontWeight: '800', color: '#1f2937', margin: '0 0 4px 0' },
  modalGender: { fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' },
  modalBio: { fontSize: '15px', color: '#374151', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 16px 0', padding: '0 8px' },
  modalDates: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f0fdf4', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#059669', marginBottom: '16px' },
  modalDatesIcon: { fontSize: '16px' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { padding: '6px 14px', background: '#f3f4f6', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: '#374151' },
  modalSocials: { display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' },
  modalSocialBtn: { padding: '8px 16px', background: '#f3f4f6', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  modalTripsSection: { textAlign: 'left', marginBottom: '16px' },
  modalTripsTitle: { fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'left' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '10px', marginBottom: '6px' },
  modalTripIcon: { fontSize: '16px', flexShrink: 0 },
  modalTripInfo: { flex: 1, minWidth: 0 },
  modalTripDest: { fontSize: '14px', fontWeight: '700', color: '#1f2937' },
  modalTripDates: { fontSize: '12px', color: '#6b7280', marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '700', color: '#059669', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalAction: { marginTop: '4px' },
  modalConnectBtn: { width: '100%', padding: '14px', background: '#059669', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  modalConnectedBadge: { width: '100%', padding: '14px', background: '#f0fdf4', color: '#059669', border: '2px solid #bbf7d0', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },
  modalPendingBadge: { width: '100%', padding: '14px', background: '#fffbeb', color: '#d97706', border: '2px solid #fde68a', borderRadius: '14px', fontSize: '16px', fontWeight: '700', textAlign: 'center' },

  fab: { position: 'fixed', bottom: '100px', right: '20px', width: '64px', height: '64px', borderRadius: '32px', background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', zIndex: 999 },
  fabIcon: { fontSize: '28px' },

  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontSize: '18px', color: '#6b7280' },
  empty: { textAlign: 'center', padding: '60px 20px', fontSize: '18px', color: '#6b7280' },
};

export default DestinationDetail;
