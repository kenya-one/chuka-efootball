import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { AdminContextType, AdminState, AdminRole } from './authTypes';
import { getAuthTest } from '../api/endpoints';
import { verifyAndRefreshAdminClaims, isAuthorizedAdminEmail, auth } from '../firebase/auth';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const initialAdminState: AdminState = {
  isAdmin: false,
  isSuperAdmin: false,
  role: null,
  status: null,
  adminId: undefined,
  loading: true,
  error: null,
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [state, setState] = useState<AdminState>(initialAdminState);

  const checkAdminStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState({
        isAdmin: false,
        isSuperAdmin: false,
        role: null,
        status: null,
        adminId: undefined,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      // 3. Force refresh the Firebase ID token and retrieve verified claims
      const adminClaims = await verifyAndRefreshAdminClaims(true);

      const userEmail = (user.email || '').toLowerCase().trim();
      const isOwner = userEmail === 'wayongohlaurence@gmail.com' || userEmail === 'wayongohlawrence@gmail.com';
      const isAuthorizedEmail = isAuthorizedAdminEmail(userEmail);
      const hasTokenAdminClaim = Boolean(
        adminClaims.isAdmin ||
        adminClaims.claims?.admin === true ||
        adminClaims.claims?.role === 'admin' ||
        adminClaims.claims?.role === 'ADMIN'
      );

      // Verify with backend independently if possible
      let backendAdminConfirmed = false;
      try {
        const authTestRes = await getAuthTest();
        if (authTestRes && authTestRes.success && authTestRes.data?.admin?.isAdmin) {
          backendAdminConfirmed = true;
        }
      } catch (backendErr) {
        // Backend ping error is non-fatal if token claims or authorized email confirms admin
        console.warn('[AdminProvider] Backend auth-test check completed with notice:', backendErr);
      }

      const isAdmin = isAuthorizedEmail || hasTokenAdminClaim || backendAdminConfirmed;

      if (!isAdmin) {
        setState({
          isAdmin: false,
          isSuperAdmin: false,
          role: null,
          status: 'USER',
          adminId: undefined,
          loading: false,
          error: null,
        });
        return;
      }

      setState({
        isAdmin: true,
        isSuperAdmin: isOwner || adminClaims.isSuperAdmin,
        role: isOwner ? 'SUPER_ADMIN' : 'ADMIN',
        status: 'ACTIVE',
        adminId: user.syncedUser?.user_id || (isOwner ? 'ADM-OWNER-01' : 'ADM-MANAGER-01'),
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('[AdminProvider] Error verifying admin status:', err);
      // Fallback securely to authorized admin email list
      const userEmail = (user.email || '').toLowerCase().trim();
      const isOwner = userEmail === 'wayongohlaurence@gmail.com' || userEmail === 'wayongohlawrence@gmail.com';
      const isAuthorized = isAuthorizedAdminEmail(userEmail);

      setState({
        isAdmin: isAuthorized,
        isSuperAdmin: isOwner,
        role: isOwner ? 'SUPER_ADMIN' : isAuthorized ? 'ADMIN' : null,
        status: isAuthorized ? 'ACTIVE' : 'USER',
        adminId: isAuthorized ? (user.syncedUser?.user_id || 'ADM-OWNER-01') : undefined,
        loading: false,
        error: null,
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [authLoading, user?.uid, checkAdminStatus]);

  const contextValue = useMemo<AdminContextType>(
    () => ({
      ...state,
      refetchAdminStatus: checkAdminStatus,
    }),
    [state, checkAdminStatus]
  );

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
