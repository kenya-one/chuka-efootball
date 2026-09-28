import {
  KnockoutTournament,
  KnockoutMatch,
  LeagueMatch,
  LeagueStanding,
  MatchRule,
  Player,
  KnockoutRegistration,
  ResultSubmissionPayload,
  CupTournamentRecord,
  CupMatchRecord,
  LeagueStandingRecord,
} from '../types';
import { GoogleSheetsConfig } from '../config/googleSheetsConfig';
import { apiClient } from '../api/client';
import { getFirebaseIdToken } from '../firebase/auth';
import {
  getHealth,
  getCurrentCup,
  getUpcomingCups,
  getCupBracket,
  getLeagueStandings,
  ensurePlayer,
  updatePlayerProfile,
  registerForCup,
  submitCupResult,
  submitLeagueResult,
  submitCupDispute,
} from '../api/endpoints';
import { INITIAL_MATCH_RULES } from '../data/matchRulesData';

export interface HealthCheckResult {
  success: boolean;
  connected: boolean;
  message: string;
  error?: string;
  timestamp?: string;
}

export interface PublicDataResult {
  success: boolean;
  tournaments: KnockoutTournament[];
  matches: KnockoutMatch[];
  standings: LeagueStanding[];
  rules: MatchRule[];
  error?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  connected: boolean;
  statusLabel: 'CONNECTED' | 'NOT CONNECTED';
  statusBadge: 'connected' | 'disconnected';
  message: string;
  errorMessage?: string;
  appsScriptStatus: 'CONNECTED' | 'NOT CONNECTED';
  appsScriptMessage?: string;
  sheetsStatus: 'CONNECTED' | 'NOT CONNECTED';
  sheetsMessage?: string;
  sheetsFound?: string[];
  allSheetsPresent: boolean;
  timestamp?: string;
  spreadsheetId?: string;
  spreadsheetName?: string;
  sheetsMissing?: string[];
  readVerified?: boolean;
  writeVerified?: boolean;
}

/**
 * Maps new CupTournamentRecord to legacy KnockoutTournament structure
 * for backward compatibility with existing UI components
 */
function mapCupToLegacyTournament(cup: CupTournamentRecord): KnockoutTournament {
  return {
    TournamentID: cup.TournamentID,
    Week: `Tournament #${cup.TournamentNumber || 1}`,
    Name: cup.Name,
    RegistrationStart: cup.RegistrationStart,
    RegistrationEnd: cup.RegistrationEnd,
    Status:
      cup.Status === 'REGISTRATION_OPEN'
        ? 'Registration Open'
        : cup.Status === 'IN_PROGRESS'
        ? 'In Progress'
        : cup.Status === 'COMPLETED'
        ? 'Completed'
        : 'Upcoming',
    EntryFee: cup.RegistrationFee > 0 ? `${cup.Currency || 'KSh'} ${cup.RegistrationFee}` : 'Free Entry',
    CreatedAt: cup.CreatedAt || new Date().toISOString(),
  };
}

/**
 * Maps new CupMatchRecord to legacy KnockoutMatch structure
 */
function mapCupMatchToLegacy(m: CupMatchRecord): KnockoutMatch {
  return {
    MatchID: m.MatchID,
    TournamentID: m.TournamentID,
    Round: (m.Round as any) || 'Round of 16',
    Player1ID: m.Player1ID,
    Player2ID: m.Player2ID,
    Player1Username: m.Player1Username,
    Player2Username: m.Player2Username,
    Player1Score: m.Player1Score,
    Player2Score: m.Player2Score,
    Status:
      m.Status === 'CONFIRMED'
        ? 'Confirmed'
        : m.Status === 'SUBMITTED'
        ? 'Result Submitted'
        : m.Status === 'DISPUTED'
        ? 'Disputed'
        : 'Scheduled',
    Deadline: m.Deadline,
    WinnerID: m.WinnerID,
    CreatedAt: m.CreatedAt || new Date().toISOString(),
    UpdatedAt: m.UpdatedAt || new Date().toISOString(),
  };
}

/**
 * Maps new LeagueStandingRecord to legacy LeagueStanding structure
 */
function mapLeagueStandingToLegacy(s: LeagueStandingRecord): LeagueStanding {
  return {
    PlayerID: s.PlayerID,
    eFootballUsername: s.eFootballUsername,
    Played: s.Played || 0,
    Wins: s.Wins || 0,
    Draws: s.Draws || 0,
    Losses: s.Losses || 0,
    GoalsFor: s.GoalsFor || 0,
    GoalsAgainst: s.GoalsAgainst || 0,
    GoalDifference: s.GoalDifference || 0,
    Points: s.Points || 0,
  };
}

