export interface SyncedBackendUser {
  user_id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  class_id?: string;
  phone?: string;
  whatsapp?: string;
  status: string;
  role: 'ADMIN' | 'USER' | string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  squad_image_url?: string;
  squad_image_file_id?: string;
}

export interface UserProfileUpdatePayload {
  display_name?: string;
  class_id?: string;
  phone?: string;
  whatsapp?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
  role?: 'ADMIN' | 'USER' | string;
  isAdmin?: boolean;
  claims?: Record<string, any>;
  syncedUser?: SyncedBackendUser | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: SyncedBackendUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{
    success: boolean;
    error?: string;
    errorCode?: string;
    unauthorizedDomain?: string;
  }>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  getProfile: () => Promise<{
    success: boolean;
    user?: SyncedBackendUser;
    error?: string;
  }>;
  updateProfile: (profile: UserProfileUpdatePayload) => Promise<{
    success: boolean;
    user?: SyncedBackendUser;
    error?: string;
  }>;
  refreshProfile: () => Promise<SyncedBackendUser | null>;
  refreshAuthToken: (forceRefresh?: boolean) => Promise<any>;
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | null;

export interface AdminState {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  status: string | null;
  adminId?: string;
  loading: boolean;
  error: string | null;
}

export interface AdminContextType extends AdminState {
  refetchAdminStatus: () => Promise<void>;
}

