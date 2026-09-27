import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  Calendar,
  AlertTriangle,
  Info,
  Crown,
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AnnouncementRecord, Competition } from '../../types';
import { TournamentAdminService } from '../../services/tournamentAdminService';

export const AdminAnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFO' | 'WARNING' | 'CHAMPION' | 'NOTICE'>('INFO');
  const [selectedCompId, setSelectedCompId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [anns, comps] = await Promise.all([
        TournamentAdminService.getAnnouncements(),
        TournamentAdminService.getCompetitions(),
      ]);
      setAnnouncements(anns);
      setCompetitions(comps);
    } catch (err: any) {
      setError(err?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const comp = competitions.find((c) => c.CompetitionID === selectedCompId);

      await TournamentAdminService.createAnnouncement({
        title,
        message,
        type,
        competitionId: selectedCompId || undefined,
        competitionName: comp?.Name || undefined,
      });

      setSuccessMsg('Announcement broadcasted successfully to all competitors.');
      setTitle('');
      setMessage('');
      setSelectedCompId('');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await TournamentAdminService.deleteAnnouncement(id);
      setSuccessMsg('Announcement removed.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete announcement.');
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'CHAMPION':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'NOTICE':
        return <Bell className="w-4 h-4 text-sky-400" />;
      default:
        return <Info className="w-4 h-4 text-[#22c55e]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                Official Broadcast System
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-[11px] text-gray-400 font-mono">Community Gazettes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-mono mt-1">
              Tournament Announcements
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Publish official competition updates, tournament kickoffs, crowned champions, deadline notices, and matchday reminders.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-[#22c55e] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading broadcasts...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-[#111712] border border-white/10 rounded-3xl p-12 text-center space-y-2">
          <Megaphone className="w-8 h-8 text-gray-500 mx-auto" />
          <p className="text-sm font-bold text-white uppercase font-mono">No Announcements Published</p>
          <p className="text-xs text-gray-400">Broadcast important tournament news to all competitors.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {announcements.map((a) => (
            <div
              key={a.AnnouncementID}
              className="bg-[#111712] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-3 hover:border-purple-500/40 transition-all shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getTypeIcon(a.Type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{a.Title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          a.Type === 'CHAMPION'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : a.Type === 'WARNING'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-[#22c55e]/20 text-[#22c55e]'
                        }`}
                      >
                        {a.Type}
                      </span>
                    </div>
                    {a.CompetitionName && (
                      <span className="text-[11px] text-gray-400 font-mono">
                        Target Competition: {a.CompetitionName}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(a.AnnouncementID)}
                  className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pl-10">
                {a.Message}
              </p>

              <div className="pl-10 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Published by: {a.CreatedBy}</span>
                <span>{a.CreatedAt ? new Date(a.CreatedAt).toLocaleString() : 'Recent'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#111712] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white uppercase font-mono tracking-wide">
                Broadcast Announcement
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Knockout #1 Registration Open"
                  className="w-full py-2.5 px-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Announcement Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide all relevant matchday details, times, M-Pesa fee requirements..."
                  className="w-full py-2.5 px-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Category Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="INFO">Information</option>
                    <option value="NOTICE">Official Notice</option>
                    <option value="CHAMPION">Champion Crowning</option>
                    <option value="WARNING">Disciplinary / Deadline</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                    Link Competition
                  </label>
                  <select
                    value={selectedCompId}
                    onChange={(e) => setSelectedCompId(e.target.value)}
                    className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">General Community</option>
                    {competitions.map((c) => (
                      <option key={c.CompetitionID} value={c.CompetitionID}>
                        {c.Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
