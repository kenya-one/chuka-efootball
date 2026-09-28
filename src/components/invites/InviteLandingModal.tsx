import React, { useEffect, useState } from 'react';
import { Trophy, X, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Competition, Player } from '../../types';
import { CompetitionRegistrationModal } from '../competitions/CompetitionRegistrationModal';
import { InviteService, clearPendingInvite, getPendingInvite } from '../../services/inviteService';

interface InviteLandingModalProps {
  player: Player | null;
  onNavigateToProfile: () => void;
  onRegistered?: () => void;
}

/**
 * Shown after sign-in when the visitor arrived through an invite link (?invite=CODE).
 * Validates the invite, then hands off to the normal registration modal.
 */
export const InviteLandingModal: React.FC<InviteLandingModalProps> = ({ player, onNavigateToProfile, onRegistered }) => {
  const [code] = useState<string | null>(() => getPendingInvite());
  const [loading, setLoading] = useState(Boolean(code));
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await InviteService.accept(code);
        if (cancelled) return;
        setCompetition(res.competition);
        setAlreadyRegistered(res.alreadyRegistered);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not open this invitation.');
      } finally {
        if (!cancelled) setLoading(false);
        clearPendingInvite();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code || dismissed) return null;

  if (showRegister && competition) {
    return (
      <CompetitionRegistrationModal
        competition={competition}
        player={player}
        isOpen
        onClose={() => {
          setShowRegister(false);
          setDismissed(true);
        }}
        onSuccess={() => {
          onRegistered?.();
        }}
      />
    );
  }

  const isLeague = String(competition?.CompetitionType || '').toUpperCase() === 'LEAGUE';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#111712] border border-[#22c55e]/30 p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-[#22c55e]">
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">You're invited</span>
          </div>
          <button type="button" onClick={() => setDismissed(true)} className="text-gray-400 hover:text-white cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking your invitation…</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {competition && (
          <>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">{isLeague ? 'League' : 'Knockout Tournament'}</div>
              <h3 className="text-lg font-black text-white">{competition.Name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Entry KSh {competition.EntryFee ?? '-'}
                {competition.PrizeAmount ? ` • Prize KSh ${Number(competition.PrizeAmount).toLocaleString()}` : ''}
              </p>
            </div>

            {alreadyRegistered ? (
              <div className="p-3 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're already registered for this competition.</span>
              </div>
            ) : !player ? (
              <button
                type="button"
                onClick={() => {
                  setDismissed(true);
                  onNavigateToProfile();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Create your player profile first</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : !player.Verified ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                Your profile is awaiting administrator verification. You can register as soon as it is verified.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Register now</span>
              </button>
            )}
          </>
        )}

        {!loading && (
          <button type="button" onClick={() => setDismissed(true)} className="w-full text-[11px] text-gray-400 hover:text-white cursor-pointer">
            Close
          </button>
        )}
      </div>
    </div>
  );
};
