import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RefreshCw,
  FileText,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Coins,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { CompetitionRegistration } from '../../types';
import { CompetitionApiService } from '../../api/client';

interface MyRegistrationsViewProps {
  onBrowseCompetitions?: () => void;
}

export const MyRegistrationsView: React.FC<MyRegistrationsViewProps> = ({
  onBrowseCompetitions,
}) => {
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const res = await CompetitionApiService.getMyRegistrations();
      if (res.success && res.data?.registrations) {
        setRegistrations(res.data.registrations);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
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

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus.toUpperCase()) {
      case 'PAID':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 text-[10px] font-bold uppercase">
            Payment Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
            Payment Required
          </span>
        );
      case 'NOT_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 text-[10px] font-bold uppercase">
            Free Entry
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 text-[10px] uppercase">
            {paymentStatus}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="my-registrations-view" className="space-y-6">
      {/* Header */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-2 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#22c55e]" />
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              My Competition Entries
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            View your registered tournaments, qualification status, and bracket access.
          </p>
        </div>

        <button
          id="refresh-my-registrations-btn"
          type="button"
          onClick={loadRegistrations}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#22c55e]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading your competition records...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              No Registered Competitions Yet
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              You haven't entered any tournaments or leagues. Discover available competitions to claim your slot.
            </p>
          </div>
          {onBrowseCompetitions && (
            <button
              id="browse-comps-cta-btn"
              type="button"
              onClick={onBrowseCompetitions}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <span>Explore Active Competitions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div
              key={reg.RegistrationID}
              id={`reg-item-${reg.RegistrationID}`}
              className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-white/20 transition-all shadow-lg"
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#22c55e] font-bold">
                      {reg.RegistrationID}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-xs font-mono text-gray-400">
                      Comp: {reg.CompetitionID}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {reg.CompetitionName || `Competition ${reg.CompetitionID}`}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getPaymentBadge(reg.PaymentStatus)}
                  {getStatusBadge(reg.Status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-400 block text-[11px]">Gamer Tag &amp; ID:</span>
                  <div className="font-mono text-white font-bold">{reg.eFootballUsername}</div>
                  <div className="text-[11px] font-mono text-gray-500">{reg.PlayerID}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 block text-[11px]">Format &amp; Division:</span>
                  <div className="text-white font-semibold">
                    {reg.CompetitionType || 'LEAGUE'} • {reg.Format || 'Standard'}
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#22c55e]" />
                    <span>Division: {reg.Division || 'OPEN'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 block text-[11px]">Registered On:</span>
                  <div className="text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{formatDate(reg.RegisteredAt)}</span>
                  </div>
                  {reg.VerifiedAt && (
                    <div className="text-[10px] text-gray-500">
                      Approved: {formatDate(reg.VerifiedAt)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 block text-[11px]">Entry Fee:</span>
                  <div className="text-[#22c55e] font-mono font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    <span>
                      {reg.EntryFee && reg.EntryFee > 0
                        ? `${reg.Currency || 'KES'} ${reg.EntryFee}`
                        : 'Free Entry'}
                    </span>
                  </div>
                  {reg.PaymentID && (
                    <div className="text-[10px] font-mono text-gray-500">
                      Ref: {reg.PaymentID}
                    </div>
                  )}
                </div>
              </div>

              {/* Links & Documents Bar */}
              {(reg.RulesDocumentURL || reg.StandingsDocumentURL) && (
                <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs">
                  {reg.RulesDocumentURL && (
                    <a
                      href={reg.RulesDocumentURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#22c55e] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Official Rules Document</span>
                    </a>
                  )}
                  {reg.StandingsDocumentURL && (
                    <a
                      href={reg.StandingsDocumentURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#22c55e] hover:underline"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Official Standings Sheet</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
