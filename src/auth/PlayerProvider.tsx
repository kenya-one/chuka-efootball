import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { Player, ProfileCompletion } from '../types';
import {
  getCurrentPlayer,
  ensurePlayer,
  syncPlayer,
  updatePlayerProfile,
  acceptRules,
  uploadSquadScreenshot,
  deleteSquadScreenshot,
  uploadProfilePhoto,
  EnsurePlayerPayload,
} from '../api/endpoints';

export interface PlayerContextType {
  player: Player | null;
  loading: boolean;
  profileExists: boolean | null;
  status: string;
  isVerified: boolean;
  isSuspended: boolean;
  rulesAccepted: boolean;
  rulesAcceptedAt: string | null;
  completion: ProfileCompletion | null;
  error: string | null;
  refreshPlayer: () => Promise<void>;
  registerNewPlayer: (payload: EnsurePlayerPayload) => Promise<{ success: boolean; player?: Player; error?: string }>;
  updateProfile: (data: Partial<Player>) => Promise<{ success: boolean; player?: Player; error?: string }>;
  acceptOfficialRules: () => Promise<{ success: boolean; error?: string }>;
  uploadSquad: (fileData: string, mimeType: string, fileName?: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  removeSquad: () => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (fileData: string, mimeType: string, fileName?: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  setPlayerData: (player: Player | null, completion?: ProfileCompletion | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

/**
 * Normalizes backend Player record with bidirectional aliases
 * Ensures that authoritative fields (FullName, PhoneNumber, WhatsAppNumber, FirebaseUID, SquadImageURL, RulesAccepted)
 * are always synced with UI aliases (DisplayName, Phone, WhatsApp, GoogleUID, SquadScreenshotURL, Verified).
 */
export function normalizePlayerRecord(raw: any): Player {
  if (!raw) return raw;
  const fullName = raw.FullName || raw.DisplayName || '';
  const phone = raw.PhoneNumber || raw.Phone || raw.WhatsAppNumber || raw.WhatsApp || '';
  const whatsApp = raw.WhatsAppNumber || raw.WhatsApp || raw.PhoneNumber || raw.Phone || '';
  const squadUrl = raw.SquadImageURL || raw.SquadImage || raw.SquadScreenshotURL || '';
  const squadId = raw.SquadImageFileID || raw.SquadScreenshotFileID || '';
  const uid = raw.FirebaseUID || raw.GoogleUID || '';
  const status = raw.Status ? String(raw.Status).toUpperCase() : 'PENDING';
  const rulesAccepted = Boolean(raw.RulesAccepted);

  return {
    ...raw,
    PlayerID: String(raw.PlayerID || ''),
    FirebaseUID: uid,
    GoogleUID: uid,
    Email: raw.Email || '',
    FullName: fullName,
    DisplayName: fullName,
    PhoneNumber: phone,
    Phone: phone,
    WhatsAppNumber: whatsApp,
    WhatsApp: whatsApp,
    eFootballUsername: String(raw.eFootballUsername || '').toUpperCase(),
    SquadImage: squadUrl,
    SquadImageURL: squadUrl,
    SquadImageFileID: squadId,
    SquadScreenshotURL: squadUrl,
    SquadScreenshotFileID: squadId,
    ProfilePhotoURL: raw.ProfilePhotoURL || raw.ProfileImage || '',
    ProfileImage: raw.ProfilePhotoURL || raw.ProfileImage || '',
    AvailableDays: raw.AvailableDays || '',
    AvailableTimes: raw.AvailableTimes || '',
    RulesAccepted: rulesAccepted,
    RulesAcceptedAt: raw.RulesAcceptedAt || '',
    Division: raw.Division || 'OPEN',
    Status: status as any,
    Verified: status === 'ACTIVE',
    CreatedAt: raw.CreatedAt || '',
    UpdatedAt: raw.UpdatedAt || '',
  };
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPlayer(null);
      setCompletion(null);
      setProfileExists(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getCurrentPlayer();
      if (res.success && res.data?.profileExists && res.data.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        setPlayer(normalized);
        setProfileExists(true);
        setCompletion(res.data.completion || null);
      } else if (user) {
        // Auto-sync player into Google Sheet using verified Google account details
        const googleName = (user.displayName || user.email?.split('@')[0] || 'Player').trim();
        const emailPrefix = (user.email?.split('@')[0] || 'PLAYER')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 10) || 'PLAYER';
        const randSuffix = Math.floor(100 + Math.random() * 900);
        const autoUsername = `${emailPrefix}_${randSuffix}`;

        const syncRes = await syncPlayer({
          uid: user.uid,
          email: user.email || '',
          displayName: googleName,
          username: autoUsername,
          phone: '',
          photoUrl: user.photoURL || '',
          division: 'OPEN',
        });

        if (syncRes.success && syncRes.data?.player) {
          const normalized = normalizePlayerRecord(syncRes.data.player);
          setPlayer(normalized);
          setProfileExists(true);
          setCompletion({
            percentage: 100,
            missingFields: [],
            isComplete: true,
          });
        } else {
          setPlayer(null);
          setProfileExists(false);
          setCompletion(null);
        }
      } else {
        setPlayer(null);
        setProfileExists(false);
        setCompletion(null);
      }
    } catch (err: any) {
      setPlayer(null);
      setProfileExists(false);
      setError(err?.message || 'Network error fetching player profile.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading) {
      fetchPlayer();
    }
  }, [authLoading, user?.uid, fetchPlayer]);

  const handleRegisterNewPlayer = useCallback(
    async (payload: EnsurePlayerPayload) => {
      setLoading(true);
      setError(null);
      try {
        const res = await ensurePlayer(payload);
        if (res.success && res.data?.player) {
          const normalized = normalizePlayerRecord(res.data.player);
          setPlayer(normalized);
          setProfileExists(true);
          setCompletion(res.data.completion || null);
          return { success: true, player: normalized };
        }
        const errMsg = res.error?.message || 'Player registration failed.';
        setError(errMsg);
        return { success: false, error: errMsg };
      } catch (err: any) {
        const errMsg = err?.message || 'Network error during player registration.';
        setError(errMsg);
        return { success: false, error: errMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleUpdateProfile = useCallback(
    async (data: Partial<Player>) => {
      setError(null);
      try {
        const res = await updatePlayerProfile(data);
        if (res.success && res.data?.player) {
          const normalized = normalizePlayerRecord(res.data.player);
          setPlayer(normalized);
          if (res.data.completion) setCompletion(res.data.completion);
          return { success: true, player: normalized };
        }
        const errMsg = res.error?.message || 'Failed to update player profile.';
        setError(errMsg);
        return { success: false, error: errMsg };
      } catch (err: any) {
        const errMsg = err?.message || 'Network error updating profile.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    },
    []
  );

  const handleAcceptRules = useCallback(async () => {
    try {
      const res = await acceptRules(true);
      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        setPlayer(normalized);
        return { success: true };
      }
      return { success: false, error: res.error?.message || 'Failed to record rules acceptance.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error accepting rules.' };
    }
  }, []);

  const handleUploadSquad = useCallback(
    async (fileData: string, mimeType: string, fileName?: string) => {
      try {
        const res = await uploadSquadScreenshot(fileData, mimeType, fileName);
        if (res.success && res.data?.player) {
          const normalized = normalizePlayerRecord(res.data.player);
          setPlayer(normalized);
          if (res.data.completion) setCompletion(res.data.completion);
          return { success: true, url: res.data.url };
        }
        return { success: false, error: res.error?.message || 'Failed to upload squad screenshot.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Network error uploading squad screenshot.' };
      }
    },
    []
  );

  const handleRemoveSquad = useCallback(
    async () => {
      try {
        const res = await deleteSquadScreenshot();
        if (res.success && res.data?.player) {
          const normalized = normalizePlayerRecord(res.data.player);
          setPlayer(normalized);
          if (res.data.completion) setCompletion(res.data.completion);
          return { success: true };
        }
        return { success: false, error: res.error?.message || 'Failed to remove squad screenshot.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Network error removing squad screenshot.' };
      }
    },
    []
  );

  const handleUploadAvatar = useCallback(
    async (fileData: string, mimeType: string, fileName?: string) => {
      try {
        const res = await uploadProfilePhoto(fileData, mimeType, fileName);
        if (res.success && res.data?.player) {
          const normalized = normalizePlayerRecord(res.data.player);
          setPlayer(normalized);
          if (res.data.completion) setCompletion(res.data.completion);
          return { success: true, url: res.data.url };
        }
        return { success: false, error: res.error?.message || 'Failed to upload profile photo.' };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Network error uploading profile photo.' };
      }
    },
    []
  );

  const status = player?.Status ? String(player.Status).toUpperCase() : profileExists === false ? 'UNREGISTERED' : 'PENDING';
  const isVerified = status === 'ACTIVE';
  const isSuspended = status === 'SUSPENDED';
  const rulesAccepted = Boolean(player?.RulesAccepted);
  const rulesAcceptedAt = player?.RulesAcceptedAt || null;

  const value = useMemo<PlayerContextType>(
    () => ({
      player,
      loading,
      profileExists,
      status,
      isVerified,
      isSuspended,
      rulesAccepted,
      rulesAcceptedAt,
      completion,
      error,
      refreshPlayer: fetchPlayer,
      registerNewPlayer: handleRegisterNewPlayer,
      updateProfile: handleUpdateProfile,
      acceptOfficialRules: handleAcceptRules,
      uploadSquad: handleUploadSquad,
      removeSquad: handleRemoveSquad,
      uploadAvatar: handleUploadAvatar,
      setPlayerData: (newPlayer: Player | null, newCompletion?: ProfileCompletion | null) => {
        setPlayer(newPlayer);
        setProfileExists(newPlayer !== null);
        if (newCompletion !== undefined) {
          setCompletion(newCompletion);
        }
      },
    }),
    [
      player,
      loading,
      profileExists,
      status,
      isVerified,
      isSuspended,
      rulesAccepted,
      rulesAcceptedAt,
      completion,
      error,
      fetchPlayer,
      handleRegisterNewPlayer,
      handleUpdateProfile,
      handleAcceptRules,
      handleUploadSquad,
      handleRemoveSquad,
      handleUploadAvatar,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
