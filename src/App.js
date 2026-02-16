import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import ModernHome from './pages/ModernHome';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Destinations from './pages/Destinations';
import AddTrip from './pages/AddTrip';
import DestinationDetail from './pages/DestinationDetail';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user needs onboarding
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setNeedsOnboarding(!userData.onboardingComplete);
          } else {
            // New user, needs onboarding
            setNeedsOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setNeedsOnboarding(true);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        <img src="/logo.svg" alt="Rihlah" style={styles.loadingLogo} />
        <div style={styles.loadingText}>Rihlah</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={currentUser ? <Navigate to="/destinations" /> : <ModernHome />} />
        <Route path="/signup" element={currentUser ? <Navigate to="/destinations" /> : <Signup />} />
        <Route path="/login" element={currentUser ? <Navigate to="/destinations" /> : <Login />} />

        {/* Protected routes */}
        {currentUser ? (
          <>
            {needsOnboarding ? (
              <Route path="*" element={<Onboarding />} />
            ) : (
              <>
                <Route path="/destinations" element={<Destinations />} />
                <Route path="/add-trip" element={<AddTrip />} />
                <Route path="/destination/:destination" element={<DestinationDetail />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="*" element={<Navigate to="/destinations" />} />
              </>
            )}
          </>
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </Router>
  );
}

const styles = {
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#6b7280',
  },
  loadingLogo: {
    width: '72px',
    height: '72px',
    marginBottom: '16px',
    borderRadius: '16px',
  },
  loadingText: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#059669',
    letterSpacing: '-0.5px',
  },
};

export default App;