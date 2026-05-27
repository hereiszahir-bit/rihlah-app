import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmJ6B1gyLfBIxzJzjNgZUVjwdAMHQTmlM",
  authDomain: "rihlah-f2faf.firebaseapp.com",
  projectId: "rihlah-f2faf",
  storageBucket: "rihlah-f2faf.firebasestorage.app",
  messagingSenderId: "354742864514",
  appId: "1:354742864514:web:06a2c55679ace71d6ac29b",
  measurementId: "G-4JP3NS0GWM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth — use browserLocalPersistence on native to avoid indexedDB issues
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics may not be available in all environments
}

export { analytics, logEvent };

export default app;