import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { Capacitor } from '@capacitor/core';
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
import Messages from './pages/Messages';
import ChatRoom from './pages/ChatRoom';
import Waitlist from './pages/Waitlist';
import TabBar from './components/TabBar';

const TAB_PAGES = ['/destinations', '/saved', '/messages', '/profile'];

function AppShell({ children }) {
  const location = useLocation();
  const showTabBar = TAB_PAGES.includes(location.pathname);
  return (
    <>
      {children}
      {showTabBar && <TabBar />}
    </>
  );
}

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
    <AppShell>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={currentUser ? <Navigate to="/destinations" /> : (Capacitor.isNativePlatform() ? <Navigate to="/login" /> : <ModernHome />)} />
      <Route path="/signup" element={currentUser ? <Navigate to="/destinations" /> : <Signup />} />
      <Route path="/login" element={currentUser ? <Navigate to="/destinations" /> : <Login />} />
      <Route path="/waitlist" element={<Waitlist />} />

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
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:conversationId" element={<ChatRoom />} />
              <Route path="*" element={<Navigate to="/destinations" />} />
            </>
          )}
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" />} />
      )}
    </Routes>
    </AppShell>
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
