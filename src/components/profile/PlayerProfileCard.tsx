import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Phone,
  Camera,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit3,
  Calendar,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ExternalLink,
  BookOpen,
  MessageSquare,
  Mail,
  Copy,
  Trash2,
  Maximize2,
  X,
  Sparkles,
  Award,
} from 'lucide-react';
import { Player, ProfileCompletion } from '../../types';
import { PlayerApiService } from '../../api/client';
import { acceptRules } from '../../api/endpoints';
import { PlayerEditModal } from './PlayerEditModal';
import { normalizePlayerRecord } from '../../auth/PlayerProvider';
import { getDivisionBadgeColor } from '../../config/divisionConfig';

interface PlayerProfileCardProps {
  player: Player;
  completion?: ProfileCompletion;
  onPlayerUpdated?: (updatedPlayer: Player, updatedCompletion?: ProfileCompletion) => void;
  onUpdated?: (updatedPlayer: Player, updatedCompletion?: ProfileCompletion) => void;
  onViewRules?: () => void;
}

export const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  player,
  completion,
  onPlayerUpdated,
  onUpdated,
  onViewRules,
}) => {
  const safePlayerUpdated = (updatedPlayer: Player, updatedCompletion?: ProfileCompletion) => {
    if (typeof onPlayerUpdated === 'function') {
      onPlayerUpdated(updatedPlayer, updatedCompletion);
    }
    if (typeof onUpdated === 'function') {
      onUpdated(updatedPlayer, updatedCompletion);
    }
  };

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [squadUploading, setSquadUploading] = useState(false);
  const [squadDeleting, setSquadDeleting] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Squad Preview State before saving
  const [squadPreviewBase64, setSquadPreviewBase64] = useState<string | null>(null);
  const [squadPreviewFile, setSquadPreviewFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const squadInputRef = useRef<HTMLInputElement>(null);

  // File to base64 helper
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleCopyEmail = () => {
    if (!player.Email) return;
    navigator.clipboard.writeText(player.Email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Profile photo upload handler
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Profile photo must be less than 5MB.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }

    setPhotoUploading(true);
    try {
      const base64Data = await readFileAsBase64(file);
      const res = await PlayerApiService.uploadProfilePhoto(base64Data, file.type, file.name);

      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        safePlayerUpdated(normalized, res.data.completion);
        setUploadSuccess('Profile photo updated successfully!');
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setUploadError(res.error?.message || 'Failed to upload photo to Google Drive.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Photo upload encountered a network error.');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Step 1: User selects squad screenshot → Display preview first
  const handleSquadFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Squad screenshot must be less than 10MB.');
      if (squadInputRef.current) squadInputRef.current.value = '';
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPEG, PNG, or WebP images are allowed.');
      if (squadInputRef.current) squadInputRef.current.value = '';
      return;
    }

    try {
      const base64Data = await readFileAsBase64(file);
      setSquadPreviewBase64(base64Data);
      setSquadPreviewFile(file);
    } catch (err: any) {
      setUploadError('Failed to read selected image file.');
      if (squadInputRef.current) squadInputRef.current.value = '';
    }
  };

  // Step 2: Cancel squad preview
  const handleCancelSquadPreview = () => {
    setSquadPreviewBase64(null);
    setSquadPreviewFile(null);
    if (squadInputRef.current) squadInputRef.current.value = '';
  };

  // Step 3: Confirm and save squad screenshot to Google Drive
  const handleSaveSquadToDrive = async () => {
    if (!squadPreviewBase64 || !squadPreviewFile) return;

    setUploadError(null);
    setUploadSuccess(null);
    setSquadUploading(true);

    try {
      const res = await PlayerApiService.uploadSquadScreenshot(
        squadPreviewBase64,
        squadPreviewFile.type,
        squadPreviewFile.name
      );

      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        safePlayerUpdated(normalized, res.data.completion);
        setUploadSuccess('Squad screenshot successfully uploaded to Google Drive & saved to your profile!');
        setSquadPreviewBase64(null);
        setSquadPreviewFile(null);
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setUploadError(res.error?.message || 'Failed to upload screenshot to Google Drive.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Squad screenshot upload encountered a network error.');
    } finally {
      setSquadUploading(false);
      if (squadInputRef.current) squadInputRef.current.value = '';
    }
  };

  // Remove squad screenshot handler
  const handleConfirmDeleteSquad = async () => {
    setUploadError(null);
    setUploadSuccess(null);
    setSquadDeleting(true);

    try {
      const res = await PlayerApiService.deleteSquadScreenshot();
      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        safePlayerUpdated(normalized, res.data.completion);
        setUploadSuccess('Squad screenshot removed from Google Drive and profile.');
        setShowDeleteConfirm(false);
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setUploadError(res.error?.message || 'Failed to remove squad screenshot.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Network error removing squad screenshot.');
    } finally {
      setSquadDeleting(false);
    }
  };

  const handleAcceptRulesClick = async () => {
    setRulesLoading(true);
    try {
      const res = await acceptRules(true);
      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        safePlayerUpdated(normalized, completion);
        setUploadSuccess('Official rules accepted!');
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setUploadError(res.error?.message || 'Failed to record rules acceptance.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Network error accepting rules.');
    } finally {
      setRulesLoading(false);
    }
  };

  const squadDisplayUrl = player.SquadImageURL || player.SquadImage || player.SquadScreenshotURL;
  const avatarDisplayUrl = player.ProfilePhotoURL || player.ProfileImage;

  const completionPct =
    completion?.percentage ??
    (avatarDisplayUrl && squadDisplayUrl ? 100 : avatarDisplayUrl || squadDisplayUrl ? 85 : 70);

  const roleUpper = String(player.role || player.Role || 'USER').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN';
  const statusUpper = String(player.Status || 'ACTIVE').toUpperCase();
  const isVerified = statusUpper === 'ACTIVE' || Boolean(player.Verified);
  const isSuspended = statusUpper === 'SUSPENDED';
  const hasAcceptedRules = Boolean(player.RulesAccepted);

  const availableDaysText = Array.isArray(player.AvailableDays)
    ? player.AvailableDays.join(', ')
    : player.AvailableDays || 'All Days (Mon - Sun)';
  const availableTimesText = Array.isArray(player.AvailableTimes)
    ? player.AvailableTimes.join(', ')
    : player.AvailableTimes || 'Evenings (6:00 PM - 10:00 PM)';

  const classIdDisplay = player.class_id || player.ClassID || 'Not set';

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {uploadError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span className="font-medium">{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-white text-xs underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-medium">{uploadSuccess}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL eFOOTBALL PLAYER CARD                                        */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#18261b] via-[#101712] to-[#0a0f0b] border-2 border-[#22c55e]/30 shadow-2xl">
        {/* Futuristic Card Top Light Strip & Brand Crest */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#22c55e]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Card Header Ribbon */}
        <div className="p-6 sm:p-8 pb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22c55e]/20 to-emerald-900/40 border border-[#22c55e]/40 flex items-center justify-center shadow-inner">
              <Award className="w-5 h-5 text-[#22c55e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest font-black uppercase text-[#22c55e]">
                  CHUKA eFOOTBALL FEDERATION
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-[#22c55e]" />
                <span className="text-[10px] text-gray-400 font-mono">OFFICIAL PLAYER CARD</span>
              </div>
              <p className="text-xs font-semibold text-gray-300">Competitive Season 2026</p>
            </div>
          </div>

          {/* Badges: Role + Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Player Role Badge */}
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                ADMINISTRATOR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                COMMUNITY PLAYER
              </span>
            )}

            {/* Account Status Badge */}
            {isSuspended ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                SUSPENDED
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e] text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                VERIFIED & ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                PENDING REVIEW
              </span>
            )}

            {/* Edit Profile Button */}
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Main Card Center Section */}
        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
            {/* Player Avatar with eFootball Style Hex Frame */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-black/80 border-2 border-[#22c55e]/50 p-1 shadow-2xl relative">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center relative">
                  {avatarDisplayUrl ? (
                    <img
                      src={avatarDisplayUrl}
                      alt={player.FullName || player.DisplayName || player.eFootballUsername}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-14 h-14 text-gray-500" />
                  )}

                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-1.5">
                      <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-[#22c55e] font-semibold">Updating</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Photo Button */}
              <button
                type="button"
                disabled={photoUploading}
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2.5 rounded-2xl bg-[#22c55e] hover:bg-[#1ea850] text-black shadow-xl transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                title="Upload / Change Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoSelected}
              />
            </div>

            {/* Player Typography & Key Details */}
            <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-black uppercase tracking-wider ${getDivisionBadgeColor(player.Division)}`}>
                    {player.Division || 'OPEN DIVISION'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    ID: <strong className="text-white">{player.PlayerID || 'ASSIGNED'}</strong>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-mono">
                  {player.eFootballUsername || 'CHUKA_PLAYER'}
                </h1>
                <p className="text-base font-semibold text-emerald-400">
                  {player.FullName || player.DisplayName || 'Chuka Competitor'}
                </p>
              </div>

              {/* Grid of Player Info: Email, Class ID, Phone, WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Email Address */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                      Email Address
                    </span>
                    <span className="text-xs text-gray-200 truncate block font-mono">
                      {player.Email || 'No email provided'}
                    </span>
                  </div>
                  {player.Email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      title="Copy email"
                      className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Class ID */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                      Class ID / Student ID
                    </span>
                    <span className="text-xs font-bold text-white truncate block font-mono">
                      {classIdDisplay}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <Phone className="w-4 h-4 text-[#22c55e] shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                      Phone Number
                    </span>
                    <span className="text-xs text-gray-200 truncate block font-mono">
                      {player.PhoneNumber || player.Phone || 'Not set'}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                      WhatsApp Line
                    </span>
                    <span className="text-xs text-gray-200 truncate block font-mono">
                      {player.WhatsAppNumber || player.WhatsApp || player.PhoneNumber || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#22c55e]" />
                Profile Completion Level
              </span>
              <span className="font-mono font-bold text-[#22c55e]">{completionPct}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-[#22c55e] h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {completionPct < 100 && (
              <p className="text-[11px] text-gray-400">
                Upload your squad lineup screenshot below to achieve 100% verified tournament standing.
              </p>
            )}
          </div>

          {/* Match Availability & Fair Play Rules Mini-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#22c55e]" />
                Match Scheduling Availability
              </span>
              <span className="text-xs font-bold text-white block">
                {availableDaysText}
              </span>
              <span className="text-[10px] text-gray-400 block font-mono">
                {availableTimesText}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#22c55e]" />
                Official Rules Agreement
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white block">
                  {hasAcceptedRules ? 'Rules Accepted' : 'Pending Acceptance'}
                </span>
                {!hasAcceptedRules && (
                  <button
                    type="button"
                    onClick={handleAcceptRulesClick}
                    disabled={rulesLoading}
                    className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] font-bold hover:bg-[#22c55e]/30 cursor-pointer disabled:opacity-50"
                  >
                    {rulesLoading ? 'Saving...' : 'Accept Now'}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-gray-400 block">
                {player.RulesAcceptedAt ? `Accepted on ${new Date(player.RulesAcceptedAt).toLocaleDateString()}` : 'Fair Play & Anti-Cheat Code'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SQUAD LINEUP SCREENSHOT SHOWCASE & GOOGLE DRIVE STORAGE                   */}
      {/* ========================================================================= */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden">
        {/* Hidden File Input for Squad Screenshot */}
        <input
          ref={squadInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleSquadFileSelected}
        />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  eFootball Active Squad Lineup
                </h2>
                {squadDisplayUrl && !squadPreviewBase64 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Screenshot of your active squad lineup, stored securely in Google Drive
              </p>
            </div>
          </div>

          {/* Action Button: Replace or Upload */}
          {!squadPreviewBase64 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={squadUploading || squadDeleting}
                onClick={() => squadInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#22c55e]/15 hover:bg-[#22c55e]/25 border border-[#22c55e]/30 text-[#22c55e] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{squadDisplayUrl ? 'Replace Screenshot' : 'Upload Squad Screenshot'}</span>
              </button>

              {squadDisplayUrl && (
                <button
                  type="button"
                  disabled={squadUploading || squadDeleting}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove squad screenshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* CASE 1: PREVIEW STATE (Before Saving to Google Drive)                 */}
        {/* ===================================================================== */}
        {squadPreviewBase64 && squadPreviewFile ? (
          <div className="space-y-4 rounded-2xl bg-black/50 border-2 border-emerald-500/40 p-4 sm:p-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Image Preview (Pending Save)
                </span>
                <p className="text-[11px] text-gray-400">
                  {squadPreviewFile.name} &bull; {(squadPreviewFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {squadPreviewFile.type}
                </p>
              </div>

              {/* Action Buttons for Preview */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  disabled={squadUploading}
                  onClick={handleCancelSquadPreview}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={squadUploading}
                  onClick={handleSaveSquadToDrive}
                  className="px-4 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#1ea850] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {squadUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Drive...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Save to Drive</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Viewport */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-black/80 aspect-video max-h-[380px] flex items-center justify-center">
              <img
                src={squadPreviewBase64}
                alt="Squad Lineup Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              Please inspect the screenshot above. Click <strong>Confirm & Save to Drive</strong> to upload it to Google Drive and update your Users sheet record.
            </p>
          </div>
        ) : squadDisplayUrl ? (
          /* ===================================================================== */
          /* CASE 2: SAVED SQUAD IMAGE DISPLAY                                     */
          /* ===================================================================== */
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 aspect-video max-h-[380px] flex items-center justify-center group">
              <img
                src={squadDisplayUrl}
                alt="Active Squad Lineup"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />

              {/* Hover Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLightbox(true)}
                  className="px-4 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>Enlarge Lineup</span>
                </button>
                <a
                  href={squadDisplayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span>Open Direct Link</span>
                </a>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 px-1 gap-2">
              <span className="flex items-center gap-1.5 font-mono">
                <Shield className="w-3.5 h-3.5 text-[#22c55e]" />
                Google Drive Storage: Chuka eFootball Squad Images
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" />
                Authoritative Lineup Verified
              </span>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* CASE 3: NO SQUAD IMAGE UPLOADED YET                                   */
          /* ===================================================================== */
          <div
            onClick={() => squadInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-[#22c55e]/40 rounded-2xl p-8 sm:p-12 text-center space-y-3 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-[#22c55e]/15 mx-auto flex items-center justify-center text-gray-400 group-hover:text-[#22c55e] transition-colors">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">No squad screenshot uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Upload a screenshot of your active in-game eFootball squad (JPEG, PNG, or WebP up to 10MB) for competitive verification.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white/5 group-hover:bg-[#22c55e] text-white group-hover:text-black text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Squad Screenshot</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DELETE SQUAD SCREENSHOT CONFIRMATION MODAL                                */}
      {/* ========================================================================= */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111712] border border-red-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Remove Squad Screenshot?
                </h3>
                <p className="text-xs text-gray-400">This action will update your official profile.</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Are you sure you want to remove your squad screenshot? The image file will be removed from Google Drive and cleared from your record in the Users sheet.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={squadDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={squadDeleting}
                onClick={handleConfirmDeleteSquad}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {squadDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SQUAD SCREENSHOT LIGHTBOX ENLARGEMENT MODAL                               */}
      {/* ========================================================================= */}
      {showLightbox && squadDisplayUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white px-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Shield className="w-4 h-4 text-[#22c55e]" />
                <span>{player.eFootballUsername} &bull; Squad Lineup Screenshot</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/80 max-h-[80vh] flex items-center justify-center shadow-2xl">
              <img
                src={squadDisplayUrl}
                alt="Enlarged Squad Lineup"
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <PlayerEditModal
        player={player}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={safePlayerUpdated}
      />
    </div>
  );
};
