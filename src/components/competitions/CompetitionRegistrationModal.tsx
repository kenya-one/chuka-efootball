import React, { useState } from 'react';
import {
  Trophy,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  Shield,
  Coins,
  FileText,
  Loader2,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { Competition, Player, CompetitionRegistration } from '../../types';
import { CompetitionApiService } from '../../api/client';
import { TournamentAdminService } from '../../services/tournamentAdminService';

interface CompetitionRegistrationModalProps {
  competition: Competition;
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (registration: CompetitionRegistration) => void;
}

export const CompetitionRegistrationModal: React.FC<CompetitionRegistrationModalProps> = ({
  competition,
  player,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<CompetitionRegistration | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [copiedTill, setCopiedTill] = useState(false);

  const TILL_NUMBER = competition.PaymentTill || '6817863';
  const entryFee = competition.EntryFee !== undefined ? competition.EntryFee : (competition.CompetitionType === 'KNOCKOUT' ? 20 : 50);

  const copyTillNumber = () => {
    navigator.clipboard.writeText(TILL_NUMBER);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  if (!isOpen) return null;

  const isVerified = Boolean(player?.Verified);
  const isActive = player?.Status?.toUpperCase() === 'ACTIVE';
  const isProfileReady = isVerified && isActive;

  // Division check
  const compDivision = (competition.Division || 'OPEN').toUpperCase();
  const playerDivision = (player?.Division || 'OPEN').toUpperCase();
  const divisionMatches = compDivision === 'OPEN' || compDivision === playerDivision;

  const handleRegister = async () => {
    if (!player) {
      setError('You must create a player profile before registering for competitions.');
      return;
    }

    if (!isProfileReady) {
      setError('Your player profile must be verified and active to register.');
      return;
    }

    if (!divisionMatches) {
      setError(`This competition is restricted to ${compDivision} players. Your current division is ${playerDivision}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Try unified local + backend registration service
      const reg = await TournamentAdminService.registerPlayerForCompetition(
        competition.CompetitionID,
        player,
        paymentRef.trim() || undefined
      );

      // 2. Also notify backend API
      try {
        await CompetitionApiService.registerForCompetition(competition.CompetitionID);
      } catch {}

      setSuccessResult(reg);
      onSuccess(reg);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration. Please check eligibility.');
    } finally {
      setSubmitting(false);
    }
  };

  const imgUrl = competition.ProfileImageURL || competition.ImageURL;

  return (
    <div
      id="competition-reg-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="competition-reg-modal-card"
        className="relative w-full max-w-lg bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Competition Registration
              </h2>
              <p className="text-xs text-gray-400">Confirm official tournament entry</p>
            </div>
          </div>
          <button
            id="close-reg-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {successResult ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-mono uppercase">
                {successResult.PaymentStatus === 'PENDING' ? 'Pending Payment Approval' : 'Registration Confirmed!'}
              </h3>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                {successResult.PaymentStatus === 'PENDING'
                  ? `Your registration is logged and awaiting administrator verification of your payment to Till ${TILL_NUMBER}. Once approved, you will officially count toward tournament capacity.`
                  : `Your entry for ${competition.Name} has been officially approved!`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Registration ID:</span>
                <span className="text-[#22c55e] font-bold">{successResult.RegistrationID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Player ID:</span>
                <span className="text-white">{successResult.PlayerID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gamer Tag:</span>
                <span className="text-white font-bold">{successResult.eFootballUsername}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                  successResult.Status === 'APPROVED'
                    ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {successResult.Status === 'PENDING' ? 'PENDING PAYMENT APPROVAL' : successResult.Status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Till Number:</span>
                <span className="text-amber-400 font-bold">{TILL_NUMBER}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Status:</span>
                <span className="text-gray-300 font-bold">{successResult.PaymentStatus}</span>
              </div>
            </div>

            <button
              id="success-done-btn"
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer"
            >
              Done &amp; View My Registrations
            </button>
          </div>
        ) : (
          /* Form View */
          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Target Competition Summary with Profile Picture */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#22c55e] uppercase tracking-wider font-bold">
                  {competition.CompetitionID}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] text-[10px] font-semibold border border-[#22c55e]/30 uppercase">
                  {competition.Status}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shrink-0">
                  {imgUrl ? (
                    <img src={imgUrl} alt={competition.Name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white/5">
                      <Trophy className="w-6 h-6 text-[#22c55e]/40" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white leading-snug">{competition.Name}</h4>
                  {competition.Description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{competition.Description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Trophy className="w-3.5 h-3.5 text-gray-400" />
                  <span>{competition.CompetitionType} ({competition.Format})</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <span>Division: <strong>{competition.Division || 'OPEN'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Seats: {competition.RegisteredCount || 0} / {competition.MaxPlayers}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#22c55e] font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>
                    {competition.EntryFee > 0
                      ? `${competition.Currency} ${competition.EntryFee}`
                      : 'Free Entry'}
                  </span>
                </div>
              </div>
            </div>

            {/* Player Verification Status Preview */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
                Player Credentials Verification
              </span>

              {player ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">eFootball Gamer Tag:</span>
                    <span className="text-white font-mono font-bold">{player.eFootballUsername}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Player ID:</span>
                    <span className="text-gray-300 font-mono">{player.PlayerID}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Player Division:</span>
                    <span className="text-white font-bold">{player.Division || 'OPEN'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Verification Status:</span>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[#22c55e] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No player profile detected. Please complete registration first.</span>
                </div>
              )}
            </div>

            {/* Entry Fee & Official Till Payment Flow */}
            {entryFee > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span>Pay KSh {entryFee} to Till Number {TILL_NUMBER}</span>
                  </div>
                  <button
                    type="button"
                    onClick={copyTillNumber}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 hover:bg-amber-400 cursor-pointer shadow-sm"
                  >
                    <span>{copiedTill ? '✓ COPIED!' : 'COPY TILL NUMBER'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-[11px] text-gray-300">
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="text-white font-bold">M-Pesa Buy Goods / Till</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-400">Till Number:</span>
                    <span className="text-amber-400 font-bold text-xs">{TILL_NUMBER}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-400">Amount Due:</span>
                    <span className="text-white font-bold">KSh {entryFee}</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  After paying via M-Pesa, enter your M-Pesa transaction reference or SMS code below and click <strong>I HAVE PAID</strong>. Your registration will become <strong>PENDING PAYMENT APPROVAL</strong> until an admin verifies and approves the payment.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">
                    M-Pesa Transaction Reference / Code (Optional or from SMS)
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value.toUpperCase())}
                    placeholder="e.g. TKT4819ZZ or PENDING"
                    className="w-full py-2 px-3 bg-black/60 border border-white/20 rounded-xl text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-xs text-[#22c55e] flex items-center gap-2">
                <Coins className="w-4 h-4 shrink-0" />
                <span>Free Entry — No payment required for this event.</span>
              </div>
            )}

            {/* Rules reference */}
            {competition.RulesDocumentURL && (
              <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#22c55e]" />
                  Tournament Rules Document
                </span>
                <a
                  href={competition.RulesDocumentURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22c55e] hover:underline"
                >
                  View Official Rules
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-reg-btn"
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-reg-btn"
                type="button"
                onClick={handleRegister}
                disabled={submitting || !isProfileReady || !divisionMatches}
                className="flex-[2] py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Entry...</span>
                  </>
                ) : (
                  <>
                    <span>{entryFee > 0 ? 'I HAVE PAID' : 'Register for Free'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
