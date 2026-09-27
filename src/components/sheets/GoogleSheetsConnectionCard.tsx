import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Database,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../../config/googleSheetsConfig';
import { GoogleSheetsService, ConnectionTestResult } from '../../services/googleSheetsService';
import { GoogleSheetsConnectionModal } from './GoogleSheetsConnectionModal';

interface GoogleSheetsConnectionCardProps {
  theme?: 'dark' | 'light';
  className?: string;
  onConnectionChanged?: () => void;
}

export const GoogleSheetsConnectionCard: React.FC<GoogleSheetsConnectionCardProps> = ({
  theme = 'dark',
  className = '',
  onConnectionChanged,
}) => {
  const isDark = theme === 'dark';
  const [sheetId, setSheetId] = useState(GoogleSheetsConfig.getSheetId());
  const [appsScriptUrl, setAppsScriptUrl] = useState(GoogleSheetsConfig.getAppsScriptUrl());
  const [sheetInput, setSheetInput] = useState(GoogleSheetsConfig.getSheetId());
  const [scriptUrlInput, setScriptUrlInput] = useState(GoogleSheetsConfig.getAppsScriptUrl());
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshState = () => {
    const curId = GoogleSheetsConfig.getSheetId();
    const curUrl = GoogleSheetsConfig.getAppsScriptUrl();
    setSheetId(curId);
    setAppsScriptUrl(curUrl);
    setSheetInput(curId);
    setScriptUrlInput(curUrl);
  };

  useEffect(() => {
    refreshState();
    runTest();
    return GoogleSheetsConfig.subscribe(refreshState);
  }, []);

  const runTest = async () => {
    setIsTesting(true);
    try {
      const res = await GoogleSheetsService.testConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanId = GoogleSheetsConfig.extractSheetId(sheetInput);
    const cleanUrl = GoogleSheetsConfig.cleanScriptUrl(scriptUrlInput);

    GoogleSheetsConfig.setSheetId(cleanId);
    GoogleSheetsConfig.setAppsScriptUrl(cleanUrl);

    refreshState();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    if (onConnectionChanged) {
      onConnectionChanged();
    }

    runTest();
  };

  const handleResetDefaults = () => {
    GoogleSheetsConfig.resetToDefaults();
    refreshState();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    if (onConnectionChanged) onConnectionChanged();
    runTest();
  };

  const copyId = () => {
    if (!sheetId) return;
    navigator.clipboard.writeText(sheetId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  return (
    <>
      <div
        className={`w-full rounded-3xl border transition-all ${
          isDark
            ? 'bg-[#111712] border-white/10 text-gray-100 shadow-xl'
            : 'bg-white border-gray-200 text-gray-900 shadow-md'
        } ${className}`}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center border border-[#22c55e]/30 flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="text-base font-bold uppercase tracking-wider text-white"
                  style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                >
                  Google Sheets Database Link
                </h3>
                {testResult?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 font-mono tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                    CONNECTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 font-mono tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    NOT CONNECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Tournament data, players, and match submissions synchronize via Google Apps Script.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={runTest}
              disabled={isTesting}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-white/5 disabled:opacity-50"
              title="Test connection to Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Configure Sheet</span>
            </button>
          </div>
        </div>

        {/* Live Status Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Diagnostic Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              testResult?.connected
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {testResult?.connected ? (
              <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <span className="font-bold text-xs block">
                {testResult?.connected
                  ? '🟢 Live Synchronization Active'
                  : '🔴 Spreadsheet Connection Required'}
              </span>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {testResult?.message || 'Validating backend connection to Google Sheets database...'}
              </p>
              {testResult?.errorMessage && !testResult.connected && (
                <div className="mt-1.5 p-2 rounded-xl bg-black/60 border border-red-500/30 text-[11px] font-mono text-red-300">
                  {testResult.errorMessage}
                </div>
              )}
            </div>

            {sheetId && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] flex items-center gap-1 transition-colors flex-shrink-0"
              >
                <span>View Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Spreadsheet ID:</span>
                <button
                  type="button"
                  onClick={copyId}
                  className="text-[#22c55e] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-white text-[11px] truncate">
                {sheetId || 'Not configured'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <span className="text-[11px] text-gray-400 block">Apps Script Endpoint:</span>
              <div className="font-mono text-[#22c55e] text-[11px] truncate">
                {appsScriptUrl.replace(/^https:\/\/script\.google\.com\/macros\/s\//, '.../') || 'Not configured'}
              </div>
            </div>
          </div>

          {/* Toggle Quick Edit Form */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isExpanded ? 'Hide Quick Settings' : 'Edit Sheet ID / URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-[#22c55e] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Step-by-Step Setup Guide &amp; Code.gs</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Expanded Inline Quick Edit Form */}
          {isExpanded && (
            <div className="pt-3 space-y-4 border-t border-white/10 animate-in fade-in duration-150">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                  Google Sheet ID or Full Spreadsheet URL
                </label>
                <input
                  type="text"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  placeholder="Paste Google Sheet URL or ID..."
                  className="w-full rounded-xl bg-black/60 border border-white/10 px-3.5 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                  Apps Script Web App URL (/exec)
                </label>
                <input
                  type="text"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl bg-black/60 border border-white/10 px-3.5 py-2 text-xs font-mono text-white placeholder-gray-600 focus:border-[#22c55e] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>{saveSuccess ? 'Linked & Saved!' : 'Save & Link Sheet'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Configuration & Instructions Modal */}
      <GoogleSheetsConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnectionUpdated={() => {
          refreshState();
          if (onConnectionChanged) onConnectionChanged();
        }}
      />
    </>
  );
};
