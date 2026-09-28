import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  Award,
  Crown,
  Users,
  RefreshCw,
  Copy,
  FileText,
  CreditCard,
  Lock,
} from 'lucide-react';
import {
  CupTournamentRecord,
  CupMatchRecord,
  CupRegistrationRecord,
  KnockoutTournament,
  KnockoutMatch,
  KnockoutRegistration,
  Player,
  ThemeMode,
  ResultSubmissionPayload,
  Competition,
  CompetitionRegistration,
} from '../../types';
import {
  getCurrentCup,
  getCupBracket,
  submitCupResult,
  submitCupDispute,
} from '../../api/endpoints';
import { TournamentAdminService, KNOCKOUT_RULES } from '../../services/tournamentAdminService';
import { SubmitResultModal } from '../matches/SubmitResultModal';
import { SubmitDisputeModal } from '../matches/SubmitDisputeModal';
import { CompetitionRegistrationModal } from '../competitions/CompetitionRegistrationModal';

interface KnockoutViewProps {
  tournaments?: (CupTournamentRecord | KnockoutTournament | Competition)[];
  matches?: (CupMatchRecord | KnockoutMatch)[];
  registrations?: (CupRegistrationRecord | KnockoutRegistration | CompetitionRegistration)[];
  currentPlayer: Player | null;
  isGuest?: boolean;
  theme?: ThemeMode;
  onOpenRules?: () => void;
  onSubmitResult?: (payload: ResultSubmissionPayload) => Promise<void>;
  onConfirmResult?: (matchId: string, winnerId?: string) => Promise<void>;
  onSubmitDispute?: (matchId: string, reason: string) => Promise<void>;
  onRegisterKnockout?: (tournamentId: string) => Promise<void>;
}

