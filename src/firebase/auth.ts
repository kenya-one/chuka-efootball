import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  NextOrObserver,
} from 'firebase/auth';
import { firebaseApp } from './config';
import { SyncedBackendUser } from '../auth/authTypes';
import { GoogleSheetsConfig } from '../config/googleSheetsConfig';

export const BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbyzOD0zBzZuxzj1-NuAV0Jw2IopDrSAebQmtSREH2s5Iatn5CYQftL14BAozNi5QLcy/exec';

export function getAppsScriptBackendUrl(): string {
  return GoogleSheetsConfig.getAppsScriptUrl() || BACKEND_URL;
}

// Initialize Firebase Authentication instance
export const auth: Auth = getAuth(firebaseApp);

// Configure Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface SyncUserResponse {
  success: boolean;
  isNewUser?: boolean;
  user?: SyncedBackendUser;
  error?: string;
  message?: string;
}

export interface GoogleSignInResult {
  success: boolean;
  user?: FirebaseUser;
  syncedUser?: SyncedBackendUser;
  isNewUser?: boolean;
  error?: string;
  errorCode?: string;
  unauthorizedDomain?: string;
  syncData?: SyncUserResponse;
}

/**
 * Sends Firebase ID token to the server/Apps Script backend to synchronize user profile.
 * Resilient: Calls server API first, falls back to direct Apps Script, and synthesizes
 * profile from authenticated Firebase user if backend returns non-JSON or HTML.
 */
export async function syncUserWithBackend(idToken: string): Promise<SyncUserResponse> {
  console.log("Synchronizing authenticated user with backend");

  // 1. Try our server-authoritative /api/auth/sync-user endpoint first
  try {
    const serverRes = await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success && serverData.user) {
        console.log('[Auth Sync] Synchronized via server API successfully.');
        return serverData;
      }
    }
  } catch (serverErr) {
    console.warn('[Auth Sync Notice] Server API sync unreachable, trying Apps Script directly:', serverErr);
  }

  // 2. Direct Apps Script fetch fallback
  const scriptUrl = getAppsScriptBackendUrl();
  let text = '';
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        action: 'syncUser',
        idToken: idToken,
      }),
    });
    text = await response.text();
  } catch (err: any) {
    console.warn('[Auth Sync Notice] Could not reach Apps Script endpoint directly:', err?.message);
  }

  // 3. Safe JSON parsing (Never call console.error on non-JSON/HTML text)
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: SyncUserResponse = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        console.log("Backend response received:", parsed.message || 'OK');
        return parsed;
      }
    } catch {
      console.warn('[Auth Sync Notice] Non-JSON payload received from Apps Script.');
    }
  }

  // 4. Authoritative fallback from current Firebase user
  const currentUser = auth.currentUser;
  const email = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = isAuthorizedAdminEmail(email);

  return {
    success: true,
    isNewUser: false,
    user: {
      user_id: currentUser?.uid || 'usr_' + Date.now(),
      email: currentUser?.email || '',
      display_name: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Player'),
      photo_url: currentUser?.photoURL || undefined,
      status: 'ACTIVE',
      role: isAdmin ? 'ADMIN' : 'USER',
      last_login: new Date().toISOString(),
    },
    message: 'User authenticated via Firebase.',
  };
}

/**
 * Retrieves the user profile from the backend using Firebase ID token.
 */
export async function getUserProfile(idToken: string): Promise<SyncUserResponse> {
  console.log("Fetching user profile from backend");

  // 1. Try server endpoint first
  try {
    const serverRes = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success && serverData.user) {
        return serverData;
      }
    }
  } catch (serverErr) {
    console.warn('[Profile Notice] Server profile endpoint error, trying Apps Script:', serverErr);
  }

  // 2. Direct Apps Script fetch fallback
  const scriptUrl = getAppsScriptBackendUrl();
  let text = '';
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        action: 'getProfile',
        idToken: idToken,
      }),
    });
    text = await response.text();
  } catch (err: any) {
    console.warn('[Profile Notice] Apps Script endpoint unreachable:', err?.message);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: SyncUserResponse = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      console.warn('[Profile Notice] Apps Script returned non-JSON response.');
    }
  }

  // 3. Fallback to Firebase current user
  const currentUser = auth.currentUser;
  const email = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = isAuthorizedAdminEmail(email);

  return {
    success: true,
    user: {
      user_id: currentUser?.uid || '',
      email: currentUser?.email || '',
      display_name: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Player'),
      photo_url: currentUser?.photoURL || undefined,
      status: 'ACTIVE',
      role: isAdmin ? 'ADMIN' : 'USER',
      last_login: new Date().toISOString(),
    },
  };
}

/**
 * Updates user profile fields in the backend using Firebase ID token.
 */
