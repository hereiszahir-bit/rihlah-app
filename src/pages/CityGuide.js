import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiBookmark, FiMapPin, FiStar, FiUsers, FiX, FiNavigation } from 'react-icons/fi';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { colors, fonts, radius, components, type } from '../design';
import { fetchCityGuide } from '../data/firestoreCities';

function CityGuide() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentUserData, allUsers, sentRequestUserIds, receivedRequestUserIds, refreshCurrentUser, refreshConnections } = useUser();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [togglingExp, setTogglingExp] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
  const [localSentRequests, setLocalSentRequests] = useState([]);
  const [interestedPeople, setInterestedPeople] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const cameFromTrip = location.state?.fromTrip;

  const allSentRequests = useMemo(
    () => [...new Set([...(sentRequestUserIds || []), ...(receivedRequestUserIds || []), ...localSentRequests])],
    [sentRequestUserIds, receivedRequestUserIds, localSentRequests]
  );

  useEffect(() => {
    fetchCityGuide(cityId).then(g => {
      if (g) {
        setGuide(g);
      } else {
        // Build a community page from the slug — no editorial content, full social layer
        const cityName = cityId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setGuide({
          id: cityId,
          city: cityName,
          country: '',
          intro: '',
          heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
          prayerNote: '',
          neighborhoods: [],
          dining: [],
          mosques: [],
          coffee: [],
          experiences: [],
          insiderTips: [],
          bookableExperiences: [],
          _isCommunity: true,
        });
      }
      setLoading(false);
    });
  }, [cityId]);

  useEffect(() => {
    if (currentUserData?.savedPlaces) {
      setSavedPlaces(currentUserData.savedPlaces);
    }
  }, [currentUserData]);

  // --- Experience interest mechanic (hooks must be before early returns) ---

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isFutureTrip = (t) => {
    if (!t.endDate) return false;
    const [y, m, d] = t.endDate.split('-').map(Number);
    return new Date(y, m - 1, d) >= today;
  };

  const tripMatchesCity = (t) => {
    if (!guide) return false;
    if (t.destinationId) return t.destinationId === guide.id;
    const cityName = guide.city?.toLowerCase();
    const tripCity = t.destination?.split(',')[0]?.toLowerCase()?.trim();
    return tripCity === cityName;
  };

  // Find current user's trip to this city (if any)
  const myTrip = useMemo(() => {
    if (!currentUserData?.upcomingTrips || !guide) return null;
    return currentUserData.upcomingTrips.find(t => tripMatchesCity(t) && isFutureTrip(t)) || null;
  }, [currentUserData, guide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Travelers with upcoming/active trips to this city
  const cityTravelers = useMemo(() => {
    if (!guide || !allUsers) return [];
    return allUsers
      .filter(user => {
        if (user.id === currentUser?.uid) return false;
        if (!user.onboardingComplete) return false;
        return (user.upcomingTrips || []).some(t => tripMatchesCity(t) && isFutureTrip(t));
      })
      .map(user => {
        const trip = (user.upcomingTrips || []).find(t => tripMatchesCity(t) && isFutureTrip(t));
        return { ...user, cityTrip: trip };
      });
  }, [guide, allUsers, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Count other travelers interested in an experience
  const interestedCount = useMemo(() => {
    if (!guide || !allUsers) return {};
    const counts = {};

    allUsers.forEach(user => {
      if (user.id === currentUser?.uid) return;
      (user.upcomingTrips || []).forEach(trip => {
        if (!tripMatchesCity(trip) || !isFutureTrip(trip)) return;
        (trip.interestedExperiences || []).forEach(expName => {
          counts[expName] = (counts[expName] || 0) + 1;
        });
      });
    });
    return counts;
  }, [guide, allUsers, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.textTertiary }}>Loading...</div>
      </div>
    );
  }

  if (!guide) return null;

  const isSaved = (placeName) => savedPlaces.some(p => p.name === placeName && p.city === guide.city);

  const isInterested = (expName) => {
    return myTrip?.interestedExperiences?.includes(expName) || false;
  };

  const toggleSave = async (place, type) => {
    if (!currentUser) return;

    const placeData = {
      name: place.name,
      city: guide.city,
      cityId: guide.id,
      type,
      area: place.area || '',
      note: place.note || '',
      savedAt: new Date().toISOString(),
    };

    const userRef = doc(db, 'users', currentUser.uid);

    if (isSaved(place.name)) {
      const existing = savedPlaces.find(p => p.name === place.name && p.city === guide.city);
      if (existing) {
        await updateDoc(userRef, { savedPlaces: arrayRemove(existing) });
        setSavedPlaces(prev => prev.filter(p => !(p.name === place.name && p.city === guide.city)));
      }
    } else {
      await updateDoc(userRef, { savedPlaces: arrayUnion(placeData) });
      setSavedPlaces(prev => [...prev, placeData]);
    }
  };

  const toggleInterest = async (expName) => {
    if (!currentUser || !myTrip) return;
    setTogglingExp(expName);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      const data = snap.data();
      const trips = data.upcomingTrips || [];
      const cityName = guide.city?.toLowerCase();

      const updatedTrips = trips.map(t => {
        const matchById = t.destinationId && t.destinationId === guide.id;
        const matchByName = t.destination?.split(',')[0]?.toLowerCase()?.trim() === cityName;
        if (!matchById && !matchByName) return t;
        const current = t.interestedExperiences || [];
        const next = current.includes(expName)
          ? current.filter(n => n !== expName)
          : [...current, expName];
        return { ...t, interestedExperiences: next };
      });

      await updateDoc(userRef, { upcomingTrips: updatedTrips });
      await refreshCurrentUser();
    } catch (err) {
      console.error('Error toggling interest:', err);
    } finally {
      setTogglingExp(null);
    }
  };

  const handleSendRequest = async (toUser) => {
    try {
      if (!currentUser || !currentUserData) return;
      if ((currentUserData.connections || []).some(c => c.userId === toUser.id)) return;
      if (allSentRequests.includes(toUser.id)) return;

      setLocalSentRequests(prev => [...prev, toUser.id]);
      await addDoc(collection(db, 'connectionRequests'), {
        fromUserId: currentUser.uid,
        fromUserName: currentUserData.name,
        fromUserAge: currentUserData.age,
        fromUserGender: currentUserData.gender,
        fromUserBio: currentUserData.bio || '',
        fromUserPhotoURL: currentUserData.photoURL || '',
        fromUserInterests: currentUserData.interests || [],
        toUserId: toUser.id,
        toUserName: toUser.name || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      if (refreshConnections) refreshConnections();
    } catch (err) {
      console.error('Error sending request:', err);
      setLocalSentRequests(prev => prev.filter(id => id !== toUser.id));
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDateRange = (start, end) => {
    const fmt = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', fmt)} — ${end.toLocaleDateString('en-US', fmt)}`;
  };

  const hasEditorial = !guide._isCommunity;
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'travelers', label: `Travelers${cityTravelers.length ? ` (${cityTravelers.length})` : ''}` },
    ...(guide.neighborhoods?.length ? [{ id: 'neighborhoods', label: 'Neighborhoods' }] : []),
    ...(guide.dining?.length ? [{ id: 'dining', label: 'Dining' }] : []),
    ...(guide.mosques?.length ? [{ id: 'mosques', label: 'Mosques' }] : []),
    ...(guide.coffee?.length ? [{ id: 'coffee', label: 'Coffee' }] : []),
    ...((guide.experiences?.length || guide.bookableExperiences?.length) ? [{ id: 'experiences', label: 'Experiences' }] : []),
  ];

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(transparent 20%, rgba(10,10,10,0.98)), url(${guide.heroImage})`,
        }}
      >
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} color={colors.text} />
        </button>
        {cameFromTrip && (
          <button style={styles.backToTripBtn} onClick={() => navigate(-1)}>
            Back to your trip
          </button>
        )}

        <div style={styles.heroBottom}>
          <div style={styles.heroCountry}>{guide.country}</div>
          <h1 style={styles.heroCity}>{guide.city}</h1>
          {guide.intro && <p style={styles.heroIntro}>{guide.intro}</p>}
          {myTrip ? (
            <div style={styles.heroTripBadge}>
              You're going {myTrip.startDate} — {myTrip.endDate}
            </div>
          ) : (
            <button
              style={styles.heroTripBtn}
              onClick={() => navigate('/add-trip', { state: { preselectedDestinationId: guide.id } })}
            >
              Plan a trip here
            </button>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div style={styles.tabsWrapper}>
        <div style={styles.tabs}>
          {sections.map(s => (
            <button
              key={s.id}
              style={{
                ...styles.tab,
                ...(activeSection === s.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Overview */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Prayer note — only for curated guides */}
            {guide.prayerNote && (
              <div style={styles.prayerCard}>
                <div style={styles.prayerIcon}><FiMapPin size={14} /></div>
                <div style={styles.prayerText}>{guide.prayerNote}</div>
              </div>
            )}

            {/* Quick sections — only when editorial content exists */}
            {hasEditorial && (
              <div style={styles.overviewGrid}>
                {[
                  { label: 'Neighborhoods', count: guide.neighborhoods?.length || 0, section: 'neighborhoods' },
                  { label: 'Dining', count: guide.dining?.length || 0, section: 'dining' },
                  { label: 'Mosques', count: guide.mosques?.length || 0, section: 'mosques' },
                  { label: 'Coffee', count: guide.coffee?.length || 0, section: 'coffee' },
                  { label: 'Experiences', count: guide.experiences?.length || 0, section: 'experiences' },
                ].filter(item => item.count > 0).map(item => (
                  <button
                    key={item.section}
                    style={styles.overviewCard}
                    onClick={() => setActiveSection(item.section)}
                  >
                    <div style={styles.overviewCount}>{item.count}</div>
                    <div style={styles.overviewLabel}>{item.label}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Community welcome — for non-curated cities */}
            {!hasEditorial && (
              <div style={styles.communityWelcome}>
                <div style={styles.communityTitle}>Community page</div>
                <div style={styles.communityText}>
                  We haven't written a guide for {guide.city} yet — but the community is already here. See who else is going, connect with travelers, and plan together.
                </div>
              </div>
            )}

            {/* Travelers preview */}
            {cityTravelers.length > 0 && (
              <div style={styles.section}>
                <div style={styles.travelersSectionHeader}>
                  <h3 style={styles.sectionTitle}>Travelers going</h3>
                  <button
                    style={styles.travelersViewAll}
                    onClick={() => setActiveSection('travelers')}
                  >
                    View all ({cityTravelers.length})
                  </button>
                </div>
                <div style={styles.travelersPreviewRow}>
                  {cityTravelers.slice(0, 4).map(t => (
                    <div key={t.id} style={styles.travelerBubble}>
                      <div
                        style={{
                          ...styles.travelerAvatar,
                          backgroundImage: `url(${t.photoURL || ''})`,
                        }}
                      />
                      <div style={styles.travelerBubbleName}>{t.name?.split(' ')[0]}</div>
                    </div>
                  ))}
                  {cityTravelers.length > 4 && (
                    <div style={styles.travelerBubble}>
                      <div style={styles.travelerAvatarMore}>
                        +{cityTravelers.length - 4}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insider tips */}
            {guide.insiderTips && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Insider tips</h3>
                {guide.insiderTips.map((tip, i) => (
                  <div key={i} style={styles.tipItem}>
                    <div style={styles.tipNumber}>{i + 1}</div>
                    <div style={styles.tipText}>{tip}</div>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        )}

        {/* Travelers */}
        {activeSection === 'travelers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {cityTravelers.length === 0 ? (
              <div style={styles.travelersEmpty}>
                <div style={styles.travelersEmptyText}>No travelers going to {guide.city} yet</div>
                {!myTrip && (
                  <button
                    style={styles.heroTripBtn}
                    onClick={() => navigate('/add-trip', { state: { preselectedDestinationId: guide.id } })}
                  >
                    Be the first — plan a trip
                  </button>
                )}
              </div>
            ) : (
              cityTravelers.map(t => {
                const sharedExperiences = (t.cityTrip?.interestedExperiences || []);
                const isConn = (currentUserData?.connections || []).some(c => c.userId === t.id);
                const isPending = allSentRequests.includes(t.id);
                return (
                  <div key={t.id} style={styles.travelerCard} onClick={() => { setPhotoIndex(0); setPreviewUser(t); }}>
                    <div style={styles.travelerCardTop}>
                      <div
                        style={{
                          ...styles.travelerCardAvatar,
                          backgroundImage: `url(${t.photoURL || ''})`,
                        }}
                      />
                      <div style={styles.travelerCardInfo}>
                        <div style={styles.travelerCardName}>{t.name}{t.age ? `, ${t.age}` : ''}</div>
                        <div style={styles.travelerCardCity}>{t.city}</div>
                        <div style={styles.travelerCardDates}>
                          {t.cityTrip?.startDate} — {t.cityTrip?.endDate}
                        </div>
                      </div>
                      {isConn ? (
                        <div style={styles.connBadge}>Connected</div>
                      ) : isPending ? (
                        <div style={styles.pendingBadge}>Pending</div>
                      ) : (
                        <button style={styles.connectBtnSmall} onClick={(e) => { e.stopPropagation(); handleSendRequest(t); }}>
                          Connect
                        </button>
                      )}
                    </div>
                    {t.bio && <div style={styles.travelerCardBio}>{t.bio}</div>}
                    {sharedExperiences.length > 0 && (
                      <div style={styles.travelerExperiences}>
                        <div style={styles.travelerExpLabel}>Interested in</div>
                        <div style={styles.travelerExpList}>
                          {sharedExperiences.map((exp, j) => (
                            <span key={j} style={styles.travelerExpPill}>{exp}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(t.interests || []).length > 0 && (
                      <div style={styles.travelerInterests}>
                        {t.interests.slice(0, 4).map((int, j) => (
                          <span key={j} style={styles.travelerInterestPill}>{int}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Neighborhoods */}
        {activeSection === 'neighborhoods' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.neighborhoods || []).map((n, i) => (
              <div key={i} style={styles.neighborhoodFullCard}>
                <div
                  style={{
                    ...styles.neighborhoodFullImage,
                    backgroundImage: `linear-gradient(transparent 50%, rgba(10,10,10,0.9)), url(${n.image})`,
                  }}
                >
                  <h3 style={styles.neighborhoodFullName}>{n.name}</h3>
                  <div style={styles.neighborhoodFullVibe}>{n.vibe}</div>
                </div>
                <div style={styles.neighborhoodFullDesc}>{n.description}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dining */}
        {activeSection === 'dining' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.dining || []).map((d, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{d.name}</div>
                    <div style={styles.placeMeta}>{d.type} — {d.area}</div>
                  </div>
                  <div style={styles.placeActions}>
                    {d.halal && <span style={styles.halalBadge}>Halal</span>}
                    <button
                      style={{
                        ...styles.saveBtn,
                        color: isSaved(d.name) ? colors.terracotta : colors.textMuted,
                      }}
                      onClick={() => toggleSave(d, 'dining')}
                    >
                      <FiBookmark size={18} fill={isSaved(d.name) ? colors.terracotta : 'none'} />
                    </button>
                  </div>
                </div>
                <div style={styles.placeNote}>{d.note}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Mosques */}
        {activeSection === 'mosques' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.mosques || []).map((m, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{m.name}</div>
                    <div style={styles.placeMeta}>{m.area}</div>
                  </div>
                  <button
                    style={{
                      ...styles.saveBtn,
                      color: isSaved(m.name) ? colors.terracotta : colors.textMuted,
                    }}
                    onClick={() => toggleSave(m, 'mosque')}
                  >
                    <FiBookmark size={18} fill={isSaved(m.name) ? colors.terracotta : 'none'} />
                  </button>
                </div>
                <div style={styles.placeNote}>{m.note}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Coffee */}
        {activeSection === 'coffee' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.coffee || []).map((c, i) => (
              <div key={i} style={styles.placeCard}>
                <div style={styles.placeHeader}>
                  <div style={styles.placeInfo}>
                    <div style={styles.placeName}>{c.name}</div>
                    <div style={styles.placeMeta}>{c.area}</div>
                  </div>
                  <button
                    style={{
                      ...styles.saveBtn,
                      color: isSaved(c.name) ? colors.terracotta : colors.textMuted,
                    }}
                    onClick={() => toggleSave(c, 'coffee')}
                  >
                    <FiBookmark size={18} fill={isSaved(c.name) ? colors.terracotta : 'none'} />
                  </button>
                </div>
                <div style={styles.placeNote}>{c.note}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Experiences */}
        {activeSection === 'experiences' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(guide.experiences || []).map((xp, i) => {
              const count = interestedCount[xp.name] || 0;
              const interested = isInterested(xp.name);
              return (
                <div key={i} style={styles.placeCard}>
                  <div style={styles.placeHeader}>
                    <div style={styles.placeInfo}>
                      <div style={styles.placeName}>{xp.name}</div>
                      <div style={styles.placeMeta}>{xp.type}</div>
                    </div>
                    <button
                      style={{
                        ...styles.saveBtn,
                        color: isSaved(xp.name) ? colors.terracotta : colors.textMuted,
                      }}
                      onClick={() => toggleSave(xp, 'experience')}
                    >
                      <FiBookmark size={18} fill={isSaved(xp.name) ? colors.terracotta : 'none'} />
                    </button>
                  </div>
                  <div style={styles.placeNote}>{xp.note}</div>

                  {/* Interest + social signal */}
                  <div style={styles.interestRow}>
                    {myTrip ? (
                      <button
                        style={{
                          ...styles.interestBtn,
                          ...(interested ? styles.interestBtnActive : {}),
                        }}
                        onClick={() => toggleInterest(xp.name)}
                        disabled={togglingExp === xp.name}
                      >
                        {interested ? 'Interested' : "I'm interested"}
                      </button>
                    ) : (
                      <div style={styles.interestHint}>Add a trip to this city to join</div>
                    )}
                    {count > 0 && (
                      <button
                        style={styles.socialCount}
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          const people = cityTravelers.filter(u =>
                            (u.cityTrip?.interestedExperiences || []).includes(xp.name)
                          );
                          setInterestedPeople({ expName: xp.name, people });
                        }}
                      >
                        <FiUsers size={12} />
                        <span>{count} {count === 1 ? 'other' : 'others'} interested</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bookable experiences (affiliate) */}
            {guide.bookableExperiences?.length > 0 && (
              <div style={{ marginTop: guide.experiences?.length ? '24px' : '0' }}>
                {guide.experiences?.length > 0 && (
                  <h3 style={{ ...styles.sectionTitle, marginBottom: '12px' }}>Book experiences</h3>
                )}
                {guide.bookableExperiences.map((exp, i) => {
                  const count = interestedCount[exp.name] || 0;
                  const interested = isInterested(exp.name);
                  return (
                    <div key={`bookable-${i}`} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <a
                        href={exp.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.expLink}
                      >
                        <div style={styles.expInfo}>
                          <div style={styles.expName}>{exp.name}</div>
                          <div style={styles.expMeta}>
                            {exp.duration} — {exp.rating} <FiStar size={10} style={{ verticalAlign: '-1px' }} /> ({exp.reviews})
                          </div>
                        </div>
                        <div style={styles.expPrice}>From ${exp.price}</div>
                      </a>
                      <div style={styles.interestRow}>
                        {myTrip ? (
                          <button
                            style={{
                              ...styles.interestBtn,
                              ...(interested ? styles.interestBtnActive : {}),
                            }}
                            onClick={() => toggleInterest(exp.name)}
                            disabled={togglingExp === exp.name}
                          >
                            {interested ? 'Interested' : "I'm interested"}
                          </button>
                        ) : (
                          <div style={styles.interestHint}>Add a trip to this city to join</div>
                        )}
                        {count > 0 && (
                          <button
                            style={styles.socialCountBtn}
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              const people = cityTravelers.filter(u =>
                                (u.cityTrip?.interestedExperiences || []).includes(exp.name)
                              );
                              setInterestedPeople({ expName: exp.name, people });
                            }}
                          >
                            <FiUsers size={12} />
                            <span>{count} {count === 1 ? 'other' : 'others'} interested</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Profile preview modal */}
      <AnimatePresence>
        {previewUser && (() => {
          const isConn = (currentUserData?.connections || []).some(c => c.userId === previewUser.id);
          const isPending = allSentRequests.includes(previewUser.id);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const allTrips = (previewUser.upcomingTrips || []).map(trip => {
            const start = parseDate(trip.startDate);
            const end = parseDate(trip.endDate);
            const isThere = today >= start && today <= end;
            return { ...trip, start, end, isThere };
          }).filter(t => t.end >= today);

          return (
            <div style={styles.modalOverlay} onClick={() => setPreviewUser(null)}>
              <motion.div
                style={styles.modalCard}
                onClick={ev => ev.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <button style={styles.modalClose} onClick={() => setPreviewUser(null)}>
                  <FiX size={18} />
                </button>

                <div style={styles.modalContent}>
                  {(() => {
                    const photos = previewUser.photos || (previewUser.photoURL ? [previewUser.photoURL] : []);
                    if (photos.length > 1) {
                      return (
                        <div style={styles.carouselWrap}>
                          <div style={styles.carouselImageWrap}>
                            <img src={photos[photoIndex]} alt={`${previewUser.name} ${photoIndex + 1}`} style={styles.carouselImage} />
                            <div style={styles.carouselTapLeft} onClick={() => setPhotoIndex(i => i > 0 ? i - 1 : photos.length - 1)} />
                            <div style={styles.carouselTapRight} onClick={() => setPhotoIndex(i => i < photos.length - 1 ? i + 1 : 0)} />
                          </div>
                          <div style={styles.carouselDots}>
                            {photos.map((_, i) => (
                              <div key={i} style={{ ...styles.carouselDot, ...(i === photoIndex ? styles.carouselDotActive : {}) }} onClick={() => setPhotoIndex(i)} />
                            ))}
                          </div>
                        </div>
                      );
                    } else if (photos.length === 1) {
                      return (
                        <div style={styles.carouselWrap}>
                          <div style={styles.carouselImageWrap}>
                            <img src={photos[0]} alt={previewUser.name} style={styles.carouselImage} />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div style={styles.modalAvatarWrap}>
                          <div style={styles.modalAvatarPlaceholder}>{previewUser.name?.charAt(0).toUpperCase()}</div>
                        </div>
                      );
                    }
                  })()}

                  <div style={styles.modalTextContent}>
                    <div style={styles.modalName}>
                      {previewUser.name}{previewUser.age ? `, ${previewUser.age}` : ''}
                    </div>
                    {previewUser.city && (
                      <div style={styles.modalCity}>{previewUser.city}</div>
                    )}

                    {previewUser.bio && <p style={styles.modalBio}>{previewUser.bio}</p>}

                    {previewUser.interests && previewUser.interests.length > 0 && (
                      <div style={styles.modalInterests}>
                        {previewUser.interests.map((interest, i) => (
                          <span key={i} style={styles.modalInterestChip}>{interest}</span>
                        ))}
                      </div>
                    )}

                    {allTrips.length > 0 && (
                      <div style={styles.modalTrips}>
                        <div style={styles.modalTripsLabel}>Journeys</div>
                        {allTrips.map((trip, i) => (
                          <div
                            key={i}
                            style={styles.modalTripItem}
                            onClick={() => {
                              const tripCityId = trip.destinationId || trip.destination?.split(',')[0]?.toLowerCase().replace(/\s+/g, '-');
                              setPreviewUser(null);
                              navigate(`/city/${tripCityId}`);
                            }}
                          >
                            <span style={{ flexShrink: 0 }}>
                              {trip.isThere
                                ? <FiMapPin size={14} color={colors.terracotta} />
                                : <FiNavigation size={14} color={colors.textTertiary} />}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={styles.modalTripDest}>{trip.destination?.split(',')[0]}</div>
                              <div style={styles.modalTripDates}>{formatDateRange(trip.start, trip.end)}</div>
                            </div>
                            {trip.isThere && <span style={styles.modalTripBadge}>Active trip</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {isConn ? (
                      <div style={styles.modalStatusBadge}>Connected</div>
                    ) : isPending ? (
                      <div style={{ ...styles.modalStatusBadge, background: colors.warningBg, color: colors.warning }}>Request Pending</div>
                    ) : (
                      <button style={styles.modalConnectBtn} onClick={() => handleSendRequest(previewUser)}>
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Who's interested modal */}
      <AnimatePresence>
        {interestedPeople && (
          <div style={styles.modalOverlay} onClick={() => setInterestedPeople(null)}>
            <motion.div
              style={styles.modalCard}
              onClick={ev => ev.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <button style={styles.modalClose} onClick={() => setInterestedPeople(null)}>
                <FiX size={18} />
              </button>

              <div style={styles.modalContent}>
                <div style={styles.interestedHeader}>
                  <div style={styles.interestedTitle}>Interested in</div>
                  <div style={styles.interestedExpName}>{interestedPeople.expName}</div>
                </div>

                <div style={styles.interestedList}>
                  {interestedPeople.people.map(person => {
                    const isConn = (currentUserData?.connections || []).some(c => c.userId === person.id);
                    const isPending = allSentRequests.includes(person.id);
                    return (
                      <div key={person.id} style={styles.interestedRow}>
                        <div
                          style={{
                            ...styles.interestedAvatar,
                            backgroundImage: `url(${person.photoURL || ''})`,
                          }}
                          onClick={() => { setInterestedPeople(null); setPhotoIndex(0); setPreviewUser(person); }}
                        />
                        <div style={styles.interestedInfo} onClick={() => { setInterestedPeople(null); setPhotoIndex(0); setPreviewUser(person); }}>
                          <div style={styles.interestedName}>{person.name}</div>
                          {person.cityTrip && (
                            <div style={styles.interestedDates}>
                              {person.cityTrip.startDate} — {person.cityTrip.endDate}
                            </div>
                          )}
                        </div>
                        {isConn ? (
                          <div style={styles.connBadge}>Connected</div>
                        ) : isPending ? (
                          <div style={styles.pendingBadge}>Pending</div>
                        ) : (
                          <button style={styles.connectBtnSmall} onClick={() => handleSendRequest(person)}>
                            Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '40px',
  },

  // Hero
  hero: {
    height: '400px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '24px',
  },
  backBtn: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(10,10,10,0.6)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  heroBottom: {},
  heroCountry: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: colors.terracotta,
    marginBottom: '8px',
  },
  heroCity: {
    fontFamily: fonts.serif,
    fontSize: '40px',
    fontWeight: '600',
    color: colors.text,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  heroIntro: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '340px',
  },
  heroTripBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    background: colors.terracotta,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: radius.full,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  heroTripBadge: {
    marginTop: '14px',
    fontSize: '12px',
    fontWeight: '500',
    color: colors.terracotta,
    letterSpacing: '0.3px',
  },

  // Tabs
  tabsWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: colors.bg,
    borderBottom: `1px solid ${colors.border}`,
  },
  tabs: {
    display: 'flex',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    padding: '0 24px',
    gap: '4px',
  },
  tab: {
    padding: '14px 16px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textTertiary,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid transparent',
    fontFamily: fonts.sans,
  },
  tabActive: {
    color: colors.text,
    borderBottomColor: colors.terracotta,
  },

  // Content
  content: {
    padding: '20px 24px',
  },

  // Prayer card
  prayerCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: colors.surfaceElevated,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    marginBottom: '24px',
    alignItems: 'flex-start',
  },
  prayerIcon: {
    color: colors.olive,
    marginTop: '2px',
    flexShrink: 0,
  },
  prayerText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  },

  // Overview grid
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '32px',
  },
  overviewCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '16px 12px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  overviewCount: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '4px',
  },
  overviewLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: colors.textTertiary,
  },

  // Section
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
    margin: '0 0 16px',
  },

  // Tips
  tipItem: {
    display: 'flex',
    gap: '14px',
    marginBottom: '16px',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: colors.warmGray,
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  tipText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
  },

  // Experience links (affiliate)
  expLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 0',
    borderBottom: `1px solid ${colors.border}`,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  expInfo: {
    flex: 1,
  },
  expName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  expMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  expPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.terracotta,
    flexShrink: 0,
  },

  // Neighborhood full cards
  neighborhoodFullCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`,
  },
  neighborhoodFullImage: {
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '20px',
  },
  neighborhoodFullName: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '600',
    color: colors.text,
    margin: '0 0 4px',
  },
  neighborhoodFullVibe: {
    fontSize: '13px',
    color: colors.terracotta,
    fontWeight: '500',
  },
  neighborhoodFullDesc: {
    padding: '16px 20px',
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    background: colors.surface,
  },

  // Place cards (dining, mosques, coffee, experiences)
  placeCard: {
    padding: '16px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  placeHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
  },
  placeMeta: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  placeActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  placeNote: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginTop: '8px',
  },
  halalBadge: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: colors.olive,
    background: colors.successBg,
    padding: '4px 10px',
    borderRadius: radius.full,
  },
  saveBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
  },

  // Interest mechanic
  interestRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  interestBtn: {
    padding: '8px 16px',
    borderRadius: radius.full,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: `1.5px solid ${colors.warmGray}`,
    background: 'transparent',
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    transition: 'all 0.2s',
  },
  interestBtnActive: {
    background: colors.warningBg,
    borderColor: colors.terracotta,
    color: colors.terracotta,
  },
  interestHint: {
    fontSize: '12px',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  socialCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: colors.terracotta,
    fontWeight: '500',
  },

  // Travelers section (overview preview)
  travelersSectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  travelersViewAll: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.terracotta,
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  travelersPreviewRow: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  travelerBubble: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  travelerAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: `2px solid ${colors.warmGray}`,
  },
  travelerAvatarMore: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: colors.warmGray,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textSecondary,
  },
  travelerBubbleName: {
    fontSize: '11px',
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Travelers tab (full cards)
  travelersEmpty: {
    textAlign: 'center',
    padding: '40px 0',
  },
  travelersEmptyText: {
    fontSize: '14px',
    color: colors.textTertiary,
    marginBottom: '16px',
  },
  travelerCard: {
    padding: '20px',
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    marginBottom: '12px',
  },
  travelerCardTop: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
  },
  travelerCardAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
    border: `2px solid ${colors.warmGray}`,
  },
  travelerCardInfo: {
    flex: 1,
  },
  travelerCardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
  },
  travelerCardCity: {
    fontSize: '13px',
    color: colors.textTertiary,
    marginTop: '1px',
  },
  travelerCardDates: {
    fontSize: '12px',
    color: colors.terracotta,
    fontWeight: '500',
    marginTop: '3px',
  },
  travelerCardBio: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginTop: '12px',
  },
  travelerExperiences: {
    marginTop: '12px',
  },
  travelerExpLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: colors.textTertiary,
    marginBottom: '8px',
  },
  travelerExpList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  travelerExpPill: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '5px 12px',
    borderRadius: radius.full,
    background: colors.warningBg,
    color: colors.terracotta,
  },
  travelerInterests: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
  },
  travelerInterestPill: {
    fontSize: '11px',
    fontWeight: '500',
    padding: '4px 10px',
    borderRadius: radius.full,
    background: colors.warmGray,
    color: colors.textSecondary,
  },

  // Connect badges
  connBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.olive,
    background: colors.successBg,
    padding: '5px 12px',
    borderRadius: radius.full,
    flexShrink: 0,
  },
  pendingBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.warning,
    background: colors.warningBg,
    padding: '5px 12px',
    borderRadius: radius.full,
    flexShrink: 0,
  },
  connectBtnSmall: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0a0a0a',
    background: colors.terracotta,
    border: 'none',
    padding: '6px 14px',
    borderRadius: radius.full,
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: fonts.sans,
  },

  // Social count as button
  socialCountBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: colors.terracotta,
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: fonts.sans,
  },

  // Back to trip button
  backToTripBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '8px 16px',
    borderRadius: radius.full,
    background: 'rgba(10,10,10,0.6)',
    backdropFilter: 'blur(10px)',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.terracotta,
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },

  // Photo carousel
  carouselWrap: { position: 'relative', marginBottom: '4px' },
  carouselImageWrap: { position: 'relative', width: '100%', aspectRatio: '4/5', borderRadius: `${radius.lg} ${radius.lg} 0 0`, overflow: 'hidden' },
  carouselImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease' },
  carouselTapLeft: { position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', cursor: 'pointer' },
  carouselTapRight: { position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', cursor: 'pointer' },
  carouselDots: { display: 'flex', justifyContent: 'center', gap: '6px', padding: '12px 0 4px' },
  carouselDot: { width: '6px', height: '6px', borderRadius: '50%', background: colors.warmGray, cursor: 'pointer', transition: 'all 0.2s' },
  carouselDotActive: { background: colors.terracotta, width: '18px', borderRadius: '3px' },

  // Profile preview modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalCard: { background: colors.surface, borderRadius: radius.lg, maxWidth: '380px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' },
  modalClose: { position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalContent: { textAlign: 'center' },
  modalAvatarWrap: { padding: '32px 0 14px' },
  modalAvatar: { width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors.warmGray}` },
  modalAvatarPlaceholder: { width: '88px', height: '88px', borderRadius: '50%', background: colors.dark, color: colors.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '600', fontFamily: fonts.serif },
  modalTextContent: { padding: '16px 24px 24px' },
  modalName: { fontFamily: fonts.serif, fontSize: '20px', fontWeight: '500', color: colors.text, marginBottom: '2px' },
  modalCity: { fontSize: '13px', color: colors.textTertiary, marginBottom: '12px' },
  modalBio: { fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6, margin: '8px 0 16px', fontStyle: 'italic' },
  modalInterests: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '16px' },
  modalInterestChip: { ...components.pill },
  modalTrips: { textAlign: 'left', marginBottom: '16px' },
  modalTripsLabel: { ...type.label, marginBottom: '10px' },
  modalTripItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: colors.bg, borderRadius: radius.sm, marginBottom: '6px', cursor: 'pointer' },
  modalTripDest: { fontSize: '14px', fontWeight: '600', color: colors.text },
  modalTripDates: { fontSize: '12px', color: colors.textTertiary, marginTop: '2px' },
  modalTripBadge: { fontSize: '11px', fontWeight: '600', color: colors.terracotta, background: colors.warningBg, padding: '4px 8px', borderRadius: '6px', flexShrink: 0 },
  modalStatusBadge: { width: '100%', padding: '14px', background: colors.warmGray, color: colors.text, borderRadius: radius.md, fontSize: '15px', fontWeight: '600', textAlign: 'center' },
  modalConnectBtn: { ...components.btnPrimary },

  // Who's interested modal
  interestedHeader: {
    padding: '28px 24px 16px',
  },
  interestedTitle: {
    ...type.label,
    marginBottom: '4px',
  },
  interestedExpName: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
  },
  interestedList: {
    padding: '0 24px 24px',
  },
  interestedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  interestedAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    border: `2px solid ${colors.warmGray}`,
  },
  interestedInfo: {
    flex: 1,
    cursor: 'pointer',
  },
  interestedName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  interestedDates: {
    fontSize: '12px',
    color: colors.terracotta,
    fontWeight: '500',
    marginTop: '2px',
  },

  // Community page (non-curated cities)
  communityWelcome: {
    padding: '24px 20px',
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    marginBottom: '24px',
  },
  communityTitle: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.terracotta,
    marginBottom: '10px',
  },
  communityText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
  },
};

export default CityGuide;
