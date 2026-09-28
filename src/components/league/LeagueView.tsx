import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Users,
  RefreshCw,
  Copy,
  FileText,
  CreditCard,
  FileCheck,
  AlertCircle,
  Table,
} from 'lucide-react';
import {
  LeagueStanding,
  MatchFixture,
  Player,
  ThemeMode,
  ResultSubmissionPayload,
  Competition,
  CompetitionRegistration,
} from '../../types';
import {
  submitLeagueResult,
  confirmLeagueResult,
  submitCupDispute,
} from '../../api/endpoints';
import { TournamentAdminService, LEAGUE_RULES } from '../../services/tournamentAdminService';
import { SubmitResultModal } from '../matches/SubmitResultModal';
import { SubmitDisputeModal } from '../matches/SubmitDisputeModal';
import { CompetitionRegistrationModal } from '../competitions/CompetitionRegistrationModal';

interface LeagueViewProps {
  standings?: LeagueStanding[];
  matches?: MatchFixture[];
  currentPlayer: Player | null;
  isGuest?: boolean;
  theme?: ThemeMode;
  onOpenRules?: () => void;
  onSubmitResult?: (payload: ResultSubmissionPayload) => Promise<void>;
  onConfirmResult?: (matchId: string) => Promise<void>;
  onSubmitDispute?: (matchId: string, reason: string) => Promise<void>;
}

