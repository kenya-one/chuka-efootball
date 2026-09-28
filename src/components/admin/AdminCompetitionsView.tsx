import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Shield,
  Coins,
  Calendar,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  FileText,
  BarChart2,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  Competition,
  CompetitionRegistration,
  AdminCompetitionsResponse,
  AdminRegistrationsResponse,
} from '../../types';
import { CompetitionApiService } from '../../api/client';
import { useAdmin } from '../../auth/AdminProvider';

export const AdminCompetitionsView: React.FC = () => {
  const { isAdmin } = useAdmin();
  // Sub-tabs: 'competitions' | 'registrations'
  const [subTab, setSubTab] = useState<'competitions' | 'registrations'>('competitions');

  // Competitions state
  const [competitionsData, setCompetitionsData] = useState<AdminCompetitionsResponse | null>(null);
  const [loadingComps, setLoadingComps] = useState(true);
  const [searchCompQuery, setSearchCompQuery] = useState('');
  const [filterCompStatus, setFilterCompStatus] = useState<string>('ALL');
  const [filterCompType, setFilterCompType] = useState<string>('ALL');

  // Registrations state
  const [registrationsData, setRegistrationsData] = useState<AdminRegistrationsResponse | null>(null);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [filterRegComp, setFilterRegComp] = useState<string>('ALL');
  const [filterRegStatus, setFilterRegStatus] = useState<string>('ALL');
  const [filterRegPayment, setFilterRegPayment] = useState<string>('ALL');

  // Action status
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    Name: '',
    Description: '',
    CompetitionType: 'LEAGUE',
    Format: 'Round Robin',
    Division: 'OPEN',
    MaxPlayers: 2048,
    EntryFee: 50,
    Currency: 'KES',
    RegistrationStart: '',
    RegistrationEnd: '',
    StartDate: '',
    EndDate: '',
    RulesDocumentURL: '',
    StandingsDocumentURL: '',
  });

  // Load competitions
  const loadCompetitions = async () => {
    setLoadingComps(true);
    setActionError(null);
    try {
      const res = await CompetitionApiService.getAdminCompetitions();
      if (res.success && res.data) {
        setCompetitionsData(res.data);
      } else {
        setActionError(res.error?.message || 'Failed to load competitions list.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error fetching competitions.');
    } finally {
      setLoadingComps(false);
    }
  };

  // Load registrations
  const loadRegistrations = async () => {
    setLoadingRegs(true);
    setActionError(null);
    try {
      const filter: Record<string, string> = {};
      if (filterRegComp !== 'ALL') filter.competitionId = filterRegComp;
      if (filterRegStatus !== 'ALL') filter.status = filterRegStatus;
      if (filterRegPayment !== 'ALL') filter.paymentStatus = filterRegPayment;

      const res = await CompetitionApiService.getAdminRegistrations(filter);
      if (res.success && res.data) {
        setRegistrationsData(res.data);
      } else {
        setActionError(res.error?.message || 'Failed to load registrations.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error fetching registrations.');
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadCompetitions();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && subTab === 'registrations') {
      loadRegistrations();
    }
  }, [isAdmin, subTab, filterRegComp, filterRegStatus, filterRegPayment]);

  // Open competition (publish DRAFT -> OPEN)
  const handleOpenCompetition = async (compId: string) => {
    setActionLoading(`open-${compId}`);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await CompetitionApiService.openCompetition(compId);
      if (res.success) {
        setActionSuccess(`Competition ${compId} is now OPEN for player registration.`);
        await loadCompetitions();
      } else {
        setActionError(res.error?.message || 'Failed to open competition.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error opening competition.');
    } finally {
      setActionLoading(null);
    }
  };

  // Close competition (OPEN -> CLOSED)
  const handleCloseCompetition = async (compId: string) => {
    setActionLoading(`close-${compId}`);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await CompetitionApiService.closeCompetition(compId);
      if (res.success) {
        setActionSuccess(`Registration for competition ${compId} is now CLOSED.`);
        await loadCompetitions();
      } else {
        setActionError(res.error?.message || 'Failed to close competition.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error closing competition.');
    } finally {
      setActionLoading(null);
    }
  };

  // Approve registration
  const handleApproveRegistration = async (regId: string) => {
    setActionLoading(`approve-${regId}`);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await CompetitionApiService.approveRegistration(regId);
      if (res.success) {
        setActionSuccess(`Registration ${regId} successfully APPROVED.`);
        await loadRegistrations();
        await loadCompetitions();
      } else {
        setActionError(res.error?.message || 'Failed to approve registration.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error approving registration.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject registration
  const handleRejectRegistration = async (regId: string) => {
    setActionLoading(`reject-${regId}`);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await CompetitionApiService.rejectRegistration(regId);
      if (res.success) {
        setActionSuccess(`Registration ${regId} has been REJECTED.`);
        await loadRegistrations();
        await loadCompetitions();
      } else {
        setActionError(res.error?.message || 'Failed to reject registration.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error rejecting registration.');
    } finally {
      setActionLoading(null);
    }
  };

  // Create new competition
  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload: Partial<Competition> = {
        Name: createForm.Name.trim(),
        Description: createForm.Description.trim(),
        CompetitionType: createForm.CompetitionType,
        Format: createForm.Format.trim(),
        Division: createForm.Division,
        MaxPlayers: Number(createForm.MaxPlayers) || 16,
        EntryFee: Number(createForm.EntryFee) || 0,
        Currency: createForm.Currency,
        RegistrationStart: createForm.RegistrationStart || undefined,
        RegistrationEnd: createForm.RegistrationEnd || undefined,
        StartDate: createForm.StartDate || undefined,
        EndDate: createForm.EndDate || undefined,
        RulesDocumentURL: createForm.RulesDocumentURL.trim() || undefined,
        StandingsDocumentURL: createForm.StandingsDocumentURL.trim() || undefined,
      };

      const res = await CompetitionApiService.createCompetition(payload);
      if (res.success && res.data?.competition) {
        setActionSuccess(`Created tournament ${res.data.competition.CompetitionID} (${res.data.competition.Name}) in DRAFT status.`);
        setIsCreateModalOpen(false);
        // Reset form
        setCreateForm({
          Name: '',
          Description: '',
          CompetitionType: 'LEAGUE',
          Format: 'Round Robin',
          Division: 'OPEN',
          MaxPlayers: 16,
          EntryFee: 0,
          Currency: 'KES',
          RegistrationStart: '',
          RegistrationEnd: '',
          StartDate: '',
          EndDate: '',
          RulesDocumentURL: '',
          StandingsDocumentURL: '',
        });
        await loadCompetitions();
      } else {
        setActionError(res.error?.message || 'Failed to create competition.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error creating competition.');
    } finally {
      setCreating(false);
    }
  };

  // Filter competitions
  const filteredCompetitions = (competitionsData?.competitions || []).filter((comp) => {
    if (filterCompStatus !== 'ALL' && comp.Status?.toUpperCase() !== filterCompStatus) {
      return false;
    }
    if (filterCompType !== 'ALL' && comp.CompetitionType?.toUpperCase() !== filterCompType) {
      return false;
    }
    if (searchCompQuery.trim()) {
      const q = searchCompQuery.toLowerCase();
      const matchName = comp.Name?.toLowerCase().includes(q);
      const matchId = comp.CompetitionID?.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  return (
    <div id="admin-competitions-view" className="space-y-6">
      {/* Feedback Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sub-Tab Navigation */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#22c55e]" />
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Tournament &amp; Competition Control Center
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Create official tournaments, publish brackets, set entry limits, and manage roster approvals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-create-comp-btn"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tournament</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            id="admin-subtab-competitions"
            type="button"
            onClick={() => setSubTab('competitions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'competitions'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tournaments ({competitionsData?.counts?.total ?? 0})</span>
          </button>

          <button
            id="admin-subtab-registrations"
            type="button"
            onClick={() => setSubTab('registrations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'registrations'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registration Approvals</span>
            {registrationsData?.counts?.pending !== undefined && registrationsData.counts.pending > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                {registrationsData.counts.pending}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: COMPETITIONS LIST */}
      {subTab === 'competitions' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          {competitionsData?.counts && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Total</span>
                <span className="text-xl font-bold font-mono text-white">{competitionsData.counts.total}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Open</span>
                <span className="text-xl font-bold font-mono text-[#22c55e]">{competitionsData.counts.open}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Full</span>
                <span className="text-xl font-bold font-mono text-amber-400">{competitionsData.counts.full}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">In Progress</span>
                <span className="text-xl font-bold font-mono text-sky-400">{competitionsData.counts.inProgress}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Drafts</span>
                <span className="text-xl font-bold font-mono text-gray-400">{competitionsData.counts.draft}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Closed</span>
                <span className="text-xl font-bold font-mono text-rose-400">{competitionsData.counts.closed}</span>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#111712] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCompQuery}
                onChange={(e) => setSearchCompQuery(e.target.value)}
                placeholder="Search by name or COMP-ID..."
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>
            <div>
              <select
                value={filterCompStatus}
                onChange={(e) => setFilterCompStatus(e.target.value)}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
                <option value="FULL">Full</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <select
                value={filterCompType}
                onChange={(e) => setFilterCompType(e.target.value)}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                <option value="ALL">All Formats</option>
                <option value="LEAGUE">League</option>
                <option value="KNOCKOUT">Knockout</option>
                <option value="FRIENDLY">Friendly</option>
                <option value="SPECIAL">Special</option>
              </select>
            </div>
          </div>

          {/* List of competitions */}
          {loadingComps ? (
            <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400">Loading competition management records...</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
              <p className="text-xs text-gray-400">No competitions found matching filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompetitions.map((comp) => {
                const isDraft = comp.Status?.toUpperCase() === 'DRAFT';
                const isOpen = comp.Status?.toUpperCase() === 'OPEN';
                const isFull = (comp.RegisteredCount || 0) >= comp.MaxPlayers;

                return (
                  <div
                    key={comp.CompetitionID}
                    id={`admin-comp-row-${comp.CompetitionID}`}
                    className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-white/20 transition-all shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#22c55e] font-bold">
                            {comp.CompetitionID}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-mono uppercase font-bold">
                            {comp.Status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {comp.CompetitionType} • {comp.Format}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{comp.Name}</h3>
                      </div>

                      {/* Administrative Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Open registration button */}
                        {isDraft && (
                          <button
                            id={`open-comp-btn-${comp.CompetitionID}`}
                            type="button"
                            onClick={() => handleOpenCompetition(comp.CompetitionID)}
                            disabled={actionLoading === `open-${comp.CompetitionID}`}
                            className="px-3.5 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {actionLoading === `open-${comp.CompetitionID}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                            <span>Publish &amp; Open</span>
                          </button>
                        )}

                        {/* Close registration button */}
                        {isOpen && (
                          <button
                            id={`close-comp-btn-${comp.CompetitionID}`}
                            type="button"
                            onClick={() => handleCloseCompetition(comp.CompetitionID)}
                            disabled={actionLoading === `close-${comp.CompetitionID}`}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {actionLoading === `close-${comp.CompetitionID}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                            <span>Close Registration</span>
                          </button>
                        )}

                        {/* Jump to registrations for this comp */}
                        <button
                          type="button"
                          onClick={() => {
                            setFilterRegComp(comp.CompetitionID);
                            setSubTab('registrations');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Registrations</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-gray-400 block">Roster Filled:</span>
                        <div className="font-mono text-white font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {comp.RegisteredCount || 0} / {comp.MaxPlayers}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-400 block">Division:</span>
                        <div className="text-white font-semibold flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-[#22c55e]" />
                          <span>{comp.Division || 'OPEN'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-400 block">Entry Fee:</span>
                        <div className="text-[#22c55e] font-mono font-bold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>
                            {comp.EntryFee > 0 ? `${comp.Currency} ${comp.EntryFee}` : 'Free'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-400 block">Created By:</span>
                        <div className="text-gray-300 truncate font-mono text-[11px]">
                          {comp.CreatedBy || 'Admin'}
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    {(comp.RulesDocumentURL || comp.StandingsDocumentURL) && (
                      <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs">
                        {comp.RulesDocumentURL && (
                          <a
                            href={comp.RulesDocumentURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#22c55e] hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Rules Document</span>
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
                            <span>Standings Sheet</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: REGISTRATION APPROVALS */}
      {subTab === 'registrations' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          {registrationsData?.counts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Total Entries</span>
                <span className="text-xl font-bold font-mono text-white">{registrationsData.counts.total}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Pending Review</span>
                <span className="text-xl font-bold font-mono text-amber-400">{registrationsData.counts.pending}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Approved</span>
                <span className="text-xl font-bold font-mono text-[#22c55e]">{registrationsData.counts.approved}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#111712] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-gray-400 block">Rejected</span>
                <span className="text-xl font-bold font-mono text-rose-400">{registrationsData.counts.rejected}</span>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#111712] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-gray-400 block mb-1">Filter by Tournament</label>
              <select
                value={filterRegComp}
                onChange={(e) => setFilterRegComp(e.target.value)}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                <option value="ALL">All Tournaments</option>
                {(competitionsData?.competitions || []).map((c) => (
                  <option key={c.CompetitionID} value={c.CompetitionID}>
                    {c.Name} ({c.CompetitionID})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-gray-400 block mb-1">Filter by Status</label>
              <select
                value={filterRegStatus}
                onChange={(e) => setFilterRegStatus(e.target.value)}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-gray-400 block mb-1">Filter by Payment</label>
              <select
                value={filterRegPayment}
                onChange={(e) => setFilterRegPayment(e.target.value)}
                className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Payment Pending</option>
                <option value="NOT_REQUIRED">Free / Not Required</option>
              </select>
            </div>
          </div>

          {/* Registrations List */}
          {loadingRegs ? (
            <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400">Loading registrations from database...</p>
            </div>
          ) : (registrationsData?.registrations || []).length === 0 ? (
            <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
              <p className="text-xs text-gray-400">No registrations found matching selected criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(registrationsData?.registrations || []).map((reg) => {
                const isPending = reg.Status?.toUpperCase() === 'PENDING';
                const isApproved = reg.Status?.toUpperCase() === 'APPROVED';
                const isRejected = reg.Status?.toUpperCase() === 'REJECTED';

                return (
                  <div
                    key={reg.RegistrationID}
                    id={`admin-reg-row-${reg.RegistrationID}`}
                    className="bg-[#111712] border border-white/10 rounded-3xl p-5 space-y-4 hover:border-white/20 transition-all shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#22c55e] font-bold">
                            {reg.RegistrationID}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-xs font-mono text-gray-400">
                            Tournament: {reg.CompetitionName || reg.CompetitionID}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Player: <span className="font-mono text-[#22c55e]">{reg.eFootballUsername}</span> ({reg.PlayerID})
                        </h4>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              id={`approve-reg-btn-${reg.RegistrationID}`}
                              type="button"
                              onClick={() => handleApproveRegistration(reg.RegistrationID)}
                              disabled={actionLoading === `approve-${reg.RegistrationID}`}
                              className="px-3.5 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {actionLoading === `approve-${reg.RegistrationID}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Approve Entry</span>
                            </button>

                            <button
                              id={`reject-reg-btn-${reg.RegistrationID}`}
                              type="button"
                              onClick={() => handleRejectRegistration(reg.RegistrationID)}
                              disabled={actionLoading === `reject-${reg.RegistrationID}`}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {actionLoading === `reject-${reg.RegistrationID}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}

                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-gray-400 block">Payment Status:</span>
                        <span className="font-semibold text-white uppercase text-[11px]">
                          {reg.PaymentStatus}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block">Registered At:</span>
                        <span className="text-gray-300 font-mono text-[11px]">
                          {reg.RegisteredAt || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block">Reviewed By:</span>
                        <span className="text-gray-300 font-mono text-[11px] truncate">
                          {reg.VerifiedBy || 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block">Google UID:</span>
                        <span className="text-gray-400 font-mono text-[10px] truncate">
                          {reg.GoogleUID}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE COMPETITION MODAL */}
      {isCreateModalOpen && (
        <div
          id="create-competition-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="create-competition-modal"
            className="relative w-full max-w-2xl bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    Create New Tournament
                  </h3>
                  <p className="text-xs text-gray-400">Initialize a competitive bracket in Google Sheets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompetition} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300 block">Competition Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.Name}
                  onChange={(e) => setCreateForm({ ...createForm, Name: e.target.value })}
                  placeholder="e.g. Chuka eFootball Super League Season 1"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300 block">Description</label>
                <textarea
                  rows={2}
                  value={createForm.Description}
                  onChange={(e) => setCreateForm({ ...createForm, Description: e.target.value })}
                  placeholder="Tournament rules, eligibility, schedule details..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              {/* Type & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Competition Type</label>
                  <select
                    value={createForm.CompetitionType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      if (newType === 'KNOCKOUT') {
                        setCreateForm({
                          ...createForm,
                          CompetitionType: newType,
                          Format: 'Single Elimination',
                          MaxPlayers: 1024,
                          EntryFee: 20,
                        });
                      } else if (newType === 'LEAGUE') {
                        setCreateForm({
                          ...createForm,
                          CompetitionType: newType,
                          Format: 'Round Robin',
                          MaxPlayers: 2048,
                          EntryFee: 50,
                        });
                      } else {
                        setCreateForm({ ...createForm, CompetitionType: newType });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  >
                    <option value="KNOCKOUT">KNOCKOUT (1,024 Players • KSh 20)</option>
                    <option value="LEAGUE">LEAGUE (2,048 Players • KSh 50)</option>
                    <option value="FRIENDLY">FRIENDLY</option>
                    <option value="SPECIAL">SPECIAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Format</label>
                  <input
                    type="text"
                    value={createForm.Format}
                    onChange={(e) => setCreateForm({ ...createForm, Format: e.target.value })}
                    placeholder="e.g. Round Robin or Single Elimination"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              {/* Division & Max Players */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Division</label>
                  <select
                    value={createForm.Division}
                    onChange={(e) => setCreateForm({ ...createForm, Division: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="DIVISION 1">DIVISION 1</option>
                    <option value="DIVISION 2">DIVISION 2</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Max Players (Capacity)</label>
                  <input
                    type="number"
                    min={2}
                    max={2048}
                    required
                    value={createForm.MaxPlayers}
                    onChange={(e) => setCreateForm({ ...createForm, MaxPlayers: parseInt(e.target.value, 10) || 1024 })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              {/* Entry Fee & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Entry Fee (0 for free)</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.EntryFee}
                    onChange={(e) => setCreateForm({ ...createForm, EntryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Currency</label>
                  <input
                    type="text"
                    value={createForm.Currency}
                    onChange={(e) => setCreateForm({ ...createForm, Currency: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              {/* Registration & Tournament Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Registration Start</label>
                  <input
                    type="datetime-local"
                    value={createForm.RegistrationStart}
                    onChange={(e) => setCreateForm({ ...createForm, RegistrationStart: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Registration End</label>
                  <input
                    type="datetime-local"
                    value={createForm.RegistrationEnd}
                    onChange={(e) => setCreateForm({ ...createForm, RegistrationEnd: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Tournament Start</label>
                  <input
                    type="datetime-local"
                    value={createForm.StartDate}
                    onChange={(e) => setCreateForm({ ...createForm, StartDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300 block">Tournament End</label>
                  <input
                    type="datetime-local"
                    value={createForm.EndDate}
                    onChange={(e) => setCreateForm({ ...createForm, EndDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
                  />
                </div>
              </div>

              {/* Document URLs */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300 block">Rules Document URL (Google Docs)</label>
                <input
                  type="url"
                  value={createForm.RulesDocumentURL}
                  onChange={(e) => setCreateForm({ ...createForm, RulesDocumentURL: e.target.value })}
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300 block">Standings Sheet URL (Google Sheets)</label>
                <input
                  type="url"
                  value={createForm.StandingsDocumentURL}
                  onChange={(e) => setCreateForm({ ...createForm, StandingsDocumentURL: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-[2] py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating in Database...</span>
                    </>
                  ) : (
                    <>
                      <span>Save as Draft</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
