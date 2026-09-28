import React, { useState } from 'react';
import { X, User, Shield, Phone, MessageSquare, Calendar, Clock, AlertCircle, Save } from 'lucide-react';
import { Player, ProfileCompletion } from '../../types';
import { updatePlayerProfile } from '../../api/endpoints';
import { normalizePlayerRecord } from '../../auth/PlayerProvider';
import { AVAILABLE_DIVISIONS } from '../../config/divisionConfig';

interface PlayerEditModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedPlayer: Player, completion?: ProfileCompletion) => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  player,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState(player.FullName || player.DisplayName || '');
  const [username, setUsername] = useState(player.eFootballUsername || '');
  const [classId, setClassId] = useState(player.class_id || player.ClassID || '');
  const [phone, setPhone] = useState(player.PhoneNumber || player.Phone || '');
  const [whatsapp, setWhatsapp] = useState(player.WhatsAppNumber || player.WhatsApp || player.PhoneNumber || player.Phone || '');
  const [availableDays, setAvailableDays] = useState(
    Array.isArray(player.AvailableDays) ? player.AvailableDays.join(', ') : player.AvailableDays || 'All Days (Mon - Sun)'
  );
  const [availableTimes, setAvailableTimes] = useState(
    Array.isArray(player.AvailableTimes) ? player.AvailableTimes.join(', ') : player.AvailableTimes || 'Evenings (6:00 PM - 10:00 PM)'
  );
  const [division, setDivision] = useState(player.Division || 'OPEN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanUser = username.trim().toUpperCase();
    const cleanClassId = classId.trim();
    const cleanPhone = phone.trim();
    const cleanWhatsapp = whatsapp.trim() || cleanPhone;

    if (cleanName.length < 2) {
      setError('Full Name must be at least 2 characters.');
      return;
    }
    if (cleanUser.length < 3) {
      setError('eFootball Username must be at least 3 characters.');
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(cleanUser)) {
      setError('Username may only contain letters, numbers, underscores, and hyphens.');
      return;
    }
    if (cleanPhone.length < 7) {
      setError('Please provide a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePlayerProfile({
        FullName: cleanName,
        DisplayName: cleanName,
        eFootballUsername: cleanUser,
        class_id: cleanClassId,
        ClassID: cleanClassId,
        PhoneNumber: cleanPhone,
        Phone: cleanPhone,
        WhatsAppNumber: cleanWhatsapp,
        WhatsApp: cleanWhatsapp,
        AvailableDays: availableDays,
        AvailableTimes: availableTimes,
        Division: division,
      });

      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        onSaved(normalized, res.data.completion);
        onClose();
      } else {
        setError(res.error?.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111712] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Edit Player Profile
              </h3>
              <p className="text-[11px] text-gray-400">Update your gamer tag and contact details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Player ID (Fixed by Backend)
            </label>
            <input
              type="text"
              readOnly
              value={player.PlayerID}
              className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/5 text-gray-500 font-mono text-xs cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label htmlFor="edit-username" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              eFootball Username / Gamer Tag <span className="text-[#22c55e]">*</span>
            </label>
            <div className="relative">
              <input
                id="edit-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm uppercase font-mono tracking-wider transition-colors"
              />
              <Shield className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="edit-fullname" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Full Name <span className="text-[#22c55e]">*</span>
            </label>
            <div className="relative">
              <input
                id="edit-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors"
              />
              <User className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label htmlFor="edit-classid" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Class ID / Admission ID
            </label>
            <div className="relative">
              <input
                id="edit-classid"
                type="text"
                placeholder="e.g. EB3/12345/22"
                value={classId}
                onChange={(e) => setClassId(e.target.value.toUpperCase())}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm font-mono tracking-wider transition-colors placeholder:text-gray-600"
              />
              <Shield className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-phone" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Phone Number <span className="text-[#22c55e]">*</span>
              </label>
              <div className="relative">
                <input
                  id="edit-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors"
                />
                <Phone className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="edit-whatsapp" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                WhatsApp Number <span className="text-[#22c55e]">*</span>
              </label>
              <div className="relative">
                <input
                  id="edit-whatsapp"
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors"
                />
                <MessageSquare className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Match Scheduling Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-available-days" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Available Match Days
              </label>
              <div className="relative">
                <select
                  id="edit-available-days"
                  value={availableDays}
                  onChange={(e) => setAvailableDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-xs transition-colors cursor-pointer"
                >
                  <option value="All Days (Mon - Sun)" className="bg-[#111712]">All Days (Mon - Sun)</option>
                  <option value="Weekdays Only (Mon - Fri)" className="bg-[#111712]">Weekdays Only (Mon - Fri)</option>
                  <option value="Weekends Only (Sat - Sun)" className="bg-[#111712]">Weekends Only (Sat - Sun)</option>
                  <option value="Friday - Sunday" className="bg-[#111712]">Friday - Sunday</option>
                </select>
                <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="edit-available-times" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Preferred Match Times
              </label>
              <div className="relative">
                <select
                  id="edit-available-times"
                  value={availableTimes}
                  onChange={(e) => setAvailableTimes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-xs transition-colors cursor-pointer"
                >
                  <option value="Evenings (6:00 PM - 10:00 PM)" className="bg-[#111712]">Evenings (6:00 PM - 10:00 PM)</option>
                  <option value="Afternoons (1:00 PM - 6:00 PM)" className="bg-[#111712]">Afternoons (1:00 PM - 6:00 PM)</option>
                  <option value="Nights (8:00 PM - Midnight)" className="bg-[#111712]">Nights (8:00 PM - Midnight)</option>
                  <option value="Flexible / Any Time" className="bg-[#111712]">Flexible / Any Time</option>
                </select>
                <Clock className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="edit-division" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Division
            </label>
            <select
              id="edit-division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors cursor-pointer"
            >
              {AVAILABLE_DIVISIONS.map((div) => (
                <option key={div.id} value={div.id} className="bg-[#111712] text-white">
                  {div.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#22c55e] hover:bg-[#1ea850] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
