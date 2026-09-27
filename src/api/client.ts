import { getFirebaseIdToken } from '../firebase/auth';
import { GoogleSheetsConfig } from '../config/googleSheetsConfig';

export const APPS_SCRIPT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbyzOD0zBzZuxzj1-NuAV0Jw2IopDrSAebQmtSREH2s5Iatn5CYQftL14BAozNi5QLcy/exec';

export const BACKEND_URL = APPS_SCRIPT_BASE_URL;

/**
 * Direct Google Apps Script Web App API
 * The React frontend directly calls the authoritative Apps Script endpoint:
 *   GET https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?action=<action>&sheetId=<id>
 *   Authorization: Bearer <Firebase ID Token>
 *
 * Configured via VITE_APPS_SCRIPT_URL with fallback to the production endpoint or user-saved config.
 */
export const API_BASE_URL =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string) ||
  (import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL as string) ||
  APPS_SCRIPT_BASE_URL;

export interface ApiError {
  code?: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  requestId?: string;
  timestamp?: string;
  data?: T;
  error?: ApiError;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  authenticated?: boolean;
  timeoutMs?: number;
  retryOnAuthExpired?: boolean;
}

export class AppApiError extends Error {
  public code: string;
  public requestId?: string;
  public timestamp?: string;

  constructor(message: string, code = 'API_ERROR', requestId?: string, timestamp?: string) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.requestId = requestId;
    this.timestamp = timestamp;
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Resolves target URL supporting relative (/api) and absolute (https://...) URLs
   * Dynamically uses GoogleSheetsConfig.getAppsScriptUrl() if set.
   */
  private resolveUrl(params: Record<string, string | number | boolean> = {}): URL {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:3000';
    const dynamicBase = GoogleSheetsConfig.getAppsScriptUrl() || this.baseUrl;
    const url = new URL(dynamicBase, origin);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
    return url;
  }

  /**
   * Generates a client fallback request ID if none returned
   */
  private generateRequestId(): string {
    return 'req_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
  }

  /**
   * GET Request
   * Public requests only (health, system, database, competitions, competition, etc.)
   * If authenticated = true, automatically routes to POST with idToken in body
   *
   * Firebase ID tokens are NEVER placed in query parameters or URL paths.
   */
  public async get<T = any>(
    params: Record<string, string | number | boolean> = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // If authenticated operation, route to POST with JSON body containing idToken
    if (options.authenticated) {
      const { action, ...restParams } = params;
      return await this.post<T>(restParams, { action: String(action || '') }, options);
    }

    // Automatically inject active Google Sheet ID if not explicitly specified
    const activeParams = { ...params };
    const sheetId = GoogleSheetsConfig.getSheetId();
    if (sheetId && !activeParams.sheetId) {
      activeParams.sheetId = sheetId;
    }

    const url = this.resolveUrl(activeParams);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        redirect: 'follow',
      });

