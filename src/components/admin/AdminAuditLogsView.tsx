import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { getAuditLogs } from '../../api/endpoints';

export interface AuditLogEntry {
  LogID?: string;
  Timestamp: string;
  Action: string;
  EntityType?: string;
  EntityID?: string;
  GoogleUID?: string;
  Email?: string;
  Description?: string;
  Details?: string;
}

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs({ limit: 100 });
      if (res.success && res.data?.logs) {
        setLogs(res.data.logs);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Network error fetching audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.Action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const target = `${log.Action} ${log.Description || ''} ${log.Email || ''} ${log.EntityID || ''} ${log.EntityType || ''}`.toLowerCase();
      if (!target.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
              System Auditing
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono">
            Immutable Audit Trail
          </h2>
          <p className="text-xs text-gray-400">
            Real-time chronological activity record of tournament creation, score adjudication, player syncs, and administrative actions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111712] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, email, description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
          />
        </div>

        <span className="text-xs text-gray-400 font-mono">
          Showing {filteredLogs.length} of {logs.length} events
        </span>
      </div>

      {/* Logs Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Loading audit logs...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchLogs}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white font-bold"
          >
            Retry
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-[#111712] border border-white/10 rounded-3xl space-y-2">
          <Activity className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Events Found</h3>
          <p className="text-xs text-gray-400">System actions will log here automatically.</p>
        </div>
      ) : (
        <div className="bg-[#111712] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/20">
                    {log.Action}
                  </span>
                  {log.EntityType && (
                    <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                      {log.EntityType}: {log.EntityID || '—'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {log.Timestamp ? new Date(log.Timestamp).toLocaleString() : 'Recent'}
                </span>
              </div>

              <p className="text-xs text-gray-300">
                {log.Description || log.Details || 'System event recorded.'}
              </p>

              {log.Email && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                  <User className="w-3 h-3" />
                  <span>Initiated by: {log.Email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
