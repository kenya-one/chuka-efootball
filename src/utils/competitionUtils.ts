import { Competition, CompetitionRegistration } from '../types';

/** A registration counts as verified once admin approved it or payment is confirmed. */
export const isVerifiedRegistration = (r: Pick<CompetitionRegistration, 'Status' | 'PaymentStatus'>): boolean => {
  const status = String(r.Status || '').toUpperCase();
  const pay = String(r.PaymentStatus || '').toUpperCase();
  return status === 'APPROVED' || pay === 'PAID' || pay === 'CONFIRMED';
};

/** Rejected / cancelled entries are never listed publicly. */
export const isDeadRegistration = (r: Pick<CompetitionRegistration, 'Status'>): boolean => {
  const status = String(r.Status || '').toUpperCase();
  return status === 'REJECTED' || status === 'CANCELLED';
};

export const splitRegistrations = (regs: CompetitionRegistration[]) => {
  const live = regs.filter((r) => !isDeadRegistration(r));
  const verified = live.filter(isVerifiedRegistration);
  const unverified = live.filter((r) => !isVerifiedRegistration(r));
  return { live, verified, unverified };
};

/** Public URL of the app (respects the GitHub Pages base path). */
export const getShareBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const base = (import.meta as any).env?.BASE_URL || '/';
  return `${window.location.origin}${base}`;
};

export const getCompetitionShareUrl = (comp?: Pick<Competition, 'CompetitionType'> | null): string => {
  const type = String(comp?.CompetitionType || '').toUpperCase();
  const hash = type === 'LEAGUE' ? '#league' : type === 'KNOCKOUT' ? '#knockout' : '#competitions';
  return `${getShareBaseUrl()}${hash}`;
};

export const getCompetitionShareText = (comp: Competition, verifiedCount?: number): string => {
  const isLeague = String(comp.CompetitionType).toUpperCase() === 'LEAGUE';
  const fee = comp.EntryFee > 0 ? `${comp.Currency || 'KSh'} ${comp.EntryFee}` : 'Free entry';
  const prize = comp.PrizeAmount ? ` • Prize: KSh ${Number(comp.PrizeAmount).toLocaleString()}` : '';
  const players = verifiedCount !== undefined ? ` • ${verifiedCount.toLocaleString()} verified players` : '';
  return `🏆 ${comp.Name} — Chuka eFootball ${isLeague ? 'League' : 'Tournament'}\nEntry: ${fee}${prize}${players}\nJoin here:`;
};

export const formatLongDate = (value?: string): string => {
  if (!value) return 'To be announced';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatShortDate = (value?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Round names for a single-elimination bracket of `size` players (power of two). */
export const roundName = (playersInRound: number): string => {
  if (playersInRound <= 2) return 'Final';
  if (playersInRound === 4) return 'Semi-Finals';
  if (playersInRound === 8) return 'Quarter-Finals';
  return `Round of ${playersInRound}`;
};

export const buildBracketPlan = (size: number) => {
  const rounds: { name: string; players: number; matches: number }[] = [];
  let n = Math.max(2, size);
  while (n >= 2) {
    rounds.push({ name: roundName(n), players: n, matches: Math.floor(n / 2) });
    n = Math.floor(n / 2);
  }
  return rounds;
};
