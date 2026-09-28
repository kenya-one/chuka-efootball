import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  RefreshCw,
  Edit3,
  Users,
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  Play,
  Award,
  ChevronRight,
  X,
  ArrowRight,
  Filter,
  Image as ImageIcon,
} from 'lucide-react';
import { Competition, CompetitionRegistration, MatchFixture } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';
import { CompetitionImageUploader } from './CompetitionImageUploader';

interface AdminKnockoutViewProps {
  onSelectCompetitionForFixtures?: (competitionId: string) => void;
}

export const AdminKnockoutView: React.FC<AdminKnockoutViewProps> = ({ onSelectCompetitionForFixtures }) => {
  const [tournaments, setTournaments] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected tournament for detailed drawer/modal
  const [selectedTournament, setSelectedTournament] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<CompetitionRegistration[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State (Default fee KSh 20, 1024 players, Prize KSh 1000)
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('14:00 EAT');
  const [formDeadline, setFormDeadline] = useState('');
  const [formFee, setFormFee] = useState<number>(20);
  const [formMaxPlayers, setFormMaxPlayers] = useState<number>(1024);
  const [formPrize, setFormPrize] = useState<number>(1000);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formImageFileId, setFormImageFileId] = useState<string>('');
  const [formRulesDocUrl, setFormRulesDocUrl] = useState<string>('');
  const [formRegisteredPlayersDocUrl, setFormRegisteredPlayersDocUrl] = useState<string>('');
  const [formKnockoutBracketDocUrl, setFormKnockoutBracketDocUrl] = useState<string>('');
  const [pendingImageFile, setPendingImageFile] = useState<{ base64: string; mimeType: string; fileName: string } | null>(null);

  const loadTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TournamentAdminService.getCompetitions('KNOCKOUT');
      setTournaments(data);
      if (selectedTournament) {
        const refreshed = data.find((t) => t.CompetitionID === selectedTournament.CompetitionID);
        if (refreshed) setSelectedTournament(refreshed);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load knockout tournaments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadParticipants = async (compId: string) => {
    setLoadingParticipants(true);
    try {
      const regs = await TournamentAdminService.getRegistrations(compId);
      setParticipants(regs);
    } catch (err) {
      console.warn('Error loading participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTournamentId(null);
    const nextWeekNumber = tournaments.length + 1;
    setFormName(`Chuka Weekly Cup #${nextWeekNumber}`);
    setFormDescription('Official weekly single-elimination tournament (1,024 players, 512 Round 1 matches). Match screenshot submission is mandatory.');
    const d = new Date(Date.now() + 86400000 * 3);
    setFormDate(d.toISOString().slice(0, 10));
    setFormStartTime('14:00 EAT');
    const dl = new Date(Date.now() + 86400000 * 2);
    setFormDeadline(dl.toISOString().slice(0, 10));
    setFormFee(20);
    setFormMaxPlayers(1024);
    setFormPrize(1000);
    setFormImageUrl('');
    setFormImageFileId('');
    setFormRulesDocUrl('');
    setFormRegisteredPlayersDocUrl('');
    setFormKnockoutBracketDocUrl('');
    setPendingImageFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Competition) => {
    setEditingTournamentId(t.CompetitionID);
    setFormName(t.Name);
    setFormDescription(t.Description || '');
    setFormDate(t.StartDate ? t.StartDate.slice(0, 10) : '');
    setFormStartTime(t.StartTime || '14:00 EAT');
    setFormDeadline(t.RegistrationDeadline ? t.RegistrationDeadline.slice(0, 10) : t.RegistrationEnd ? t.RegistrationEnd.slice(0, 10) : '');
    setFormFee(t.EntryFee !== undefined ? t.EntryFee : 20);
    setFormMaxPlayers(t.MaxPlayers || 1024);
    setFormPrize(t.PrizeAmount || 1000);
    setFormImageUrl(t.ProfileImageURL || t.ImageURL || '');
    setFormImageFileId(t.ProfileImageFileID || t.ImageFileID || '');
    setFormRulesDocUrl(t.RulesDocumentURL || '');
    setFormRegisteredPlayersDocUrl(t.RegisteredPlayersDocumentURL || '');
    setFormKnockoutBracketDocUrl(t.KnockoutBracketDocumentURL || '');
    setPendingImageFile(null);
    setIsModalOpen(true);
  };

  const [copiedInvite, setCopiedInvite] = useState(false);
  const handleCopyInvite = (t: Competition) => {
    const text = `🏆 Chuka eFootball Weekly Knockout Tournament!\nEntry Fee: KSh 20\nPayment Till: 6817863\nWinner Prize: KSh 1,000\nBracket Size: 1,024 Players (512 Round 1 Matches)\n\nRegister now: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleGenerateBracket = async (t: Competition) => {
    const approved = t.ApprovedCount !== undefined ? t.ApprovedCount : (t.RegisteredCount || 0);
    if (approved < 1024) {
      setError(`Cannot generate bracket: ${approved} / 1,024 approved players verified. Bracket generation requires exactly 1,024 approved players.`);
      return;
    }
    try {
      setLoading(true);
      await TournamentAdminService.generateKnockoutBracket(t.CompetitionID);
      setSuccessMsg(`Official 1,024-player knockout bracket generated! 512 Round 1 matches created.`);
      await loadTournaments();
      if (onSelectCompetitionForFixtures) {
        onSelectCompetitionForFixtures(t.CompetitionID);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate knockout bracket.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Tournament name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let finalImageUrl = formImageUrl;
      let finalImageFileId = formImageFileId;

      if (editingTournamentId) {
        // Update tournament
        await TournamentAdminService.updateCompetition(editingTournamentId, {
          Name: formName.trim(),
          Description: formDescription.trim(),
          StartDate: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
          StartTime: formStartTime,
          RegistrationDeadline: formDeadline ? new Date(formDeadline).toISOString() : new Date().toISOString(),
          RegistrationEnd: formDeadline ? new Date(formDeadline).toISOString() : new Date().toISOString(),
          EntryFee: Number(formFee) || 20,
          MaxPlayers: Number(formMaxPlayers) || 1024,
          MinPlayers: 1024,
          PrizeAmount: Number(formPrize) || 1000,
          PaymentTill: '6817863',
          ProfileImageURL: finalImageUrl,
          ProfileImageFileID: finalImageFileId,
          RulesDocumentURL: formRulesDocUrl.trim() || undefined,
          RegisteredPlayersDocumentURL: formRegisteredPlayersDocUrl.trim() || undefined,
          KnockoutBracketDocumentURL: formKnockoutBracketDocUrl.trim() || undefined,
        });

        // If a new image was picked, upload to Drive
        if (pendingImageFile) {
          const driveRes = await TournamentAdminService.uploadCompetitionImage(
            editingTournamentId,
            pendingImageFile.base64,
            pendingImageFile.mimeType,
            pendingImageFile.fileName
          );
          finalImageUrl = driveRes.url;
        }

        setSuccessMsg(`Tournament "${formName.trim()}" updated successfully.`);
      } else {
        // Create new tournament with real rules
        const created = await TournamentAdminService.createKnockout({
          name: formName,
          description: formDescription,
          date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
          startTime: formStartTime,
          registrationDeadline: formDeadline ? new Date(formDeadline).toISOString() : new Date().toISOString(),
          registrationFee: Number(formFee) || 20,
          maxPlayers: Number(formMaxPlayers) || 1024,
          prizeAmount: Number(formPrize) || 1000,
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

        setSuccessMsg(`Weekly knockout tournament "${created.Name}" created successfully!`);
      }

      setIsModalOpen(false);
      await loadTournaments();
    } catch (err: any) {
      setError(err?.message || 'Failed to save tournament.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRegistration = async (t: Competition) => {
    const nextStatus = t.Status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await TournamentAdminService.updateCompetition(t.CompetitionID, {
        Status: nextStatus,
        IsRegistrationOpen: nextStatus === 'OPEN',
      });
      setSuccessMsg(`Tournament status changed to ${nextStatus}.`);
      await loadTournaments();
    } catch (err: any) {
      setError(err?.message || 'Failed to update registration status.');
    }
  };

  const handleSetStatus = async (t: Competition, status: string) => {
    try {
      await TournamentAdminService.updateCompetition(t.CompetitionID, {
        Status: status,
      });
      setSuccessMsg(`Tournament marked as ${status}.`);
      await loadTournaments();
    } catch (err: any) {
      setError(err?.message || 'Failed to update tournament status.');
    }
  };

  const handleConfirmParticipant = async (regId: string) => {
    try {
      await TournamentAdminService.confirmRegistration(regId);
      if (selectedTournament) {
        await loadParticipants(selectedTournament.CompetitionID);
      }
      setSuccessMsg('Participant confirmed for competition.');
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm participant.');
    }
  };

  const handleRejectParticipant = async (regId: string) => {
    if (!window.confirm('Reject this participant registration?')) return;
    try {
      await TournamentAdminService.rejectRegistration(regId);
      if (selectedTournament) {
        await loadParticipants(selectedTournament.CompetitionID);
      }
      setSuccessMsg('Participant registration rejected.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reject participant.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                Knockout Cup Control
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">Standard Fee: KSh 20</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              Weekly Knockout Tournaments
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Create knockout cups, upload branding images to Google Drive, manage participant eligibility, track bracket progression, and publish official results.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Knockout Cup</span>
            </button>
            <button
              type="button"
              onClick={loadTournaments}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Refresh tournaments"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
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
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-[#22c55e] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tournaments Grid */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading knockout tournaments from Google Sheets...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <Trophy className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase font-mono">No Tournaments Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Click "Create Knockout Cup" to launch a new weekly tournament with standard KSh 20 fee.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Tournament</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tournaments.map((t) => {
            const isRegOpen = t.Status === 'OPEN';
            const imgUrl = t.ProfileImageURL || t.ImageURL;

            return (
              <div
                key={t.CompetitionID}
                className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-3.5">
                  {/* Image & Header Bar */}
                  <div className="flex items-start gap-4">
                    {/* Competition Profile Picture */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/15 bg-black/60 shrink-0 relative shadow-md">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={t.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-amber-500/10 to-transparent">
                          <Trophy className="w-8 h-8 text-amber-500/40" />
                          <span className="text-[9px] uppercase font-bold text-gray-400 mt-1">No Image</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono font-bold text-amber-400">
                        {t.Format === 'Single Elimination' ? 'CUP' : 'KO'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-bold text-amber-400 truncate">
                          {t.CompetitionID}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            isRegOpen
                              ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                              : t.Status === 'IN_PROGRESS'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : t.Status === 'COMPLETED'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {t.Status}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug line-clamp-2">
                        {t.Name}
                      </h3>

                      {t.Description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {t.Description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Entry Fee</span>
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        KES {t.EntryFee ?? 20} (Till: 6817863)
                      </span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Winner Prize</span>
                      <span className="text-xs font-bold text-[#22c55e] font-mono">
                        KES {t.PrizeAmount || 1000}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Approved / Target</span>
                      <span className="text-xs font-bold text-white font-mono">
                        {t.ApprovedCount ?? t.RegisteredCount ?? 0} / {t.MaxPlayers || 1024}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 uppercase font-semibold block">Bracket Status</span>
                      <span className={`text-[11px] font-bold ${(t.ApprovedCount ?? t.RegisteredCount ?? 0) >= 1024 ? 'text-[#22c55e]' : 'text-amber-400'}`}>
                        {(t.ApprovedCount ?? t.RegisteredCount ?? 0) >= 1024 ? 'Unlocked (1,024)' : 'Locked (< 1,024)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleRegistration(t)}
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
                      onClick={() => handleOpenEditModal(t)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyInvite(t)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      title="Copy Tournament Invitation with Till Number"
                    >
                      <span>{copiedInvite ? '✓ Copied' : 'Invite Players'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTournament(t);
                        loadParticipants(t.CompetitionID);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Players ({t.ApprovedCount ?? t.RegisteredCount ?? 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateBracket(t)}
                      disabled={(t.ApprovedCount ?? t.RegisteredCount ?? 0) < 1024}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                        (t.ApprovedCount ?? t.RegisteredCount ?? 0) >= 1024
                          ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-md cursor-pointer'
                          : 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                      }`}
                      title={
                        (t.ApprovedCount ?? t.RegisteredCount ?? 0) >= 1024
                          ? 'Generate official 1,024-player single elimination bracket (512 Round 1 matches)'
                          : 'Bracket unlocks when 1,024 players are approved'
                      }
                    >
                      {(t.ApprovedCount ?? t.RegisteredCount ?? 0) >= 1024 ? (
                        <Play className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {(t.ApprovedCount ?? t.RegisteredCount ?? 0) >= 1024
                          ? 'Generate Bracket'
                          : 'Locked (< 1,024)'}
                      </span>
                    </button>

                    {onSelectCompetitionForFixtures && (
                      <button
                        type="button"
                        onClick={() => onSelectCompetitionForFixtures(t.CompetitionID)}
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

      {/* Participants Drawer / Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                    Registered Competitors
                  </h3>
                  <p className="text-xs text-gray-400">{selectedTournament.Name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTournament(null)}
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
                        Approved: <strong className="text-[#22c55e] font-bold">{approvedCount} / 1,024</strong>
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-amber-300 font-mono">
                        Pending Approval: <strong>{pendingCount}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {approvedCount < 1024
                        ? `Knockout bracket unlocks when 1,024 players are approved (${1024 - approvedCount} remaining).`
                        : '1,024 approved players reached! Ready to generate official 512-match Round 1 bracket.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateBracket(selectedTournament)}
                    disabled={approvedCount < 1024}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all self-start sm:self-auto ${
                      approvedCount >= 1024
                        ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-lg cursor-pointer'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {approvedCount >= 1024 ? <Play className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{approvedCount >= 1024 ? 'Generate Bracket' : 'Locked (< 1,024)'}</span>
                  </button>
                </div>
              );
            })()}

            {loadingParticipants ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading participants...
              </div>
            ) : participants.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs space-y-1">
                <p>No players have registered for this tournament yet.</p>
                <p className="text-[11px] text-gray-500">Registrations appear here once submitted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((p) => (
                  <div
                    key={p.RegistrationID}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-mono">{p.eFootballUsername}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            p.Status === 'APPROVED'
                              ? 'bg-[#22c55e]/20 text-[#22c55e]'
                              : p.Status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {p.Status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            p.PaymentStatus === 'PAID'
                              ? 'bg-[#22c55e]/20 text-[#22c55e]'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          Fee: {p.PaymentStatus}
                        </span>
                      </div>
                      <div className="text-gray-400 text-[11px] mt-0.5">
                        ID: <span className="font-mono text-gray-300">{p.PlayerID}</span> • Registered: {p.RegisteredAt ? p.RegisteredAt.slice(0, 10) : 'Recent'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {p.Status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmParticipant(p.RegistrationID)}
                          className="px-3 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#22c55e]/80 text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Confirm Entry
                        </button>
                      )}
                      {p.Status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => handleRejectParticipant(p.RegistrationID)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/30 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Tournament Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                    {editingTournamentId ? 'Edit Knockout Tournament' : 'Create Weekly Knockout'}
                  </h3>
                  <p className="text-xs text-gray-400">Configure tournament details &amp; branding</p>
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

            <form onSubmit={handleSaveTournament} className="space-y-4">
              {/* Competition Image Upload */}
              <CompetitionImageUploader
                currentImageUrl={formImageUrl}
                competitionType="KNOCKOUT"
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

              {/* Tournament Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Chuka Weekly Cup #1"
                  className="w-full py-2.5 px-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
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
                  placeholder="Format, match rules, eligibility notes..."
                  className="w-full py-2.5 px-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Dates & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Tournament Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="14:00 EAT"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Financial & Capacity Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Entry Fee (KES) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-black/40 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <span className="text-[10px] text-gray-400">Standard: KSh 20</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Prize Pool (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formPrize}
                    onChange={(e) => setFormPrize(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Knockout Bracket Size
                  </label>
                  <select
                    value={formMaxPlayers}
                    onChange={(e) => setFormMaxPlayers(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={1024}>1,024 Players (512 Round 1 Matches)</option>
                  </select>
                </div>
              </div>

              {/* Official Google Document Links */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Official Google Document Links
                  </span>
                  <span className="text-[10px] text-[#22c55e] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                    Auto-generated in Google Drive
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  A dedicated Google Drive folder and official Google Docs (Rules & Regulations, Registered Players, Knockout Bracket, and Final Results) are automatically generated upon publishing. You can leave these blank or override with custom links.
                </p>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formRulesDocUrl}
                    onChange={(e) => setFormRulesDocUrl(e.target.value)}
                    placeholder="Rules Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <input
                    type="url"
                    value={formRegisteredPlayersDocUrl}
                    onChange={(e) => setFormRegisteredPlayersDocUrl(e.target.value)}
                    placeholder="Registered Players Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <input
                    type="url"
                    value={formKnockoutBracketDocUrl}
                    onChange={(e) => setFormKnockoutBracketDocUrl(e.target.value)}
                    placeholder="Knockout Bracket Google Doc URL (Optional — auto-generated if left blank)"
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Form Buttons */}
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
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTournamentId ? 'Save Changes' : 'Publish Tournament'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
