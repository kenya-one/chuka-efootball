import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Users,
  RefreshCw,
  ExternalLink,
  Send,
  Copy,
  Check,
  MessageCircle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Link2,
} from 'lucide-react';
import { Competition, InviteRecord, LiveDocsInfo } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';
import {
  InviteService,
  LiveDocsService,
  buildInviteLink,
  buildWhatsAppInviteUrl,
} from '../../services/inviteService';

const fmt = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const stateStyle: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  USED: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  EXPIRED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  REVOKED: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export const AdminDocsInvitesView: React.FC = () => {
  const [docs, setDocs] = useState<LiveDocsInfo | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [compId, setCompId] = useState('');
  const [email, setEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(14);
  const [maxUses, setMaxUses] = useState(0);
  const [lastLink, setLastLink] = useState<{ link: string; comp?: Competition } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, c, i] = await Promise.all([
        LiveDocsService.get().catch(() => null),
        TournamentAdminService.getCompetitions().catch(() => [] as Competition[]),
        InviteService.list().catch((e) => {
          setError(e?.message || 'Failed to load invitations.');
          return [] as InviteRecord[];
        }),
      ]);
      setDocs(d);
      setCompetitions(c);
      setInvites(i);
      if (!compId && c.length > 0) {
        const firstOpen = c.find((x) => String(x.Status).toUpperCase() === 'OPEN') || c[0];
        setCompId(firstOpen.CompetitionID);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedComp = useMemo(() => competitions.find((c) => c.CompetitionID === compId), [competitions, compId]);
  const knockouts = competitions.filter((c) => String(c.CompetitionType).toUpperCase() === 'KNOCKOUT');
  const leagues = competitions.filter((c) => String(c.CompetitionType).toUpperCase() === 'LEAGUE');

  const handleSync = async (what: 'all' | 'rules' | 'roster') => {
    setSyncing(what);
    setError(null);
    setNotice(null);
    try {
      const info = await LiveDocsService.sync(what);
      setDocs(info);
      setNotice(
        what === 'rules'
          ? 'Official Match Rules document rebuilt from the MatchRules sheet.'
          : what === 'roster'
          ? 'Live Registered Players document refreshed.'
          : 'Both Google Docs were rebuilt successfully.'
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh Google Docs.');
    } finally {
      setSyncing(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compId) {
      setError('Choose a competition first.');
      return;
    }
    setCreating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await InviteService.create({
        competitionId: compId,
        email: email.trim() || undefined,
        expiryDays,
        maxUses: email.trim() ? 1 : maxUses,
      });
      setLastLink({ link: res.link, comp: selectedComp });
      setNotice(res.message);
      setEmail('');
      setInvites(await InviteService.list().catch(() => invites));
    } catch (err: any) {
      setError(err?.message || 'Failed to create invitation.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (inv: InviteRecord) => {
    if (!window.confirm(`Revoke invitation ${inv.Code}? The link will stop working.`)) return;
    try {
      await InviteService.revoke(inv.InviteID);
      setNotice(`Invitation ${inv.Code} revoked.`);
      setInvites(await InviteService.list());
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke invitation.');
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      window.prompt('Copy this link:', text);
    }
  };

  const DocCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    blurb: string;
    url?: string;
    updated?: string;
    what: 'rules' | 'roster';
  }> = ({ icon, title, blurb, url, updated, what }) => (
    <div className="p-5 rounded-3xl bg-[#111712] border border-white/10 space-y-3">
      <div className="flex items-center gap-2 text-[#22c55e]">
        {icon}
        <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
      </div>
      <p className="text-xs text-gray-400">{blurb}</p>
      <div className="text-[11px] font-mono text-gray-500">Last updated: {fmt(updated)}</div>
      <div className="flex flex-wrap gap-2">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Google Doc</span>
          </a>
        ) : (
          <span className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
            Not created yet
          </span>
        )}
        <button
          type="button"
          onClick={() => handleSync(what)}
          disabled={syncing !== null}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing === what ? 'animate-spin' : ''}`} />
          <span>{url ? 'Refresh now' : 'Create now'}</span>
        </button>
        {url && (
          <button
            type="button"
            onClick={() => copy(`doc-${what}`, url)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedKey === `doc-${what}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy link</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
              Google Docs • Invitations
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              Live Docs &amp; Invites
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              The rules document and the live registered-players roster (grouped by Knockout and League, by player name)
              update automatically. Invite players to any open Knockout or League by link or email.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Live docs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocCard
          icon={<FileText className="w-4 h-4" />}
          title="Official Match Rules"
          blurb="All Knockout and League rules, with the Chuka crest and eFootball logo. Edit the MatchRules sheet and this document follows automatically."
          url={docs?.rulesUrl}
          updated={docs?.rulesUpdatedAt}
          what="rules"
        />
        <DocCard
          icon={<Users className="w-4 h-4" />}
          title="Live Registered Players"
          blurb="Every Knockout and League with its registered players by name, marked Verified or Pending. Refreshes on every registration and verification."
          url={docs?.rosterUrl}
          updated={docs?.rosterUpdatedAt}
          what="roster"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => handleSync('all')}
          disabled={syncing !== null}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {syncing === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Rebuild both documents</span>
        </button>
      </div>

      {/* Invite form */}
      <form onSubmit={handleCreate} className="p-5 rounded-3xl bg-[#111712] border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#22c55e]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Invite players</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-[11px] text-gray-400 space-y-1">
            <span className="font-bold uppercase tracking-wider">Knockout or League</span>
            <select
              value={compId}
              onChange={(e) => setCompId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-sm text-white"
            >
              {knockouts.length > 0 && (
                <optgroup label="Knockout tournaments">
                  {knockouts.map((c) => (
                    <option key={c.CompetitionID} value={c.CompetitionID}>
                      {c.Name} ({c.Status})
                    </option>
                  ))}
                </optgroup>
              )}
              {leagues.length > 0 && (
                <optgroup label="Leagues">
                  {leagues.map((c) => (
                    <option key={c.CompetitionID} value={c.CompetitionID}>
                      {c.Name} ({c.Status})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label className="block text-[11px] text-gray-400 space-y-1">
            <span className="font-bold uppercase tracking-wider">Email (optional — sends a personal invite)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-sm text-white placeholder-gray-600"
            />
          </label>

          <label className="block text-[11px] text-gray-400 space-y-1">
            <span className="font-bold uppercase tracking-wider">Expires after (days)</span>
            <input
              type="number"
              min={1}
              max={90}
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value) || 14)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-sm text-white"
            />
          </label>

          <label className="block text-[11px] text-gray-400 space-y-1">
            <span className="font-bold uppercase tracking-wider">Max uses (0 = unlimited, link invites)</span>
            <input
              type="number"
              min={0}
              value={email.trim() ? 1 : maxUses}
              disabled={Boolean(email.trim())}
              onChange={(e) => setMaxUses(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-sm text-white disabled:opacity-50"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={creating || !compId}
          className="px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          <span>{email.trim() ? 'Send email invitation' : 'Create invite link'}</span>
        </button>

        {lastLink && (
          <div className="p-3 rounded-2xl bg-black/40 border border-[#22c55e]/30 space-y-2">
            <input
              readOnly
              value={lastLink.link}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-gray-300"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy('last', lastLink.link)}
                className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'last' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'last' ? 'Copied' : 'Copy link'}</span>
              </button>
              <a
                href={buildWhatsAppInviteUrl(lastLink.comp || {}, lastLink.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </form>

      {/* Invites table */}
      <div className="p-5 rounded-3xl bg-[#111712] border border-white/10">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3">All invitations ({invites.length})</h3>
        {invites.length === 0 ? (
          <p className="text-xs text-gray-500">No invitations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                  <th className="py-2 pr-3">Competition</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Sent to</th>
                  <th className="py-2 pr-3">By</th>
                  <th className="py-2 pr-3">Uses</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.InviteID} className="border-b border-white/5 text-gray-300">
                    <td className="py-2 pr-3 font-semibold text-white">{inv.CompetitionName}</td>
                    <td className="py-2 pr-3">{inv.InviteType}</td>
                    <td className="py-2 pr-3">{inv.InvitedEmail || 'Anyone with link'}</td>
                    <td className="py-2 pr-3">{inv.InvitedByName || '—'}</td>
                    <td className="py-2 pr-3 font-mono">
                      {inv.Uses}
                      {inv.MaxUses > 0 ? ` / ${inv.MaxUses}` : ''}
                    </td>
                    <td className="py-2 pr-3">{fmt(inv.ExpiresAt)}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${stateStyle[inv.State] || ''}`}>
                        {inv.State}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          title="Copy link"
                          onClick={() => copy(inv.InviteID, buildInviteLink(inv.Code))}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                        >
                          {copiedKey === inv.InviteID ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {inv.State === 'ACTIVE' && (
                          <button
                            type="button"
                            title="Revoke"
                            onClick={() => handleRevoke(inv)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
