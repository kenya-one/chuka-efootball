import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  MessageSquare,
  Award,
} from 'lucide-react';
import { getAdminDisputes, resolveCupDispute } from '../../api/endpoints';

export interface DisputeItem {
  DisputeID: string;
  MatchID: string;
  TournamentID?: string;
  DisputingPlayerID?: string;
  OpenedByPlayerID?: string;
  Player1ID?: string;
  Player2ID?: string;
  Player1Username?: string;
  Player2Username?: string;
  Reason: string;
  EvidenceDriveURL?: string;
  EvidenceURL?: string;
  EvidenceReference?: string;
  Status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | string;
  AdminDecision?: string;
  ResolvedBy?: string;
  CreatedAt: string;
  ResolvedAt?: string;
}

export const AdminDisputesView: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  // Resolving modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [winnerId, setWinnerId] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDisputes();
      if (res.success && res.data?.disputes) {
        setDisputes(res.data.disputes);
      } else {
        setError(res.error?.message || 'Failed to load disputes from database.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching disputes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleOpenResolveModal = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setWinnerId(dispute.Player1ID || dispute.DisputingPlayerID || '');
    setDecisionNotes(`Dispute reviewed and resolved by Tournament Admin.`);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    if (!winnerId) {
      setActionError('Please select or specify the winning Player ID.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await resolveCupDispute(selectedDispute.DisputeID, winnerId, decisionNotes);
      if (res.success) {
        setActionSuccess(`Dispute ${selectedDispute.DisputeID} successfully resolved!`);
        setTimeout(() => {
          setSelectedDispute(null);
          setActionSuccess(null);
          fetchDisputes();
        }, 1500);
      } else {
        setActionError(res.error?.message || 'Failed to resolve dispute.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Network error resolving dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const status = String(d.Status || 'OPEN').toUpperCase();
    if (statusFilter !== 'ALL' && status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const target = `${d.DisputeID} ${d.MatchID} ${d.Reason} ${d.DisputingPlayerID || ''} ${d.Player1Username || ''} ${d.Player2Username || ''}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  const openCount = disputes.filter((d) => String(d.Status || 'OPEN').toUpperCase() === 'OPEN').length;
  const resolvedCount = disputes.filter((d) => String(d.Status || '').toUpperCase() === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Admin Adjudication
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
              Match Disputes &amp; Evidence Review
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl">
              Inspect submitted score disagreements, examine screenshot proof from Google Drive, and make authoritative rulings.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDisputes}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer w-fit self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Quick KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-white/5">
          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Disputes</span>
            <span className="text-2xl font-black text-white font-mono">{disputes.length}</span>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Pending Ruling</span>
            <span className="text-2xl font-black text-amber-300 font-mono">{openCount}</span>
          </div>
          <div className="bg-[#22c55e]/10 rounded-2xl p-4 border border-[#22c55e]/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-[#22c55e] block tracking-wider">Resolved</span>
            <span className="text-2xl font-black text-[#22c55e] font-mono">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111712] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Match ID, player, reason..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 w-full sm:w-auto text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors cursor-pointer flex-1 sm:flex-initial ${
                statusFilter === 'ALL' ? 'bg-[#22c55e] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({disputes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors cursor-pointer flex-1 sm:flex-initial ${
                statusFilter === 'OPEN' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors cursor-pointer flex-1 sm:flex-initial ${
                statusFilter === 'RESOLVED' ? 'bg-[#22c55e] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Loading match disputes from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchDisputes}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white font-bold"
          >
            Retry
          </button>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl space-y-2">
          <CheckCircle2 className="w-10 h-10 text-[#22c55e]/50 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Disputes Found</h3>
          <p className="text-xs text-gray-400">All tournament match results are currently in agreement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => {
            const isOpen = String(dispute.Status || 'OPEN').toUpperCase() === 'OPEN';
            const evidenceUrl = dispute.EvidenceDriveURL || dispute.EvidenceURL;

            return (
              <div
                key={dispute.DisputeID}
                className={`bg-[#111712] border rounded-2xl p-5 transition-all ${
                  isOpen ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {dispute.DisputeID}
                      </span>
                      <span className="font-mono text-xs text-gray-400">Match: {dispute.MatchID}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          isOpen
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                        }`}
                      >
                        {dispute.Status || 'OPEN'}
                      </span>
                      {dispute.CreatedAt && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(dispute.CreatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-300 bg-black/40 rounded-xl p-3 border border-white/5">
                      <strong className="text-amber-400 block mb-0.5">Player Statement:</strong>
                      <p className="text-gray-300 leading-relaxed">{dispute.Reason || 'No details provided.'}</p>
                    </div>

                    {dispute.AdminDecision && (
                      <div className="text-xs text-[#22c55e] bg-[#22c55e]/10 rounded-xl p-3 border border-[#22c55e]/20">
                        <strong className="block mb-0.5 font-bold">Admin Ruling:</strong>
                        <p className="text-gray-200">{dispute.AdminDecision}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Evidence */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {evidenceUrl && (
                      <a
                        href={evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>View Evidence</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => handleOpenResolveModal(dispute)}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Adjudicate</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#22c55e] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adjudication Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111712] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Adjudicate Dispute
                  </h3>
                  <p className="text-[11px] text-gray-400">Match ID: {selectedDispute.MatchID}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-bold">
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Winning Player ID / UID
                </label>
                <input
                  type="text"
                  value={winnerId}
                  onChange={(e) => setWinnerId(e.target.value)}
                  placeholder="e.g. PLAYER-7K2X9Q or Player ID"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#22c55e] font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Specify the PlayerID declared as the match winner following evidence inspection.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Official Ruling &amp; Decision Notes
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  rows={3}
                  placeholder="Explanation of ruling based on screenshot evidence..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#22c55e]/20"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Award className="w-3.5 h-3.5" />
                  )}
                  <span>Declare Winner &amp; Finalize</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
