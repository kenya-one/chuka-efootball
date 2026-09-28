import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { MatchRule } from '../../types';
import { INITIAL_MATCH_RULES } from '../../data/matchRulesData';
import { OfficialMatchRulesDocument } from './OfficialMatchRulesDocument';

interface MatchRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules?: MatchRule[];
}

export const MatchRulesModal: React.FC<MatchRulesModalProps> = ({
  isOpen,
  onClose,
  rules = INITIAL_MATCH_RULES,
}) => {
  if (!isOpen) return null;

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  return (
    <div
      id="match-rules-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="match-rules-modal-container"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col my-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Excluded from print) */}
        <div className="no-print bg-[#111612] text-white px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            <span className="text-xs font-bold tracking-wide uppercase font-mono text-gray-200">
              Official Document Viewer • Match Rules
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="modal-rules-print-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all cursor-pointer"
              title="Print official rules"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              id="rules-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Rules"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Document Scroll Area */}
        <div className="overflow-y-auto bg-[#e5e7eb] p-2 sm:p-6 flex justify-center">
          <OfficialMatchRulesDocument rules={rules} />
        </div>
      </div>
    </div>
  );
};

