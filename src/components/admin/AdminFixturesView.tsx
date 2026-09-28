import React, { useState, useEffect } from 'react';
import {
  Play,
  Trophy,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Edit3,
  X,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { MatchFixture, Competition, Player } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';

interface AdminFixturesViewProps {
  initialCompetitionId?: string;
}

export const AdminFixturesView: React.FC<AdminFixturesViewProps> = ({ initialCompetitionId }) => {
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedCompId, setSelectedCompId] = useState<string>(initialCompetitionId || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Score Recording Modal
  const [scoringFixture, setScoringFixture] = useState<MatchFixture | null>(null);
  const [score1, setScore1] = useState<number>(0);
  const [score2, setScore2] = useState<number>(0);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [savingScore, setSavingScore] = useState(false);

  // New Fixture Modal
  const [isNewFixtureModalOpen, setIsNewFixtureModalOpen] = useState(false);
  const [newCompId, setNewCompId] = useState('');
  const [newRound, setNewRound] = useState('Round of 16');
  const [newPlayer1Id, setNewPlayer1Id] = useState('');
  const [newPlayer2Id, setNewPlayer2Id] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [savingFixture, setSavingFixture] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fixData, comps, pls] = await Promise.all([
        TournamentAdminService.getFixtures(),
        TournamentAdminService.getCompetitions(),
        TournamentAdminService.getPlayers(),
      ]);
      setFixtures(fixData);
      setCompetitions(comps);
      setPlayers(pls);

      if (newCompId === '' && comps.length > 0) {
        setNewCompId(comps[0].CompetitionID);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fixtures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenScoreModal = (f: MatchFixture) => {
    setScoringFixture(f);
    setScore1(f.Player1Score ?? 0);
    setScore2(f.Player2Score ?? 0);
    setSelectedWinnerId(f.WinnerID || '');
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoringFixture) return;

    setSavingScore(true);
    setError(null);
    try {
      let winner = selectedWinnerId;
      if (!winner) {
        if (score1 > score2) winner = scoringFixture.Player1ID;
        else if (score2 > score1) winner = scoringFixture.Player2ID;
      }

      await TournamentAdminService.recordMatchResult(
        scoringFixture.FixtureID,
        Number(score1),
        Number(score2),
        winner
      );

      setSuccessMsg(`Result officially recorded: ${scoringFixture.Player1Name} ${score1} - ${score2} ${scoringFixture.Player2Name}`);
      setScoringFixture(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to record match score.');
    } finally {
      setSavingScore(false);
    }
  };

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompId || !newPlayer1Id || !newPlayer2Id) {
      setError('Please select competition and both participating competitors.');
      return;
    }
    if (newPlayer1Id === newPlayer2Id) {
      setError('Player 1 and Player 2 cannot be the same person.');
      return;
    }

    setSavingFixture(true);
    setError(null);
    try {
      const p1 = players.find((p) => p.PlayerID === newPlayer1Id);
      const p2 = players.find((p) => p.PlayerID === newPlayer2Id);

      await TournamentAdminService.createFixture({
        competitionId: newCompId,
        round: newRound,
        player1Id: newPlayer1Id,
        player1Name: p1?.eFootballUsername || p1?.FullName || 'Player 1',
        player2Id: newPlayer2Id,
        player2Name: p2?.eFootballUsername || p2?.FullName || 'Player 2',
        matchDate: newMatchDate ? new Date(newMatchDate).toISOString() : new Date().toISOString(),
      });

      setSuccessMsg('Match fixture scheduled successfully.');
      setIsNewFixtureModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create fixture.');
    } finally {
      setSavingFixture(false);
    }
  };

  const filteredFixtures = fixtures.filter((f) => {
    if (selectedCompId !== 'ALL' && f.CompetitionID !== selectedCompId) return false;
    if (selectedStatus !== 'ALL' && f.Status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase">
                Match Operations &amp; VAR
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">Authoritative Scores</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              Fixtures &amp; Official Results
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Schedule official matches, record verified full-time scores, progress knockout rounds, and dynamically update league standings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsNewFixtureModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Fixture</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-[#22c55e] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#111712] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <select
            value={selectedCompId}
            onChange={(e) => setSelectedCompId(e.target.value)}
            className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
          >
            <option value="ALL">All Competitions (Knockout &amp; Leagues)</option>
            {competitions.map((c) => (
              <option key={c.CompetitionID} value={c.CompetitionID}>
                {c.Name} ({c.CompetitionType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
          >
            <option value="ALL">All Match Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed / Recorded</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {/* Fixtures List */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading competition fixtures...</p>
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-2">
          <Play className="w-8 h-8 text-gray-500 mx-auto" />
          <p className="text-sm font-bold text-white uppercase font-mono">No Fixtures Found</p>
          <p className="text-xs text-gray-400">Schedule fixtures for confirmed tournament players.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFixtures.map((f) => {
            const isCompleted = f.Status === 'COMPLETED' && f.Player1Score !== null && f.Player2Score !== null;

            return (
              <div
                key={f.FixtureID}
                className="bg-[#111712] border border-white/10 rounded-3xl p-5 space-y-4 hover:border-sky-500/40 transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-sky-400 font-bold">
                      {f.FixtureID} • {f.Round}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        isCompleted
                          ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {f.Status}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-400 truncate">
                    {f.CompetitionName || f.CompetitionID}
                  </div>

                  {/* Match Scoreboard */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    {/* Home Competitor */}
                    <div className="flex-1 text-left">
                      <div className={`font-bold text-sm font-mono truncate ${f.WinnerID === f.Player1ID ? 'text-[#22c55e]' : 'text-white'}`}>
                        {f.Player1Name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{f.Player1ID}</div>
                    </div>

                    {/* Scores */}
                    <div className="px-4 text-center">
                      {isCompleted ? (
                        <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-widest bg-black/60 px-3 py-1 rounded-xl border border-white/10">
                          {f.Player1Score} : {f.Player2Score}
                        </div>
                      ) : (
                        <div className="text-xs font-mono font-bold text-gray-400 uppercase bg-white/5 px-2.5 py-1 rounded-lg">
                          VS
                        </div>
                      )}
                    </div>

                    {/* Away Competitor */}
                    <div className="flex-1 text-right">
                      <div className={`font-bold text-sm font-mono truncate ${f.WinnerID === f.Player2ID ? 'text-[#22c55e]' : 'text-white'}`}>
                        {f.Player2Name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{f.Player2ID}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    {f.MatchDate ? f.MatchDate.slice(0, 10) : 'TBD'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenScoreModal(f)}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold uppercase tracking-wider text-xs border border-sky-500/30 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isCompleted ? 'Edit Score' : 'Record Score'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Score Modal */}
      {scoringFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111712] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                Record Official Score
              </h3>
              <button
                type="button"
                onClick={() => setScoringFixture(null)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="text-center text-xs text-gray-400">
                {scoringFixture.CompetitionName} • {scoringFixture.Round}
              </div>

              {/* Score Input Row */}
              <div className="grid grid-cols-2 gap-4 items-center bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="space-y-1 text-center">
                  <label className="text-xs font-bold text-white block truncate">
                    {scoringFixture.Player1Name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={score1}
                    onChange={(e) => setScore1(Number(e.target.value))}
                    className="w-20 mx-auto py-2 text-center bg-black/60 border border-white/20 rounded-xl text-2xl font-black font-mono text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-xs font-bold text-white block truncate">
                    {scoringFixture.Player2Name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={score2}
                    onChange={(e) => setScore2(Number(e.target.value))}
                    className="w-20 mx-auto py-2 text-center bg-black/60 border border-white/20 rounded-xl text-2xl font-black font-mono text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Winner Selector for Knockout ties or penalties */}
              {scoringFixture.CompetitionType === 'KNOCKOUT' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Advancing Winner (For Knockouts)
                  </label>
                  <select
                    value={selectedWinnerId}
                    onChange={(e) => setSelectedWinnerId(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="">Auto-determine by highest score</option>
                    <option value={scoringFixture.Player1ID}>
                      {scoringFixture.Player1Name} (Advances)
                    </option>
                    <option value={scoringFixture.Player2ID}>
                      {scoringFixture.Player2Name} (Advances)
                    </option>
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setScoringFixture(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  {savingScore && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Fixture Modal */}
      {isNewFixtureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                Schedule Match Fixture
              </h3>
              <button
                type="button"
                onClick={() => setIsNewFixtureModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFixture} className="space-y-4">
              {/* Competition */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Select Competition *
                </label>
                <select
                  required
                  value={newCompId}
                  onChange={(e) => setNewCompId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                >
                  {competitions.map((c) => (
                    <option key={c.CompetitionID} value={c.CompetitionID}>
                      {c.Name} ({c.CompetitionType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Round */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Round / Matchday *
                </label>
                <input
                  type="text"
                  required
                  value={newRound}
                  onChange={(e) => setNewRound(e.target.value)}
                  placeholder="e.g. Round of 16, Semi-Final, or Matchday 2"
                  className="w-full py-2.5 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Competitor 1 *
                  </label>
                  <select
                    required
                    value={newPlayer1Id}
                    onChange={(e) => setNewPlayer1Id(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="">Select player 1</option>
                    {players.map((p) => (
                      <option key={p.PlayerID} value={p.PlayerID}>
                        {p.eFootballUsername} ({p.FullName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Competitor 2 *
                  </label>
                  <select
                    required
                    value={newPlayer2Id}
                    onChange={(e) => setNewPlayer2Id(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="">Select player 2</option>
                    {players.map((p) => (
                      <option key={p.PlayerID} value={p.PlayerID}>
                        {p.eFootballUsername} ({p.FullName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Scheduled Match Date
                </label>
                <input
                  type="date"
                  value={newMatchDate}
                  onChange={(e) => setNewMatchDate(e.target.value)}
                  className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewFixtureModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFixture}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  {savingFixture && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Fixture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
