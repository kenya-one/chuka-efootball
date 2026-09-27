import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  Shield,
  Eye,
  ExternalLink,
  X,
  Filter,
} from 'lucide-react';
import { Player, AdminPlayersResponse } from '../../types';
import { PlayerApiService } from '../../api/client';
import { AVAILABLE_DIVISIONS, getDivisionBadgeColor } from '../../config/divisionConfig';
import { useAdmin } from '../../auth/AdminProvider';

export const AdminPlayersView: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [players, setPlayers] = useState<Player[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  // Selected player for detail modal
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PlayerApiService.getAdminPlayers({
        search: searchTerm,
        status: statusFilter,
        division: divisionFilter,
        verified: verifiedFilter,
      });

      if (res.success && res.data) {
        setPlayers(res.data.players || []);
        setCounts(res.data.counts || { total: 0, pending: 0, active: 0, suspended: 0 });
      } else {
        setError(res.error?.message || 'Failed to load player directory.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPlayers();
    }
  }, [isAdmin, statusFilter, divisionFilter, verifiedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers();
  };

  const handleVerify = async (playerId: string) => {
    setActionInProgress(playerId);
    try {
      const res = await PlayerApiService.adminVerifyPlayer(playerId);
      if (res.success && res.data?.player) {
        setPlayers((prev) =>
          prev.map((p) => (p.PlayerID === playerId ? { ...p, ...res.data!.player } : p))
        );
        if (selectedPlayer?.PlayerID === playerId) {
          setSelectedPlayer((prev) => (prev ? { ...prev, ...res.data!.player } : null));
        }
        // Refresh counts
        fetchPlayers();
      } else {
        alert(res.error?.message || 'Failed to verify player');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error during verification');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSuspend = async (playerId: string) => {
    if (!window.confirm(`Are you sure you want to suspend player ${playerId}?`)) return;

    setActionInProgress(playerId);
    try {
      const res = await PlayerApiService.adminSuspendPlayer(playerId);
      if (res.success && res.data?.player) {
        setPlayers((prev) =>
          prev.map((p) => (p.PlayerID === playerId ? { ...p, ...res.data!.player } : p))
        );
        if (selectedPlayer?.PlayerID === playerId) {
          setSelectedPlayer((prev) => (prev ? { ...prev, ...res.data!.player } : null));
        }
        // Refresh counts
        fetchPlayers();
      } else {
        alert(res.error?.message || 'Failed to suspend player');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error during suspension');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111712] border border-white/10 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
            Total Players
          </span>
          <div className="text-2xl font-black text-white font-mono">{counts.total}</div>
        </div>

        <div className="bg-[#111712] border border-amber-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">
            Pending Verification
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">{counts.pending}</div>
        </div>

        <div className="bg-[#111712] border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">
            Active Players
          </span>
          <div className="text-2xl font-black text-[#22c55e] font-mono">{counts.active}</div>
        </div>

        <div className="bg-[#111712] border border-red-500/20 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] text-red-400 uppercase tracking-wider font-semibold">
            Suspended
          </span>
          <div className="text-2xl font-black text-red-400 font-mono">{counts.suspended}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111712] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by gamer tag, name, phone, email, or PlayerID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-xs transition-colors placeholder:text-gray-500"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#22c55e] focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>

            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#22c55e] focus:outline-none cursor-pointer"
            >
              <option value="">All Divisions</option>
              {AVAILABLE_DIVISIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#1ea850] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Search</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3">Player</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Division</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Verified</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {loading ? 'Loading player directory...' : 'No players found matching current filters.'}
                  </td>
                </tr>
              ) : (
                players.map((p) => {
                  const isAct = String(p.Status).toUpperCase() === 'ACTIVE';
                  const isSusp = String(p.Status).toUpperCase() === 'SUSPENDED';

                  return (
                    <tr key={p.PlayerID} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {p.ProfilePhotoURL ? (
                              <img
                                src={p.ProfilePhotoURL}
                                alt={p.eFootballUsername}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-white tracking-wider">
                              {p.eFootballUsername}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {p.DisplayName || 'No display name'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-gray-300 font-mono text-[11px]">
                        <div>{p.Phone || p.WhatsApp || '—'}</div>
                        <div className="text-gray-500 text-[10px]">{p.Email || ''}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getDivisionBadgeColor(p.Division)}`}>
                          {p.Division || 'OPEN'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSusp
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : isAct
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {p.Status || 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {p.Verified ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            No
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPlayer(p)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="View Player Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!p.Verified && (
                            <button
                              type="button"
                              disabled={actionInProgress === p.PlayerID}
                              onClick={() => handleVerify(p.PlayerID)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Verify
                            </button>
                          )}

                          {!isSusp ? (
                            <button
                              type="button"
                              disabled={actionInProgress === p.PlayerID}
                              onClick={() => handleSuspend(p.PlayerID)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionInProgress === p.PlayerID}
                              onClick={() => handleVerify(p.PlayerID)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111712] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                    {selectedPlayer.eFootballUsername}
                  </h3>
                  <p className="text-[11px] text-gray-400">ID: {selectedPlayer.PlayerID}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photos Showcase */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Profile Photo
                </span>
                <div className="aspect-square rounded-xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
                  {selectedPlayer.ProfilePhotoURL ? (
                    <img
                      src={selectedPlayer.ProfilePhotoURL}
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-xs">No Photo</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Squad Screenshot
                </span>
                <div className="aspect-square rounded-xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
                  {selectedPlayer.SquadScreenshotURL ? (
                    <a
                      href={selectedPlayer.SquadScreenshotURL}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-full block group relative"
                    >
                      <img
                        src={selectedPlayer.SquadScreenshotURL}
                        alt="Squad"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Enlarge
                      </div>
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs">No Screenshot</span>
                  )}
                </div>
              </div>
            </div>

            {/* Info details */}
            <div className="space-y-2 text-xs bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between">
                <span className="text-gray-400">Display Name:</span>
                <span className="text-white font-medium">{selectedPlayer.DisplayName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Class / Student ID:</span>
                <span className="text-white font-mono">{selectedPlayer.class_id || (selectedPlayer as any).ClassID || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Primary Phone:</span>
                <span className="text-white font-mono">{selectedPlayer.Phone || selectedPlayer.PhoneNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">WhatsApp Number:</span>
                <span className="text-emerald-400 font-mono">{selectedPlayer.WhatsApp || selectedPlayer.WhatsAppNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email Address:</span>
                <span className="text-white font-mono">{selectedPlayer.Email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Division:</span>
                <span className="text-white font-semibold">{selectedPlayer.Division || 'OPEN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white font-semibold uppercase">{selectedPlayer.Status || 'PENDING'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registered:</span>
                <span className="text-white font-mono">{selectedPlayer.CreatedAt ? new Date(selectedPlayer.CreatedAt).toLocaleString() : '—'}</span>
              </div>
            </div>

            {/* Competition Registration History & Payment Status */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">
                Competition History &amp; Payment Status
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white text-[11px]">Weekly Knockout Cup #1</div>
                    <div className="text-[10px] text-gray-400">Fee: KSh 20 • Status: Confirmed</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#22c55e]/20 text-[#22c55e]">
                    PAID / VERIFIED
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white text-[11px]">Premier League Season 1</div>
                    <div className="text-[10px] text-gray-400">Activation: KSh 50 • Status: Active</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#22c55e]/20 text-[#22c55e]">
                    PAID / VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
              {!selectedPlayer.Verified && (
                <button
                  type="button"
                  disabled={actionInProgress === selectedPlayer.PlayerID}
                  onClick={() => handleVerify(selectedPlayer.PlayerID)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Verify &amp; Activate
                </button>
              )}

              {String(selectedPlayer.Status).toUpperCase() !== 'SUSPENDED' ? (
                <button
                  type="button"
                  disabled={actionInProgress === selectedPlayer.PlayerID}
                  onClick={() => handleSuspend(selectedPlayer.PlayerID)}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Suspend Player
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionInProgress === selectedPlayer.PlayerID}
                  onClick={() => handleVerify(selectedPlayer.PlayerID)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Reactivate Player
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