      return await this.handleResponse<T>(response);
    } catch (err: any) {
      return this.handleNetworkError<T>(err);
    }
  }

  /**
   * POST Request
   * For authenticated requests:
   *   Retrieves Firebase ID token and passes { "action": "...", "idToken": token, ...body } in JSON body.
   *   Apps Script Web Apps reliably receive POST JSON payloads in e.postData.contents.
   *   Tokens and authorization credentials are NEVER placed in headers or query strings.
   *   If token is expired (AUTH_EXPIRED), forces refresh once and retries automatically.
   */
  public async post<T = any>(
    body: any = {},
    params: Record<string, string | number | boolean> = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const action = String(params.action || body?.action || '');
    let token: string | null = null;

    if (options.authenticated) {
      token = await getFirebaseIdToken(false);
      if (!token) {
        return {
          success: false,
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Firebase authentication is required.',
          },
        };
      }
    }

    // Prepare JSON payload with action and idToken in the body
    const payload: Record<string, any> = {
      ...(typeof body === 'object' && body !== null ? body : {}),
    };
    if (action) {
      payload.action = action;
    }
    // Include any additional parameter filters in payload
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'action' && payload[key] === undefined) {
        payload[key] = value;
      }
    });

    // Automatically inject active Google Sheet ID if not explicitly specified
    const sheetId = GoogleSheetsConfig.getSheetId();
    if (sheetId && !payload.sheetId) {
      payload.sheetId = sheetId;
    }

    if (token) {
      payload.idToken = token;
    }

    // Call POST with JSON body, no Authorization header, no query tokens
    const queryParams: Record<string, string | number | boolean> = {};
    if (sheetId) {
      queryParams.sheetId = sheetId;
    }
    const url = this.resolveUrl(queryParams);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const parsed = await this.handleResponse<T>(response);

      // If token expired and retry not yet performed, force refresh token and retry once
      if (
        options.authenticated &&
        options.retryOnAuthExpired !== false &&
        parsed.error?.code === 'AUTH_EXPIRED'
      ) {
        const freshToken = await getFirebaseIdToken(true);
        if (freshToken) {
          payload.idToken = freshToken;
          const retryRes = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
              Accept: 'application/json',
              ...(options.headers || {}),
            },
            body: JSON.stringify(payload),
            redirect: 'follow',
          });
          return await this.handleResponse<T>(retryRes);
        }
      }

      return parsed;
    } catch (err: any) {
      return this.handleNetworkError<T>(err);
    }
  }

  /**
   * Parse and validate standard response format
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const fallbackRequestId = this.generateRequestId();
    const nowIso = new Date().toISOString();

    let rawText = '';
    try {
      rawText = await response.text();
    } catch (readErr: any) {
      return {
        success: false,
        requestId: fallbackRequestId,
        timestamp: nowIso,
        error: {
          code: 'RESPONSE_READ_ERROR',
          message: `Unable to read response body: ${readErr?.message || 'Read error'}`,
        },
      };
    }

    // Try parsing as JSON
    let json: any;
    try {
      json = JSON.parse(rawText);
    } catch {
      const isHtml = rawText.trim().startsWith('<');
      const cleanMsg = isHtml
        ? `Apps Script endpoint returned an HTML page (HTTP ${response.status}). Please ensure Web App deployment has 'Who has access: Anyone'.`
        : `Endpoint returned non-JSON response (HTTP ${response.status}).`;

      return {
        success: false,
        requestId: fallbackRequestId,
        timestamp: nowIso,
        error: {
          code: 'INVALID_JSON_RESPONSE',
          message: cleanMsg,
        },
      };
    }

    if (typeof json === 'object' && json !== null) {
      const isSuccess = Boolean(json.success);
      return {
        success: isSuccess,
        requestId: json.requestId || fallbackRequestId,
        timestamp: json.timestamp || nowIso,
        data: (json.data !== undefined ? json.data : isSuccess ? json : undefined) as T,
        error: json.error
          ? {
              code: json.error.code || 'UNKNOWN_ERROR',
              message: json.error.message || 'An unknown error occurred.',
            }
          : !isSuccess
          ? {
              code: json.code || 'BACKEND_ERROR',
              message: json.message || 'Apps Script returned failure without an error message.',
            }
          : undefined,
      };
    }

    return {
      success: true,
      requestId: fallbackRequestId,
      timestamp: nowIso,
      data: json as T,
    };
  }

  /**
   * Handle fetch/network level errors without logging credentials or authorization headers
   */
  private handleNetworkError<T>(err: any): ApiResponse<T> {
    console.warn('[API Client Network Notice]:', err?.message || err);
    return {
      success: false,
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      error: {
        code: 'NETWORK_ERROR',
        message: err?.message || 'Failed to reach Apps Script backend. Check internet connection or CORS.',
      },
    };
  }
}

// Export default singleton client
export const apiClient = new ApiClient();

/**
 * Standard API Client Convenience Helpers
 * For public requests:
 *   apiGet('health') -> GET ?action=health
 * For authenticated requests:
 *   apiGet('actionName', {}, true) -> POST with { action: 'actionName', idToken: '...' } in JSON body
 *   apiPost('actionName', body, true) -> POST with { action: 'actionName', idToken: '...', ...body } in JSON body
 */
export async function apiGet<T = any>(
  action: string,
  params: Record<string, string | number | boolean> = {},
  authenticated = false
): Promise<ApiResponse<T>> {
  return await apiClient.get<T>({ action, ...params }, { authenticated });
}

export async function apiPost<T = any>(
  action: string,
  body: any = {},
  authenticated = false,
  params: Record<string, string | number | boolean> = {}
): Promise<ApiResponse<T>> {
  return await apiClient.post<T>(body, { action, ...params }, { authenticated });
}

/**
 * Standard typed API request function for authenticated Apps Script operations.
 * Throws AppApiError when response.success === false.
 * Sends { action, idToken, ...data } in POST JSON body.
 */
export async function apiRequest<T = any>(
  action: string,
  data: Record<string, any> = {}
): Promise<T> {
  const res = await apiClient.post<T>(data, { action }, { authenticated: true });
  if (!res.success) {
    throw new AppApiError(
      res.error?.message || `API request failed for action: ${action}`,
      res.error?.code || 'UNKNOWN_ERROR',
      res.requestId,
      res.timestamp
    );
  }
  return res.data as T;
}

