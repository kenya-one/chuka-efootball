import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Award,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { AdminDashboardOverview } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';

interface AdminOverviewViewProps {
  onNavigateSection: (section: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateSection }) => {
  const [stats, setStats] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await TournamentAdminService.getOverviewStats();
      setStats(data);
    } catch (err) {
      console.error('[AdminOverviewView error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 uppercase">
                Real-Time Database Operations
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">Live Google Sheets Sync</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              Command Center Overview
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Live tournament metrics aggregated from the official Chuka eFootball Sheets database. No hardcoded or mock sample counts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-white/5">
          {/* Total Players */}
          <div
            onClick={() => onNavigateSection('players')}
            className="bg-black/40 hover:bg-black/60 border border-white/5 hover:border-[#22c55e]/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-gray-400 group-hover:text-[#22c55e]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Registered Players</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {loading ? '—' : stats?.totalPlayers ?? 0}
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-gray-300 flex items-center gap-1 mt-1">
              View Directory <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          {/* Active Tournaments */}
          <div
            onClick={() => onNavigateSection('knockout')}
            className="bg-black/40 hover:bg-black/60 border border-white/5 hover:border-amber-400/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Tournaments</span>
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {loading ? '—' : stats?.activeTournaments ?? 0}
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-amber-300 flex items-center gap-1 mt-1">
              Manage Knockouts <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          {/* Active Leagues */}
          <div
            onClick={() => onNavigateSection('league')}
            className="bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-400/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Leagues</span>
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {loading ? '—' : stats?.activeLeagues ?? 0}
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-blue-300 flex items-center gap-1 mt-1">
              Manage Seasons <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          {/* Total Registrations */}
          <div
            onClick={() => onNavigateSection('registrations')}
            className="bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-400/40 p-4 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Registrations</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {loading ? '—' : stats?.totalRegistrations ?? 0}
            </div>
            <span className="text-[10px] text-gray-400 group-hover:text-emerald-300 flex items-center gap-1 mt-1">
              Audit Entries <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
          {/* Pending Payments */}
          <div
            onClick={() => onNavigateSection('payments')}
            className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl transition-all cursor-pointer hover:border-amber-400 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                Pending Payments
              </span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1">
              {loading ? '—' : stats?.pendingPayments ?? 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Awaiting M-Pesa receipt verification and confirmation.
            </p>
          </div>

          {/* Upcoming Matches */}
          <div
            onClick={() => onNavigateSection('fixtures')}
            className="bg-sky-500/10 border border-sky-500/25 p-4 rounded-2xl transition-all cursor-pointer hover:border-sky-400 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                Upcoming Matches
              </span>
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-300 font-mono mt-1">
              {loading ? '—' : stats?.upcomingMatches ?? 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Scheduled knockout &amp; league fixtures ready to be played.
            </p>
          </div>

          {/* Recently Recorded Results */}
          <div
            onClick={() => onNavigateSection('fixtures')}
            className="bg-purple-500/10 border border-purple-500/25 p-4 rounded-2xl transition-all cursor-pointer hover:border-purple-400 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                Recorded Results
              </span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-1">
              {loading ? '—' : stats?.recentlyRecordedResults ?? 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Completed match scores recorded and published officially.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Administrator Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Knockout Operations Card */}
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                Weekly Knockout Management
              </h3>
              <p className="text-xs text-gray-400">Standard fee: KSh 20 • Single elimination bracket</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Create weekly knockout tournaments, upload official profile pictures, verify participant fees, generate fixtures, record match scores, and progress winners to the finals.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateSection('knockout')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Manage Tournaments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* League Operations Card */}
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                League Championship Management
              </h3>
              <p className="text-xs text-gray-400">Standard fee: KSh 50 • Round-robin standings</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Configure seasonal leagues, upload league branding images, register competitors, schedule weekly matchdays, and calculate real-time points, goals, and goal difference standings.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateSection('league')}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Manage Leagues</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
