import React, { useMemo, useState } from 'react';
import { Users, BadgeCheck, Clock, Search } from 'lucide-react';
import { CompetitionRegistration, Player } from '../../types';
import { splitRegistrations, formatShortDate } from '../../utils/competitionUtils';

type Tab = 'ALL' | 'VERIFIED' | 'UNVERIFIED';

interface RegisteredMembersPanelProps {
  registrations: CompetitionRegistration[];
  currentPlayer?: Player | null;
  loading?: boolean;
  pageSize?: number;
  className?: string;
}

/**
 * Lists everyone registered for one competition, split into
 * verified (approved / payment confirmed) and unverified (awaiting approval).
 */
export const RegisteredMembersPanel: React.FC<RegisteredMembersPanelProps> = ({
  registrations,
  currentPlayer,
  loading = false,
  pageSize = 40,
  className = '',
}) => {
  const [tab, setTab] = useState<Tab>('ALL');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(pageSize);

  const { live, verified, unverified } = useMemo(() => splitRegistrations(registrations), [registrations]);

  const rows = useMemo(() => {
    const base = tab === 'VERIFIED' ? verified : tab === 'UNVERIFIED' ? unverified : [...verified, ...unverified];
    const q = query.trim().toLowerCase();
    return q ? base.filter((r) => (r.eFootballUsername || '').toLowerCase().includes(q)) : base;
  }, [tab, verified, unverified, query]);

  const isMe = (r: CompetitionRegistration) =>
    !!currentPlayer &&
    (r.PlayerID === currentPlayer.PlayerID ||
      r.GoogleUID === currentPlayer.FirebaseUID ||
      (!!r.eFootballUsername && r.eFootballUsername === currentPlayer.eFootballUsername));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: live.length },
    { id: 'VERIFIED', label: 'Verified', count: verified.length },
    { id: 'UNVERIFIED', label: 'Unverified', count: unverified.length },
  ];

  return (
    <div className={`rounded-3xl border border-white/10 bg-[#0f1611] overflow-hidden ${className}`}>
      <div className="p-4 sm:p-5 space-y-3 border-b border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#22c55e]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Registered Members</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
              <BadgeCheck className="w-3 h-3" /> {verified.length} verified
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="w-3 h-3" /> {unverified.length} unverified
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-xl bg-black/40 border border-white/10 p-0.5 self-start">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setVisible(pageSize);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  tab === t.id ? 'bg-[#22c55e] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(pageSize);
              }}
              placeholder="Search by eFootball username..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#22c55e]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400">Loading registered members…</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center space-y-1">
          <p className="text-sm font-semibold text-white">
            {live.length === 0 ? 'No members have registered yet' : 'No members match this view'}
          </p>
          <p className="text-xs text-gray-400">
            {live.length === 0
              ? 'Be the first to register. Every entry appears here as soon as it is received — unverified until the payment is approved.'
              : 'Try another tab or clear the search box.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-white/5">
            {rows.slice(0, visible).map((r, i) => {
              const ok = !!r.Status && (r.Status === 'APPROVED' || r.PaymentStatus === 'PAID' || r.PaymentStatus === 'CONFIRMED');
              return (
                <li
                  key={r.RegistrationID || `${r.eFootballUsername}-${i}`}
                  className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 text-xs ${isMe(r) ? 'bg-[#22c55e]/10' : ''}`}
                >
                  <span className="w-8 text-right font-mono text-gray-500">{i + 1}</span>
                  <span className="flex-1 min-w-0 font-bold text-white truncate">
                    {r.eFootballUsername || 'Unnamed player'}
                    {isMe(r) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-[#22c55e] text-black">YOU</span>
                    )}
                  </span>
                  <span className="hidden sm:inline text-gray-500 font-mono">{formatShortDate(r.RegisteredAt)}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      ok
                        ? 'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {ok ? 'Verified' : 'Unverified'}
                  </span>
                </li>
              );
            })}
          </ul>
          {rows.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + pageSize)}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider text-[#22c55e] hover:bg-white/5 border-t border-white/5 cursor-pointer"
            >
              Show more ({rows.length - visible} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
};
