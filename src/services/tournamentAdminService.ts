import {
  Competition,
  CompetitionRegistration,
  PaymentRecord,
  Player,
  MatchFixture,
  AnnouncementRecord,
  AdminDashboardOverview,
  LeagueStanding,
  WhatsAppGroup,
  Dispute,
} from '../types';
import { apiPost, apiGet } from '../api/endpoints';
import { getFirebaseIdToken } from '../firebase/auth';

/**
 * Authoritative production rules configuration
 */
export const KNOCKOUT_RULES = {
  MinPlayers: 1024,
  MaxPlayers: 1024,
  EntryFee: 20,
  PrizeAmount: 1000,
  PaymentTill: '6817863',
  Currency: 'KES',
};

export const LEAGUE_RULES = {
  MinPlayers: 500,
  MaxPlayers: 2048,
  EntryFee: 50,
  PrizeAmount: 5000,
  PaymentTill: '6817863',
  Currency: 'KES',
};

/**
 * Gets the current real application URL for invitations and links
 */
export function getAppUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://chuka-efootball-hub.web.app';
}

/**
 * TournamentAdminService
 * Production-only authoritative service communicating with Google Sheets + Apps Script backend.
 * Zero demo, mock, seed, or localStorage competition databases.
 */
export class TournamentAdminService {
  /**
   * 1. DASHBOARD OVERVIEW: Live Stats from Database
   */
  public static async getOverviewStats(): Promise<AdminDashboardOverview> {
    try {
      const res = await apiPost<any>('GET_ADMIN_DASHBOARD', {}, true);
      if (res.success && res.data) {
        return {
          totalPlayers: res.data.totalPlayers || res.data.TotalRegisteredPlayers || 0,
          activeTournaments: res.data.activeTournaments || res.data.ActiveTournaments || 0,
          activeLeagues: res.data.activeLeagues || res.data.ActiveLeagues || 0,
          totalRegistrations: res.data.totalRegistrations || res.data.TotalRegistrations || 0,
          pendingPayments: res.data.pendingPayments || res.data.PendingPayments || 0,
          upcomingMatches: res.data.upcomingMatches || res.data.UpcomingMatches || 0,
          recentlyRecordedResults: res.data.recentlyRecordedResults || res.data.RecentlyRecordedResults || 0,
        };
      }
    } catch (err) {
      console.warn('[TournamentAdminService] GET_ADMIN_DASHBOARD failed, calculating from live records:', err);
    }

    // Direct live records aggregation
    const [competitions, registrations, payments, fixtures, players] = await Promise.all([
      this.getCompetitions().catch(() => []),
      this.getRegistrations().catch(() => []),
      this.getPayments().catch(() => []),
      this.getFixtures().catch(() => []),
      this.getPlayers().catch(() => []),
    ]);

    const activeTournaments = competitions.filter(
      (c) => c.CompetitionType === 'KNOCKOUT' && (c.Status === 'OPEN' || c.Status === 'IN_PROGRESS')
    ).length;

    const activeLeagues = competitions.filter(
      (c) => c.CompetitionType === 'LEAGUE' && (c.Status === 'OPEN' || c.Status === 'IN_PROGRESS')
    ).length;

    const pendingPayments = payments.filter((p) => p.Status === 'PENDING').length;
    const upcomingMatches = fixtures.filter((f) => f.Status === 'SCHEDULED' || f.Status === 'IN_PROGRESS').length;
    const recentlyRecordedResults = fixtures.filter((f) => f.Status === 'COMPLETED').length;

    return {
      totalPlayers: players.length,
      activeTournaments,
      activeLeagues,
      totalRegistrations: registrations.length,
      pendingPayments,
      upcomingMatches,
      recentlyRecordedResults,
    };
  }

