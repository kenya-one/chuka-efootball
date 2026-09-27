import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { FirebaseConfig } from '../config/firebaseConfig';
import { GoogleAuthUser } from '../types';
import { syncUserWithBackend } from '../firebase/auth';

export type FirebaseAuthStatus =
  | 'signed_out'
  | 'signing_in'
  | 'signed_in'
  | 'signing_out'
  | 'error';

export interface FirebaseAuthDiagnostic {
  isInitialized: boolean;
  googleProviderAvailable: boolean;
  authState: FirebaseAuthStatus;
  missingKeys: string[];
  currentUser: {
    email: string;
    maskedUid: string;
    displayName: string;
    photoURL?: string;
  } | null;
  lastError: string | null;
}

export type AuthChangeCallback = (user: GoogleAuthUser | null, status: FirebaseAuthStatus) => void;

export class FirebaseAuthService {
  private static app: FirebaseApp | null = null;
  private static auth: Auth | null = null;
  private static googleProvider: GoogleAuthProvider | null = null;
  private static status: FirebaseAuthStatus = 'signed_out';
  private static lastError: string | null = null;
  private static listeners: Set<AuthChangeCallback> = new Set();
  private static initialized = false;

  /**
   * Initializes the Firebase App and Firebase Authentication instance.
   * Only initializes if valid configuration is present.
   */
  public static init(): boolean {
    if (this.initialized && this.auth) {
      return true;
    }

    if (!FirebaseConfig.isConfigured()) {
      this.status = 'signed_out';
      this.initialized = false;
      return false;
    }

    try {
      const config = FirebaseConfig.getConfig();
      if (getApps().length === 0) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }

      // Initialize analytics if supported in current browser environment
      if (typeof window !== 'undefined' && config.measurementId) {
        isAnalyticsSupported()
          .then((supported) => {
            if (supported && this.app) {
              getAnalytics(this.app);
            }
          })
          .catch(() => {
            // Non-critical, ignore in sandboxed environments
          });
      }

      this.auth = getAuth(this.app);

      // Configure Google Provider
      this.googleProvider = new GoogleAuthProvider();
      this.googleProvider.setCustomParameters({
        prompt: 'select_account',
      });

      // Subscribe to real Firebase auth state changes
      onAuthStateChanged(
        this.auth,
        (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            this.status = 'signed_in';
            this.lastError = null;
            const mappedUser = this.mapFirebaseUser(fbUser);
            this.notifyListeners(mappedUser, 'signed_in');
          } else {
            if (this.status !== 'signing_in') {
              this.status = 'signed_out';
            }
            this.notifyListeners(null, this.status);
          }
        },
        (error) => {
          console.error('[Firebase Auth State Error]:', error);
          this.status = 'error';
          this.lastError = this.getFriendlyErrorMessage(error);
          this.notifyListeners(null, 'error');
        }
      );

