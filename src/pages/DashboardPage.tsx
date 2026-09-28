import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  Trophy,
  Award,
  User,
  Shield,
  LogOut,
  Sparkles,
  BookOpen,
  MessageCircle,
} from 'lucide-react';
import { KonamiLogo } from '../components/common/KonamiLogo';
import { EFootballLogo } from '../components/common/EFootballLogo';
import { OfficialBrandBanner } from '../components/common/OfficialBrandBanner';
import { CHUKA_CREST_URL, CHUKA_CREST_FALLBACK } from '../components/common/ChukaOfficialCrest';
import { PlayerProfileCard } from '../components/profile/PlayerProfileCard';
import { PlayerRegistrationCard } from '../components/profile/PlayerRegistrationCard';
import { AdminMasterHub } from '../components/admin/AdminMasterHub';
import { CompetitionList } from '../components/competitions/CompetitionList';
import { MyRegistrationsView } from '../components/competitions/MyRegistrationsView';
import { KnockoutView } from '../components/knockout/KnockoutView';
import { LeagueView } from '../components/league/LeagueView';
import { WhatsAppHelpView } from '../components/whatsapp/WhatsAppHelpView';
import { useAdmin } from '../auth/AdminProvider';
import { usePlayer } from '../auth/PlayerProvider';
import { AdminRoute } from '../auth/AdminRoute';
import { MatchRulesModal } from '../components/rules/MatchRulesModal';
import { InviteLandingModal } from '../components/invites/InviteLandingModal';

export type DashboardTab =
  | 'competitions'
  | 'knockout'
  | 'league'
  | 'my-competitions'
  | 'profile'
  | 'whatsapp'
  | 'admin-competitions'
  | 'admin';