export const KnockoutView: React.FC<KnockoutViewProps> = ({
  tournaments: propTournaments,
  matches: propMatches,
  registrations: propRegistrations,
  currentPlayer,
  isGuest = false,
  theme = 'dark',
  onOpenRules,
  onSubmitResult: propOnSubmitResult,
  onConfirmResult: _propOnConfirmResult,
  onSubmitDispute: propOnSubmitDispute,
  onRegisterKnockout: propOnRegisterKnockout,
}) => {
  const isDark = theme === 'dark';

  const [tournaments, setTournaments] = useState<Competition[]>([]);
  const [matches, setMatches] = useState<any[]>(propMatches || []);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [disputeMatch, setDisputeMatch] = useState<any | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTill, setCopiedTill] = useState(false);
  const [docNotice, setDocNotice] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const TILL_NUMBER = KNOCKOUT_RULES.PaymentTill; // 6817863
  const REQUIRED_PLAYERS = KNOCKOUT_RULES.MinPlayers; // 1,024
  const ENTRY_FEE = KNOCKOUT_RULES.EntryFee; // 20
  const PRIZE_POOL = KNOCKOUT_RULES.PrizeAmount; // 1,000

  // Load authoritative tournament data from backend
  const loadCupData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [comps, allRegs, fixtures] = await Promise.all([
        TournamentAdminService.getCompetitions('KNOCKOUT'),
        TournamentAdminService.getRegistrations(),
        TournamentAdminService.getFixtures(),
      ]);

      if (comps && comps.length > 0) {
        setTournaments(comps);
      }
      setRegistrations(allRegs);

      // Load bracket fixtures if tournament exists
      const targetComp = comps[0];
      if (targetComp) {
        const compFixtures = fixtures.filter((f) => f.CompetitionID === targetComp.CompetitionID);
        setMatches(compFixtures);
      } else {
        setMatches(fixtures);
      }
    } catch (err: any) {
      console.warn('KnockoutView load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCupData();
  }, [currentPlayer]);

  const activeTournament = tournaments[0] || null;

  // Authoritative approved count for knockout
  const compRegistrations = activeTournament
    ? registrations.filter((r) => r.CompetitionID === activeTournament.CompetitionID)
    : registrations;

  const approvedRegistrations = compRegistrations.filter(
    (r) => r.Status === 'APPROVED' || r.PaymentStatus === 'PAID'
  );
  const pendingRegistrations = compRegistrations.filter(
    (r) => r.Status === 'PENDING' || r.PaymentStatus === 'PENDING'
  );

  const approvedCount = activeTournament?.ApprovedCount !== undefined
    ? activeTournament.ApprovedCount
    : approvedRegistrations.length;

  const userRegistration = currentPlayer
    ? compRegistrations.find(
        (r) => r.PlayerID === currentPlayer.PlayerID || r.GoogleUID === currentPlayer.FirebaseUID
      )
    : null;

  const copyTill = () => {
    navigator.clipboard.writeText(TILL_NUMBER);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
  };

  const handleOpenDoc = (url?: string, docName?: string) => {
    if (url && url.trim().startsWith('http')) {
      const a = document.createElement('a');
      a.href = url.trim();
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } else {
      setDocNotice(`The ${docName || 'Google Document'} is not configured yet.`);
      setTimeout(() => setDocNotice(null), 3500);
    }
  };

  const handleSubmitResult = async (payload: ResultSubmissionPayload) => {
    setErrorMessage(null);
    if (propOnSubmitResult) {
      await propOnSubmitResult(payload);
    } else {
      const res = await submitCupResult({
        matchId: payload.matchId,
        tournamentId: activeTournament?.CompetitionID,
        submitterScore: payload.player1Score,
        opponentScore: payload.player2Score,
        screenshotBase64: payload.screenshotBase64,
        screenshotName: payload.screenshotName,
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'Result submission failed.');
      }
      await loadCupData();
    }
  };

  const handleSubmitDispute = async (matchId: string, reason: string) => {
    setErrorMessage(null);
    if (propOnSubmitDispute) {
      await propOnSubmitDispute(matchId, reason);
    } else {
      const res = await submitCupDispute({
        matchId,
        tournamentId: activeTournament?.CompetitionID,
        reason,
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'Dispute filing failed.');
      }
      await loadCupData();
    }
  };

  return (
    <div id="knockout-page" className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>Weekly Single Elimination Knockout</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mt-1"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Weekly Knockout (1,024 Players)
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Official Chuka eFootball cup. Entry: KSh 20 • Till: {TILL_NUMBER} • Prize: KSh 1,000.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={loadCupData}
            disabled={loading}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark ? 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
            }`}
            title="Refresh live data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#22c55e]' : ''}`} />
          </button>

          {/* Published Google Document Actions */}
          <button
            type="button"
            onClick={() => handleOpenDoc(activeTournament?.RulesDocumentURL, 'Official Rules')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>View Rules</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc(activeTournament?.RegisteredPlayersDocumentURL, 'Registered Players Document')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>View Registered Players</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc(activeTournament?.KnockoutBracketDocumentURL, 'Knockout Bracket Document')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>View Knockout Bracket</span>
          </button>
        </div>
      </div>

      {docNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{docNotice}</span>
        </div>
      )}

      {regSuccess && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{regSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Honest Empty State if no active tournament configured */}
      {!activeTournament ? (
        <div
          id="knockout-empty-state"
          className="p-10 sm:p-14 text-center rounded-3xl border border-white/10 bg-[#111612]"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h2
            className="text-xl font-bold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            No competitions configured.
          </h2>
          <p className="text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed text-gray-400">
            The weekly knockout tournament is scheduled by administrators. Check back shortly for registration opening.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Tournament Card */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark
                ? 'bg-gradient-to-r from-[#121c14] to-[#0d140f] border-[#22c55e]/40'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                {/* Competition Profile Picture */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/15 bg-black/60 shrink-0 relative shadow-md">
                  {(activeTournament.ProfileImageURL || activeTournament.ImageURL) ? (
                    <img
                      src={activeTournament.ProfileImageURL || activeTournament.ImageURL}
                      alt={activeTournament.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-[#22c55e]/10 to-transparent">
                      <Trophy className="w-8 h-8 text-[#22c55e]/40" />
                      <span className="text-[8px] uppercase font-bold text-gray-400 mt-0.5">Cup</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e]">
                      {activeTournament.Status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {activeTournament.CompetitionID}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {activeTournament.Name}
                  </h2>

                  {/* Rules summary chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Entry Fee: <strong>KSh {ENTRY_FEE}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Winner Prize: <strong>KSh {PRIZE_POOL.toLocaleString()}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Approved: <strong className="text-white font-mono">{approvedCount.toLocaleString()} / {REQUIRED_PLAYERS.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Status / Actions */}
              <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                {isGuest ? (
                  <div className="text-xs text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    Sign in with Google to register.
                  </div>
                ) : userRegistration ? (
                  <div className="space-y-1.5 text-right">
                    {userRegistration.Status === 'APPROVED' ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Officially Approved &amp; Roster Confirmed</span>
                      </div>
                    ) : userRegistration.Status === 'PENDING' ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold">
                        <FileCheck className="w-4 h-4" />
                        <span>PENDING PAYMENT APPROVAL</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Registration {userRegistration.Status}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400">
                      {userRegistration.Status === 'PENDING'
                        ? `Awaiting admin approval for Till ${TILL_NUMBER}.`
                        : 'Your participation is active.'}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#22c55e]/20"
                  >
                    Register for Knockout (KSh {ENTRY_FEE})
                  </button>
                )}
              </div>
            </div>

            {/* Till Number Instructions & Copy Button */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase">M-Pesa Payment Instructions:</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                    <span>Pay KSh {ENTRY_FEE} to Till Number:</span>
                    <span className="text-amber-400 font-black text-base">{TILL_NUMBER}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={copyTill}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedTill ? '✓ Copied Till!' : 'Copy Till Number'}</span>
              </button>
            </div>
          </div>

          {/* Knockout Progress Status */}
          <div className="p-5 rounded-3xl bg-[#111712] border border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#22c55e]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Official Approved Player Count
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#22c55e]">
                {approvedCount.toLocaleString()} / {REQUIRED_PLAYERS.toLocaleString()} Approved Players
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#22c55e] to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (approvedCount / REQUIRED_PLAYERS) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <span>Only administrator-approved registrations count toward the official roster.</span>
              <span className="font-semibold text-amber-300">
                {approvedCount < REQUIRED_PLAYERS
                  ? `Knockout bracket unlocks when ${REQUIRED_PLAYERS.toLocaleString()} players are approved.`
                  : '1,024 approved players reached! Ready for bracket.'}
              </span>
            </div>
          </div>

          {/* Fixtures & Bracket Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Trophy className="w-4 h-4 text-[#22c55e]" />
                <span>Knockout Bracket &amp; Match Fixtures</span>
              </h2>
              {approvedCount < REQUIRED_PLAYERS && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Bracket Locked</span>
                </span>
              )}
            </div>

            {approvedCount < REQUIRED_PLAYERS && matches.length === 0 ? (
              <div className="p-8 sm:p-12 text-center rounded-3xl border border-white/10 bg-black/40 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  Knockout Bracket Locked
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  The automated 512-match Round 1 bracket will unlock as soon as exactly <strong>1,024 approved players</strong> are verified by administration.
                </p>
                <div className="text-xs font-mono text-[#22c55e] font-bold pt-2">
                  Current Status: {approvedCount.toLocaleString()} / 1,024 approved players
                </div>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-8 text-center rounded-3xl border border-white/10 bg-black/20 text-gray-400 text-xs">
                No fixtures generated yet. Tournament administrator will generate the 512 Round 1 matches once registration concludes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => {
                  const p1Name = match.Player1Name || match.Player1Username || 'Competitor 1';
                  const p2Name = match.Player2Name || match.Player2Username || 'Competitor 2';
                  const isUserInMatch =
                    currentPlayer &&
                    (match.Player1ID === currentPlayer.PlayerID ||
                      match.Player2ID === currentPlayer.PlayerID ||
                      p1Name === currentPlayer.eFootballUsername ||
                      p2Name === currentPlayer.eFootballUsername);

                  const hasScore = match.Player1Score !== null && match.Player2Score !== null;
                  const isConfirmed = match.Status === 'COMPLETED' || match.Status === 'CONFIRMED';
                  const isDisputed = match.Status === 'DISPUTED';

                  return (
                    <div
                      key={match.FixtureID || match.MatchID}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDark ? 'bg-[#111612] border-white/10' : 'bg-white border-gray-200'
                      } ${isUserInMatch ? 'ring-1 ring-[#22c55e]/50' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-3">
                        <span className="font-mono text-[#22c55e] font-bold">
                          {match.Round || 'Round of 1024'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            isConfirmed
                              ? 'bg-[#22c55e]/20 text-[#22c55e]'
                              : isDisputed
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-700/40 text-gray-400'
                          }`}
                        >
                          {match.Status || 'SCHEDULED'}
                        </span>
                      </div>

                      <div className="space-y-2 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white truncate max-w-[180px]">
                            {p1Name}
                          </span>
                          <span className="font-mono font-bold text-base text-[#22c55e]">
                            {hasScore ? match.Player1Score : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white truncate max-w-[180px]">
                            {p2Name}
                          </span>
                          <span className="font-mono font-bold text-base text-[#22c55e]">
                            {hasScore ? match.Player2Score : '-'}
                          </span>
                        </div>
                      </div>

                      {isUserInMatch && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() => setSelectedMatch(match)}
                              className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Submit Result</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDisputeMatch(match)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Dispute</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegisterModalOpen && activeTournament && (
        <CompetitionRegistrationModal
          competition={activeTournament}
          player={currentPlayer}
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            setRegSuccess('Registration submitted! Payment status is PENDING APPROVAL.');
            loadCupData();
          }}
        />
      )}

      {/* Dual Result Submission Modal */}
      {selectedMatch && (
        <SubmitResultModal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          matchId={selectedMatch.FixtureID || selectedMatch.MatchID}
          competition="Knockout"
          player1Username={selectedMatch.Player1Name || selectedMatch.Player1Username}
          player2Username={selectedMatch.Player2Name || selectedMatch.Player2Username}
          currentPlayerUsername={currentPlayer?.eFootballUsername}
          onSubmit={async (payload) => {
            await handleSubmitResult(payload);
            setSelectedMatch(null);
          }}
        />
      )}

      {/* Dispute Modal */}
      {disputeMatch && (
        <SubmitDisputeModal
          isOpen={!!disputeMatch}
          onClose={() => setDisputeMatch(null)}
          matchId={disputeMatch.FixtureID || disputeMatch.MatchID}
          currentPlayerId={currentPlayer?.PlayerID || ''}
          onSubmit={async (reason) => {
            await handleSubmitDispute(disputeMatch.FixtureID || disputeMatch.MatchID, reason);
            setDisputeMatch(null);
          }}
        />
      )}
    </div>
  );
};