      this.initialized = true;
      return true;
    } catch (err) {
      console.error('[Firebase Initialization Error]:', err);
      this.status = 'error';
      this.lastError = 'Failed to initialize Firebase with current credentials.';
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if Firebase is successfully initialized
   */
  public static isInitialized(): boolean {
    if (!this.initialized) {
      this.init();
    }
    return this.initialized && this.auth !== null;
  }

  /**
   * Check if Google Provider is available
   */
  public static isGoogleProviderAvailable(): boolean {
    return this.isInitialized() && this.googleProvider !== null;
  }

  /**
   * Returns the current authentication status
   */
  public static getStatus(): FirebaseAuthStatus {
    return this.status;
  }

  /**
   * Returns the last recorded error message
   */
  public static getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Returns the current authenticated Firebase user, or null
   */
  public static getCurrentUser(): GoogleAuthUser | null {
    if (!this.auth || !this.auth.currentUser) {
      return null;
    }
    return this.mapFirebaseUser(this.auth.currentUser);
  }

  /**
   * Triggers the REAL Firebase Google Authentication flow using a popup
   */
  public static async signInWithGoogle(): Promise<{
    success: boolean;
    user?: GoogleAuthUser;
    error?: string;
    errorCode?: string;
    needsConfig?: boolean;
    unauthorizedDomain?: string;
  }> {
    if (!FirebaseConfig.isConfigured()) {
      return {
        success: false,
        needsConfig: true,
        error: 'Firebase credentials are not configured yet.',
      };
    }

    if (!this.isInitialized()) {
      const ok = this.init();
      if (!ok || !this.auth || !this.googleProvider) {
        return {
          success: false,
          needsConfig: true,
          error: 'Firebase initialization failed. Please verify credentials.',
        };
      }
    }

    try {
      this.status = 'signing_in';
      this.lastError = null;
      this.notifyListeners(null, 'signing_in');

      const result = await signInWithPopup(this.auth!, this.googleProvider!);
      console.log("Firebase authentication successful");
      console.log("Firebase user:", result.user.email);
      const idToken = await result.user.getIdToken();
      console.log("Firebase ID token obtained");
      const syncData = await syncUserWithBackend(idToken);

      if (!syncData || !syncData.success) {
        throw new Error('Account authentication succeeded, but account synchronization failed: ' + (syncData?.error || syncData?.message || 'Sync rejected'));
      }

      const mappedUser = this.mapFirebaseUser(result.user);

      this.status = 'signed_in';
      this.lastError = null;
      this.notifyListeners(mappedUser, 'signed_in');

      return {
        success: true,
        user: mappedUser,
      };
    } catch (err: unknown) {
      this.status = 'error';
      const friendlyMessage = this.getFriendlyErrorMessage(err);
      this.lastError = friendlyMessage;
      console.error('[Firebase Sign-In Error]:', err);
      this.notifyListeners(null, 'error');

      const authError = err as AuthError;
      const errorCode = authError?.code || '';
      const isUnauthorizedDomain = errorCode === 'auth/unauthorized-domain';

      return {
        success: false,
        error: friendlyMessage,
        errorCode,
        unauthorizedDomain: isUnauthorizedDomain
          ? typeof window !== 'undefined'
            ? window.location.hostname
            : ''
          : undefined,
      };
    }
  }

  /**
   * Signs out the user from Firebase Authentication
   */
  public static async signOut(): Promise<void> {
    if (!this.auth) return;

    try {
      this.status = 'signing_out';
      this.notifyListeners(null, 'signing_out');
      await firebaseSignOut(this.auth);
      this.status = 'signed_out';
      this.lastError = null;
      this.notifyListeners(null, 'signed_out');
    } catch (err) {
      console.error('[Firebase Sign-Out Error]:', err);
      this.status = 'error';
      this.lastError = 'Failed to complete sign out.';
      this.notifyListeners(null, 'error');
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  public static subscribe(callback: AuthChangeCallback): () => void {
    this.listeners.add(callback);
    // Immediately emit current state
    callback(this.getCurrentUser(), this.status);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get complete diagnostic payload for the Profile diagnostics panel
   */
  public static getDiagnostic(): FirebaseAuthDiagnostic {
    const isInit = this.isInitialized();
    const currentUser = this.getCurrentUser();

    return {
      isInitialized: isInit,
      googleProviderAvailable: this.isGoogleProviderAvailable(),
      authState: this.status,
      missingKeys: FirebaseConfig.getMissingKeys(),
      currentUser: currentUser
        ? {
            email: currentUser.email,
            maskedUid: this.maskUid(currentUser.uid),
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          }
        : null,
      lastError: this.lastError,
    };
  }

  /**
   * Masks a private UID for privacy: e.g. "aB3d...9X2z"
   */
  public static maskUid(uid: string): string {
    if (!uid) return '';
    if (uid.length <= 8) return '****';
    return `${uid.substring(0, 4)}••••${uid.substring(uid.length - 4)}`;
  }

  private static notifyListeners(user: GoogleAuthUser | null, status: FirebaseAuthStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(user, status);
      } catch (err) {
        console.error('Error in auth state listener:', err);
      }
    });
  }

  private static mapFirebaseUser(user: FirebaseUser): GoogleAuthUser {
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Player',
      photoURL: user.photoURL || undefined,
    };
  }

  /**
   * Translates raw Firebase error codes to friendly, actionable messages
   */
  private static getFriendlyErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') {
      return 'An unexpected authentication error occurred.';
    }

    const authError = err as AuthError;
    const code = authError.code || '';

    switch (code) {
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In was closed before completing.';
      case 'auth/cancelled-popup-request':
        return 'Previous sign-in attempt was cancelled.';
      case 'auth/popup-blocked':
        return 'Google Sign-In popup was blocked by your browser. Please enable popups.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase Console. Add this domain under Authentication > Settings > Authorized domains.';
      case 'auth/operation-not-allowed':
        return 'Google Sign-In is not enabled in your Firebase project. Go to Firebase Console > Authentication > Sign-in method and enable Google.';
      case 'auth/network-request-failed':
        return 'Network connection error during authentication. Check your internet connection.';
      case 'auth/invalid-api-key':
        return 'Invalid Firebase API Key. Please verify VITE_FIREBASE_API_KEY in your settings.';
      case 'auth/app-deleted':
      case 'auth/invalid-app-credential':
        return 'Firebase credentials error. Please verify your Firebase project settings.';
      default:
        return authError.message || 'Authentication failed. Please try again.';
    }
  }
}
