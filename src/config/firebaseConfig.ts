/**
 * CHUKA eFOOTBALL LEAGUE - FIREBASE AUTHENTICATION CONFIGURATION
 *
 * Firebase is used EXCLUSIVELY for user identity (Google Sign-In).
 * All competition, player, tournament, and league data is stored in Google Sheets.
 *
 * Config values are loaded from:
 * 1. Environment variables (VITE_FIREBASE_*)
 * 2. Optional localStorage overrides (for live testing in preview without dev-server restart)
 */

export interface FirebaseConfigValues {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigValues = {
  apiKey: 'AIzaSyBaRnQXGnD57G_KSK3MeMjEG1x3hxivDqw',
  authDomain: 'chuka-efootball-hub.firebaseapp.com',
  projectId: 'chuka-efootball-hub',
  storageBucket: 'chuka-efootball-hub.firebasestorage.app',
  messagingSenderId: '245036106431',
  appId: '1:245036106431:web:d64b7916effd79bda6fc0a',
  measurementId: 'G-6GSH3VFXF9',
};

const STORAGE_KEYS = {
  API_KEY: 'CHUKA_FIREBASE_API_KEY',
  AUTH_DOMAIN: 'CHUKA_FIREBASE_AUTH_DOMAIN',
  PROJECT_ID: 'CHUKA_FIREBASE_PROJECT_ID',
  STORAGE_BUCKET: 'CHUKA_FIREBASE_STORAGE_BUCKET',
  MESSAGING_SENDER_ID: 'CHUKA_FIREBASE_MESSAGING_SENDER_ID',
  APP_ID: 'CHUKA_FIREBASE_APP_ID',
  MEASUREMENT_ID: 'CHUKA_FIREBASE_MEASUREMENT_ID',
};

export class FirebaseConfig {
  /**
   * Retrieves the current Firebase configuration values.
   * Prioritizes localStorage overrides if set by the user, then environment variables, then built-in project defaults.
   */
  public static getConfig(): FirebaseConfigValues {
    const storedProjectId = localStorage.getItem(STORAGE_KEYS.PROJECT_ID)?.trim();
    // Invalidate stale legacy project IDs from earlier versions
    const hasValidCustomConfig = storedProjectId && storedProjectId !== 'chuka-hub';

    return {
      apiKey:
        (hasValidCustomConfig ? localStorage.getItem(STORAGE_KEYS.API_KEY)?.trim() : null) ||
        import.meta.env.VITE_FIREBASE_API_KEY?.trim() ||
        DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain:
        (hasValidCustomConfig ? localStorage.getItem(STORAGE_KEYS.AUTH_DOMAIN)?.trim() : null) ||
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ||
        DEFAULT_FIREBASE_CONFIG.authDomain,
      projectId:
        (hasValidCustomConfig ? storedProjectId : null) ||
        import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
        DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket:
        (hasValidCustomConfig ? localStorage.getItem(STORAGE_KEYS.STORAGE_BUCKET)?.trim() : null) ||
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ||
        DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId:
        (hasValidCustomConfig ? localStorage.getItem(STORAGE_KEYS.MESSAGING_SENDER_ID)?.trim() : null) ||
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
        DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId:
        (hasValidCustomConfig ? localStorage.getItem(STORAGE_KEYS.APP_ID)?.trim() : null) ||
        import.meta.env.VITE_FIREBASE_APP_ID?.trim() ||
        DEFAULT_FIREBASE_CONFIG.appId,
      measurementId:
        (hasValidCustomConfig ? localStorage.getItem(STORAGE_KEYS.MEASUREMENT_ID)?.trim() : null) ||
        import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim() ||
        DEFAULT_FIREBASE_CONFIG.measurementId,
    };
  }

  /**
   * Checks whether all mandatory Firebase Web SDK credentials are present.
   * Required for Google Auth: apiKey, authDomain, projectId, appId.
   */
  public static isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(
      config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.appId
    );
  }

  /**
   * Returns a list of required variable names that are currently missing.
   */
  public static getMissingKeys(): string[] {
    const config = this.getConfig();
    const missing: string[] = [];

    if (!config.apiKey) missing.push('VITE_FIREBASE_API_KEY');
    if (!config.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
    if (!config.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
    if (!config.appId) missing.push('VITE_FIREBASE_APP_ID');

    return missing;
  }

  /**
   * Save configuration to localStorage
   */
  public static setConfig(values: Partial<FirebaseConfigValues>): void {
    if (values.apiKey !== undefined) {
      if (values.apiKey.trim()) localStorage.setItem(STORAGE_KEYS.API_KEY, values.apiKey.trim());
      else localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
    if (values.authDomain !== undefined) {
      if (values.authDomain.trim()) localStorage.setItem(STORAGE_KEYS.AUTH_DOMAIN, values.authDomain.trim());
      else localStorage.removeItem(STORAGE_KEYS.AUTH_DOMAIN);
    }
    if (values.projectId !== undefined) {
      if (values.projectId.trim()) localStorage.setItem(STORAGE_KEYS.PROJECT_ID, values.projectId.trim());
      else localStorage.removeItem(STORAGE_KEYS.PROJECT_ID);
    }
    if (values.storageBucket !== undefined) {
      if (values.storageBucket.trim()) localStorage.setItem(STORAGE_KEYS.STORAGE_BUCKET, values.storageBucket.trim());
      else localStorage.removeItem(STORAGE_KEYS.STORAGE_BUCKET);
    }
    if (values.messagingSenderId !== undefined) {
      if (values.messagingSenderId.trim()) localStorage.setItem(STORAGE_KEYS.MESSAGING_SENDER_ID, values.messagingSenderId.trim());
      else localStorage.removeItem(STORAGE_KEYS.MESSAGING_SENDER_ID);
    }
    if (values.appId !== undefined) {
      if (values.appId.trim()) localStorage.setItem(STORAGE_KEYS.APP_ID, values.appId.trim());
      else localStorage.removeItem(STORAGE_KEYS.APP_ID);
    }
    if (values.measurementId !== undefined) {
      if (values.measurementId.trim()) localStorage.setItem(STORAGE_KEYS.MEASUREMENT_ID, values.measurementId.trim());
      else localStorage.removeItem(STORAGE_KEYS.MEASUREMENT_ID);
    }
  }

  /**
   * Clear all localStorage overrides
   */
  public static clearCustomConfig(): void {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.removeItem(STORAGE_KEYS.AUTH_DOMAIN);
    localStorage.removeItem(STORAGE_KEYS.PROJECT_ID);
    localStorage.removeItem(STORAGE_KEYS.STORAGE_BUCKET);
    localStorage.removeItem(STORAGE_KEYS.MESSAGING_SENDER_ID);
    localStorage.removeItem(STORAGE_KEYS.APP_ID);
    localStorage.removeItem(STORAGE_KEYS.MEASUREMENT_ID);
  }
}
