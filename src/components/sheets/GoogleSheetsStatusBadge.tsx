import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { GoogleSheetsConfig } from '../../config/googleSheetsConfig';
import { GoogleSheetsService, ConnectionTestResult } from '../../services/googleSheetsService';
import { GoogleSheetsConnectionModal } from './GoogleSheetsConnectionModal';

interface GoogleSheetsStatusBadgeProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const GoogleSheetsStatusBadge: React.FC<GoogleSheetsStatusBadgeProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const [sheetId, setSheetId] = useState(GoogleSheetsConfig.getSheetId());
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await GoogleSheetsService.testConnection();
      setTestResult(res);
      setSheetId(GoogleSheetsConfig.getSheetId());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    return GoogleSheetsConfig.subscribe(() => {
      setSheetId(GoogleSheetsConfig.getSheetId());
      checkStatus();
    });
  }, []);

  const maskedId = sheetId ? `${sheetId.slice(0, 6)}...` : 'None';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none group ${
          testResult?.connected
            ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/25'
            : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
        } ${className}`}
        title="Google Sheets Database Link Status - Click to Configure"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-mono text-[11px] font-bold">
          {testResult?.connected ? 'Sheet: Connected' : 'Sheet: Link Database'}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${
            testResult?.connected ? 'bg-[#22c55e] animate-pulse' : 'bg-red-500'
          }`}
        />
        {variant === 'full' && (
          <span className="hidden sm:inline font-mono text-[10px] text-gray-400 group-hover:text-gray-200">
            ({maskedId})
          </span>
        )}
      </button>

      <GoogleSheetsConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnectionUpdated={checkStatus}
      />
    </>
  );
};
