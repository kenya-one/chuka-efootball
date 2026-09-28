import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Clock,
  User,
  AlertCircle,
  Coins,
  Calendar,
  X,
} from 'lucide-react';
import { PaymentRecord } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';

export const AdminPaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  // Rejection modal
  const [rejectModalPayment, setRejectModalPayment] = useState<PaymentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TournamentAdminService.getPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err?.message || 'Network error fetching payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async (paymentId: string) => {
    setActionLoading(paymentId);
    setActionFeedback(null);
    try {
      await TournamentAdminService.confirmPayment(paymentId);
      setActionFeedback({ id: paymentId, success: true, msg: 'Payment confirmed & verified!' });
      await fetchPayments();
    } catch (err: any) {
      setActionFeedback({ id: paymentId, success: false, msg: err?.message || 'Verification failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalPayment) return;

    const pid = rejectModalPayment.PaymentID;
    setActionLoading(pid);
    try {
      await TournamentAdminService.rejectPayment(pid, rejectReason);
      setActionFeedback({ id: pid, success: true, msg: 'Payment marked as rejected.' });
      setRejectModalPayment(null);
      setRejectReason('');
      await fetchPayments();
    } catch (err: any) {
      setActionFeedback({ id: pid, success: false, msg: err?.message || 'Rejection failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const normalizeStatus = (s: string) => {
    const upper = String(s || 'PENDING').toUpperCase();
    if (upper === 'VERIFIED' || upper === 'PAID') return 'CONFIRMED';
    if (upper === 'FAILED') return 'REJECTED';
    return upper;
  };

  const filteredPayments = payments.filter((p) => {
    const status = normalizeStatus(p.Status);
    if (statusFilter !== 'ALL' && status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const target = `${p.PaymentID} ${p.PlayerID} ${(p as any).PlayerName || ''} ${(p as any).CompetitionName || ''} ${p.PaymentReference || ''} ${p.MpesaReceiptNumber || ''} ${p.CompetitionID || ''}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  const pendingCount = payments.filter((p) => normalizeStatus(p.Status) === 'PENDING').length;
  const verifiedCount = payments.filter((p) => normalizeStatus(p.Status) === 'CONFIRMED').length;
  const failedCount = payments.filter((p) => normalizeStatus(p.Status) === 'REJECTED').length;
  const totalAmount = payments
    .filter((p) => normalizeStatus(p.Status) === 'CONFIRMED')
    .reduce((sum, p) => sum + (Number(p.Amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 uppercase">
                Financial Operations
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">
                {verifiedCount} Confirmed • {pendingCount} Pending
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
              Payments &amp; Fee Tracking
            </h2>
            <p className="text-xs text-gray-400 max-w-2xl">
              Audit entry fees and activation receipts, verify M-Pesa transaction references, and track payment confirmation dates.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPayments}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer w-fit self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Quick KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/5">
          <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Received</span>
            <span className="text-2xl font-black text-white font-mono">KES {totalAmount.toLocaleString()}</span>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Pending Verification</span>
            <span className="text-2xl font-black text-amber-300 font-mono">{pendingCount}</span>
          </div>
          <div className="bg-[#22c55e]/10 rounded-2xl p-4 border border-[#22c55e]/20">
            <span className="text-[10px] uppercase font-bold text-[#22c55e] block tracking-wider">Confirmed</span>
            <span className="text-2xl font-black text-[#22c55e] font-mono">{verifiedCount}</span>
          </div>
          <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
            <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">Rejected</span>
            <span className="text-2xl font-black text-red-300 font-mono">{failedCount}</span>
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
            placeholder="Search player, competition, reference..."
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
              All ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors cursor-pointer flex-1 sm:flex-initial ${
                statusFilter === 'PENDING' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors cursor-pointer flex-1 sm:flex-initial ${
                statusFilter === 'CONFIRMED' ? 'bg-[#22c55e] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Confirmed ({verifiedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-colors cursor-pointer flex-1 sm:flex-initial ${
                statusFilter === 'REJECTED' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Rejected ({failedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Loading payments from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchPayments}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl space-y-2">
          <CreditCard className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Payments Recorded</h3>
          <p className="text-xs text-gray-400">Tournament and season entry payments will appear here for verification.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const isPending = normalizeStatus(payment.Status) === 'PENDING';
            const isVerified = normalizeStatus(payment.Status) === 'CONFIRMED';
            const isFailed = normalizeStatus(payment.Status) === 'REJECTED';
            const feedback = actionFeedback?.id === payment.PaymentID ? actionFeedback : null;
            const refCode = payment.PaymentReference || payment.MpesaReceiptNumber || '—';

            return (
              <div
                key={payment.PaymentID}
                className={`bg-[#111712] border rounded-2xl p-5 transition-all ${
                  isPending ? 'border-amber-500/40 bg-amber-500/[0.02]' : isFailed ? 'border-red-500/30' : 'border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Top Row: Payment ID, Fee, Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {payment.PaymentID}
                      </span>
                      <span className="font-bold text-sm text-[#22c55e] font-mono">
                        {payment.Currency || 'KES'} {payment.Amount?.toLocaleString() || '0'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isVerified
                            ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {isVerified ? 'CONFIRMED' : isFailed ? 'REJECTED' : 'PENDING'}
                      </span>
                    </div>

                    {/* Metadata: Player Name, Competition Name, Reference, Confirmation Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-gray-500 text-[10px] uppercase font-bold block">Player</span>
                        <span className="font-bold text-white font-mono">
                          {(payment as any).PlayerName || payment.PlayerID}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 text-[10px] uppercase font-bold block">Competition</span>
                        <span className="text-gray-300 font-semibold truncate block">
                          {(payment as any).CompetitionName || payment.CompetitionID || 'Chuka Tournament'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 text-[10px] uppercase font-bold block">Payment Reference</span>
                        <code className="text-[#22c55e] font-mono font-bold">{refCode}</code>
                      </div>

                      <div>
                        <span className="text-gray-500 text-[10px] uppercase font-bold block">Confirmation Date</span>
                        <span className="text-gray-300 font-mono text-[11px]">
                          {payment.VerifiedAt ? new Date(payment.VerifiedAt).toLocaleString() : 'Not confirmed yet'}
                        </span>
                      </div>
                    </div>

                    {feedback && (
                      <div
                        className={`text-xs p-2 rounded-lg ${
                          feedback.success ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {feedback.msg}
                      </div>
                    )}
                  </div>

                  {/* Verification Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleVerify(payment.PaymentID)}
                          disabled={actionLoading === payment.PaymentID}
                          className="px-3.5 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-[#22c55e]/20"
                        >
                          {actionLoading === payment.PaymentID ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Confirm</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectModalPayment(payment)}
                          disabled={actionLoading === payment.PaymentID}
                          className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        {isVerified ? 'Verified by Admin' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111712] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Reject Payment Record
            </h3>
            <p className="text-xs text-gray-400">
              Provide an administrative reason for rejecting payment{' '}
              <strong className="text-white">{rejectModalPayment.PaymentID}</strong>.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. M-Pesa transaction reference not found or amount mismatch..."
                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-red-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalPayment(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectModalPayment.PaymentID}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
