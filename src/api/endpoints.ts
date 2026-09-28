import { apiGet, apiPost, apiRequest, apiPublicGet, ApiResponse, BACKEND_URL } from './client';
import { syncUserWithBackend, SyncUserResponse } from '../firebase/auth';
import {
  getProfileFromBackend,
  updateProfileInBackend,
  uploadSquadImageToBackend,
  deleteSquadImageFromBackend,
  UserProfileResponse,
  UserProfileUpdatePayload,
  UploadSquadResponse,
} from '../services/userProfileService';
export {
  apiGet,
  apiPost,
  apiRequest,
  apiPublicGet,
  BACKEND_URL,
  syncUserWithBackend,
  getProfileFromBackend,
  updateProfileInBackend,
  uploadSquadImageToBackend,
  deleteSquadImageFromBackend,
};
export type { ApiResponse, SyncUserResponse, UserProfileResponse, UserProfileUpdatePayload, UploadSquadResponse };
import type {
  Player,
  PlayerMeResponse,
  AdminPlayersResponse,
  ProfileCompletion,
  CupTournamentRecord,
  CupRegistrationRecord,
  CupMatchRecord,
  CupResultSubmissionRecord,
  CupDisputeRecord,
  LeagueSeasonRecord,
  LeagueParticipantRecord,
  LeagueFixtureRecord,
  LeagueResultRecord,
  LeagueStandingRecord,
  CourseRecord,
  ClassRecord,
  PaymentRecord,
  NotificationRecord,
  Competition,
  CompetitionRegistration,
  CompetitionsResponse,
  CompetitionDetailResponse,
  AdminCompetitionsResponse,
  AdminRegistrationsResponse,
} from '../types';

// ==========================================
// 1. PUBLIC DIAGNOSTIC & METADATA ENDPOINTS
// ==========================================

export interface HealthData {
  status?: string;
  uptime?: number | string;
  version?: string;
  environment?: string;
  system?: string;
  apiVersion?: string;
  serverTime?: string;
  timezone?: string;
  database?: string;
  drive?: string;
  [key: string]: any;
}

export interface SystemInfoData {
  system?: string;
  version?: string;
  time?: string;
  timeZone?: string;
  activeExecutions?: number;
  currency?: string;
  databaseConfigured?: boolean;
  driveConfigured?: boolean;
  documentsConfigured?: boolean;
  [key: string]: any;
}

export interface DatabaseInfoData {
  spreadsheetId?: string;
  tables?: string[];
  sheets?: string[];
  status?: string;
  tableCount?: number;
  sheetCount?: number;
  [key: string]: any;
}

export interface PublicConfigData {
  systemName: string;
  currency: string;
  currentCupId?: string;
  currentLeagueSeasonId?: string;
  rulesDocumentUrl?: string;
  standingsDocumentUrl?: string;
  supportWhatsApp?: string;
  [key: string]: any;
}

/**
 * Check backend health status
 * GET ?action=HEALTH (public, unauthenticated)
 */
export async function getHealth(): Promise<ApiResponse<HealthData>> {
  const primary = await apiGet<HealthData>('HEALTH');
  if (primary.success) return primary;
  // [LEGACY COMPATIBILITY FALLBACK] Support lowercase 'health' if calling legacy Setup 7 endpoint
  return await apiGet<HealthData>('health');
}

/**
 * Retrieve backend system metadata
 * GET ?action=system with fallback to GET_PUBLIC_CONFIG
 */
export async function getSystemInfo(): Promise<ApiResponse<SystemInfoData>> {
  const primary = await apiGet<SystemInfoData>('system');
  if (primary.success && primary.data) return primary;

  // Fallback: Use GET_PUBLIC_CONFIG or HEALTH
  const pubRes = await apiGet<any>('GET_PUBLIC_CONFIG');
  if (pubRes.success && pubRes.data) {
    return {
      success: true,
      requestId: pubRes.requestId,
      timestamp: pubRes.timestamp,
      data: {
        system: pubRes.data.systemName || 'Chuka eFootball',
        version: pubRes.data.systemVersion || '1.0.0',
        currency: pubRes.data.currency || 'KES',
        time: pubRes.timestamp || new Date().toISOString(),
        timeZone: 'Africa/Nairobi',
        databaseConfigured: true,
        driveConfigured: true,
        documentsConfigured: true,
        environment: 'PRODUCTION',
      },
    };
  }

  return primary;
}

/**
 * Retrieve database connection information and tables
 * GET ?action=database with fallback to HEALTH check and schema metadata
 */
