import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useUser } from '../context/UserContext';
import { FiArrowLeft, FiBriefcase, FiCamera, FiMessageCircle } from 'react-icons/fi';
import { colors, fonts, radius, components } from '../design';

function EditProfile() {
  const navigate = useNavigate();
  const { currentUserData, refreshCurrentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('both');
  const [interests, setInterests] = useState([]);
  const [identity, setIdentity] = useState([]);
  const [photoURL, setPhotoURL] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityDebounceRef = useRef(null);

  const searchCities = useCallback(async (query) => {
    if (query.length < 2) { setCitySuggestions([]); return; }
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
    } catch { setCitySuggestions([]); }
  }, []);

  const handleCityChange = (value) => {
    setCity(value);
    setShowCitySuggestions(true);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(() => searchCities(value), 300);
  };

  const selectCity = (value) => {
    setCity(value);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  const interestGroups = [
    { label: 'Travel', options: ['Hiking', 'Food & Culinary', 'History & Culture', 'Photography', 'Beach', 'Adventure', 'Shopping', 'Nature'] },
    { label: 'Lifestyle', options: ['Fitness', 'Tech', 'Business', 'Art', 'Reading', 'Sports', 'Volunteering', 'Language Learning'] },
    { label: 'Faith', options: ['Mosque Tours', 'Halal Dining', 'Quran Study', 'Islamic History', 'Dawah', 'Community Service'] },
  ];

  const identityOptions = [
    'Student', 'Young Professional', 'Solo Traveler', 'Couple',
    'Family', 'Retiree', 'Gap Year', 'Digital Nomad',
  ];

  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const toggleIdentity = (value) => {
    setIdentity(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]);
  };

  useEffect(() => {
    if (currentUserData) {
      const data = currentUserData;
      setName(data.name || '');
      setBio(data.bio === 'No bio yet' ? '' : (data.bio || ''));
      setAge(data.age?.toString() || '');
      setGender(data.gender || '');
      setCity(data.city || '');
      setInstagram(data.instagram || '');
      setLinkedin(data.linkedin || '');
      setWhatsapp(data.whatsapp || '');
      setProfileVisibility(data.profileVisibility || 'both');
      setInterests(data.interests || []);
      setIdentity(data.identity || []);
      setPhotoURL(data.photoURL || '');
      setLoading(false);
    }
  }, [currentUserData]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return;
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) return;
    }

    setSaving(true);
    const user = auth.currentUser;

    try {
      let updatedPhotoURL = photoURL;
      if (newPhotoFile) {
        setUploadingPhoto(true);
        const photoRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(photoRef, newPhotoFile);
        updatedPhotoURL = await getDownloadURL(photoRef);
        setUploadingPhoto(false);
      }

      const cleanInstagram = instagram.trim().replace('@', '');
      const cleanLinkedin = linkedin.trim().replace('@', '').replace('linkedin.com/in/', '');
      const cleanWhatsapp = whatsapp.trim().replace(/\s/g, '');

      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        bio: bio.trim() || 'No bio yet',
        age: age ? parseInt(age) : null,
        gender: gender || '',
        city: city.trim(),
        interests: interests,
        identity: identity,
        instagram: cleanInstagram,
        linkedin: cleanLinkedin,
        whatsapp: cleanWhatsapp,
        photoURL: updatedPhotoURL,
        profileVisibility: profileVisibility,
      });

      refreshCurrentUser();
      navigate('/profile');

    } catch (error) {
      console.error('Error updating profile:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/profile')}>
            <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
          </button>
          <h1 style={styles.title}>Edit Profile</h1>
        </div>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/profile')}>
          <FiArrowLeft size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} /> Back
        </button>
        <h1 style={styles.title}>Edit Profile</h1>
      </div>

      <div style={styles.content}>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div style={styles.photoSection}>
            <div style={styles.photoWrapper} onClick={() => document.getElementById('photoInput').click()}>
              {(newPhotoPreview || photoURL) ? (
                <img src={newPhotoPreview || photoURL} alt="Profile" style={styles.photoPreview} />
              ) : (
                <div style={styles.photoPlaceholder}>
                  <div style={{ marginBottom: '4px', color: colors.textTertiary }}><FiCamera size={36} /></div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>Add Photo</div>
                </div>
              )}
              <div style={styles.photoBadge}><FiCamera size={14} color="#fff" /></div>
            </div>
            <input id="photoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
            <button type="button" style={styles.changePhotoLink} onClick={() => document.getElementById('photoInput').click()}>Change Photo</button>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Name</label>
            <input type="text" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required maxLength={100} />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Age</label>
            <input type="number" style={styles.input} value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" min="13" max="120" />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Location</label>
            <div style={styles.cityInputWrapper}>
              <input
                type="text" style={styles.input} value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                placeholder="Start typing a city..." autoComplete="off" maxLength={100}
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

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Bio</label>
            <textarea style={styles.textarea} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself..." maxLength={500} rows={4} />
            <div style={styles.charCount}>{bio.length}/500 characters</div>
          </div>

          <div style={styles.sectionHeader}>Identity</div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>I am a...</label>
            <div style={styles.chipGrid}>
              {identityOptions.map(option => (
                <button key={option} type="button" style={{ ...styles.chipBtn, ...(identity.includes(option) ? styles.chipBtnActive : {}) }} onClick={() => toggleIdentity(option)}>{option}</button>
              ))}
            </div>
          </div>

          <div style={styles.sectionHeader}>Interests</div>
          {interestGroups.map(group => (
            <div key={group.label} style={styles.fieldGroup}>
              <label style={styles.groupLabel}>{group.label}</label>
              <div style={styles.chipGrid}>
                {group.options.map(interest => (
                  <button key={interest} type="button" style={{ ...styles.chipBtn, ...(interests.includes(interest) ? styles.chipBtnActive : {}) }} onClick={() => toggleInterest(interest)}>{interest}</button>
                ))}
              </div>
            </div>
          ))}

          <div style={styles.sectionHeader}>Privacy</div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>I'd like to connect with</label>
            <div style={styles.visibilityOptions}>
              {[
                { key: gender || 'Male', label: gender === 'Female' ? 'Sisters' : 'Brothers' },
                { key: 'both', label: 'Everyone' },
              ].map(opt => (
                <button key={opt.key} type="button" style={{ ...styles.visibilityBtn, ...(profileVisibility === opt.key ? styles.visibilityBtnActive : {}) }} onClick={() => setProfileVisibility(opt.key)}>{opt.label}</button>
              ))}
            </div>
            <p style={styles.visibilityHint}>
              {profileVisibility === 'both'
                ? 'You\'ll see and be visible to all travelers.'
                : profileVisibility === 'Male'
                  ? 'You\'ll only see and be visible to brothers.'
                  : 'You\'ll only see and be visible to sisters.'}
            </p>
          </div>

          <div style={styles.sectionHeader}>Social Media</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Instagram</label>
            <div style={styles.inputWithIcon}>
              <span style={styles.inputIcon}><FiCamera size={16} /></span>
              <input type="text" style={styles.inputWithPrefix} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" maxLength={50} />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>LinkedIn</label>
            <div style={styles.inputWithIcon}>
              <span style={styles.inputIcon}><FiBriefcase size={16} /></span>
              <input type="text" style={styles.inputWithPrefix} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="username" maxLength={50} />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>WhatsApp</label>
            <div style={styles.inputWithIcon}>
              <span style={styles.inputIcon}><FiMessageCircle size={16} /></span>
              <input type="tel" style={styles.inputWithPrefix} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1234567890" maxLength={50} />
            </div>
          </div>

          <button type="submit" style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
            {uploadingPhoto ? 'Uploading photo...' : saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button type="button" style={styles.cancelBtn} onClick={() => navigate('/profile')}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '40px',
  },
  header: {
    padding: '8px 24px 14px',
    background: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: colors.text,
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '8px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '26px',
    fontWeight: '500',
    color: colors.text,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  content: {
    padding: '20px 24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  photoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
  },
  photoWrapper: {
    position: 'relative',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
    border: `2px solid ${colors.border}`,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    background: colors.lightGray,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    width: '32px',
    height: '32px',
    background: colors.dark,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.surface}`,
  },
  changePhotoLink: {
    background: 'none',
    border: 'none',
    color: colors.text,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  loading: {
    padding: '60px 20px',
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: '16px',
  },
  sectionHeader: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: '24px',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  fieldGroup: {
    marginBottom: '20px',
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
  textarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: `1.5px solid ${colors.warmGray}`,
    borderRadius: radius.md,
    resize: 'vertical',
    fontFamily: fonts.sans,
    outline: 'none',
    boxSizing: 'border-box',
    background: colors.bg,
    color: colors.text,
  },
  charCount: {
    fontSize: '13px',
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: '6px',
  },
  inputWithIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    fontSize: '18px',
    pointerEvents: 'none',
    color: colors.textTertiary,
  },
  inputWithPrefix: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    border: `1.5px solid ${colors.warmGray}`,
    borderRadius: radius.md,
    fontFamily: fonts.sans,
    outline: 'none',
    boxSizing: 'border-box',
    background: colors.bg,
    color: colors.text,
  },
  groupLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chipBtn: {
    padding: '10px 16px',
    background: colors.bg,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.full,
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  chipBtnActive: {
    background: colors.surface,
    borderColor: colors.dark,
    color: colors.text,
  },
  visibilityOptions: {
    display: 'flex',
    gap: '8px',
  },
  visibilityBtn: {
    flex: 1,
    padding: '12px 8px',
    background: colors.lightGray,
    color: colors.textSecondary,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.full,
    fontSize: '14px',
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
  },
  saveBtn: {
    ...components.btnPrimary,
    marginTop: '24px',
    marginBottom: '12px',
    fontSize: '16px',
    padding: '16px',
  },
  cancelBtn: {
    width: '100%',
    padding: '14px 24px',
    background: colors.lightGray,
    color: colors.text,
    border: 'none',
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default EditProfile;
