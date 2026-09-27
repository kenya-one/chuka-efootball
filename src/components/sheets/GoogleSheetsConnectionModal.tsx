import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  X,
  Code2,
  Layers,
  ArrowRight,
  Database,
  RotateCcw,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../../config/googleSheetsConfig';
import { GoogleSheetsService, ConnectionTestResult } from '../../services/googleSheetsService';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../data/googleAppsScriptTemplate';
import { useAuth } from '../../auth/AuthProvider';

interface GoogleSheetsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionUpdated?: () => void;
}

export const GoogleSheetsConnectionModal: React.FC<GoogleSheetsConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnectionUpdated,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [sheetInput, setSheetInput] = useState(GoogleSheetsConfig.getSheetId());
  const [scriptUrlInput, setScriptUrlInput] = useState(GoogleSheetsConfig.getAppsScriptUrl());
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSheetId, setCopiedSheetId] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'setup' | 'code'>('status');

  useEffect(() => {
    if (isOpen) {
      setSheetInput(GoogleSheetsConfig.getSheetId());
      setScriptUrlInput(GoogleSheetsConfig.getAppsScriptUrl());
      runQuickTest();
    }
  }, [isOpen]);

  const runQuickTest = async () => {
    setIsTesting(true);
    try {
      const res = await GoogleSheetsService.testConnection(
        scriptUrlInput,
        GoogleSheetsConfig.extractSheetId(sheetInput)
      );
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const cleanId = GoogleSheetsConfig.extractSheetId(sheetInput);
    const cleanUrl = GoogleSheetsConfig.cleanScriptUrl(scriptUrlInput);

    GoogleSheetsConfig.setSheetId(cleanId);
    GoogleSheetsConfig.setAppsScriptUrl(cleanUrl);

    setSheetInput(cleanId);
    setScriptUrlInput(cleanUrl);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    setIsSaving(false);

    if (onConnectionUpdated) {
      onConnectionUpdated();
    }

    // Run connection test with newly saved values
    runQuickTest();
  };

  const handleResetDefaults = () => {
    GoogleSheetsConfig.resetToDefaults();
    setSheetInput(GoogleSheetsConfig.getSheetId());
    setScriptUrlInput(GoogleSheetsConfig.getAppsScriptUrl());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    if (onConnectionUpdated) onConnectionUpdated();
    runQuickTest();
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const copySheetId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedSheetId(true);
    setTimeout(() => setCopiedSheetId(false), 2000);
  };

  if (!isOpen) return null;

  const currentSheetId = GoogleSheetsConfig.extractSheetId(sheetInput) || GoogleSheetsConfig.getSheetId();
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0f1712] border border-[#22c55e]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center border border-[#22c55e]/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                <span>Google Sheets Connection</span>
                {testResult?.connected ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 font-mono">
                    LINKED
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-mono">
                    NOT LINKED
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Link and synchronize Chuka eFootball tournaments with Google Spreadsheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/20 px-5 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-[#22c55e] text-[#22c55e]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Connection &amp; Status</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'setup'
                ? 'border-[#22c55e] text-[#22c55e]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>How to Link Sheet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-[#22c55e] text-[#22c55e]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Backend Code (Code.gs)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'status' && (
            <>
              {/* Live Connection Banner */}
              <div
                className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  testResult?.connected
                    ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {testResult?.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold text-sm block">
                      {testResult?.connected ? '🟢 GOOGLE SHEET LINKED & OPERATIONAL' : '🔴 GOOGLE SHEET NOT LINKED'}
                    </span>
                    <p className="text-gray-300 mt-0.5 leading-relaxed">
                      {testResult?.message ||
                        (isTesting ? 'Testing connection to Google Sheets...' : 'Checking database connection...')}
                    </p>
                    {testResult?.errorMessage && !testResult.connected && (
                      <div className="mt-2 p-2.5 rounded-xl bg-black/60 border border-red-500/30 font-mono text-[11px] text-red-300">
                        {testResult.errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={runQuickTest}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Now'}</span>
                  </button>

                  {currentSheetId && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Active Spreadsheet Details */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                    Current Linked Spreadsheet
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copySheetId(currentSheetId)}
                      className="text-[11px] text-[#22c55e] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSheetId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSheetId ? 'Copied ID' : 'Copy ID'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-gray-200 bg-black/60 p-2.5 rounded-xl border border-white/5 text-[11px] break-all">
                  <span>{currentSheetId || 'No sheet ID configured'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/5">
                    <span className="text-gray-400 block text-[9px] uppercase">Database Tabs</span>
                    <span className="font-bold text-white">9 Production Sheets</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5">
                    <span className="text-gray-400 block text-[9px] uppercase">Access Mode</span>
                    <span className="font-bold text-white">Authorized API</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5">
                    <span className="text-gray-400 block text-[9px] uppercase">Sync Frequency</span>
                    <span className="font-bold text-[#22c55e]">Live / Real-Time</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5">
                    <span className="text-gray-400 block text-[9px] uppercase">CORS Protocol</span>
                    <span className="font-bold text-white">text/plain POST</span>
                  </div>
                </div>
              </div>

              {/* Configuration Inputs */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Google Sheet ID or Full Spreadsheet URL</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="e.g. 1-PRgld5dvSvlHszQoRaQnPf2zo-Fr4dmll9I_tbMif4 or paste docs.google.com link"
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    You can paste either the raw 44-character Sheet ID or the entire Google Sheet browser URL.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-[#22c55e]" />
                      <span>Google Apps Script Web App Endpoint (/exec)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={scriptUrlInput}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Obtained from Google Sheets &gt; Extensions &gt; Apps Script &gt; Deploy as Web App.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Official Default</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Connected &amp; Saved!</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Save &amp; Link Sheet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-gray-300 space-y-2">
                <h3 className="font-bold text-sm text-[#22c55e] flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Step-by-Step Instructions to Link a Google Sheet</span>
                </h3>
                <p className="text-gray-300">
                  Follow these 4 simple steps to connect any Google Spreadsheet to this Chuka eFootball application:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e] text-black flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <span>Create or Open a Google Sheet</span>
                  </div>
                  <p className="text-gray-400 pl-8">
                    Open your tournament Google Spreadsheet, or create a brand new one instantly by visiting{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#22c55e] hover:underline font-semibold"
                    >
                      sheets.new <ExternalLink className="w-3 h-3 inline" />
                    </a>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e] text-black flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <span>Open Apps Script in Google Sheets</span>
                  </div>
                  <p className="text-gray-400 pl-8">
                    Inside your spreadsheet menu, click <strong>Extensions &gt; Apps Script</strong>. A new code editor tab will open.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-white text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#22c55e] text-black flex items-center justify-center text-xs font-black">
                        3
                      </span>
                      <span>Paste the Chuka eFootball Backend Code</span>
                    </div>
                    <button
                      type="button"
                      onClick={copyScriptToClipboard}
                      className="px-3 py-1 rounded-xl bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Copied Code!' : 'Copy Code.gs'}</span>
                    </button>
                  </div>
                  <p className="text-gray-400 pl-8">
                    Delete any default code in <code>Code.gs</code>, click the button above to copy the official Chuka backend script, and paste it. Then click <strong>Save (Ctrl+S)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <span className="w-6 h-6 rounded-full bg-[#22c55e] text-black flex items-center justify-center text-xs font-black">
                      4
                    </span>
                    <span>Deploy as a Web App &amp; Paste URL</span>
                  </div>
                  <div className="text-gray-400 pl-8 space-y-1.5">
                    <p>In Apps Script toolbar, click <strong>Deploy &gt; New deployment</strong>:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      <li>Select type: <strong>Web app</strong> (click the gear icon)</li>
                      <li>Description: <strong>Chuka eFootball API</strong></li>
                      <li>Execute as: <strong>Me</strong></li>
                      <li>Who has access: <strong>Anyone</strong></li>
                    </ul>
                    <p className="pt-1">
                      Click <strong>Deploy</strong>, copy the Web app URL (ends in <code>/exec</code>), and paste it into the <strong>Connection &amp; Status</strong> tab!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className="px-4 py-2 rounded-xl bg-[#22c55e] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Go to Connection Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Google Apps Script Backend (Code.gs)</h3>
                  <p className="text-gray-400 text-[11px]">
                    Production script with automatic sheet table generator, health diagnostics, and authentication.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className="px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                >
                  {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'Copied Full Script!' : 'Copy Code.gs Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-black/80 border border-white/10 text-gray-300 font-mono text-[11px] overflow-x-auto max-h-[360px] leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