  /**
   * 2. COMPETITIONS (TOURNAMENTS & LEAGUES)
   * RegisteredCount is strictly derived from approved registrations, never form submissions.
   */
  public static async getCompetitions(typeFilter?: 'KNOCKOUT' | 'LEAGUE'): Promise<Competition[]> {
    let comps: Competition[] = [];

    try {
      const res = await apiPost<{ competitions: Competition[] }>('getCompetitions', {}, true);
      if (res.success && Array.isArray(res.data?.competitions)) {
        comps = res.data.competitions;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] getCompetitions request failed:', err);
    }

    // If backend returned empty or errored, fetch via admin proxy or return honest empty list
    if (comps.length === 0) {
      try {
        const fallbackRes = await apiGet<{ competitions: Competition[] }>('getCompetitions', {}, true);
        if (fallbackRes.success && Array.isArray(fallbackRes.data?.competitions)) {
          comps = fallbackRes.data.competitions;
        }
      } catch {}
    }

    // Load registrations to calculate authoritative APPROVED counts for each competition
    let allRegistrations: CompetitionRegistration[] = [];
    try {
      allRegistrations = await this.getRegistrations();
    } catch {}

    const enriched = comps.map((comp) => {
      const isKnockout = comp.CompetitionType === 'KNOCKOUT';
      const isLeague = comp.CompetitionType === 'LEAGUE';

      // Rule defaults if not explicitly set in database
      const minPlayers = comp.MinPlayers || (isKnockout ? KNOCKOUT_RULES.MinPlayers : LEAGUE_RULES.MinPlayers);
      const maxPlayers = comp.MaxPlayers || (isKnockout ? KNOCKOUT_RULES.MaxPlayers : LEAGUE_RULES.MaxPlayers);
      const entryFee = comp.EntryFee !== undefined ? comp.EntryFee : (isKnockout ? KNOCKOUT_RULES.EntryFee : LEAGUE_RULES.EntryFee);
      const prizeAmount = comp.PrizeAmount || (isKnockout ? KNOCKOUT_RULES.PrizeAmount : LEAGUE_RULES.PrizeAmount);
      const paymentTill = comp.PaymentTill || '6817863';

      // Calculate approved vs pending from live registrations
      const compRegs = allRegistrations.filter((r) => r.CompetitionID === comp.CompetitionID);
      const approvedCount = compRegs.filter((r) => r.Status === 'APPROVED' || r.PaymentStatus === 'PAID').length;
      const pendingCount = compRegs.filter((r) => r.Status === 'PENDING' || r.PaymentStatus === 'PENDING').length;

      // Status derivation
      let bracketStatus: Competition['BracketStatus'] = 'REGISTRATION_OPEN';
      if (isKnockout) {
        if (approvedCount < minPlayers) {
          bracketStatus = 'MINIMUM_NOT_REACHED';
        } else if (approvedCount >= minPlayers && comp.Status !== 'IN_PROGRESS' && comp.Status !== 'COMPLETED') {
          bracketStatus = 'READY_FOR_BRACKET';
        } else if (comp.Status === 'IN_PROGRESS') {
          bracketStatus = 'IN_PROGRESS';
        } else if (comp.Status === 'COMPLETED') {
          bracketStatus = 'COMPLETED';
        }
      }

      const isFull = approvedCount >= maxPlayers;
      const status = isFull && comp.Status === 'OPEN' ? 'FULL' : comp.Status;

      return {
        ...comp,
        MinPlayers: minPlayers,
        MaxPlayers: maxPlayers,
        EntryFee: entryFee,
        PrizeAmount: prizeAmount,
        PaymentTill: paymentTill,
        RegisteredCount: approvedCount, // Crucial: derived from approved registrations
        ApprovedCount: approvedCount,
        PendingCount: pendingCount,
        RemainingCapacity: Math.max(0, maxPlayers - approvedCount),
        IsRegistrationOpen: status === 'OPEN' && !isFull,
        BracketStatus: bracketStatus,
        Status: status,
      };
    });

    if (typeFilter) {
      return enriched.filter((c) => c.CompetitionType === typeFilter);
    }
    return enriched;
  }

