import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

/**
 * CHUKA eFOOTBALL - OFFICIAL FIREBASE CONFIGURATION
 * Project: chuka-efootball-hub
 * Authentication: Google Sign-In via Firebase Auth
 */
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBaRnQXGnD57G_KSK3MeMjEG1x3hxivDqw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'chuka-efootball-hub.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'chuka-efootball-hub',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'chuka-efootball-hub.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '245036106431',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:245036106431:web:d64b7916effd79bda6fc0a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-6GSH3VFXF9',
};

// Initialize Firebase App singleton safely
export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

// Initialize Analytics if supported in environment (browser window context)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(firebaseApp);
    }
  }).catch(() => {});
}

