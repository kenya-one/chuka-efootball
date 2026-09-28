import React from 'react';
import { MessageCircle, Trophy, Award, User, ArrowLeft, Sun, Moon, ScrollText } from 'lucide-react';
import { AppView, ThemeMode } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { KonamiLogo } from '../common/KonamiLogo';
import { EFootballLogo } from '../common/EFootballLogo';
import { CHUKA_CREST_URL, CHUKA_CREST_FALLBACK } from '../common/ChukaOfficialCrest';

interface AppNavigationProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onExitToLanding: () => void;
  isGuest: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  userGamerTag?: string;
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentView,
  onSelectView,
  onExitToLanding,
  isGuest,
  theme,
  onToggleTheme,
  userGamerTag,
}) => {
  const isDark = theme === 'dark';

  const navItems = [
    {
      id: 'whatsapp' as AppView,
      label: 'WHATSAPP HELP',
      shortLabel: 'Help',
      icon: MessageCircle,
      badge: 'Support',
    },
    {
      id: 'knockout' as AppView,
      label: 'KNOCKOUT',
      shortLabel: 'Knockout',
      icon: Trophy,
      badge: 'Cup',
    },
    {
      id: 'league' as AppView,
      label: 'LEAGUE',
      shortLabel: 'League',
      icon: Award,
      badge: 'Table',
    },
    {
      id: 'profile' as AppView,
      label: 'PROFILE',
      shortLabel: 'Profile',
      icon: User,
      badge: isGuest ? 'Guest' : (userGamerTag || 'Player'),
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Header Navigation Bar */}
      <header
        id="desktop-navigation-bar"
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#080c09]/90 border-white/10 text-white'
            : 'bg-white/90 border-gray-200 text-gray-900 shadow-sm'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Back to Landing */}
          <div className="flex items-center gap-3">
            <button
              id="back-to-landing-btn"
              type="button"
              onClick={onExitToLanding}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Landing</span>
            </button>

            <div className="flex items-center gap-2">
              <img
                src={CHUKA_CREST_URL}
                alt="Chuka eFootball Crest"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = CHUKA_CREST_FALLBACK;
                }}
                className="w-9 h-9 rounded-xl object-contain border border-[#22c55e]/40 shadow-sm"
              />
              <div>
                <span
                  className="font-bold text-sm tracking-wide block leading-none"
                  style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                >
                  CHUKA <span className="text-[#22c55e]">eFOOTBALL</span>
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-0.5">
                  University Esports League
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                <KonamiLogo className="h-5" />
                <EFootballLogo theme={theme} className="scale-75 origin-left" />
              </div>
            </div>
          </div>

          {/* Center 4 Main Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111612]/60 p-1.5 rounded-2xl border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#22c55e] text-black shadow-md shadow-[#22c55e]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: PWA Install + Theme Toggle + Identity Badge */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            {isGuest ? (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Guest Mode
              </span>
            ) : userGamerTag ? (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                {userGamerTag}
              </span>
            ) : null}

            <button
              id="app-theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDark
                  ? 'text-yellow-400 hover:bg-white/10 border border-white/10'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fixed for Mobile-First PWA Experience) */}
      <div
        id="mobile-bottom-navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-2 py-1.5 transition-colors ${
          isDark
            ? 'bg-[#080c09]/95 border-white/10'
            : 'bg-white/95 border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-[#22c55e]/15 text-[#22c55e]'
                    : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1 tracking-tight truncate max-w-full">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
