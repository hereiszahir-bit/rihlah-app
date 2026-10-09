import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db, storage } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiCamera, FiX } from 'react-icons/fi';
import { colors, fonts, radius, components } from '../design';
import { sendApplicationReceived, sendAdminNotification, scheduleNurtureSequence } from '../utils/sendEmail';
import { useUser } from '../context/UserContext';
import { calculateAge } from '../utils/age';

function Onboarding() {
  const { refreshAll } = useUser();
  const [step, setStep] = useState(1);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    dateOfBirth: '',
    gender: '',
    profileVisibility: '',
    city: '',
    bio: '',
    occupation: '',
    screeningAnswer: '',
    interests: [],
    identity: [],
    instagram: '',
    referralSource: '',
    travelStyle: ''
  });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityDebounceRef = useRef(null);

  const searchCities = useCallback(async (query) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const cities = data
        .filter(item => item.address)
        .map(item => {
          const addr = item.address;
          const cityName = addr.city || addr.town || addr.village || addr.state || addr.county || item.name || '';
          const country = addr.country || '';
          if (!cityName) return null;
          return `${cityName}, ${country}`;
        })
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 6);
      setCitySuggestions(cities);
    } catch {
      setCitySuggestions([]);
    }
  }, []);

  const handleCityInput = (value) => {
    setFormData({ ...formData, city: value });
    setShowCitySuggestions(true);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => searchCities(value), 300);
  };

  const selectCity = (value) => {
    setFormData({ ...formData, city: value });
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  // Pre-load Google photo as a local data URL so it works like any uploaded photo
  useEffect(() => {
    const loadGooglePhoto = async () => {
      const googleUrl = auth.currentUser?.photoURL;
      if (!googleUrl) return;
      try {
        const res = await fetch(googleUrl);
        const blob = await res.blob();
        const file = new File([blob], 'google-photo.jpg', { type: blob.type });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoFiles([file]);
          setPhotoPreviews([reader.result]);
        };
        reader.readAsDataURL(file);
      } catch {
        // Google photo failed to load — user can upload their own
      }
    };
    loadGooglePhoto();
  }, []);

  useEffect(() => {
    const prefillFromWaitlist = async () => {
      const email = auth.currentUser?.email;
      if (!email) return;

      try {
        const q = query(collection(db, 'waitlist'), where('email', '==', email.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) return;

        const data = snap.docs[0].data();
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
          gender: data.gender || prev.gender,
          profileVisibility: data.profileVisibility || prev.profileVisibility,
          city: data.homeCity || prev.city,
          interests: data.interests?.length > 0 ? data.interests : prev.interests,
          identity: data.identity?.length > 0 ? data.identity : prev.identity,
        }));
      } catch (err) {
        console.warn('Waitlist prefill failed:', err);
      }
    };

    prefillFromWaitlist();
  }, []);

  const handleChange = (e) => {
    const updates = { [e.target.name]: e.target.value };
    if (e.target.name === 'gender' && !formData.profileVisibility) {
      updates.profileVisibility = e.target.value;
    }
    setFormData({ ...formData, ...updates });
  };

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) });
    } else {
      setFormData({ ...formData, interests: [...formData.interests, interest] });
    }
  };

  const toggleIdentity = (value) => {
    if (formData.identity.includes(value)) {
      setFormData({ ...formData, identity: formData.identity.filter(i => i !== value) });
    } else {
      setFormData({ ...formData, identity: [...formData.identity, value] });
    }
  };

  const [validationError, setValidationError] = useState('');

  const nextStep = () => {
    setValidationError('');
    if (step === 1 && (!formData.name.trim() || !formData.dateOfBirth || !formData.gender)) {
      setValidationError('Please fill in all required fields');
      return;
    }
    if (step === 1 && formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age === null || age < 13 || age > 120) {
        setValidationError('You must be at least 13 years old');
        return;
      }
    }
    if (step === 2 && !formData.city.trim()) {
      setValidationError('Please enter your city');
      return;
    }
    if (step === 2 && !formData.occupation.trim()) {
      setValidationError('Please tell us what you do');
      return;
    }
    if (step === 2 && !formData.screeningAnswer.trim()) {
      setValidationError('Please answer the travel question');
      return;
    }
    if (step === 3) {
      const totalPhotos = photoPreviews.length;
      if (totalPhotos < 2) {
        setValidationError(`At least 2 photos required (${totalPhotos}/2)`);
        return;
      }
    }
    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    setValidationError('');
    if (step > 1) setStep(step - 1);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    if (photoPreviews.length >= 5) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoFiles(prev => [...prev, file]);
      setPhotoPreviews(prev => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeOnboardingPhoto = (index) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setUploadingPhoto(true);
      setSubmitError('');
      const uploadedURLs = [];

      // Upload each photo file
      for (let i = 0; i < photoFiles.length; i++) {
        try {
          const photoRef = ref(storage, `profilePhotos/${user.uid}_${i === 0 ? 'main' : i}`);
          await uploadBytes(photoRef, photoFiles[i]);
          const url = await getDownloadURL(photoRef);
          uploadedURLs.push(url);
        } catch (photoError) {
          console.error('Photo upload error:', photoError.message);
        }
      }

      const allPhotos = uploadedURLs;
      const photoURL = allPhotos[0] || '';

      const userData = {
        email: user.email || '',
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        age: calculateAge(formData.dateOfBirth),
        gender: formData.gender,
        profileVisibility: formData.profileVisibility || formData.gender,
        occupation: (formData.occupation || '').trim(),
        screeningAnswer: (formData.screeningAnswer || '').trim(),
        city: (formData.city || '').trim(),
        bio: (formData.bio || '').trim(),
        interests: formData.interests,
        identity: formData.identity,
        whatsapp: '',
        instagram: (formData.instagram || '').trim(),
        referralSource: formData.referralSource || '',
        travelStyle: formData.travelStyle || '',
        photoURL: photoURL,
        photos: allPhotos,
        createdAt: new Date().toISOString(),
        appliedAt: new Date().toISOString(),
        upcomingTrips: [],
        connections: [],
        onboardingComplete: true,
        status: 'pending',
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Send confirmation + admin notification (fire-and-forget)
      const userEmail = user.email;
      if (userEmail) {
        sendApplicationReceived(userEmail, userData.name).catch(console.error);
        sendAdminNotification('hereiszahir@gmail.com', userData.name, userData.city).catch(console.error);
        scheduleNurtureSequence(userEmail, userData.name).catch(console.error);
      }

      // Refresh context — route guard will auto-redirect to /pending
      await refreshAll();

    } catch (error) {
      console.error('Profile creation error:', error.message);
      setSubmitError('Failed to save profile. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const interestGroups = [
    {
      label: 'Travel',
      options: ['Hiking', 'Food & Culinary', 'History & Culture', 'Photography', 'Beach', 'Adventure', 'Shopping', 'Nature'],
    },
    {
      label: 'Events',
      options: ['World Cup 2026', 'Hajj', 'Umrah', 'Conferences', 'Festivals', 'Sporting Events'],
    },
    {
      label: 'Lifestyle',
      options: ['Fitness', 'Tech', 'Business', 'Art', 'Reading', 'Sports', 'Volunteering', 'Language Learning'],
    },
    {
      label: 'Faith',
      options: ['Mosque Tours', 'Halal Dining', 'Quran Study', 'Islamic History', 'Dawah', 'Community Service'],
    },
  ];

  const identityOptions = [
    'Student', 'Young Professional', 'Solo Traveler', 'Couple',
    'Family', 'Retiree', 'Gap Year', 'Digital Nomad',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.progressBar}>
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div
            key={s}
            style={{
              ...styles.progressDot,
              ...(s === step ? styles.progressDotActive : {}),
              ...(s < step ? styles.progressDotComplete : {})
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Welcome to Rihlah</h2>
          <p style={styles.stepSubtitle}>Let's set up your profile</p>

          {validationError && <div style={styles.errorMsg}>{validationError}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Name <span style={styles.required}>*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} placeholder="Your name" maxLength={100} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Date of Birth <span style={styles.required}>*</span></label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} style={styles.input} max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]} />
            {formData.dateOfBirth && <div style={{ fontSize: '13px', color: colors.textMuted, marginTop: '6px' }}>Age: {calculateAge(formData.dateOfBirth)}</div>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Gender <span style={styles.required}>*</span></label>
            <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {formData.gender && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>I'd like to connect with <span style={styles.required}>*</span></label>
              <div style={styles.visibilityOptions}>
                {[
                  { key: formData.gender, label: formData.gender === 'Male' ? 'Brothers' : 'Sisters' },
                  { key: 'both', label: 'Everyone' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    style={{
                      ...styles.visibilityBtn,
                      ...(formData.profileVisibility === opt.key ? styles.visibilityBtnActive : {}),
                    }}
                    onClick={() => setFormData({ ...formData, profileVisibility: opt.key })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p style={styles.visibilityHint}>
                {formData.profileVisibility === 'both'
                  ? 'You\'ll see and be visible to all travelers.'
                  : formData.profileVisibility === 'Male'
                    ? 'You\'ll only see and be visible to brothers.'
                    : 'You\'ll only see and be visible to sisters.'}
              </p>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>How do you usually travel?</label>
            <div style={styles.visibilityOptions}>
              {['Solo', 'Couple', 'Family', 'Friends'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  style={{
                    ...styles.visibilityBtn,
                    ...(formData.travelStyle === opt ? styles.visibilityBtnActive : {}),
                  }}
                  onClick={() => setFormData({ ...formData, travelStyle: opt })}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Where are you based?</h2>
          <p style={styles.stepSubtitle}>Help us connect you with nearby travelers</p>

          {validationError && <div style={styles.errorMsg}>{validationError}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>City <span style={styles.required}>*</span></label>
            <div style={styles.cityInputWrapper}>
              <input
                type="text"
                style={styles.input}
                value={formData.city}
                onChange={(e) => handleCityInput(e.target.value)}
                onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                placeholder="Start typing a city..."
                autoComplete="off"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  {citySuggestions.map((s, i) => (
                    <button key={i} type="button" style={styles.suggestionItem} onMouseDown={() => selectCity(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>What do you do? <span style={styles.required}>*</span></label>
            <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} style={styles.input} placeholder="e.g. Product designer, Medical student, Entrepreneur" maxLength={100} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Where's the last place you traveled that changed how you think? <span style={styles.required}>*</span></label>
            <textarea name="screeningAnswer" value={formData.screeningAnswer} onChange={handleChange} style={styles.textarea} placeholder="Tell us about a place and what it shifted for you..." rows="4" maxLength={500} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Bio <span style={styles.optional}>optional</span></label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} style={styles.textarea} placeholder="A short line about yourself for your profile" rows="3" maxLength={300} />
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Add Your Photos</h2>
          <p style={styles.stepSubtitle}>At least 2 photos required. Show us who you are.</p>

          {validationError && <div style={styles.errorMsg}>{validationError}</div>}

          <div style={styles.photoUploadSection}>
            <div style={styles.onboardingPhotoRow}>
              {photoPreviews.map((preview, i) => (
                <div key={i} style={styles.onboardingPhotoCard}>
                  <img src={preview} alt={`Photo ${i + 1}`} style={styles.onboardingPhotoImg} />
                  <button type="button" style={styles.onboardingPhotoRemove} onClick={() => removeOnboardingPhoto(i)}>
                    <FiX size={14} />
                  </button>
                  {i === 0 && <div style={styles.onboardingMainLabel}>Main</div>}
                </div>
              ))}
              {photoPreviews.length < 5 && (
                <div
                  style={styles.onboardingPhotoCard}
                  onClick={() => document.getElementById('photoInput').click()}
                >
                  <div style={styles.photoPlaceholder}>
                    <FiCamera size={24} color={colors.textMuted} />
                    <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
                      {photoPreviews.length === 0 ? 'Add photo' : 'Add more'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <input id="photoInput" type="file" accept="image/*" style={styles.hiddenInput} onChange={handlePhotoSelect} />
            <div style={{ fontSize: '13px', color: colors.textMuted, marginTop: '12px', textAlign: 'center' }}>
              {photoPreviews.length}/5 photos {photoPreviews.length < 2 && ` \u00b7 ${2 - photoPreviews.length} more needed`}
            </div>
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 4 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Tell us about yourself</h2>
          <p style={styles.stepSubtitle}>Select what describes you</p>

          <div style={{ marginBottom: '28px' }}>
            <div style={styles.groupLabel}>I am a...</div>
            <div style={styles.interestsGrid}>
              {identityOptions.map((option) => (
                <button
                  key={option}
                  style={{ ...styles.interestChip, ...(formData.identity.includes(option) ? styles.interestChipActive : {}) }}
                  onClick={() => toggleIdentity(option)}
                >{option}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: fonts.serif, fontSize: '17px', fontWeight: '500', color: colors.text, marginBottom: '16px' }}>Interests</div>
            {interestGroups.map((group) => (
              <div key={group.label} style={{ marginBottom: '16px' }}>
                <div style={styles.groupLabel}>{group.label}</div>
                <div style={styles.interestsGrid}>
                  {group.options.map((interest) => (
                    <button
                      key={interest}
                      style={{ ...styles.interestChip, ...(formData.interests.includes(interest) ? styles.interestChipActive : {}) }}
                      onClick={() => toggleInterest(interest)}
                    >{interest}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 5 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Almost There</h2>
          <p style={styles.stepSubtitle}>A few final details</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Instagram <span style={styles.optional}>optional</span></label>
            <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} style={styles.input} placeholder="@username" maxLength={50} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>How did you hear about Rihlah? <span style={styles.optional}>optional</span></label>
            <select name="referralSource" value={formData.referralSource} onChange={handleChange} style={styles.input}>
              <option value="">Select one</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="friend">A friend</option>
              <option value="search">Google / Search</option>
              <option value="event">Event or conference</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 6 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Almost There</h2>
          <p style={styles.stepSubtitle}>Review your application</p>

          {submitError && <div style={styles.errorMsg}>{submitError}</div>}

          <div style={styles.reviewSection}>
            {photoPreviews.length > 0 && (
              <div style={styles.reviewPhotoRow}>
                {photoPreviews.map((p, i) => (
                  <img key={i} src={p} alt={`Photo ${i + 1}`} style={styles.reviewPhotoThumb} />
                ))}
              </div>
            )}

            <div style={styles.reviewItem}><strong>Name:</strong> {formData.name}</div>
            <div style={styles.reviewItem}><strong>Age:</strong> {calculateAge(formData.dateOfBirth)}</div>
            <div style={styles.reviewItem}><strong>Gender:</strong> {formData.gender}</div>
            <div style={styles.reviewItem}><strong>City:</strong> {formData.city}</div>
            <div style={styles.reviewItem}><strong>Connect with:</strong> {formData.profileVisibility === 'both' ? 'Everyone' : formData.profileVisibility === 'Male' ? 'Brothers' : 'Sisters'}</div>
            {formData.occupation && <div style={styles.reviewItem}><strong>Occupation:</strong> {formData.occupation}</div>}
            {formData.screeningAnswer && <div style={styles.reviewItem}><strong>Travel answer:</strong> {formData.screeningAnswer}</div>}
            {formData.bio && <div style={styles.reviewItem}><strong>Bio:</strong> {formData.bio}</div>}
            {formData.identity.length > 0 && <div style={styles.reviewItem}><strong>Identity:</strong> {formData.identity.join(', ')}</div>}
            {formData.interests.length > 0 && <div style={styles.reviewItem}><strong>Interests:</strong> {formData.interests.join(', ')}</div>}
            {formData.travelStyle && <div style={styles.reviewItem}><strong>Travel style:</strong> {formData.travelStyle}</div>}
            {formData.instagram && <div style={styles.reviewItem}><strong>Instagram:</strong> @{formData.instagram.replace('@', '')}</div>}
          </div>

          <button
            style={{ ...styles.submitButton, opacity: uploadingPhoto ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? 'Submitting...' : 'Submit Application'}
          </button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: colors.bg,
    padding: '40px 20px',
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '40px',
  },
  progressDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: colors.warmGray,
    transition: 'all 0.3s',
  },
  progressDotActive: {
    background: colors.dark,
    transform: 'scale(1.3)',
  },
  progressDotComplete: {
    background: colors.gold,
  },
  stepContainer: {
    maxWidth: '500px',
    margin: '0 auto',
    background: colors.surface,
    padding: '40px',
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
  },
  stepTitle: {
    fontFamily: fonts.serif,
    fontSize: '26px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '-0.3px',
  },
  stepSubtitle: {
    fontSize: '15px',
    color: colors.textSecondary,
    marginBottom: '32px',
    textAlign: 'center',
  },
  errorMsg: {
    background: colors.errorBg,
    color: colors.error,
    padding: '12px 16px',
    borderRadius: radius.sm,
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500',
    border: `1px solid ${colors.error}`,
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '8px',
  },
  required: {
    color: colors.terracotta,
    fontWeight: '400',
  },
  optional: {
    color: colors.textMuted,
    fontWeight: '400',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  input: {
    ...components.input,
    background: colors.bg,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: `1.5px solid ${colors.warmGray}`,
    borderRadius: radius.md,
    outline: 'none',
    resize: 'vertical',
    fontFamily: fonts.sans,
    boxSizing: 'border-box',
    background: colors.bg,
    color: colors.text,
  },
  cityInputWrapper: {
    position: 'relative',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderTop: 'none',
    borderRadius: `0 0 ${radius.sm} ${radius.sm}`,
    zIndex: 50,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  suggestionItem: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: `1px solid ${colors.lightGray}`,
    fontSize: '15px',
    color: colors.text,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  photoUploadSection: {
    marginBottom: '30px',
  },
  onboardingPhotoRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  onboardingPhotoCard: {
    position: 'relative',
    width: 'calc(33.33% - 7px)',
    aspectRatio: '3/4',
    borderRadius: radius.md,
    overflow: 'hidden',
    border: `1.5px dashed ${colors.warmGray}`,
    background: colors.bg,
    cursor: 'pointer',
  },
  onboardingPhotoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  onboardingPhotoRemove: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '26px',
    height: '26px',
    background: 'rgba(0,0,0,0.6)',
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  onboardingMainLabel: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    background: 'rgba(0,0,0,0.5)',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    display: 'none',
  },
  groupLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  interestsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '12px',
  },
  interestChip: {
    padding: '14px',
    background: colors.bg,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  interestChipActive: {
    background: colors.surface,
    borderColor: colors.dark,
    color: colors.text,
  },
  reviewSection: {
    marginBottom: '32px',
  },
  reviewPhotoRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
  },
  reviewPhotoThumb: {
    width: '72px',
    height: '72px',
    borderRadius: radius.sm,
    objectFit: 'cover',
    border: `2px solid ${colors.border}`,
    flexShrink: 0,
  },
  reviewItem: {
    padding: '12px',
    background: colors.bg,
    borderRadius: radius.sm,
    marginBottom: '8px',
    fontSize: '14px',
    color: colors.text,
  },
  nextButton: {
    ...components.btnPrimary,
    marginBottom: '12px',
    fontSize: '16px',
    padding: '16px',
  },
  submitButton: {
    ...components.btnPrimary,
    marginBottom: '12px',
    fontSize: '17px',
    padding: '16px',
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: colors.textSecondary,
    border: 'none',
    borderRadius: radius.sm,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  visibilityOptions: {
    display: 'flex',
    gap: '10px',
  },
  visibilityBtn: {
    flex: 1,
    padding: '14px 8px',
    background: colors.surface,
    color: colors.textSecondary,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  visibilityBtnActive: {
    background: colors.surface,
    color: colors.text,
    borderColor: colors.dark,
  },
  visibilityHint: {
    fontSize: '13px',
    color: colors.textMuted,
    margin: '8px 0 0 0',
    lineHeight: 1.4,
  },
};

export default Onboarding;
