import { apiPost } from '../api/endpoints';
import { Competition, InvitePreview, InviteRecord, LiveDocsInfo } from '../types';

const PENDING_INVITE_KEY = 'chuka_pending_invite';

/** Public base URL of the deployed PWA (origin + Vite base path), no trailing slash. */
export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const base = (import.meta as any).env?.BASE_URL || '/';
  return (window.location.origin + base).replace(/\/+$/, '');
}

export function buildInviteLink(code: string): string {
  return `${getAppBaseUrl()}/?invite=${encodeURIComponent(code)}`;
}

export function buildWhatsAppInviteUrl(comp: { Name?: string; CompetitionName?: string; EntryFee?: number; PrizeAmount?: number; CompetitionType?: string }, link: string): string {
  const name = comp.Name || comp.CompetitionName || 'a Chuka eFootball competition';
  const kind = String(comp.CompetitionType || '').toUpperCase() === 'LEAGUE' ? 'league' : 'knockout tournament';
  const lines = [
    `🏆 You're invited to join the ${kind}: *${name}* on Chuka eFootball Hub!`,
    comp.EntryFee !== undefined || comp.PrizeAmount
      ? `Entry: KSh ${comp.EntryFee ?? '-'}${comp.PrizeAmount ? ` | Prize: KSh ${Number(comp.PrizeAmount).toLocaleString()}` : ''}`
      : '',
    `Join here: ${link}`,
  ].filter(Boolean);
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
}

/** Remember an invite code from the URL so it survives sign-in. */
export function capturePendingInvite(): string | null {
  try {
    const url = new URL(window.location.href);
    const code = (url.searchParams.get('invite') || '').trim().toUpperCase();
    if (code && /^[A-Z0-9]{4,16}$/.test(code)) {
      localStorage.setItem(PENDING_INVITE_KEY, code);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      return code;
    }
  } catch {
    /* ignore */
  }
  return getPendingInvite();
}

export function getPendingInvite(): string | null {
  try {
    return localStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    /* ignore */
  }
}

export class InviteService {
  static async create(input: {
    competitionId: string;
    email?: string;
    expiryDays?: number;
    maxUses?: number;
  }): Promise<{ invite: InviteRecord; link: string; emailSent: boolean; message: string }> {
    const res = await apiPost<any>('createInvite', { ...input, appUrl: getAppBaseUrl() }, true);
    if (!res.success || !res.data?.invite) {
      throw new Error(res.error?.message || 'Failed to create invitation.');
    }
    const invite: InviteRecord = res.data.invite;
    return {
      invite,
      link: buildInviteLink(invite.Code),
      emailSent: Boolean(res.data.emailSent),
      message: (res.data as any).message || 'Invitation created.',
    };
  }

  static async list(competitionId?: string): Promise<InviteRecord[]> {
    const res = await apiPost<any>('listInvites', { competitionId: competitionId || '' }, true);
    if (!res.success) throw new Error(res.error?.message || 'Failed to load invitations.');
    return (res.data?.invites || []) as InviteRecord[];
  }

  static async revoke(inviteId: string): Promise<void> {
    const res = await apiPost<any>('revokeInvite', { inviteId }, true);
    if (!res.success) throw new Error(res.error?.message || 'Failed to revoke invitation.');
  }

  static async preview(code: string): Promise<InvitePreview> {
    const res = await apiPost<any>('getInvite', { code }, false);
    if (!res.success) throw new Error(res.error?.message || 'Failed to check invitation.');
    return res.data as InvitePreview;
  }

  static async accept(code: string): Promise<{ competition: Competition; alreadyRegistered: boolean; message: string }> {
    const res = await apiPost<any>('acceptInvite', { code }, true);
    if (!res.success || !res.data?.competition) {
      throw new Error(res.error?.message || 'Could not accept invitation.');
    }
    return {
      competition: res.data.competition as Competition,
      alreadyRegistered: Boolean(res.data.alreadyRegistered),
      message: (res.data as any).message || 'Invitation accepted.',
    };
  }
}

export class LiveDocsService {
  static async get(): Promise<LiveDocsInfo> {
    const res = await apiPost<any>('getLiveDocs', {}, false);
    const d = res.data || {};
    return {
      rulesUrl: d.rulesUrl || '',
      rosterUrl: d.rosterUrl || '',
      rulesUpdatedAt: d.rulesUpdatedAt || '',
      rosterUpdatedAt: d.rosterUpdatedAt || '',
    };
  }

  /** Admin: rebuild the Google Docs right now. */
  static async sync(what: 'all' | 'rules' | 'roster' = 'all'): Promise<LiveDocsInfo> {
    const res = await apiPost<any>('syncLiveDocs', { what, appUrl: getAppBaseUrl() }, true);
    if (!res.success) throw new Error(res.error?.message || 'Failed to refresh Google Docs.');
    const d = res.data || {};
    return {
      rulesUrl: d.rulesUrl || '',
      rosterUrl: d.rosterUrl || '',
      rulesUpdatedAt: d.rulesUpdatedAt || '',
      rosterUpdatedAt: d.rosterUpdatedAt || '',
    };
  }
}