  public static async createKnockout(data: {
    name: string;
    description: string;
    date: string;
    startTime: string;
    registrationDeadline: string;
    registrationFee?: number;
    profileImageUrl?: string;
    profileImageFileId?: string;
    maxPlayers?: number;
    prizeAmount?: number;
    rulesDocumentUrl?: string;
    registeredPlayersDocUrl?: string;
    bracketDocUrl?: string;
  }): Promise<Competition> {
    const id = `CUP-WK-${Date.now().toString().slice(-4)}`;
    const fee = data.registrationFee !== undefined ? Number(data.registrationFee) : KNOCKOUT_RULES.EntryFee;

    const newComp: Competition = {
      CompetitionID: id,
      Name: data.name.trim(),
      Description: data.description.trim(),
      CompetitionType: 'KNOCKOUT',
      Format: 'Single Elimination',
      Division: 'OPEN',
      MinPlayers: KNOCKOUT_RULES.MinPlayers,
      MaxPlayers: KNOCKOUT_RULES.MaxPlayers,
      EntryFee: fee,
      Currency: KNOCKOUT_RULES.Currency,
      PaymentTill: KNOCKOUT_RULES.PaymentTill,
      RegistrationStart: new Date().toISOString(),
      RegistrationEnd: data.registrationDeadline || new Date(Date.now() + 86400000 * 3).toISOString(),
      RegistrationDeadline: data.registrationDeadline || new Date(Date.now() + 86400000 * 3).toISOString(),
      StartDate: data.date || new Date(Date.now() + 86400000 * 4).toISOString(),
      EndDate: new Date(Date.now() + 86400000 * 6).toISOString(),
      StartTime: data.startTime || '14:00 EAT',
      Status: 'OPEN',
      PrizeAmount: data.prizeAmount || KNOCKOUT_RULES.PrizeAmount,
      RegisteredCount: 0,
      ApprovedCount: 0,
      PendingCount: 0,
      RemainingCapacity: KNOCKOUT_RULES.MaxPlayers,
      IsRegistrationOpen: true,
      BracketStatus: 'MINIMUM_NOT_REACHED',
      ProfileImageURL: data.profileImageUrl || '',
      ProfileImageFileID: data.profileImageFileId || '',
      RulesDocumentURL: data.rulesDocumentUrl || '',
      RegisteredPlayersDocumentURL: data.registeredPlayersDocUrl || '',
      KnockoutBracketDocumentURL: data.bracketDocUrl || '',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    const res = await apiPost<{ success: boolean; competition?: Competition }>(
      'createCompetition',
      { competition: newComp },
      true
    );

    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to save competition to database.');
    }

    return newComp;
  }

