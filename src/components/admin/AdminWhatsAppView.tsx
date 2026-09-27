import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  RefreshCw,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Link,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { WhatsAppGroup } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';

const DEFAULT_GROUPS: WhatsAppGroup[] = [
  {
    group_id: 'WG-1',
    group_number: 1,
    name: 'Chuka eFootball Community (Freshmen & General)',
    description: 'General community for all Chuka eFootball players, campus freshmen, and friendly casual matchmaking.',
    group_url: '',
    active: true,
  },
  {
    group_id: 'WG-2',
    group_number: 2,
    name: 'Chuka Premier League (Division 1 & Pro Players)',
    description: 'Dedicated channel for active League and top-flight tournament contenders.',
    group_url: '',
    active: true,
  },
  {
    group_id: 'WG-3',
    group_number: 3,
    name: 'Tournament Operations & Match Dispute Helpdesk',
    description: 'Urgent dispute resolution, score confirmation assistance, and tournament announcements.',
    group_url: '',
    active: true,
  },
];

export const AdminWhatsAppView: React.FC = () => {
  const [groups, setGroups] = useState<WhatsAppGroup[]>(DEFAULT_GROUPS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TournamentAdminService.getWhatsAppGroups();
      if (Array.isArray(data) && data.length > 0) {
        // Merge with 3 slots
        const merged = [1, 2, 3].map((slotNum) => {
          const found = data.find((g) => g.group_number === slotNum || g.group_id === `WG-${slotNum}`);
          if (found) return found;
          return DEFAULT_GROUPS[slotNum - 1];
        });
        setGroups(merged);
      } else {
        setGroups(DEFAULT_GROUPS);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load WhatsApp community links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupChange = (slotIndex: number, field: keyof WhatsAppGroup, value: any) => {
    setGroups((prev) => {
      const updated = [...prev];
      updated[slotIndex] = { ...updated[slotIndex], [field]: value };
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    // Validate URLs
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const url = (g.group_url || '').trim();
      if (url) {
        if (!url.startsWith('https://')) {
          setError(`Group ${i + 1} URL must start with https://`);
          setSaving(false);
          return;
        }
        if (
          !url.includes('chat.whatsapp.com') &&
          !url.includes('whatsapp.com') &&
          !url.includes('wa.me')
        ) {
          setError(`Group ${i + 1} URL must be a valid WhatsApp invite or channel URL.`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      await TournamentAdminService.updateWhatsAppGroups(groups);
      setSuccessMsg('WhatsApp groups updated and saved to Google Sheets successfully!');
      await fetchGroups();
    } catch (err: any) {
      setError(err?.message || 'Failed to update WhatsApp groups on backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (slotNum: number, url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedSlot(slotNum);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Community Integration
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">3 Official Group Slots</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              WhatsApp Community Groups
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Configure official WhatsApp group invite URLs. Saved links are stored in Google Sheets and immediately sync to the player portal and landing page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchGroups}
              disabled={loading || saving}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Slots Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {groups.map((group, idx) => {
            const slotNum = idx + 1;
            const isCopied = copiedSlot === slotNum;

            return (
              <div
                key={group.group_id || `slot-${slotNum}`}
                className="bg-[#111712] border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all shadow-xl"
              >
                <div className="space-y-3">
                  {/* Slot Title & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-black text-sm">
                        #{slotNum}
                      </div>
                      <span className="text-xs font-bold text-white uppercase font-mono">
                        Slot {slotNum}
                      </span>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.active !== false}
                        onChange={(e) => handleGroupChange(idx, 'active', e.target.checked)}
                        className="rounded border-gray-700 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 bg-black/40"
                      />
                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                        {group.active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Group Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleGroupChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Chuka eFootball Community"
                      required
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={group.description}
                      onChange={(e) => handleGroupChange(idx, 'description', e.target.value)}
                      placeholder="Brief purpose of this community slot..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Group Invite Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      WhatsApp Invite Link (HTTPS)
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={group.group_url}
                        onChange={(e) => handleGroupChange(idx, 'group_url', e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                      />
                      <Link className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Slot Footer Action buttons */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-1.5">
                    {group.group_url ? (
                      <a
                        href={group.group_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">No URL set</span>
                    )}

                    {group.group_url && (
                      <button
                        type="button"
                        onClick={() => handleCopy(slotNum, group.group_url)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {group.updated_at ? `Updated: ${group.updated_at.slice(0, 10)}` : 'Slot ' + slotNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-6 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#22c55e]/90 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#22c55e]/20 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving to Google Sheets...' : 'Save All WhatsApp Groups'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
