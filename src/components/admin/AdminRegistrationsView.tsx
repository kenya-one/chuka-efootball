import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Trophy,
  Award,
  Calendar,
  CreditCard,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { CompetitionRegistration, Competition } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';

export const AdminRegistrationsView: React.FC = () => {
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regs, comps] = await Promise.all([
        TournamentAdminService.getRegistrations(),
        TournamentAdminService.getCompetitions(),
      ]);
      setRegistrations(regs);
      setCompetitions(comps);
    } catch (err: any) {
      setError(err?.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (regId: string) => {
    try {
      await TournamentAdminService.confirmRegistration(regId);
      setSuccessMsg(`Registration ${regId} has been approved.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve registration.');
    }
  };

  const handleReject = async (regId: string) => {
    if (!window.confirm(`Are you sure you want to reject registration ${regId}?`)) return;
    try {
      await TournamentAdminService.rejectRegistration(regId);
      setSuccessMsg(`Registration ${regId} marked as rejected.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject registration.');
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (selectedCompId !== 'ALL' && r.CompetitionID !== selectedCompId) return false;
    if (selectedStatus !== 'ALL' && r.Status !== selectedStatus) return false;
    if (selectedPaymentStatus !== 'ALL' && r.PaymentStatus !== selectedPaymentStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const target = `${r.RegistrationID} ${r.PlayerID} ${r.eFootballUsername} ${r.CompetitionName || ''} ${r.PaymentID || ''}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  const pendingCount = registrations.filter((r) => r.Status === 'PENDING').length;
  const approvedCount = registrations.filter((r) => r.Status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Participant Registry
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">
                {approvedCount} Confirmed • {pendingCount} Pending
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              Competition Registrations
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Audit player entries across Knockout Cups and League seasons. Approve verified participants and prevent duplicate submissions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-[#111712] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player, tag, ID..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            />
          </div>

          {/* Competition Filter */}
          <div>
            <select
              value={selectedCompId}
              onChange={(e) => setSelectedCompId(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="ALL">All Competitions</option>
              {competitions.map((c) => (
                <option key={c.CompetitionID} value={c.CompetitionID}>
                  {c.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Registration Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved / Confirmed</option>
              <option value="PENDING">Pending Approval</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#22c55e]"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid / Verified</option>
              <option value="PENDING">Payment Pending</option>
              <option value="NOT_REQUIRED">Free / Not Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading registrations from database...</p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-2">
          <Users className="w-8 h-8 text-gray-500 mx-auto" />
          <p className="text-sm font-bold text-white uppercase font-mono">No Registrations Found</p>
          <p className="text-xs text-gray-400">No records match the current filter criteria.</p>
        </div>
      ) : (
        <div className="bg-[#111712] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-black/40 border-b border-white/10 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Competitor</th>
                  <th className="py-3 px-4">Competition</th>
                  <th className="py-3 px-3 text-center">Fee</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRegistrations.map((r) => (
                  <tr key={r.RegistrationID} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-300">
                      {r.RegistrationID}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm font-mono">{r.eFootballUsername}</div>
                      <div className="text-[11px] text-gray-400 font-mono">ID: {r.PlayerID}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-200 truncate max-w-[200px]">
                        {r.CompetitionName || r.CompetitionID}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {r.CompetitionType || 'TOURNAMENT'} • {r.RegisteredAt ? r.RegisteredAt.slice(0, 10) : 'Recent'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      KES {r.EntryFee ?? 20}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.PaymentStatus === 'PAID'
                            ? 'bg-[#22c55e]/20 text-[#22c55e]'
                            : r.PaymentStatus === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {r.PaymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.Status === 'APPROVED'
                            ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                            : r.Status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {r.Status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.Status !== 'APPROVED' && (
                          r.PaymentStatus === 'CONFIRMED' || r.PaymentStatus === 'PAID' ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(r.RegistrationID)}
                              className="px-2.5 py-1 rounded-lg bg-[#22c55e] hover:bg-[#22c55e]/80 text-black text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                              title="Payment is confirmed. Approve entry."
                            >
                              Approve
                            </button>
                          ) : (
                            <span
                              className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400/80 text-[10px] font-semibold border border-amber-500/20 cursor-not-allowed"
                              title="Registration approval requires payment confirmation first in the Payments tab."
                            >
                              Awaiting Payment
                            </span>
                          )
                        )}
                        {r.Status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleReject(r.RegistrationID)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold uppercase tracking-wider border border-red-500/30 transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
