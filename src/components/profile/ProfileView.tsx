import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Phone,
  Key,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Copy,
  ExternalLink,
  Lock,
  Code2,
  RefreshCw,
  Server,
  FileSpreadsheet,
  Check,
  XCircle,
  HelpCircle,
  Flame,
  Globe,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { Player, GoogleAuthUser, ThemeMode } from '../../types';
import { GoogleSheetsService, ConnectionTestResult } from '../../services/googleSheetsService';
import { GoogleSheetsConfig } from '../../config/googleSheetsConfig';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../data/googleAppsScriptTemplate';
import { OfficialBrandBanner } from '../common/OfficialBrandBanner';
import { FirebaseAuthService, FirebaseAuthDiagnostic } from '../../services/firebaseAuthService';
import { FirebaseConfig } from '../../config/firebaseConfig';
import { FirebaseSetupModal } from '../auth/FirebaseSetupModal';

interface ProfileViewProps {
  authUser: GoogleAuthUser | null;
  currentPlayer: Player | null;
  isGuest: boolean;
  theme: ThemeMode;
  onSignOut: () => void;
  onPlayerRegistered: (player: Player) => void;
  onEnterSignIn: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  authUser,
  currentPlayer,
  isGuest,
  theme,
  onSignOut,
  onPlayerRegistered,
  onEnterSignIn,
}) => {
  const isDark = theme === 'dark';

  // Registration Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState(authUser?.displayName || '');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Sheets Config Panel State
  const [sheetIdInput, setSheetIdInput] = useState(GoogleSheetsConfig.getSheetId());
  const [scriptUrlInput, setScriptUrlInput] = useState(GoogleSheetsConfig.getAppsScriptUrl());
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Firebase Setup Modal & Diagnostics State
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [firebaseDiagnostic, setFirebaseDiagnostic] = useState<FirebaseAuthDiagnostic>(() =>
    FirebaseAuthService.getDiagnostic()
  );

  // Auto-refresh diagnostics
  const refreshDiagnostics = () => {
    setFirebaseDiagnostic(FirebaseAuthService.getDiagnostic());
  };

  useEffect(() => {
    refreshDiagnostics();
    if (GoogleSheetsConfig.getAppsScriptUrl()) {
      GoogleSheetsService.testConnection().then(setTestResult).catch(() => {});
    }
  }, []);

  // Update display name when authUser changes
  useEffect(() => {
    if (authUser?.displayName && !displayNameInput) {
      setDisplayNameInput(authUser.displayName);
    }
  }, [authUser]);

  // Live username availability check
  const handleUsernameBlur = async () => {
    const trimmed = usernameInput.trim().toUpperCase();
    if (!trimmed) {
      setUsernameTaken(false);
      return;
    }
    setIsCheckingUsername(true);
    try {
      const taken = await GoogleSheetsService.checkUsernameExists(trimmed);
      setUsernameTaken(taken);
      if (taken) {
        setRegError('⚠️ This eFootball username is already registered.');
      } else {
        setRegError(null);
      }
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim().toUpperCase();
    const cleanWhatsApp = whatsappInput.trim();

    if (!cleanUsername) {
      setRegError('eFootball username is required.');
      return;
    }
    if (!cleanWhatsApp) {
      setRegError('WhatsApp number is required for official match communication.');
      return;
    }
    if (!authUser) {
      setRegError('You must be signed in with Google to create your player profile.');
      return;
    }

    try {
      setIsSubmittingReg(true);
      setRegError(null);
      const res = await GoogleSheetsService.registerPlayer({
        eFootballUsername: cleanUsername,
        displayName: displayNameInput.trim() || authUser.displayName,
        whatsApp: cleanWhatsApp,
        googleUid: authUser.uid,
        profileImage: authUser.photoURL,
      });

      if (res.success && res.player) {
        onPlayerRegistered(res.player);
      } else {
        setRegError(res.error || 'Failed to complete player registration.');
      }
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration error.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleSaveConfig = () => {
    GoogleSheetsConfig.setSheetId(sheetIdInput);
    GoogleSheetsConfig.setAppsScriptUrl(scriptUrlInput);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleRunConnectionTest = async () => {
    setIsTestingConnection(true);
    GoogleSheetsConfig.setSheetId(sheetIdInput);
    GoogleSheetsConfig.setAppsScriptUrl(scriptUrlInput);

    try {
      const result = await GoogleSheetsService.testConnection(scriptUrlInput, sheetIdInput);
      setTestResult(result);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div id="profile-page" className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Official Brand Accreditation Strip */}
      <OfficialBrandBanner theme={theme} variant="compact" className="w-full justify-center" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
            <User className="w-3.5 h-3.5" />
            <span>Player Identity & Account</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mt-1"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            {isGuest
              ? 'Guest Overview'
              : currentPlayer
              ? 'Player Profile'
              : 'Complete Your Registration'}
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isGuest
              ? 'You are browsing in guest mode. Sign in to register an official gamertag and compete.'
              : currentPlayer
              ? 'Manage your eFootball credentials, private communication settings, and database synchronization.'
              : 'Link your Google authentication identity to your permanent eFootball gamer account.'}
          </p>
        </div>

        {/* Global Sign Out Button when authenticated */}
        {authUser && (
          <button
            type="button"
            id="profile-header-signout-btn"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out of Google</span>
          </button>
        )}
      </div>

      {/* Guest Mode Banner */}
      {isGuest && (
        <div
          className={`p-6 rounded-3xl border ${
            isDark
              ? 'bg-[#151c16] border-amber-500/30'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400">
                Browsing As Guest
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Unlock Official Competitions
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                Guests can view brackets, standings, and rules. To register for Knockout cups or enter league fixtures, sign in with Google.
              </p>
            </div>
            <button
              type="button"
              onClick={onEnterSignIn}
              className="px-6 py-3 rounded-xl bg-[#22c55e] text-black font-bold text-xs hover:bg-[#16a34a] transition-all cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      )}

      {/* Case 1: Authenticated but No Player Record yet -> Registration Form */}
      {!isGuest && authUser && !currentPlayer && (
        <div
          id="player-registration-form-card"
          className={`p-6 sm:p-8 rounded-3xl border ${
            isDark ? 'bg-[#111612] border-[#22c55e]/30 shadow-xl' : 'bg-white border-gray-200 shadow-md'
          }`}
        >
          <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Official Player Identity</h2>
              <p className="text-xs text-gray-400">
                Authenticated as: <strong className="text-white">{authUser.email}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterPlayer} className="space-y-5">
            {regError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {/* Public Identity: eFootball Username (Required) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                eFootball In-Game Username <span className="text-[#22c55e]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value.toUpperCase());
                    setUsernameTaken(false);
                    setRegError(null);
                  }}
                  onBlur={handleUsernameBlur}
                  placeholder="e.g. LAURENCE_WG"
                  className={`w-full rounded-xl bg-black/40 border px-4 py-3 text-sm text-white font-mono tracking-wider focus:outline-none ${
                    usernameTaken
                      ? 'border-red-500 text-red-300'
                      : 'border-white/10 focus:border-[#22c55e]'
                  }`}
                />
                {isCheckingUsername && (
                  <div className="absolute right-3 top-3.5">
                    <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Your public identity seen by all opponents. Enforced as unique (1 account per eFootball username).
              </p>
            </div>

            {/* Display Name (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="e.g. Laurence Wayongo"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-[#22c55e] focus:outline-none"
              />
            </div>

            {/* Private Communication: WhatsApp (Required) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                WhatsApp Phone Number <span className="text-[#22c55e]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="e.g. +254712345678 or 0712345678"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:border-[#22c55e] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#22c55e]">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  Strictly Private: Never displayed publicly to opponents or other players. Used solely by league officials for payment verification and match coordination.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-gray-400 space-y-1">
              <span className="text-gray-300 font-semibold block">Automatic Permanent Player ID:</span>
              <p>
                Your account will automatically receive a permanent internal Player ID (e.g. <span className="font-mono text-[#22c55e]">PLAYER-000001</span>). This identifier never changes.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmittingReg || usernameTaken}
              className="w-full py-3.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReg ? 'Registering Player...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      )}

      {/* Case 2: Registered Player Card */}
      {currentPlayer && (
        <div
          id="player-id-card"
          className={`p-6 sm:p-8 rounded-3xl border ${
            isDark
              ? 'bg-gradient-to-br from-[#111913] to-[#0c140e] border-[#22c55e]/40 shadow-[0_0_40px_rgba(34,197,94,0.1)]'
              : 'bg-white border-emerald-200 shadow-lg'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#22c55e]/20 border border-[#22c55e]/50 flex items-center justify-center text-[#22c55e] font-mono text-2xl font-black shadow-inner">
                {currentPlayer.eFootballUsername.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 uppercase">
                    {currentPlayer.Status}
                  </span>
                  <span className="text-xs text-gray-400">Verified eFootball Player</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider mt-0.5 font-mono">
                  {currentPlayer.eFootballUsername}
                </h2>
                {currentPlayer.DisplayName && (
                  <p className="text-xs text-gray-400">{currentPlayer.DisplayName}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* 4-Tier Identity Matrix Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs">
            {/* 1. Public Identity */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                1. Public Gaming Identity
              </span>
              <p className="font-mono text-sm font-bold text-[#22c55e]">
                {currentPlayer.eFootballUsername}
              </p>
              <p className="text-[10px] text-gray-500">
                Visible to all competitors in tournament fixtures, brackets, and league tables.
              </p>
            </div>

            {/* 2. Internal Identity */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                2. Internal Player ID (Permanent)
              </span>
              <p className="font-mono text-sm font-bold text-white">
                {currentPlayer.PlayerID}
              </p>
              <p className="text-[10px] text-gray-500">
                Format: PLAYER-000001. Internal database primary key. Never displayed on public competition pages.
              </p>
            </div>

            {/* 3. Private Communication Identity */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#22c55e]" />
                <span>3. Private WhatsApp (Protected)</span>
              </span>
              <p className="font-mono text-sm font-bold text-gray-200">
                {currentPlayer.WhatsApp}
              </p>
              <p className="text-[10px] text-gray-500">
                Strictly hidden from opponents and public view. Accessible only by league admins.
              </p>
            </div>

            {/* 4. Auth Identity */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                4. Google Authentication Identity
              </span>
              <p className="font-mono text-xs text-gray-300 truncate">
                {authUser?.email || currentPlayer.GoogleUID}
              </p>
              <p className="text-[10px] text-gray-500">
                Authentication token identity securing your gamer account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Case 3: Empty State for Players */}
      {!currentPlayer && isGuest && (
        <div className="p-6 text-center rounded-3xl border border-white/10 bg-black/20 text-gray-400 text-xs">
          No players registered yet on this device. Sign in with Google to create your official eFootball profile.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: FIREBASE AUTHENTICATION (GOOGLE SIGN-IN) DIAGNOSTICS CARD
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        id="firebase-auth-diagnostics-card"
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          isDark ? 'bg-[#111612] border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Firebase Authentication (Google Sign-In)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Auth Only
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Identity token provider for Real Google Sign-In &bull; No Firestore or paid databases
              </p>
            </div>
          </div>

          <button
            type="button"
            id="configure-firebase-btn"
            onClick={() => setShowFirebaseModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Configure Firebase Credentials</span>
          </button>
        </div>

        {/* Live Status Pill Header */}
        <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Firebase Auth Engine State:
            </span>
            <div className="flex items-center gap-2">
              {firebaseDiagnostic.isInitialized ? (
                firebaseDiagnostic.authState === 'signed_in' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                    <span>🟢 Firebase Initialized & User Signed In</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>🟡 Firebase Initialized (Ready for Login)</span>
                  </div>
                )
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>🔴 Firebase Not Initialized</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authUser ? (
              <button
                type="button"
                id="firebase-signout-btn"
                onClick={onSignOut}
                className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                id="firebase-signin-btn"
                onClick={onEnterSignIn}
                className="px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-black" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Point Firebase Checklist & Metadata */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Item 1: Initialized */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              1. SDK Initialized
            </span>
            <div className="flex items-center gap-1.5 font-bold">
              {firebaseDiagnostic.isInitialized ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-[#22c55e]">Yes (Active)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">No (Missing Config)</span>
                </>
              )}
            </div>
          </div>

          {/* Item 2: Provider */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              2. Google Provider
            </span>
            <div className="flex items-center gap-1.5 font-bold">
              {firebaseDiagnostic.googleProviderAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-[#22c55e]">Available</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400">Unavailable</span>
                </>
              )}
            </div>
          </div>

          {/* Item 3: Auth State */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              3. Auth State
            </span>
            <div className="flex items-center gap-1.5 font-bold uppercase">
              <span
                className={`font-mono text-xs ${
                  firebaseDiagnostic.authState === 'signed_in'
                    ? 'text-[#22c55e]'
                    : firebaseDiagnostic.authState === 'error'
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {firebaseDiagnostic.authState}
              </span>
            </div>
          </div>

          {/* Item 4: Masked UID */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              4. Masked Google UID
            </span>
            <p className="font-mono text-xs font-bold text-gray-200 truncate">
              {firebaseDiagnostic.currentUser?.maskedUid || 'None (Signed Out)'}
            </p>
          </div>
        </div>

        {/* Missing Credentials Alert banner if any */}
        {firebaseDiagnostic.missingKeys.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong>Missing Environment Variables:</strong>{' '}
              {firebaseDiagnostic.missingKeys.join(', ')}
              <p className="text-[11px] text-gray-400 mt-0.5">
                Click "Configure Firebase Credentials" above to enter your Firebase Web App credentials or add them to your environment.
              </p>
            </div>
          </div>
        )}

        {/* Firebase Last Error or Authorized Domain Notice */}
        {firebaseDiagnostic.lastError && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Firebase Notice:</strong> {firebaseDiagnostic.lastError}
              </div>
            </div>
            {firebaseDiagnostic.lastError.includes('domain') && (
              <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20 text-[11px]">
                <span className="text-gray-400">Current domain to authorize in Firebase Console:</span>
                <code className="bg-black/50 px-2 py-0.5 rounded text-emerald-400 font-mono">
                  {typeof window !== 'undefined' ? window.location.hostname : ''}
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: GOOGLE SHEETS DATABASE BRIDGE & LIVE CONNECTION TEST
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        id="google-sheets-setup-card"
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          isDark ? 'bg-[#111612] border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Google Sheets Database Connection
              </h3>
              <p className="text-xs text-gray-400">
                Architecture: GitHub PWA &rarr; Apps Script Web App /exec &rarr; Google Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScriptCode(!showScriptCode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-[#22c55e]" />
              <span>{showScriptCode ? 'Hide Apps Script' : 'View Code.gs Template'}</span>
            </button>
          </div>
        </div>

        {/* Live Status Pill Header - Part 5 Diagnostic */}
        <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Database Connection Diagnostic (GitHub App &rarr; Apps Script &rarr; Google Sheet):
            </span>
            <div className="flex items-center gap-2">
              {testResult?.connected ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                  <span>CONNECTED</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>NOT CONNECTED</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunConnectionTest}
            disabled={isTestingConnection}
            className="px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Diagnostic Test</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Results Box */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs space-y-3 ${
              testResult.connected
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.connected ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#22c55e]" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              )}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-wider">
                    {testResult.connected ? '🟢 CONNECTED' : '🔴 NOT CONNECTED'}
                  </span>
                  <span className="text-[11px] text-gray-300">— {testResult.message}</span>
                </div>
                {testResult.errorMessage && !testResult.connected && (
                  <div className="p-3 rounded-xl bg-black/50 border border-red-500/40 text-red-300 font-mono text-xs">
                    <strong className="text-red-400">Error:</strong> {testResult.errorMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-Step Diagnostic Chain: GitHub App → Apps Script → Google Sheet */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5">
                {testResult.appsScriptStatus === 'CONNECTED' ? (
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-white">GitHub App &rarr; Apps Script Web App</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {testResult.appsScriptStatus === 'CONNECTED'
                      ? 'CONNECTED: Apps Script endpoint responded successfully (?action=health).'
                      : 'NOT CONNECTED: Endpoint could not be reached. Verify /exec URL.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5">
                {testResult.sheetsStatus === 'CONNECTED' ? (
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-white">Apps Script &rarr; Google Sheet</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {testResult.sheetsStatus === 'CONNECTED'
                      ? 'CONNECTED: Public sheets verified (KnockoutTournaments, KnockoutMatches, LeagueStandings, MatchRules).'
                      : 'NOT CONNECTED: Sheets unreadable. Verify Sheet ID and sheet tab names.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Fields: GOOGLE_SHEET_ID & APPS_SCRIPT_WEB_APP_URL */}
        <div className="mt-6 space-y-5">
          {/* Field 1: GOOGLE_SHEET_ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>GOOGLE_SHEET_ID [WILL BE PROVIDED]</span>
              </label>
              <span className="text-[10px] text-gray-400">Spreadsheet ID</span>
            </div>
            <input
              type="text"
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value.trim())}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Extracted from your Google Sheet URL: <code className="text-gray-300 font-mono">docs.google.com/spreadsheets/d/<strong>&lt;GOOGLE_SHEET_ID&gt;</strong>/edit</code>
            </p>
          </div>

          {/* Field 2: APPS_SCRIPT_WEB_APP_URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>APPS_SCRIPT_WEB_APP_URL [WILL BE PROVIDED]</span>
              </label>
              <span className="text-[10px] text-gray-400">Endpoint URL (/exec)</span>
            </div>
            <input
              type="url"
              value={scriptUrlInput}
              onChange={(e) => setScriptUrlInput(e.target.value.trim())}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              The published deployment URL from Apps Script ending with <code className="text-[#22c55e] font-mono">/exec</code>. Deployed with <em>Execute as: Me</em> and <em>Who has access: Anyone</em>.
            </p>
          </div>

          {/* Save & Test Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{configSaved ? 'Config Saved!' : 'Save Configuration'}</span>
            </button>

            <button
              type="button"
              onClick={handleRunConnectionTest}
              disabled={isTestingConnection}
              className="px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>Save & Test Live Connection</span>
            </button>
          </div>

          {/* Setup Instructions & Copyable Apps Script Code */}
          {showScriptCode && (
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#22c55e]" />
                  <span>Google Apps Script Code (`Code.gs`)</span>
                </span>
                <button
                  type="button"
                  onClick={copyScriptCode}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-[#22c55e] text-black text-xs font-bold hover:bg-[#16a34a] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{codeCopied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-300 space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
                <p><strong>Step-by-step setup in Google Sheets:</strong></p>
                <ol className="list-decimal list-inside space-y-0.5 mt-1 text-gray-400">
                  <li>Open your Google Sheet or create a new one.</li>
                  <li>Click <strong>Extensions &gt; Apps Script</strong> in the top menu.</li>
                  <li>Paste the complete code below into <strong>Code.gs</strong>.</li>
                  <li>Run the <strong>setupSheets()</strong> function once in the toolbar to auto-create all 9 schemas.</li>
                  <li>Click <strong>Deploy &gt; New Deployment</strong>. Choose <strong>Web app</strong>.</li>
                  <li>Set: <em>Execute as: Me</em> and <em>Who has access: Anyone</em>.</li>
                  <li>Copy the resulting Web App URL (ends in <code className="text-[#22c55e]">/exec</code>) and paste it into the field above!</li>
                </ol>
              </div>

              <pre className="max-h-64 overflow-y-auto p-3.5 rounded-xl bg-[#080c09] text-gray-300 font-mono text-[10px] leading-relaxed border border-white/5">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Firebase Setup Modal */}
      <FirebaseSetupModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        onConfigured={() => {
          setShowFirebaseModal(false);
          refreshDiagnostics();
        }}
      />
    </div>
  );
};