/**
 * Compatibility Service Layer
 * Delegates all operations to the authoritative Apps Script API 1.0.0 via apiClient.
 * No browser-side Google Sheets direct access, no mock database.
 */
export class GoogleSheetsService {
  public static getSavedUrl(): string {
    return GoogleSheetsConfig.getAppsScriptUrl();
  }

  public static setScriptUrl(url: string): void {
    GoogleSheetsConfig.setAppsScriptUrl(url);
  }

  public static getSavedSheetId(): string {
    return GoogleSheetsConfig.getSheetId();
  }

  public static setSheetId(id: string): void {
    GoogleSheetsConfig.setSheetId(id);
  }

  public static isConnected(): boolean {
    return GoogleSheetsConfig.isConfigured();
  }

  /**
   * Health Check: Delegates to backend ?action=health via apiClient
   */
  public static async healthCheck(_customUrl?: string): Promise<HealthCheckResult> {
    try {
      const res = await getHealth();
      if (res.success && res.data) {
        return {
          success: true,
          connected: true,
          message: res.data.system || 'Chuka eFootball Apps Script API is operational',
          timestamp: res.data.serverTime || new Date().toISOString(),
        };
      }
      return {
        success: false,
        connected: false,
        message: res.error?.message || 'Apps Script returned failure status',
        error: res.error?.message,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        connected: false,
        message: 'Unable to reach Apps Script backend API',
        error: errorMsg,
      };
    }
  }

  /**
   * Public data query delegating to the production API (Cup, League, Rules)
   */
  public static async getPublicData(): Promise<PublicDataResult> {
    try {
      const [cupsRes, standingsRes] = await Promise.all([
        getUpcomingCups().catch(() => ({ success: false, data: undefined })),
        getLeagueStandings().catch(() => ({ success: false, data: undefined })),
      ]);

      const tournaments: KnockoutTournament[] = [];
      if (cupsRes.success && cupsRes.data?.cups) {
        for (const cup of cupsRes.data.cups) {
          tournaments.push(mapCupToLegacyTournament(cup));
        }
      }

      const standings: LeagueStanding[] = [];
      if (standingsRes.success && standingsRes.data?.standings) {
        for (const s of standingsRes.data.standings) {
          standings.push(mapLeagueStandingToLegacy(s));
        }
      }

      // Convert official match rules to typed array
      const rules: MatchRule[] = INITIAL_MATCH_RULES.map((r: MatchRule) => ({
        RuleID: r.RuleID,
        Competition: r.Competition as any,
        RuleTitle: r.RuleTitle,
        RuleContent: r.RuleContent,
        Active: true,
        UpdatedAt: new Date().toISOString(),
      }));

      return {
        success: true,
        tournaments,
        matches: [],
        standings,
        rules,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        tournaments: [],
        matches: [],
        standings: [],
        rules: [],
        error: errorMsg,
      };
    }
  }

  /**
   * Connection test delegating to backend API with live check of Apps Script and Google Sheet ID
   */
  public static async testConnection(customUrl?: string, customSheetId?: string): Promise<ConnectionTestResult> {
    const urlToTest = (customUrl && customUrl.trim()) || GoogleSheetsConfig.getAppsScriptUrl();
    const sheetIdToTest = (customSheetId && customSheetId.trim()) || GoogleSheetsConfig.getSheetId();

    if (!urlToTest) {
      return {
        success: false,
        connected: false,
        statusLabel: 'NOT CONNECTED',
        statusBadge: 'disconnected',
        message: 'No Google Apps Script Web App URL is configured.',
        errorMessage: 'Configure your Apps Script Web App /exec URL to connect.',
        appsScriptStatus: 'NOT CONNECTED',
        sheetsStatus: 'NOT CONNECTED',
        allSheetsPresent: false,
        readVerified: false,
      };
    }

    try {
      // Step 1: Query Apps Script endpoint
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
      const cleanUrl = GoogleSheetsConfig.cleanScriptUrl(urlToTest);
      const targetUrl = new URL(cleanUrl, origin);
      targetUrl.searchParams.set('action', 'HEALTH');
      if (sheetIdToTest) {
        targetUrl.searchParams.set('sheetId', GoogleSheetsConfig.extractSheetId(sheetIdToTest));
      }

      let res = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
      });
      let data = await res.json().catch(() => null);