  public static async createLeague(data: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    startTime?: string;
    registrationFee?: number;
    profileImageUrl?: string;
    profileImageFileId?: string;
    minPlayers?: number;
    maxPlayers?: number;
    prizeAmount?: number;
    rulesDocumentUrl?: string;
    registeredPlayersDocUrl?: string;
    fixturesDocUrl?: string;
    standingsDocUrl?: string;
    finalResultsDocUrl?: string;
  }): Promise<Competition> {
    const id = `LEAGUE-S${Date.now().toString().slice(-4)}`;
    const fee = data.registrationFee !== undefined ? Number(data.registrationFee) : LEAGUE_RULES.EntryFee;

    const newLeague: Competition = {
      CompetitionID: id,
      Name: data.name.trim(),
      Description: data.description.trim(),
      CompetitionType: 'LEAGUE',
      Format: 'Round Robin',
      Division: 'OPEN',
      MinPlayers: data.minPlayers || LEAGUE_RULES.MinPlayers,
      MaxPlayers: data.maxPlayers || LEAGUE_RULES.MaxPlayers,
      EntryFee: fee,
      Currency: LEAGUE_RULES.Currency,
      PaymentTill: LEAGUE_RULES.PaymentTill,
      RegistrationStart: new Date().toISOString(),
      RegistrationEnd: data.registrationDeadline || new Date(Date.now() + 86400000 * 7).toISOString(),
      RegistrationDeadline: data.registrationDeadline || new Date(Date.now() + 86400000 * 7).toISOString(),
      StartDate: data.startDate || new Date(Date.now() + 86400000 * 8).toISOString(),
      EndDate: data.endDate || new Date(Date.now() + 86400000 * 40).toISOString(),
      StartTime: data.startTime || '16:00 EAT',
      Status: 'OPEN',
      PrizeAmount: data.prizeAmount || LEAGUE_RULES.PrizeAmount,
      RegisteredCount: 0,
      ApprovedCount: 0,
      PendingCount: 0,
      RemainingCapacity: data.maxPlayers || LEAGUE_RULES.MaxPlayers,
      IsRegistrationOpen: true,
      ProfileImageURL: data.profileImageUrl || '',
      ProfileImageFileID: data.profileImageFileId || '',
      RulesDocumentURL: data.rulesDocumentUrl || '',
      RegisteredPlayersDocumentURL: data.registeredPlayersDocUrl || '',
      LeagueFixturesDocumentURL: data.fixturesDocUrl || '',
      StandingsDocumentURL: data.standingsDocUrl || '',
      FinalResultsDocumentURL: data.finalResultsDocUrl || '',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    const res = await apiPost<{ success: boolean; competition?: Competition }>(
      'createCompetition',
      { competition: newLeague },
      true
    );

    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to save league to database.');
    }

    return newLeague;
  }

  public static async updateCompetition(
    competitionId: string,
    updates: Partial<Competition>
  ): Promise<void> {
    const res = await apiPost('updateCompetition', { competitionId, updates }, true);
    if (!res.success) {
      throw new Error(res.error?.message || `Failed to update competition ${competitionId}`);
    }
  }

  /**
   * 3. COMPETITION PROFILE PICTURE UPLOAD VIA GOOGLE DRIVE
   */
  public static async uploadCompetitionImage(
    competitionId: string,
    fileData: string,
    mimeType: string,
    fileName: string
  ): Promise<{ url: string; fileId: string }> {
    const res = await apiPost<{ url: string; fileId: string }>(
      'uploadCompetitionImage',
      {
        competitionId,
        fileData,
        mimeType,
        fileName,
      },
      true
    );

    if (res.success && res.data?.url) {
      return res.data;
    }
    throw new Error(res.error?.message || 'Failed to upload competition image to Google Drive.');
  }

  public static async removeCompetitionImage(competitionId: string): Promise<void> {
    await apiPost('deleteCompetitionImage', { competitionId }, true);
  }

  /**
   * 4. PLAYERS DIRECTORY (FROM USERS SHEET)
   * Strictly reads real registered players from Users sheet. No fallback or demo players.
   */
  public static async getPlayers(searchQuery?: string): Promise<Player[]> {
    try {
      const res = await apiGet<any>('admin-players', searchQuery ? { search: searchQuery } : {}, true);
      if (res.success && Array.isArray(res.data?.players)) {
        return res.data.players;
      }
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch players from backend:', err);
    }
    return [];
  }

  /**
   * 5. REGISTRATION MANAGEMENT
   * Submissions start as PENDING and do NOT increment RegisteredCount.
   */
  public static async getRegistrations(competitionId?: string): Promise<CompetitionRegistration[]> {
    try {
      const res = await apiGet<any>('getRegistrations', competitionId ? { competitionId } : {}, true);
      if (res.success && Array.isArray(res.data?.registrations)) {
        const regs: CompetitionRegistration[] = res.data.registrations;
        if (competitionId) {
          return regs.filter((r) => r.CompetitionID === competitionId);
        }
        return regs;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch registrations:', err);
    }
    return [];
  }

  public static async confirmRegistration(registrationId: string): Promise<void> {
    const token = await getFirebaseIdToken(false);
    if (!token) throw new Error('Authentication required.');

    const res = await apiPost('confirmRegistration', { registrationId }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to approve registration.');
    }
  }

  public static async rejectRegistration(registrationId: string): Promise<void> {
    const token = await getFirebaseIdToken(false);
    if (!token) throw new Error('Authentication required.');

    const res = await apiPost('rejectRegistration', { registrationId }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to reject registration.');
    }
  }

  /**
   * Player registration submission:
   * Sets status to PENDING. Does NOT increment count until approved.
   */
  public static async registerPlayerForCompetition(
    competitionId: string,
    player: Player,
    paymentReference?: string,
    referralCode?: string,
    useFreeTicket = false
  ): Promise<CompetitionRegistration> {
    // 1. Fetch live competition rules
    const comps = await this.getCompetitions();
    const comp = comps.find((c) => c.CompetitionID === competitionId);
    if (!comp) throw new Error('Competition not found.');

    // 2. Capacity check based solely on APPROVED registrations
    if (comp.ApprovedCount !== undefined && comp.ApprovedCount >= comp.MaxPlayers) {
      throw new Error(
        comp.CompetitionType === 'LEAGUE'
          ? `League registration is full — ${comp.MaxPlayers} / ${comp.MaxPlayers} players.`
          : `Competition is at full capacity (${comp.MaxPlayers} approved players).`
      );
    }

    // 3. Duplicate registration check against live records
    const existingRegs = await this.getRegistrations(competitionId);
    const alreadyRegistered = existingRegs.some(
      (r) =>
        (r.PlayerID === player.PlayerID || r.GoogleUID === player.FirebaseUID) &&
        r.Status !== 'REJECTED' &&
        r.Status !== 'CANCELLED'
    );
    if (alreadyRegistered) {
      throw new Error('You have already registered for this competition.');
    }

    // 4. Send to backend with initial PENDING status
    const res = await apiPost<{ success: boolean; registration?: CompetitionRegistration; message?: string }>(
      'registerCompetition',
      {
        competitionId,
        playerId: player.PlayerID,
        efootballUsername: player.eFootballUsername,
        paymentRef: paymentReference || 'PENDING',
        referralCode: referralCode || '',
        useFreeTicket,
      },
      true
    );

    if (!res.success) {
      throw new Error(res.error?.message || res.data?.message || 'Failed to submit registration.');
    }

    const regId = res.data?.registration?.RegistrationID || `REG-${Date.now().toString().slice(-6)}`;
    const payId = res.data?.registration?.PaymentID || `PAY-${Date.now().toString().slice(-6)}`;

    return {
      RegistrationID: regId,
      CompetitionID: competitionId,
      PlayerID: player.PlayerID,
      GoogleUID: player.FirebaseUID || player.PlayerID,
      eFootballUsername: player.eFootballUsername,
      Status: 'PENDING', // PENDING payment approval
      PaymentStatus: comp.EntryFee > 0 ? 'PENDING' : 'NOT_REQUIRED',
      PaymentID: payId,
      RegisteredAt: new Date().toISOString(),
      CompetitionName: comp.Name,
      CompetitionType: comp.CompetitionType,
      EntryFee: comp.EntryFee,
      Currency: comp.Currency,
    };
  }

  /**
   * 6. PAYMENTS MANAGEMENT
   */
  public static async getPayments(competitionId?: string): Promise<PaymentRecord[]> {
    try {
      const res = await apiPost<{ payments: PaymentRecord[] }>('getPayments', { competitionId }, true);
      if (res.success && Array.isArray(res.data?.payments)) {
        return res.data.payments;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch payments:', err);
    }
    return [];
  }

  public static async confirmPayment(paymentId: string): Promise<void> {
    const res = await apiPost('confirmPayment', { paymentId }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to confirm payment.');
    }
  }

  public static async rejectPayment(paymentId: string, reason?: string): Promise<void> {
    const res = await apiPost('rejectPayment', { paymentId, reason }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to reject payment.');
    }
  }

  /**
   * 7. FIXTURES & RESULTS
   */
  public static async getFixtures(competitionId?: string): Promise<MatchFixture[]> {
    try {
      const res = await apiPost<{ fixtures: MatchFixture[] }>('getFixtures', { competitionId }, true);
      if (res.success && Array.isArray(res.data?.fixtures)) {
        if (competitionId) {
          return res.data.fixtures.filter((f) => f.CompetitionID === competitionId);
        }
        return res.data.fixtures;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch fixtures:', err);
    }
    return [];
  }

  public static async createFixture(data: {
    competitionId: string;
    round: string;
    player1Id: string;
    player1Name: string;
    player2Id: string;
    player2Name: string;
    matchDate?: string;
  }): Promise<MatchFixture> {
    const fixture: MatchFixture = {
      FixtureID: `FIX-${Date.now().toString().slice(-6)}`,
      CompetitionID: data.competitionId,
      CompetitionType: 'KNOCKOUT',
      Round: data.round,
      Player1ID: data.player1Id,
      Player1Name: data.player1Name,
      Player2ID: data.player2Id,
      Player2Name: data.player2Name,
      Player1Score: null,
      Player2Score: null,
      Status: 'SCHEDULED',
      MatchDate: data.matchDate || new Date(Date.now() + 86400000).toISOString(),
      ResultPublished: false,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };

    const res = await apiPost('createFixture', { fixture }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to create fixture.');
    }
    return fixture;
  }

  public static async recordMatchResult(
    fixtureId: string,
    player1Score: number,
    player2Score: number,
    winnerId?: string
  ): Promise<void> {
    let resolvedWinner = winnerId;
    if (!resolvedWinner) {
      if (player1Score > player2Score) resolvedWinner = 'PLAYER_1';
      else if (player2Score > player1Score) resolvedWinner = 'PLAYER_2';
    }

    const res = await apiPost(
      'recordMatchResult',
      {
        fixtureId,
        player1Score,
        player2Score,
        winnerId: resolvedWinner,
      },
      true
    );

    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to record match score.');
    }
  }

  /**
   * 8. AUTOMATED 1,024-PLAYER KNOCKOUT BRACKET GENERATION
   * Server-authoritative: Strictly executed on Google Sheets backend with LockService.
   * Unlocks strictly when exactly 1,024 players are APPROVED with confirmed payment.
   */
  public static async generate1024KnockoutBracket(competitionId: string): Promise<{
    success: boolean;
    matchCount: number;
    message: string;
  }> {
    const res = await apiPost<{ success: boolean; message?: string; matchCount?: number }>(
      'generateKnockoutBracket',
      { competitionId },
      true
    );

    if (!res.success) {
      throw new Error(res.error?.message || res.data?.message || 'Failed to generate 1,024-player knockout bracket.');
    }

    return {
      success: true,
      matchCount: res.data?.matchCount || 512,
      message: res.data?.message || 'Successfully generated 512 Round of 1024 matches on backend.',
    };
  }

  /**
   * 9. DYNAMIC LEAGUE FIXTURES GENERATION
   * Server-authoritative: Dynamically creates pairings for approved players (500 to 2,048 range).
   * Preserves completed matches and existing results.
   */
  public static async generateDynamicLeagueFixtures(competitionId: string): Promise<{
    success: boolean;
    createdCount: number;
    totalFixtures: number;
    message: string;
  }> {
    const res = await apiPost<{
      success: boolean;
      createdCount?: number;
      totalFixtures?: number;
      message?: string;
    }>(
      'generateLeagueFixtures',
      { competitionId },
      true
    );

    if (!res.success) {
      throw new Error(res.error?.message || res.data?.message || 'Failed to generate league fixtures.');
    }

    return {
      success: true,
      createdCount: res.data?.createdCount || 0,
      totalFixtures: res.data?.totalFixtures || 0,
      message: res.data?.message || 'League fixtures updated successfully.',
    };
  }

  /**
   * 10. LEAGUE STANDINGS
   * Calculated dynamically from authoritative completed results.
   * Win = 3, Draw = 1, Loss = 0.
   */
  public static async calculateLeagueStandings(competitionId: string): Promise<LeagueStanding[]> {
    const fixtures = await this.getFixtures(competitionId);
    const completed = fixtures.filter(
      (f) => f.Status === 'COMPLETED' && f.Player1Score !== null && f.Player2Score !== null
    );

    if (completed.length === 0) {
      return [];
    }

    const standingsMap: Record<string, LeagueStanding> = {};

    const ensureStanding = (playerId: string, username: string) => {
      if (!standingsMap[playerId]) {
        standingsMap[playerId] = {
          PlayerID: playerId,
          eFootballUsername: username || playerId,
          Played: 0,
          Wins: 0,
          Draws: 0,
          Losses: 0,
          GoalsFor: 0,
          GoalsAgainst: 0,
          GoalDifference: 0,
          Points: 0,
        };
      }
    };

    for (const match of completed) {
      const p1Id = match.Player1ID;
      const p2Id = match.Player2ID;
      ensureStanding(p1Id, match.Player1Name);
      ensureStanding(p2Id, match.Player2Name);

      const s1 = match.Player1Score!;
      const s2 = match.Player2Score!;

      standingsMap[p1Id].Played += 1;
      standingsMap[p2Id].Played += 1;
      standingsMap[p1Id].GoalsFor += s1;
      standingsMap[p1Id].GoalsAgainst += s2;
      standingsMap[p2Id].GoalsFor += s2;
      standingsMap[p2Id].GoalsAgainst += s1;

      if (s1 > s2) {
        standingsMap[p1Id].Wins += 1;
        standingsMap[p1Id].Points += 3;
        standingsMap[p2Id].Losses += 1;
      } else if (s2 > s1) {
        standingsMap[p2Id].Wins += 1;
        standingsMap[p2Id].Points += 3;
        standingsMap[p1Id].Losses += 1;
      } else {
        standingsMap[p1Id].Draws += 1;
        standingsMap[p2Id].Draws += 1;
        standingsMap[p1Id].Points += 1;
        standingsMap[p2Id].Points += 1;
      }
    }

    const list = Object.values(standingsMap).map((s) => ({
      ...s,
      GoalDifference: s.GoalsFor - s.GoalsAgainst,
    }));

    // Sort by Points (desc), GoalDifference (desc), GoalsFor (desc)
    list.sort((a, b) => {
      if (b.Points !== a.Points) return b.Points - a.Points;
      if (b.GoalDifference !== a.GoalDifference) return b.GoalDifference - a.GoalDifference;
      return b.GoalsFor - a.GoalsFor;
    });

    return list;
  }

  /**
   * 11. ANNOUNCEMENTS
   */
  public static async getAnnouncements(competitionId?: string): Promise<AnnouncementRecord[]> {
    try {
      const res = await apiPost<{ announcements: AnnouncementRecord[] }>('getAnnouncements', { competitionId }, true);
      if (res.success && Array.isArray(res.data?.announcements)) {
        return res.data.announcements;
      }
    } catch {}
    return [];
  }

  public static async createAnnouncement(data: {
    title: string;
    message: string;
    type?: 'INFO' | 'WARNING' | 'CHAMPION' | 'NOTICE';
    competitionId?: string;
    competitionName?: string;
  }): Promise<AnnouncementRecord> {
    const item: AnnouncementRecord = {
      AnnouncementID: `ANN-${Date.now().toString().slice(-6)}`,
      CompetitionID: data.competitionId,
      CompetitionName: data.competitionName,
      Title: data.title.trim(),
      Message: data.message.trim(),
      Type: data.type || 'INFO',
      CreatedBy: 'admin',
      CreatedAt: new Date().toISOString(),
    };

    await apiPost('createAnnouncement', { announcement: item }, true);
    return item;
  }

  public static async deleteAnnouncement(announcementId: string): Promise<void> {
    await apiPost('deleteAnnouncement', { announcementId }, true);
  }

  /**
   * Aliases for bracket and fixture generation
   */
  public static async generateKnockoutBracket(competitionId: string) {
    return this.generate1024KnockoutBracket(competitionId);
  }

  public static async generateLeagueFixtures(competitionId: string) {
    return this.generateDynamicLeagueFixtures(competitionId);
  }

  /**
   * 12. WHATSAPP INVITATION GENERATOR
   * Formats official invitation copy with real application link and Till 6817863.
   */
  public static generateWhatsAppInvitation(competition: Competition): string {
    const appUrl = getAppUrl();
    const isKnockout = competition.CompetitionType === 'KNOCKOUT';
    const entryFee = competition.EntryFee || (isKnockout ? 20 : 50);

    if (isKnockout) {
      return `Chuka eFootballHub Weekly Knockout is now open.

Entry: KSh ${entryFee}
Pay via Till Number: 6817863

After payment, return to Chuka eFootballHub and click I Have Paid.

Register here: ${appUrl}`;
    }

    return `Chuka eFootballHub Premier League is now open.

Entry: KSh ${entryFee}
Pay via Till Number: 6817863

After payment, return to Chuka eFootballHub and click I Have Paid.

Register here: ${appUrl}`;
  }

  /**
   * 13. WHATSAPP GROUPS MANAGEMENT
   */
  public static async getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    try {
      const res = await apiPost<{ groups: WhatsAppGroup[] }>('getWhatsAppGroups', {}, false);
      if (res.success && Array.isArray(res.data?.groups)) {
        return res.data.groups;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch WhatsApp groups:', err);
    }
    return [];
  }

  public static async updateWhatsAppGroups(groups: WhatsAppGroup[]): Promise<void> {
    const res = await apiPost('updateWhatsAppGroups', { groups }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to update WhatsApp groups on backend.');
    }
  }

  /**
   * 14. MATCH RESULT SUBMISSION & CONFIRMATION
   */
  public static async submitMatchResult(
    fixtureId: string,
    player1Score: number,
    player2Score: number,
    winnerId?: string
  ): Promise<void> {
    const res = await apiPost('submitMatchResult', {
      fixtureId,
      player1Score,
      player2Score,
      winnerId,
    }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to submit match score.');
    }
  }

  public static async confirmMatchResult(fixtureId: string): Promise<void> {
    const res = await apiPost('confirmMatchResult', { fixtureId }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to confirm match score.');
    }
  }

  /**
   * 15. DISPUTES
   */
  public static async getDisputes(competitionId?: string): Promise<Dispute[]> {
    try {
      const res = await apiPost<{ disputes: Dispute[] }>('getAdminDisputes', { competitionId }, true);
      if (res.success && Array.isArray(res.data?.disputes)) {
        return res.data.disputes;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch disputes:', err);
    }
    return [];
  }

  public static async submitDispute(data: {
    fixtureId: string;
    competitionId?: string;
    reason: string;
    evidenceUrl?: string;
  }): Promise<void> {
    const res = await apiPost('submitDispute', data, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to submit match dispute.');
    }
  }

  public static async resolveDispute(
    disputeId: string,
    decision: string,
    winnerId?: string,
    player1Score?: number,
    player2Score?: number
  ): Promise<void> {
    const res = await apiPost('resolveDispute', {
      disputeId,
      decision,
      winnerId,
      player1Score,
      player2Score,
    }, true);
    if (!res.success) {
      throw new Error(res.error?.message || 'Failed to resolve dispute.');
    }
  }

  /**
   * 16. AUDIT LOGS
   */
  public static async getAuditLogs(limit: number = 100): Promise<any[]> {
    try {
      const res = await apiPost<{ logs: any[] }>('getAuditLogs', { limit }, true);
      if (res.success && Array.isArray(res.data?.logs)) {
        return res.data.logs;
      }
    } catch (err) {
      console.warn('[TournamentAdminService] Failed to fetch audit logs:', err);
    }
    return [];
  }
}