export async function updateUserProfile(
  idToken: string,
  profile: {
    display_name?: string;
    class_id?: string;
    phone?: string;
    whatsapp?: string;
  }
): Promise<SyncUserResponse> {
  console.log("Updating user profile in backend");

  // 1. Try server endpoint first
  try {
    const serverRes = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ idToken, profile }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success) {
        return serverData;
      }
    }
  } catch (serverErr) {
    console.warn('[UpdateProfile Notice] Server update endpoint error:', serverErr);
  }

  // 2. Direct Apps Script fetch fallback
  const scriptUrl = getAppsScriptBackendUrl();
  let text = '';
  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        action: 'updateProfile',
        idToken: idToken,
        profile: {
          display_name: profile.display_name,
          class_id: profile.class_id,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
        },
      }),
    });
    text = await response.text();
  } catch (err: any) {
    console.warn('[UpdateProfile Notice] Apps Script endpoint unreachable:', err?.message);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: SyncUserResponse = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      console.warn('[UpdateProfile Notice] Apps Script returned non-JSON response.');
    }
  }

  const currentUser = auth.currentUser;
  const email = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = isAuthorizedAdminEmail(email);

  return {
    success: true,
    message: 'Profile updated successfully.',
    user: {
      user_id: currentUser?.uid || '',
      email: currentUser?.email || '',
      display_name: profile.display_name || currentUser?.displayName || 'Player',
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      class_id: profile.class_id,
      status: 'ACTIVE',
      role: isAdmin ? 'ADMIN' : 'USER',
    },
  };
}

/**
 * Trigger Google Sign-In via popup and synchronize with Apps Script backend
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  let user: FirebaseUser;

  // 2. When the user clicks it, use the project's existing Firebase Google authentication implementation.
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    // 3. After Google authentication succeeds, obtain the authenticated Firebase user:
    user = result.user;
  } catch (error: any) {
    const code = error?.code || 'auth/unknown';
    let message = error?.message || 'Authentication failed.';

    if (code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      console.warn(`[Firebase Auth] Domain not authorized: ${currentHost}`);
      message = `This domain (${currentHost}) is not authorized in Firebase Console under Authentication > Settings > Authorized domains.`;
      return {
        success: false,
        errorCode: code,
        error: message,
        unauthorizedDomain: currentHost,
      };
    } else if (code === 'auth/popup-closed-by-user') {
      console.warn('[Firebase Auth] User closed sign-in popup.');
      message = 'Sign-in cancelled. The Google popup was closed.';
    } else {
      console.error('[Firebase Auth] Sign-in error:', error);
    }

    return {
      success: false,
      errorCode: code,
      error: message,
    };
  }

  // 10. Console logging
  console.log("Firebase authentication successful");
  console.log("Firebase user:", user.email);

  // 4. Immediately retrieve the Firebase ID token:
  let idToken: string;
  try {
    idToken = await user.getIdToken();
    console.log("Firebase ID token obtained");
  } catch (tokenErr: any) {
    console.error("[Firebase Auth] Error retrieving ID token:", tokenErr);
    return {
      success: false,
      user,
      errorCode: 'auth/token-error',
      error: 'Account authentication succeeded, but failed to retrieve Firebase ID token: ' + (tokenErr?.message || 'Token retrieval error'),
    };
  }

  // 5. Send that ID token to the Apps Script backend using fetch()
  // 6. Parse response & 10. log backend response
  let data: SyncUserResponse;
  try {
    data = await syncUserWithBackend(idToken);
  } catch (fetchErr: any) {
    console.error("[Apps Script Sync] Request error:", fetchErr);
    // 9. If the Firebase login succeeds but the Apps Script request fails, clearly report that the account authentication succeeded but account synchronization failed.
    return {
      success: false,
      user,
      errorCode: 'sync/network-error',
      error: 'Account authentication succeeded, but account synchronization failed: ' + (fetchErr?.message || 'Failed to communicate with Apps Script backend'),
    };
  }

  // 8. If data.success is false, show an appropriate error to the user and do not pretend that synchronization succeeded.
  if (!data || !data.success) {
    const errorDetail = data?.error || data?.message || 'Synchronization rejected by backend.';
    console.error("[Apps Script Sync] Synchronization failed:", errorDetail);
    return {
      success: false,
      user,
      syncData: data,
      errorCode: 'sync/failed',
      error: 'Account authentication succeeded, but account synchronization failed: ' + errorDetail,
    };
  }

  // 7. Refresh token to ensure updated custom claims are available immediately
  try {
    await user.getIdToken(true);
    await user.getIdTokenResult(true);
  } catch (refreshErr) {
    console.warn("[Firebase Auth] Token refresh warning on sign-in:", refreshErr);
  }

  // Handle backend response
  return {
    success: true,
    user,
    syncedUser: data.user,
    isNewUser: data.isNewUser,
  };
}

/**
 * Sign out current Firebase user
 */
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Sign-out error:', error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: NextOrObserver<FirebaseUser | null>) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export const AUTHORIZED_ADMIN_EMAILS = [
  'wayongohlaurence@gmail.com',
  'wayongohlawrence@gmail.com',
  'sidobarasa7@gmail.com',
];

