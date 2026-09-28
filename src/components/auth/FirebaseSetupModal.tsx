import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Globe,
  Settings,
} from 'lucide-react';
import { FirebaseConfig, FirebaseConfigValues } from '../../config/firebaseConfig';
import { FirebaseAuthService } from '../../services/firebaseAuthService';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured?: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConfigured,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [measurementId, setMeasurementId] = useState('');
  const [jsonPaste, setJsonPaste] = useState('');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (isOpen) {
      const cfg = FirebaseConfig.getConfig();
      setApiKey(cfg.apiKey);
      setAuthDomain(cfg.authDomain);
      setProjectId(cfg.projectId);
      setStorageBucket(cfg.storageBucket);
      setMessagingSenderId(cfg.messagingSenderId);
      setAppId(cfg.appId);
      setMeasurementId(cfg.measurementId || '');
      setErrorMsg(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle JSON Paste (when user copies const firebaseConfig = {...} directly from Firebase Console)
  const handleParseJsonPaste = (text: string) => {
    setJsonPaste(text);
    if (!text.trim()) return;

    try {
      // Clean up common JS formats like "const firebaseConfig = { ... };"
      let clean = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      // If keys are not quoted, quote them
      clean = clean.replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');
      // Fix single quotes to double quotes
      clean = clean.replace(/'/g, '"');

      const parsed = JSON.parse(clean);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
      if (parsed.measurementId) setMeasurementId(parsed.measurementId);
      setErrorMsg(null);
    } catch {
      // Regex fallbacks
      const matchKey = text.match(/apiKey["']?\s*:\s*["']([^"']+)["']/);
      const matchDomain = text.match(/authDomain["']?\s*:\s*["']([^"']+)["']/);
      const matchProject = text.match(/projectId["']?\s*:\s*["']([^"']+)["']/);
      const matchBucket = text.match(/storageBucket["']?\s*:\s*["']([^"']+)["']/);
      const matchSender = text.match(/messagingSenderId["']?\s*:\s*["']([^"']+)["']/);
      const matchApp = text.match(/appId["']?\s*:\s*["']([^"']+)["']/);
      const matchMeasurement = text.match(/measurementId["']?\s*:\s*["']([^"']+)["']/);

      if (matchKey) setApiKey(matchKey[1]);
      if (matchDomain) setAuthDomain(matchDomain[1]);
      if (matchProject) setProjectId(matchProject[1]);
      if (matchBucket) setStorageBucket(matchBucket[1]);
      if (matchSender) setMessagingSenderId(matchSender[1]);
      if (matchApp) setAppId(matchApp[1]);
      if (matchMeasurement) setMeasurementId(matchMeasurement[1]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim() || !authDomain.trim() || !projectId.trim() || !appId.trim()) {
      setErrorMsg('Please provide at least API Key, Auth Domain, Project ID, and App ID.');
      return;
    }

    const newValues: FirebaseConfigValues = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
      measurementId: measurementId.trim(),
    };

    FirebaseConfig.setConfig(newValues);
    const initialized = FirebaseAuthService.init();

    if (initialized) {
      setSavedSuccess(true);
      setErrorMsg(null);
      if (onConfigured) onConfigured();
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg('Saved, but Firebase initialization failed. Check your values.');
    }
  };

  const handleCopyDomain = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  return (
    <div
      id="firebase-setup-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="firebase-setup-modal"
        className="w-full max-w-xl bg-[#0d140e] text-gray-100 rounded-3xl border border-[#22c55e]/30 shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Firebase Authentication Setup
              </h3>
              <p className="text-[11px] text-gray-400">
                Official Google Sign-In Identity for Chuka eFootball
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="mt-4 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#22c55e]">
              <Info className="w-4 h-4" />
              <span>How to connect your Firebase Project:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-[11px] leading-relaxed pl-1">
              <li>
                Open{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#22c55e] hover:underline inline-flex items-center gap-0.5"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and open or create your project.
              </li>
              <li>
                Go to <strong>Build &gt; Authentication &gt; Sign-in method</strong>, select{' '}
                <strong>Google</strong>, and toggle <strong>Enable</strong>.
              </li>
              <li>
                Go to <strong>Project Settings (gear icon) &gt; General &gt; Your apps</strong>, click{' '}
                <strong>&lt;/&gt; (Web app)</strong>, and copy the <code>firebaseConfig</code> object.
              </li>
              <li>
                In <strong>Authentication &gt; Settings &gt; Authorized domains</strong>, add this website's domain:
              </li>
            </ol>

            {/* Authorized Domain Copy Strip */}
            <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-black/50 border border-white/10 text-[11px]">
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-[#22c55e] flex-shrink-0" />
                <span className="text-gray-400">Authorized Domain:</span>
                <span className="font-mono text-white truncate">{currentHost || 'localhost'}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="ml-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 text-[10px] flex-shrink-0 cursor-pointer"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3 h-3 text-[#22c55e]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Domain</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Paste Box */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
              ⚡ Quick Paste from Firebase SDK snippet (Optional)
            </label>
            <textarea
              rows={2}
              value={jsonPaste}
              onChange={(e) => handleParseJsonPaste(e.target.value)}
              placeholder="Paste const firebaseConfig = { apiKey: '...', ... } here to autofill"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-[11px] font-mono text-gray-200 placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Firebase initialized successfully! Closing...</span>
            </div>
          )}

          {/* Configuration Form Fields */}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  VITE_FIREBASE_API_KEY *
                </label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  VITE_FIREBASE_AUTH_DOMAIN *
                </label>
                <input
                  type="text"
                  required
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="your-project.firebaseapp.com"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  VITE_FIREBASE_PROJECT_ID *
                </label>
                <input
                  type="text"
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="your-project-id"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  VITE_FIREBASE_APP_ID *
                </label>
                <input
                  type="text"
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456:web:abcd..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  VITE_FIREBASE_STORAGE_BUCKET
                </label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="your-project.appspot.com"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  VITE_FIREBASE_MESSAGING_SENDER_ID
                </label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="1234567890"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                className="w-full sm:w-auto flex-1 py-2.5 px-5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#22c55e]/20"
              >
                <Settings className="w-4 h-4" />
                <span>Save Credentials & Initialize Firebase</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-white/15 hover:bg-white/5 text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>

          <p className="text-[10px] text-gray-500 pt-2 border-t border-white/5">
            Note: You can also define these directly in your <code>.env</code> file. Firebase is used exclusively for authentication; tournament data continues to flow to Google Sheets.
          </p>
        </div>
      </div>
    </div>
  );
};
