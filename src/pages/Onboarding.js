import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiCamera } from 'react-icons/fi';
import { colors, fonts, radius, components } from '../design';

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    age: '',
    gender: '',
    profileVisibility: '',
    city: '',
    bio: '',
    interests: [],
    identity: [],
    whatsapp: '',
    instagram: ''
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

  useEffect(() => {
    if (auth.currentUser?.photoURL) {
      setPhotoPreview(auth.currentUser.photoURL);
    }
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
          age: data.age ? String(data.age) : prev.age,
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
    if (step === 1 && (!formData.name.trim() || !formData.age || !formData.gender)) {
      setValidationError('Please fill in all required fields');
      return;
    }
    if (step === 1 && formData.age) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        setValidationError('Please enter a valid age between 13 and 120');
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
    if (file) {
      if (file.size > 5 * 1024 * 1024) return;
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      setUploadingPhoto(true);
      setSubmitError('');
      let photoURL = '';

      if (photoFile) {
        try {
          const photoRef = ref(storage, `profilePhotos/${user.uid}`);
          await uploadBytes(photoRef, photoFile);
          photoURL = await getDownloadURL(photoRef);
        } catch (photoError) {
          console.error('Photo upload error:', photoError.message);
        }
      }

      const userData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        profileVisibility: formData.profileVisibility || formData.gender,
        city: (formData.city || '').trim(),
        bio: (formData.bio || '').trim(),
        interests: formData.interests,
        identity: formData.identity,
        whatsapp: (formData.whatsapp || '').trim(),
        instagram: (formData.instagram || '').trim(),
        photoURL: photoURL,
        createdAt: new Date().toISOString(),
        upcomingTrips: [],
        connections: [],
        onboardingComplete: true
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      window.location.href = '/destinations';

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
            <label style={styles.label}>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} placeholder="Your name" maxLength={100} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Age *</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} style={styles.input} placeholder="Your age" min={13} max={120} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleChange} style={styles.input}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {formData.gender && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>I'd like to connect with *</label>
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

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Where are you based?</h2>
          <p style={styles.stepSubtitle}>Help us connect you with nearby travelers</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>City</label>
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
            <label style={styles.label}>Bio (Optional)</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} style={styles.textarea} placeholder="Tell us about yourself..." rows="4" maxLength={500} />
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Add Your Photo</h2>
          <p style={styles.stepSubtitle}>Help other travelers recognize you (optional)</p>

          <div style={styles.photoUploadSection}>
            {photoPreview ? (
              <div style={styles.photoPreviewContainer}>
                <img src={photoPreview} alt="Preview" style={styles.photoPreview} />
                <button style={styles.changePhotoBtn} onClick={() => document.getElementById('photoInput').click()}>Change Photo</button>
              </div>
            ) : (
              <div style={styles.photoUploadPlaceholder} onClick={() => document.getElementById('photoInput').click()}>
                <div style={styles.uploadIcon}><FiCamera size={28} color={colors.gold} /></div>
                <div style={styles.uploadText}>Tap to Upload Photo</div>
                <div style={styles.uploadSubtext}>JPG, PNG (Max 5MB)</div>
              </div>
            )}
            <input id="photoInput" type="file" accept="image/*" style={styles.hiddenInput} onChange={handlePhotoSelect} />
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
          <h2 style={styles.stepTitle}>Stay Connected</h2>
          <p style={styles.stepSubtitle}>Add your contact info (optional)</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>WhatsApp Number</label>
            <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={styles.input} placeholder="+1234567890" maxLength={50} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Instagram Handle</label>
            <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} style={styles.input} placeholder="@username" maxLength={50} />
          </div>

          <button style={styles.nextButton} onClick={nextStep}>Continue</button>
          <button style={styles.backButton} onClick={prevStep}>Back</button>
        </div>
      )}

      {step === 6 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Looking Good</h2>
          <p style={styles.stepSubtitle}>Review your profile</p>

          {submitError && <div style={styles.errorMsg}>{submitError}</div>}

          <div style={styles.reviewSection}>
            {photoPreview && (
              <div style={styles.reviewPhotoContainer}>
                <img src={photoPreview} alt="Profile" style={styles.reviewPhoto} />
              </div>
            )}

            <div style={styles.reviewItem}><strong>Name:</strong> {formData.name}</div>
            <div style={styles.reviewItem}><strong>Age:</strong> {formData.age}</div>
            <div style={styles.reviewItem}><strong>Gender:</strong> {formData.gender}</div>
            <div style={styles.reviewItem}><strong>Connect with:</strong> {formData.profileVisibility === 'both' ? 'Everyone' : formData.profileVisibility === 'Male' ? 'Brothers' : 'Sisters'}</div>
            {formData.city && <div style={styles.reviewItem}><strong>City:</strong> {formData.city}</div>}
            {formData.bio && <div style={styles.reviewItem}><strong>Bio:</strong> {formData.bio}</div>}
            {formData.identity.length > 0 && <div style={styles.reviewItem}><strong>Identity:</strong> {formData.identity.join(', ')}</div>}
            {formData.interests.length > 0 && <div style={styles.reviewItem}><strong>Interests:</strong> {formData.interests.join(', ')}</div>}
            {formData.whatsapp && <div style={styles.reviewItem}><strong>WhatsApp:</strong> {formData.whatsapp}</div>}
            {formData.instagram && <div style={styles.reviewItem}><strong>Instagram:</strong> {formData.instagram}</div>}
          </div>

          <button
            style={{ ...styles.submitButton, opacity: uploadingPhoto ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? 'Creating Profile...' : "Let's Go"}
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
    border: '1px solid #fecaca',
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
  photoPreviewContainer: {
    textAlign: 'center',
  },
  photoPreview: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '20px',
    border: `3px solid ${colors.dark}`,
  },
  changePhotoBtn: {
    padding: '10px 20px',
    background: colors.lightGray,
    color: colors.text,
    border: 'none',
    borderRadius: radius.sm,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  photoUploadPlaceholder: {
    width: '200px',
    height: '200px',
    margin: '0 auto 20px',
    borderRadius: '50%',
    background: colors.bg,
    border: `3px dashed ${colors.warmGray}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  uploadIcon: {
    marginBottom: '12px',
  },
  uploadText: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '4px',
  },
  uploadSubtext: {
    fontSize: '12px',
    color: colors.textMuted,
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
  reviewPhotoContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  reviewPhoto: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `3px solid ${colors.dark}`,
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