/**
 * Standard typed API request function for public unauthenticated operations.
 * Throws AppApiError when response.success === false.
 */
export async function apiPublicGet<T = any>(
  action: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const res = await apiClient.get<T>({ action, ...params }, { authenticated: false });
  if (!res.success) {
    throw new AppApiError(
      res.error?.message || `Public API request failed for action: ${action}`,
      res.error?.code || 'UNKNOWN_ERROR',
      res.requestId,
      res.timestamp
    );
  }
  return res.data as T;
}

/**
 * =========================================================================
 * SETUP 6: TYPED API SERVICES
 * =========================================================================
 */
import type { Player, PlayerMeResponse, AdminPlayersResponse, ProfileCompletion } from '../types';

export const PlayerApiService = {
  /**
   * Retrieves the current authenticated user's player profile
   */
  async getMyProfile(): Promise<ApiResponse<PlayerMeResponse>> {
    return await apiGet<PlayerMeResponse>('player-me', {}, true);
  },

  /**
   * Registers a new player profile
   */
  async registerPlayer(data: {
    DisplayName: string;
    eFootballUsername: string;
    Phone: string;
    Division?: string;
  }): Promise<ApiResponse<{ player: Player; completion: ProfileCompletion }>> {
    return await apiPost<{ player: Player; completion: ProfileCompletion }>(
      'player-create',
      data,
      true
    );
  },

  /**
   * Updates an existing player profile
   */
  async updateProfile(data: {
    DisplayName?: string;
    eFootballUsername?: string;
    Phone?: string;
    Division?: string;
  }): Promise<ApiResponse<{ player: Player; completion: ProfileCompletion }>> {
    return await apiPost<{ player: Player; completion: ProfileCompletion }>(
      'player-update',
      data,
      true
    );
  },

  /**
   * Uploads player profile photo (JPEG/PNG/WebP base64) to Drive
   */
  async uploadProfilePhoto(
    fileData: string,
    mimeType: string,
    fileName?: string
  ): Promise<ApiResponse<{ fileId: string; url: string; player: Player; completion: ProfileCompletion }>> {
    return await apiPost<{ fileId: string; url: string; player: Player; completion: ProfileCompletion }>(
      'player-upload-profile-photo',
      { fileData, mimeType, fileName },
      true
    );
  },

  /**
   * Uploads squad screenshot (JPEG/PNG/WebP base64) to Google Drive via Apps Script
   */
  async uploadSquadScreenshot(
    fileData: string,
    mimeType: string,
    fileName?: string
  ): Promise<ApiResponse<{ fileId: string; url: string; player: Player; completion: ProfileCompletion }>> {
    const { uploadSquadScreenshot } = await import('./endpoints');
    return await uploadSquadScreenshot(fileData, mimeType, fileName);
  },

  /**
   * Removes squad screenshot from Google Drive and Users sheet
   */
  async deleteSquadScreenshot(): Promise<ApiResponse<{ player: Player; completion: ProfileCompletion }>> {
    const { deleteSquadScreenshot } = await import('./endpoints');
    return await deleteSquadScreenshot();
  },

  /**
   * Admin: List, search, and filter players
   */
  async getAdminPlayers(filter: {
    search?: string;
    status?: string;
    division?: string;
    verified?: string;
  } = {}): Promise<ApiResponse<AdminPlayersResponse>> {
    return await apiGet<AdminPlayersResponse>('admin-players', filter, true);
  },

  /**
   * Admin: Verify and activate player
   */
  async adminVerifyPlayer(playerId: string): Promise<ApiResponse<{ player: Player }>> {
    return await apiPost<{ player: Player }>('admin-player-verify', { PlayerID: playerId }, true);
  },

  /**
   * Admin: Suspend player
   */
  async adminSuspendPlayer(playerId: string): Promise<ApiResponse<{ player: Player }>> {
    return await apiPost<{ player: Player }>('admin-player-suspend', { PlayerID: playerId }, true);
  },
};

/**
 * =========================================================================
 * SETUP 7: COMPETITIONS & REGISTRATION API SERVICE
 * =========================================================================
 */
import type {
  Competition,
  CompetitionRegistration,
  CompetitionsResponse,
  CompetitionDetailResponse,
  AdminCompetitionsResponse,
  AdminRegistrationsResponse,
} from '../types';