export const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, role } = useAdmin();
  const {
    player,
    completion: profileCompletion,
    loading: profileLoading,
    profileExists,
    setPlayerData,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<DashboardTab>('competitions');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Sync URL hash / path for deep linking & strict AdminRoute interception
  useEffect(() => {
    const checkPath = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;

      if (path.includes('/admin/competitions') || hash === '#admin-competitions') {
        setActiveTab('admin-competitions');
      } else if (path.includes('/admin/players') || path.includes('/admin') || hash === '#admin') {
        setActiveTab('admin');
      } else if (path.includes('/cup') || path.includes('/knockout') || hash === '#cup' || hash === '#knockout') {
        setActiveTab('knockout');
      } else if (path.includes('/league') || hash === '#league') {
        setActiveTab('league');
      } else if (path.includes('/entries') || hash === '#my-competitions') {
        setActiveTab('my-competitions');
      } else if (path.includes('/profile') || hash === '#profile') {
        setActiveTab('profile');
      } else if (path.includes('/competitions') || hash === '#competitions') {
        setActiveTab('competitions');
      }
    };

    checkPath();
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  const hasAutoRoutedAdminRef = useRef(false);

  // When an authorized administrator logs in without a specific tab hash, automatically route them to the Admin Hub
  useEffect(() => {
    if (isAdmin && !hasAutoRoutedAdminRef.current && (!window.location.hash || window.location.hash === '#admin')) {
      hasAutoRoutedAdminRef.current = true;
      setActiveTab('admin');
    }
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-[#080c09] text-gray-100 flex flex-col antialiased">
      {/* Official Partnership Header Banner */}
      <OfficialBrandBanner />

      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-[#0c120e]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={CHUKA_CREST_URL}
            alt="Chuka Crest"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = CHUKA_CREST_FALLBACK;
            }}
            className="w-9 h-9 rounded-xl object-contain border border-[#22c55e]/40"
          />
          <div>
            <div
              className="text-sm font-bold tracking-wider text-[#22c55e] uppercase leading-none"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              CHUKA eFOOTBALL
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Tournament Platform
            </div>
          </div>
          <span className="text-gray-700 hidden md:inline">•</span>
          <div className="hidden md:flex items-center gap-2">
            <KonamiLogo className="h-4" />
            <EFootballLogo theme="dark" className="scale-75 origin-left" />
          </div>
        </div>

        {/* User Summary & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-[#22c55e]/40 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center font-bold text-xs">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
          )}

          <div className="hidden sm:flex flex-col text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[140px]">
                {user?.displayName || 'Player'}
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  {role || 'ADMIN'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
              {user?.email}
            </span>
          </div>

          {isAdmin && (
            <button
              id="header-admin-hub-toggle"
              type="button"
              onClick={() => setActiveTab(activeTab === 'admin' ? 'competitions' : 'admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'admin' || activeTab === 'admin-competitions'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
              }`}
              title={activeTab === 'admin' ? 'Switch to Competitions View' : 'Open Admin Operations Console'}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">
                {activeTab === 'admin' ? 'Player Hub' : 'Admin Hub'}
              </span>
            </button>
          )}

          <button
            id="sign-out-btn"
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-semibold transition-all cursor-pointer"
            title="Sign out of tournament session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Secondary Tournament Navigation Bar */}
      <div className="bg-[#111712]/90 border-b border-white/5 px-4 sm:px-6 py-2 sticky top-[57px] z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {/* Active Competitions */}
          <button
            id="tab-competitions-btn"
            type="button"
            onClick={() => setActiveTab('competitions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'competitions'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tournaments</span>
          </button>

          {/* Knockout Brackets */}
          <button
            id="tab-knockout-btn"
            type="button"
            onClick={() => setActiveTab('knockout')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'knockout'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Knockout Cups</span>
          </button>

          {/* League Table */}
          <button
            id="tab-league-btn"
            type="button"
            onClick={() => setActiveTab('league')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'league'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span>League Season</span>
          </button>

          {/* My Registrations */}
          <button
            id="tab-my-competitions-btn"
            type="button"
            onClick={() => setActiveTab('my-competitions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my-competitions'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>My Entries</span>
          </button>

          {/* Player Profile */}
          <button
            id="tab-profile-btn"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Player Profile</span>
          </button>

          {/* WhatsApp Support & Community */}
          <button
            id="tab-whatsapp-btn"
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Community &amp; Help</span>
          </button>

          {/* Official Rules Modal Trigger */}
          <button
            id="tab-rules-btn"
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap text-gray-400 hover:text-white hover:bg-white/5"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Rules</span>
          </button>

          {/* Admin Navigation Tabs - strictly gated by verified isAdmin state */}
          {/* Admin Operations Console - strictly visible and accessible only by wayongohlaurence@gmail.com */}
          {isAdmin && (
            <button
              id="tab-admin-hub-btn"
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'admin' || activeTab === 'admin-competitions'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-black" />
              <span>Admin Operations Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* TAB 1: COMPETITIONS LIST */}
        {activeTab === 'competitions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CompetitionList
              player={player}
              onNavigateToProfile={() => setActiveTab('profile')}
            />
          </div>
        )}

        {/* TAB: KNOCKOUT CUPS */}
        {activeTab === 'knockout' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <KnockoutView currentPlayer={player} />
          </div>
        )}

        {/* TAB: LEAGUE TABLE & FIXTURES */}
        {activeTab === 'league' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <LeagueView currentPlayer={player} onOpenRules={() => setShowRulesModal(true)} />
          </div>
        )}

        {/* TAB: MY REGISTRATIONS */}
        {activeTab === 'my-competitions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <MyRegistrationsView
              onBrowseCompetitions={() => setActiveTab('competitions')}
            />
          </div>
        )}

        {/* TAB 2: PLAYER PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2
                className="text-xl font-black text-white uppercase tracking-wider font-mono flex items-center gap-2"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                <User className="w-5 h-5 text-[#22c55e]" />
                <span>eFootball Gamer Profile</span>
              </h2>
              <p className="text-xs text-gray-400">
                Your authenticated competitor identity, verified divisional standing, and active squad status.
              </p>
            </div>

            {profileLoading ? (
              <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl">
                <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-medium">Loading competitor profile...</p>
              </div>
            ) : profileExists && player ? (
              <PlayerProfileCard
                player={player}
                completion={profileCompletion || undefined}
                onPlayerUpdated={(updated, comp) => {
                  setPlayerData(updated, comp);
                }}
                onUpdated={(updated, comp) => {
                  setPlayerData(updated, comp);
                }}
              />
            ) : (
              <PlayerRegistrationCard
                userEmail={user?.email || ''}
                initialDisplayName={user?.displayName || ''}
                onRegistered={(newPlayer, completion) => {
                  setPlayerData(newPlayer, completion);
                }}
                onViewRules={() => setShowRulesModal(true)}
              />
            )}
          </div>
        )}

        {/* TAB: WHATSAPP COMMUNITY & HELPDESK */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <WhatsAppHelpView theme="dark" />
          </div>
        )}

        {/* TAB: UNIFIED ADMIN OPERATIONS HUB (Gated strictly to wayongohlaurence@gmail.com) */}
        {(activeTab === 'admin' || activeTab === 'admin-competitions') && (
          <AdminRoute onNavigateBack={() => setActiveTab('competitions')}>
            <div className="space-y-6 animate-in fade-in duration-200">
              <AdminMasterHub />
            </div>
          </AdminRoute>
        )}
      </main>

      <InviteLandingModal
        player={player}
        onNavigateToProfile={() => setActiveTab('profile')}
        onRegistered={() => setActiveTab('my-competitions')}
      />

      <MatchRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
};
