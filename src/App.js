import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { Capacitor } from '@capacitor/core';
import TabBar from './components/TabBar';
import { colors, fonts } from './design';

// Core pages — loaded eagerly (needed on first render)
import ModernHome from './pages/ModernHome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';

// Everything else — lazy loaded
const Discover = lazy(() => import('./pages/Discover'));
const CityGuide = lazy(() => import('./pages/CityGuide'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AddTrip = lazy(() => import('./pages/AddTrip'));
const Saved = lazy(() => import('./pages/Saved'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Messages = lazy(() => import('./pages/Messages'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const TripInvite = lazy(() => import('./pages/TripInvite'));
const InviteReceived = lazy(() => import('./pages/InviteReceived'));
const PublicDestination = lazy(() => import('./pages/PublicDestination'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const AdminMigrate = lazy(() => import('./pages/AdminMigrate'));
const AdminSeedDummy = lazy(() => import('./pages/AdminSeedDummy'));
const Admin = lazy(() => import('./pages/Admin'));
const ApplicationPending = lazy(() => import('./pages/ApplicationPending'));
const ApplicationRejected = lazy(() => import('./pages/ApplicationRejected'));

const TAB_PAGES = ['/home', '/trips', '/messages', '/profile'];

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
  const { currentUser, loading, needsOnboarding, applicationStatus } = useUser();
  const isAdmin = currentUser?.uid === 'o5pb2aGXmGRJQgMhZwdXLdY9Mrd2';

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingMark}>r</div>
        <div style={styles.loadingText}>rihlah</div>
      </div>
    );
  }

  const suspenseFallback = (
    <div style={styles.loading}>
      <div style={styles.loadingMark}>r</div>
      <div style={styles.loadingText}>rihlah</div>
    </div>
  );

  return (
    <AppShell>
    <Suspense fallback={suspenseFallback}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={Capacitor.isNativePlatform() ? (currentUser ? <Navigate to="/home" /> : <Navigate to="/login" />) : <ModernHome />} />
      <Route path="/go/:slug" element={<PublicDestination />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/home" /> : <Signup />} />
      <Route path="/login" element={currentUser ? <Navigate to="/home" /> : <Login />} />
      <Route path="/join/:inviteId" element={<InviteReceived />} />
      <Route path="/waitlist" element={<Waitlist />} />

      {/* Protected routes */}
      {currentUser ? (
        <>
          {needsOnboarding ? (
            <>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/onboarding" />} />
            </>
          ) : applicationStatus === 'pending' && !isAdmin ? (
            <>
              <Route path="/pending" element={<ApplicationPending />} />
              <Route path="*" element={<Navigate to="/pending" />} />
            </>
          ) : applicationStatus === 'rejected' && !isAdmin ? (
            <>
              <Route path="/rejected" element={<ApplicationRejected />} />
              <Route path="*" element={<Navigate to="/rejected" />} />
            </>
          ) : (
            <>
              <Route path="/home" element={<Discover />} />
              <Route path="/city/:cityId" element={<CityGuide />} />
              <Route path="/travelers" element={<Navigate to="/home" />} />
              <Route path="/destinations" element={<Navigate to="/home" />} />
              <Route path="/add-trip" element={<AddTrip />} />
              <Route path="/destination/:destination" element={<Navigate to="/home" />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/trips" element={<Saved />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/trip/:tripIndex" element={<TripDetail />} />
              <Route path="/trip/:tripIndex/invite" element={<TripInvite />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:conversationId" element={<ChatRoom />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/migrate" element={<AdminMigrate />} />
              <Route path="/admin/seed" element={<AdminSeedDummy />} />
              <Route path="/pending" element={<Navigate to="/home" />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </>
          )}
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" />} />
      )}
    </Routes>
    </Suspense>
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
    background: colors.terracotta,
    color: colors.bg,
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
