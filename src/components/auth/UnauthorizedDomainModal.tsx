import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  X,
  Info,
} from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
  projectId?: string;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  domain,
  projectId = 'chuka-efootball-hub',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDomain =
    domain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleCopy = () => {
    if (currentDomain && navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      id="unauthorized-domain-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="unauthorized-domain-modal"
        className="w-full max-w-lg bg-[#0c120e] text-gray-100 rounded-3xl border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#141a13] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Authorize Preview Domain in Firebase
              </h2>
              <p className="text-xs text-amber-300/80 font-mono">
                Firebase: auth/unauthorized-domain
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Explanation */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                Firebase Authentication blocks Google Sign-In popups from unrecognized hostnames to prevent phishing. To enable Google Sign-In on this deployment, add the current hostname to your <strong>Authorized domains</strong> list in the Firebase Console.
              </div>
            </div>
          </div>

          {/* Current Domain Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block">
              Current Hostname to Authorize
            </label>
            <div className="flex items-center gap-2 bg-black/60 border border-white/15 p-2.5 rounded-2xl">
              <span className="font-mono text-amber-300 text-xs break-all flex-1 select-all px-1">
                {currentDomain || 'Unknown Domain'}
              </span>
              <button
                type="button"
                id="copy-domain-btn"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="space-y-2.5 bg-black/30 p-4 rounded-2xl border border-white/10 text-xs text-gray-300">
            <p className="font-bold text-white uppercase text-[11px] tracking-wider">
              Quick Setup Steps (30 seconds):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-gray-300">
              <li>
                Click the button below to open Firebase Authentication Settings.
              </li>
              <li>
                Scroll to <strong>Authorized domains</strong> &rarr; click <strong>Add domain</strong>.
              </li>
              <li>
                Paste <code className="text-amber-300 bg-white/5 px-1 py-0.5 rounded font-mono">{currentDomain}</code> and save.
              </li>
            </ol>
          </div>

          {/* External Action Button */}
          <div className="pt-1">
            <a
              id="open-firebase-console-btn"
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>Open Firebase Authorized Domains</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
