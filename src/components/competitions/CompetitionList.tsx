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
  X,
  ScrollText,
  BadgeCheck,
} from 'lucide-react';
import { Competition, Player, CompetitionRegistration } from '../../types';
import { CompetitionApiService } from '../../api/client';
import { TournamentAdminService } from '../../services/tournamentAdminService';
import { CompetitionRegistrationModal } from './CompetitionRegistrationModal';
import { RegisteredMembersPanel } from './RegisteredMembersPanel';
import { GazetteDocumentViewer, GazetteKind } from '../common/GazetteDocumentViewer';
import { ShareButton } from '../common/ShareButton';
import { splitRegistrations, getCompetitionShareText, getCompetitionShareUrl } from '../../utils/competitionUtils';

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
  const [allRegistrations, setAllRegistrations] = useState<CompetitionRegistration[]>([]);
  const [membersFor, setMembersFor] = useState<Competition | null>(null);
  const [docView, setDocView] = useState<{ comp: Competition; kind: GazetteKind } | null>(null);

  // Load competitions and registrations
  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, compRes, regRes, everyReg] = await Promise.all([
        TournamentAdminService.getCompetitions(),
        CompetitionApiService.getCompetitions(),
        player ? CompetitionApiService.getMyRegistrations() : Promise.resolve({ success: false, data: { registrations: [] } }),
        TournamentAdminService.getRegistrations().catch(() => [] as CompetitionRegistration[]),
      ]);
      setAllRegistrations(everyReg);

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

      {/* Competitions — grouped: tournaments first, then leagues, most active first */}
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
              ? 'No competitions are scheduled yet. Check back soon or contact tournament administration.'
              : 'No competitions matched your search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: 'KNOCKOUT', title: 'Knockout Tournaments' },
            { key: 'LEAGUE', title: 'Leagues' },
            { key: 'OTHER', title: 'Friendlies & Special Events' },
          ].map((group) => {
            const rank = (c: Competition) => {
              const st = String(c.Status).toUpperCase();
              return st === 'OPEN' ? 0 : st === 'IN_PROGRESS' ? 1 : st === 'FULL' ? 2 : st === 'COMPLETED' ? 4 : 3;
            };
            const list = filteredCompetitions
              .filter((c) => {
                const t = String(c.CompetitionType).toUpperCase();
                return group.key === 'OTHER' ? t !== 'KNOCKOUT' && t !== 'LEAGUE' : t === group.key;
              })
              .sort((a, b) => rank(a) - rank(b));
            if (list.length === 0) return null;
            return (
              <section key={group.key} className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-[0.2em] font-mono">
                  <span className="w-6 h-px bg-[#22c55e]" /> {group.title}
                  <span className="text-gray-600">({list.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {list.map((comp) => {
                    const userReg = regMap.get(comp.CompetitionID);
                    const isRegOpen = comp.Status?.toUpperCase() === 'OPEN';
                    const compRegs = allRegistrations.filter((r) => r.CompetitionID === comp.CompetitionID);
                    const { verified, unverified } = splitRegistrations(compRegs);
                    const regCount = compRegs.length > 0 ? verified.length : comp.RegisteredCount || 0;
                    const isFull = regCount >= comp.MaxPlayers;
                    const capacityPercent = Math.min(100, Math.round((regCount / Math.max(1, comp.MaxPlayers)) * 100));
                    const isLeague = String(comp.CompetitionType).toUpperCase() === 'LEAGUE';
                    const img = comp.ProfileImageURL || comp.ImageURL;

                    return (
                      <div
                        key={comp.CompetitionID}
                        id={`competition-card-${comp.CompetitionID}`}
                        className="rounded-3xl overflow-hidden bg-[#111712] border border-white/10 hover:border-[#22c55e]/40 transition-all flex flex-col shadow-lg"
                      >
                        {/* Banner */}
                        <div className="relative px-5 pt-4 pb-10 bg-gradient-to-br from-[#14532d] via-[#0f2a1a] to-[#0c1510]">
                          <div className="flex items-center justify-between gap-2">
                            {getStatusBadge(comp.Status)}
                            <ShareButton
                              compact
                              title={comp.Name}
                              text={getCompetitionShareText(comp, regCount)}
                              url={getCompetitionShareUrl(comp)}
                            />
                          </div>
                        </div>

                        <div className="relative z-10 px-5 -mt-8 flex items-end gap-3.5">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-[#111712] bg-black shrink-0 shadow-md flex items-center justify-center">
                            {img ? (
                              <img src={img} alt={comp.Name} className="w-full h-full object-cover" />
                            ) : (
                              <Trophy className="w-7 h-7 text-[#22c55e]/50" />
                            )}
                          </div>
                          <div className="min-w-0 pb-1">
                            <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{comp.Name}</h3>
                            <span className="text-[10px] font-mono text-gray-500">{comp.CompetitionID}</span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4 flex-1 flex flex-col">
                          {comp.Description && (
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{comp.Description}</p>
                          )}

                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono">
                              {isLeague ? 'League' : 'Knockout'} • {comp.Format}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-[#22c55e]" /> {comp.Division || 'OPEN'}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] font-bold flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              {comp.EntryFee > 0 ? `${comp.Currency} ${comp.EntryFee}` : 'Free Entry'}
                            </span>
                            {comp.PrizeAmount ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                                Prize KSh {Number(comp.PrizeAmount).toLocaleString()}
                              </span>
                            ) : null}
                          </div>

                          {/* Capacity */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" /> Verified players
                              </span>
                              <span className="font-mono text-white font-semibold">
                                {regCount.toLocaleString()} / {comp.MaxPlayers.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${capacityPercent >= 90 ? 'bg-amber-400' : 'bg-[#22c55e]'}`}
                                style={{ width: `${capacityPercent}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                              <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-[#22c55e]" />{verified.length} verified</span>
                              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-amber-300" />{unverified.length} unverified</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-3 text-[11px] text-gray-400 border-t border-white/5">
                            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-500" /> Starts {formatDate(comp.StartDate)}</div>
                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> Reg ends {formatDate(comp.RegistrationEnd)}</div>
                          </div>

                          {/* Quick links */}
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setMembersFor(comp)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-gray-200 cursor-pointer">
                              <Users className="w-3.5 h-3.5 text-[#22c55e]" /> Registered members
                            </button>
                            <button type="button" onClick={() => setDocView({ comp, kind: 'rules' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-gray-200 cursor-pointer">
                              <ScrollText className="w-3.5 h-3.5 text-[#22c55e]" /> Rules
                            </button>
                            <button type="button" onClick={() => setDocView({ comp, kind: isLeague ? 'standings' : 'bracket' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-gray-200 cursor-pointer">
                              {isLeague ? <BarChart2 className="w-3.5 h-3.5 text-amber-400" /> : <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                              {isLeague ? 'Standings' : 'Bracket'}
                            </button>
                          </div>

                          {/* Footer Action */}
                          <div className="pt-3 border-t border-white/5 mt-auto">
                            {userReg ? (
                              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30">
                                <div className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                                  <span className="text-[#22c55e] font-bold uppercase tracking-wider">
                                    {userReg.Status === 'APPROVED' ? 'Verified' : 'Unverified'} ({userReg.Status})
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-gray-400">{userReg.RegistrationID}</span>
                              </div>
                            ) : !player ? (
                              <button type="button" onClick={onNavigateToProfile} className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                <span>Create Player Profile First</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : !player.Verified ? (
                              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-300">
                                Profile verification pending administrator approval
                              </div>
                            ) : isRegOpen && !isFull ? (
                              <button id={`register-btn-${comp.CompetitionID}`} type="button" onClick={() => setModalCompetition(comp)} className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                                <Trophy className="w-3.5 h-3.5" />
                                <span>{isLeague ? 'Join League' : 'Register for Tournament'}</span>
                              </button>
                            ) : isFull ? (
                              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 font-mono">ROSTER FULL — CAPACITY REACHED</div>
                            ) : (
                              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 font-mono">REGISTRATION CLOSED</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Registered members modal */}
      {membersFor && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setMembersFor(null)}>
          <div className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0c120e] border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 py-3 bg-[#0c120e] border-b border-white/10">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{membersFor.Name}</div>
                <div className="text-[10px] text-gray-500 font-mono">{membersFor.CompetitionID}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setDocView({ comp: membersFor, kind: 'registered' })} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-gray-200 cursor-pointer">Gazette</button>
                <button type="button" onClick={() => setMembersFor(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <RegisteredMembersPanel
                registrations={allRegistrations.filter((r) => r.CompetitionID === membersFor.CompetitionID)}
                currentPlayer={player}
              />
            </div>
          </div>
        </div>
      )}

      {docView && (
        <GazetteDocumentViewer
          kind={docView.kind}
          competition={docView.comp}
          registrations={allRegistrations.filter((r) => r.CompetitionID === docView.comp.CompetitionID)}
          onClose={() => setDocView(null)}
        />
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
