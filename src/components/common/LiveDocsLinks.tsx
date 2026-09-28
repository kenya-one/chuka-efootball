import React, { useEffect, useState } from 'react';
import { FileText, Users } from 'lucide-react';
import { LiveDocsService } from '../../services/inviteService';
import { LiveDocsInfo } from '../../types';

/** Public links to the auto-updating Google Docs (rules + live registered players). */
export const LiveDocsLinks: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [docs, setDocs] = useState<LiveDocsInfo | null>(null);

  useEffect(() => {
    LiveDocsService.get().then(setDocs).catch(() => setDocs(null));
  }, []);

  if (!docs || (!docs.rulesUrl && !docs.rosterUrl)) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {docs.rosterUrl && (
        <a
          href={docs.rosterUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="live-roster-doc-link"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/30 text-[#22c55e] text-[11px] font-bold uppercase tracking-wider"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Live Registered Players</span>
        </a>
      )}
      {docs.rulesUrl && (
        <a
          href={docs.rulesUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="official-rules-doc-link"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[11px] font-bold uppercase tracking-wider"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Official Rules (Google Doc)</span>
        </a>
      )}
    </div>
  );
};
