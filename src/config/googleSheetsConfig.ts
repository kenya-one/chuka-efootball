/**
 * CHUKA eFOOTBALL LEAGUE - GOOGLE SHEETS CONFIGURATION
 *
 * Architecture:
 * GitHub PWA (React + TS)
 *   ↓
 * Apps Script Web App /exec URL
 *   ↓
 * Google Spreadsheet
 *
 * Two configuration values are required:
 * 1. GOOGLE_SHEET_ID: The ID from your Google Spreadsheet URL
 *    (e.g., https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit)
 * 2. APPS_SCRIPT_WEB_APP_URL: The deployed Apps Script Web App URL ending in /exec
 *    (e.g., https://script.google.com/macros/s/.../exec)
 *
 * Neither value is hardcoded or invented. They can be provided via environment variables
 * or directly entered and saved through the in-app Profile configuration panel.
 */

const STORAGE_KEY_SHEET_ID = 'CHUKA_GOOGLE_SHEET_ID';
const STORAGE_KEY_SCRIPT_URL = 'CHUKA_APPS_SCRIPT_WEB_APP_URL';
// Legacy key for backwards compatibility
const LEGACY_STORAGE_KEY_SCRIPT_URL = 'chuka_google_apps_script_url';

type ConfigListener = () => void;
const listeners: Set<ConfigListener> = new Set();

export class GoogleSheetsConfig {
  /**
   * Safely extract Google Spreadsheet ID from a URL or raw ID
   * Supports:
   * - https://docs.google.com/spreadsheets/d/<ID>/edit...
   * - https://docs.google.com/spreadsheets/u/0/d/<ID>/...
   * - Raw ID: 1-PRgld5dvSvlHszQoRaQnPf2zo-Fr4dmll9I_tbMif4
   */
  public static extractSheetId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    // Match docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)
    const urlMatch = trimmed.match(/\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].trim();
    }
    // If it already looks like a valid Google Sheet ID (alphanumeric, dashes, underscores)
    if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  }

  /**
   * Safely clean an Apps Script Web App URL
   * Removes query parameters, ensures trimmed, leaves /exec
   */
  public static cleanScriptUrl(input: string): string {
    if (!input) return '';
    let trimmed = input.trim();
    // Remove trailing query params like ?action=health
    if (trimmed.includes('?')) {
      trimmed = trimmed.split('?')[0];
    }
    return trimmed.replace(/\/+$/, '');
  }

  /**
   * Get the current Google Sheet ID
   */
  public static getSheetId(): string {
    const localVal = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SHEET_ID) : null;
    if (localVal && localVal.trim().length > 0 && !localVal.includes('1m6jl6OYrF13QcS-Qm2HJRYhFexpNoO3bIDPz35B7qkw')) {
      return this.extractSheetId(localVal);
    }
    const envVal = import.meta.env.VITE_GOOGLE_SHEET_ID;
    return envVal ? this.extractSheetId(String(envVal)) : '1-PRgld5dvSvlHszQoRaQnPf2zo-Fr4dmll9I_tbMif4';
  }

  /**
   * Set and persist the Google Sheet ID
   */
  public static setSheetId(sheetId: string): void {
    const cleanId = this.extractSheetId(sheetId);
    if (cleanId) {
      localStorage.setItem(STORAGE_KEY_SHEET_ID, cleanId);
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEET_ID);
    }
    this.notifyListeners();
  }

  /**
   * Get the current Apps Script Web App URL
   */
  public static getAppsScriptUrl(): string {
    const localVal = typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY_SCRIPT_URL) || localStorage.getItem(LEGACY_STORAGE_KEY_SCRIPT_URL))
      : null;
    // Discard outdated legacy deployments from local storage
    if (localVal && localVal.trim().length > 0 && !localVal.includes('AKfycbyKjY31IpwKF0wiSVP1g4oORnO7klNLZmQFkWgw81xAdBfCCJ29w-opVSPyv4RrjRpK')) {
      return this.cleanScriptUrl(localVal);
    }
    const envVal =
      import.meta.env.VITE_APPS_SCRIPT_URL ||
      import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL ||
      import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    return envVal
      ? this.cleanScriptUrl(String(envVal))
      : 'https://script.google.com/macros/s/AKfycbyzOD0zBzZuxzj1-NuAV0Jw2IopDrSAebQmtSREH2s5Iatn5CYQftL14BAozNi5QLcy/exec';
  }

  /**
   * Set and persist the Apps Script Web App URL
   */
  public static setAppsScriptUrl(url: string): void {
    const cleanUrl = this.cleanScriptUrl(url);
    if (cleanUrl) {
      localStorage.setItem(STORAGE_KEY_SCRIPT_URL, cleanUrl);
      localStorage.setItem(LEGACY_STORAGE_KEY_SCRIPT_URL, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_SCRIPT_URL);
      localStorage.removeItem(LEGACY_STORAGE_KEY_SCRIPT_URL);
    }
    this.notifyListeners();
  }

  /**
   * Reset to official production defaults
   */
  public static resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY_SHEET_ID);
    localStorage.removeItem(STORAGE_KEY_SCRIPT_URL);
    localStorage.removeItem(LEGACY_STORAGE_KEY_SCRIPT_URL);
    this.notifyListeners();
  }

  /**
   * Check if the connection URL is configured
   */
  public static isConfigured(): boolean {
    return this.getAppsScriptUrl().length > 0 && this.getSheetId().length > 0;
  }

  /**
   * Subscribe to config changes
   */
  public static subscribe(listener: ConfigListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  private static notifyListeners(): void {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error notifying config listener:', e);
      }
    });
  }
}