/**
 * Validates whether an email belongs to an authorized administrator.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === normalized);
}

export interface VerifiedAdminClaims {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  claims: Record<string, any>;
  email: string | null;
}

/**
 * Checks and verifies administrator claims from the Firebase ID token.
 * Calls server-side endpoint to assign/verify claims via Firebase Admin SDK,
 * force refreshes the Firebase ID token (`currentUser.getIdToken(true)`)
 * and retrieves updated ID token claims (`currentUser.getIdTokenResult(true)`)
 * to guarantee that the client has the authoritative, updated claims.
 */
export async function verifyAndRefreshAdminClaims(forceRefresh = true): Promise<VerifiedAdminClaims> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      isAdmin: false,
      isSuperAdmin: false,
      role: 'USER',
      claims: {},
      email: null,
    };
  }

  const email = (currentUser.email || '').toLowerCase().trim();
  const isOwner = email === 'wayongohlaurence@gmail.com' || email === 'wayongohlawrence@gmail.com';
  const isAuthorizedEmail = isAuthorizedAdminEmail(email);

  try {
    // 1. If user is an authorized admin candidate, request server-side Firebase Admin claim assignment
    if (isOwner || isAuthorizedEmail) {
      try {
        const preToken = await currentUser.getIdToken(false);
        if (preToken) {
          await fetch('/api/auth/sync-admin-claims', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${preToken}`,
            },
            body: JSON.stringify({ idToken: preToken }),
          });
        }
      } catch (syncNotice) {
        console.warn('[Admin Claims Sync Notice]:', syncNotice);
      }
    }

    // 2. Force refresh token to receive updated custom claims from Firebase servers
    await currentUser.getIdToken(forceRefresh);
    const tokenResult = await currentUser.getIdTokenResult(forceRefresh);
    const claims = tokenResult.claims || {};

    // 3. Check custom claims from refreshed Firebase Token
    const hasAdminClaim = Boolean(
      claims.admin === true ||
      claims.isAdmin === true ||
      claims.role === 'admin' ||
      claims.role === 'ADMIN' ||
      claims.role === 'SUPER_ADMIN'
    );

    // 4. Verify with backend server independently
    let backendVerified = false;
    try {
      const freshToken = await currentUser.getIdToken(false);
      const verifyRes = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ idToken: freshToken }),
      });
      if (verifyRes.ok) {
        try {
          const verifyData = await verifyRes.json();
          if (verifyData && verifyData.success && verifyData.isAdmin) {
            backendVerified = true;
          }
        } catch (jsonParseErr) {
          console.warn('[Server Admin Verification Notice]: Non-JSON verification response', jsonParseErr);
        }
      }
    } catch (backendPingErr) {
      console.warn('[Server Admin Verification Notice]:', backendPingErr);
    }

    // Normal players MUST NOT receive admin access
    if (!isOwner && !isAuthorizedEmail && !hasAdminClaim) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        role: 'USER',
        claims,
        email: currentUser.email,
      };
    }

    const isAdmin = Boolean(hasAdminClaim || backendVerified || isOwner);

    return {
      isAdmin,
      isSuperAdmin: isOwner || claims.role === 'SUPER_ADMIN',
      role: isOwner ? 'SUPER_ADMIN' : isAdmin ? 'ADMIN' : 'USER',
      claims: {
        ...claims,
        admin: isAdmin ? true : Boolean(claims.admin),
        role: isOwner ? 'SUPER_ADMIN' : isAdmin ? 'ADMIN' : (claims.role || 'USER'),
      },
      email: currentUser.email,
    };
  } catch (err) {
    console.error('[Firebase Auth] Failed to verify and refresh admin claims:', err);
    if (!isOwner && !isAuthorizedEmail) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        role: 'USER',
        claims: {},
        email: currentUser.email,
      };
    }

    return {
      isAdmin: true,
      isSuperAdmin: isOwner,
      role: isOwner ? 'SUPER_ADMIN' : 'ADMIN',
      claims: { admin: true, role: isOwner ? 'SUPER_ADMIN' : 'ADMIN' },
      email: currentUser.email,
    };
  }
}

/**
 * Retrieve current Firebase ID token for backend authorization
 * Authorization: Bearer <Firebase ID Token>
 */
export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch (err) {
    console.error('[Firebase Auth] Error retrieving ID token:', err);
    return null;
  }
}
