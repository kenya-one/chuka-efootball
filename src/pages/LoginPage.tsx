import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Loader2, AlertCircle, Shield, CheckCircle, ExternalLink, HelpCircle, Copy, Check } from 'lucide-react';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { KonamiLogo } from '../components/common/KonamiLogo';
import { EFootballLogo } from '../components/common/EFootballLogo';
import { OfficialBrandBanner } from '../components/common/OfficialBrandBanner';
import { CHUKA_CREST_URL, CHUKA_CREST_FALLBACK } from '../components/common/ChukaOfficialCrest';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState(false);

  const copyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setDomainCopied(true);
    setTimeout(() => setDomainCopied(false), 2500);
  };

  const handleSignIn = async () => {
    setErrorMessage(null);
    setErrorCode(null);
    setUnauthorizedDomain(null);
    setIsSigningIn(true);

    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to authenticate with Google.');
        setErrorCode(result.errorCode || null);
        if (result.unauthorizedDomain) {
          setUnauthorizedDomain(result.unauthorizedDomain);
        }
      }
    } catch (err: any) {
      console.error('[Sign-in Error]:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred during Google Sign-In.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      id="login-page"
      className="min-h-screen w-full relative flex flex-col justify-between bg-[#080c09] text-gray-100 selection:bg-[#22c55e] selection:text-black"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      {/* Background Esports Glow Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[560px] h-[340px] sm:h-[560px] bg-[#22c55e]/10 rounded-full blur-[100px] sm:blur-[140px]" />
        <div className="absolute -top-24 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-0 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Bar Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
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
              Official Competition Platform
            </span>
          </div>
          <span className="text-gray-600 hidden sm:inline">•</span>
          <div className="hidden sm:flex items-center gap-2">
            <KonamiLogo className="h-5" />
            <EFootballLogo theme="dark" className="scale-75 origin-left" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full text-center">
        {/* Esports Crest / Logo */}
        <div className="relative mb-6 group select-none">
          <div className="absolute inset-0 rounded-full bg-[#22c55e]/25 blur-2xl group-hover:bg-[#22c55e]/35 transition-all duration-500 scale-105" />
          <div className="relative p-2 rounded-3xl bg-gradient-to-b from-[#22c55e]/30 via-transparent to-[#22c55e]/10 border border-[#22c55e]/40 shadow-[0_0_35px_rgba(34,197,94,0.2)] backdrop-blur-md">
            <img
             src="https://kenya-one.github.io/chuka-efootball/logo.jpg"
              alt="Official eFootball Tournament Logo"
              referrerPolicy="no-referrer"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-2xl drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Title & Platform Subtitle */}
        <div className="space-y-1 mb-6">
          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            CHUKA <span className="text-[#22c55e]">eFOOTBALL</span>
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            Player & Competition Authentication Portal
          </p>
        </div>

        {/* Card Body */}
        <div className="w-full bg-[#111712]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          <div className="text-left space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#22c55e]" />
              <span>Identity Verification</span>
            </h2>
            <p className="text-xs text-gray-400">
              Sign in with your Google account. Your identity is verified securely via Firebase Authentication.
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-left space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>

              {errorCode === 'auth/unauthorized-domain' && unauthorizedDomain && (
                <div className="mt-2.5 pt-2.5 border-t border-red-500/20 text-[11px] text-gray-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-amber-300">Authorize Domain in Firebase:</p>
                    <a
                      href="https://console.firebase.google.com/project/chuka-efootball-hub/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#22c55e] hover:underline font-semibold"
                    >
                      <span>Open Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-gray-400">
                    Google Sign-In requires your current preview domain to be whitelisted in Firebase Console:
                  </p>

                  <div className="flex items-center justify-between gap-2 bg-black/60 p-2 rounded-xl border border-white/5 font-mono text-[11px] text-[#22c55e]">
                    <span className="truncate select-all">{unauthorizedDomain}</span>
                    <button
                      type="button"
                      onClick={() => copyDomain(unauthorizedDomain)}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {domainCopied ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
                      <span>{domainCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <ol className="list-decimal list-inside space-y-1 text-gray-400 pl-0.5">
                    <li>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.</li>
                    <li>Click <strong>Add domain</strong> and paste the copied domain above.</li>
                    <li>Return here and click <strong>Continue with Google</strong> again.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <button
            id="google-signin-btn"
            type="button"
            disabled={isSigningIn}
            onClick={handleSignIn}
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
                <span className="font-semibold text-gray-800">Continue with Google</span>
              </>
            )}
          </button>

          {/* Secure Note */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>Firebase Authentication Web SDK</span>
          </div>
        </div>

        {/* Accreditation Banner */}
        <div className="mt-6 w-full max-w-sm">
          <OfficialBrandBanner theme="dark" variant="compact" className="w-full justify-center" />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 py-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Backend: Google Apps Script API</span>
          <span>•</span>
          <span>Google Sheets Database</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Project: chuka-efootball-hub</span>
        </div>
      </footer>
    </div>
  );
};