export const LeagueView: React.FC<LeagueViewProps> = ({
  currentPlayer,
  isGuest = false,
  theme = 'dark',
  onOpenRules,
  onSubmitResult: propOnSubmitResult,
  onConfirmResult: propOnConfirmResult,
  onSubmitDispute: propOnSubmitDispute,
}) => {
  const isDark = theme === 'dark';

  const [leagueCompetition, setLeagueCompetition] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);
  const [disputeMatch, setDisputeMatch] = useState<MatchFixture | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);
  const [docNotice, setDocNotice] = useState<string | null>(null);

  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const TILL_NUMBER = LEAGUE_RULES.PaymentTill; // 6817863
  const ENTRY_FEE = LEAGUE_RULES.EntryFee; // 50
  const MIN_PLAYERS = LEAGUE_RULES.MinPlayers; // 500
  const MAX_PLAYERS = LEAGUE_RULES.MaxPlayers; // 2048
  const PRIZE_POOL = LEAGUE_RULES.PrizeAmount; // 5000

  const loadLeagueData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [comps, allRegs] = await Promise.all([
        TournamentAdminService.getCompetitions('LEAGUE'),
        TournamentAdminService.getRegistrations(),
      ]);

      const targetComp = comps[0] || null;
      setLeagueCompetition(targetComp);
      setRegistrations(allRegs);

      if (targetComp) {
        const [liveFixtures, liveStandings] = await Promise.all([
          TournamentAdminService.getFixtures(targetComp.CompetitionID),
          TournamentAdminService.calculateLeagueStandings(targetComp.CompetitionID),
        ]);
        setFixtures(liveFixtures);
        setStandings(liveStandings);
      }
    } catch (err: any) {
      console.warn('LeagueView load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagueData();
  }, [currentPlayer]);

  // Registrations for this specific league
  const compRegs = leagueCompetition
    ? registrations.filter((r) => r.CompetitionID === leagueCompetition.CompetitionID)
    : [];

  const approvedRegistrations = compRegs.filter(
    (r) => r.Status === 'APPROVED' || r.PaymentStatus === 'PAID'
  );
  const pendingRegistrations = compRegs.filter(
    (r) => r.Status === 'PENDING' || r.PaymentStatus === 'PENDING'
  );

  const approvedCount = leagueCompetition?.ApprovedCount !== undefined
    ? leagueCompetition.ApprovedCount
    : approvedRegistrations.length;

  const isFull = approvedCount >= MAX_PLAYERS;

  const userRegistration = currentPlayer
    ? compRegs.find(
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
      const res = await submitLeagueResult({
        fixtureId: payload.matchId,
        seasonId: leagueCompetition?.CompetitionID,
        homeScore: payload.player1Score,
        awayScore: payload.player2Score,
        screenshotBase64: payload.screenshotBase64,
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'Result submission failed.');
      }
      await loadLeagueData();
    }
  };

  const handleConfirmResult = async (matchId: string) => {
    setErrorMessage(null);
    if (propOnConfirmResult) {
      await propOnConfirmResult(matchId);
    } else {
      const res = await confirmLeagueResult(matchId, true);
      if (!res.success) {
        throw new Error(res.error?.message || 'Confirmation failed.');
      }
      await loadLeagueData();
    }
  };

  const handleDispute = async (matchId: string, reason: string) => {
    setErrorMessage(null);
    if (propOnSubmitDispute) {
      await propOnSubmitDispute(matchId, reason);
    } else {
      const res = await submitCupDispute({
        matchId,
        tournamentId: leagueCompetition?.CompetitionID,
        reason,
      });
      if (!res.success) {
        throw new Error(res.error?.message || 'Dispute failed.');
      }
      await loadLeagueData();
    }
  };

  return (
    <div id="league-page" className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
            <Award className="w-3.5 h-3.5" />
            <span>Official Premier League Championship</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mt-1"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Chuka eFootball League
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Entry: KSh 50 • Till: {TILL_NUMBER} • Minimum: 500 • Maximum: 2,048 Players • Prize: KSh 5,000.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={loadLeagueData}
            disabled={loading}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark ? 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
            }`}
            title="Refresh table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#22c55e]' : ''}`} />
          </button>

          {/* Published Google Document Actions */}
          <button
            type="button"
            onClick={() => handleOpenDoc(leagueCompetition?.RulesDocumentURL, 'Official Rules')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>View Rules</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc(leagueCompetition?.RegisteredPlayersDocumentURL, 'Registered Players Document')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>View Registered Players</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc(leagueCompetition?.LeagueFixturesDocumentURL, 'League Fixtures Document')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#22c55e]" />
            <span>View League Fixtures</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc(leagueCompetition?.StandingsDocumentURL, 'League Standings Document')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
            <span>View League Standings</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc(leagueCompetition?.FinalResultsDocumentURL, 'Final Results Document')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>View Final Results</span>
          </button>
        </div>
      </div>

      {docNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{docNotice}</span>
        </div>
      )}

      {joinSuccess && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{joinSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Honest Empty State if no league configured */}
      {!leagueCompetition ? (
        <div
          id="league-empty-state"
          className="p-10 sm:p-14 text-center rounded-3xl border border-white/10 bg-[#111612]"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h2
            className="text-xl font-bold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            No competitions configured.
          </h2>
          <p className="text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed text-gray-400">
            The league championship schedule will appear here once officially created by administrators.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active League Card */}
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
                  {(leagueCompetition.ProfileImageURL || leagueCompetition.ImageURL) ? (
                    <img
                      src={leagueCompetition.ProfileImageURL || leagueCompetition.ImageURL}
                      alt={leagueCompetition.Name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-[#22c55e]/10 to-transparent">
                      <Award className="w-8 h-8 text-[#22c55e]/40" />
                      <span className="text-[8px] uppercase font-bold text-gray-400 mt-0.5">League</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e]">
                      {isFull ? 'REGISTRATION FULL' : leagueCompetition.Status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {leagueCompetition.CompetitionID}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    {leagueCompetition.Name}
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
                      <span>
                        Capacity: <strong className="text-white font-mono">{approvedCount.toLocaleString()} / {MAX_PLAYERS.toLocaleString()}</strong> (Min: {MIN_PLAYERS})
                      </span>
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
                        <span>Active League Participant</span>
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
                        : 'Your league standing is live.'}
                    </p>
                  </div>
                ) : isFull ? (
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
                    League registration is full — {MAX_PLAYERS} / {MAX_PLAYERS} players.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#22c55e]/20"
                  >
                    Join League (KSh {ENTRY_FEE})
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

          {/* League Capacity & Progress Tracker */}
          <div className="p-5 rounded-3xl bg-[#111712] border border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#22c55e]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Approved League Participation
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#22c55e]">
                {approvedCount.toLocaleString()} / {MAX_PLAYERS.toLocaleString()} Approved Players (Minimum: {MIN_PLAYERS})
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-500 ${
                  approvedCount >= MIN_PLAYERS ? 'bg-gradient-to-r from-[#22c55e] to-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (approvedCount / MAX_PLAYERS) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <span>Only approved registrations count toward capacity. Pending payments do not count.</span>
              <span className="font-semibold text-amber-300">
                {approvedCount >= MAX_PLAYERS
                  ? `League registration is full — ${MAX_PLAYERS.toLocaleString()} / ${MAX_PLAYERS.toLocaleString()} players.`
                  : approvedCount >= MIN_PLAYERS
                  ? `Minimum reached (${MIN_PLAYERS})! Registration open until ${MAX_PLAYERS.toLocaleString()}.`
                  : `Requires ${MIN_PLAYERS - approvedCount} more approved competitors to reach minimum threshold.`}
              </span>
            </div>
          </div>

          {/* League Standings Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Table className="w-4 h-4 text-[#22c55e]" />
                <span>Official League Standings</span>
              </h2>
              <span className="text-[11px] text-gray-400">
                Win: 3pts • Draw: 1pt • Loss: 0pts
              </span>
            </div>

            {standings.length === 0 ? (
              <div className="p-8 sm:p-12 text-center rounded-3xl border border-white/10 bg-black/30 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  No standings available yet.
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Standings will calculate automatically once official match results are confirmed.
                </p>
              </div>
            ) : (
              <div
                className={`rounded-3xl border overflow-hidden ${
                  isDark ? 'bg-[#111612] border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-[#090d0a] text-gray-400 uppercase font-mono tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-3 text-center">#</th>
                        <th className="py-3 px-4">Player</th>
                        <th className="py-3 px-2 text-center">P</th>
                        <th className="py-3 px-2 text-center">W</th>
                        <th className="py-3 px-2 text-center">D</th>
                        <th className="py-3 px-2 text-center">L</th>
                        <th className="py-3 px-2 text-center hidden sm:table-cell">GF</th>
                        <th className="py-3 px-2 text-center hidden sm:table-cell">GA</th>
                        <th className="py-3 px-2 text-center">GD</th>
                        <th className="py-3 px-4 text-center font-bold text-[#22c55e]">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium">
                      {standings.map((row, idx) => {
                        const isCurrent =
                          currentPlayer &&
                          (row.PlayerID === currentPlayer.PlayerID ||
                            row.eFootballUsername === currentPlayer.eFootballUsername);

                        return (
                          <tr
                            key={row.PlayerID || idx}
                            className={`hover:bg-white/5 transition-colors ${
                              isCurrent ? 'bg-[#22c55e]/10 text-white' : ''
                            }`}
                          >
                            <td className="py-3.5 px-3 text-center font-mono font-bold text-gray-400">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                              <span className="truncate max-w-[140px] sm:max-w-none">
                                {row.eFootballUsername}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#22c55e] text-black">
                                  YOU
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-2 text-center text-gray-300">{row.Played || 0}</td>
                            <td className="py-3.5 px-2 text-center text-gray-300">{row.Wins || 0}</td>
                            <td className="py-3.5 px-2 text-center text-gray-300">{row.Draws || 0}</td>
                            <td className="py-3.5 px-2 text-center text-gray-300">{row.Losses || 0}</td>
                            <td className="py-3.5 px-2 text-center text-gray-400 hidden sm:table-cell">{row.GoalsFor || 0}</td>
                            <td className="py-3.5 px-2 text-center text-gray-400 hidden sm:table-cell">{row.GoalsAgainst || 0}</td>
                            <td className="py-3.5 px-2 text-center font-mono">
                              <span className={row.GoalDifference > 0 ? 'text-[#22c55e]' : row.GoalDifference < 0 ? 'text-red-400' : 'text-gray-400'}>
                                {row.GoalDifference > 0 ? `+${row.GoalDifference}` : row.GoalDifference || 0}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-[#22c55e]">
                              {row.Points || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Matchday Fixtures Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
              <Calendar className="w-4 h-4 text-[#22c55e]" />
              <span>League Match Fixtures</span>
            </h2>

            {fixtures.length === 0 ? (
              <div className="p-8 text-center rounded-3xl border border-white/10 bg-black/20 text-gray-400 text-xs">
                No league fixtures generated yet. Dynamic fixtures will be scheduled once approved competitors join.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fixtures.map((match) => {
                  const p1Name = match.Player1Name || 'Player 1';
                  const p2Name = match.Player2Name || 'Player 2';
                  const isUserInMatch =
                    currentPlayer &&
                    (match.Player1ID === currentPlayer.PlayerID ||
                      match.Player2ID === currentPlayer.PlayerID ||
                      p1Name === currentPlayer.eFootballUsername ||
                      p2Name === currentPlayer.eFootballUsername);

                  const hasScore = match.Player1Score !== null && match.Player2Score !== null;
                  const isConfirmed = match.Status === 'COMPLETED';

                  return (
                    <div
                      key={match.FixtureID}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDark ? 'bg-[#111612] border-white/10' : 'bg-white border-gray-200'
                      } ${isUserInMatch ? 'ring-1 ring-[#22c55e]/50' : ''}`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-3">
                        <span className="font-mono text-[#22c55e] font-bold">
                          {match.Round || 'Matchday'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            isConfirmed ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-gray-700/40 text-gray-400'
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
      {isRegisterModalOpen && leagueCompetition && (
        <CompetitionRegistrationModal
          competition={leagueCompetition}
          player={currentPlayer}
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            setJoinSuccess('League registration submitted! Payment is PENDING APPROVAL.');
            loadLeagueData();
          }}
        />
      )}

      {/* Dual Result Submission Modal */}
      {selectedMatch && (
        <SubmitResultModal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          matchId={selectedMatch.FixtureID}
          competition="League"
          player1Username={selectedMatch.Player1Name}
          player2Username={selectedMatch.Player2Name}
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
          matchId={disputeMatch.FixtureID}
          currentPlayerId={currentPlayer?.PlayerID || ''}
          onSubmit={async (reason) => {
            await handleDispute(disputeMatch.FixtureID, reason);
            setDisputeMatch(null);
          }}
        />
      )}
    </div>
  );
};
