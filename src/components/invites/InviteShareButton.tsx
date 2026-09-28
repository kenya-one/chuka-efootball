import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { Competition } from '../../types';
import { InviteService, buildWhatsAppInviteUrl } from '../../services/inviteService';

interface InviteShareButtonProps {
  competition: Competition;
}

/** Player-facing: generate a personal invite link for a Knockout or League and share it. */
export const InviteShareButton: React.FC<InviteShareButtonProps> = ({ competition }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOpen = String(competition.Status || '').toUpperCase() === 'OPEN';
  if (!isOpen) return null;

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (link) return;
    setBusy(true);
    setError(null);
    try {
      const res = await InviteService.create({ competitionId: competition.CompetitionID });
      setLink(res.link);
    } catch (err: any) {
      setError(err?.message || 'Could not create invite link.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this invite link:', link);
    }
  };

  const handleNativeShare = async () => {
    if (!link) return;
    try {
      await (navigator as any).share({
        title: competition.Name,
        text: `Join ${competition.Name} on Chuka eFootball Hub!`,
        url: link,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        id={`invite-btn-${competition.CompetitionID}`}
        onClick={handleToggle}
        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Invite Friends</span>
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          {busy && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Creating your invite link…</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-300">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {link && (
            <>
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-gray-300"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 min-w-[90px] py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={buildWhatsAppInviteUrl(competition, link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[90px] py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                {typeof navigator !== 'undefined' && (navigator as any).share && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex-1 min-w-[90px] py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share…</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-500">
                Friends who open this link land straight on this {String(competition.CompetitionType).toUpperCase() === 'LEAGUE' ? 'league' : 'tournament'}'s registration. Valid for 14 days.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
