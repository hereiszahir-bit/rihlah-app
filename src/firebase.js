import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;