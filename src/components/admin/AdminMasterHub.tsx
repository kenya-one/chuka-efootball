import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminKnockoutView } from './AdminKnockoutView';
import { AdminLeagueView } from './AdminLeagueView';
import { AdminPlayersView } from './AdminPlayersView';
import { AdminRegistrationsView } from './AdminRegistrationsView';
import { AdminPaymentsView } from './AdminPaymentsView';
import { AdminFixturesView } from './AdminFixturesView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';
import { AdminDisputesView } from './AdminDisputesView';
import { AdminWhatsAppView } from './AdminWhatsAppView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminCompetitionsView } from './AdminCompetitionsView';
import { AdminTrendsView } from './AdminTrendsView';
import { AdminJobsGigsView } from './AdminJobsGigsView';
import {
  LayoutDashboard,
  Trophy,
  Award,
  Users,
  CheckSquare,
  CreditCard,
  Play,
  Megaphone,
  Shield,
  AlertTriangle,
  MessageCircle,
  FileText,
  Layers,
} from 'lucide-react';

export type AdminSection =
  | 'overview'
  | 'competitions'
  | 'knockout'
  | 'league'
  | 'players'
  | 'registrations'
  | 'payments'
  | 'fixtures'
  | 'disputes'
  | 'whatsapp'
  | 'audit'
  | 'announcements'
  | 'trends'
  | 'jobs';

export const AdminMasterHub: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [targetFixtureCompId, setTargetFixtureCompId] = useState<string | undefined>(undefined);

  const handleSelectCompetitionForFixtures = (competitionId: string) => {
    setTargetFixtureCompId(competitionId);
    setActiveSection('fixtures');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Owner Badge */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#22c55e]/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                Chuka eFootball Admin Console
              </h2>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-black">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Authenticated Admin: <span className="text-white font-mono font-semibold">{user?.email || 'wayongohlaurence@gmail.com'}</span>
            </p>
          </div>
        </div>

        {/* Action Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-black/50 p-1.5 rounded-2xl border border-white/10 max-w-full">
          {/* Overview */}
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {/* All Competitions Master */}
          <button
            type="button"
            onClick={() => setActiveSection('competitions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'competitions'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-[#22c55e] hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Competitions</span>
          </button>

          {/* Weekly Knockout */}
          <button
            type="button"
            onClick={() => setActiveSection('knockout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'knockout'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Weekly Knockout</span>
          </button>

          {/* League Management */}
          <button
            type="button"
            onClick={() => setActiveSection('league')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'league'
                ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-blue-300 hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Leagues</span>
          </button>

          {/* Player Management */}
          <button
            type="button"
            onClick={() => setActiveSection('players')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'players'
                ? 'bg-[#22c55e] text-black shadow-lg shadow-[#22c55e]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players</span>
          </button>

          {/* Registrations */}
          <button
            type="button"
            onClick={() => setActiveSection('registrations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'registrations'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-emerald-300 hover:bg-white/5'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Registrations</span>
          </button>

          {/* Payments */}
          <button
            type="button"
            onClick={() => setActiveSection('payments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'payments'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'text-gray-400 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments</span>
          </button>

          {/* Fixtures & Results */}
          <button
            type="button"
            onClick={() => setActiveSection('fixtures')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'fixtures'
                ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20'
                : 'text-gray-400 hover:text-sky-300 hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Fixtures &amp; Results</span>
          </button>

          {/* Match Disputes */}
          <button
            type="button"
            onClick={() => setActiveSection('disputes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'disputes'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-gray-400 hover:text-rose-300 hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Disputes</span>
          </button>

          {/* WhatsApp Groups */}
          <button
            type="button"
            onClick={() => setActiveSection('whatsapp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'whatsapp'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-emerald-300 hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Groups</span>
          </button>

          {/* Jobs & Gigs */}
          <button type="button" onClick={() => setActiveSection('jobs')} className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSection === 'jobs' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Users className="w-3.5 h-3.5" /><span>Jobs & Gigs</span></button>
          {/* Trends */}
          <button type="button" onClick={() => setActiveSection('trends')} className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${activeSection === 'trends' ? 'bg-blue-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Megaphone className="w-3.5 h-3.5" /><span>Trends</span></button>

          {/* Announcements */}
          <button
            type="button"
            onClick={() => setActiveSection('announcements')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'announcements'
                ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-purple-300 hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements</span>
          </button>

          {/* Audit Logs */}
          <button
            type="button"
            onClick={() => setActiveSection('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'audit'
                ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/20'
                : 'text-gray-400 hover:text-teal-300 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Dynamic Sub-view Render */}
      <div className="animate-in fade-in duration-150">
        {activeSection === 'overview' && (
          <AdminOverviewView onNavigateSection={(sec) => setActiveSection(sec as AdminSection)} />
        )}
        {activeSection === 'competitions' && <AdminCompetitionsView />}
        {activeSection === 'knockout' && (
          <AdminKnockoutView onSelectCompetitionForFixtures={handleSelectCompetitionForFixtures} />
        )}
        {activeSection === 'league' && (
          <AdminLeagueView onSelectCompetitionForFixtures={handleSelectCompetitionForFixtures} />
        )}
        {activeSection === 'players' && <AdminPlayersView />}
        {activeSection === 'registrations' && <AdminRegistrationsView />}
        {activeSection === 'payments' && <AdminPaymentsView />}
        {activeSection === 'fixtures' && (
          <AdminFixturesView initialCompetitionId={targetFixtureCompId} />
        )}
        {activeSection === 'disputes' && <AdminDisputesView />}
        {activeSection === 'whatsapp' && <AdminWhatsAppView />}
        {activeSection === 'announcements' && <AdminAnnouncementsView />}
        {activeSection === 'jobs' && <AdminJobsGigsView />}
        {activeSection === 'trends' && <AdminTrendsView />}
        {activeSection === 'audit' && <AdminAuditLogsView />}
      </div>
    </div>
  );
};
