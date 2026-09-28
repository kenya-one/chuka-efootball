import React, { useState } from 'react';
import { User, Shield, Phone, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Calendar, Clock, MessageSquare, BookOpen } from 'lucide-react';
import { Player, ProfileCompletion } from '../../types';
import { ensurePlayer } from '../../api/endpoints';
import { normalizePlayerRecord } from '../../auth/PlayerProvider';
import { AVAILABLE_DIVISIONS, DEFAULT_DIVISION } from '../../config/divisionConfig';

interface PlayerRegistrationCardProps {
  userEmail?: string;
  initialDisplayName?: string;
  onRegistered: (player: Player, completion: ProfileCompletion) => void;
  onViewRules?: () => void;
}

export const PlayerRegistrationCard: React.FC<PlayerRegistrationCardProps> = ({
  userEmail,
  initialDisplayName = '',
  onRegistered,
  onViewRules,
}) => {
  const defaultUser = initialDisplayName
    ? initialDisplayName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().slice(0, 12)
    : userEmail ? userEmail.split('@')[0].replace(/[^A-Za-z0-9]/g, '_').toUpperCase().slice(0, 12) : '';

  const [displayName, setDisplayName] = useState(initialDisplayName || (userEmail ? userEmail.split('@')[0] : ''));
  const [username, setUsername] = useState(defaultUser);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [availableDays, setAvailableDays] = useState('All Days (Mon - Sun)');
  const [availableTimes, setAvailableTimes] = useState('Evenings (6:00 PM - 10:00 PM)');
  const [rulesAccepted, setRulesAccepted] = useState(true);
  const [division, setDivision] = useState(DEFAULT_DIVISION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = displayName.trim();
    const cleanUser = username.trim().toUpperCase();
    const cleanPhone = phone.trim();
    const cleanWhatsapp = (sameAsPhone ? cleanPhone : whatsapp.trim()) || cleanPhone;

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
      setError('Please provide a valid phone number for match coordination.');
      return;
    }
    if (!rulesAccepted) {
      setError('You must accept the official Chuka eFootball League Rules to register.');
      return;
    }

    setLoading(true);
    try {
      const res = await ensurePlayer({
        FullName: cleanName,
        DisplayName: cleanName,
        eFootballUsername: cleanUser,
        PhoneNumber: cleanPhone,
        Phone: cleanPhone,
        WhatsAppNumber: cleanWhatsapp,
        AvailableDays: availableDays,
        AvailableTimes: availableTimes,
        RulesAccepted: rulesAccepted,
        Division: division,
      });

      if (res.success && res.data?.player) {
        const normalized = normalizePlayerRecord(res.data.player);
        onRegistered(normalized, res.data.completion || { percentage: 70, isComplete: true, missingFields: [] });
      } else {
        setError(res.error?.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error during player registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111712] border border-[#22c55e]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Player Onboarding</span>
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
          Complete Your Player Profile
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          Link your eFootball gamer tag to your authenticated Google account to participate in Chuka tournaments and create a new row in Google Sheets.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Linked Google Account Readonly */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Linked Google Account
          </label>
          <input
            type="text"
            readOnly
            value={userEmail || 'Authenticated User'}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-gray-400 font-mono text-xs cursor-not-allowed select-none"
          />
        </div>

        {/* eFootball Gaming Tag */}
        <div>
          <label htmlFor="reg-username" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
            eFootball Username / Gamer Tag <span className="text-[#22c55e]">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-username"
              type="text"
              required
              placeholder="e.g. LAURENCE_WG"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm uppercase font-mono tracking-wider transition-colors placeholder:text-gray-600"
            />
            <Shield className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            This is your public gaming identifier visible on brackets, match fixtures, and tables.
          </span>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="reg-displayname" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
            Full Name <span className="text-[#22c55e]">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-displayname"
              type="text"
              required
              placeholder="Your Full Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors placeholder:text-gray-600"
            />
            <User className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Phone & WhatsApp Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-phone" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Phone Number <span className="text-[#22c55e]">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-phone"
                type="tel"
                required
                placeholder="e.g. +254 712 345678"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors placeholder:text-gray-600"
              />
              <Phone className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="reg-whatsapp" className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                WhatsApp Number <span className="text-[#22c55e]">*</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => {
                    setSameAsPhone(e.target.checked);
                    if (e.target.checked) setWhatsapp(phone);
                  }}
                  className="rounded border-white/20 text-[#22c55e] focus:ring-0"
                />
                <span>Same as phone</span>
              </label>
            </div>
            <div className="relative">
              <input
                id="reg-whatsapp"
                type="tel"
                required
                disabled={sameAsPhone}
                placeholder="e.g. +254 712 345678"
                value={sameAsPhone ? phone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors placeholder:text-gray-600 disabled:opacity-60"
              />
              <MessageSquare className="w-4 h-4 text-gray-500 absolute right-3.5 top-3" />
            </div>
          </div>
        </div>

        {/* Match Scheduling Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-available-days" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Available Match Days
            </label>
            <div className="relative">
              <select
                id="reg-available-days"
                value={availableDays}
                onChange={(e) => setAvailableDays(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-xs transition-colors cursor-pointer"
              >
                <option value="All Days (Mon - Sun)" className="bg-[#111712]">All Days (Mon - Sun)</option>
                <option value="Weekdays Only (Mon - Fri)" className="bg-[#111712]">Weekdays Only (Mon - Fri)</option>
                <option value="Weekends Only (Sat - Sun)" className="bg-[#111712]">Weekends Only (Sat - Sun)</option>
                <option value="Friday - Sunday" className="bg-[#111712]">Friday - Sunday</option>
              </select>
              <Calendar className="w-4 h-4 text-gray-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-available-times" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Preferred Match Times
            </label>
            <div className="relative">
              <select
                id="reg-available-times"
                value={availableTimes}
                onChange={(e) => setAvailableTimes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-xs transition-colors cursor-pointer"
              >
                <option value="Evenings (6:00 PM - 10:00 PM)" className="bg-[#111712]">Evenings (6:00 PM - 10:00 PM)</option>
                <option value="Afternoons (1:00 PM - 6:00 PM)" className="bg-[#111712]">Afternoons (1:00 PM - 6:00 PM)</option>
                <option value="Nights (8:00 PM - Midnight)" className="bg-[#111712]">Nights (8:00 PM - Midnight)</option>
                <option value="Flexible / Any Time" className="bg-[#111712]">Flexible / Any Time</option>
              </select>
              <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Division Selection */}
        <div>
          <label htmlFor="reg-division" className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
            Starting Division
          </label>
          <select
            id="reg-division"
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#22c55e] focus:outline-none text-white text-sm transition-colors cursor-pointer"
          >
            {AVAILABLE_DIVISIONS.map((div) => (
              <option key={div.id} value={div.id} className="bg-[#111712] text-white">
                {div.name} — {div.description}
              </option>
            ))}
          </select>
        </div>

        {/* Rules Agreement Checkbox */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={rulesAccepted}
              onChange={(e) => setRulesAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 text-[#22c55e] focus:ring-0 accent-[#22c55e] cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">
                I accept the Official Chuka eFootball Match Rules &amp; Code of Fair Play <span className="text-[#22c55e]">*</span>
              </span>
              <p className="text-[10px] text-gray-400">
                You agree to abide by fair play rules, punctual scheduling, and match screenshot submissions.
              </p>
              {onViewRules && (
                <button
                  type="button"
                  onClick={onViewRules}
                  className="text-[#22c55e] hover:underline text-[10px] inline-flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Read Official Rules Document</span>
                </button>
              )}
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-[#22c55e] hover:bg-[#1ea850] active:scale-[0.99] text-black font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#22c55e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Creating Player Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
