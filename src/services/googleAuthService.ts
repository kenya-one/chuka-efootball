import { GoogleAuthUser } from '../types';

const STORAGE_KEY_AUTH_USER = 'chuka_google_auth_user';
const STORAGE_KEY_CLIENT_ID = 'chuka_google_client_id';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: { isNotDisplayed: boolean; isSkippedMoment: boolean }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle';
              width?: string;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export class GoogleAuthService {
  public static getStoredUser(): GoogleAuthUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static setStoredUser(user: GoogleAuthUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  }

  public static getClientId(): string {
    const custom = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (custom && custom.trim().length > 0) return custom.trim();
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  public static setClientId(clientId: string): void {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  }

  /**
   * Decodes a JWT token returned by Google Identity Services
   */
  public static parseJwt(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse JWT token', e);
      return null;
    }
  }

  /**
   * Initializes Google Identity Services if a Client ID is provided
   */
  public static initializeGIS(onSuccess: (user: GoogleAuthUser) => void): boolean {
    const clientId = this.getClientId();
    if (!clientId || !window.google?.accounts?.id) {
      return false;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => {
          if (res.credential) {
            const payload = this.parseJwt(res.credential);
            if (payload) {
              const authUser: GoogleAuthUser = {
                uid: String(payload.sub || `G-${Date.now()}`),
                email: String(payload.email || ''),
                displayName: String(payload.name || payload.email || 'Player'),
                photoURL: typeof payload.picture === 'string' ? payload.picture : undefined,
                idToken: res.credential,
              };
              this.setStoredUser(authUser);
              onSuccess(authUser);
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      return true;
    } catch (err) {
      console.warn('GIS initialization error:', err);
      return false;
    }
  }

  /**
   * Real Google Sign In trigger
   */
  public static triggerSignIn(
    onSuccess: (user: GoogleAuthUser) => void,
    onNeedsClientId: () => void
  ): void {
    const clientId = this.getClientId();
    if (!clientId) {
      onNeedsClientId();
      return;
    }

    const initialized = this.initializeGIS(onSuccess);
    if (initialized && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed || notification.isSkippedMoment) {
          // If One-tap is suppressed or blocked by browser policy, notify to check config
          onNeedsClientId();
        }
      });
    } else {
      onNeedsClientId();
    }
  }

  public static signOut(): void {
    this.setStoredUser(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}
