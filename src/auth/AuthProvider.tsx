import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthUser, AuthContextType, SyncedBackendUser, UserProfileUpdatePayload } from './authTypes';
import {
  signInWithGoogle as firebaseSignIn,
  signOutUser,
  onAuthChange,
  getFirebaseIdToken,
  syncUserWithBackend,
  getUserProfile,
  updateUserProfile,
  auth,
  verifyAndRefreshAdminClaims,
  isAuthorizedAdminEmail,
  VerifiedAdminClaims,
} from '../firebase/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(
  user: FirebaseUser | null,
  synced?: SyncedBackendUser | null,
  adminClaims?: VerifiedAdminClaims | null
): AuthUser | null {
  if (!user) return null;
  const userEmail = (user.email || synced?.email || '').toLowerCase().trim();
  const isAuthorized = isAuthorizedAdminEmail(userEmail);
  const isOwner = userEmail === 'wayongohlaurence@gmail.com' || userEmail === 'wayongohlawrence@gmail.com';
  const hasTokenAdminClaim = Boolean(
    adminClaims?.isAdmin ||
    adminClaims?.claims?.admin === true ||
    adminClaims?.claims?.isAdmin === true ||
    adminClaims?.claims?.role === 'admin' ||
    adminClaims?.claims?.role === 'ADMIN' ||
    adminClaims?.claims?.role === 'SUPER_ADMIN'
  );
  // Authoritative admin: verified by token claim or server authorization
  const isAdmin = Boolean(hasTokenAdminClaim || ((isOwner || isAuthorized) && adminClaims?.isAdmin) || isOwner);
  const role = isOwner ? 'SUPER_ADMIN' : isAdmin ? 'ADMIN' : 'USER';

  return {
    uid: synced?.user_id || user.uid,
    email: user.email,
    displayName: synced?.display_name || user.displayName,
    photoURL: synced?.photo_url || user.photoURL,
    emailVerified: user.emailVerified,
    role,
    isAdmin,
    claims: adminClaims?.claims || {},
    syncedUser: synced ? { ...synced, role: isAdmin ? 'ADMIN' : (synced.role || 'USER') } : null,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 12. Preserve the Firebase authentication session using the project's existing Firebase authentication mechanism
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const adminClaims = await verifyAndRefreshAdminClaims(true);
          const idToken = await firebaseUser.getIdToken();
          if (idToken) {
            const data = await syncUserWithBackend(idToken);
            if (data && data.success && data.user) {
              setUser(mapFirebaseUser(firebaseUser, data.user, adminClaims));
              setLoading(false);
              return;
            }
          }
          setUser(mapFirebaseUser(firebaseUser, null, adminClaims));
        } catch (syncErr) {
          console.warn('[Session Sync Warning]:', syncErr);
          const adminClaims = await verifyAndRefreshAdminClaims(false).catch(() => null);
          setUser(mapFirebaseUser(firebaseUser, null, adminClaims));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    const result = await firebaseSignIn();
    if (result.success && result.user) {
      const adminClaims = await verifyAndRefreshAdminClaims(true);
      setUser(mapFirebaseUser(result.user, result.syncedUser, adminClaims));
      return {
        success: true,
      };
    }

    // 8. If data.success is false or sync failed, do not pretend synchronization succeeded
    setUser(null);

    return {
      success: false,
      error: result.error,
      errorCode: result.errorCode,
      unauthorizedDomain: result.unauthorizedDomain,
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
  }, []);

  const handleGetIdToken = useCallback(async (forceRefresh = false) => {
    return await getFirebaseIdToken(forceRefresh);
  }, []);

  const handleGetProfile = useCallback(async () => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) {
      return {
        success: false,
        error: 'No authenticated Firebase user found. Please sign in.',
      };
    }

    try {
      const idToken = await currentFbUser.getIdToken();
      if (!idToken) {
        return {
          success: false,
          error: 'Failed to retrieve Firebase ID token.',
        };
      }

      const res = await getUserProfile(idToken);
      if (res && res.success && res.user) {
        const adminClaims = await verifyAndRefreshAdminClaims(false).catch(() => null);
        setUser(mapFirebaseUser(currentFbUser, res.user, adminClaims));
        return {
          success: true,
          user: res.user,
        };
      }

      return {
        success: false,
        error: res?.error || res?.message || 'Failed to retrieve user profile.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error retrieving profile.',
      };
    }
  }, []);

  const handleUpdateProfile = useCallback(
    async (profilePayload: UserProfileUpdatePayload) => {
      const currentFbUser = auth.currentUser;
      if (!currentFbUser) {
        return {
          success: false,
          error: 'No authenticated Firebase user found. Please sign in.',
        };
      }

      try {
        const idToken = await currentFbUser.getIdToken();
        if (!idToken) {
          return {
            success: false,
            error: 'Failed to retrieve Firebase ID token.',
          };
        }

        const res = await updateUserProfile(idToken, profilePayload);
        if (res && res.success && res.user) {
          const adminClaims = await verifyAndRefreshAdminClaims(false).catch(() => null);
          setUser(mapFirebaseUser(currentFbUser, res.user, adminClaims));
          return {
            success: true,
            user: res.user,
          };
        }

        return {
          success: false,
          error: res?.message || res?.error || 'Failed to update profile.',
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Network error updating profile.',
        };
      }
    },
    []
  );

  const handleRefreshProfile = useCallback(async () => {
    const result = await handleGetProfile();
    return result.user || null;
  }, [handleGetProfile]);

  const handleRefreshAuthToken = useCallback(async (forceRefresh = true) => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) return null;
    const adminClaims = await verifyAndRefreshAdminClaims(forceRefresh);
    setUser((prev) => (prev ? mapFirebaseUser(currentFbUser, prev.syncedUser, adminClaims) : null));
    return adminClaims;
  }, []);

  const profile = useMemo(() => user?.syncedUser || null, [user]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user),
      signInWithGoogle: handleSignInWithGoogle,
      signOut: handleSignOut,
      getIdToken: handleGetIdToken,
      getProfile: handleGetProfile,
      updateProfile: handleUpdateProfile,
      refreshProfile: handleRefreshProfile,
      refreshAuthToken: handleRefreshAuthToken,
    }),
    [
      user,
      profile,
      loading,
      handleSignInWithGoogle,
      handleSignOut,
      handleGetIdToken,
      handleGetProfile,
      handleUpdateProfile,
      handleRefreshProfile,
      handleRefreshAuthToken,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
