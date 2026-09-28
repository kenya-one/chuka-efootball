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
import { RegisteredMembersPanel } from '../competitions/RegisteredMembersPanel';
import { CompetitionHero, CompetitionDocumentsShelf, CompetitionSelector } from '../competitions/CompetitionHero';
import { GazetteDocumentViewer, GazetteKind } from '../common/GazetteDocumentViewer';
import { splitRegistrations, isDeadRegistration } from '../../utils/competitionUtils';

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

  const [leagues, setLeagues] = useState<Competition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [registrations, setRegistrations] = useState<CompetitionRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [docKind, setDocKind] = useState<GazetteKind | null>(null);

  // Modals state
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture | null>(null);
  const [disputeMatch, setDisputeMatch] = useState<MatchFixture | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);

  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ordered = [...leagues].sort((a, b) => {
    const rank = (c: Competition) => (c.Status === 'OPEN' ? 0 : c.Status === 'IN_PROGRESS' ? 1 : c.Status === 'FULL' ? 2 : 3);
    return rank(a) - rank(b);
  });
  const leagueCompetition = ordered.find((c) => c.CompetitionID === selectedId) || ordered[0] || null;
  const activeId = leagueCompetition?.CompetitionID;

  const TILL_NUMBER = leagueCompetition?.PaymentTill || LEAGUE_RULES.PaymentTill;
  const ENTRY_FEE = leagueCompetition?.EntryFee ?? LEAGUE_RULES.EntryFee;
  const MIN_PLAYERS = leagueCompetition?.MinPlayers || LEAGUE_RULES.MinPlayers;
  const MAX_PLAYERS = leagueCompetition?.MaxPlayers || LEAGUE_RULES.MaxPlayers;
  const PRIZE_POOL = leagueCompetition?.PrizeAmount || LEAGUE_RULES.PrizeAmount;

  const loadLeagueData = async (forId?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [comps, allRegs] = await Promise.all([
        TournamentAdminService.getCompetitions('LEAGUE'),
        TournamentAdminService.getRegistrations(),
      ]);
      setLeagues(comps || []);
      setRegistrations(allRegs);
    } catch (err: any) {
      console.warn('LeagueView load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagueData();
  }, [currentPlayer]);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.startsWith('#league?')) {
      const q = new URLSearchParams(hash.slice('#league?'.length));
      const id = q.get('tournamentId');
      if (id) setSelectedId(id);
    }
  }, []);

  // Fixtures + standings follow whichever league is selected
  useEffect(() => {
    if (!activeId) {
      setFixtures([]);
      setStandings([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      TournamentAdminService.getFixtures(activeId),
      TournamentAdminService.calculateLeagueStandings(activeId),
    ])
      .then(([f, st]) => {
        if (!cancelled) {
          setFixtures(f);
          setStandings(st);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeId, leagues]);

  // Registrations for this specific league
  const compRegs = leagueCompetition
    ? registrations.filter((r) => r.CompetitionID === leagueCompetition.CompetitionID)
    : [];
  const { verified: verifiedRegs, unverified: unverifiedRegs } = splitRegistrations(compRegs);

  const approvedCount = compRegs.length > 0 ? verifiedRegs.length : leagueCompetition?.ApprovedCount ?? 0;
  const isFull = approvedCount >= MAX_PLAYERS;

  const userRegistration = currentPlayer
    ? (() => {
        const mine = compRegs.filter(
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
    <div id="league-page" className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
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
            Join the league, follow the verified entrants and read the official gazette.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadLeagueData()}
          disabled={loading}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? 'border-white/10 hover:bg-white/5 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
          }`}
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#22c55e]' : ''}`} />
        </button>
      </div>

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

      {!leagueCompetition ? (
        <div id="league-empty-state" className="p-10 sm:p-14 text-center rounded-3xl border border-white/10 bg-[#111612]">
          <div className="w-16 h-16 rounded-3xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            No league open yet
          </h2>
          <p className="text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed text-gray-400">
            The league schedule appears here once the administrators create it.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <CompetitionSelector competitions={ordered} selectedId={leagueCompetition.CompetitionID} onSelect={setSelectedId} />

          <CompetitionHero
            competition={leagueCompetition}
            verifiedCount={approvedCount}
            unverifiedCount={unverifiedRegs.length}
            minPlayers={MIN_PLAYERS}
            maxPlayers={MAX_PLAYERS}
            entryFee={ENTRY_FEE}
            prize={PRIZE_POOL}
            till={TILL_NUMBER}
            isGuest={isGuest}
            userRegistration={userRegistration}
            registerLabel={`Join League (KSh ${ENTRY_FEE})`}
            activeLabel="Verified — active league participant"
            isFull={isFull}
            copiedTill={copiedTill}
            onCopyTill={copyTill}
            onRegister={() => setIsRegisterModalOpen(true)}
          />

          <CompetitionDocumentsShelf isLeague onOpen={setDocKind} />

          <RegisteredMembersPanel
            registrations={compRegs}
            currentPlayer={currentPlayer}
            loading={loading && registrations.length === 0}
          />

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
                  The table fills in automatically as results are confirmed: 3 points for a win, 1 for a draw, 0 for a loss.
                </p>
                <button type="button" onClick={() => setDocKind('standings')} className="text-xs font-bold text-[#22c55e] hover:underline cursor-pointer">
                  See how positions are decided
                </button>
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
                Fixtures are published in matchdays once {MIN_PLAYERS.toLocaleString()} players are verified ({approvedCount.toLocaleString()} so far).{' '}
                <button type="button" onClick={() => setDocKind('fixtures')} className="text-[#22c55e] font-bold underline cursor-pointer">See how it will work</button>
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

      {docKind && leagueCompetition && (
        <GazetteDocumentViewer
          kind={docKind}
          competition={leagueCompetition}
          registrations={compRegs}
          fixtures={fixtures}
          standings={standings}
          onClose={() => setDocKind(null)}
        />
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
