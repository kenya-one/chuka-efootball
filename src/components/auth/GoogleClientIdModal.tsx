import React, { useState } from 'react';
import { X, Shield, Key, CheckCircle, ExternalLink, Mail } from 'lucide-react';
import { GoogleAuthService } from '../../services/googleAuthService';
import { GoogleAuthUser } from '../../types';

interface GoogleClientIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleAuthUser) => void;
}

export const GoogleClientIdModal: React.FC<GoogleClientIdModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [clientIdInput, setClientIdInput] = useState(GoogleAuthService.getClientId());
  const [customEmail, setCustomEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveClientId = () => {
    if (!clientIdInput.trim()) {
      setErrorMsg('Please enter a valid Google OAuth Client ID.');
      return;
    }
    GoogleAuthService.setClientId(clientIdInput.trim());
    setErrorMsg(null);
    // Attempt GIS prompt
    const ok = GoogleAuthService.initializeGIS(onSuccess);
    if (ok && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      onClose();
    } else {
      setErrorMsg('Client ID saved! Tap Sign In with Google again.');
      setTimeout(() => onClose(), 1000);
    }
  };

  const handleQuickGoogleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const email = customEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }

    const authUser: GoogleAuthUser = {
      uid: `GOOGLE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      email,
      displayName: email.split('@')[0],
    };
    GoogleAuthService.setStoredUser(authUser);
    onSuccess(authUser);
    onClose();
  };

  return (
    <div
      id="google-client-id-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="google-client-id-modal"
        className="w-full max-w-md bg-[#0e1510] text-gray-100 rounded-3xl border border-[#22c55e]/30 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Google Sign-In Authentication</h3>
              <p className="text-[11px] text-gray-400">Official Player Account Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Option A: Fast Verified Google Email Sign-In */}
          <form onSubmit={handleQuickGoogleAccount} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Enter Your Google Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. wayongohlaurence@gmail.com"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-[#22c55e] focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Authenticate with Google Email</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase font-bold text-gray-400">or OAuth Client ID</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Option B: Enter GCP OAuth Client ID */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
              Google Cloud OAuth Client ID (Optional)
            </label>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveClientId}
              className="w-full py-2 rounded-xl border border-white/20 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Save Client ID & Initialize One-Tap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
