import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Send, ExternalLink } from 'lucide-react';
import { TournamentAdminService } from '../../services/tournamentAdminService';

interface SubmitDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentPlayerId: string;
  onSubmit: (reason: string) => Promise<void>;
}

export const SubmitDisputeModal: React.FC<SubmitDisputeModalProps> = ({
  isOpen,
  onClose,
  matchId,
  currentPlayerId,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [disputeUrl, setDisputeUrl] = useState('https://chat.whatsapp.com/IVY8h3s16MlBmTgmWu6ZIg');

  useEffect(() => {
    TournamentAdminService.getWhatsAppGroups()
      .then((groups) => {
        if (groups && groups.length > 0) {
          // Look for group 3 or any group with 'dispute' or 'help' in name
          const found = groups.find((g) => g.group_number === 3 || g.name.toLowerCase().includes('dispute') || g.description.toLowerCase().includes('dispute'));
          if (found && found.group_url) {
            setDisputeUrl(found.group_url);
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please describe why you are disputing this result.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit(reason.trim());
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Dispute submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="submit-dispute-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="submit-dispute-modal"
        className="w-full max-w-md bg-[#0e1510] text-gray-100 rounded-3xl border border-red-500/40 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Dispute Match Result</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="text-xs text-gray-300">
            Match ID: <span className="font-mono text-white font-bold">{matchId}</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Reason for Dispute
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incorrect score submitted, disconnection in minute 75, improper match settings..."
              className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
            <p className="font-bold">Next Steps:</p>
            <p>
              This match will be marked as <strong>Disputed</strong> in the Google Sheet. Standings will be frozen until an official reviews it.
            </p>
            <a
              href={disputeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#22c55e] font-semibold underline mt-1"
            >
              <span>Join WhatsApp Results & Disputes</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Filing...' : 'Submit Dispute'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
