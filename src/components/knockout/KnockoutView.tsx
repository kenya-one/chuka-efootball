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
import { RegisteredMembersPanel } from '../competitions/RegisteredMembersPanel';
import { CompetitionHero, CompetitionDocumentsShelf, CompetitionSelector } from '../competitions/CompetitionHero';
import { GazetteDocumentViewer, GazetteKind } from '../common/GazetteDocumentViewer';
import { splitRegistrations, isDeadRegistration, buildBracketPlan } from '../../utils/competitionUtils';

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
  const [allFixtures, setAllFixtures] = useState<any[]>(propMatches || []);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docKind, setDocKind] = useState<GazetteKind | null>(null);

  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [disputeMatch, setDisputeMatch] = useState<any | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTill, setCopiedTill] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

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
      setTournaments(comps || []);
      setRegistrations(allRegs);
      setAllFixtures(fixtures);
    } catch (err: any) {
      console.warn('KnockoutView load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCupData();
  }, [currentPlayer]);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.startsWith('#knockout?')) {
      const q = new URLSearchParams(hash.slice('#knockout?'.length));
      const id = q.get('tournamentId');
      if (id) setSelectedId(id);
    }
  }, []);

  // Newest / most active tournaments first
  const orderedTournaments = [...tournaments].sort((a, b) => {
    const rank = (c: Competition) => (c.Status === 'OPEN' ? 0 : c.Status === 'IN_PROGRESS' ? 1 : c.Status === 'FULL' ? 2 : 3);
    return rank(a) - rank(b);
  });
  const activeTournament = orderedTournaments.find((t) => t.CompetitionID === selectedId) || orderedTournaments[0] || null;

  const compRegistrations = activeTournament
    ? registrations.filter((r) => r.CompetitionID === activeTournament.CompetitionID)
    : [];
  const { verified: verifiedRegs, unverified: unverifiedRegs } = splitRegistrations(compRegistrations);

  const matches = activeTournament
    ? allFixtures.filter((f) => f.CompetitionID === activeTournament.CompetitionID)
    : [];

  const ENTRY_FEE = activeTournament?.EntryFee ?? KNOCKOUT_RULES.EntryFee;
  const REQUIRED_PLAYERS = activeTournament?.MinPlayers || KNOCKOUT_RULES.MinPlayers;
  const MAX_PLAYERS = activeTournament?.MaxPlayers || KNOCKOUT_RULES.MaxPlayers;
  const PRIZE_POOL = activeTournament?.PrizeAmount || KNOCKOUT_RULES.PrizeAmount;
  const TILL_NUMBER = activeTournament?.PaymentTill || KNOCKOUT_RULES.PaymentTill;

  const approvedCount =
    compRegistrations.length > 0 ? verifiedRegs.length : activeTournament?.ApprovedCount ?? 0;

  const userRegistration = currentPlayer
    ? (() => {
        const mine = compRegistrations.filter(
          (r) => r.PlayerID === currentPlayer.PlayerID || r.GoogleUID === currentPlayer.FirebaseUID
        );
        return mine.find((r) => !isDeadRegistration(r)) || mine[0] || null;
      })()
    : null;

  const copyTill = () => {
    navigator.clipboard.writeText(TILL_NUMBER);
    setCopiedTill(true);
    setTimeout(() => setCopiedTill(false), 2000);
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
    <div id="knockout-page" className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>Single Elimination Cups</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide mt-1"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Knockout Tournaments
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Register, follow the verified entrants and read the official gazette for each cup.
          </p>
        </div>
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
      </div>

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

      {!activeTournament ? (
        <div id="knockout-empty-state" className="p-10 sm:p-14 text-center rounded-3xl border border-white/10 bg-[#111612]">
          <div className="w-16 h-16 rounded-3xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            No tournament open yet
          </h2>
          <p className="text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed text-gray-400">
            The next knockout is announced by the administrators. Check back shortly for registration.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <CompetitionSelector
            competitions={orderedTournaments}
            selectedId={activeTournament.CompetitionID}
            onSelect={setSelectedId}
          />

          <CompetitionHero
            competition={activeTournament}
            verifiedCount={approvedCount}
            unverifiedCount={unverifiedRegs.length}
            minPlayers={REQUIRED_PLAYERS}
            maxPlayers={MAX_PLAYERS}
            entryFee={ENTRY_FEE}
            prize={PRIZE_POOL}
            till={TILL_NUMBER}
            isGuest={isGuest}
            userRegistration={userRegistration}
            registerLabel={`Register for Knockout (KSh ${ENTRY_FEE})`}
            activeLabel="Verified — you are in the draw"
            isFull={approvedCount >= MAX_PLAYERS}
            copiedTill={copiedTill}
            onCopyTill={copyTill}
            onRegister={() => setIsRegisterModalOpen(true)}
          />

          <CompetitionDocumentsShelf isLeague={false} onOpen={setDocKind} />

          <RegisteredMembersPanel
            registrations={compRegistrations}
            currentPlayer={currentPlayer}
            loading={loading && registrations.length === 0}
          />

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
                  <span>Awaiting Draw</span>
                </span>
              )}
            </div>

            {matches.length === 0 && approvedCount < REQUIRED_PLAYERS ? (
              <div className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7 space-y-5">
                <div className="text-center space-y-1">
                  <div className="text-xs font-mono font-bold text-[#22c55e]">
                    {approvedCount.toLocaleString()} / {REQUIRED_PLAYERS.toLocaleString()} verified players
                  </div>
                  <p className="text-xs text-gray-400">The bracket has not been drawn yet. Here is how it will work:</p>
                </div>
                <ol className="grid sm:grid-cols-2 gap-2.5 text-xs text-gray-300">
                  {[
                    ['1', 'Register & pay', `Pay KSh ${ENTRY_FEE} to Till ${TILL_NUMBER} and submit your reference.`],
                    ['2', 'Get verified', 'The administration confirms your payment. Only verified players enter the draw.'],
                    ['3', 'The draw', `At ${REQUIRED_PLAYERS.toLocaleString()} verified players, opponents are drawn at random.`],
                    ['4', 'Win to advance', 'Winners move on, losers are out. Extra time and penalties settle draws.'],
                  ].map(([n, t, d]) => (
                    <li key={n} className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-[#22c55e] text-black font-black flex items-center justify-center">{n}</span>
                      <span><strong className="text-white block">{t}</strong>{d}</span>
                    </li>
                  ))}
                </ol>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {buildBracketPlan(Math.pow(2, Math.ceil(Math.log2(Math.max(2, MAX_PLAYERS))))).map((r) => (
                      <div key={r.name} className="w-28 shrink-0 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-2.5 text-center">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-[#22c55e]">{r.name}</div>
                        <div className="text-sm font-mono font-bold text-white mt-1">{r.matches.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">{r.matches === 1 ? 'match' : 'matches'}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => setDocKind('bracket')} className="mx-auto flex items-center gap-1.5 text-xs font-bold text-[#22c55e] hover:underline cursor-pointer">
                  <FileText className="w-3.5 h-3.5" /> Read the full gazette notice
                </button>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-8 text-center rounded-3xl border border-white/10 bg-black/20 text-gray-400 text-xs">
                No fixtures generated yet. Round 1 is published once registration concludes.
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

      {docKind && activeTournament && (
        <GazetteDocumentViewer
          kind={docKind}
          competition={activeTournament}
          registrations={compRegistrations}
          fixtures={allFixtures}
          onClose={() => setDocKind(null)}
        />
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
