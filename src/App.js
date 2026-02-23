import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
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

function AppRoutes() {
  const { currentUser, loading, needsOnboarding } = useUser();

  if (loading) {
    return (
      <div style={styles.loading}>
        <img src="/logo192.png" alt="Rihlah" style={styles.loadingLogo} />
        <div style={styles.loadingText}>Rihlah</div>
      </div>
    );
  }

  return (
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
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
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
    color: '#6b6b6b',
    background: 'linear-gradient(180deg, #faf9f7 0%, #f5f3f0 100%)',
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
    color: '#047857',
    letterSpacing: '-0.5px',
  },
};

export default App;
