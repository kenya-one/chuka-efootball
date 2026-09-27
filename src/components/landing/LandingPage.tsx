import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Eye,
  ScrollText,
  Shield,
  Smartphone,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ThemeMode, MatchRule, GoogleAuthUser } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { FirebaseSetupModal } from '../auth/FirebaseSetupModal';
import { UnauthorizedDomainModal } from '../auth/UnauthorizedDomainModal';
import { FirebaseAuthService } from '../../services/firebaseAuthService';
import { TournamentAdminService } from '../../services/tournamentAdminService';
import { KonamiLogo } from '../common/KonamiLogo';
import { EFootballLogo } from '../common/EFootballLogo';
import { OfficialBrandBanner } from '../common/OfficialBrandBanner';
import { CHUKA_CREST_URL, CHUKA_CREST_FALLBACK } from '../common/ChukaOfficialCrest';

interface LandingPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onGoogleSuccess: (user: GoogleAuthUser) => void;
  onEnterGuestMode: () => void;
  onOpenRules: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  onToggleTheme,
  onGoogleSuccess,
  onEnterGuestMode,
  onOpenRules,
}) => {
  const isDark = theme === 'dark';
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState('');

  useEffect(() => {
    TournamentAdminService.getWhatsAppGroups()
      .then((groups) => {
        if (groups && groups.length > 0) {
          const activeGroup = groups.find((g) => g.active !== false && Boolean(g.group_url));
          if (activeGroup) {
            setWhatsappLink(activeGroup.group_url);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleGoogleClick = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    setIsSigningIn(true);

    try {
      const result = await FirebaseAuthService.signInWithGoogle();

      if (result.needsConfig) {
        setShowConfigModal(true);
      } else if (result.success && result.user) {
        onGoogleSuccess(result.user);
      } else if (result.errorCode === 'auth/unauthorized-domain' || result.unauthorizedDomain) {
        const domain =
          result.unauthorizedDomain ||
          (typeof window !== 'undefined' ? window.location.hostname : '');
        setUnauthorizedDomain(domain);
        setAuthErrorCode('auth/unauthorized-domain');
        setAuthError(result.error || 'Firebase unauthorized domain error.');
        setShowUnauthorizedModal(true);
      } else if (result.error) {
        setAuthError(result.error);
        if (result.errorCode) setAuthErrorCode(result.errorCode);
      }
    } catch (err) {
      console.error('[Google Sign-In Trigger Error]:', err);
      setAuthError('Unable to complete Google Sign-In. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      id="landing-container"
      className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden selection:bg-[#22c55e] selection:text-black"
    >
      {/* Background Esports Glow Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[560px] h-[340px] sm:h-[560px] bg-[#22c55e]/10 rounded-full blur-[100px] sm:blur-[140px]" />
        <div className="absolute -top-24 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-0 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Bar Controls: PWA Install & Theme Switch */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        {/* Top Corner: Chuka Logo & Official Badges */}
        <div className="flex items-center gap-2.5">
          <img
            src={CHUKA_CREST_URL}
            alt="Chuka University Crest"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = CHUKA_CREST_FALLBACK;
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain border border-[#22c55e]/40 shadow-sm"
          />
          <div className="flex flex-col text-left">
            <span
              className="text-xs sm:text-sm font-bold tracking-widest text-[#22c55e] uppercase leading-none"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              CHUKA eFOOTBALL
            </span>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">
              University Esports
            </span>
          </div>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <div className="hidden sm:flex items-center gap-2">
            <KonamiLogo className="h-5" />
            <EFootballLogo theme={theme} className="scale-75 origin-left" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            id="landing-theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
              isDark
                ? 'text-yellow-400 hover:bg-white/10 border border-white/10'
                : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center Landing Hero: Official Logo Prominently Centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-lg mx-auto w-full text-center">
        {/* Official Logo Display with Neon-Lime Esports Aura */}
        <div className="relative mb-6 sm:mb-8 group select-none">
          <div className="absolute inset-0 rounded-full bg-[#22c55e]/25 blur-2xl group-hover:bg-[#22c55e]/35 transition-all duration-500 scale-105" />
          <div className="relative p-2 rounded-3xl bg-gradient-to-b from-[#22c55e]/30 via-transparent to-[#22c55e]/10 border border-[#22c55e]/40 shadow-[0_0_35px_rgba(34,197,94,0.2)] backdrop-blur-md">
            <img
              src="https://kenya-one.github.io/chuka-efootball/logo.jpg"
              alt="Official eFootball Tournament Logo"
              referrerPolicy="no-referrer"
              className="w-40 h-40 sm:w-52 sm:h-52 object-contain rounded-2xl drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Esports Typography Title */}
        <div className="space-y-1.5 mb-8">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-white"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            CHUKA <span className="text-[#22c55e]">eFOOTBALL</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium tracking-wide text-gray-400 uppercase">
            Official University eFootball Esports Hub
          </p>
        </div>

        {/* Action Controls Section */}
        <div className="w-full space-y-3 max-w-sm mx-auto">
          {/* Auth Error Notification */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex flex-col gap-2 text-left animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1">
                  <span>{authError}</span>
                </div>
              </div>

              {authErrorCode === 'auth/unauthorized-domain' ? (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-red-500/20">
                  <button
                    type="button"
                    onClick={() => setShowUnauthorizedModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs tracking-wide text-center cursor-pointer transition-colors"
                  >
                    Authorize Domain in Firebase Console
                  </button>
                </div>
              ) : authError.includes('configured') ? (
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="block mt-1 text-[#22c55e] font-semibold underline hover:text-white cursor-pointer"
                >
                  Open Firebase Setup Guide
                </button>
              ) : null}
            </div>
          )}

          {/* Real Google Sign-In Button via Firebase Auth */}
          <button
            id="google-signin-btn"
            type="button"
            disabled={isSigningIn}
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white hover:bg-gray-100 disabled:opacity-75 text-gray-900 font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer border border-gray-200 group select-none"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
                <span className="font-semibold text-gray-800">Connecting Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-semibold text-gray-800">Sign In with Google</span>
              </>
            )}
          </button>

          {/* GUEST MODE Button (Section 2 Requirement) */}
          <button
            id="guest-mode-btn"
            type="button"
            onClick={onEnterGuestMode}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-white/15 hover:border-[#22c55e]/50 bg-black/40 hover:bg-white/5 text-gray-300 hover:text-white font-semibold text-xs tracking-wide transition-all cursor-pointer select-none"
          >
            <Eye className="w-4 h-4 text-[#22c55e]" />
            <span>ENTER AS GUEST (BROWSE ONLY)</span>
          </button>

          {/* 📜 MATCH RULES Prominent Button/Card (Section 2 Requirement) */}
          <button
            id="match-rules-landing-card"
            type="button"
            onClick={onOpenRules}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#121b13] to-[#0e1610] border border-[#22c55e]/35 hover:border-[#22c55e] text-left transition-all cursor-pointer group shadow-lg select-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>📜 MATCH RULES</span>
                    <span className="text-[10px] text-[#22c55e] font-normal lowercase">(official)</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    🏆 Knockout Rules & 🥇 League Rules
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#22c55e] group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Official Publisher & Tournament Accreditation Banner */}
        <div className="mt-8 w-full max-w-sm">
          <OfficialBrandBanner theme={theme} variant="compact" className="w-full justify-center" />
        </div>
      </main>

      {/* Landing Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Powered by Google Sheets + Apps Script</span>
          <span>•</span>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#22c55e] transition-colors inline-flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Official Community</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span>Help Desk: Sidney Wafula (0180752220)</span>
        </div>
      </footer>

      {/* Firebase Authentication Configuration Setup Modal */}
      <FirebaseSetupModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfigured={() => {
          setShowConfigModal(false);
          handleGoogleClick();
        }}
      />

      {/* Firebase Unauthorized Domain Modal */}
      <UnauthorizedDomainModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
        domain={unauthorizedDomain}
      />
    </div>
  );
};

