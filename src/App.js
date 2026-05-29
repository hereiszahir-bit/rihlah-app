import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { Capacitor } from '@capacitor/core';
import ModernHome from './pages/ModernHome';
import Home from './pages/Home';
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
import TripDetail from './pages/TripDetail';
import TripInvite from './pages/TripInvite';
import InviteReceived from './pages/InviteReceived';
import Waitlist from './pages/Waitlist';
import TabBar from './components/TabBar';
import { colors, fonts } from './design';

const TAB_PAGES = ['/home', '/destinations', '/trips', '/profile'];

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
        <div style={styles.loadingMark}>R</div>
        <div style={styles.loadingText}>Rihlah</div>
      </div>
    );
  }

  return (
    <AppShell>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={currentUser ? <Navigate to="/home" /> : (Capacitor.isNativePlatform() ? <Navigate to="/login" /> : <ModernHome />)} />
      <Route path="/signup" element={currentUser ? <Navigate to="/home" /> : <Signup />} />
      <Route path="/login" element={currentUser ? <Navigate to="/home" /> : <Login />} />
      <Route path="/join/:inviteId" element={<InviteReceived />} />
      <Route path="/waitlist" element={<Waitlist />} />

      {/* Protected routes */}
      {currentUser ? (
        <>
          {needsOnboarding ? (
            <>
              <Route path="/home" element={<Home />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/destination/:destination" element={<DestinationDetail />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </>
          ) : (
            <>
              <Route path="/home" element={<Home />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/add-trip" element={<AddTrip />} />
              <Route path="/destination/:destination" element={<DestinationDetail />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/trips" element={<Saved />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/trip/:tripIndex" element={<TripDetail />} />
              <Route path="/trip/:tripIndex/invite" element={<TripInvite />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:conversationId" element={<ChatRoom />} />
              <Route path="*" element={<Navigate to="/home" />} />
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
    background: colors.bg,
  },
  loadingMark: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: colors.dark,
    color: colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: fonts.serif,
    fontSize: '32px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  loadingText: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '500',
    color: colors.text,
    letterSpacing: '-0.3px',
  },
};

export default App;