export const CompetitionApiService = {
  /**
   * Public competition discovery: lists all competitions suitable for discovery
   * GET ?action=competitions with automatic fallback to GET_UPCOMING_CUPS / GET_CURRENT_LEAGUE
   */
  async getCompetitions(filter: {
    type?: string;
    division?: string;
    status?: string;
    search?: string;
  } = {}): Promise<ApiResponse<CompetitionsResponse>> {
    const res = await apiGet<CompetitionsResponse>('competitions', filter, false);
    if (res.success) {
      return res;
    }

    // Secondary attempt with getCompetitions action name if 'competitions' failed
    try {
      const altRes = await apiGet<CompetitionsResponse>('getCompetitions', filter, false);
      if (altRes.success) {
        return altRes;
      }
    } catch {
      // Fall through to original response
    }

    return res;
  },

  /**
   * Public competition detail: returns full details, capacity, and current state
   * GET ?action=competition&id=<CompetitionID>
   */
  async getCompetition(competitionId: string): Promise<ApiResponse<CompetitionDetailResponse>> {
    return await apiGet<CompetitionDetailResponse>('competition', { id: competitionId }, true);
  },

  /**
   * Player registration: registers authenticated player for a competition
   * POST ?action=competition-register with body { CompetitionID }
   */
  async registerForCompetition(
    competitionId: string
  ): Promise<ApiResponse<{ registration: CompetitionRegistration }>> {
    return await apiPost<{ registration: CompetitionRegistration }>(
      'competition-register',
      { CompetitionID: competitionId },
      true
    );
  },

  /**
   * My registrations: returns all registrations for current authenticated player
   * GET ?action=my-registrations
   */
  async getMyRegistrations(): Promise<ApiResponse<{ registrations: CompetitionRegistration[] }>> {
    return await apiGet<{ registrations: CompetitionRegistration[] }>('my-registrations', {}, true);
  },

  /**
   * Admin: List competitions for administration with full metadata & stats
   * GET ?action=admin-competitions
   */
  async getAdminCompetitions(filter: {
    type?: string;
    division?: string;
    status?: string;
    search?: string;
  } = {}): Promise<ApiResponse<AdminCompetitionsResponse>> {
    return await apiGet<AdminCompetitionsResponse>('admin-competitions', filter, true);
  },

  /**
   * Admin: Create a new competition in DRAFT status
   * POST ?action=admin-competition-create
   */
  async createCompetition(
    data: Partial<Competition>
  ): Promise<ApiResponse<{ competition: Competition }>> {
    return await apiPost<{ competition: Competition }>('admin-competition-create', data, true);
  },

  /**
   * Admin: Update competition configuration
   * POST ?action=admin-competition-update
   */
  async updateCompetition(
    competitionId: string,
    data: Partial<Competition>
  ): Promise<ApiResponse<{ competition: Competition }>> {
    return await apiPost<{ competition: Competition }>(
      'admin-competition-update',
      { CompetitionID: competitionId, ...data },
      true
    );
  },

  /**
   * Admin: Publish competition from DRAFT to OPEN
   * POST ?action=admin-competition-open
   */
  async openCompetition(competitionId: string): Promise<ApiResponse<{ competition: Competition }>> {
    return await apiPost<{ competition: Competition }>(
      'admin-competition-open',
      { CompetitionID: competitionId },
      true
    );
  },

  /**
   * Admin: Close competition registration (OPEN to CLOSED)
   * POST ?action=admin-competition-close
   */
  async closeCompetition(competitionId: string): Promise<ApiResponse<{ competition: Competition }>> {
    return await apiPost<{ competition: Competition }>(
      'admin-competition-close',
      { CompetitionID: competitionId },
      true
    );
  },

  /**
   * Admin: List registrations with filtering
   * GET ?action=admin-registrations
   */
  async getAdminRegistrations(filter: {
    competitionId?: string;
    status?: string;
    paymentStatus?: string;
    division?: string;
  } = {}): Promise<ApiResponse<AdminRegistrationsResponse>> {
    return await apiGet<AdminRegistrationsResponse>('admin-registrations', filter, true);
  },

  /**
   * Admin: Approve registration
   * POST ?action=admin-registration-approve
   */
  async approveRegistration(
    registrationId: string
  ): Promise<ApiResponse<{ registration: CompetitionRegistration }>> {
    return await apiPost<{ registration: CompetitionRegistration }>(
      'admin-registration-approve',
      { RegistrationID: registrationId },
      true
    );
  },

  /**
   * Admin: Reject registration
   * POST ?action=admin-registration-reject
   */
  async rejectRegistration(
    registrationId: string
  ): Promise<ApiResponse<{ registration: CompetitionRegistration }>> {
    return await apiPost<{ registration: CompetitionRegistration }>(
      'admin-registration-reject',
      { RegistrationID: registrationId },
      true
    );
  },
};

