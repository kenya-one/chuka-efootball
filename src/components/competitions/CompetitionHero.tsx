import React from 'react';
import {
  Trophy,
  Award,
  Users,
  Coins,
  Calendar,
  Clock,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  CreditCard,
  Copy,
  FileText,
  Table,
  ScrollText,
  BadgeCheck,
} from 'lucide-react';
import { Competition, CompetitionRegistration } from '../../types';
import { ShareButton } from '../common/ShareButton';
import { GazetteKind } from '../common/GazetteDocumentViewer';
import {
  formatShortDate,
  getCompetitionShareText,
  getCompetitionShareUrl,
} from '../../utils/competitionUtils';

/* ------------------------------------------------------------------ */
/* Competition selector (only rendered when there is more than one)    */
/* ------------------------------------------------------------------ */

export const CompetitionSelector: React.FC<{
  competitions: Competition[];
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ competitions, selectedId, onSelect }) => {
  if (competitions.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {competitions.map((c) => (
        <button
          key={c.CompetitionID}
          type="button"
          onClick={() => onSelect(c.CompetitionID)}
          className={`shrink-0 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
            c.CompetitionID === selectedId
              ? 'bg-[#22c55e] text-black border-[#22c55e]'
              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
          }`}
        >
          {c.Name}
        </button>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Hero card                                                           */
/* ------------------------------------------------------------------ */

interface HeroProps {
  competition: Competition;
  verifiedCount: number;
  unverifiedCount: number;
  minPlayers: number;
  maxPlayers: number;
  entryFee: number;
  prize: number;
  till: string;
  isGuest: boolean;
  userRegistration?: CompetitionRegistration | null;
  registerLabel: string;
  activeLabel: string;
  isFull?: boolean;
  copiedTill: boolean;
  onCopyTill: () => void;
  onRegister: () => void;
}

export const CompetitionHero: React.FC<HeroProps> = ({
  competition: c,
  verifiedCount,
  unverifiedCount,
  minPlayers,
  maxPlayers,
  entryFee,
  prize,
  till,
  isGuest,
  userRegistration,
  registerLabel,
  activeLabel,
  isFull,
  copiedTill,
  onCopyTill,
  onRegister,
}) => {
  const isLeague = String(c.CompetitionType).toUpperCase() === 'LEAGUE';
  const img = c.ProfileImageURL || c.ImageURL;
  const fillPct = Math.min(100, (verifiedCount / maxPlayers) * 100);
  const minPct = Math.min(100, (minPlayers / maxPlayers) * 100);
  const reachedMin = verifiedCount >= minPlayers;
  const status = isFull ? 'REGISTRATION FULL' : String(c.Status || '').replace('_', ' ');

  return (
    <div className="rounded-3xl overflow-hidden border border-[#22c55e]/30 bg-[#0e150f] shadow-xl shadow-black/40">
      {/* Banner */}
      <div className="relative px-5 sm:px-7 pt-5 pb-14 bg-gradient-to-br from-[#14532d] via-[#0f2a1a] to-[#0b1510]">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(34,197,94,.55), transparent 45%)' }} />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-black/40 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-[#22c55e]">
              {isLeague ? 'League' : 'Knockout Tournament'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#22c55e] text-black text-[10px] font-extrabold uppercase tracking-wider">{status}</span>
          </div>
          <ShareButton
            title={c.Name}
            text={getCompetitionShareText(c, verifiedCount)}
            url={getCompetitionShareUrl(c)}
            label="Share"
          />
        </div>
      </div>

      {/* Identity row overlapping the banner */}
      <div className="relative z-10 px-5 sm:px-7 -mt-10 flex items-end gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-[#0e150f] bg-black shrink-0 shadow-lg flex items-center justify-center">
          {img ? (
            <img src={img} alt={c.Name} className="w-full h-full object-cover" />
          ) : isLeague ? (
            <Award className="w-9 h-9 text-[#22c55e]/60" />
          ) : (
            <Trophy className="w-9 h-9 text-[#22c55e]/60" />
          )}
        </div>
        <div className="pb-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight truncate">{c.Name}</h2>
          <div className="text-[11px] font-mono text-gray-500">{c.CompetitionID}</div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        {c.Description && <p className="text-sm text-gray-400 leading-relaxed">{c.Description}</p>}

        {/* Key facts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { icon: Coins, label: 'Entry Fee', value: entryFee > 0 ? `KSh ${entryFee}` : 'Free', tone: 'text-white' },
            { icon: Award, label: 'Winner Prize', value: `KSh ${prize.toLocaleString()}`, tone: 'text-amber-300' },
            { icon: Calendar, label: 'Starts', value: formatShortDate(c.StartDate), tone: 'text-white' },
            { icon: Clock, label: 'Registration Ends', value: formatShortDate(c.RegistrationEnd), tone: 'text-white' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-black/30 border border-white/5 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                <s.icon className="w-3 h-3 text-[#22c55e]" /> {s.label}
              </div>
              <div className={`mt-1 text-sm font-bold font-mono ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Players progress */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-gray-300 font-semibold">
              <Users className="w-3.5 h-3.5 text-[#22c55e]" /> Verified players
            </span>
            <span className="font-mono font-bold text-white">
              {verifiedCount.toLocaleString()} / {maxPlayers.toLocaleString()}
              <span className="text-gray-500 font-normal"> · min {minPlayers.toLocaleString()}</span>
            </span>
          </div>
          <div className="relative w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div className={`h-full transition-all duration-500 ${reachedMin ? 'bg-gradient-to-r from-[#22c55e] to-emerald-400' : 'bg-amber-400'}`} style={{ width: `${fillPct}%` }} />
            {minPct < 100 && <div className="absolute top-0 bottom-0 w-0.5 bg-white/70" style={{ left: `${minPct}%` }} title="Minimum to proceed" />}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-3 text-gray-400">
              <span className="inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-[#22c55e]" /> {verifiedCount} verified</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-amber-300" /> {unverifiedCount} unverified</span>
            </span>
            <span className="font-semibold text-amber-300">
              {reachedMin
                ? isLeague ? 'Minimum reached — league can start.' : 'Minimum reached — bracket can be drawn.'
                : `${(minPlayers - verifiedCount).toLocaleString()} more verified players needed to start`}
            </span>
          </div>
        </div>

        {/* Player action */}
        <div>
          {isGuest ? (
            <div className="text-xs text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">Sign in with Google to register.</div>
          ) : userRegistration ? (
            <div className="space-y-1.5">
              {userRegistration.Status === 'APPROVED' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {activeLabel}
                </div>
              ) : userRegistration.Status === 'PENDING' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold">
                  <FileCheck className="w-4 h-4" /> UNVERIFIED — PAYMENT AWAITING APPROVAL
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" /> Registration {userRegistration.Status}
                </div>
              )}
              <p className="text-[11px] text-gray-500">
                {userRegistration.Status === 'PENDING' ? `The administration is checking your payment to Till ${till}.` : 'You are on the verified list.'}
              </p>
            </div>
          ) : isFull ? (
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
              Registration is full — {maxPlayers.toLocaleString()} / {maxPlayers.toLocaleString()} players.
            </div>
          ) : (
            <button type="button" onClick={onRegister} className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#22c55e]/20">
              {registerLabel}
            </button>
          )}
        </div>

        {/* Payment strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">M-Pesa · Buy Goods</div>
              <div className="text-sm font-bold text-white font-mono">
                Pay KSh {entryFee} to Till <span className="text-amber-400 font-black text-base">{till}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onCopyTill} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer">
            <Copy className="w-3.5 h-3.5" /> {copiedTill ? 'Copied!' : 'Copy Till'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Documents shelf                                                     */
/* ------------------------------------------------------------------ */

export const CompetitionDocumentsShelf: React.FC<{
  isLeague: boolean;
  onOpen: (kind: GazetteKind) => void;
}> = ({ isLeague, onOpen }) => {
  const docs: { kind: GazetteKind; icon: React.ElementType; title: string; sub: string }[] = [
    { kind: 'rules', icon: ScrollText, title: 'Official Rules', sub: 'Regulations & entry terms' },
    { kind: 'registered', icon: Users, title: 'Register of Entrants', sub: 'Verified & unverified' },
    isLeague
      ? { kind: 'fixtures', icon: Calendar, title: 'League Fixtures', sub: 'Matchday schedule' }
      : { kind: 'bracket', icon: Trophy, title: 'Knockout Bracket', sub: 'Rounds & draw' },
    ...(isLeague ? [{ kind: 'standings' as GazetteKind, icon: Table, title: 'League Standings', sub: 'Live points table' }] : []),
    { kind: 'final', icon: Award, title: 'Final Results', sub: 'Champion & awards' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#22c55e]" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Official Gazette Documents</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {docs.map((d) => (
          <button
            key={d.kind}
            type="button"
            onClick={() => onOpen(d.kind)}
            className="group text-left p-3.5 rounded-2xl bg-[#f7f3e6] hover:bg-[#fffdf5] border border-[#d8cfae] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5"
          >
            <d.icon className="w-5 h-5 text-[#166534]" />
            <div className="mt-2 text-[13px] font-bold text-[#16130d] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{d.title}</div>
            <div className="text-[10px] text-[#5a5442] mt-0.5">{d.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
