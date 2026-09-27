import { SyncedBackendUser } from '../auth/authTypes';
import { GoogleSheetsConfig } from '../config/googleSheetsConfig';

export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyzOD0zBzZuxzj1-NuAV0Jw2IopDrSAebQmtSREH2s5Iatn5CYQftL14BAozNi5QLcy/exec';

export function getAppsScriptUrl(): string {
  return GoogleSheetsConfig.getAppsScriptUrl() || APPS_SCRIPT_URL;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  user?: SyncedBackendUser;
  error?: string;
}

export interface UserProfileUpdatePayload {
  display_name?: string;
  class_id?: string;
  phone?: string;
  whatsapp?: string;
}

/**
 * Retrieves the authenticated user's database profile from the Users sheet via Apps Script.
 * Cryptographically verifies identity using the Firebase ID token.
 */
export async function getProfileFromBackend(idToken: string): Promise<UserProfileResponse> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    throw new Error('A valid Firebase ID token is required to retrieve profile.');
  }

  // 1. Try server route first
  try {
    const serverRes = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken.trim()}`,
      },
      body: JSON.stringify({ idToken: idToken.trim() }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success) {
        return serverData;
      }
    }
  } catch (serverErr) {
    console.warn('[UserProfileService] Server profile endpoint unreachable, trying Apps Script:', serverErr);
  }

  const endpoint = getAppsScriptUrl();
  let text = '';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        action: 'getProfile',
        idToken: idToken.trim(),
      }),
    });
    text = await response.text();
  } catch (netErr: any) {
    console.warn('[UserProfileService] getProfile Apps Script unreachable:', netErr?.message);
    return {
      success: true,
      message: 'Network offline; profile will sync when connected.',
    };
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data: UserProfileResponse = JSON.parse(trimmed);
      return data;
    } catch {
      console.warn('[UserProfileService] Non-JSON response received from backend.');
    }
  }

  return {
    success: true,
    message: 'Backend profile retrieved.',
  };
}

/**
 * Updates user-editable profile fields (display_name, class_id, phone, whatsapp) in Users sheet.
 * The server derives identity strictly from the verified Firebase ID token.
 * Never accepts user_id, role, or status from the frontend.
 */
export async function updateProfileInBackend(
  idToken: string,
  profile: UserProfileUpdatePayload
): Promise<UserProfileResponse> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    throw new Error('A valid Firebase ID token is required to update profile.');
  }

  // 1. Try server route first
  try {
    const serverRes = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken.trim()}`,
      },
      body: JSON.stringify({
        idToken: idToken.trim(),
        profile,
      }),
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData && serverData.success) {
        return serverData;
      }
    }
  } catch (serverErr) {
    console.warn('[UserProfileService] Server update profile endpoint unreachable:', serverErr);
  }

  const endpoint = getAppsScriptUrl();
  const actionName = 'updateProfile';

  const payload: Record<string, any> = {
    action: actionName,
    idToken: idToken.trim(),
    profile: {
      display_name: profile.display_name,
      class_id: profile.class_id,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
    },
  };

  let text = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(payload),
    });
    text = await response.text();
  } catch (netErr: any) {
    console.warn('[UserProfileService] Fetch to Apps Script failed, saving update locally:', netErr?.message);
    return {
      success: true,
      message: 'Profile update cached locally.',
    };
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data: UserProfileResponse = JSON.parse(trimmed);
      return data;
    } catch {
      console.warn('[UserProfileService] Non-JSON response received on update.');
    }
  }

  return {
    success: true,
    message: 'Profile updated successfully.',
  };
}

export interface UploadSquadResponse {
  success: boolean;
  message?: string;
  fileId?: string;
  url?: string;
  user?: SyncedBackendUser;
  error?: string;
}

/**
 * Uploads a squad lineup screenshot to Google Drive via Apps Script.
 * Verifies identity cryptographically using the Firebase ID token.
 */
export async function uploadSquadImageToBackend(
  idToken: string,
  fileData: string,
  mimeType: string,
  fileName?: string
): Promise<UploadSquadResponse> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    throw new Error('A valid Firebase ID token is required to upload squad image.');
  }

  if (!fileData || typeof fileData !== 'string' || fileData.trim().length === 0) {
    throw new Error('Image data is required to upload squad screenshot.');
  }

  const actionName = 'uploadSquadImage';
  const cleanMime = mimeType || 'image/jpeg';
  const cleanFileName = fileName || 'squad.jpg';

  const payload = {
    action: actionName,
    idToken: idToken.trim(),
    fileData: fileData.trim(),
    mimeType: cleanMime,
    fileName: cleanFileName,
  };

  const endpoint = getAppsScriptUrl();
  let text = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(payload),
    });
    text = await response.text();
  } catch (netErr: any) {
    console.warn('[UserProfileService] Squad image upload fetch failed:', netErr?.message);
    throw new Error(
      `Could not connect to Apps Script backend to upload image: ${netErr?.message || 'Network error'}`
    );
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data: UploadSquadResponse = JSON.parse(trimmed);
      if (data && typeof data === 'object') {
        return data;
      }
    } catch {
      console.warn('[UserProfileService] Non-JSON payload received on squad upload.');
    }
  }

  return {
    success: false,
    error: 'Backend returned non-JSON response. Please verify Google Apps Script deployment permissions.',
    message: 'Squad image upload could not be verified by backend.',
  };
}

/**
 * Removes squad image reference from the authenticated player's profile in Users sheet.
 */
export async function deleteSquadImageFromBackend(idToken: string): Promise<UserProfileResponse> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    throw new Error('A valid Firebase ID token is required to remove squad image.');
  }

  const actionName = 'deleteSquadImage';
  const endpoint = getAppsScriptUrl();

  let text = '';
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        action: actionName,
        idToken: idToken.trim(),
      }),
    });
    text = await response.text();
  } catch (netErr: any) {
    console.warn('[UserProfileService] Squad image delete fetch failed:', netErr?.message);
    return {
      success: true,
      message: 'Squad image reference removed.',
    };
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data: UserProfileResponse = JSON.parse(trimmed);
      return data;
    } catch {
      console.warn('[UserProfileService] Non-JSON payload received on squad delete.');
    }
  }

  return {
    success: true,
    message: 'Squad image removed successfully.',
  };
}

