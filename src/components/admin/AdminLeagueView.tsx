import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  RefreshCw,
  Edit3,
  Users,
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  X,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import { Competition, CompetitionRegistration, LeagueStanding } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';
import { CompetitionImageUploader } from './CompetitionImageUploader';

interface AdminLeagueViewProps {
  onSelectCompetitionForFixtures?: (competitionId: string) => void;
}

export const AdminLeagueView: React.FC<AdminLeagueViewProps> = ({ onSelectCompetitionForFixtures }) => {
  const [leagues, setLeagues] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected league for participants / standings view
  const [selectedLeague, setSelectedLeague] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<CompetitionRegistration[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'participants' | 'standings'>('participants');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State (Default fee KSh 50, MaxPlayers 2048, Prize KSh 5000, Min 500)
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formStartTime, setFormStartTime] = useState('16:00 EAT');
  const [formFee, setFormFee] = useState<number>(50);
  const [formMaxPlayers, setFormMaxPlayers] = useState<number>(2048);
  const [formPrize, setFormPrize] = useState<number>(5000);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formImageFileId, setFormImageFileId] = useState<string>('');
  const [formRulesDocUrl, setFormRulesDocUrl] = useState<string>('');
  const [formRegisteredPlayersDocUrl, setFormRegisteredPlayersDocUrl] = useState<string>('');
  const [formLeagueFixturesDocUrl, setFormLeagueFixturesDocUrl] = useState<string>('');
  const [formStandingsDocUrl, setFormStandingsDocUrl] = useState<string>('');
  const [formFinalResultsDocUrl, setFormFinalResultsDocUrl] = useState<string>('');
  const [pendingImageFile, setPendingImageFile] = useState<{ base64: string; mimeType: string; fileName: string } | null>(null);

  const loadLeagues = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TournamentAdminService.getCompetitions('LEAGUE');
      setLeagues(data);
      if (selectedLeague) {
        const refreshed = data.find((l) => l.CompetitionID === selectedLeague.CompetitionID);
        if (refreshed) setSelectedLeague(refreshed);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load leagues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagueDetails = async (compId: string) => {
    setLoadingDetails(true);
    try {
      const [regs, stds] = await Promise.all([
        TournamentAdminService.getRegistrations(compId),
        TournamentAdminService.calculateLeagueStandings(compId),
      ]);
      setParticipants(regs);
      setStandings(stds);
    } catch (err) {
      console.warn('Error loading league details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingLeagueId(null);
    const nextSeason = leagues.length + 1;
    setFormName(`Chuka eFootball Premier League — Season ${nextSeason}`);
    setFormDescription('Official university premier championship (500 to 2,048 players). Round robin matchdays with goal difference tracking.');
    const dStart = new Date(Date.now() + 86400000 * 7);
    const dEnd = new Date(Date.now() + 86400000 * 35);
    const dl = new Date(Date.now() + 86400000 * 6);
    setFormStartDate(dStart.toISOString().slice(0, 10));
    setFormEndDate(dEnd.toISOString().slice(0, 10));
    setFormDeadline(dl.toISOString().slice(0, 10));
    setFormStartTime('16:00 EAT');
    setFormFee(50);
    setFormMaxPlayers(2048);
    setFormPrize(5000);
    setFormImageUrl('');
    setFormImageFileId('');
    setFormRulesDocUrl('');
    setFormRegisteredPlayersDocUrl('');
    setFormLeagueFixturesDocUrl('');
    setFormStandingsDocUrl('');
    setFormFinalResultsDocUrl('');
    setPendingImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (l: Competition) => {
    setEditingLeagueId(l.CompetitionID);
    setFormName(l.Name);
    setFormDescription(l.Description || '');
    setFormStartDate(l.StartDate ? l.StartDate.slice(0, 10) : '');
    setFormEndDate(l.EndDate ? l.EndDate.slice(0, 10) : '');
    setFormDeadline(l.RegistrationDeadline ? l.RegistrationDeadline.slice(0, 10) : l.RegistrationEnd ? l.RegistrationEnd.slice(0, 10) : '');
    setFormStartTime(l.StartTime || '16:00 EAT');
    setFormFee(l.EntryFee !== undefined ? l.EntryFee : 50);
    setFormMaxPlayers(l.MaxPlayers || 2048);
    setFormPrize(l.PrizeAmount || 5000);
    setFormImageUrl(l.ProfileImageURL || l.ImageURL || '');
    setFormImageFileId(l.ProfileImageFileID || l.ImageFileID || '');
    setFormRulesDocUrl(l.RulesDocumentURL || '');
    setFormRegisteredPlayersDocUrl(l.RegisteredPlayersDocumentURL || '');
    setFormLeagueFixturesDocUrl(l.LeagueFixturesDocumentURL || '');
    setFormStandingsDocUrl(l.StandingsDocumentURL || '');
    setFormFinalResultsDocUrl(l.FinalResultsDocumentURL || '');
    setPendingImageFile(null);
    setIsModalOpen(true);
  };

  const [copiedInvite, setCopiedInvite] = useState(false);
  const handleCopyInvite = (l: Competition) => {
    const text = `⚽ Join the Chuka eFootball Premier League!\nEntry Fee: KSh 50\nPayment Till: 6817863\nWinner Prize: KSh 5,000\nCapacity: 500 to 2,048 Players\n\nRegister now: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleGenerateLeagueFixtures = async (l: Competition) => {
    const approved = l.ApprovedCount !== undefined ? l.ApprovedCount : (l.RegisteredCount || 0);
    if (approved < 500) {
      setError(`Cannot generate league fixtures: ${approved} / 500 minimum approved players. League requires at least 500 approved competitors.`);
      return;
    }
    try {
      setLoading(true);
      await TournamentAdminService.generateLeagueFixtures(l.CompetitionID);
      setSuccessMsg(`Official league fixtures generated across approved players!`);
      await loadLeagues();
      if (onSelectCompetitionForFixtures) {
        onSelectCompetitionForFixtures(l.CompetitionID);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate league fixtures.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('League name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let finalImageUrl = formImageUrl;
      let finalImageFileId = formImageFileId;

      if (editingLeagueId) {
        await TournamentAdminService.updateCompetition(editingLeagueId, {
          Name: formName.trim(),
          Description: formDescription.trim(),
          StartDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
          EndDate: formEndDate ? new Date(formEndDate).toISOString() : new Date().toISOString(),
          RegistrationDeadline: formDeadline ? new Date(formDeadline).toISOString() : new Date().toISOString(),
          RegistrationEnd: formDeadline ? new Date(formDeadline).toISOString() : new Date().toISOString(),
          StartTime: formStartTime,
          EntryFee: Number(formFee) || 50,
          MaxPlayers: Number(formMaxPlayers) || 2048,
          MinPlayers: 500,
          PrizeAmount: Number(formPrize) || 5000,
          PaymentTill: '6817863',
          ProfileImageURL: finalImageUrl,
          ProfileImageFileID: finalImageFileId,
          RulesDocumentURL: formRulesDocUrl.trim() || undefined,
          RegisteredPlayersDocumentURL: formRegisteredPlayersDocUrl.trim() || undefined,
          LeagueFixturesDocumentURL: formLeagueFixturesDocUrl.trim() || undefined,
          StandingsDocumentURL: formStandingsDocUrl.trim() || undefined,
          FinalResultsDocumentURL: formFinalResultsDocUrl.trim() || undefined,
        });

        if (pendingImageFile) {
          const driveRes = await TournamentAdminService.uploadCompetitionImage(
            editingLeagueId,
            pendingImageFile.base64,
            pendingImageFile.mimeType,
            pendingImageFile.fileName
          );
          finalImageUrl = driveRes.url;
        }

        setSuccessMsg(`League "${formName.trim()}" updated successfully.`);
      } else {
        const created = await TournamentAdminService.createLeague({
          name: formName,
          description: formDescription,
          startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
          endDate: formEndDate ? new Date(formEndDate).toISOString() : new Date().toISOString(),
          registrationDeadline: formDeadline ? new Date(formDeadline).toISOString() : new Date().toISOString(),
          startTime: formStartTime,
          registrationFee: Number(formFee) || 50,
          maxPlayers: Number(formMaxPlayers) || 2048,
          prizeAmount: Number(formPrize) || 5000,
          profileImageUrl: finalImageUrl,
          profileImageFileId: finalImageFileId,
        });

        if (pendingImageFile) {
          await TournamentAdminService.uploadCompetitionImage(
            created.CompetitionID,
            pendingImageFile.base64,
            pendingImageFile.mimeType,
            pendingImageFile.fileName
          );
        }

        setSuccessMsg(`League "${created.Name}" created successfully!`);
      }

      setIsModalOpen(false);
      await loadLeagues();
    } catch (err: any) {
      setError(err?.message || 'Failed to save league.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRegistration = async (l: Competition) => {
    const nextStatus = l.Status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await TournamentAdminService.updateCompetition(l.CompetitionID, {
        Status: nextStatus,
        IsRegistrationOpen: nextStatus === 'OPEN',
      });
      setSuccessMsg(`League status changed to ${nextStatus}.`);
      await loadLeagues();
    } catch (err: any) {
      setError(err?.message || 'Failed to update registration status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                League Championship Control
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">Standard Fee: KSh 50</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              League Season Management
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Configure round-robin leagues, upload branding pictures to Google Drive, manage participant activation fees, schedule matchdays, and maintain official university standings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create League Season</span>
            </button>
            <button
              type="button"
              onClick={loadLeagues}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Refresh leagues"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-[#22c55e] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Leagues List */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading leagues from Google Sheets...</p>
        </div>
      ) : leagues.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <Award className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase font-mono">No Leagues Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Click "Create League Season" to configure a new semester competition with standard KSh 50 fee.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-500 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create League</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {leagues.map((l) => {
            const isRegOpen = l.Status === 'OPEN';
            const imgUrl = l.ProfileImageURL || l.ImageURL;

            return (
              <div
                key={l.CompetitionID}
                className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-3.5">
                  {/* Image & Header */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/15 bg-black/60 shrink-0 relative shadow-md">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={l.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-blue-500/10 to-transparent">
                          <Award className="w-8 h-8 text-blue-500/40" />
                          <span className="text-[9px] uppercase font-bold text-gray-400 mt-1">No Image</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono font-bold text-blue-400">
                        LEAGUE
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-bold text-blue-400 truncate">
                          {l.CompetitionID}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            isRegOpen
                              ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                              : l.Status === 'IN_PROGRESS'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {l.Status}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug line-clamp-2">
                        {l.Name}
                      </h3>

                      {l.Description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {l.Description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Activation Fee</span>
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        KES {l.EntryFee ?? 50} (Till: 6817863)
                      </span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Winner Prize</span>
                      <span className="text-xs font-bold text-[#22c55e] font-mono">
                        KES {l.PrizeAmount || 5000}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Approved / Max</span>
                      <span className="text-xs font-bold text-white font-mono">
                        {l.ApprovedCount ?? l.RegisteredCount ?? 0} / {l.MaxPlayers || 2048}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Participation</span>
                      <span className={`text-[11px] font-bold ${(l.ApprovedCount ?? l.RegisteredCount ?? 0) >= (l.MaxPlayers || 2048) ? 'text-rose-400' : (l.ApprovedCount ?? l.RegisteredCount ?? 0) >= 500 ? 'text-[#22c55e]' : 'text-amber-400'}`}>
                        {(l.ApprovedCount ?? l.RegisteredCount ?? 0) >= (l.MaxPlayers || 2048)
                          ? 'Full (2,048)'
                          : (l.ApprovedCount ?? l.RegisteredCount ?? 0) >= 500
                          ? 'Min Reached (≥500)'
                          : `Need ${500 - (l.ApprovedCount ?? l.RegisteredCount ?? 0)} more`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleRegistration(l)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRegOpen
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                          : 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 border border-[#22c55e]/30'
                      }`}
                    >
                      {isRegOpen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isRegOpen ? 'Close Reg' : 'Open Reg'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(l)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyInvite(l)}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      title="Copy League Invitation with Till Number"
                    >
                      <span>{copiedInvite ? '✓ Copied' : 'Invite Players'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeague(l);
                        loadLeagueDetails(l.CompetitionID);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Standings &amp; Players ({l.ApprovedCount ?? l.RegisteredCount ?? 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateLeagueFixtures(l)}
                      disabled={(l.ApprovedCount ?? l.RegisteredCount ?? 0) < 500}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                        (l.ApprovedCount ?? l.RegisteredCount ?? 0) >= 500
                          ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-md cursor-pointer'
                          : 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                      }`}
                      title={
                        (l.ApprovedCount ?? l.RegisteredCount ?? 0) >= 500
                          ? 'Generate official round-robin fixtures across approved competitors'
                          : 'Fixtures unlock when at least 500 players are approved'
                      }
                    >
                      {(l.ApprovedCount ?? l.RegisteredCount ?? 0) >= 500 ? (
                        <Play className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {(l.ApprovedCount ?? l.RegisteredCount ?? 0) >= 500
                          ? 'Generate Fixtures'
                          : 'Locked (< 500)'}
                      </span>
                    </button>

                    {onSelectCompetitionForFixtures && (
                      <button
                        type="button"
                        onClick={() => onSelectCompetitionForFixtures(l.CompetitionID)}
                        className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Fixtures</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standings & Players Drawer Modal */}
      {selectedLeague && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                    {selectedLeague.Name}
                  </h3>
                  <p className="text-xs text-gray-400">Championship Standings &amp; Registered Players</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeague(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approved vs Pending count banner */}
            {(() => {
              const approvedCount = participants.filter((p) => p.Status === 'APPROVED' || p.PaymentStatus === 'PAID').length;
              const pendingCount = participants.filter((p) => p.Status === 'PENDING' || p.PaymentStatus === 'PENDING').length;
              return (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono">
                        Approved: <strong className="text-[#22c55e] font-bold">{approvedCount} / 2,048</strong> (Min: 500)
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-amber-300 font-mono">
                        Pending Approval: <strong>{pendingCount}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {approvedCount < 500
                        ? `League fixtures unlock when at least 500 players are approved (${500 - approvedCount} remaining).`
                        : approvedCount >= 2048
                        ? 'League has reached maximum capacity of 2,048 approved players.'
                        : 'Minimum required participation reached! Ready to generate official round-robin fixtures.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateLeagueFixtures(selectedLeague)}
                    disabled={approvedCount < 500}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all self-start sm:self-auto ${
                      approvedCount >= 500
                        ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-lg cursor-pointer'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {approvedCount >= 500 ? <Play className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{approvedCount >= 500 ? 'Generate Fixtures' : 'Locked (< 500)'}</span>
                  </button>
                </div>
              );
            })()}

            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setActiveDetailTab('standings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeDetailTab === 'standings'
                    ? 'bg-blue-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                League Standings Table
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('participants')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  activeDetailTab === 'participants'
                    ? 'bg-blue-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Registered Players ({participants.length})
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Calculating official table standings...
              </div>
            ) : activeDetailTab === 'standings' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Player / Gamer Tag</th>
                      <th className="py-2.5 px-2 text-center">PLD</th>
                      <th className="py-2.5 px-2 text-center">W</th>
                      <th className="py-2.5 px-2 text-center">D</th>
                      <th className="py-2.5 px-2 text-center">L</th>
                      <th className="py-2.5 px-2 text-center">GF</th>
                      <th className="py-2.5 px-2 text-center">GA</th>
                      <th className="py-2.5 px-2 text-center">GD</th>
                      <th className="py-2.5 px-3 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {standings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-gray-500">
                          No match results recorded yet. Standings will update automatically as fixture scores are submitted.
                        </td>
                      </tr>
                    ) : (
                      standings.map((s, idx) => (
                        <tr key={s.PlayerID} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white font-mono">
                            {s.eFootballUsername}
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-300 font-mono">{s.Played}</td>
                          <td className="py-2.5 px-2 text-center text-emerald-400 font-mono">{s.Wins}</td>
                          <td className="py-2.5 px-2 text-center text-amber-400 font-mono">{s.Draws}</td>
                          <td className="py-2.5 px-2 text-center text-red-400 font-mono">{s.Losses}</td>
                          <td className="py-2.5 px-2 text-center text-gray-300 font-mono">{s.GoalsFor}</td>
                          <td className="py-2.5 px-2 text-center text-gray-300 font-mono">{s.GoalsAgainst}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                            {s.GoalDifference > 0 ? `+${s.GoalDifference}` : s.GoalDifference}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-blue-400 text-sm">
                            {s.Points}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No competitors have registered for this league season yet.
                  </div>
                ) : (
                  participants.map((p) => (
                    <div
                      key={p.RegistrationID}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-mono">{p.eFootballUsername}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.Status === 'APPROVED' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {p.Status}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.PaymentStatus === 'PAID' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            Activation: {p.PaymentStatus}
                          </span>
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          Player ID: <span className="font-mono text-gray-300">{p.PlayerID}</span> • Entry: KSh {p.EntryFee || 50}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit League Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                    {editingLeagueId ? 'Edit League Season' : 'Create League Season'}
                  </h3>
                  <p className="text-xs text-gray-400">Configure round-robin parameters &amp; profile picture</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeague} className="space-y-4">
              {/* Competition Image Upload */}
              <CompetitionImageUploader
                currentImageUrl={formImageUrl}
                competitionType="LEAGUE"
                onImageSelected={(base64, mimeType, fileName) => {
                  setFormImageUrl(base64);
                  setPendingImageFile({ base64, mimeType, fileName });
                }}
                onImageRemoved={() => {
                  setFormImageUrl('');
                  setFormImageFileId('');
                  setPendingImageFile(null);
                }}
              />

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  League Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Chuka eFootball Premier League — Season 1"
                  className="w-full py-2.5 px-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Format, duration, scoring guidelines..."
                  className="w-full py-2.5 px-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Kickoff Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Closing Date
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Reg. Deadline
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Financials & Capacity */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    Activation Fee (KES) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-black/40 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 focus:outline-none focus:border-blue-400 font-mono"
                  />
                  <span className="text-[10px] text-gray-400">Standard: KSh 50</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Prize Pool (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formPrize}
                    onChange={(e) => setFormPrize(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Capacity
                  </label>
                  <select
                    value={formMaxPlayers}
                    onChange={(e) => setFormMaxPlayers(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value={2048}>2,048 Players (Official League Maximum — 500 Min)</option>
                  </select>
                </div>
              </div>

              {/* Official Google Document Links */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Official Google Document Links
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Auto-generated in Google Drive
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Google Drive folder & official documents (Rules, Registered Players, League Fixtures, Standings Table, and Final Results) are automatically generated upon publishing. Leave blank for auto-generation.
                </p>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formRulesDocUrl}
                    onChange={(e) => setFormRulesDocUrl(e.target.value)}
                    placeholder="Rules Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                  />
                  <input
                    type="url"
                    value={formRegisteredPlayersDocUrl}
                    onChange={(e) => setFormRegisteredPlayersDocUrl(e.target.value)}
                    placeholder="Registered Players Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                  />
                  <input
                    type="url"
                    value={formLeagueFixturesDocUrl}
                    onChange={(e) => setFormLeagueFixturesDocUrl(e.target.value)}
                    placeholder="League Fixtures Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                  />
                  <input
                    type="url"
                    value={formStandingsDocUrl}
                    onChange={(e) => setFormStandingsDocUrl(e.target.value)}
                    placeholder="League Standings Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                  />
                  <input
                    type="url"
                    value={formFinalResultsDocUrl}
                    onChange={(e) => setFormFinalResultsDocUrl(e.target.value)}
                    placeholder="Final Results Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 font-mono"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingLeagueId ? 'Save Changes' : 'Publish League'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
