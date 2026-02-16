import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&featuretype=city`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const cities = data
        .filter(item => item.address && (item.address.city || item.address.town || item.address.village || item.address.state))
        .map(item => {
          const addr = item.address;
          const cityName = addr.city || addr.town || addr.village || addr.state || '';
          const country = addr.country || '';
          return `${cityName}, ${country}`;
        })
        .filter((v, i, arr) => arr.indexOf(v) === i);
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
  
  // Set photo preview from Google profile picture
  useEffect(() => {
    if (auth.currentUser?.photoURL) {
      setPhotoPreview(auth.currentUser.photoURL);
    }
  }, []);

  const handleChange = (e) => {
    const updates = { [e.target.name]: e.target.value };
    // Auto-default visibility to same gender when gender is selected
    if (e.target.name === 'gender' && !formData.profileVisibility) {
      updates.profileVisibility = e.target.value; // 'Male' or 'Female'
    }
    setFormData({ ...formData, ...updates });
  };

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.age || !formData.gender)) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    console.log('=== STARTING PROFILE CREATION ===');
    
    try {
      const user = auth.currentUser;
      console.log('Current user:', user);
      
      if (!user) {
        console.error('No user logged in!');
        alert('You are not logged in. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('User ID:', user.uid);
      setUploadingPhoto(true);
      let photoURL = '';
      
      // Upload photo if provided
      if (photoFile) {
        try {
          console.log('Starting photo upload...');
          console.log('Photo file size:', photoFile.size, 'bytes');
          
          const photoRef = ref(storage, `profilePhotos/${user.uid}`);
          const uploadResult = await uploadBytes(photoRef, photoFile);
          console.log('Photo uploaded successfully');
          
          photoURL = await getDownloadURL(photoRef);
          console.log('Photo URL obtained');
        } catch (photoError) {
          console.error('=== PHOTO UPLOAD ERROR ===');
          console.error('Error message:', photoError.message);
          alert(`Photo upload failed: ${photoError.message}\n\nContinuing without photo...`);
        }
      } else {
        console.log('No photo file selected, skipping upload');
      }

      console.log('Creating Firestore document...');
      
      const userData = {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        profileVisibility: formData.profileVisibility || formData.gender,
        city: formData.city || '',
        bio: formData.bio || '',
        interests: formData.interests,
        whatsapp: formData.whatsapp || '',
        instagram: formData.instagram || '',
        photoURL: photoURL,
        createdAt: new Date().toISOString(),
        upcomingTrips: [],
        connections: [],
        onboardingComplete: true
      };
      
      console.log('Saving user data...');

      await setDoc(doc(db, 'users', user.uid), userData);
      
      console.log('=== PROFILE CREATED SUCCESSFULLY ===');
      console.log('Navigating to /modernhome...');
      
      // Force navigation with window.location
      window.location.href = '/destinations';
      
    } catch (error) {
      console.error('=== PROFILE CREATION ERROR ===');
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      alert(`Failed to save profile:\n\n${error.message}\n\nCheck console for details.`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const availableInterests = [
    'Food', 'Adventure', 'Culture', 'Photography', 
    'Art', 'History', 'Nature', 'Shopping', 
    'Nightlife', 'Wellness'
  ];

  return (
    <div style={styles.container}>
      {/* Progress Bar */}
      <div style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((s) => (
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

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Welcome to Rihlah! 👋</h2>
          <p style={styles.stepSubtitle}>Let's set up your profile</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your name"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your age"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={styles.input}
            >
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
                    <button
                      key={i}
                      type="button"
                      style={styles.suggestionItem}
                      onMouseDown={() => selectCity(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Bio (Optional)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Tell us about yourself..."
              rows="4"
            />
          </div>

          <button style={styles.nextButton} onClick={nextStep}>
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: Photo Upload */}
      {step === 2 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Add Your Photo 📷</h2>
          <p style={styles.stepSubtitle}>
            Help other travelers recognize you (optional)
          </p>

          <div style={styles.photoUploadSection}>
            {photoPreview ? (
              <div style={styles.photoPreviewContainer}>
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  style={styles.photoPreview}
                />
                <button
                  style={styles.changePhotoBtn}
                  onClick={() => document.getElementById('photoInput').click()}
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div 
                style={styles.photoUploadPlaceholder}
                onClick={() => document.getElementById('photoInput').click()}
              >
                <div style={styles.uploadIcon}>📷</div>
                <div style={styles.uploadText}>Tap to Upload Photo</div>
                <div style={styles.uploadSubtext}>JPG, PNG (Max 5MB)</div>
              </div>
            )}
            
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              style={styles.hiddenInput}
              onChange={handlePhotoSelect}
            />
          </div>

          <button style={styles.nextButton} onClick={nextStep}>
            Continue →
          </button>
          <button style={styles.backButton} onClick={prevStep}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 3: Interests */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>What are you into? 🎯</h2>
          <p style={styles.stepSubtitle}>Select your travel interests</p>

          <div style={styles.interestsGrid}>
            {availableInterests.map((interest) => (
              <button
                key={interest}
                style={{
                  ...styles.interestChip,
                  ...(formData.interests.includes(interest) ? styles.interestChipActive : {})
                }}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>

          <button style={styles.nextButton} onClick={nextStep}>
            Continue →
          </button>
          <button style={styles.backButton} onClick={prevStep}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 4: Social Links */}
      {step === 4 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Stay Connected 📱</h2>
          <p style={styles.stepSubtitle}>Add your contact info (optional)</p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>WhatsApp Number</label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              style={styles.input}
              placeholder="+1234567890"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Instagram Handle</label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              style={styles.input}
              placeholder="@username"
            />
          </div>

          <button style={styles.nextButton} onClick={nextStep}>
            Continue →
          </button>
          <button style={styles.backButton} onClick={prevStep}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div style={styles.stepContainer}>
          <h2 style={styles.stepTitle}>Looking Good! ✨</h2>
          <p style={styles.stepSubtitle}>Review your profile</p>

          <div style={styles.reviewSection}>
            {photoPreview && (
              <div style={styles.reviewPhotoContainer}>
                <img 
                  src={photoPreview} 
                  alt="Profile" 
                  style={styles.reviewPhoto}
                />
              </div>
            )}

            <div style={styles.reviewItem}>
              <strong>Name:</strong> {formData.name}
            </div>
            <div style={styles.reviewItem}>
              <strong>Age:</strong> {formData.age}
            </div>
            <div style={styles.reviewItem}>
              <strong>Gender:</strong> {formData.gender}
            </div>
            <div style={styles.reviewItem}>
              <strong>Connect with:</strong> {formData.profileVisibility === 'both' ? 'Everyone' : formData.profileVisibility === 'Male' ? 'Brothers' : 'Sisters'}
            </div>
            {formData.city && (
              <div style={styles.reviewItem}>
                <strong>City:</strong> {formData.city}
              </div>
            )}
            {formData.bio && (
              <div style={styles.reviewItem}>
                <strong>Bio:</strong> {formData.bio}
              </div>
            )}
            {formData.interests.length > 0 && (
              <div style={styles.reviewItem}>
                <strong>Interests:</strong> {formData.interests.join(', ')}
              </div>
            )}
            {formData.whatsapp && (
              <div style={styles.reviewItem}>
                <strong>WhatsApp:</strong> {formData.whatsapp}
              </div>
            )}
            {formData.instagram && (
              <div style={styles.reviewItem}>
                <strong>Instagram:</strong> {formData.instagram}
              </div>
            )}
          </div>

          <button 
            style={{
              ...styles.submitButton,
              ...(uploadingPhoto ? styles.submitButtonDisabled : {})
            }} 
            onClick={handleSubmit}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? 'Creating Profile...' : "Let's Go! 🚀"}
          </button>
          <button style={styles.backButton} onClick={prevStep}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
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
    background: '#d1d5db',
    transition: 'all 0.3s',
  },
  progressDotActive: {
    background: '#059669',
    transform: 'scale(1.3)',
  },
  progressDotComplete: {
    background: '#10b981',
  },
  stepContainer: {
    maxWidth: '500px',
    margin: '0 auto',
    background: '#fff',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  stepTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '8px',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  cityInputWrapper: {
    position: 'relative',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderTop: 'none',
    borderRadius: '0 0 10px 10px',
    zIndex: 50,
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  suggestionItem: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '15px',
    color: '#1f2937',
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
    border: '4px solid #059669',
  },
  changePhotoBtn: {
    padding: '10px 20px',
    background: '#f3f4f6',
    color: '#059669',
    border: '2px solid #059669',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  photoUploadPlaceholder: {
    width: '200px',
    height: '200px',
    margin: '0 auto 20px',
    borderRadius: '50%',
    background: '#f9fafb',
    border: '3px dashed #d1d5db',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  uploadSubtext: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  hiddenInput: {
    display: 'none',
  },
  interestsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  interestChip: {
    padding: '14px',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  interestChipActive: {
    background: '#f0fdf4',
    borderColor: '#059669',
    color: '#059669',
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
    border: '3px solid #059669',
  },
  reviewItem: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#1f2937',
  },
  nextButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
    boxShadow: '0 4px 20px rgba(5, 150, 105, 0.4)',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  backButton: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
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
    background: '#fff',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  visibilityBtnActive: {
    background: '#f0fdf4',
    color: '#059669',
    borderColor: '#059669',
  },
  visibilityHint: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '8px 0 0 0',
    lineHeight: 1.4,
  },
};

export default Onboarding;