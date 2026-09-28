import React from 'react';
import { Printer, ArrowLeft, Download, Shield } from 'lucide-react';
import { MatchRule, ThemeMode } from '../../types';
import { OfficialMatchRulesDocument } from './OfficialMatchRulesDocument';

interface MatchRulesViewProps {
  rules?: MatchRule[];
  theme: ThemeMode;
  onBack?: () => void;
}

export const MatchRulesView: React.FC<MatchRulesViewProps> = ({
  rules,
  theme,
  onBack,
}) => {
  const isDark = theme === 'dark';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="match-rules-page-view"
      className={`min-h-screen w-full transition-colors ${
        isDark ? 'bg-[#0a0f0b]' : 'bg-[#f4f6f4]'
      }`}
    >
      {/* Top Document Utility Bar (Excluded from Print) */}
      <div className="no-print sticky top-16 z-30 w-full bg-[#111612]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                id="rules-page-back-btn"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <Shield className="w-4 h-4 text-[#22c55e]" />
              <span className="font-bold text-white uppercase tracking-wider">
                Official University Esports Document
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="rules-print-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official White Document Body */}
      <div className="document-page-wrapper py-6 sm:py-10">
        <OfficialMatchRulesDocument rules={rules} />
      </div>
    </div>
  );
};
