import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyAo8qG5YEo0MQ-EbFR1ZPFeFb1gCtk3NHE",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "totemic-sandbox-bbndl.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "totemic-sandbox-bbndl",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "totemic-sandbox-bbndl.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "80420556554",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:80420556554:web:3134beeec151886ba334f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
