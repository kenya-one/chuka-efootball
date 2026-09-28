import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertTriangle, Image as ImageIcon, Shield } from 'lucide-react';
import { ResultSubmissionPayload } from '../../types';

interface SubmitResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  competition: 'Knockout' | 'League';
  player1Username: string;
  player2Username: string;
  currentPlayerUsername?: string;
  onSubmit: (payload: ResultSubmissionPayload) => Promise<void>;
}

export const SubmitResultModal: React.FC<SubmitResultModalProps> = ({
  isOpen,
  onClose,
  matchId,
  competition,
  player1Username,
  player2Username,
  currentPlayerUsername,
  onSubmit,
}) => {
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }
    setErrorMsg(null);
    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setScreenshotPreview(result);
      setScreenshotBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotFile && !screenshotBase64) {
      setErrorMsg('⚠️ Uploading a match screenshot is required for official verification.');
      return;
    }
    if (player1Score < 0 || player2Score < 0) {
      setErrorMsg('Score values cannot be negative.');
      return;
    }
    if (competition === 'Knockout' && player1Score === player2Score) {
      setErrorMsg('Knockout fixtures cannot end in a draw. Enter final score including penalties.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit({
        matchId,
        competition,
        player1Score,
        player2Score,
        screenshotFile,
        screenshotBase64,
        screenshotName: screenshotFile?.name || `${matchId}_score.png`,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="submit-result-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="submit-result-modal"
        className="w-full max-w-lg bg-[#0e1510] text-gray-100 rounded-3xl border border-[#22c55e]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#131b14]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#22c55e]">
              Official Result Submission • {competition}
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Match ID: <span className="font-mono text-[#22c55e]">{matchId}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Info Banner */}
        <div className="bg-[#18231a] px-5 py-2.5 border-b border-white/5 flex items-center gap-2 text-xs text-gray-300">
          <Shield className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
          <span>
            Dual Submission: Both players independently submit score &amp; screenshot. Backend verifies matches automatically.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Score Entry */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
              Enter Final Match Score
            </label>

            <div className="flex items-center justify-around gap-4">
              {/* Player 1 */}
              <div className="flex-1 text-center">
                <div className="text-xs font-bold text-white truncate max-w-[120px] mx-auto mb-2">
                  {player1Username}
                </div>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={player1Score}
                  onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                  className="w-16 h-14 mx-auto text-center font-mono text-2xl font-black rounded-xl bg-[#111812] border border-[#22c55e]/40 focus:border-[#22c55e] focus:outline-none text-[#22c55e]"
                />
              </div>

              <div className="text-xl font-bold text-gray-500">-</div>

              {/* Player 2 */}
              <div className="flex-1 text-center">
                <div className="text-xs font-bold text-white truncate max-w-[120px] mx-auto mb-2">
                  {player2Username}
                </div>
                <input
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={player2Score}
                  onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                  className="w-16 h-14 mx-auto text-center font-mono text-2xl font-black rounded-xl bg-[#111812] border border-[#22c55e]/40 focus:border-[#22c55e] focus:outline-none text-[#22c55e]"
                />
              </div>
            </div>
          </div>

          {/* Screenshot Upload (Prepared for Google Drive via Apps Script) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#22c55e]" />
                <span>Upload Match Result Screenshot (Required)</span>
              </label>
              <span className="text-[10px] text-gray-400">Stored via Drive</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {!screenshotPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-[#22c55e]/30 hover:border-[#22c55e] rounded-2xl bg-[#121a14] hover:bg-[#152217] transition-all flex flex-col items-center justify-center p-4 text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">Tap to upload match screenshot</span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  Full screen showing score, player names, and statistics
                </span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#22c55e]/40 group max-h-48 bg-black flex items-center justify-center">
                <img
                  src={screenshotPreview}
                  alt="Result preview"
                  className="max-h-48 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                    setScreenshotBase64('');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/90 cursor-pointer"
                  title="Remove screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Note: The result will not be counted in league standings until your opponent confirms or an administrator reviews it.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Result</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