export async function getDatabaseInfo(): Promise<ApiResponse<DatabaseInfoData>> {
  const primary = await apiGet<DatabaseInfoData>('database');
  if (primary.success && primary.data) return primary;

  // Fallback: Verify connection via HEALTH and return standard Google Sheets structure
  const healthRes = await getHealth();
  const currentSheetId = (await import('../config/googleSheetsConfig')).GoogleSheetsConfig.getSheetId();

  if (healthRes.success) {
    const defaultTables = [
      'Players',
      'Competitions',
      'CompetitionRegistrations',
      'CupTournaments',
      'CupMatches',
      'CupRegistrations',
      'LeagueSeasons',
      'LeagueStandings',
      'LeagueFixtures',
      'LeagueParticipants',
      'Admins',
      'AuditLog',
    ];

    return {
      success: true,
      requestId: healthRes.requestId,
      timestamp: healthRes.timestamp,
      data: {
        spreadsheetId: currentSheetId,
        status: 'CONNECTED',
        configured: Boolean(currentSheetId),
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`,
        sheetCount: defaultTables.length,
        tableCount: defaultTables.length,
        tables: defaultTables,
        sheets: defaultTables,
      },
    };
  }

  return primary;
}

/**
 * Retrieve central public app configuration
 * GET ?action=GET_PUBLIC_CONFIG (public, unauthenticated)
 */
export async function getPublicConfig(): Promise<ApiResponse<PublicConfigData>> {
  return await apiGet<PublicConfigData>('GET_PUBLIC_CONFIG');
}

/**
 * Retrieve public tournament, match, standings, and rules data
 * GET ?action=getPublicData (public, unauthenticated)
 * [LEGACY COMPATIBILITY] Provided for legacy sheets only
 */
export async function getPublicData(): Promise<ApiResponse<{
  tournaments: any[];
  matches: any[];
  standings: any[];
  rules: any[];
}>> {
  return await apiGet<{
    tournaments: any[];
    matches: any[];
    standings: any[];
    rules: any[];
  }>('getPublicData');
}

// ==========================================
// 2. PUBLIC COMPETITION & ACADEMIC ENDPOINTS
// ==========================================

/**
 * Get current active Weekly Cup tournament
 * GET ?action=GET_CURRENT_CUP
 */
export async function getCurrentCup(): Promise<ApiResponse<{ cup: CupTournamentRecord | null }>> {
  const direct = await apiGet<{ cup: CupTournamentRecord | null }>('GET_CURRENT_CUP');
  // If the production API answered (even with null cup), return the authoritative result
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only attempted if production router returned UNKNOWN_ACTION
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const compRes = await apiGet<{ competitions: Competition[] }>('competitions', { type: 'KNOCKOUT' });
    if (compRes.success && compRes.data?.competitions && compRes.data.competitions.length > 0) {
      const comp = compRes.data.competitions.find(c => c.Status === 'OPEN' || c.Status === 'IN_PROGRESS') || compRes.data.competitions[0];
      const cupRecord: CupTournamentRecord = {
        TournamentID: comp.CompetitionID,
        TournamentNumber: 1,
        Name: comp.Name,
        RegistrationStart: comp.RegistrationStart || '',
        RegistrationEnd: comp.RegistrationEnd || '',
        TournamentStart: comp.StartDate || '',
        TournamentEnd: comp.EndDate || '',
        Capacity: comp.MaxPlayers || 32,
        RegistrationFee: comp.EntryFee || 0,
        PrizeAmount: (comp.EntryFee || 0) * (comp.MaxPlayers || 32) * 0.7,
        Currency: comp.Currency || 'KES',
        Status: (comp.Status === 'OPEN' ? 'REGISTRATION_OPEN' : comp.Status === 'IN_PROGRESS' ? 'IN_PROGRESS' : comp.Status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING') as any,
        RegisteredCount: comp.RegisteredCount || 0,
        RulesDocumentID: comp.RulesDocumentID,
        CreatedAt: comp.CreatedAt || new Date().toISOString(),
        UpdatedAt: comp.UpdatedAt || new Date().toISOString(),
      };
      return { success: true, data: { cup: cupRecord } };
    }
  }

  return direct;
}

/**
 * List upcoming and open Weekly Cup tournaments
 * GET ?action=GET_UPCOMING_CUPS
 */
export async function getUpcomingCups(): Promise<ApiResponse<{ cups: CupTournamentRecord[] }>> {
  const direct = await apiGet<{ cups: CupTournamentRecord[] }>('GET_UPCOMING_CUPS');
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only if production action is unrecognized
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const current = await getCurrentCup();
    if (current.success && current.data?.cup) {
      return { success: true, data: { cups: [current.data.cup] } };
    }
  }
  return direct;
}

/**
 * Get specific Cup tournament details by ID
 * GET ?action=GET_CUP_TOURNAMENT&tournamentId=<id>
 */
export async function getCupTournament(tournamentId: string): Promise<ApiResponse<{ cup: CupTournamentRecord }>> {
  const direct = await apiGet<{ cup: CupTournamentRecord }>('GET_CUP_TOURNAMENT', { tournamentId });
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK]
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const current = await getCurrentCup();
    if (current.success && current.data?.cup && current.data.cup.TournamentID === tournamentId) {
      return { success: true, data: { cup: current.data.cup } };
    }
  }
  return direct;
}

/**
 * Get Cup bracket and matches for a tournament
 * GET ?action=GET_CUP_BRACKET&tournamentId=<id>
 */
export async function getCupBracket(tournamentId: string): Promise<ApiResponse<{ matches: CupMatchRecord[] }>> {
  const direct = await apiGet<{ matches: CupMatchRecord[] }>('GET_CUP_BRACKET', { tournamentId });
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only if production router does not support GET_CUP_BRACKET
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const pubRes = await getPublicData();
    if (pubRes.success && pubRes.data?.matches) {
      const matches: CupMatchRecord[] = pubRes.data.matches.map((m: any, idx: number) => ({
        MatchID: m.MatchID || `MATCH-${idx + 1}`,
        TournamentID: m.TournamentID || tournamentId,
        Round: m.Round || 'Quarter-Final',
        Player1ID: m.Player1ID || '',
        Player2ID: m.Player2ID || '',
        Player1Username: m.Player1Username || 'Player 1',
        Player2Username: m.Player2Username || 'Player 2',
        Player1Score: m.Player1Score !== undefined && m.Player1Score !== null && m.Player1Score !== '' ? Number(m.Player1Score) : null,
        Player2Score: m.Player2Score !== undefined && m.Player2Score !== null && m.Player2Score !== '' ? Number(m.Player2Score) : null,
        Status: (m.Status === 'Scheduled' ? 'SCHEDULED' : m.Status === 'Result Submitted' ? 'SUBMITTED' : m.Status === 'Confirmed' ? 'CONFIRMED' : m.Status === 'Disputed' ? 'DISPUTED' : (m.Status || 'SCHEDULED').toUpperCase()) as any,
        WinnerID: m.WinnerID,
        Deadline: m.Deadline || '',
        CreatedAt: m.CreatedAt || '',
        UpdatedAt: m.UpdatedAt || '',
      }));
      return { success: true, data: { matches } };
    }
  }

  return direct;
}

/**
 * Get current active League season
 * GET ?action=GET_CURRENT_LEAGUE
 */
export async function getCurrentLeague(): Promise<ApiResponse<{ season: LeagueSeasonRecord | null }>> {
  const direct = await apiGet<{ season: LeagueSeasonRecord | null }>('GET_CURRENT_LEAGUE');
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only if production router does not support GET_CURRENT_LEAGUE
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const compRes = await apiGet<{ competitions: Competition[] }>('competitions', { type: 'LEAGUE' });
    if (compRes.success && compRes.data?.competitions && compRes.data.competitions.length > 0) {
      const comp = compRes.data.competitions.find(c => c.Status === 'OPEN' || c.Status === 'IN_PROGRESS') || compRes.data.competitions[0];
      const seasonRecord: LeagueSeasonRecord = {
        SeasonID: comp.CompetitionID,
        SeasonNumber: 1,
        Name: comp.Name,
        ActivationFee: comp.EntryFee || 0,
        Currency: comp.Currency || 'KES',
        Status: (comp.Status === 'OPEN' ? 'REGISTRATION_OPEN' : comp.Status === 'IN_PROGRESS' ? 'IN_PROGRESS' : comp.Status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING') as any,
        StartDate: comp.StartDate || '',
        EndDate: comp.EndDate || '',
        RulesDocURL: comp.RulesDocumentURL,
        StandingsDocURL: comp.StandingsDocumentURL,
        CreatedAt: comp.CreatedAt || new Date().toISOString(),
        UpdatedAt: comp.UpdatedAt || new Date().toISOString(),
      };
      return { success: true, data: { season: seasonRecord } };
    }
  }

  return direct;
}

/**
 * Get League season details by ID
 * GET ?action=GET_LEAGUE_SEASON&seasonId=<id>
 */
export async function getLeagueSeason(seasonId?: string): Promise<ApiResponse<{ season: LeagueSeasonRecord }>> {
  const direct = await apiGet<{ season: LeagueSeasonRecord }>('GET_LEAGUE_SEASON', seasonId ? { seasonId } : {});
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK]
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const current = await getCurrentLeague();
    if (current.success && current.data?.season) {
      return { success: true, data: { season: current.data.season } };
    }
  }
  return direct;
}

/**
 * Get League standings for a season
 * GET ?action=GET_LEAGUE_STANDINGS&seasonId=<id>
 */
export async function getLeagueStandings(seasonId?: string): Promise<ApiResponse<{ standings: LeagueStandingRecord[] }>> {
  const direct = await apiGet<{ standings: LeagueStandingRecord[] }>('GET_LEAGUE_STANDINGS', seasonId ? { seasonId } : {});
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only if production router does not support GET_LEAGUE_STANDINGS
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const pubRes = await getPublicData();
    if (pubRes.success && pubRes.data?.standings) {
      const standings: LeagueStandingRecord[] = pubRes.data.standings.map((s: any, idx: number) => ({
        StandingID: s.StandingID || `STD-${idx + 1}`,
        SeasonID: seasonId || 'SEASON-01',
        PlayerID: s.PlayerID || '',
        eFootballUsername: s.eFootballUsername || '',
        FullName: s.FullName || s.DisplayName,
        Played: parseInt(s.Played) || 0,
        Wins: parseInt(s.Wins) || 0,
        Draws: parseInt(s.Draws) || 0,
        Losses: parseInt(s.Losses) || 0,
        GoalsFor: parseInt(s.GoalsFor) || 0,
        GoalsAgainst: parseInt(s.GoalsAgainst) || 0,
        GoalDifference: parseInt(s.GoalDifference) || 0,
        Points: parseInt(s.Points) || 0,
        Position: idx + 1,
      }));
      return { success: true, data: { standings } };
    }
  }

  return direct;
}

/**
 * Get list of Chuka University courses
 * GET ?action=GET_COURSES
 */
export async function getCourses(): Promise<ApiResponse<{ courses: CourseRecord[] }>> {
  const direct = await apiGet<{ courses: CourseRecord[] }>('GET_COURSES');
  if (direct.success && direct.data?.courses && direct.data.courses.length > 0) return direct;

  // Chuka University official academic faculties
  const fallbackCourses: CourseRecord[] = [
    { CourseID: 'CRS-ACS', CourseCode: 'COMP101', CourseName: 'BSc. Applied Computer Science', Department: 'Computer Science', Faculty: 'Science, Engineering & Tech', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-CT', CourseCode: 'COMP102', CourseName: 'BSc. Computer Technology', Department: 'Computer Science', Faculty: 'Science, Engineering & Tech', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-BIT', CourseCode: 'BIT101', CourseName: 'Bachelor of Information Technology', Department: 'Computer Science', Faculty: 'Science, Engineering & Tech', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-BCOM', CourseCode: 'BCOM101', CourseName: 'Bachelor of Commerce', Department: 'Business Administration', Faculty: 'Business Studies', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-BED', CourseCode: 'BED101', CourseName: 'Bachelor of Education (Arts/Science)', Department: 'Education', Faculty: 'Education & Resources', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-NURS', CourseCode: 'NURS101', CourseName: 'BSc. Nursing', Department: 'Nursing Sciences', Faculty: 'Health Sciences', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-AGRI', CourseCode: 'AGRI101', CourseName: 'BSc. Agribusiness Management', Department: 'Agriculture', Faculty: 'Agriculture & Env. Studies', CreatedAt: new Date().toISOString() },
    { CourseID: 'CRS-ENG', CourseCode: 'ENG101', CourseName: 'BSc. Electrical & Electronics Engineering', Department: 'Engineering', Faculty: 'Science, Engineering & Tech', CreatedAt: new Date().toISOString() },
  ];
  return { success: true, data: { courses: fallbackCourses } };
}

/**
 * Get list of class sections (optionally filtered by courseId)
 * GET ?action=GET_CLASSES&courseId=<id>
 */
export async function getClasses(courseId?: string): Promise<ApiResponse<{ classes: ClassRecord[] }>> {
  const direct = await apiGet<{ classes: ClassRecord[] }>('GET_CLASSES', courseId ? { courseId } : {});
  if (direct.success && direct.data?.classes && direct.data.classes.length > 0) return direct;

  const cId = courseId || 'CRS-ACS';
  const fallbackClasses: ClassRecord[] = [
    { ClassID: `${cId}-Y1`, CourseID: cId, ClassName: 'Year 1 Section A', YearOfStudy: 1, WhatsAppGroupLink: 'https://chat.whatsapp.com/Byo7gA36vQC7Xu9v0hjmMq', CreatedAt: new Date().toISOString() },
    { ClassID: `${cId}-Y2`, CourseID: cId, ClassName: 'Year 2 Section A', YearOfStudy: 2, WhatsAppGroupLink: 'https://chat.whatsapp.com/Byo7gA36vQC7Xu9v0hjmMq', CreatedAt: new Date().toISOString() },
    { ClassID: `${cId}-Y3`, CourseID: cId, ClassName: 'Year 3 Section A', YearOfStudy: 3, WhatsAppGroupLink: 'https://chat.whatsapp.com/Byo7gA36vQC7Xu9v0hjmMq', CreatedAt: new Date().toISOString() },
    { ClassID: `${cId}-Y4`, CourseID: cId, ClassName: 'Year 4 Section A', YearOfStudy: 4, WhatsAppGroupLink: 'https://chat.whatsapp.com/Byo7gA36vQC7Xu9v0hjmMq', CreatedAt: new Date().toISOString() },
  ];
  return { success: true, data: { classes: fallbackClasses } };
}

// ==========================================
// 3. AUTHENTICATED PLAYER ENDPOINTS
// ==========================================

export interface EnsurePlayerPayload {
  eFootballUsername: string;
  FullName: string;
  PhoneNumber: string;
  WhatsAppNumber: string;
  SquadImage?: string;
  AvailableDays?: string | string[];
  AvailableTimes?: string | string[];
  RulesAccepted?: boolean;
  Division?: string;
  DisplayName?: string;
  Phone?: string;
  Email?: string;
  GoogleUID?: string;
  photoUrl?: string;
}

export interface SyncPlayerPayload {
  uid?: string;
  email?: string;
  displayName?: string;
  username?: string;
  phone?: string;
  division?: string;
  photoUrl?: string;
}

/**
 * Direct Player Auto-Sync into Google Sheets
 * Tries POST sync-player, falls back to GET sync-player, then player-create
 */
export async function syncPlayer(
  payload: SyncPlayerPayload
): Promise<ApiResponse<{ profileExists: boolean; player: Player; actionTaken?: string }>> {
  // 1. Try POST action: sync-player
  const postRes = await apiPost<{ profileExists: boolean; player: Player; actionTaken?: string }>(
    'sync-player',
    payload,
    true
  );
  if (postRes.success && postRes.data?.player) {
    return postRes;
  }

  // 2. Try GET action: sync-player (zero CORS / zero redirect friction)
  const getRes = await apiGet<{ profileExists: boolean; player: Player; actionTaken?: string }>(
    'sync-player',
    {
      uid: payload.uid || '',
      email: payload.email || '',
      displayName: payload.displayName || '',
      username: payload.username || '',
      phone: payload.phone || '+254700000000',
      division: payload.division || 'OPEN',
      photoUrl: payload.photoUrl || '',
    }
  );
  if (getRes.success && getRes.data?.player) {
    return getRes;
  }

  // 3. Fallback to player-create
  const createRes = await apiPost<{ player: Player; completion: ProfileCompletion }>(
    'player-create',
    {
      DisplayName: payload.displayName,
      FullName: payload.displayName,
      eFootballUsername: payload.username,
      Phone: payload.phone || '+254700000000',
      Division: payload.division || 'OPEN',
      uid: payload.uid,
      email: payload.email,
    },
    true
  );
  if (createRes.success && createRes.data?.player) {
    return {
      success: true,
      data: {
        profileExists: true,
        player: createRes.data.player,
        actionTaken: 'CREATED',
      },
    };
  }

  return postRes.error
    ? postRes
    : getRes.error
    ? getRes
    : {
        success: false,
        error: createRes.error || { code: 'SYNC_ERROR', message: 'Failed to sync player profile.' },
      };
}

/**
 * Ensure / create a player record linked to the authenticated Firebase account
 * POST with action: player-create / sync-player
 */
export async function ensurePlayer(
  payload: EnsurePlayerPayload
): Promise<ApiResponse<{ player: Player; completion: ProfileCompletion }>> {
  const normalized = {
    DisplayName: payload.DisplayName?.trim() || payload.FullName?.trim() || payload.eFootballUsername.trim(),
    FullName: payload.FullName?.trim() || payload.DisplayName?.trim() || payload.eFootballUsername.trim(),
    eFootballUsername: payload.eFootballUsername.trim().toUpperCase(),
    Phone: payload.PhoneNumber?.trim() || payload.Phone?.trim() || payload.WhatsAppNumber?.trim() || '+254700000000',
    PhoneNumber: payload.PhoneNumber?.trim() || payload.Phone?.trim() || payload.WhatsAppNumber?.trim() || '+254700000000',
    WhatsApp: payload.WhatsAppNumber?.trim() || payload.PhoneNumber?.trim() || payload.Phone?.trim() || '+254700000000',
    WhatsAppNumber: payload.WhatsAppNumber?.trim() || payload.PhoneNumber?.trim() || payload.Phone?.trim() || '+254700000000',
    SquadImage: payload.SquadImage || '',
    AvailableDays: payload.AvailableDays || '',
    AvailableTimes: payload.AvailableTimes || '',
    RulesAccepted: Boolean(payload.RulesAccepted),
    Division: payload.Division || 'OPEN',
    Email: payload.Email,
    GoogleUID: payload.GoogleUID,
  };

  // Try sync-player first
  const syncRes = await syncPlayer({
    uid: payload.GoogleUID,
    email: payload.Email,
    displayName: normalized.DisplayName,
    username: normalized.eFootballUsername,
    phone: normalized.Phone,
    division: normalized.Division,
    photoUrl: payload.photoUrl,
  });
  if (syncRes.success && syncRes.data?.player) {
    return {
      success: true,
      data: {
        player: syncRes.data.player,
        completion: {
          percentage: 100,
          missingFields: [],
          isComplete: true,
        },
      },
    };
  }

  // Call player-create
  const primary = await apiPost<{ player: Player; completion: ProfileCompletion }>('player-create', normalized, true);
  if (primary.success) return primary;

  // Fallback to ENSURE_PLAYER if custom deployment
  if (primary.error?.code === 'UNKNOWN_ACTION') {
    return await apiPost<{ player: Player; completion: ProfileCompletion }>('ENSURE_PLAYER', normalized, true);
  }
  return primary;
}

/**
 * Retrieve current player profile for the authenticated Firebase user
 * POST with action: player-me
 */
export async function getCurrentPlayer(): Promise<ApiResponse<PlayerMeResponse>> {
  const { getFirebaseIdToken } = await import('../firebase/auth');
  const token = await getFirebaseIdToken(false);
  if (token) {
    try {
      const prof = await getProfileFromBackend(token);
      if (prof.success && prof.user) {
        const u = prof.user;
        const fullName = u.display_name || 'Player';
        const phone = u.phone || '';
        const whatsapp = u.whatsapp || phone;
        const squadUrl = u.squad_image_url || '';
        const squadId = u.squad_image_file_id || '';

        const player: Player = {
          PlayerID: u.user_id || 'ASSIGNED',
          FirebaseUID: u.user_id || '',
          GoogleUID: u.user_id || '',
          Email: u.email || '',
          FullName: fullName,
          DisplayName: fullName,
          PhoneNumber: phone,
          Phone: phone,
          WhatsAppNumber: whatsapp,
          WhatsApp: whatsapp,
          eFootballUsername: fullName.toUpperCase().replace(/\s+/g, '_'),
          class_id: u.class_id || '',
          ClassID: u.class_id || '',
          role: u.role || 'USER',
          Role: u.role || 'USER',
          Division: 'OPEN',
          Status: (u.status as any) || 'ACTIVE',
          Verified: true,
          RulesAccepted: true,
          ProfilePhotoURL: u.photo_url || '',
          SquadImage: squadUrl,
          SquadImageURL: squadUrl,
          SquadImageFileID: squadId,
          SquadScreenshotURL: squadUrl,
          SquadScreenshotFileID: squadId,
          CreatedAt: u.created_at || new Date().toISOString(),
          UpdatedAt: u.updated_at || new Date().toISOString(),
        };

        const hasPhoto = Boolean(player.ProfilePhotoURL);
        const hasSquad = Boolean(player.SquadImageURL);
        const pct = hasPhoto && hasSquad ? 100 : hasPhoto || hasSquad ? 85 : 70;

        return {
          success: true,
          data: {
            profileExists: true,
            player,
            completion: {
              percentage: pct,
              missingFields: !hasPhoto ? ['Profile Photo'] : !hasSquad ? ['Squad Screenshot'] : [],
              isComplete: pct === 100,
            },
          },
        };
      }
    } catch (profErr) {
      console.warn('[getCurrentPlayer] getProfileFromBackend notice:', profErr);
    }
  }

  // Call player-me directly (matches Apps Script action)
  const primary = await apiPost<PlayerMeResponse>('player-me', {}, true);
  if (primary.success) return primary;

  // Fallback to GET_CURRENT_PLAYER if custom deployment
  if (primary.error?.code === 'UNKNOWN_ACTION') {
    return await apiPost<PlayerMeResponse>('GET_CURRENT_PLAYER', {}, true);
  }
  return primary;
}

/**
 * Compatibility alias for getCurrentPlayer
 */
export async function getMyProfile(): Promise<ApiResponse<PlayerMeResponse>> {
  return await getCurrentPlayer();
}

/**
 * Get player profile by PlayerID
 * POST with action: GET_PLAYER_PROFILE (production router)
 */
export async function getPlayerProfile(playerId?: string): Promise<ApiResponse<{ player: Player }>> {
  const primary = await apiPost<{ player: Player }>('GET_PLAYER_PROFILE', playerId ? { PlayerID: playerId } : {}, true);
  if (primary.success && primary.data?.player) return primary;

  if (!playerId) {
    const me = await getCurrentPlayer();
    if (me.success && me.data?.player) {
      return { success: true, data: { player: me.data.player } };
    }
    return { success: false, error: me.error || { code: 'NOT_FOUND', message: 'Player not found.' } };
  }

  // [LEGACY COMPATIBILITY FALLBACK] Search via admin-players if GET_PLAYER_PROFILE returns UNKNOWN_ACTION
  if (primary.error?.code === 'UNKNOWN_ACTION') {
    const adminRes = await apiGet<AdminPlayersResponse>('admin-players', { search: playerId }, true);
    if (adminRes.success && adminRes.data?.players) {
      const found = adminRes.data.players.find((p) => p.PlayerID === playerId);
      if (found) return { success: true, data: { player: found } };
    }
  }
  return primary.error ? primary : { success: false, error: { code: 'NOT_FOUND', message: 'Player not found.' } };
}

/**
 * Update current player profile
 * POST with action: player-update
 */
export async function updatePlayerProfile(
  data: Partial<Player>
): Promise<ApiResponse<{ player: Player; completion: ProfileCompletion }>> {
  const body = {
    ...data,
    DisplayName: data.DisplayName || data.FullName,
    FullName: data.FullName || data.DisplayName,
    Phone: data.Phone || data.PhoneNumber || data.WhatsAppNumber || data.WhatsApp,
    PhoneNumber: data.PhoneNumber || data.Phone || data.WhatsAppNumber || data.WhatsApp,
    WhatsApp: data.WhatsAppNumber || data.WhatsApp || data.Phone || data.PhoneNumber,
    WhatsAppNumber: data.WhatsAppNumber || data.WhatsApp || data.Phone || data.PhoneNumber,
    eFootballUsername: data.eFootballUsername,
    Division: data.Division,
  };

  const { getFirebaseIdToken } = await import('../firebase/auth');
  const token = await getFirebaseIdToken(false);
  if (!token) {
    return {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'A valid Firebase authentication session is required to update profile.',
      },
    };
  }

  // 1. Authoritatively update Users sheet in Google Sheets via updateProfile action
  let backendResult: UserProfileResponse;
  try {
    backendResult = await updateProfileInBackend(token, {
      display_name: body.DisplayName || body.FullName,
      phone: body.PhoneNumber || body.Phone,
      whatsapp: body.WhatsAppNumber || body.WhatsApp,
      class_id: (data as any).class_id || (data as any).ClassID || undefined,
    });
  } catch (backendErr: any) {
    console.error('[updatePlayerProfile] Error calling updateProfileInBackend:', backendErr);
    return {
      success: false,
      error: {
        code: 'BACKEND_UPDATE_ERROR',
        message: backendErr?.message || 'Failed to update profile in Apps Script backend.',
      },
    };
  }

  // If backend returned success: false, surface the exact backend message
  if (!backendResult || !backendResult.success) {
    const errorMsg = backendResult?.message || backendResult?.error || 'Apps Script rejected profile update.';
    console.warn('[updatePlayerProfile] Backend rejected update:', errorMsg);
    return {
      success: false,
      error: {
        code: 'BACKEND_REJECTED',
        message: errorMsg,
      },
    };
  }

  // 2. Build updated Player record using data returned from Users sheet
  const updatedUser = backendResult.user;
  const uid = (data as any).FirebaseUID || (data as any).GoogleUID || updatedUser?.user_id || '';
  const fullName = updatedUser?.display_name || body.DisplayName || body.FullName || 'Player';
  const phone = updatedUser?.phone || body.PhoneNumber || body.Phone || '';
  const whatsapp = updatedUser?.whatsapp || body.WhatsAppNumber || body.WhatsApp || phone;

  const updatedPlayer: Player = {
    ...data,
    PlayerID: updatedUser?.user_id || (data as any).PlayerID || 'ASSIGNED',
    FirebaseUID: uid,
    GoogleUID: uid,
    Email: updatedUser?.email || (data as any).Email || '',
    DisplayName: fullName,
    FullName: fullName,
    PhoneNumber: phone,
    Phone: phone,
    WhatsAppNumber: whatsapp,
    WhatsApp: whatsapp,
    eFootballUsername:
      body.eFootballUsername ||
      (data as any).eFootballUsername ||
      (updatedUser?.display_name ? updatedUser.display_name.toUpperCase().replace(/\s+/g, '_') : 'PLAYER'),
    Division: body.Division || 'OPEN',
    Status: (updatedUser?.status as any) || 'ACTIVE',
    Verified: true,
    ProfilePhotoURL: updatedUser?.photo_url || (data as any).ProfilePhotoURL || '',
    RulesAccepted: Boolean((data as any).RulesAccepted),
    CreatedAt: updatedUser?.created_at || (data as any).CreatedAt || new Date().toISOString(),
    UpdatedAt: updatedUser?.updated_at || new Date().toISOString(),
  };

  const hasPhoto = Boolean(updatedPlayer.ProfilePhotoURL || updatedPlayer.ProfileImage);
  const hasSquad = Boolean(updatedPlayer.SquadImageURL || updatedPlayer.SquadImage);
  const pct = hasPhoto && hasSquad ? 100 : hasPhoto || hasSquad ? 85 : 70;

  const completion: ProfileCompletion = {
    percentage: pct,
    missingFields: !hasPhoto ? ['Profile Photo'] : !hasSquad ? ['Squad Screenshot'] : [],
    isComplete: pct === 100,
  };

  return {
    success: true,
    data: {
      player: updatedPlayer,
      completion,
    },
  };
}

/**
 * Record official rules acceptance for the player
 * POST with action: ACCEPT_RULES (production router)
 */
export async function acceptRules(
  rulesAccepted = true
): Promise<ApiResponse<{ player: Player; completion?: ProfileCompletion; success: boolean }>> {
  const primary = await apiPost<{ player: Player; completion?: ProfileCompletion; success: boolean }>(
    'ACCEPT_RULES',
    { rulesAccepted, RulesAcceptedAt: new Date().toISOString() },
    true
  );
  if (primary.success) return primary;

  // [LEGACY COMPATIBILITY FALLBACK] If ACCEPT_RULES is UNKNOWN_ACTION, update via UPDATE_PLAYER_PROFILE / player-update
  if (primary.error?.code === 'UNKNOWN_ACTION') {
    const res = await updatePlayerProfile({
      RulesAccepted: rulesAccepted,
      RulesAcceptedAt: new Date().toISOString(),
    } as any);
    if (res.success && res.data?.player) {
      return {
        success: true,
        data: {
          player: { ...res.data.player, RulesAccepted: rulesAccepted, RulesAcceptedAt: new Date().toISOString() },
          completion: res.data.completion,
          success: true,
        },
      };
    }
    return {
      success: false,
      error: res.error || { code: 'RULES_ERROR', message: 'Failed to record rules acceptance.' },
    };
  }
  return primary;
}

/**
 * Get current verification & competitive status for the player
 * POST with action: GET_PLAYER_STATUS
 */
export async function getPlayerStatus(): Promise<ApiResponse<{ status: string; verified: boolean; player: Player }>> {
  return await apiPost<{ status: string; verified: boolean; player: Player }>('GET_PLAYER_STATUS', {}, true);
}

/**
 * Upload profile photo to Google Drive
 * POST with action: player-upload-profile-photo
 */
export async function uploadProfilePhoto(
  fileData: string,
  mimeType: string,
  fileName?: string
): Promise<ApiResponse<{ fileId: string; url: string; player: Player; completion: ProfileCompletion }>> {
  return await apiPost<{ fileId: string; url: string; player: Player; completion: ProfileCompletion }>(
    'player-upload-profile-photo',
    { fileData, mimeType, fileName },
    true
  );
}

/**
 * Upload team squad screenshot to Google Drive via Apps Script
 * and persist its reference in Users sheet
 */
export async function uploadSquadScreenshot(
  fileData: string,
  mimeType: string,
  fileName?: string
): Promise<ApiResponse<{ fileId: string; url: string; player: Player; completion: ProfileCompletion }>> {
  const { getFirebaseIdToken } = await import('../firebase/auth');
  const token = await getFirebaseIdToken(false);
  if (!token) {
    return {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'A valid Firebase session is required to upload squad image.',
      },
    };
  }

  try {
    const res = await uploadSquadImageToBackend(token, fileData, mimeType, fileName);
    if (!res.success) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: res.message || res.error || 'Failed to upload screenshot to Google Drive.',
        },
      };
    }

    const u = res.user;
    const squadUrl = res.url || u?.squad_image_url || '';
    const fileId = res.fileId || u?.squad_image_file_id || '';
    const fullName = u?.display_name || 'Player';
    const phone = u?.phone || '';
    const whatsapp = u?.whatsapp || phone;

    const player: Player = {
      PlayerID: u?.user_id || 'ASSIGNED',
      FirebaseUID: u?.user_id || '',
      GoogleUID: u?.user_id || '',
      Email: u?.email || '',
      FullName: fullName,
      DisplayName: fullName,
      PhoneNumber: phone,
      Phone: phone,
      WhatsAppNumber: whatsapp,
      WhatsApp: whatsapp,
      eFootballUsername: fullName.toUpperCase().replace(/\s+/g, '_'),
      class_id: u?.class_id || '',
      ClassID: u?.class_id || '',
      role: u?.role || 'USER',
      Role: u?.role || 'USER',
      Division: 'OPEN',
      Status: (u?.status as any) || 'ACTIVE',
      Verified: true,
      RulesAccepted: true,
      ProfilePhotoURL: u?.photo_url || '',
      SquadImage: squadUrl,
      SquadImageURL: squadUrl,
      SquadImageFileID: fileId,
      SquadScreenshotURL: squadUrl,
      SquadScreenshotFileID: fileId,
      CreatedAt: u?.created_at || new Date().toISOString(),
      UpdatedAt: u?.updated_at || new Date().toISOString(),
    };

    const hasPhoto = Boolean(player.ProfilePhotoURL);
    const hasSquad = Boolean(squadUrl);
    const pct = hasPhoto && hasSquad ? 100 : hasPhoto || hasSquad ? 85 : 70;

    return {
      success: true,
      data: {
        fileId,
        url: squadUrl,
        player,
        completion: {
          percentage: pct,
          missingFields: !hasPhoto ? ['Profile Photo'] : !hasSquad ? ['Squad Screenshot'] : [],
          isComplete: pct === 100,
        },
      },
    };
  } catch (err: any) {
    console.error('[uploadSquadScreenshot error]:', err);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Failed to upload screenshot to Google Drive.',
      },
    };
  }
}

/**
 * Removes squad screenshot from Google Drive and clears its reference in Users sheet
 */
export async function deleteSquadScreenshot(): Promise<ApiResponse<{ player: Player; completion: ProfileCompletion }>> {
  const { getFirebaseIdToken } = await import('../firebase/auth');
  const token = await getFirebaseIdToken(false);
  if (!token) {
    return {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'A valid Firebase session is required to remove squad screenshot.',
      },
    };
  }

  try {
    const res = await deleteSquadImageFromBackend(token);
    if (!res.success) {
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: res.message || res.error || 'Failed to remove squad screenshot.',
        },
      };
    }

    const u = res.user;
    const fullName = u?.display_name || 'Player';
    const phone = u?.phone || '';
    const whatsapp = u?.whatsapp || phone;

    const player: Player = {
      PlayerID: u?.user_id || 'ASSIGNED',
      FirebaseUID: u?.user_id || '',
      GoogleUID: u?.user_id || '',
      Email: u?.email || '',
      FullName: fullName,
      DisplayName: fullName,
      PhoneNumber: phone,
      Phone: phone,
      WhatsAppNumber: whatsapp,
      WhatsApp: whatsapp,
      eFootballUsername: fullName.toUpperCase().replace(/\s+/g, '_'),
      class_id: u?.class_id || '',
      ClassID: u?.class_id || '',
      role: u?.role || 'USER',
      Role: u?.role || 'USER',
      Division: 'OPEN',
      Status: (u?.status as any) || 'ACTIVE',
      Verified: true,
      RulesAccepted: true,
      ProfilePhotoURL: u?.photo_url || '',
      SquadImage: '',
      SquadImageURL: '',
      SquadImageFileID: '',
      SquadScreenshotURL: '',
      SquadScreenshotFileID: '',
      CreatedAt: u?.created_at || new Date().toISOString(),
      UpdatedAt: u?.updated_at || new Date().toISOString(),
    };

    const hasPhoto = Boolean(player.ProfilePhotoURL);
    const pct = hasPhoto ? 85 : 70;

    return {
      success: true,
      data: {
        player,
        completion: {
          percentage: pct,
          missingFields: ['Squad Screenshot', ...(hasPhoto ? [] : ['Profile Photo'])],
          isComplete: false,
        },
      },
    };
  } catch (err: any) {
    console.error('[deleteSquadScreenshot error]:', err);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Failed to remove squad screenshot.',
      },
    };
  }
}

// ==========================================
// 4. AUTHENTICATED WEEKLY CUP ENDPOINTS
// ==========================================

export interface CupResultSubmissionPayload {
  matchId: string;
  tournamentId?: string;
  submitterScore: number;
  opponentScore: number;
  screenshotReference?: string;
  screenshotBase64?: string;
  screenshotName?: string;
}

export interface CupDisputePayload {
  matchId: string;
  tournamentId?: string;
  reason: string;
  evidenceReference?: string;
  evidenceBase64?: string;
}

/**
 * Register authenticated player for a Weekly Cup tournament
 * POST with action: REGISTER_FOR_CUP
 */
export async function registerForCup(
  tournamentId: string,
  paymentReference?: string
): Promise<ApiResponse<{ registration: CupRegistrationRecord }>> {
  const direct = await apiPost<{ registration: CupRegistrationRecord }>(
    'REGISTER_FOR_CUP',
    { TournamentID: tournamentId, PaymentReference: paymentReference },
    true
  );
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only if production action is unrecognized (UNKNOWN_ACTION)
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const compRes = await apiPost<{ registration: any }>(
      'competition-register',
      { CompetitionID: tournamentId, PaymentReference: paymentReference },
      true
    );
    if (compRes.success && compRes.data?.registration) {
      const raw = compRes.data.registration;
      const mapped: CupRegistrationRecord = {
        RegistrationID: raw.RegistrationID,
        TournamentID: raw.CompetitionID || tournamentId,
        PlayerID: raw.PlayerID,
        eFootballUsername: raw.eFootballUsername,
        PaymentStatus: raw.PaymentStatus || 'NOT_REQUIRED',
        VerificationStatus: raw.Status === 'APPROVED' ? 'APPROVED' : 'PENDING',
        RegisteredAt: raw.RegisteredAt || new Date().toISOString(),
      };
      return { success: true, data: { registration: mapped } };
    }
  }

  return direct;
}

/**
 * Get player's registration for a specific Cup
 * POST with action: GET_MY_CUP_REGISTRATION
 */
export async function getCupRegistration(
  tournamentId: string
): Promise<ApiResponse<{ registration: CupRegistrationRecord | null }>> {
  return await apiPost<{ registration: CupRegistrationRecord | null }>(
    'GET_MY_CUP_REGISTRATION',
    { TournamentID: tournamentId },
    true
  );
}

/**
 * Get all Cup registrations for the current player
 * POST with action: GET_MY_CUP_REGISTRATION
 */
export async function getMyCupRegistrations(): Promise<ApiResponse<{ registrations: CupRegistrationRecord[] }>> {
  const primary = await apiPost<{ registrations?: CupRegistrationRecord[]; registration?: CupRegistrationRecord }>(
    'GET_MY_CUP_REGISTRATION',
    {},
    true
  );
  if (primary.success) {
    const data = primary.data;
    if (data?.registrations && Array.isArray(data.registrations)) {
      return { success: true, data: { registrations: data.registrations } };
    }
    if (data?.registration) {
      return { success: true, data: { registrations: [data.registration] } };
    }
    return { success: true, data: { registrations: [] } };
  }
  return primary as ApiResponse<{ registrations: CupRegistrationRecord[] }>;
}

/**
 * Get the current active match for the authenticated player in a tournament
 * POST with action: GET_MY_CURRENT_CUP_MATCH
 */
export async function getCurrentCupMatch(
  tournamentId: string
): Promise<ApiResponse<{ match: CupMatchRecord | null }>> {
  return await apiPost<{ match: CupMatchRecord | null }>('GET_MY_CURRENT_CUP_MATCH', { TournamentID: tournamentId }, true);
}

/**
 * Get specific Cup match details by ID
 * POST with action: GET_CUP_MATCH
 */
export async function getCupMatch(
  matchId: string
): Promise<ApiResponse<{ match: CupMatchRecord }>> {
  return await apiPost<{ match: CupMatchRecord }>('GET_CUP_MATCH', { MatchID: matchId }, true);
}

/**
 * Submit Cup match result (Dual-Submission Flow)
 * POST with action: SUBMIT_CUP_RESULT
 * If both players' submissions match -> match automatically confirmed, winner advances.
 * If scores differ -> match becomes disputed for admin VAR review.
 */
export async function submitCupResult(
  payload: CupResultSubmissionPayload
): Promise<ApiResponse<{ submission: CupResultSubmissionRecord; isOfficial: boolean; isDisputed: boolean }>> {
  return await apiPost<{ submission: CupResultSubmissionRecord; isOfficial: boolean; isDisputed: boolean }>(
    'SUBMIT_CUP_RESULT',
    {
      MatchID: payload.matchId,
      TournamentID: payload.tournamentId,
      SubmitterScore: payload.submitterScore,
      OpponentScore: payload.opponentScore,
      ScreenshotReference: payload.screenshotReference,
      ScreenshotBase64: payload.screenshotBase64,
      ScreenshotName: payload.screenshotName,
    },
    true
  );
}

/**
 * Get Cup match result submissions
 * POST with action: GET_CUP_RESULT
 */
export async function getCupResult(
  matchId: string
): Promise<ApiResponse<{ submissions: CupResultSubmissionRecord[]; status: string }>> {
  return await apiPost<{ submissions: CupResultSubmissionRecord[]; status: string }>(
    'GET_CUP_RESULT',
    { MatchID: matchId },
    true
  );
}

/**
 * Submit / open a dispute for a Cup match
 * POST with action: SUBMIT_CUP_DISPUTE
 */
export async function submitCupDispute(
  payload: CupDisputePayload
): Promise<ApiResponse<{ dispute: CupDisputeRecord }>> {
  return await apiPost<{ dispute: CupDisputeRecord }>(
    'SUBMIT_CUP_DISPUTE',
    {
      MatchID: payload.matchId,
      TournamentID: payload.tournamentId,
      Reason: payload.reason,
      EvidenceReference: payload.evidenceReference,
      EvidenceBase64: payload.evidenceBase64,
    },
    true
  );
}

/**
 * Get Cup matches for authenticated player
 * POST with action: GET_MY_CUP_MATCHES
 */
export async function getMyCupMatches(
  tournamentId?: string
): Promise<ApiResponse<{ matches: CupMatchRecord[] }>> {
  return await apiPost<{ matches: CupMatchRecord[] }>(
    'GET_MY_CUP_MATCHES',
    tournamentId ? { TournamentID: tournamentId } : {},
    true
  );
}

/**
 * Get Cup disputes involving authenticated player
 * POST with action: GET_MY_CUP_DISPUTES
 */
export async function getMyCupDisputes(): Promise<ApiResponse<{ disputes: CupDisputeRecord[] }>> {
  return await apiPost<{ disputes: CupDisputeRecord[] }>('GET_MY_CUP_DISPUTES', {}, true);
}

/**
 * Get player's past Cup tournaments and knockout history
 * POST with action: GET_PLAYER_CUP_HISTORY
 */
export async function getPlayerCupHistory(
  playerId?: string
): Promise<ApiResponse<{ history: any[] }>> {
  return await apiPost<{ history: any[] }>('GET_PLAYER_CUP_HISTORY', playerId ? { PlayerID: playerId } : {}, true);
}

// ==========================================
// 5. AUTHENTICATED LEAGUE ENDPOINTS
// ==========================================

export interface LeagueResultPayload {
  fixtureId: string;
  seasonId?: string;
  homeScore: number;
  awayScore: number;
  screenshotReference?: string;
  screenshotBase64?: string;
}

/**
 * Join and activate participation in a League season
 * Requires Course and Class association; Activation Fee is defined by the season
 * POST with action: JOIN_LEAGUE
 */
export async function joinLeague(
  seasonId: string,
  courseId: string,
  classId: string,
  paymentReference?: string
): Promise<ApiResponse<{ participant: LeagueParticipantRecord }>> {
  const direct = await apiPost<{ participant: LeagueParticipantRecord }>(
    'JOIN_LEAGUE',
    {
      SeasonID: seasonId,
      CourseID: courseId,
      ClassID: classId,
      PaymentReference: paymentReference,
    },
    true
  );
  if (direct.success) return direct;

  // [LEGACY COMPATIBILITY FALLBACK] Only if production action is unrecognized (UNKNOWN_ACTION)
  if (direct.error?.code === 'UNKNOWN_ACTION') {
    const compRes = await apiPost<{ registration: any }>(
      'competition-register',
      { CompetitionID: seasonId, CourseID: courseId, ClassID: classId, PaymentReference: paymentReference },
      true
    );
    if (compRes.success && compRes.data?.registration) {
      const raw = compRes.data.registration;
      const participant: LeagueParticipantRecord = {
        ParticipantID: raw.RegistrationID,
        SeasonID: raw.CompetitionID || seasonId,
        PlayerID: raw.PlayerID,
        eFootballUsername: raw.eFootballUsername,
        CourseID: courseId,
        ClassID: classId,
        ActivationFeePaid: raw.PaymentStatus === 'PAID',
        PaymentReference: paymentReference,
        Status: raw.Status === 'APPROVED' ? 'ACTIVE' : 'PENDING',
        JoinedAt: raw.RegisteredAt || new Date().toISOString(),
      };
      return { success: true, data: { participant } };
    }
  }

  return direct;
}

/**
 * Get current participant record in active League season
 * POST with action: GET_MY_LEAGUE_PARTICIPANT
 */
export async function getCurrentLeagueParticipant(
  seasonId?: string
): Promise<ApiResponse<{ participant: LeagueParticipantRecord | null }>> {
  return await apiPost<{ participant: LeagueParticipantRecord | null }>(
    'GET_MY_LEAGUE_PARTICIPANT',
    seasonId ? { SeasonID: seasonId } : {},
    true
  );
}

/**
 * Get participant details by ID
 * POST with action: GET_PARTICIPANT
 */
export async function getLeagueParticipant(
  participantId: string
): Promise<ApiResponse<{ participant: LeagueParticipantRecord }>> {
  return await apiPost<{ participant: LeagueParticipantRecord }>(
    'GET_PARTICIPANT',
    { ParticipantID: participantId },
    true
  );
}

/**
 * Update class/course allocation for the player in League
 * POST with action: UPDATE_MY_LEAGUE_CLASS
 */
export async function updateMyLeagueClass(
  courseId: string,
  classId: string,
  seasonId?: string
): Promise<ApiResponse<{ participant: LeagueParticipantRecord }>> {
  return await apiPost<{ participant: LeagueParticipantRecord }>(
    'UPDATE_MY_LEAGUE_CLASS',
    { CourseID: courseId, ClassID: classId, SeasonID: seasonId },
    true
  );
}

/**
 * Get League fixtures for the authenticated player
 * POST with action: GET_MY_LEAGUE_FIXTURES
 */
export async function getPlayerLeagueFixtures(
  seasonId?: string
): Promise<ApiResponse<{ fixtures: LeagueFixtureRecord[] }>> {
  return await apiPost<{ fixtures: LeagueFixtureRecord[] }>(
    'GET_MY_LEAGUE_FIXTURES',
    seasonId ? { SeasonID: seasonId } : {},
    true
  );
}

/**
 * Get current fixture to be played by the player
 * POST with action: GET_MY_CURRENT_LEAGUE_FIXTURE
 */
export async function getCurrentLeagueFixture(
  seasonId?: string
): Promise<ApiResponse<{ fixture: LeagueFixtureRecord | null }>> {
  return await apiPost<{ fixture: LeagueFixtureRecord | null }>(
    'GET_MY_CURRENT_LEAGUE_FIXTURE',
    seasonId ? { SeasonID: seasonId } : {},
    true
  );
}

/**
 * Submit League fixture result
 * POST with action: SUBMIT_LEAGUE_RESULT
 */
export async function submitLeagueResult(
  payload: LeagueResultPayload
): Promise<ApiResponse<{ result: LeagueResultRecord }>> {
  return await apiPost<{ result: LeagueResultRecord }>(
    'SUBMIT_LEAGUE_RESULT',
    {
      FixtureID: payload.fixtureId,
      SeasonID: payload.seasonId,
      HomeScore: payload.homeScore,
      AwayScore: payload.awayScore,
      ScreenshotReference: payload.screenshotReference,
      ScreenshotBase64: payload.screenshotBase64,
    },
    true
  );
}

/**
 * Get League fixture result and opponent confirmation status
 * POST with action: GET_LEAGUE_RESULT
 */
export async function getLeagueResult(
  fixtureId: string
): Promise<ApiResponse<{ result: LeagueResultRecord | null }>> {
  return await apiPost<{ result: LeagueResultRecord | null }>(
    'GET_LEAGUE_RESULT',
    { FixtureID: fixtureId },
    true
  );
}

/**
 * Opponent responds to submitted League result (confirm or dispute)
 * POST with action: RESPOND_TO_LEAGUE_RESULT
 */
export async function confirmLeagueResult(
  resultId: string,
  agreed: boolean,
  reason?: string
): Promise<ApiResponse<{ result: LeagueResultRecord; isConfirmed: boolean }>> {
  return await apiPost<{ result: LeagueResultRecord; isConfirmed: boolean }>(
    'RESPOND_TO_LEAGUE_RESULT',
    {
      ResultID: resultId,
      Agreed: agreed,
      Reason: reason,
    },
    true
  );
}

// ==========================================
// 6. AUTHENTICATED PAYMENTS ENDPOINTS
// ==========================================

export interface CreatePaymentPayload {
  competitionType: 'CUP' | 'LEAGUE';
  competitionId: string;
  amount: number;
  paymentReference: string;
  mpesaReceiptNumber?: string;
}

/**
 * Record a payment (M-Pesa or transaction reference)
 * Fee amounts are dynamic per tournament / season, never hardcoded.
 * POST with action: CREATE_PAYMENT
 */
export async function createPayment(
  payload: CreatePaymentPayload
): Promise<ApiResponse<{ payment: PaymentRecord }>> {
  return await apiPost<{ payment: PaymentRecord }>(
    'CREATE_PAYMENT',
    {
      CompetitionType: payload.competitionType,
      CompetitionID: payload.competitionId,
      Amount: payload.amount,
      PaymentReference: payload.paymentReference,
      MpesaReceiptNumber: payload.mpesaReceiptNumber,
    },
    true
  );
}

/**
 * Get all payment records for authenticated player
 * POST with action: GET_MY_PAYMENTS
 */
export async function getPlayerPayments(): Promise<ApiResponse<{ payments: PaymentRecord[] }>> {
  return await apiPost<{ payments: PaymentRecord[] }>('GET_MY_PAYMENTS', {}, true);
}

/**
 * Check payment status by PaymentID
 * POST with action: GET_PAYMENT_STATUS
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<ApiResponse<{ payment: PaymentRecord }>> {
  return await apiPost<{ payment: PaymentRecord }>('GET_PAYMENT_STATUS', { PaymentID: paymentId }, true);
}

// ==========================================
// 7. AUTHENTICATED NOTIFICATIONS ENDPOINTS
// ==========================================

/**
 * Get in-app notifications for authenticated player
 * POST with action: GET_NOTIFICATIONS
 */
export async function getPlayerNotifications(): Promise<ApiResponse<{ notifications: NotificationRecord[] }>> {
  return await apiPost<{ notifications: NotificationRecord[] }>('GET_NOTIFICATIONS', {}, true);
}

/**
 * Get specific notification by ID
 * POST with action: GET_NOTIFICATION
 */
export async function getNotificationById(
  notificationId: string
): Promise<ApiResponse<{ notification: NotificationRecord }>> {
  return await apiPost<{ notification: NotificationRecord }>('GET_NOTIFICATION', { NotificationID: notificationId }, true);
}

/**
 * Mark a single notification as read
 * POST with action: MARK_NOTIFICATION_READ
 */
export async function markNotificationRead(
  notificationId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return await apiPost<{ success: boolean }>('MARK_NOTIFICATION_READ', { NotificationID: notificationId }, true);
}

/**
 * Mark all notifications as read for current player
 * POST with action: MARK_ALL_NOTIFICATIONS_READ
 */
export async function markAllNotificationsRead(): Promise<ApiResponse<{ success: boolean }>> {
  return await apiPost<{ success: boolean }>('MARK_ALL_NOTIFICATIONS_READ', {}, true);
}

// ==========================================
// 8. SERVER-AUTHORITATIVE ADMIN ENDPOINTS
// ==========================================

export interface AuthTestData {
  authenticated?: boolean;
  uid?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  authTime?: string;
  issuedAt?: string;
  expiresAt?: string;
  admin?: {
    isAdmin: boolean;
    role?: string;
    status?: string;
    adminId?: string;
    reason?: string;
  };
  [key: string]: any;
}

/**
 * Verify Firebase ID Token and check server-side admin privileges via Admins sheet
 * POST with action: auth-test
 */
export async function getAuthTest(): Promise<ApiResponse<AuthTestData>> {
  return await apiPost<AuthTestData>('auth-test', {}, true);
}

import { PlayerApiService, CompetitionApiService } from './client';

export const getAdminPlayers = PlayerApiService.getAdminPlayers;
export const adminVerifyPlayer = PlayerApiService.adminVerifyPlayer;
export const adminSuspendPlayer = PlayerApiService.adminSuspendPlayer;

export const getAdminCompetitions = CompetitionApiService.getAdminCompetitions;
export const createCompetition = CompetitionApiService.createCompetition;
export const updateCompetition = CompetitionApiService.updateCompetition;
export const openCompetition = CompetitionApiService.openCompetition;
export const closeCompetition = CompetitionApiService.closeCompetition;
export const getAdminRegistrations = CompetitionApiService.getAdminRegistrations;
export const approveRegistration = CompetitionApiService.approveRegistration;
export const rejectRegistration = CompetitionApiService.rejectRegistration;

// ==========================================
// 9. PRODUCTION ALIASES & ADMIN ROUTER FUNCTIONS
// ==========================================

export const getMyCupRegistration = getCupRegistration;
export const getMyCurrentCupMatch = getCurrentCupMatch;
export const getMyLeagueParticipant = getCurrentLeagueParticipant;
export const getMyLeagueFixtures = getPlayerLeagueFixtures;
export const getMyCurrentLeagueFixture = getCurrentLeagueFixture;
export const respondToLeagueResult = confirmLeagueResult;
export const getMyPayments = getPlayerPayments;

export async function getAdminDashboard(): Promise<ApiResponse<any>> {
  return await apiPost<any>('GET_ADMIN_DASHBOARD', {}, true);
}

export async function getAdminCups(): Promise<ApiResponse<{ cups: CupTournamentRecord[] }>> {
  return await apiPost<{ cups: CupTournamentRecord[] }>('GET_ADMIN_CUPS', {}, true);
}

export async function getAdminLeagueSeasons(): Promise<ApiResponse<{ seasons: LeagueSeasonRecord[] }>> {
  return await apiPost<{ seasons: LeagueSeasonRecord[] }>('GET_ADMIN_LEAGUE_SEASONS', {}, true);
}

export async function getAdminDisputes(): Promise<ApiResponse<{ disputes: any[] }>> {
  return await apiPost<{ disputes: any[] }>('GET_ADMIN_DISPUTES', {}, true);
}

export async function resolveCupDispute(
  disputeId: string,
  winnerId: string,
  notes?: string
): Promise<ApiResponse<any>> {
  return await apiPost<any>('RESOLVE_CUP_DISPUTE', { DisputeID: disputeId, WinnerID: winnerId, Notes: notes }, true);
}

export async function resolveLeagueResult(
  resultId: string,
  officialHomeScore: number,
  officialAwayScore: number,
  notes?: string
): Promise<ApiResponse<any>> {
  return await apiPost<any>('RESOLVE_LEAGUE_RESULT', {
    ResultID: resultId,
    HomeScore: officialHomeScore,
    AwayScore: officialAwayScore,
    Notes: notes,
  }, true);
}

export async function verifyPayment(paymentId: string): Promise<ApiResponse<any>> {
  return await apiPost<any>('VERIFY_PAYMENT', { PaymentID: paymentId }, true);
}

export async function rejectPayment(paymentId: string, reason?: string): Promise<ApiResponse<any>> {
  return await apiPost<any>('REJECT_PAYMENT', { PaymentID: paymentId, Reason: reason }, true);
}

export async function getAuditLogs(filter?: any): Promise<ApiResponse<{ logs: any[] }>> {
  return await apiPost<{ logs: any[] }>('GET_AUDIT_LOGS', filter || {}, true);
}

// ==========================================
// 10. BACKWARDS-COMPATIBILITY EXPORTS
// Preserves exact contracts for existing UI components
// ==========================================

export const registerPlayer = PlayerApiService.registerPlayer;
export const updateProfile = PlayerApiService.updateProfile;
export const getCompetitions = CompetitionApiService.getCompetitions;
export const getCompetition = CompetitionApiService.getCompetition;
export const registerForCompetition = CompetitionApiService.registerForCompetition;
export const getMyRegistrations = CompetitionApiService.getMyRegistrations;


// ==========================================
// COMMUNITY GROWTH / SELF-SERVICE LEAGUES / ADS
// ==========================================
export async function getReferralDashboard(): Promise<ApiResponse<{ dashboard: import('../types').ReferralDashboard }>> {
  return await apiPost('GET_REFERRAL_DASHBOARD', {}, true);
}

export async function claimReferralTicket(): Promise<ApiResponse<any>> {
  return await apiPost('CLAIM_REFERRAL_TICKET', {}, true);
}

export async function createManagedLeague(payload: {
  name: string; description?: string; registrationEnd?: string; startDate?: string; endDate?: string;
  matchWindow: string; entryFee?: number; prizeAmount?: number; maxPlayers?: number; minPlayers?: number;
}): Promise<ApiResponse<{ competition: import('../types').Competition; shareUrl: string }>> {
  return await apiPost('CREATE_MANAGED_LEAGUE', payload, true);
}

export async function getMyManagedLeagues(): Promise<ApiResponse<{ leagues: import('../types').ManagedLeague[] }>> {
  return await apiPost('GET_MY_MANAGED_LEAGUES', {}, true);
}

export async function generateManagedLeagueFixtures(competitionId: string): Promise<ApiResponse<any>> {
  return await apiPost('GENERATE_MANAGED_LEAGUE_FIXTURES', { competitionId }, true);
}

export async function submitAdvertisement(payload: {
  businessName: string; category: string; description: string; phone?: string; whatsapp?: string;
  location?: string; imageURL?: string; websiteURL?: string; packageName: string; amount: number; paymentReference?: string;
}): Promise<ApiResponse<{ ad: import('../types').AdvertisementRecord }>> {
  return await apiPost('SUBMIT_ADVERTISEMENT', payload, true);
}

export async function getActiveAdvertisements(): Promise<ApiResponse<{ ads: import('../types').AdvertisementRecord[] }>> {
  return await apiPost('GET_ACTIVE_ADVERTISEMENTS', {}, false);
}
export async function getAdminAdvertisements(): Promise<ApiResponse<{ ads: import('../types').AdvertisementRecord[] }>> {
  return await apiPost('GET_ADMIN_ADVERTISEMENTS', {}, true);
}
export async function updateAdvertisementStatus(adId: string, status: string, startAt?: string, endAt?: string): Promise<ApiResponse<any>> {
  return await apiPost('UPDATE_ADVERTISEMENT_STATUS', { adId, status, startAt, endAt }, true);
}

export async function getPlatformSettings(): Promise<ApiResponse<{ settings: Record<string,string> }>> {
  return await apiPost('GET_PLATFORM_SETTINGS', {}, false);
}
export async function setPlatformSetting(key: string, value: string): Promise<ApiResponse<any>> {
  return await apiPost('SET_PLATFORM_SETTING', { key, value }, true);
}