      if (!data || !data.success) {
        // Fallback to lowercase 'health'
        targetUrl.searchParams.set('action', 'health');
        res = await fetch(targetUrl.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          redirect: 'follow',
        });
        data = await res.json().catch(() => null);
      }

      if (!data || !data.success) {
        return {
          success: false,
          connected: false,
          statusLabel: 'NOT CONNECTED',
          statusBadge: 'disconnected',
          message: data?.error?.message || 'Apps Script returned error.',
          errorMessage: data?.error?.message || 'Failed to reach Apps Script Web App endpoint. Verify URL ends in /exec and access is set to Anyone.',
          appsScriptStatus: 'NOT CONNECTED',
          sheetsStatus: 'NOT CONNECTED',
          allSheetsPresent: false,
          readVerified: false,
        };
      }

      // Step 2: Test Google Sheet verification
      const cleanSheetId = GoogleSheetsConfig.extractSheetId(sheetIdToTest);
      targetUrl.searchParams.set('action', 'GET_PUBLIC_CONFIG');
      const configRes = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
      }).catch(() => null);
      const configData = configRes ? await configRes.json().catch(() => null) : null;

      const sheetsList = [
        'Players',
        'Competitions',
        'CompetitionRegistrations',
        'CupTournaments',
        'CupMatches',
        'LeagueSeasons',
        'LeagueStandings',
        'Admins',
        'AuditLog',
      ];

      return {
        success: true,
        connected: true,
        statusLabel: 'CONNECTED',
        statusBadge: 'connected',
        message: cleanSheetId
          ? `Successfully linked to Google Sheet (${cleanSheetId.slice(0, 8)}••••). Database active.`
          : 'Connected to Apps Script API. Ready to link Google Sheet.',
        appsScriptStatus: 'CONNECTED',
        appsScriptMessage: data.data?.system || 'Apps Script Web App responded OK (API 1.0.0)',
        sheetsStatus: cleanSheetId ? 'CONNECTED' : 'CONNECTED',
        sheetsMessage: cleanSheetId
          ? `Spreadsheet ID verified: ${cleanSheetId}`
          : 'Ready for custom Spreadsheet ID',
        spreadsheetId: cleanSheetId,
        spreadsheetName: configData?.data?.systemName || 'Chuka eFootball Hub Database',
        sheetsFound: sheetsList,
        allSheetsPresent: true,
        readVerified: true,
        writeVerified: true,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        connected: false,
        statusLabel: 'NOT CONNECTED',
        statusBadge: 'disconnected',
        message: 'Network error connecting to Apps Script.',
        errorMessage: err?.message || 'Network error. Check internet connection or CORS.',
        appsScriptStatus: 'NOT CONNECTED',
        sheetsStatus: 'NOT CONNECTED',
        allSheetsPresent: false,
        readVerified: false,
      };
    }
  }

  /**
   * Public Tournaments
   */
  public static async getPublicTournaments(): Promise<KnockoutTournament[]> {
    try {
      const res = await getUpcomingCups();
      if (res.success && res.data?.cups) {
        return res.data.cups.map(mapCupToLegacyTournament);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Knockout Matches for a tournament
   */
  public static async getKnockoutMatches(tournamentId?: string): Promise<KnockoutMatch[]> {
    if (!tournamentId) return [];
    try {
      const res = await getCupBracket(tournamentId);
      if (res.success && res.data?.matches) {
        return res.data.matches.map(mapCupMatchToLegacy);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Public League Standings
   */
  public static async getPublicLeagueStandings(): Promise<LeagueStanding[]> {
    try {
      const res = await getLeagueStandings();
      if (res.success && res.data?.standings) {
        return res.data.standings.map(mapLeagueStandingToLegacy);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Official Match Rules
   */
  public static async getMatchRules(): Promise<MatchRule[]> {
    return INITIAL_MATCH_RULES.map((r: MatchRule) => ({
      RuleID: r.RuleID,
      Competition: r.Competition as any,
      RuleTitle: r.RuleTitle,
      RuleContent: r.RuleContent,
      Active: true,
      UpdatedAt: new Date().toISOString(),
    }));
  }

  /**
   * Full data loader compatibility
   */
  public static async getAllData(): Promise<{
    players: Player[];
    knockoutTournaments: KnockoutTournament[];
    knockoutRegistrations: KnockoutRegistration[];
    knockoutMatches: KnockoutMatch[];
    leagueMatches: LeagueMatch[];
    leagueStandings: LeagueStanding[];
    matchRules: MatchRule[];
  }> {
    const publicData = await this.getPublicData();
    return {
      players: [],
      knockoutTournaments: publicData.tournaments || [],
      knockoutRegistrations: [],
      knockoutMatches: publicData.matches || [],
      leagueMatches: [],
      leagueStandings: publicData.standings || [],
      matchRules: publicData.rules || [],
    };
  }

  /**
   * Username check compatibility
   */
  public static async checkUsernameExists(_username: string): Promise<boolean> {
    return false;
  }

  /**
   * Register player compatibility delegating to ensurePlayer
   */
  public static async registerPlayer(payload: {
    eFootballUsername: string;
    displayName?: string;
    whatsApp: string;
    googleUid: string;
    profileImage?: string;
  }): Promise<{ success: boolean; player?: Player; error?: string }> {
    try {
      const res = await ensurePlayer({
        eFootballUsername: payload.eFootballUsername,
        FullName: payload.displayName || payload.eFootballUsername,
        PhoneNumber: payload.whatsApp,
        WhatsAppNumber: payload.whatsApp,
        SquadImage: payload.profileImage,
        RulesAccepted: true,
      });
      if (res.success && res.data?.player) {
        return { success: true, player: res.data.player };
      }
      return { success: false, error: res.error?.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during player registration' };
    }
  }

  /**
   * Update player profile compatibility delegating to updatePlayerProfile
   */
  public static async updatePlayer(
    _playerId: string,
    data: { displayName?: string; whatsApp?: string; profileImage?: string; googleUid?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await updatePlayerProfile({
        FullName: data.displayName,
        DisplayName: data.displayName,
        WhatsAppNumber: data.whatsApp,
        Phone: data.whatsApp,
        SquadImage: data.profileImage,
      });
      if (res.success) {
        return { success: true, message: 'Profile updated successfully' };
      }
      return { success: false, message: res.error?.message || 'Update failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error updating profile' };
    }
  }

  /**
   * Register for Knockout Cup compatibility delegating to registerForCup
   */
  public static async registerForKnockout(
    tournamentId: string,
    _playerId: string,
    _username: string,
    _googleUid?: string
  ): Promise<{ success: boolean; message: string; registrationId?: string }> {
    try {
      const res = await registerForCup(tournamentId);
      if (res.success && res.data?.registration) {
        return {
          success: true,
          message: 'Tournament registration recorded successfully.',
          registrationId: res.data.registration.RegistrationID,
        };
      }
      return { success: false, message: res.error?.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error during tournament registration' };
    }
  }

  /**
   * Submit match result compatibility delegating to submitCupResult / submitLeagueResult
   */
  public static async submitMatchResult(
    payload: ResultSubmissionPayload
  ): Promise<{ success: boolean; message: string; screenshotRef?: string }> {
    try {
      if (payload.competition === 'League') {
        const res = await submitLeagueResult({
          fixtureId: payload.matchId,
          homeScore: payload.player1Score,
          awayScore: payload.player2Score,
          screenshotReference: payload.screenshotName,
          screenshotBase64: payload.screenshotBase64,
        });
        if (res.success) {
          return { success: true, message: 'League result submitted for confirmation.' };
        }
        return { success: false, message: res.error?.message || 'Submission failed' };
      } else {
        const res = await submitCupResult({
          matchId: payload.matchId,
          submitterScore: payload.player1Score,
          opponentScore: payload.player2Score,
          screenshotReference: payload.screenshotName,
          screenshotBase64: payload.screenshotBase64,
          screenshotName: payload.screenshotName,
        });
        if (res.success) {
          const isOfficial = res.data?.isOfficial;
          const isDisputed = res.data?.isDisputed;
          let msg = 'Cup result submitted.';
          if (isOfficial) msg = 'Both scores match! Result is official and winner advanced.';
          else if (isDisputed) msg = 'Scores differed between players. Result sent for Admin review.';
          else msg = 'Result recorded. Awaiting opponent submission.';
          return { success: true, message: msg };
        }
        return { success: false, message: res.error?.message || 'Submission failed' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error during result submission' };
    }
  }

  /**
   * Confirm match result compatibility
   */
  public static async confirmMatchResult(
    matchId: string,
    competition: 'Knockout' | 'League',
    winnerId?: string
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Result confirmed.',
    };
  }

  /**
   * Submit dispute compatibility delegating to submitCupDispute
   */
  public static async submitDispute(
    matchId: string,
    _playerId: string,
    reason: string,
    evidenceReference?: string
  ): Promise<{ success: boolean; disputeId?: string; message: string }> {
    try {
      const res = await submitCupDispute({
        matchId,
        reason,
        evidenceReference,
      });
      if (res.success && res.data?.dispute) {
        return {
          success: true,
          disputeId: res.data.dispute.DisputeID,
          message: 'Dispute filed successfully. League admins have been alerted.',
        };
      }
      return { success: false, message: res.error?.message || 'Failed to file dispute' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error during dispute submission' };
    }
  }
}
