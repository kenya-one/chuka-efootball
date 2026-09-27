import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Search,
  RefreshCw,
  Users,
  Coins,
  Calendar,
  Shield,
  FileText,
  BarChart2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Competition, Player, CompetitionRegistration } from '../../types';
import { CompetitionApiService } from '../../api/client';
import { TournamentAdminService } from '../../services/tournamentAdminService';
import { CompetitionRegistrationModal } from './CompetitionRegistrationModal';

interface CompetitionListProps {
  player: Player | null;
  onNavigateToProfile?: () => void;
}

export const CompetitionList: React.FC<CompetitionListProps> = ({
  player,
  onNavigateToProfile,
}) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<CompetitionRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');

  // Registration Modal state
  const [modalCompetition, setModalCompetition] = useState<Competition | null>(null);

  // Load competitions and registrations
  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, compRes, regRes] = await Promise.all([
        TournamentAdminService.getCompetitions(),
        CompetitionApiService.getCompetitions(),
        player ? CompetitionApiService.getMyRegistrations() : Promise.resolve({ success: false, data: { registrations: [] } }),
      ]);

      if (comps && comps.length > 0) {
        setCompetitions(comps);
      } else if (compRes.success && compRes.data?.competitions) {
        setCompetitions(compRes.data.competitions);
      }

      if (regRes.success && regRes.data?.registrations) {
        setMyRegistrations(regRes.data.registrations);
      } else {
        const localRegs = await TournamentAdminService.getRegistrations();
        if (player) {
          setMyRegistrations(localRegs.filter((r) => r.PlayerID === player.PlayerID || r.GoogleUID === player.FirebaseUID));
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [player]);

  // Map of active registrations for quick lookup: { [CompetitionID]: CompetitionRegistration }
  const regMap = React.useMemo(() => {
    const map = new Map<string, CompetitionRegistration>();
    for (const reg of myRegistrations) {
      if (reg.Status !== 'REJECTED' && reg.Status !== 'CANCELLED') {
        map.set(reg.CompetitionID, reg);
      }
    }
    return map;
  }, [myRegistrations]);

  // Filtered list
  const filteredCompetitions = competitions.filter((comp) => {
    if (selectedType !== 'ALL' && comp.CompetitionType?.toUpperCase() !== selectedType) {
      return false;
    }
    if (selectedStatus !== 'ALL' && comp.Status?.toUpperCase() !== selectedStatus) {
      return false;
    }
    if (selectedDivision !== 'ALL' && (comp.Division || 'OPEN').toUpperCase() !== selectedDivision) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = comp.Name?.toLowerCase().includes(q);
      const matchDesc = comp.Description?.toLowerCase().includes(q);
      const matchId = comp.CompetitionID?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchId) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Registration Open
          </span>
        );
      case 'FULL':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Full
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-purple-400" />
            Completed
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gray-700/40 text-gray-300 border border-gray-600/40 text-[10px] font-bold uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="competition-discovery-view" className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#22c55e]" />
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Official Competitions
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Browse approved tournaments and leagues sanctioned by Chuka eFootball.
            </p>
          </div>

          <button
            id="refresh-competitions-btn"
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#22c55e]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="competition-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tournament name..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              id="competition-type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="ALL">All Types</option>
              <option value="LEAGUE">Leagues</option>
              <option value="KNOCKOUT">Knockouts</option>
              <option value="FRIENDLY">Friendlies</option>
              <option value="SPECIAL">Special Events</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="competition-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Registration Open</option>
              <option value="FULL">Full</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <select
              id="competition-division-filter"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="ALL">All Divisions</option>
              <option value="OPEN">Open Division</option>
              <option value="DIVISION 1">Division 1</option>
              <option value="DIVISION 2">Division 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Competitions Grid */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading tournaments from official database...</p>
        </div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white font-mono uppercase">No Competitions Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {competitions.length === 0
              ? 'No active competitions are currently scheduled. Check back soon or contact tournament administration.'
              : 'No competitions matched your search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCompetitions.map((comp) => {
            const userReg = regMap.get(comp.CompetitionID);
            const isRegOpen = comp.Status?.toUpperCase() === 'OPEN';
            const isFull = (comp.RegisteredCount || 0) >= comp.MaxPlayers;
            const regCount = comp.RegisteredCount || 0;
            const capacityPercent = Math.min(100, Math.round((regCount / comp.MaxPlayers) * 100));

            return (
              <div
                key={comp.CompetitionID}
                id={`competition-card-${comp.CompetitionID}`}
                className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-[#22c55e]/40 transition-all flex flex-col justify-between shadow-lg"
              >
                {/* Header with Profile Picture */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#22c55e] font-bold">
                      {comp.CompetitionID}
                    </span>
                    {getStatusBadge(comp.Status)}
                  </div>

                  <div className="flex items-start gap-3.5">
                    {/* Competition Profile Picture */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/15 bg-black/60 shrink-0 relative shadow-md">
                      {(comp.ProfileImageURL || comp.ImageURL) ? (
                        <img
                          src={comp.ProfileImageURL || comp.ImageURL}
                          alt={comp.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-[#22c55e]/10 to-transparent">
                          <Trophy className="w-6 h-6 text-[#22c55e]/40" />
                          <span className="text-[8px] uppercase font-bold text-gray-400 mt-0.5">eFoot</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white tracking-wide leading-snug">
                        {comp.Name}
                      </h3>
                      {comp.Description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {comp.Description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges Bar */}
                  <div className="flex flex-wrap gap-2 pt-1 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono text-[11px]">
                      {comp.CompetitionType} • {comp.Format}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[11px] flex items-center gap-1">
                      <Shield className="w-3 h-3 text-[#22c55e]" />
                      {comp.Division || 'OPEN'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] font-bold text-[11px] flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {comp.EntryFee > 0 ? `${comp.Currency} ${comp.EntryFee}` : 'Free Entry'}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>Roster Capacity:</span>
                      </span>
                      <span className="font-mono text-white font-semibold">
                        {regCount} / {comp.MaxPlayers} slots ({comp.MaxPlayers - regCount} left)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          capacityPercent >= 90
                            ? 'bg-amber-400'
                            : 'bg-[#22c55e]'
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-gray-400 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>Starts: {formatDate(comp.StartDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>Reg Ends: {formatDate(comp.RegistrationEnd)}</span>
                    </div>
                  </div>

                  {/* External Docs Links */}
                  {(comp.RulesDocumentURL || comp.StandingsDocumentURL) && (
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      {comp.RulesDocumentURL && (
                        <a
                          href={comp.RulesDocumentURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#22c55e] hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Official Rules</span>
                        </a>
                      )}
                      {comp.StandingsDocumentURL && (
                        <a
                          href={comp.StandingsDocumentURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#22c55e] hover:underline"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Live Standings</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-white/5">
                  {userReg ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                        <span className="text-[#22c55e] font-bold uppercase tracking-wider">
                          Registered ({userReg.Status})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">
                        {userReg.RegistrationID}
                      </span>
                    </div>
                  ) : !player ? (
                    <button
                      type="button"
                      onClick={onNavigateToProfile}
                      className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Create Player Profile First</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : !player.Verified ? (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300">
                      Profile verification pending administrator approval
                    </div>
                  ) : isRegOpen && !isFull ? (
                    <button
                      id={`register-btn-${comp.CompetitionID}`}
                      type="button"
                      onClick={() => setModalCompetition(comp)}
                      className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Register for Tournament</span>
                    </button>
                  ) : isFull ? (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 font-mono">
                      ROSTER FULL — CAPACITY REACHED
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 font-mono">
                      REGISTRATION CLOSED
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      {modalCompetition && (
        <CompetitionRegistrationModal
          competition={modalCompetition}
          player={player}
          isOpen={Boolean(modalCompetition)}
          onClose={() => setModalCompetition(null)}
          onSuccess={(newReg) => {
            setMyRegistrations((prev) => [...prev, newReg]);
            // Only APPROVED registrations count towards official registered/capacity count
            // Pending registrations only update PendingCount
            const isApproved = newReg.Status === 'APPROVED' || newReg.PaymentStatus === 'PAID';
            setCompetitions((prev) =>
              prev.map((c) =>
                c.CompetitionID === newReg.CompetitionID
                  ? {
                      ...c,
                      RegisteredCount: isApproved ? (c.RegisteredCount || 0) + 1 : (c.RegisteredCount || 0),
                      ApprovedCount: isApproved ? (c.ApprovedCount || 0) + 1 : (c.ApprovedCount || 0),
                      PendingCount: !isApproved ? (c.PendingCount || 0) + 1 : (c.PendingCount || 0),
                    }
                  : c
              )
            );
          }}
        />
      )}
    </div>
  );
};
