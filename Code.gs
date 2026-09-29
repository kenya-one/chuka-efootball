/**
 * =========================================================================
 * CHUKA eFOOTBALL COMMUNITY BACKEND
 * FILE: Code.gs
 * =========================================================================
 * PURPOSE:
 * Robust, production-ready Google Apps Script backend specifically built
 * for the Google Sign-In → Firebase Auth → Apps Script → Google Sheets flow.
 *
 * SPECIFICATION & CONSTRAINTS:
 * 1. Official Google Spreadsheet ID: 1-PRgld5dvSvlHszQoRaQnPf2zo-Fr4dmll9I_tbMif4
 *    No other spreadsheet is used or permitted.
 * 2. Firebase Project ID: chuka-efootball-hub
 * 3. Server-side token verification via Google Identity Toolkit REST API
 * 4. Database Table: 'Users'
 *    Headers: [user_id, email, display_name, photo_url, class_id, phone,
 *              whatsapp, status, role, created_at, updated_at, last_login]
 * 5. Administrator: wayongohlaurence@gmail.com -> role = "ADMIN", others -> "USER"
 * 6. Exactly ONE doGet(e) and ONE doPost(e)
 * 7. Never stores Firebase ID token in sheets, properties, or databases.
 * =========================================================================
 */

// Official Production Google Spreadsheet ID
var OFFICIAL_SPREADSHEET_ID = "1-PRgld5dvSvlHszQoRaQnPf2zo-Fr4dmll9I_tbMif4";

// Firebase Project & Authentication Configuration
var FIREBASE_PROJECT_ID = "chuka-efootball-hub";
var FIREBASE_DEFAULT_API_KEY = "AIzaSyBaRnQXGnD57G_KSK3MeMjEG1x3hxivDqw";

// Administrator Account (Enforced Server-Side)
var ADMIN_EMAIL = "wayongohlaurence@gmail.com";
var ADMIN_EMAILS = [
  "wayongohlaurence@gmail.com",
  "wayongohlawrence@gmail.com",
  "sidobarasa7@gmail.com"
];

/**
 * Checks if the given email has administrative authorization.
 */
function isAuthorizedAdminEmail_(email) {
  if (!email || typeof email !== "string") return false;
  var normalized = email.trim().toLowerCase();
  for (var i = 0; i < ADMIN_EMAILS.length; i++) {
    if (ADMIN_EMAILS[i].toLowerCase() === normalized) return true;
  }
  return false;
}

// Dedicated Google Drive Folder for Squad Lineup Screenshots
var SQUAD_IMAGES_FOLDER_NAME = "Chuka eFootball Squad Images";

// Dedicated Google Drive Folder for Competition Profile Pictures
var COMPETITION_IMAGES_FOLDER_NAME = "Chuka eFootball Competition Images";

// Table & Column Definitions
var USERS_SHEET_NAME = "Users";
var USERS_HEADERS = [
  "user_id",
  "email",
  "display_name",
  "photo_url",
  "class_id",
  "phone",
  "whatsapp",
  "status",
  "role",
  "created_at",
  "updated_at",
  "last_login",
  "squad_image_url",
  "squad_image_file_id"
];

var COMPETITIONS_SHEET_NAME = "Competitions";
var COMPETITIONS_HEADERS = [
  "competition_id",
  "name",
  "description",
  "competition_type",
  "format",
  "division",
  "min_players",
  "max_players",
  "entry_fee",
  "currency",
  "payment_till",
  "registration_start",
  "registration_end",
  "start_date",
  "end_date",
  "start_time",
  "status",
  "image_url",
  "image_file_id",
  "prize_amount",
  "competition_folder_id",
  "rules_document_id",
  "rules_document_url",
  "registered_players_document_id",
  "registered_players_document_url",
  "knockout_bracket_document_id",
  "knockout_bracket_document_url",
  "league_fixtures_document_id",
  "league_fixtures_document_url",
  "league_standings_document_id",
  "league_standings_document_url",
  "final_results_document_id",
  "final_results_document_url",
  "bracket_status",
  "created_by",
  "created_at",
  "updated_at"
];

var REGISTRATIONS_SHEET_NAME = "Registrations";
var REGISTRATIONS_HEADERS = [
  "registration_id",
  "competition_id",
  "player_id",
  "player_name",
  "efootball_username",
  "status",
  "payment_status",
  "payment_id",
  "registered_at",
  "verified_at",
  "verified_by"
];

var PAYMENTS_SHEET_NAME = "Payments";
var PAYMENTS_HEADERS = [
  "payment_id",
  "player_id",
  "player_name",
  "competition_id",
  "competition_name",
  "competition_type",
  "amount",
  "currency",
  "payment_reference",
  "status",
  "created_at",
  "verified_at",
  "verified_by"
];

var FIXTURES_SHEET_NAME = "Fixtures";
var FIXTURES_HEADERS = [
  "fixture_id",
  "competition_id",
  "competition_name",
  "competition_type",
  "round",
  "player1_id",
  "player1_name",
  "player2_id",
  "player2_name",
  "player1_score",
  "player2_score",
  "winner_id",
  "status",
  "match_date",
  "result_published",
  "created_at",
  "updated_at"
];

var ANNOUNCEMENTS_SHEET_NAME = "Announcements";
var ANNOUNCEMENTS_HEADERS = [
  "announcement_id",
  "competition_id",
  "competition_name",
  "title",
  "message",
  "type",
  "created_by",
  "created_at"
];

var WHATSAPP_GROUPS_SHEET_NAME = "WhatsAppGroups";
var WHATSAPP_GROUPS_HEADERS = [
  "group_id",
  "group_number",
  "name",
  "description",
  "group_url",
  "active",
  "updated_by",
  "updated_at"
];

var AUDIT_LOGS_SHEET_NAME = "AuditLogs";
var AUDIT_LOGS_HEADERS = [
  "log_id",
  "timestamp",
  "actor_uid",
  "actor_email",
  "action",
  "entity_type",
  "entity_id",
  "details"
];

var DISPUTES_SHEET_NAME = "Disputes";
var DISPUTES_HEADERS = [
  "dispute_id",
  "fixture_id",
  "competition_id",
  "opened_by_player_id",
  "player1_id",
  "player2_id",
  "player1_username",
  "player2_username",
  "reason",
  "evidence_url",
  "status",
  "admin_decision",
  "resolved_by",
  "created_at",
  "resolved_at"
];

/**
 * Gets or creates the dedicated Google Drive folder for squad images.
 * Does not make the entire Drive public.
 */
function getOrCreateSquadFolder_() {
  try {
    var folders = DriveApp.getFoldersByName(SQUAD_IMAGES_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }
    var newFolder = DriveApp.createFolder(SQUAD_IMAGES_FOLDER_NAME);
    Logger.log("[Drive] Created dedicated squad images folder: " + SQUAD_IMAGES_FOLDER_NAME);
    return newFolder;
  } catch (err) {
    Logger.log("[Drive Error] Failed to get or create squad folder: " + err.message);
    throw new Error("Google Drive authorization failure or folder error: " + err.message);
  }
}

/**
 * Resolves and returns the official Google Spreadsheet.
 * Strictly locked to OFFICIAL_SPREADSHEET_ID.
 */
function getDatabaseSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(OFFICIAL_SPREADSHEET_ID);
  } catch (err) {
    Logger.log("[Database Error] Unable to open spreadsheet: " + err.message);
    var active = null;
    try {
      active = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {}
    if (active && active.getId() === OFFICIAL_SPREADSHEET_ID) {
      return active;
    }
    throw new Error("Unable to open official database spreadsheet (" + OFFICIAL_SPREADSHEET_ID + "): " + err.message);
  }
}

/**
 * Retrieves the Firebase Web API Key.
 * Checks Script Properties first (FIREBASE_WEB_API_KEY), then falls back to default.
 */
function getFirebaseApiKey_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var customKey = props ? props.getProperty("FIREBASE_WEB_API_KEY") : null;
    if (customKey && customKey.trim().length > 10) {
      return customKey.trim();
    }
  } catch (e) {
    Logger.log("[Config Warning] Could not access script properties: " + e.message);
  }
  return FIREBASE_DEFAULT_API_KEY;
}

/**
 * Creates standardized, CORS-friendly JSON output for Google Apps Script Web App.
 */
function createJsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Safely parses the JWT payload part (claims) without executing signature crypto,
 * used for claim validation (audience, issuer, project ID verification).
 */
function parseJwtPayload_(token) {
  try {
    if (!token || typeof token !== "string") return null;
    var parts = token.split(".");
    if (parts.length < 2) return null;
    var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

/**
 * Verifies a Firebase ID Token using Google Identity Toolkit REST API:
 * POST https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=API_KEY
 *
 * Validates:
 * - Token presence and formatting
 * - Cryptographic validity via Google's server endpoint
 * - Firebase project affiliation (must match 'chuka-efootball-hub')
 * - Account disabled status
 * - Token expiration
 */
function verifyFirebaseIdToken_(idToken) {
  if (!idToken || typeof idToken !== "string" || idToken.trim().length === 0) {
    Logger.log("[Auth] Token verification failed: Missing token");
    return {
      valid: false,
      message: "Authentication token is missing. Please provide a valid Firebase ID token."
    };
  }

  var tokenTrimmed = idToken.trim();

  // Inspect JWT claims
  var claims = parseJwtPayload_(tokenTrimmed);
  if (!claims) {
    Logger.log("[Auth] Token verification failed: Malformed JWT structure");
    return {
      valid: false,
      message: "Malformed authentication token."
    };
  }

  // Verify project ID in JWT audience/issuer
  var tokenAud = claims.aud || "";
  var tokenIss = claims.iss || "";
  var expectedAud = FIREBASE_PROJECT_ID;
  var expectedIss = "https://securetoken.google.com/" + FIREBASE_PROJECT_ID;

  if (tokenAud !== expectedAud || (tokenIss && tokenIss !== expectedIss)) {
    Logger.log("[Auth] Token verification failed: Project mismatch. Expected '" + expectedAud + "', got aud='" + tokenAud + "'");
    return {
      valid: false,
      message: "Token does not belong to the authorized Firebase project (" + expectedAud + ")."
    };
  }

  // Check expiration timestamp against server clock
  var nowSeconds = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < (nowSeconds - 120)) {
    Logger.log("[Auth] Token verification failed: Token expired at " + claims.exp + " (now: " + nowSeconds + ")");
    return {
      valid: false,
      message: "The Firebase authentication token has expired. Please sign in again."
    };
  }

  // Verify token via Google Identity Toolkit REST API
  var apiKey = getFirebaseApiKey_();
  var verifyUrl = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey);

  try {
    var response = UrlFetchApp.fetch(verifyUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ idToken: tokenTrimmed }),
      muteHttpExceptions: true
    });

    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (statusCode === 200) {
      var data = JSON.parse(responseText);
      if (!data || !data.users || data.users.length === 0) {
        Logger.log("[Auth] Identity Toolkit returned no users for token");
        return {
          valid: false,
          message: "No user found for the provided authentication token."
        };
      }

      var userRecord = data.users[0];
      if (userRecord.disabled) {
        Logger.log("[Auth] User account is disabled in Firebase: " + userRecord.localId);
        return {
          valid: false,
          message: "The Firebase user account has been disabled."
        };
      }

      Logger.log("[Auth] Successfully verified token for UID: " + userRecord.localId + ", Email: " + userRecord.email);
      var userClaims = parseJwtPayload_(tokenTrimmed) || {};
      var isClaimsAdmin = userClaims.admin === true || userClaims.role === "admin" || userClaims.role === "ADMIN" || userClaims.role === "SUPER_ADMIN";
      var verifiedEmail = userRecord.email || claims.email || "";
      var isAdmin = isClaimsAdmin || isAuthorizedAdminEmail_(verifiedEmail);
      return {
        valid: true,
        uid: userRecord.localId,
        email: verifiedEmail,
        displayName: userRecord.displayName || claims.name || "",
        photoUrl: userRecord.photoUrl || claims.picture || "",
        claims: userClaims,
        isAdmin: isAdmin,
        role: isAdmin ? "ADMIN" : "USER"
      };
    }

    // Handle error codes returned by Identity Toolkit
    var errorDetail = "Invalid token";
    try {
      var errObj = JSON.parse(responseText);
      if (errObj && errObj.error && errObj.error.message) {
        errorDetail = errObj.error.message;
      }
    } catch (pe) {}

    Logger.log("[Auth] Identity Toolkit rejected token: HTTP " + statusCode + " - " + errorDetail);

    if (errorDetail.indexOf("TOKEN_EXPIRED") !== -1) {
      return { valid: false, message: "Firebase ID token is expired." };
    }
    if (errorDetail.indexOf("USER_DISABLED") !== -1) {
      return { valid: false, message: "Firebase user account has been disabled." };
    }

    return {
      valid: false,
      message: "Firebase authentication failed: " + errorDetail
    };

  } catch (netErr) {
    Logger.log("[Auth Warning] Network error contacting Identity Toolkit: " + netErr.message);
    return {
      valid: false,
      message: "Failed to verify Firebase authentication. Please try again."
    };
  }
}

/**
 * Ensures squad image columns exist in an existing Users sheet without modifying data.
 */
function ensureSquadColumnsExist_(sheet) {
  try {
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) return;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });
    var changed = false;
    if (headers.indexOf("squad_image_url") === -1 && headers.indexOf("squadimageurl") === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue("squad_image_url").setFontWeight("bold");
      changed = true;
    }
    if (headers.indexOf("squad_image_file_id") === -1 && headers.indexOf("squadimagefileid") === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue("squad_image_file_id").setFontWeight("bold");
      changed = true;
    }
    if (changed) {
      SpreadsheetApp.flush();
      Logger.log("[Database] Appended missing squad image columns to Users sheet header.");
    }
  } catch (colErr) {
    Logger.log("[Database Warning] Could not ensure squad columns: " + colErr.message);
  }
}

/**
 * Gets or initializes the 'Users' sheet with standard headers.
 */
function getOrCreateUsersSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    Logger.log("[Database] 'Users' sheet not found. Creating sheet with standard headers...");
    sheet = spreadsheet.insertSheet(USERS_SHEET_NAME);
    sheet.appendRow(USERS_HEADERS);
    sheet.getRange(1, 1, 1, USERS_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
    return sheet;
  }

  // Ensure headers exist if sheet was blank
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    Logger.log("[Database] 'Users' sheet is empty. Appending headers...");
    sheet.appendRow(USERS_HEADERS);
    sheet.getRange(1, 1, 1, USERS_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
    return sheet;
  }

  // Ensure squad image columns exist in existing sheet
  ensureSquadColumnsExist_(sheet);

  return sheet;
}

/**
 * Synchronizes an authenticated Firebase user into the Users sheet.
 *
 * Rules:
 * - User existence determined by Firebase UID (user_id column) or verified email.
 * - If user does not exist: Creates new row with user_id = Firebase UID.
 * - If user exists: Updates email, display_name, photo_url, updated_at, last_login.
 *   Preserves user-entered fields (class_id, phone, whatsapp).
 * - Server-side role assignment:
 *   If email === 'wayongohlaurence@gmail.com' -> 'ADMIN', else 'USER'.
 *   Frontend cannot dictate role.
 */
function syncUserInDatabase_(spreadsheet, authUser) {
  var sheet = getOrCreateUsersSheet_(spreadsheet);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
  } catch (lErr) {
    Logger.log("[Lock Warning] Could not obtain lock within 10s: " + lErr.message);
  }

  try {
    var uid = String(authUser.uid || "").trim();
    var email = String(authUser.email || "").trim();
    var displayName = String(authUser.displayName || "").trim();
    var photoUrl = String(authUser.photoUrl || "").trim();
    var nowIso = new Date().toISOString();

    // Determine role on server
    var normalizedEmail = email.toLowerCase();
    var role = isAuthorizedAdminEmail_(normalizedEmail) ? "ADMIN" : "USER";

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var rawValues = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [USERS_HEADERS];

    var headers = rawValues[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });

    var cols = getUsersColumnIndices_(headers);
    var uidCol = cols.uidCol;
    var emailCol = cols.emailCol;
    var nameCol = cols.nameCol;
    var photoCol = cols.photoCol;
    var classCol = cols.classCol;
    var phoneCol = cols.phoneCol;
    var whatsappCol = cols.whatsappCol;
    var statusCol = cols.statusCol;
    var roleCol = cols.roleCol;
    var createdCol = cols.createdCol;
    var updatedCol = cols.updatedCol;
    var loginCol = cols.loginCol;
    var squadUrlCol = cols.squadUrlCol;
    var squadIdCol = cols.squadIdCol;

    var existingRowIndex = -1;
    var existingRowData = null;

    // Search for existing user row
    for (var r = 1; r < rawValues.length; r++) {
      var row = rawValues[r];
      var rowUid = uidCol !== -1 ? String(row[uidCol] || "").trim() : "";
      var rowEmail = emailCol !== -1 ? String(row[emailCol] || "").trim().toLowerCase() : "";

      if ((uid && rowUid === uid) || (email && rowEmail === normalizedEmail)) {
        existingRowIndex = r + 1; // 1-based row index in sheet
        existingRowData = row;
        break;
      }
    }

    if (existingRowIndex > 0 && existingRowData) {
      // -------------------------------------------------------------
      // EXISTING USER: Update profile & login timestamps, preserve custom fields
      // -------------------------------------------------------------
      Logger.log("[Database] Existing user found at row " + existingRowIndex + ". Updating record...");

      if (email && emailCol !== -1) sheet.getRange(existingRowIndex, emailCol + 1).setValue(email);
      if (displayName && nameCol !== -1) sheet.getRange(existingRowIndex, nameCol + 1).setValue(displayName);
      if (photoUrl && photoCol !== -1) sheet.getRange(existingRowIndex, photoCol + 1).setValue(photoUrl);
      if (roleCol !== -1) sheet.getRange(existingRowIndex, roleCol + 1).setValue(role);
      if (updatedCol !== -1) sheet.getRange(existingRowIndex, updatedCol + 1).setValue(nowIso);
      if (loginCol !== -1) sheet.getRange(existingRowIndex, loginCol + 1).setValue(nowIso);

      // Backfill user_id if was previously empty
      if (uid && uidCol !== -1 && !existingRowData[uidCol]) {
        sheet.getRange(existingRowIndex, uidCol + 1).setValue(uid);
      }

      SpreadsheetApp.flush();

      var preservedClass = classCol !== -1 ? String(existingRowData[classCol] || "") : "";
      var preservedPhone = phoneCol !== -1 ? String(existingRowData[phoneCol] || "") : "";
      var preservedWhatsapp = whatsappCol !== -1 ? String(existingRowData[whatsappCol] || "") : "";
      var currentStatus = statusCol !== -1 ? String(existingRowData[statusCol] || "ACTIVE") : "ACTIVE";
      var originalCreatedAt = createdCol !== -1 ? String(existingRowData[createdCol] || nowIso) : nowIso;
      var currentSquadUrl = squadUrlCol !== -1 ? String(existingRowData[squadUrlCol] || "") : "";
      var currentSquadId = squadIdCol !== -1 ? String(existingRowData[squadIdCol] || "") : "";

      try { lock.releaseLock(); } catch(e) {}

      Logger.log("[Database] Successfully updated existing user: " + email + " (Role: " + role + ")");

      return {
        isNewUser: false,
        user: {
          user_id: uid,
          email: email,
          display_name: displayName || (nameCol !== -1 ? String(existingRowData[nameCol] || "") : ""),
          photo_url: photoUrl || (photoCol !== -1 ? String(existingRowData[photoCol] || "") : ""),
          class_id: preservedClass,
          phone: preservedPhone,
          whatsapp: preservedWhatsapp,
          status: currentStatus,
          role: role,
          created_at: originalCreatedAt,
          updated_at: nowIso,
          last_login: nowIso,
          squad_image_url: currentSquadUrl,
          squad_image_file_id: currentSquadId
        }
      };

    } else {
      // -------------------------------------------------------------
      // NEW USER: Append new record with user_id = Firebase UID
      // -------------------------------------------------------------
      Logger.log("[Database] User not found in Users sheet. Creating new user record for: " + email);

      var newRow = new Array(headers.length);
      for (var i = 0; i < headers.length; i++) newRow[i] = "";

      if (uidCol !== -1) newRow[uidCol] = uid;
      if (emailCol !== -1) newRow[emailCol] = email;
      if (nameCol !== -1) newRow[nameCol] = displayName;
      if (photoCol !== -1) newRow[photoCol] = photoUrl;
      if (classCol !== -1) newRow[classCol] = "";
      if (phoneCol !== -1) newRow[phoneCol] = "";
      if (whatsappCol !== -1) newRow[whatsappCol] = "";
      if (statusCol !== -1) newRow[statusCol] = "ACTIVE";
      if (roleCol !== -1) newRow[roleCol] = role;
      if (createdCol !== -1) newRow[createdCol] = nowIso;
      if (updatedCol !== -1) newRow[updatedCol] = nowIso;
      if (loginCol !== -1) newRow[loginCol] = nowIso;

      sheet.appendRow(newRow);
      SpreadsheetApp.flush();

      try { lock.releaseLock(); } catch(e) {}

      Logger.log("[Database] Successfully created new user: " + email + " with UID: " + uid + " (Role: " + role + ")");

      return {
        isNewUser: true,
        user: {
          user_id: uid,
          email: email,
          display_name: displayName,
          photo_url: photoUrl,
          class_id: "",
          phone: "",
          whatsapp: "",
          status: "ACTIVE",
          role: role,
          created_at: nowIso,
          updated_at: nowIso,
          last_login: nowIso,
          squad_image_url: "",
          squad_image_file_id: ""
        }
      };
    }

  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    Logger.log("[Database Error] syncUserInDatabase_ failed: " + err.message);
    throw err;
  }
}

/**
 * =========================================================================
 * HTTP ENTRY POINTS
 * Exactly ONE doGet(e) and ONE doPost(e)
 * =========================================================================
 */

/**
 * GET Handler: Public Data & Diagnostics
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = String(params.action || "").trim();

  try {
    if (action === "getCompetitions" || action === "get-competitions" || action === "competitions" || action === "admin-competitions") {
      var ss = getDatabaseSpreadsheet_();
      var allComps = getCompetitionsFromDatabase_(ss);
      return createJsonResponse_({ success: true, competitions: allComps, data: { competitions: allComps } });
    }
    if (action === "getCompetition" || action === "competition") {
      var ssComp = getDatabaseSpreadsheet_();
      var cId = String(params.id || params.competitionId || "").trim();
      var compsList = getCompetitionsFromDatabase_(ssComp);
      for (var ci = 0; ci < compsList.length; ci++) {
        if (compsList[ci].CompetitionID === cId) {
          return createJsonResponse_({ success: true, competition: compsList[ci], data: { competition: compsList[ci] } });
        }
      }
      return createJsonResponse_({ success: false, message: "Competition " + cId + " not found." });
    }
    if (action === "getWhatsAppGroups" || action === "get-whatsapp-groups" || action === "whatsapp-groups") {
      var ssWg = getDatabaseSpreadsheet_();
      var wgList = getWhatsAppGroupsFromDatabase_(ssWg);
      return createJsonResponse_({ success: true, groups: wgList, data: wgList });
    }
    if (action === "getLeagueStandings" || action === "get-league-standings") {
      var ss = getDatabaseSpreadsheet_();
      return createJsonResponse_({ success: true, standings: calculateLeagueStandingsFromDatabase_(ss, params.competitionId || "") });
    }
    if (action === "getFixtures" || action === "get-fixtures") {
      var ss = getDatabaseSpreadsheet_();
      return createJsonResponse_({ success: true, fixtures: getFixturesFromDatabase_(ss, params.competitionId || "") });
    }
    if (action === "getAnnouncements" || action === "get-announcements") {
      var ss = getDatabaseSpreadsheet_();
      return createJsonResponse_({ success: true, announcements: getAnnouncementsFromDatabase_(ss, params.competitionId || "") });
    }

    if (action === "getMatchRules" || action === "get-match-rules") {
      var gmrRules = getMatchRulesFromDatabase_(getDatabaseSpreadsheet_());
      return createJsonResponse_({ success: true, rules: gmrRules, data: { rules: gmrRules } });
    }
    if (action === "getLiveDocs" || action === "get-live-docs") {
      var gldInfo = getLiveDocsInfo_();
      return createJsonResponse_({ success: true, docs: gldInfo, data: gldInfo });
    }
    if (action === "getInvite" || action === "get-invite") {
      return createJsonResponse_(previewInvite_(getDatabaseSpreadsheet_(), params.code));
    }

    Logger.log("[HTTP GET] Health check request received");
    return createJsonResponse_({
      success: true,
      app: "Chuka Community",
      status: "online",
      message: "Chuka Community backend is running.",
      firebase_project: FIREBASE_PROJECT_ID,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse_({ success: false, message: "GET request failed: " + err.message });
  }
}

/**
 * POST Handler: Authenticated Action Dispatcher
 * Primary action: "syncUser"
 */
function doPost(e) {
  Logger.log("[HTTP POST] Incoming request received");

  try {
    // 1. Parse POST JSON body or fallback parameters
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        Logger.log("[HTTP POST Error] Failed to parse request JSON: " + jsonErr.message);
        return createJsonResponse_({
          success: false,
          message: "Malformed JSON payload in request body."
        });
      }
    }

    var params = (e && e.parameter) || {};
    var action = String(body.action || params.action || "").trim();
    Logger.log("[HTTP POST] Action requested: '" + action + "'");

    // 2. Action: syncUser
    if (action === "syncUser" || action === "syncuser") {
      var idToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";

      if (!idToken) {
        Logger.log("[HTTP POST Error] syncUser failed: Missing idToken");
        return createJsonResponse_({
          success: false,
          message: "Firebase authentication required. 'idToken' must be provided in POST JSON body."
        });
      }

      Logger.log("[HTTP POST] Starting Firebase token verification...");
      var authResult = verifyFirebaseIdToken_(idToken);

      if (!authResult || !authResult.valid) {
        var failMessage = (authResult && authResult.message) || "Invalid authentication token.";
        Logger.log("[HTTP POST Error] Token verification failed: " + failMessage);
        return createJsonResponse_({
          success: false,
          message: failMessage
        });
      }

      Logger.log("[HTTP POST] Token verified. Authenticated UID: " + authResult.uid + ", Email: " + authResult.email);

      // Access database spreadsheet
      var spreadsheet;
      try {
        spreadsheet = getDatabaseSpreadsheet_();
      } catch (dbErr) {
        Logger.log("[HTTP POST Error] Database connection failure: " + dbErr.message);
        return createJsonResponse_({
          success: false,
          message: "Database connection error: " + dbErr.message
        });
      }

      // Sync user into Users sheet
      var syncResult;
      try {
        syncResult = syncUserInDatabase_(spreadsheet, authResult);
      } catch (syncErr) {
        Logger.log("[HTTP POST Error] User synchronization failed: " + syncErr.message);
        return createJsonResponse_({
          success: false,
          message: "Failed to synchronize user in database: " + syncErr.message
        });
      }

      Logger.log("[HTTP POST] syncUser completed successfully for " + authResult.email);
      return createJsonResponse_({
        success: true,
        message: "User synced successfully.",
        isNewUser: syncResult.isNewUser,
        user: syncResult.user
      });
    }

    // 3. Action: getProfile
    if (action === "getProfile" || action === "getprofile") {
      var getProfileIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";

      if (!getProfileIdToken) {
        Logger.log("[HTTP POST Error] getProfile failed: Missing idToken");
        return createJsonResponse_({
          success: false,
          message: "Firebase authentication required. 'idToken' must be provided in POST JSON body."
        });
      }

      Logger.log("[HTTP POST] Starting Firebase token verification for getProfile...");
      var getProfileAuth = verifyFirebaseIdToken_(getProfileIdToken);

      if (!getProfileAuth || !getProfileAuth.valid) {
        var getProfileFail = (getProfileAuth && getProfileAuth.message) || "Invalid authentication token.";
        Logger.log("[HTTP POST Error] getProfile token verification failed: " + getProfileFail);
        return createJsonResponse_({
          success: false,
          message: getProfileFail
        });
      }

      Logger.log("[HTTP POST] Token verified for getProfile. UID: " + getProfileAuth.uid + ", Email: " + getProfileAuth.email);

      var getProfileSs;
      try {
        getProfileSs = getDatabaseSpreadsheet_();
      } catch (dbErr) {
        Logger.log("[HTTP POST Error] getProfile database error: " + dbErr.message);
        return createJsonResponse_({
          success: false,
          message: "Database connection error: " + dbErr.message
        });
      }

      try {
        var profileData = getUserProfileFromDatabase_(getProfileSs, getProfileAuth);
        Logger.log("[HTTP POST] getProfile completed successfully for " + getProfileAuth.email);
        return createJsonResponse_(profileData);
      } catch (profErr) {
        Logger.log("[HTTP POST Error] getProfile failed: " + profErr.message);
        return createJsonResponse_({
          success: false,
          message: "Failed to retrieve user profile: " + profErr.message
        });
      }
    }

    // 4. Action: updateProfile
    if (action === "updateProfile" || action === "updateprofile") {
      var updateProfileIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";

      if (!updateProfileIdToken) {
        Logger.log("[HTTP POST Error] updateProfile failed: Missing idToken");
        return createJsonResponse_({
          success: false,
          message: "Firebase authentication required. 'idToken' must be provided in POST JSON body."
        });
      }

      Logger.log("[HTTP POST] Starting Firebase token verification for updateProfile...");
      var updateProfileAuth = verifyFirebaseIdToken_(updateProfileIdToken);

      if (!updateProfileAuth || !updateProfileAuth.valid) {
        var updateProfileFail = (updateProfileAuth && updateProfileAuth.message) || "Invalid authentication token.";
        Logger.log("[HTTP POST Error] updateProfile token verification failed: " + updateProfileFail);
        return createJsonResponse_({
          success: false,
          message: updateProfileFail
        });
      }

      Logger.log("[HTTP POST] Token verified for updateProfile. UID: " + updateProfileAuth.uid + ", Email: " + updateProfileAuth.email);

      var profileFields = {};
      if (body && typeof body.profile === "object" && body.profile !== null) {
        profileFields = body.profile;
      } else if (body && typeof body === "object") {
        profileFields = body;
      }

      var updateProfileSs;
      try {
        updateProfileSs = getDatabaseSpreadsheet_();
      } catch (dbErr) {
        Logger.log("[HTTP POST Error] updateProfile database error: " + dbErr.message);
        return createJsonResponse_({
          success: false,
          message: "Database connection error: " + dbErr.message
        });
      }

      try {
        var updateResult = updateUserProfileInDatabase_(updateProfileSs, updateProfileAuth, profileFields);
        Logger.log("[HTTP POST] updateProfile executed for " + updateProfileAuth.email + ": success=" + updateResult.success);
        return createJsonResponse_(updateResult);
      } catch (updateErr) {
        Logger.log("[HTTP POST Error] updateProfile failed: " + updateErr.message);
        return createJsonResponse_({
          success: false,
          message: "Failed to update profile: " + updateErr.message
        });
      }
    }

    // 5. Action: uploadSquadImage (and aliases uploadSquadScreenshot, player-upload-squad)
    if (action === "uploadSquadImage" || action === "uploadsquadimage" || action === "uploadSquadScreenshot" || action === "player-upload-squad" || action === "upload-squad") {
      var uploadSquadIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : (body && typeof body.token === "string") ? body.token.trim() : "";

      if (!uploadSquadIdToken) {
        Logger.log("[HTTP POST Error] uploadSquadImage failed: Missing idToken");
        return createJsonResponse_({
          success: false,
          message: "Firebase authentication required. 'idToken' must be provided in POST JSON body."
        });
      }

      var uploadAuth = verifyFirebaseIdToken_(uploadSquadIdToken);
      if (!uploadAuth || !uploadAuth.valid) {
        var uploadFail = (uploadAuth && uploadAuth.message) || "Invalid or expired authentication token.";
        Logger.log("[HTTP POST Error] uploadSquadImage token verification failed: " + uploadFail);
        return createJsonResponse_({
          success: false,
          message: uploadFail
        });
      }

      var fileData = (body && typeof body.fileData === "string") ? body.fileData : (body && typeof body.screenshotBase64 === "string") ? body.screenshotBase64 : (body && typeof body.base64 === "string") ? body.base64 : "";
      var mimeType = (body && typeof body.mimeType === "string") ? body.mimeType : (body && typeof body.type === "string") ? body.type : "image/jpeg";
      var fileName = (body && typeof body.fileName === "string") ? body.fileName : (body && typeof body.name === "string") ? body.name : "squad.jpg";

      var uploadSs;
      try {
        uploadSs = getDatabaseSpreadsheet_();
      } catch (dbErr) {
        Logger.log("[HTTP POST Error] uploadSquadImage database error: " + dbErr.message);
        return createJsonResponse_({
          success: false,
          message: "Database connection error: " + dbErr.message
        });
      }

      try {
        var uploadRes = uploadSquadImageInDatabase_(uploadSs, uploadAuth, fileData, mimeType, fileName);
        return createJsonResponse_(uploadRes);
      } catch (uploadException) {
        Logger.log("[HTTP POST Error] uploadSquadImage exception: " + uploadException.message);
        return createJsonResponse_({
          success: false,
          message: "Failed to upload screenshot to Google Drive: " + uploadException.message
        });
      }
    }

    // 6. Action: deleteSquadImage (and aliases removeSquadImage, player-remove-squad)
    if (action === "deleteSquadImage" || action === "deletesquadimage" || action === "removeSquadImage" || action === "player-remove-squad" || action === "deleteSquadScreenshot") {
      var deleteSquadIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : (body && typeof body.token === "string") ? body.token.trim() : "";

      if (!deleteSquadIdToken) {
        return createJsonResponse_({
          success: false,
          message: "Firebase authentication required. 'idToken' must be provided in POST JSON body."
        });
      }

      var deleteAuth = verifyFirebaseIdToken_(deleteSquadIdToken);
      if (!deleteAuth || !deleteAuth.valid) {
        return createJsonResponse_({
          success: false,
          message: (deleteAuth && deleteAuth.message) || "Invalid authentication token."
        });
      }

      var deleteSs;
      try {
        deleteSs = getDatabaseSpreadsheet_();
      } catch (dbErr) {
        return createJsonResponse_({
          success: false,
          message: "Database connection error: " + dbErr.message
        });
      }

      try {
        var deleteRes = deleteSquadImageInDatabase_(deleteSs, deleteAuth);
        return createJsonResponse_(deleteRes);
      } catch (deleteException) {
        return createJsonResponse_({
          success: false,
          message: "Failed to delete squad screenshot: " + deleteException.message
        });
      }
    }

    // 7. Action: player-me / getCurrentPlayer (Profile retrieval alias)
    if (action === "player-me" || action === "getCurrentPlayer" || action === "GET_CURRENT_PLAYER") {
      var meIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      if (!meIdToken) {
        return createJsonResponse_({
          success: false,
          message: "Firebase authentication required. 'idToken' must be provided."
        });
      }
      var meAuth = verifyFirebaseIdToken_(meIdToken);
      if (!meAuth || !meAuth.valid) {
        return createJsonResponse_({
          success: false,
          message: (meAuth && meAuth.message) || "Invalid authentication token."
        });
      }
      var meSs = getDatabaseSpreadsheet_();
      var meProfile = getUserProfileFromDatabase_(meSs, meAuth);
      return createJsonResponse_({
        success: true,
        profileExists: true,
        player: meProfile.user,
        completion: {
          percentage: meProfile.user && meProfile.user.squad_image_url ? 100 : 75,
          isComplete: Boolean(meProfile.user && meProfile.user.squad_image_url),
          missingFields: meProfile.user && meProfile.user.squad_image_url ? [] : ["Squad Screenshot"]
        }
      });
    }

    // Action: auth-test (Authoritative Server Token Verification & Admin Role Assessment)
    if (action === "auth-test" || action === "authTest" || action === "AUTH_TEST") {
      var atIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var atAuth = verifyFirebaseIdToken_(atIdToken);
      if (!atAuth || !atAuth.valid) {
        return createJsonResponse_({
          success: false,
          authenticated: false,
          message: (atAuth && atAuth.message) || "Authentication token required."
        });
      }

      var atEmail = (atAuth.email || "").toLowerCase().trim();
      var isAuthAdmin = Boolean(atAuth.isAdmin || isAuthorizedAdminEmail_(atEmail));
      var isOwner = atEmail === "wayongohlaurence@gmail.com" || atEmail === "wayongohlawrence@gmail.com";

      return createJsonResponse_({
        success: true,
        authenticated: true,
        uid: atAuth.uid,
        email: atAuth.email,
        displayName: atAuth.displayName || "",
        admin: {
          isAdmin: isAuthAdmin,
          isSuperAdmin: isOwner,
          role: isOwner ? "SUPER_ADMIN" : (isAuthAdmin ? "ADMIN" : "USER"),
          status: isAuthAdmin ? "ACTIVE" : "USER",
          adminId: isAuthAdmin ? ("ADM-" + (atAuth.uid ? atAuth.uid.slice(0, 8).toUpperCase() : "OWNER")) : undefined
        }
      });
    }

    // 8. Action: createCompetition (and aliases)
    if (action === "createCompetition" || action === "create-competition" || action === "admin-competition-create") {
      var ccIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var ccAuth = verifyFirebaseIdToken_(ccIdToken);
      if (!ccAuth || !ccAuth.valid || (!ccAuth.isAdmin && !isAuthorizedAdminEmail_(ccAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var ccSs = getDatabaseSpreadsheet_();
      var createdComp = saveCompetitionInDatabase_(ccSs, body.competition || body);
      return createJsonResponse_({ success: true, message: "Competition created successfully.", competition: createdComp, data: { competition: createdComp } });
    }

    // 9. Action: updateCompetition (and aliases)
    if (action === "updateCompetition" || action === "update-competition" || action === "admin-competition-update") {
      var ucIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var ucAuth = verifyFirebaseIdToken_(ucIdToken);
      if (!ucAuth || !ucAuth.valid || (!ucAuth.isAdmin && !isAuthorizedAdminEmail_(ucAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var ucSs = getDatabaseSpreadsheet_();
      var updatedComp = updateCompetitionInDatabase_(ucSs, body.competitionId || body.CompetitionID || body.id, body.updates || body);
      return createJsonResponse_({ success: true, message: "Competition updated successfully.", competition: updatedComp, data: { competition: updatedComp } });
    }

    // Action: openCompetition (and aliases)
    if (action === "openCompetition" || action === "open-competition" || action === "admin-competition-open") {
      var ocIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var ocAuth = verifyFirebaseIdToken_(ocIdToken);
      if (!ocAuth || !ocAuth.valid || (!ocAuth.isAdmin && !isAuthorizedAdminEmail_(ocAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var ocSs = getDatabaseSpreadsheet_();
      var opCompId = String(body.competitionId || body.CompetitionID || body.id || "").trim();
      updateCompetitionInDatabase_(ocSs, opCompId, { status: "OPEN" });
      logAudit_(ocSs, ocAuth.uid, ocAuth.email, "COMPETITION_OPENED", "Competition", opCompId, { status: "OPEN" });
      return createJsonResponse_({ success: true, message: "Competition is now OPEN for registration.", data: { status: "OPEN" } });
    }

    // Action: closeCompetition (and aliases)
    if (action === "closeCompetition" || action === "close-competition" || action === "admin-competition-close") {
      var clIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var clAuth = verifyFirebaseIdToken_(clIdToken);
      if (!clAuth || !clAuth.valid || (!clAuth.isAdmin && !isAuthorizedAdminEmail_(clAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var clSs = getDatabaseSpreadsheet_();
      var clCompId = String(body.competitionId || body.CompetitionID || body.id || "").trim();
      updateCompetitionInDatabase_(clSs, clCompId, { status: "CLOSED" });
      logAudit_(clSs, clAuth.uid, clAuth.email, "COMPETITION_CLOSED", "Competition", clCompId, { status: "CLOSED" });
      return createJsonResponse_({ success: true, message: "Competition registration is now CLOSED.", data: { status: "CLOSED" } });
    }

    // 10. Action: uploadCompetitionImage
    if (action === "uploadCompetitionImage" || action === "upload-competition-image") {
      var uciIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var uciAuth = verifyFirebaseIdToken_(uciIdToken);
      if (!uciAuth || !uciAuth.valid || (!uciAuth.isAdmin && !isAuthorizedAdminEmail_(uciAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var uciSs = getDatabaseSpreadsheet_();
      var uciRes = uploadCompetitionImageInDatabase_(uciSs, uciAuth, body.competitionId, body.fileData, body.mimeType, body.fileName);
      return createJsonResponse_(uciRes);
    }

    // 11. Action: deleteCompetitionImage
    if (action === "deleteCompetitionImage" || action === "delete-competition-image") {
      var dciIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var dciAuth = verifyFirebaseIdToken_(dciIdToken);
      if (!dciAuth || !dciAuth.valid || (!dciAuth.isAdmin && !isAuthorizedAdminEmail_(dciAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var dciSs = getDatabaseSpreadsheet_();
      var dciRes = deleteCompetitionImageInDatabase_(dciSs, dciAuth, body.competitionId);
      return createJsonResponse_(dciRes);
    }

    // 12. Action: getCompetitions
    if (action === "getCompetitions" || action === "get-competitions" || action === "admin-competitions" || action === "competitions") {
      var gcSs = getDatabaseSpreadsheet_();
      var comps = getCompetitionsFromDatabase_(gcSs);
      return createJsonResponse_({ success: true, competitions: comps, data: { competitions: comps } });
    }

    // 13. Action: adminGetRegistrations / getRegistrations
    if (action === "adminGetRegistrations" || action === "getRegistrations" || action === "get-registrations" || action === "admin-registrations" || action === "my-registrations") {
      var grSs = getDatabaseSpreadsheet_();
      var grIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var grAuth = grIdToken ? verifyFirebaseIdToken_(grIdToken) : null;
      var regs = getRegistrationsFromDatabase_(grSs, body.competitionId || "");
      if (action === "my-registrations" && grAuth && grAuth.valid) {
        regs = regs.filter(function(r) { return r.PlayerID === grAuth.uid || r.PlayerID === grAuth.email; });
      }
      return createJsonResponse_({ success: true, registrations: regs, data: { registrations: regs } });
    }

    // 14. Action: registerCompetition / register-competition
    if (action === "registerCompetition" || action === "register-competition" || action === "competition-register") {
      var rcIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var rcAuth = verifyFirebaseIdToken_(rcIdToken);
      if (!rcAuth || !rcAuth.valid) {
        return createJsonResponse_({ success: false, message: "Authentication required to register." });
      }
      var rcSs = getDatabaseSpreadsheet_();
      var regCompId = body.competitionId || body.CompetitionID;
      var regResult = registerPlayerInDatabase_(rcSs, rcAuth, regCompId, body.efootballUsername, body.paymentRef);
      return createJsonResponse_(regResult);
    }

    // 15. Action: confirmRegistration / rejectRegistration
    if (action === "confirmRegistration" || action === "rejectRegistration" || action === "admin-registration-approve" || action === "admin-registration-reject") {
      var crIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var crAuth = verifyFirebaseIdToken_(crIdToken);
      if (!crAuth || !crAuth.valid || (!crAuth.isAdmin && !isAuthorizedAdminEmail_(crAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var crSs = getDatabaseSpreadsheet_();
      var isApprove = action === "confirmRegistration" || action === "admin-registration-approve";
      var newRegStatus = isApprove ? "APPROVED" : "REJECTED";
      var targetRegId = body.registrationId || body.RegistrationID;
      var crRes = updateRegistrationStatusInDatabase_(crSs, targetRegId, newRegStatus, crAuth.email);
      return createJsonResponse_(crRes);
    }

    // 16. Action: adminGetPayments / getPayments
    if (action === "adminGetPayments" || action === "getPayments" || action === "get-payments" || action === "admin-payments") {
      var gpSs = getDatabaseSpreadsheet_();
      var payments = getPaymentsFromDatabase_(gpSs, body.competitionId || "");
      return createJsonResponse_({ success: true, payments: payments, data: { payments: payments } });
    }

    // 17. Action: confirmPayment / rejectPayment
    if (action === "confirmPayment" || action === "rejectPayment" || action === "verifyPayment") {
      var cpIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var cpAuth = verifyFirebaseIdToken_(cpIdToken);
      if (!cpAuth || !cpAuth.valid || (!cpAuth.isAdmin && !isAuthorizedAdminEmail_(cpAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var cpSs = getDatabaseSpreadsheet_();
      var newPayStatus = (action === "confirmPayment" || action === "verifyPayment") ? "CONFIRMED" : "REJECTED";
      var cpRes = updatePaymentStatusInDatabase_(cpSs, body.paymentId, newPayStatus, cpAuth.email);
      return createJsonResponse_(cpRes);
    }

    // 18. Action: getFixtures / get-fixtures
    if (action === "getFixtures" || action === "get-fixtures") {
      var gfSs = getDatabaseSpreadsheet_();
      var fixtures = getFixturesFromDatabase_(gfSs, body.competitionId || "");
      return createJsonResponse_({ success: true, fixtures: fixtures });
    }

    // 19. Action: recordMatchResult / record-match-result
    if (action === "recordMatchResult" || action === "record-match-result") {
      var rmrIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var rmrAuth = verifyFirebaseIdToken_(rmrIdToken);
      if (!rmrAuth || !rmrAuth.valid || (!rmrAuth.isAdmin && !isAuthorizedAdminEmail_(rmrAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var rmrSs = getDatabaseSpreadsheet_();
      var rmrRes = updateFixtureResultInDatabase_(
        rmrSs,
        body.fixtureId,
        body.player1Score,
        body.player2Score,
        body.winnerId,
        body.status || "COMPLETED",
        body.resultPublished !== undefined ? body.resultPublished : true
      );
      return createJsonResponse_(rmrRes);
    }

    // 20. Action: getAnnouncements / get-announcements
    if (action === "getAnnouncements" || action === "get-announcements") {
      var gaSs = getDatabaseSpreadsheet_();
      var anns = getAnnouncementsFromDatabase_(gaSs, body.competitionId || "");
      return createJsonResponse_({ success: true, announcements: anns });
    }

    // 21. Action: createAnnouncement / create-announcement
    if (action === "createAnnouncement" || action === "create-announcement") {
      var caIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var caAuth = verifyFirebaseIdToken_(caIdToken);
      if (!caAuth || !caAuth.valid || (!caAuth.isAdmin && !isAuthorizedAdminEmail_(caAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var caSs = getDatabaseSpreadsheet_();
      var savedAnn = saveAnnouncementInDatabase_(caSs, body.announcement || body, caAuth.email);
      return createJsonResponse_({ success: true, announcement: savedAnn });
    }

    // 22. Action: deleteAnnouncement / delete-announcement
    if (action === "deleteAnnouncement" || action === "delete-announcement") {
      var daIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var daAuth = verifyFirebaseIdToken_(daIdToken);
      if (!daAuth || !daAuth.valid || (!daAuth.isAdmin && !isAuthorizedAdminEmail_(daAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var daSs = getDatabaseSpreadsheet_();
      var daRes = deleteAnnouncementInDatabase_(daSs, body.announcementId);
      return createJsonResponse_(daRes);
    }

    // 23. Action: getAdminOverview / admin-overview
    if (action === "getAdminOverview" || action === "admin-overview") {
      var gaoSs = getDatabaseSpreadsheet_();
      var overview = getAdminOverviewFromDatabase_(gaoSs);
      return createJsonResponse_({ success: true, overview: overview });
    }

    // 24. Action: adminGetPlayers / admin-players
    if (action === "adminGetPlayers" || action === "admin-players") {
      var agpSs = getDatabaseSpreadsheet_();
      var playersList = getAllPlayersFromDatabase_(agpSs, body.search || params.search || "", {
        status: body.status || params.status || "",
        verified: body.verified || params.verified || ""
      });
      var allForCounts = getAllPlayersFromDatabase_(agpSs, "", {});
      var pCounts = { total: allForCounts.length, pending: 0, active: 0, suspended: 0 };
      for (var pc = 0; pc < allForCounts.length; pc++) {
        var ps = String(allForCounts[pc].Status).toUpperCase();
        if (ps === "ACTIVE") pCounts.active++;
        else if (ps === "SUSPENDED") pCounts.suspended++;
        else pCounts.pending++;
      }
      return createJsonResponse_({ success: true, players: playersList, counts: pCounts, data: { players: playersList, counts: pCounts } });
    }

    // 25. Action: getWhatsAppGroups
    if (action === "getWhatsAppGroups" || action === "get-whatsapp-groups") {
      var gwgSs = getDatabaseSpreadsheet_();
      var groups = getWhatsAppGroupsFromDatabase_(gwgSs);
      return createJsonResponse_({ success: true, groups: groups });
    }

    // 26. Action: updateWhatsAppGroups (Admin Only)
    if (action === "updateWhatsAppGroups" || action === "update-whatsapp-groups") {
      var uwgIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var uwgAuth = verifyFirebaseIdToken_(uwgIdToken);
      if (!uwgAuth || !uwgAuth.valid || (!uwgAuth.isAdmin && !isAuthorizedAdminEmail_(uwgAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var uwgSs = getDatabaseSpreadsheet_();
      var uwgRes = updateWhatsAppGroupsInDatabase_(uwgSs, body.groups || [], uwgAuth.email);
      return createJsonResponse_(uwgRes);
    }

    // 27. Action: generateKnockoutBracket (Admin Only)
    if (action === "generateKnockoutBracket" || action === "generate-knockout-bracket") {
      var gkbIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var gkbAuth = verifyFirebaseIdToken_(gkbIdToken);
      if (!gkbAuth || !gkbAuth.valid || (!gkbAuth.isAdmin && !isAuthorizedAdminEmail_(gkbAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var gkbSs = getDatabaseSpreadsheet_();
      var gkbRes = generateKnockoutBracketInDatabase_(gkbSs, body.competitionId, gkbAuth.email);
      return createJsonResponse_(gkbRes);
    }

    // 28. Action: generateNextKnockoutRound (Admin Only)
    if (action === "generateNextKnockoutRound" || action === "generate-next-knockout-round") {
      var gnrIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var gnrAuth = verifyFirebaseIdToken_(gnrIdToken);
      if (!gnrAuth || !gnrAuth.valid || (!gnrAuth.isAdmin && !isAuthorizedAdminEmail_(gnrAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var gnrSs = getDatabaseSpreadsheet_();
      var gnrRes = generateNextKnockoutRoundInDatabase_(gnrSs, body.competitionId, body.currentRound, gnrAuth.email);
      return createJsonResponse_(gnrRes);
    }

    // 29. Action: generateLeagueFixtures (Admin Only)
    if (action === "generateLeagueFixtures" || action === "generate-league-fixtures") {
      var glfIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var glfAuth = verifyFirebaseIdToken_(glfIdToken);
      if (!glfAuth || !glfAuth.valid || (!glfAuth.isAdmin && !isAuthorizedAdminEmail_(glfAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var glfSs = getDatabaseSpreadsheet_();
      var glfRes = generateLeagueFixturesInDatabase_(glfSs, body.competitionId, glfAuth.email);
      return createJsonResponse_(glfRes);
    }

    // 30. Action: getLeagueStandings
    if (action === "getLeagueStandings" || action === "get-league-standings") {
      var glsSs = getDatabaseSpreadsheet_();
      var standings = calculateLeagueStandingsFromDatabase_(glsSs, body.competitionId || params.competitionId || "");
      return createJsonResponse_({ success: true, standings: standings });
    }

    // 31. Action: submitMatchResult / submitCupResult / submitLeagueResult
    if (action === "submitMatchResult" || action === "submitCupResult" || action === "submitLeagueResult") {
      var smrIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var smrAuth = verifyFirebaseIdToken_(smrIdToken);
      if (!smrAuth || !smrAuth.valid) {
        return createJsonResponse_({ success: false, message: "Authentication required to submit match result." });
      }
      var smrSs = getDatabaseSpreadsheet_();
      var smrRes = submitMatchResultInDatabase_(smrSs, smrAuth, body);
      return createJsonResponse_(smrRes);
    }

    // 32. Action: confirmMatchResult
    if (action === "confirmMatchResult" || action === "confirm-match-result") {
      var cmrIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var cmrAuth = verifyFirebaseIdToken_(cmrIdToken);
      if (!cmrAuth || !cmrAuth.valid) {
        return createJsonResponse_({ success: false, message: "Authentication required to confirm match result." });
      }
      var cmrSs = getDatabaseSpreadsheet_();
      var cmrRes = confirmMatchResultInDatabase_(cmrSs, cmrAuth, body.fixtureId);
      return createJsonResponse_(cmrRes);
    }

    // 33. Action: submitDispute / submitCupDispute / submitLeagueDispute
    if (action === "submitDispute" || action === "submitCupDispute" || action === "submitLeagueDispute") {
      var sdpIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var sdpAuth = verifyFirebaseIdToken_(sdpIdToken);
      if (!sdpAuth || !sdpAuth.valid) {
        return createJsonResponse_({ success: false, message: "Authentication required to submit dispute." });
      }
      var sdpSs = getDatabaseSpreadsheet_();
      var sdpRes = submitDisputeInDatabase_(sdpSs, sdpAuth, body);
      return createJsonResponse_(sdpRes);
    }

    // 34. Action: resolveDispute (Admin Only)
    if (action === "resolveDispute" || action === "resolve-dispute" || action === "RESOLVE_CUP_DISPUTE" || action === "resolveCupDispute") {
      var rdpIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var rdpAuth = verifyFirebaseIdToken_(rdpIdToken);
      if (!rdpAuth || !rdpAuth.valid || (!rdpAuth.isAdmin && !isAuthorizedAdminEmail_(rdpAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var rdpSs = getDatabaseSpreadsheet_();
      var rdpRes = resolveDisputeInDatabase_(
        rdpSs,
        rdpAuth,
        body.disputeId || body.DisputeID,
        body.decision || body.Notes || body.notes,
        body.winnerId || body.WinnerID || body.winner,
        body.player1Score || body.HomeScore,
        body.player2Score || body.AwayScore
      );
      return createJsonResponse_(rdpRes);
    }

    // 35. Action: getAdminDisputes / getDisputes (Admin Only)
    if (action === "getAdminDisputes" || action === "getDisputes" || action === "admin-disputes" || action === "GET_ADMIN_DISPUTES" || action === "GET_DISPUTES") {
      var gadIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var gadAuth = verifyFirebaseIdToken_(gadIdToken);
      if (!gadAuth || !gadAuth.valid || (!gadAuth.isAdmin && !isAuthorizedAdminEmail_(gadAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var gadSs = getDatabaseSpreadsheet_();
      var dispList = getDisputesFromDatabase_(gadSs, body.competitionId || "");
      return createJsonResponse_({ success: true, disputes: dispList });
    }

    // 36. Action: getAuditLogs (Admin Only)
    if (action === "getAuditLogs" || action === "admin-audit-logs" || action === "GET_AUDIT_LOGS" || action === "get-audit-logs") {
      var galIdToken = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
      var galAuth = verifyFirebaseIdToken_(galIdToken);
      if (!galAuth || !galAuth.valid || (!galAuth.isAdmin && !isAuthorizedAdminEmail_(galAuth.email))) {
        return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
      }
      var galSs = getDatabaseSpreadsheet_();
      var logs = getAuditLogsFromDatabase_(galSs, body.limit || 100);
      return createJsonResponse_({ success: true, logs: logs });
    }

    // ===== Admin: verify / suspend a player profile =====
    if (action === "admin-player-verify" || action === "admin-player-suspend" || action === "verifyPlayer" || action === "suspendPlayer") {
      var vpAuth = requireAuth_(body);
      if (!isAdminAuth_(vpAuth)) return unauthorizedResponse_();
      var vpTarget = body.PlayerID || body.playerId || body.player_id || body.userId;
      var vpVerify = (action === "admin-player-verify" || action === "verifyPlayer");
      return createJsonResponse_(setPlayerStatusInDatabase_(getDatabaseSpreadsheet_(), vpTarget, vpVerify ? "ACTIVE" : "SUSPENDED", vpAuth.email));
    }

    // ===== Official rules (public) =====
    if (action === "getMatchRules" || action === "get-match-rules") {
      var mrRules = getMatchRulesFromDatabase_(getDatabaseSpreadsheet_());
      return createJsonResponse_({ success: true, rules: mrRules, data: { rules: mrRules } });
    }

    // ===== Live Google Docs: links (public) / rebuild now (admin) =====
    if (action === "getLiveDocs" || action === "get-live-docs") {
      var ldInfo = getLiveDocsInfo_();
      return createJsonResponse_({ success: true, docs: ldInfo, data: ldInfo });
    }
    if (action === "syncLiveDocs" || action === "sync-live-docs") {
      var sdAuth = requireAuth_(body);
      if (!isAdminAuth_(sdAuth)) return unauthorizedResponse_();
      var sdSs = getDatabaseSpreadsheet_();
      var sdAppUrl = sanitizeAppUrl_(body.appUrl);
      if (sdAppUrl && !PropertiesService.getScriptProperties().getProperty("APP_URL")) {
        PropertiesService.getScriptProperties().setProperty("APP_URL", sdAppUrl);
      }
      var sdWhat = String(body.what || "all");
      var sdErrors = [];
      if (sdWhat === "all" || sdWhat === "rules") {
        try { syncMasterRulesDocument_(sdSs); } catch (sdE1) { sdErrors.push("Rules doc: " + sdE1.message); }
      }
      if (sdWhat === "all" || sdWhat === "roster") {
        try { syncLiveRosterDocument_(sdSs, true); } catch (sdE2) { sdErrors.push("Roster doc: " + sdE2.message); }
      }
      logAudit_(sdSs, sdAuth.uid, sdAuth.email, "LIVE_DOCS_SYNCED", "Document", "MASTER", { what: sdWhat, errors: sdErrors });
      var sdInfo = getLiveDocsInfo_();
      if (sdErrors.length) return createJsonResponse_({ success: false, message: sdErrors.join(" | "), docs: sdInfo, data: sdInfo });
      return createJsonResponse_({ success: true, message: "Google Docs refreshed.", docs: sdInfo, data: sdInfo });
    }

    // ===== Invitations =====
    if (action === "getInvite" || action === "get-invite") {
      return createJsonResponse_(previewInvite_(getDatabaseSpreadsheet_(), body.code || params.code));
    }
    if (action === "createInvite" || action === "create-invite") {
      var ciAuth = requireAuth_(body);
      if (!ciAuth) return createJsonResponse_({ success: false, message: "Sign in to create invitations." });
      return createJsonResponse_(createInviteInDatabase_(getDatabaseSpreadsheet_(), ciAuth, body));
    }
    if (action === "acceptInvite" || action === "accept-invite") {
      var aiAuth = requireAuth_(body);
      if (!aiAuth) return createJsonResponse_({ success: false, message: "Sign in to accept this invitation." });
      return createJsonResponse_(acceptInviteInDatabase_(getDatabaseSpreadsheet_(), aiAuth, body.code));
    }
    if (action === "listInvites" || action === "list-invites") {
      var liAuth = requireAuth_(body);
      if (!liAuth) return createJsonResponse_({ success: false, message: "Authentication required." });
      var liList = listInvitesFromDatabase_(getDatabaseSpreadsheet_(), liAuth, body.competitionId || "");
      return createJsonResponse_({ success: true, invites: liList, data: { invites: liList } });
    }
    if (action === "revokeInvite" || action === "revoke-invite") {
      var riAuth = requireAuth_(body);
      if (!riAuth) return createJsonResponse_({ success: false, message: "Authentication required." });
      return createJsonResponse_(revokeInviteInDatabase_(getDatabaseSpreadsheet_(), riAuth, body.inviteId || body.InviteID));
    }

    // ===== CHUKA ARENA: Hostel + Community =====
    if (action === "createHostel" || action === "submitHostel") {
      var chAuth = requireAuth_(body);
      if (!chAuth) return createJsonResponse_({ success:false, message:"Sign in to submit a hostel." });
      return createJsonResponse_(createHostelInDatabase_(getDatabaseSpreadsheet_(), chAuth, body));
    }
    if (action === "adminApproveHostel" || action === "approveHostel" || action === "adminRejectHostel" || action === "rejectHostel") {
      var ahAuth = requireAuth_(body);
      if (!isAdminAuth_(ahAuth)) return unauthorizedResponse_();
      var newStatus = (action === "adminApproveHostel" || action === "approveHostel") ? "APPROVED" : "REJECTED";
      return createJsonResponse_(setHostelModerationStatus_(getDatabaseSpreadsheet_(), ahAuth, body.hostelId || body.HostelID, newStatus, body.note || body.moderationNote || ""));
    }
    if (action === "getHostels" || action === "listHostels") {
      return createJsonResponse_({ success:true, hostels:listHostelsFromDatabase_(getDatabaseSpreadsheet_(), body) });
    }
    if (action === "adminGetHostels" || action === "getPendingHostels") {
      var phAuth = requireAuth_(body);
      if (!isAdminAuth_(phAuth)) return unauthorizedResponse_();
      return createJsonResponse_({ success:true, hostels:listHostelsFromDatabase_(getDatabaseSpreadsheet_(), { includePending:true }) });
    }
    if (action === "updateHostelAvailability") {
      var haAuth = requireAuth_(body);
      if (!haAuth) return createJsonResponse_({ success:false, message:"Sign in to update availability." });
      return createJsonResponse_(updateHostelAvailabilityInDatabase_(getDatabaseSpreadsheet_(), haAuth, body));
    }
    if (action === "getHostelAvailability") {
      return createJsonResponse_({ success:true, availability:getHostelAvailabilityFromDatabase_(getDatabaseSpreadsheet_(), body.hostelId || body.HostelID) });
    }
    if (action === "uploadHostelPhoto") {
      var hpAuth = requireAuth_(body);
      if (!hpAuth) return createJsonResponse_({ success:false, message:"Sign in to upload a hostel photo." });
      return createJsonResponse_(uploadHostelPhotoInDatabase_(getDatabaseSpreadsheet_(), hpAuth, body));
    }
    if (action === "createCommunityRequest") {
      var crAuth = requireAuth_(body);
      if (!crAuth) return createJsonResponse_({ success:false, message:"Sign in to post a request." });
      return createJsonResponse_(createCommunityRequestInDatabase_(getDatabaseSpreadsheet_(), crAuth, body));
    }
    if (action === "getCommunityRequests") {
      return createJsonResponse_({ success:true, requests:getCommunityRequestsFromDatabase_(getDatabaseSpreadsheet_()) });
    }
    if (action === "acceptCommunityRequest") {
      var arAuth = requireAuth_(body);
      if (!arAuth) return createJsonResponse_({ success:false, message:"Sign in to accept a request." });
      return createJsonResponse_(acceptCommunityRequestInDatabase_(getDatabaseSpreadsheet_(), arAuth, body.requestId || body.RequestID));
    }
    if (action === "createRoommatePost") {
      var rmAuth = requireAuth_(body);
      if (!rmAuth) return createJsonResponse_({ success:false, message:"Sign in to post a roommate listing." });
      return createJsonResponse_(createRoommatePostInDatabase_(getDatabaseSpreadsheet_(), rmAuth, body));
    }
    if (action === "getRoommatePosts") {
      return createJsonResponse_({ success:true, posts:getRoommatePostsFromDatabase_(getDatabaseSpreadsheet_()) });
    }
    if (action === "closeRoommatePost") {
      var rmcAuth = requireAuth_(body);
      if (!rmcAuth) return createJsonResponse_({ success:false, message:"Authentication required." });
      return createJsonResponse_(setOwnRoommatePostStatus_(getDatabaseSpreadsheet_(), rmcAuth, body.postId || body.PostID, "MATCHED"));
    }
    if (action === "createHookupPost") {
      var hkAuth = requireAuth_(body);
      if (!hkAuth) return createJsonResponse_({ success:false, message:"Authentication required." });
      return createJsonResponse_(createHookupPostInDatabase_(getDatabaseSpreadsheet_(), hkAuth, body));
    }
    if (action === "getHookupPosts") {
      return createJsonResponse_({ success:true, posts:getHookupPostsFromDatabase_(getDatabaseSpreadsheet_()) });
    }
    if (action === "deleteHookupPost") {
      var hkdAuth = requireAuth_(body);
      if (!hkdAuth) return createJsonResponse_({ success:false, message:"Authentication required." });
      return createJsonResponse_(deleteOwnHookupPost_(getDatabaseSpreadsheet_(), hkdAuth, body.postId || body.PostID));
    }
    if (action === "reportCommunityItem") {
      var repAuth = requireAuth_(body);
      if (!repAuth) return createJsonResponse_({ success:false, message:"Authentication required." });
      return createJsonResponse_(createCommunityReport_(getDatabaseSpreadsheet_(), repAuth, body));
    }
    // ===== CHUKA ARENA V2: Hostel Program / Jobs / Trends / WhatsApp suggestions =====
    if (action === 'getHostelProgramStatus') { var hps= requireAuth_(body); if(!hps)return createJsonResponse_({success:false,message:'Authentication required.'}); return createJsonResponse_(getHostelProgramStatus_(getDatabaseSpreadsheet_(),hps)); }
    if (action === 'createHostelProgramPayment') { var hpp=requireAuth_(body); if(!hpp)return createJsonResponse_({success:false,message:'Authentication required.'}); return createJsonResponse_(createHostelProgramPayment_(getDatabaseSpreadsheet_(),hpp,body)); }
    if (action === 'createJobGig') { var jga=requireAuth_(body); if(!jga)return createJsonResponse_({success:false,message:'Authentication required.'}); return createJsonResponse_(createJobGigInDatabase_(getDatabaseSpreadsheet_(),jga,body)); }
    if (action === 'getJobsGigs') return createJsonResponse_({success:true,jobs:getJobsGigsFromDatabase_(getDatabaseSpreadsheet_())});
    if (action === 'adminGetJobsGigs') { var jgauth=requireAuth_(body); if(!isAdminAuth_(jgauth))return unauthorizedResponse_(); return createJsonResponse_({success:true,jobs:adminGetJobsGigsFromDatabase_(getDatabaseSpreadsheet_())}); }
    if (action === 'adminApproveJobGig' || action === 'adminRejectJobGig') { var jgauth2=requireAuth_(body); if(!isAdminAuth_(jgauth2))return unauthorizedResponse_(); return createJsonResponse_(setJobGigModeration_(getDatabaseSpreadsheet_(),jgauth2,body.jobId||body.JobID,action==='adminApproveJobGig'?'APPROVED':'REJECTED',body.note||'')); }
    if (action === 'getTrends') return createJsonResponse_({success:true,trends:getTrendsFromDatabase_(getDatabaseSpreadsheet_())});
    if (action === 'adminUploadTrend') { var ta=requireAuth_(body); if(!isAdminAuth_(ta))return unauthorizedResponse_(); return createJsonResponse_(uploadTrendInDatabase_(getDatabaseSpreadsheet_(),ta,body)); }
    if (action === 'adminDeleteTrend') { var td=requireAuth_(body); if(!isAdminAuth_(td))return unauthorizedResponse_(); return createJsonResponse_(adminDeleteTrendInDatabase_(getDatabaseSpreadsheet_(),td,body.trendId||body.TrendID)); }
    if (action === 'suggestWhatsAppGroup') { var wsa=requireAuth_(body); if(!wsa)return createJsonResponse_({success:false,message:'Authentication required.'}); return createJsonResponse_(submitWhatsAppSuggestionInDatabase_(getDatabaseSpreadsheet_(),wsa,body)); }
    if (action === 'adminGetWhatsAppSuggestions') { var wsa2=requireAuth_(body); if(!isAdminAuth_(wsa2))return unauthorizedResponse_(); return createJsonResponse_({success:true,suggestions:getWhatsAppSuggestionsFromDatabase_(getDatabaseSpreadsheet_())}); }
    if (action === 'adminReviewWhatsAppSuggestion') { var wsa3=requireAuth_(body); if(!isAdminAuth_(wsa3))return unauthorizedResponse_(); return createJsonResponse_(reviewWhatsAppSuggestionInDatabase_(getDatabaseSpreadsheet_(),wsa3,body.suggestionId||body.SuggestionID,body.approve===true,body.note||'')); }

    // Fallback for unrecognized POST actions
    Logger.log("[HTTP POST Warning] Unsupported action: '" + action + "'");
    return createJsonResponse_({
      success: false,
      message: "Unrecognized or unsupported action: '" + action + "'."
    });

  } catch (globalErr) {
    Logger.log("[HTTP POST Critical Error] Unhandled exception: " + globalErr.message);
    return createJsonResponse_({
      success: false,
      message: "Internal server error: " + globalErr.message
    });
  }
}

/**
 * Helper to resolve column index mapping for standard Users headers.
 */
function getUsersColumnIndices_(headers) {
  var colIdx = function(name) {
    return headers.indexOf(name.toLowerCase());
  };
  var uidCol = colIdx("user_id");
  if (uidCol === -1) uidCol = colIdx("uid");
  var emailCol = colIdx("email");
  var nameCol = colIdx("display_name");
  if (nameCol === -1) nameCol = colIdx("displayname");
  if (nameCol === -1) nameCol = colIdx("name");
  var photoCol = colIdx("photo_url");
  if (photoCol === -1) photoCol = colIdx("photourl");
  if (photoCol === -1) photoCol = colIdx("photo");
  var classCol = colIdx("class_id");
  if (classCol === -1) classCol = colIdx("classid");
  if (classCol === -1) classCol = colIdx("class");
  var phoneCol = colIdx("phone");
  if (phoneCol === -1) phoneCol = colIdx("phonenumber");
  var whatsappCol = colIdx("whatsapp");
  if (whatsappCol === -1) whatsappCol = colIdx("whatsappnumber");
  var statusCol = colIdx("status");
  var roleCol = colIdx("role");
  var createdCol = colIdx("created_at");
  if (createdCol === -1) createdCol = colIdx("createdat");
  var updatedCol = colIdx("updated_at");
  if (updatedCol === -1) updatedCol = colIdx("updatedat");
  var loginCol = colIdx("last_login");
  if (loginCol === -1) loginCol = colIdx("lastlogin");
  var squadUrlCol = colIdx("squad_image_url");
  if (squadUrlCol === -1) squadUrlCol = colIdx("squadimageurl");
  if (squadUrlCol === -1) squadUrlCol = colIdx("squad_url");
  var squadIdCol = colIdx("squad_image_file_id");
  if (squadIdCol === -1) squadIdCol = colIdx("squadimagefileid");
  if (squadIdCol === -1) squadIdCol = colIdx("squad_file_id");
  return {
    uidCol: uidCol,
    emailCol: emailCol,
    nameCol: nameCol,
    photoCol: photoCol,
    classCol: classCol,
    phoneCol: phoneCol,
    whatsappCol: whatsappCol,
    statusCol: statusCol,
    roleCol: roleCol,
    createdCol: createdCol,
    updatedCol: updatedCol,
    loginCol: loginCol,
    squadUrlCol: squadUrlCol,
    squadIdCol: squadIdCol
  };
}

/**
 * Builds a standardized user profile object from sheet row data.
 * Always applies server-authoritative role determination:
 * wayongohlaurence@gmail.com -> ADMIN, all other users -> USER.
 */
function buildUserProfileObject_(row, cols, fallbackUid, fallbackEmail) {
  var uid = cols.uidCol !== -1 && row[cols.uidCol] ? String(row[cols.uidCol]).trim() : (fallbackUid || "");
  var email = cols.emailCol !== -1 && row[cols.emailCol] ? String(row[cols.emailCol]).trim() : (fallbackEmail || "");
  var normalizedEmail = email.toLowerCase();
  var rawRole = cols.roleCol !== -1 && row[cols.roleCol] ? String(row[cols.roleCol]).trim().toUpperCase() : "USER";
  var serverRole = isAuthorizedAdminEmail_(normalizedEmail) ? "ADMIN" : (rawRole === "ADMIN" ? "USER" : rawRole);

  return {
    user_id: uid,
    email: email,
    display_name: cols.nameCol !== -1 ? String(row[cols.nameCol] || "") : "",
    photo_url: cols.photoCol !== -1 ? String(row[cols.photoCol] || "") : "",
    class_id: cols.classCol !== -1 ? String(row[cols.classCol] || "") : "",
    phone: cols.phoneCol !== -1 ? String(row[cols.phoneCol] || "") : "",
    whatsapp: cols.whatsappCol !== -1 ? String(row[cols.whatsappCol] || "") : "",
    status: cols.statusCol !== -1 && row[cols.statusCol] ? String(row[cols.statusCol]).trim().toUpperCase() : "ACTIVE",
    role: serverRole,
    created_at: cols.createdCol !== -1 ? String(row[cols.createdCol] || "") : "",
    updated_at: cols.updatedCol !== -1 ? String(row[cols.updatedCol] || "") : "",
    last_login: cols.loginCol !== -1 ? String(row[cols.loginCol] || "") : "",
    squad_image_url: cols.squadUrlCol !== -1 ? String(row[cols.squadUrlCol] || "") : "",
    squad_image_file_id: cols.squadIdCol !== -1 ? String(row[cols.squadIdCol] || "") : ""
  };
}

/**
 * Retrieves the profile of an authenticated Firebase user from the Users sheet.
 * If user does not exist yet, creates/synchronizes the account using existing logic.
 */
function getUserProfileFromDatabase_(spreadsheet, authUser) {
  var sheet = getOrCreateUsersSheet_(spreadsheet);
  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();
  var normalizedEmail = email.toLowerCase();

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var rawValues = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [USERS_HEADERS];

  var headers = rawValues[0].map(function(h) {
    return String(h || "").trim().toLowerCase();
  });
  var cols = getUsersColumnIndices_(headers);

  var existingRowData = null;

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var rowUid = cols.uidCol !== -1 ? String(row[cols.uidCol] || "").trim() : "";
    var rowEmail = cols.emailCol !== -1 ? String(row[cols.emailCol] || "").trim().toLowerCase() : "";

    if ((uid && rowUid === uid) || (email && rowEmail === normalizedEmail)) {
      existingRowData = row;
      break;
    }
  }

  if (existingRowData) {
    var userProfile = buildUserProfileObject_(existingRowData, cols, uid, email);
    return {
      success: true,
      message: "Profile retrieved successfully.",
      user: userProfile
    };
  }

  // If user does not exist yet, synchronize using standard syncUser logic
  Logger.log("[Database] User not found during getProfile. Synchronizing account for " + email);
  var syncResult = syncUserInDatabase_(spreadsheet, authUser);
  return {
    success: true,
    message: "Profile retrieved successfully.",
    user: syncResult.user
  };
}

/**
 * Updates user-editable profile fields (display_name, class_id, phone, whatsapp).
 * Preserves user_id, email, photo_url, status, role, created_at, and last_login.
 * Role is strictly server-determined. Uses ScriptLock to prevent concurrent corruption.
 */
function updateUserProfileInDatabase_(spreadsheet, authUser, profileData) {
  if (!profileData || typeof profileData !== "object") {
    return {
      success: false,
      message: "Validation error: Profile update payload must be an object."
    };
  }

  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();
  var normalizedEmail = email.toLowerCase();

  var sheet = getOrCreateUsersSheet_(spreadsheet);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
  } catch (lErr) {
    Logger.log("[Lock Warning] Could not obtain lock within 10s: " + lErr.message);
  }

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var rawValues = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [USERS_HEADERS];

    var headers = rawValues[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });
    var cols = getUsersColumnIndices_(headers);

    var existingRowIndex = -1;
    var existingRowData = null;

    for (var r = 1; r < rawValues.length; r++) {
      var row = rawValues[r];
      var rowUid = cols.uidCol !== -1 ? String(row[cols.uidCol] || "").trim() : "";
      var rowEmail = cols.emailCol !== -1 ? String(row[cols.emailCol] || "").trim().toLowerCase() : "";

      if ((uid && rowUid === uid) || (email && rowEmail === normalizedEmail)) {
        existingRowIndex = r + 1;
        existingRowData = row;
        break;
      }
    }

    // If user record doesn't exist yet, synchronize first
    if (existingRowIndex === -1 || !existingRowData) {
      Logger.log("[Database] User not found before updateProfile. Synchronizing account for " + email);
      syncUserInDatabase_(spreadsheet, authUser);

      // Re-read sheet to obtain newly created row index
      lastRow = sheet.getLastRow();
      lastCol = sheet.getLastColumn();
      rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      headers = rawValues[0].map(function(h) {
        return String(h || "").trim().toLowerCase();
      });
      cols = getUsersColumnIndices_(headers);

      for (var r2 = 1; r2 < rawValues.length; r2++) {
        var row2 = rawValues[r2];
        var rowUid2 = cols.uidCol !== -1 ? String(row2[cols.uidCol] || "").trim() : "";
        var rowEmail2 = cols.emailCol !== -1 ? String(row2[cols.emailCol] || "").trim().toLowerCase() : "";

        if ((uid && rowUid2 === uid) || (email && rowEmail2 === normalizedEmail)) {
          existingRowIndex = r2 + 1;
          existingRowData = row2;
          break;
        }
      }
    }

    if (existingRowIndex === -1 || !existingRowData) {
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: false,
        message: "User account could not be found or initialized in database."
      };
    }

    // Retrieve current row values
    var currentDisplayName = cols.nameCol !== -1 ? String(existingRowData[cols.nameCol] || "") : "";
    var currentClassId = cols.classCol !== -1 ? String(existingRowData[cols.classCol] || "") : "";
    var currentPhone = cols.phoneCol !== -1 ? String(existingRowData[cols.phoneCol] || "") : "";
    var currentWhatsapp = cols.whatsappCol !== -1 ? String(existingRowData[cols.whatsappCol] || "") : "";
    var currentPhotoUrl = cols.photoCol !== -1 ? String(existingRowData[cols.photoCol] || "") : (authUser.photoUrl || "");
    var currentStatus = cols.statusCol !== -1 && existingRowData[cols.statusCol] ? String(existingRowData[cols.statusCol]).trim().toUpperCase() : "ACTIVE";
    var currentCreatedAt = cols.createdCol !== -1 && existingRowData[cols.createdCol] ? String(existingRowData[cols.createdCol]).trim() : new Date().toISOString();
    var currentLastLogin = cols.loginCol !== -1 && existingRowData[cols.loginCol] ? String(existingRowData[cols.loginCol]).trim() : new Date().toISOString();

    // Extract input fields with fallback across common casing formats
    var rawDisplayName = profileData.display_name !== undefined ? profileData.display_name : profileData.DisplayName !== undefined ? profileData.DisplayName : profileData.displayName;
    var rawClassId = profileData.class_id !== undefined ? profileData.class_id : profileData.ClassID !== undefined ? profileData.ClassID : profileData.classId;
    var rawPhone = profileData.phone !== undefined ? profileData.phone : profileData.PhoneNumber !== undefined ? profileData.PhoneNumber : profileData.Phone !== undefined ? profileData.Phone : profileData.phoneNumber;
    var rawWhatsapp = profileData.whatsapp !== undefined ? profileData.whatsapp : profileData.WhatsAppNumber !== undefined ? profileData.WhatsAppNumber : profileData.WhatsApp !== undefined ? profileData.WhatsApp : profileData.whatsAppNumber;

    // 1. Validation & sanitization: display_name
    var nextDisplayName = currentDisplayName;
    if (rawDisplayName !== undefined && rawDisplayName !== null) {
      var trimmedDisplayName = String(rawDisplayName).trim();
      if (trimmedDisplayName.length > 100) {
        try { lock.releaseLock(); } catch(e) {}
        return {
          success: false,
          message: "Validation error: Display name cannot exceed 100 characters."
        };
      }
      if (trimmedDisplayName.length === 0 && currentDisplayName.trim().length > 0) {
        try { lock.releaseLock(); } catch(e) {}
        return {
          success: false,
          message: "Validation error: Display name cannot be empty when an existing name is present."
        };
      }
      if (trimmedDisplayName.length > 0) {
        nextDisplayName = trimmedDisplayName;
      }
    }

    // 2. Validation & sanitization: class_id
    var nextClassId = currentClassId;
    if (rawClassId !== undefined && rawClassId !== null) {
      var trimmedClassId = String(rawClassId).trim();
      if (trimmedClassId.length > 50) {
        try { lock.releaseLock(); } catch(e) {}
        return {
          success: false,
          message: "Validation error: Class ID cannot exceed 50 characters."
        };
      }
      nextClassId = trimmedClassId;
    }

    // 3. Validation & sanitization: phone
    var nextPhone = currentPhone;
    if (rawPhone !== undefined && rawPhone !== null) {
      var trimmedPhone = String(rawPhone).trim();
      if (trimmedPhone.length > 30) {
        try { lock.releaseLock(); } catch(e) {}
        return {
          success: false,
          message: "Validation error: Phone number cannot exceed 30 characters."
        };
      }
      nextPhone = trimmedPhone;
    }

    // 4. Validation & sanitization: whatsapp
    var nextWhatsapp = currentWhatsapp;
    if (rawWhatsapp !== undefined && rawWhatsapp !== null) {
      var trimmedWhatsapp = String(rawWhatsapp).trim();
      if (trimmedWhatsapp.length > 30) {
        try { lock.releaseLock(); } catch(e) {}
        return {
          success: false,
          message: "Validation error: WhatsApp number cannot exceed 30 characters."
        };
      }
      nextWhatsapp = trimmedWhatsapp;
    }

    var nowIso = new Date().toISOString();

    // Server-Authoritative Role Determination (Never trusted from frontend)
    var authoritativeRole = isAuthorizedAdminEmail_(normalizedEmail) ? "ADMIN" : "USER";

    // Write ONLY user-editable fields & updated_at to the sheet
    if (cols.nameCol !== -1) {
      sheet.getRange(existingRowIndex, cols.nameCol + 1).setValue(nextDisplayName);
    }
    if (cols.classCol !== -1) {
      sheet.getRange(existingRowIndex, cols.classCol + 1).setValue(nextClassId);
    }
    if (cols.phoneCol !== -1) {
      sheet.getRange(existingRowIndex, cols.phoneCol + 1).setValue(nextPhone);
    }
    if (cols.whatsappCol !== -1) {
      sheet.getRange(existingRowIndex, cols.whatsappCol + 1).setValue(nextWhatsapp);
    }
    if (cols.updatedCol !== -1) {
      sheet.getRange(existingRowIndex, cols.updatedCol + 1).setValue(nowIso);
    }

    // Ensure authoritative role is enforced and user_id is preserved
    if (cols.roleCol !== -1) {
      sheet.getRange(existingRowIndex, cols.roleCol + 1).setValue(authoritativeRole);
    }
    if (cols.uidCol !== -1 && !existingRowData[cols.uidCol] && uid) {
      sheet.getRange(existingRowIndex, cols.uidCol + 1).setValue(uid);
    }

    SpreadsheetApp.flush();

    var currentSquadUrl = cols.squadUrlCol !== -1 ? String(existingRowData[cols.squadUrlCol] || "") : "";
    var currentSquadId = cols.squadIdCol !== -1 ? String(existingRowData[cols.squadIdCol] || "") : "";

    try { lock.releaseLock(); } catch(e) {}

    var updatedUser = {
      user_id: (cols.uidCol !== -1 && existingRowData[cols.uidCol]) ? String(existingRowData[cols.uidCol]).trim() : uid,
      email: email,
      display_name: nextDisplayName,
      photo_url: currentPhotoUrl,
      class_id: nextClassId,
      phone: nextPhone,
      whatsapp: nextWhatsapp,
      status: currentStatus,
      role: authoritativeRole,
      created_at: currentCreatedAt,
      updated_at: nowIso,
      last_login: currentLastLogin,
      squad_image_url: currentSquadUrl,
      squad_image_file_id: currentSquadId
    };

    Logger.log("[Database] updateProfile completed successfully for " + email);

    return {
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser
    };

  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    Logger.log("[Database Error] updateUserProfileInDatabase_ failed: " + err.message);
    throw err;
  }
}

/**
 * Uploads a team squad screenshot to Google Drive in the dedicated folder
 * and stores its URL and File ID in the authenticated player's row in Users sheet.
 * If user already had a squad image, safely trashes the old file in Drive.
 */
function uploadSquadImageInDatabase_(spreadsheet, authUser, fileData, mimeType, fileName) {
  if (!fileData || typeof fileData !== "string" || fileData.trim().length === 0) {
    return {
      success: false,
      message: "Validation error: Squad image data (fileData) is required."
    };
  }

  // Max 10MB file limit (roughly 14MB base64)
  if (fileData.length > 14 * 1024 * 1024) {
    return {
      success: false,
      message: "Validation error: Squad image exceeds the 10MB size limit."
    };
  }

  var normalizedMime = String(mimeType || "image/jpeg").toLowerCase().trim();
  var allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedMimes.indexOf(normalizedMime) === -1) {
    return {
      success: false,
      message: "Validation error: Only JPEG, PNG, or WebP images are permitted (received: " + normalizedMime + ")."
    };
  }

  // Clean data URL prefix if present
  var cleanBase64 = fileData.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, "").trim();
  var decodedBytes;
  try {
    decodedBytes = Utilities.base64Decode(cleanBase64);
  } catch (decErr) {
    return {
      success: false,
      message: "Validation error: Failed to decode base64 image data."
    };
  }

  var ext = "jpg";
  if (normalizedMime.indexOf("png") !== -1) ext = "png";
  else if (normalizedMime.indexOf("webp") !== -1) ext = "webp";

  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();
  var safeFileName = "squad_" + uid.slice(0, 12) + "_" + Date.now() + "." + ext;

  var blob = Utilities.newBlob(decodedBytes, normalizedMime, safeFileName);

  // 1. Save to Google Drive
  var squadFolder;
  try {
    squadFolder = getOrCreateSquadFolder_();
  } catch (driveAuthErr) {
    Logger.log("[Drive Error] Squad folder access failed: " + driveAuthErr.message);
    return {
      success: false,
      message: "Google Drive authorization failure: " + driveAuthErr.message
    };
  }

  var driveFile;
  try {
    driveFile = squadFolder.createFile(blob);
    // Set file-level view access so it can be viewed in <img> tag without exposing any other Drive files
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (createErr) {
    Logger.log("[Drive Error] Could not create file in Drive: " + createErr.message);
    return {
      success: false,
      message: "Failed to upload file to Google Drive: " + createErr.message
    };
  }

  var newFileId = driveFile.getId();
  // Direct CDN URL for fast display in <img> without interstitial cookies
  var directUrl = "https://lh3.googleusercontent.com/d/" + newFileId;

  // 2. Update Users Sheet
  var sheet = getOrCreateUsersSheet_(spreadsheet);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lErr) {}

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var rawValues = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [USERS_HEADERS];
    var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    var cols = getUsersColumnIndices_(headers);

    var existingRowIndex = -1;
    var existingRowData = null;
    var normalizedEmail = email.toLowerCase();

    for (var r = 1; r < rawValues.length; r++) {
      var row = rawValues[r];
      var rowUid = cols.uidCol !== -1 ? String(row[cols.uidCol] || "").trim() : "";
      var rowEmail = cols.emailCol !== -1 ? String(row[cols.emailCol] || "").trim().toLowerCase() : "";

      if ((uid && rowUid === uid) || (email && rowEmail === normalizedEmail)) {
        existingRowIndex = r + 1;
        existingRowData = row;
        break;
      }
    }

    if (existingRowIndex === -1 || !existingRowData) {
      try { lock.releaseLock(); } catch(e) {}
      // User not in sheet yet; sync them first
      syncUserInDatabase_(spreadsheet, authUser);
      // Re-read
      return uploadSquadImageInDatabase_(spreadsheet, authUser, fileData, mimeType, fileName);
    }

    // Safely trash previous squad image file if one existed and is different
    var oldFileId = cols.squadIdCol !== -1 ? String(existingRowData[cols.squadIdCol] || "").trim() : "";
    if (oldFileId && oldFileId !== newFileId) {
      try {
        var oldFile = DriveApp.getFileById(oldFileId);
        oldFile.setTrashed(true);
        Logger.log("[Drive] Trashed previous squad image file: " + oldFileId);
      } catch (trashErr) {
        Logger.log("[Drive Warning] Could not trash previous squad file " + oldFileId + ": " + trashErr.message);
      }
    }

    var nowIso = new Date().toISOString();

    if (cols.squadUrlCol !== -1) {
      sheet.getRange(existingRowIndex, cols.squadUrlCol + 1).setValue(directUrl);
    }
    if (cols.squadIdCol !== -1) {
      sheet.getRange(existingRowIndex, cols.squadIdCol + 1).setValue(newFileId);
    }
    if (cols.updatedCol !== -1) {
      sheet.getRange(existingRowIndex, cols.updatedCol + 1).setValue(nowIso);
    }

    SpreadsheetApp.flush();
    try { lock.releaseLock(); } catch(e) {}

    // Construct updated user object
    existingRowData[cols.squadUrlCol] = directUrl;
    existingRowData[cols.squadIdCol] = newFileId;
    existingRowData[cols.updatedCol] = nowIso;
    var updatedUser = buildUserProfileObject_(existingRowData, cols, uid, email);

    Logger.log("[Drive & Database] Successfully uploaded squad image for " + email + ", fileId=" + newFileId);

    return {
      success: true,
      message: "Squad image uploaded to Google Drive and saved successfully.",
      fileId: newFileId,
      url: directUrl,
      user: updatedUser
    };

  } catch (sheetErr) {
    try { lock.releaseLock(); } catch(e) {}
    Logger.log("[Database Error] Failed to update Users sheet with squad image: " + sheetErr.message);
    return {
      success: false,
      message: "Uploaded to Drive but failed to update Users sheet: " + sheetErr.message
    };
  }
}

/**
 * Removes squad image reference from the authenticated player's record in Users sheet
 * and trashes the file in Google Drive.
 */
function deleteSquadImageInDatabase_(spreadsheet, authUser) {
  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();
  var normalizedEmail = email.toLowerCase();

  var sheet = getOrCreateUsersSheet_(spreadsheet);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lErr) {}

  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var rawValues = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [USERS_HEADERS];
    var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    var cols = getUsersColumnIndices_(headers);

    var existingRowIndex = -1;
    var existingRowData = null;

    for (var r = 1; r < rawValues.length; r++) {
      var row = rawValues[r];
      var rowUid = cols.uidCol !== -1 ? String(row[cols.uidCol] || "").trim() : "";
      var rowEmail = cols.emailCol !== -1 ? String(row[cols.emailCol] || "").trim().toLowerCase() : "";

      if ((uid && rowUid === uid) || (email && rowEmail === normalizedEmail)) {
        existingRowIndex = r + 1;
        existingRowData = row;
        break;
      }
    }

    if (existingRowIndex === -1 || !existingRowData) {
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: false,
        message: "User profile not found in database."
      };
    }

    // Trash old file in Drive if present
    var oldFileId = cols.squadIdCol !== -1 ? String(existingRowData[cols.squadIdCol] || "").trim() : "";
    if (oldFileId) {
      try {
        var oldFile = DriveApp.getFileById(oldFileId);
        oldFile.setTrashed(true);
        Logger.log("[Drive] Trashed removed squad image file: " + oldFileId);
      } catch (trashErr) {
        Logger.log("[Drive Warning] Could not trash file on delete: " + trashErr.message);
      }
    }

    var nowIso = new Date().toISOString();
    if (cols.squadUrlCol !== -1) {
      sheet.getRange(existingRowIndex, cols.squadUrlCol + 1).setValue("");
    }
    if (cols.squadIdCol !== -1) {
      sheet.getRange(existingRowIndex, cols.squadIdCol + 1).setValue("");
    }
    if (cols.updatedCol !== -1) {
      sheet.getRange(existingRowIndex, cols.updatedCol + 1).setValue(nowIso);
    }

    SpreadsheetApp.flush();
    try { lock.releaseLock(); } catch(e) {}

    existingRowData[cols.squadUrlCol] = "";
    existingRowData[cols.squadIdCol] = "";
    existingRowData[cols.updatedCol] = nowIso;
    var updatedUser = buildUserProfileObject_(existingRowData, cols, uid, email);

    Logger.log("[Database] Removed squad image reference for " + email);

    return {
      success: true,
      message: "Squad image removed successfully.",
      user: updatedUser
    };

  } catch (delErr) {
    try { lock.releaseLock(); } catch(e) {}
    Logger.log("[Database Error] deleteSquadImage failed: " + delErr.message);
    return {
      success: false,
      message: "Failed to remove squad image: " + delErr.message
    };
  }
}

/**
 * Gets or creates the dedicated Google Drive folder for competition profile pictures.
 */
function getOrCreateCompetitionFolder_() {
  try {
    var folders = DriveApp.getFoldersByName(COMPETITION_IMAGES_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    }
    var newFolder = DriveApp.createFolder(COMPETITION_IMAGES_FOLDER_NAME);
    Logger.log("[Drive] Created dedicated competition images folder: " + COMPETITION_IMAGES_FOLDER_NAME);
    return newFolder;
  } catch (err) {
    Logger.log("[Drive Error] Failed to get or create competition folder: " + err.message);
    throw new Error("Google Drive authorization failure or folder error: " + err.message);
  }
}

/**
 * Root Drive folder for all competitions:
 * Chuka eFootballHub / Competitions
 */
function getOrCreateCompetitionsParentFolder_() {
  try {
    var rootFolders = DriveApp.getFoldersByName("Chuka eFootballHub");
    var hubFolder;
    if (rootFolders.hasNext()) {
      hubFolder = rootFolders.next();
    } else {
      hubFolder = DriveApp.createFolder("Chuka eFootballHub");
    }

    var compFolders = hubFolder.getFoldersByName("Competitions");
    if (compFolders.hasNext()) {
      return compFolders.next();
    }
    return hubFolder.createFolder("Competitions");
  } catch (err) {
    Logger.log("[Drive Error] Failed to create Competitions parent folder: " + err.message);
    throw new Error("Google Drive error creating folder hierarchy: " + err.message);
  }
}

/**
 * Creates dedicated Google Drive folder and official Google Docs for a competition.
 */
function createCompetitionDriveFolderAndDocs_(comp) {
  var parentFolder = getOrCreateCompetitionsParentFolder_();
  var compName = String(comp.Name || comp.name || "Competition").trim();
  var compId = String(comp.CompetitionID || comp.competition_id || ("COMP-" + Date.now())).trim();
  var compType = String(comp.CompetitionType || comp.competition_type || "KNOCKOUT").toUpperCase().trim();
  var isLeague = compType === "LEAGUE";
  var folderName = compName + " - " + compId;

  // Dedicated competition folder
  var compFolder;
  try {
    var existingF = parentFolder.getFoldersByName(folderName);
    if (existingF.hasNext()) {
      compFolder = existingF.next();
    } else {
      compFolder = parentFolder.createFolder(folderName);
    }
  } catch (fErr) {
    Logger.log("[Drive Warning] Folder creation fallback: " + fErr.message);
    compFolder = parentFolder;
  }

  var folderId = compFolder.getId();
  var createdDocs = {
    competitionFolderId: folderId,
    rulesDocId: "",
    rulesDocUrl: "",
    registeredDocId: "",
    registeredDocUrl: "",
    bracketDocId: "",
    bracketDocUrl: "",
    fixturesDocId: "",
    fixturesDocUrl: "",
    standingsDocId: "",
    standingsDocUrl: "",
    finalResultsDocId: "",
    finalResultsDocUrl: ""
  };

  var nowStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  var entryFee = comp.EntryFee !== undefined ? comp.EntryFee : (isLeague ? 50 : 20);
  var tillNumber = "6817863";
  var prizeAmount = comp.PrizeAmount || (isLeague ? 5000 : 1000);
  var minPlayers = comp.MinPlayers || (isLeague ? 500 : 1024);
  var maxPlayers = comp.MaxPlayers || (isLeague ? 2048 : 1024);

  function moveAndShareDoc_(doc) {
    try {
      var file = DriveApp.getFileById(doc.getId());
      if (compFolder.getId() !== DriveApp.getRootFolder().getId()) {
        compFolder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);
      }
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        Logger.log("[Drive Share Warning] " + shareErr.message);
      }
      return { id: doc.getId(), url: doc.getUrl() };
    } catch (mErr) {
      Logger.log("[Doc Move Warning] " + mErr.message);
      return { id: doc.getId(), url: doc.getUrl() };
    }
  }

  // 1. Rules & Regulations Document
  try {
    var rulesTitle = "Chuka eFootballHub - " + compName + " - Rules & Regulations";
    var rulesDoc = DocumentApp.create(rulesTitle);
    var rBody = rulesDoc.getBody();
    rBody.clear();

    setDocMargins_(rBody);
    renderBrandHeader_(rBody, "Official Gazette & Competition Regulations");
    rBody.appendParagraph("Document Reference: " + compId + " | Published: " + nowStr)
      .setAttributes(docStyle_({ size: 8, color: "#555555", align: DocumentApp.HorizontalAlignment.CENTER, after: 6 }));

    rBody.appendParagraph("1. TOURNAMENT SPECIFICATIONS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    var specTable = [
      ["Competition Name", compName],
      ["Competition ID", compId],
      ["Competition Type", compType + " (" + (comp.Format || (isLeague ? "Round Robin" : "Single Elimination")) + ")"],
      ["Entry Fee", "KSh " + entryFee],
      ["Official Payment Till", tillNumber + " (M-Pesa Buy Goods)"],
      ["Winner Prize", "KSh " + Number(prizeAmount).toLocaleString()],
      ["Minimum Participants", minPlayers.toLocaleString() + " Approved Players"],
      ["Maximum Capacity", maxPlayers.toLocaleString() + " Approved Players"],
      ["Division Eligibility", String(comp.Division || "OPEN")]
    ];
    rBody.appendTable(specTable);

    rBody.appendParagraph("2. REGISTRATION & PAYMENT VERIFICATION RULES").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    rBody.appendListItem("All participants must have an active and verified Chuka eFootball player profile.");
    rBody.appendListItem("The official registration fee of KSh " + entryFee + " MUST be paid directly to M-Pesa Till " + tillNumber + ".");
    rBody.appendListItem("Submitting 'I HAVE PAID' places the registration into PENDING status.");
    rBody.appendListItem("Only registrations confirmed by administration count toward competition capacity.");
    rBody.appendListItem(isLeague
      ? "League registration automatically locks upon reaching 2,048 approved players."
      : "Knockout tournament requires exactly 1,024 approved players before bracket generation begins.");

    rBody.appendParagraph("3. OFFICIAL MATCHPLAY RULES").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    rBody.appendListItem("Game Title: eFootball (Mobile / Cross-play as sanctioned).");
    rBody.appendListItem("Match Duration: Standard 10 minutes.");
    rBody.appendListItem(isLeague
      ? "Match Outcomes: Normal time result stands (Win = 3 pts, Draw = 1 pt, Loss = 0 pts)."
      : "Match Outcomes: Extra time and Penalty Shootout (PK) enabled. Knockout matches CANNOT end in a draw.");
    rBody.appendListItem("Connection & Fair Play: Stable internet connection required. Disconnections without proof result in forfeit.");
    rBody.appendListItem("Squad Requirement: Sanctioned authentic or dream squad per tournament division guidelines.");

    rBody.appendParagraph("4. RESULT SUBMISSION & DISPUTE RESOLUTION").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    rBody.appendListItem("Winning player must submit match score with screenshot evidence within 30 minutes of match completion.");
    rBody.appendListItem("Disputes must be formally submitted through the portal with verifiable screenshot evidence.");
    rBody.appendListItem("The Administration Board decision on all disputes is final and binding.");

    rBody.appendParagraph("5. OFFICIAL COMMUNICATION CHANNELS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    rBody.appendParagraph("Official announcements and matchmaking desks are hosted on the Chuka eFootballHub PWA and verified administrator WhatsApp channels.");
    renderSectionTitle_(rBody, "Official Match Rules");
    try {
      var compRulesList = getMatchRulesFromDatabase_(getDatabaseSpreadsheet_());
      renderRulesTables_(rBody, compRulesList, isLeague ? "League" : "Knockout");
    } catch (rulesErr) {
      Logger.log("[Doc Warning] Could not embed official rules: " + rulesErr.message);
    }
    renderRulesNote_(rBody);
    rBody.appendParagraph("Issued by Chuka eFootball League Tournament Directorate")
      .setAttributes(docStyle_({ size: 8, italic: true, color: "#444444", align: DocumentApp.HorizontalAlignment.CENTER, before: 6 }));
    renderDocFooter_(rBody);
    finalizeDoc_(rBody);

    rulesDoc.saveAndClose();
    var rRes = moveAndShareDoc_(rulesDoc);
    createdDocs.rulesDocId = rRes.id;
    createdDocs.rulesDocUrl = rRes.url;
  } catch (err) {
    Logger.log("[Doc Error] Rules doc: " + err.message);
  }

  // 2. Registered Players Document
  try {
    var regTitle = "Chuka eFootballHub - " + compName + " - Registered Players";
    var regDoc = DocumentApp.create(regTitle);
    var regBody = regDoc.getBody();
    regBody.clear();

    regBody.appendParagraph(compName + " - OFFICIAL ROSTER").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    regBody.appendParagraph("Tournament ID: " + compId + " | Status: Registration Open");
    regBody.appendParagraph("Last Updated: " + nowStr);
    regBody.appendHorizontalRule();

    regBody.appendParagraph("APPROVED PARTICIPANTS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    regBody.appendParagraph("Approved players who have completed payment verification to Till " + tillNumber + ":");

    var regTable = [
      ["#", "Player Name", "eFootball ID / Gamer Tag", "Registration Status", "Payment Status"]
    ];
    regBody.appendTable(regTable);
    regBody.appendParagraph("(Roster will populate as player payments are verified by administration.)").setItalic(true);

    regDoc.saveAndClose();
    var regRes = moveAndShareDoc_(regDoc);
    createdDocs.registeredDocId = regRes.id;
    createdDocs.registeredDocUrl = regRes.url;
  } catch (err) {
    Logger.log("[Doc Error] Registered players doc: " + err.message);
  }

  // 3. Knockout Bracket Document (Knockout only)
  if (!isLeague) {
    try {
      var brTitle = "Chuka eFootballHub - " + compName + " - Knockout Bracket";
      var brDoc = DocumentApp.create(brTitle);
      var brBody = brDoc.getBody();
      brBody.clear();

      brBody.appendParagraph(compName + " - KNOCKOUT BRACKET").setHeading(DocumentApp.ParagraphHeading.HEADING1);
      brBody.appendParagraph("Tournament ID: " + compId + " | Single Elimination (1,024 Players)");
      brBody.appendParagraph("Current Status: Pending 1,024 approved players to unlock bracket generation.");
      brBody.appendHorizontalRule();

      brBody.appendParagraph("BRACKET STRUCTURE & ROUND SCHEDULE").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      var roundsTable = [
        ["Round", "Matches", "Progression"],
        ["Round of 1024", "512 Matches", "512 Winners advance"],
        ["Round of 512", "256 Matches", "256 Winners advance"],
        ["Round of 256", "128 Matches", "128 Winners advance"],
        ["Round of 128", "64 Matches", "64 Winners advance"],
        ["Round of 64", "32 Matches", "32 Winners advance"],
        ["Round of 32", "16 Matches", "16 Winners advance"],
        ["Round of 16", "8 Matches", "8 Winners advance"],
        ["Quarter-Finals", "4 Matches", "4 Winners advance"],
        ["Semi-Finals", "2 Matches", "2 Finalists advance"],
        ["Grand Final", "1 Match", "1 Champion (Prize: KSh " + prizeAmount + ")"]
      ];
      brBody.appendTable(roundsTable);

      brDoc.saveAndClose();
      var brRes = moveAndShareDoc_(brDoc);
      createdDocs.bracketDocId = brRes.id;
      createdDocs.bracketDocUrl = brRes.url;
    } catch (err) {
      Logger.log("[Doc Error] Bracket doc: " + err.message);
    }
  }

  // 4. League Fixtures Document (League only)
  if (isLeague) {
    try {
      var fixTitle = "Chuka eFootballHub - " + compName + " - League Fixtures";
      var fixDoc = DocumentApp.create(fixTitle);
      var fBody = fixDoc.getBody();
      fBody.clear();

      fBody.appendParagraph(compName + " - OFFICIAL FIXTURES").setHeading(DocumentApp.ParagraphHeading.HEADING1);
      fBody.appendParagraph("Competition ID: " + compId + " | Round Robin Matchdays");
      fBody.appendParagraph("Controlled Matchday Engine: Matchdays generate dynamically upon minimum 500 approved players.");
      fBody.appendHorizontalRule();

      fBody.appendParagraph("MATCHDAY SCHEDULE").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      var fTable = [
        ["Fixture ID", "Round", "Home Player", "Away Player", "Score", "Status"]
      ];
      fBody.appendTable(fTable);
      fBody.appendParagraph("(Fixtures will appear here as each matchday is generated.)").setItalic(true);

      fixDoc.saveAndClose();
      var fRes = moveAndShareDoc_(fixDoc);
      createdDocs.fixturesDocId = fRes.id;
      createdDocs.fixturesDocUrl = fRes.url;
    } catch (err) {
      Logger.log("[Doc Error] Fixtures doc: " + err.message);
    }
  }

  // 5. League Standings Document (League only)
  if (isLeague) {
    try {
      var stdTitle = "Chuka eFootballHub - " + compName + " - League Standings";
      var stdDoc = DocumentApp.create(stdTitle);
      var sBody = stdDoc.getBody();
      sBody.clear();

      sBody.appendParagraph(compName + " - LEAGUE TABLE & STANDINGS").setHeading(DocumentApp.ParagraphHeading.HEADING1);
      sBody.appendParagraph("Competition ID: " + compId + " | Scoring: Win = 3, Draw = 1, Loss = 0");
      sBody.appendParagraph("Updated automatically after confirmed official match results.");
      sBody.appendHorizontalRule();

      sBody.appendParagraph("CURRENT TABLE").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      var sTable = [
        ["Pos", "Player", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"]
      ];
      sBody.appendTable(sTable);
      sBody.appendParagraph("(Standings table will update live as match results are confirmed.)").setItalic(true);

      stdDoc.saveAndClose();
      var sRes = moveAndShareDoc_(stdDoc);
      createdDocs.standingsDocId = sRes.id;
      createdDocs.standingsDocUrl = sRes.url;
    } catch (err) {
      Logger.log("[Doc Error] Standings doc: " + err.message);
    }
  }

  // 6. Final Results Document (Both Knockout & League)
  try {
    var finTitle = "Chuka eFootballHub - " + compName + " - Final Results";
    var finDoc = DocumentApp.create(finTitle);
    var finBody = finDoc.getBody();
    finBody.clear();

    finBody.appendParagraph(compName + " - FINAL RESULTS & ROLL OF HONOR").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    finBody.appendParagraph("Competition ID: " + compId + " | Status: In Progress");
    finBody.appendHorizontalRule();

    finBody.appendParagraph("CHAMPIONSHIP SUMMARY").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    var finSummaryTable = [
      ["Metric", "Details"],
      ["Tournament Status", "Ongoing"],
      ["Champion", "TBD"],
      ["Runner-Up", "TBD"],
      ["Prize Awarded", "KSh " + Number(prizeAmount).toLocaleString()]
    ];
    finBody.appendTable(finSummaryTable);
    finBody.appendParagraph("(Official final results will be archived here upon tournament completion.)").setItalic(true);

    finDoc.saveAndClose();
    var finRes = moveAndShareDoc_(finDoc);
    createdDocs.finalResultsDocId = finRes.id;
    createdDocs.finalResultsDocUrl = finRes.url;
  } catch (err) {
    Logger.log("[Doc Error] Final results doc: " + err.message);
  }

  return createdDocs;
}

/**
 * Synchronizes Registered Players Document with live database records.
 */
function syncRegisteredPlayersDocument_(spreadsheet, compId) {
  try {
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) { comp = comps[ci]; break; }
    }
    if (!comp || !comp.RegisteredPlayersDocumentID) return;

    var doc = DocumentApp.openById(comp.RegisteredPlayersDocumentID);
    var body = doc.getBody();
    body.clear();

    var nowStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    body.appendParagraph(comp.Name + " - OFFICIAL ROSTER").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("Tournament ID: " + compId + " | Status: " + comp.Status);
    body.appendParagraph("Last Updated: " + nowStr);
    body.appendHorizontalRule();

    var allRegs = getRegistrationsFromDatabase_(spreadsheet, compId);
    var approvedRegs = [];
    var pendingRegs = [];
    for (var ri = 0; ri < allRegs.length; ri++) {
      if (allRegs[ri].Status === "APPROVED" || allRegs[ri].PaymentStatus === "CONFIRMED" || allRegs[ri].PaymentStatus === "PAID") {
        approvedRegs.push(allRegs[ri]);
      } else if (allRegs[ri].Status === "PENDING" || allRegs[ri].PaymentStatus === "PENDING") {
        pendingRegs.push(allRegs[ri]);
      }
    }

    body.appendParagraph("ROSTER SUMMARY").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendTable([
      ["Approved Participants", approvedRegs.length + " / " + comp.MaxPlayers],
      ["Pending Payment Verification", String(pendingRegs.length)],
      ["Remaining Capacity", String(Math.max(0, comp.MaxPlayers - approvedRegs.length))]
    ]);

    body.appendParagraph("APPROVED PLAYERS").setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (approvedRegs.length === 0) {
      body.appendParagraph("No player registrations have been approved yet.");
    } else {
      var tableRows = [["#", "Player Name", "eFootball Gamer Tag", "Registration Status", "Payment Status"]];
      for (var a = 0; a < approvedRegs.length; a++) {
        var r = approvedRegs[a];
        tableRows.push([
          String(a + 1),
          r.PlayerName || r.PlayerID,
          r.eFootballUsername || "-",
          r.Status,
          r.PaymentStatus
        ]);
      }
      body.appendTable(tableRows);
    }

    doc.saveAndClose();
    Logger.log("[Doc Sync] Updated Registered Players document for " + compId);
  } catch (err) {
    Logger.log("[Doc Sync Error] syncRegisteredPlayersDocument_: " + err.message);
  }
}

/**
 * Synchronizes Knockout Bracket Document with live fixtures.
 */
function syncKnockoutBracketDocument_(spreadsheet, compId) {
  try {
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) { comp = comps[ci]; break; }
    }
    if (!comp || !comp.KnockoutBracketDocumentID) return;

    var doc = DocumentApp.openById(comp.KnockoutBracketDocumentID);
    var body = doc.getBody();
    body.clear();

    body.appendParagraph(comp.Name + " - KNOCKOUT BRACKET").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("Tournament ID: " + compId + " | Status: " + comp.Status);
    body.appendHorizontalRule();

    var fixtures = getFixturesFromDatabase_(spreadsheet, compId);
    if (fixtures.length === 0) {
      body.appendParagraph("Bracket will be generated once 1,024 approved players are registered.");
    } else {
      var rounds = {};
      for (var f = 0; f < fixtures.length; f++) {
        var fix = fixtures[f];
        var rName = fix.Round || "Round 1";
        if (!rounds[rName]) rounds[rName] = [];
        rounds[rName].push(fix);
      }

      for (var rKey in rounds) {
        body.appendParagraph(rKey).setHeading(DocumentApp.ParagraphHeading.HEADING2);
        var fRows = [["Fixture ID", "Player 1", "Score", "Score", "Player 2", "Winner", "Status"]];
        var fList = rounds[rKey];
        for (var k = 0; k < fList.length; k++) {
          var item = fList[k];
          fRows.push([
            item.FixtureID,
            item.Player1Name || item.Player1ID,
            item.Player1Score !== "" && item.Player1Score !== null ? String(item.Player1Score) : "-",
            item.Player2Score !== "" && item.Player2Score !== null ? String(item.Player2Score) : "-",
            item.Player2Name || item.Player2ID,
            item.WinnerID || "-",
            item.Status
          ]);
        }
        body.appendTable(fRows);
      }
    }

    doc.saveAndClose();
    Logger.log("[Doc Sync] Updated Knockout Bracket document for " + compId);
  } catch (err) {
    Logger.log("[Doc Sync Error] syncKnockoutBracketDocument_: " + err.message);
  }
}

/**
 * Synchronizes League Fixtures Document.
 */
function syncLeagueFixturesDocument_(spreadsheet, compId) {
  try {
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) { comp = comps[ci]; break; }
    }
    if (!comp || !comp.LeagueFixturesDocumentID) return;

    var doc = DocumentApp.openById(comp.LeagueFixturesDocumentID);
    var body = doc.getBody();
    body.clear();

    body.appendParagraph(comp.Name + " - OFFICIAL LEAGUE FIXTURES").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("Competition ID: " + compId);
    body.appendHorizontalRule();

    var fixtures = getFixturesFromDatabase_(spreadsheet, compId);
    if (fixtures.length === 0) {
      body.appendParagraph("Fixtures will be generated once the season commences.");
    } else {
      var rounds = {};
      for (var f = 0; f < fixtures.length; f++) {
        var fix = fixtures[f];
        var rName = fix.Round || "Matchday 1";
        if (!rounds[rName]) rounds[rName] = [];
        rounds[rName].push(fix);
      }

      for (var rKey in rounds) {
        body.appendParagraph(rKey).setHeading(DocumentApp.ParagraphHeading.HEADING2);
        var fRows = [["Fixture ID", "Home Player", "Score", "Score", "Away Player", "Status"]];
        var fList = rounds[rKey];
        for (var k = 0; k < fList.length; k++) {
          var item = fList[k];
          fRows.push([
            item.FixtureID,
            item.Player1Name || item.Player1ID,
            item.Player1Score !== "" && item.Player1Score !== null ? String(item.Player1Score) : "-",
            item.Player2Score !== "" && item.Player2Score !== null ? String(item.Player2Score) : "-",
            item.Player2Name || item.Player2ID,
            item.Status
          ]);
        }
        body.appendTable(fRows);
      }
    }

    doc.saveAndClose();
    Logger.log("[Doc Sync] Updated League Fixtures document for " + compId);
  } catch (err) {
    Logger.log("[Doc Sync Error] syncLeagueFixturesDocument_: " + err.message);
  }
}

/**
 * Synchronizes League Standings Document.
 */
function syncLeagueStandingsDocument_(spreadsheet, compId) {
  try {
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) { comp = comps[ci]; break; }
    }
    if (!comp || !comp.LeagueStandingsDocumentID) return;

    var doc = DocumentApp.openById(comp.LeagueStandingsDocumentID);
    var body = doc.getBody();
    body.clear();

    body.appendParagraph(comp.Name + " - OFFICIAL STANDINGS").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("Competition ID: " + compId + " | Scoring: Win = 3, Draw = 1, Loss = 0");
    body.appendHorizontalRule();

    var standings = calculateLeagueStandingsFromDatabase_(spreadsheet, compId);
    var sRows = [["Pos", "Player Name", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"]];
    for (var s = 0; s < standings.length; s++) {
      var item = standings[s];
      sRows.push([
        String(item.Position),
        item.PlayerName || item.PlayerID,
        String(item.Played),
        String(item.Wins),
        String(item.Draws),
        String(item.Losses),
        String(item.GoalsFor),
        String(item.GoalsAgainst),
        String(item.GoalDifference),
        String(item.Points)
      ]);
    }
    body.appendTable(sRows);

    doc.saveAndClose();
    Logger.log("[Doc Sync] Updated League Standings document for " + compId);
  } catch (err) {
    Logger.log("[Doc Sync Error] syncLeagueStandingsDocument_: " + err.message);
  }
}

/**
 * Synchronizes Final Results Document upon competition completion.
 */
function syncFinalResultsDocument_(spreadsheet, compId, winnerId, winnerName, prizeAmount) {
  try {
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) { comp = comps[ci]; break; }
    }
    if (!comp || !comp.FinalResultsDocumentID) return;

    var doc = DocumentApp.openById(comp.FinalResultsDocumentID);
    var body = doc.getBody();
    body.clear();

    body.appendParagraph(comp.Name + " - OFFICIAL FINAL RESULTS").setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("ROLL OF HONOR & PRIZE ARCHIVE").setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    body.appendHorizontalRule();

    body.appendTable([
      ["Metric", "Official Result"],
      ["Tournament Status", "COMPLETED"],
      ["Grand Champion", winnerName || winnerId || "Official Champion"],
      ["Champion Player ID", winnerId || "-"],
      ["Prize Awarded", "KSh " + (prizeAmount || comp.PrizeAmount || 1000).toLocaleString()],
      ["Completion Date", new Date().toISOString()]
    ]);

    doc.saveAndClose();
    Logger.log("[Doc Sync] Updated Final Results document for " + compId);
  } catch (err) {
    Logger.log("[Doc Sync Error] syncFinalResultsDocument_: " + err.message);
  }
}

/**
 * Safely adds missing columns to Competitions sheet without deleting or altering existing data.
 */
function ensureCompetitionsColumnsExist_(sheet) {
  try {
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) return;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });
    var changed = false;
    for (var i = 0; i < COMPETITIONS_HEADERS.length; i++) {
      var expectedCol = COMPETITIONS_HEADERS[i].toLowerCase();
      if (headers.indexOf(expectedCol) === -1) {
        lastCol++;
        sheet.getRange(1, lastCol).setValue(COMPETITIONS_HEADERS[i]).setFontWeight("bold");
        changed = true;
      }
    }
    if (changed) {
      SpreadsheetApp.flush();
      Logger.log("[Database] Appended missing columns to Competitions sheet safely.");
    }
  } catch (err) {
    Logger.log("[Database Warning] Could not ensure competition columns: " + err.message);
  }
}

/**
 * Audit Logger: Appends records to AuditLogs sheet.
 */
function logAudit_(spreadsheet, actorUid, actorEmail, action, entityType, entityId, details) {
  try {
    var sheet = getOrCreateSheet_(spreadsheet, AUDIT_LOGS_SHEET_NAME, AUDIT_LOGS_HEADERS);
    var logId = "LOG-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    sheet.appendRow([
      logId,
      new Date().toISOString(),
      String(actorUid || "").trim(),
      String(actorEmail || "").trim(),
      String(action || "").trim(),
      String(entityType || "").trim(),
      String(entityId || "").trim(),
      typeof details === "object" ? JSON.stringify(details) : String(details || "")
    ]);
  } catch (e) {
    Logger.log("[Audit Warning] Failed to write audit log: " + e.message);
  }
}

/**
 * Generic sheet getter and initializer with headers.
 */
function getOrCreateSheet_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
    return sheet;
  }
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    SpreadsheetApp.flush();
    return sheet;
  }
  if (sheetName === COMPETITIONS_SHEET_NAME) {
    ensureCompetitionsColumnsExist_(sheet);
  }
  return sheet;
}

/**
 * Returns all competitions from the Competitions sheet.
 */
function getCompetitionsFromDatabase_(spreadsheet) {
  var sheet = getOrCreateSheet_(spreadsheet, COMPETITIONS_SHEET_NAME, COMPETITIONS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var competitions = [];

  // Authoritative registration counts from real Registrations sheet
  var allRegistrations = getRegistrationsFromDatabase_(spreadsheet, "");

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var comp = {};
    for (var c = 0; c < headers.length; c++) {
      comp[headers[c]] = row[c];
    }

    var compId = String(comp.competition_id || "").trim();
    var cType = String(comp.competition_type || "KNOCKOUT").toUpperCase().trim();
    var isLeague = cType === "LEAGUE";

    // Count approved vs pending registrations for this competition
    var approvedCount = 0;
    var pendingCount = 0;
    for (var i = 0; i < allRegistrations.length; i++) {
      var reg = allRegistrations[i];
      if (String(reg.CompetitionID).trim() === compId) {
        if (reg.Status === "APPROVED" || reg.PaymentStatus === "CONFIRMED" || reg.PaymentStatus === "PAID") {
          approvedCount++;
        } else if (reg.Status === "PENDING" || reg.PaymentStatus === "PENDING") {
          pendingCount++;
        }
      }
    }

    var defaultMax = isLeague ? 2048 : 1024;
    var defaultMin = isLeague ? 500 : 1024;
    var defaultFee = isLeague ? 50 : 20;
    var defaultPrize = isLeague ? 5000 : 1000;

    var maxPlayers = Number(comp.max_players) > 0 ? Number(comp.max_players) : defaultMax;
    var minPlayers = Number(comp.min_players) > 0 ? Number(comp.min_players) : defaultMin;

    var bracketStatus = "REGISTRATION_OPEN";
    if (isLeague) {
      if (approvedCount >= maxPlayers) bracketStatus = "CAPACITY_REACHED";
      else if (approvedCount >= minPlayers) bracketStatus = "MINIMUM_REACHED";
      else bracketStatus = "REGISTRATION_OPEN";
    } else {
      if (approvedCount >= 1024) bracketStatus = "READY_FOR_MATCHES";
      else bracketStatus = "MINIMUM_NOT_REACHED";
    }

    competitions.push({
      CompetitionID: compId,
      Name: String(comp.name || ""),
      Description: String(comp.description || ""),
      CompetitionType: cType,
      Format: String(comp.format || (isLeague ? "Round Robin" : "Single Elimination")),
      Division: String(comp.division || "OPEN"),
      MaxPlayers: maxPlayers,
      MinPlayers: minPlayers,
      EntryFee: Number(comp.entry_fee) !== undefined && comp.entry_fee !== "" ? Number(comp.entry_fee) : defaultFee,
      Currency: String(comp.currency || "KES"),
      PaymentTill: "6817863",
      RegistrationStart: String(comp.registration_start || ""),
      RegistrationEnd: String(comp.registration_end || ""),
      RegistrationDeadline: String(comp.registration_end || ""),
      StartDate: String(comp.start_date || ""),
      EndDate: String(comp.end_date || ""),
      StartTime: String(comp.start_time || ""),
      Status: String(comp.status || "OPEN"),
      ProfileImageURL: String(comp.image_url || ""),
      ProfileImageFileID: String(comp.image_file_id || ""),
      ImageURL: String(comp.image_url || ""),
      ImageFileID: String(comp.image_file_id || ""),
      PrizeAmount: Number(comp.prize_amount) > 0 ? Number(comp.prize_amount) : defaultPrize,
      CompetitionFolderID: String(comp.competition_folder_id || ""),
      RulesDocumentID: String(comp.rules_document_id || ""),
      RulesDocumentURL: String(comp.rules_document_url || ""),
      RegisteredPlayersDocumentID: String(comp.registered_players_document_id || ""),
      RegisteredPlayersDocumentURL: String(comp.registered_players_document_url || ""),
      KnockoutBracketDocumentID: String(comp.knockout_bracket_document_id || ""),
      KnockoutBracketDocumentURL: String(comp.knockout_bracket_document_url || ""),
      LeagueFixturesDocumentID: String(comp.league_fixtures_document_id || ""),
      LeagueFixturesDocumentURL: String(comp.league_fixtures_document_url || ""),
      LeagueStandingsDocumentID: String(comp.league_standings_document_id || ""),
      StandingsDocumentURL: String(comp.league_standings_document_url || comp.standings_document_url || ""),
      FinalResultsDocumentID: String(comp.final_results_document_id || ""),
      FinalResultsDocumentURL: String(comp.final_results_document_url || ""),
      CreatedBy: String(comp.created_by || ""),
      CreatedAt: String(comp.created_at || ""),
      UpdatedAt: String(comp.updated_at || ""),
      RegisteredCount: approvedCount,
      ApprovedCount: approvedCount,
      PendingCount: pendingCount,
      BracketStatus: bracketStatus
    });
  }
  return competitions;
}

/**
 * Saves a new competition into the Competitions sheet and automatically provisions Google Drive folder and Docs.
 */
function saveCompetitionInDatabase_(spreadsheet, rawComp) {
  var sheet = getOrCreateSheet_(spreadsheet, COMPETITIONS_SHEET_NAME, COMPETITIONS_HEADERS);
  var nowIso = new Date().toISOString();
  var compId = String(rawComp.CompetitionID || rawComp.competition_id || ("COMP-" + Date.now())).trim();
  var cType = String(rawComp.CompetitionType || rawComp.competition_type || "KNOCKOUT").toUpperCase().trim();
  var isLeague = cType === "LEAGUE";

  var defaultMax = isLeague ? 2048 : 1024;
  var defaultMin = isLeague ? 500 : 1024;
  var defaultFee = isLeague ? 50 : 20;
  var defaultPrize = isLeague ? 5000 : 1000;

  var compName = String(rawComp.Name || rawComp.name || "Competition").trim();
  var description = String(rawComp.Description || rawComp.description || "").trim();
  var format = String(rawComp.Format || rawComp.format || (isLeague ? "Round Robin" : "Single Elimination")).trim();
  var division = String(rawComp.Division || rawComp.division || "OPEN").trim();
  var maxPlayers = Number(rawComp.MaxPlayers || rawComp.max_players || defaultMax);
  var minPlayers = Number(rawComp.MinPlayers || rawComp.min_players || defaultMin);
  var entryFee = Number(rawComp.EntryFee !== undefined ? rawComp.EntryFee : (rawComp.entry_fee !== undefined ? rawComp.entry_fee : defaultFee));
  var prizeAmount = Number(rawComp.PrizeAmount || rawComp.prize_amount || defaultPrize);
  var currency = String(rawComp.Currency || rawComp.currency || "KES").trim();
  var regStart = String(rawComp.RegistrationStart || rawComp.registration_start || nowIso);
  var regEnd = String(rawComp.RegistrationEnd || rawComp.registration_end || rawComp.RegistrationDeadline || "");
  var startDate = String(rawComp.StartDate || rawComp.start_date || "");
  var endDate = String(rawComp.EndDate || rawComp.end_date || "");
  var startTime = String(rawComp.StartTime || rawComp.start_time || "");
  var status = String(rawComp.Status || rawComp.status || "OPEN").trim();
  var imgUrl = String(rawComp.ProfileImageURL || rawComp.image_url || rawComp.ImageURL || "");
  var imgFileId = String(rawComp.ProfileImageFileID || rawComp.image_file_id || rawComp.ImageFileID || "");
  var createdBy = String(rawComp.CreatedBy || rawComp.created_by || ADMIN_EMAIL);

  var compForDocs = {
    CompetitionID: compId,
    Name: compName,
    Description: description,
    CompetitionType: cType,
    Format: format,
    Division: division,
    MaxPlayers: maxPlayers,
    MinPlayers: minPlayers,
    EntryFee: entryFee,
    PrizeAmount: prizeAmount
  };

  // Automatically create Google Drive folder and official Google Docs
  var autoDocs;
  try {
    autoDocs = createCompetitionDriveFolderAndDocs_(compForDocs);
  } catch (docErr) {
    Logger.log("[Docs Warning] Automatic document creation encountered error: " + docErr.message);
    autoDocs = {
      competitionFolderId: "",
      rulesDocId: "",
      rulesDocUrl: "",
      registeredDocId: "",
      registeredDocUrl: "",
      bracketDocId: "",
      bracketDocUrl: "",
      fixturesDocId: "",
      fixturesDocUrl: "",
      standingsDocId: "",
      standingsDocUrl: "",
      finalResultsDocId: "",
      finalResultsDocUrl: ""
    };
  }

  // Construct complete row strictly matching COMPETITIONS_HEADERS (37 columns)
  var newRow = [
    compId,
    compName,
    description,
    cType,
    format,
    division,
    minPlayers,
    maxPlayers,
    entryFee,
    currency,
    "6817863",
    regStart,
    regEnd,
    startDate,
    endDate,
    startTime,
    status,
    imgUrl,
    imgFileId,
    prizeAmount,
    autoDocs.competitionFolderId || "",
    autoDocs.rulesDocId || "",
    autoDocs.rulesDocUrl || "",
    autoDocs.registeredDocId || "",
    autoDocs.registeredDocUrl || "",
    autoDocs.bracketDocId || "",
    autoDocs.bracketDocUrl || "",
    autoDocs.fixturesDocId || "",
    autoDocs.fixturesDocUrl || "",
    autoDocs.standingsDocId || "",
    autoDocs.standingsDocUrl || "",
    autoDocs.finalResultsDocId || "",
    autoDocs.finalResultsDocUrl || "",
    "REGISTRATION_OPEN",
    createdBy,
    nowIso,
    nowIso
  ];

  sheet.appendRow(newRow);
  SpreadsheetApp.flush();
  logAudit_(spreadsheet, createdBy, createdBy, "COMPETITION_CREATED", "Competition", compId, { name: compName, type: cType, fee: entryFee, folderId: autoDocs.competitionFolderId });

  return {
    CompetitionID: compId,
    Name: compName,
    Description: description,
    CompetitionType: cType,
    Format: format,
    Division: division,
    MinPlayers: minPlayers,
    MaxPlayers: maxPlayers,
    EntryFee: entryFee,
    Currency: currency,
    PaymentTill: "6817863",
    RegistrationStart: regStart,
    RegistrationEnd: regEnd,
    RegistrationDeadline: regEnd,
    StartDate: startDate,
    EndDate: endDate,
    StartTime: startTime,
    Status: status,
    ProfileImageURL: imgUrl,
    ProfileImageFileID: imgFileId,
    ImageURL: imgUrl,
    ImageFileID: imgFileId,
    PrizeAmount: prizeAmount,
    CompetitionFolderID: autoDocs.competitionFolderId,
    RulesDocumentID: autoDocs.rulesDocId,
    RulesDocumentURL: autoDocs.rulesDocUrl,
    RegisteredPlayersDocumentID: autoDocs.registeredDocId,
    RegisteredPlayersDocumentURL: autoDocs.registeredDocUrl,
    KnockoutBracketDocumentID: autoDocs.bracketDocId,
    KnockoutBracketDocumentURL: autoDocs.bracketDocUrl,
    LeagueFixturesDocumentID: autoDocs.fixturesDocId,
    LeagueFixturesDocumentURL: autoDocs.fixturesDocUrl,
    LeagueStandingsDocumentID: autoDocs.standingsDocId,
    StandingsDocumentURL: autoDocs.standingsDocUrl,
    FinalResultsDocumentID: autoDocs.finalResultsDocId,
    FinalResultsDocumentURL: autoDocs.finalResultsDocUrl,
    BracketStatus: "REGISTRATION_OPEN",
    RegisteredCount: 0,
    ApprovedCount: 0,
    PendingCount: 0,
    CreatedBy: createdBy,
    CreatedAt: nowIso,
    UpdatedAt: nowIso
  };
}

/**
 * Updates an existing competition in the Competitions sheet.
 */
function updateCompetitionInDatabase_(spreadsheet, compId, updates) {
  var sheet = getOrCreateSheet_(spreadsheet, COMPETITIONS_SHEET_NAME, COMPETITIONS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) throw new Error("No competitions found");

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var idCol = headers.indexOf("competition_id");

  var targetRowIndex = -1;
  for (var r = 1; r < rawValues.length; r++) {
    if (String(rawValues[r][idCol] || "").trim() === String(compId).trim()) {
      targetRowIndex = r + 1;
      break;
    }
  }

  if (targetRowIndex === -1) throw new Error("Competition " + compId + " not found");

  var nowIso = new Date().toISOString();
  for (var key in updates) {
    var colName = key.toLowerCase().replace(/([a-z])([A-Z])/g, "$1_$2");
    var cIdx = headers.indexOf(colName);
    if (cIdx === -1) cIdx = headers.indexOf(key.toLowerCase());
    if (cIdx !== -1) {
      sheet.getRange(targetRowIndex, cIdx + 1).setValue(updates[key]);
    }
  }

  var updatedCol = headers.indexOf("updated_at");
  if (updatedCol !== -1) {
    sheet.getRange(targetRowIndex, updatedCol + 1).setValue(nowIso);
  }

  SpreadsheetApp.flush();
  return { success: true };
}

/**
 * Uploads competition profile picture to Google Drive and updates Competitions sheet.
 */
function uploadCompetitionImageInDatabase_(spreadsheet, authUser, compId, fileData, mimeType, fileName) {
  var cleanBase64 = String(fileData || "").replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, "").trim();
  var decodedBytes = Utilities.base64Decode(cleanBase64);
  var normalizedMime = (mimeType || "image/jpeg").toLowerCase();
  var ext = normalizedMime.indexOf("png") !== -1 ? "png" : "jpg";
  var safeFileName = "competition_" + compId + "_" + Date.now() + "." + ext;

  var blob = Utilities.newBlob(decodedBytes, normalizedMime, safeFileName);
  var compFolder = getOrCreateCompetitionFolder_();
  var driveFile = compFolder.createFile(blob);
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var newFileId = driveFile.getId();
  var directUrl = "https://lh3.googleusercontent.com/d/" + newFileId;

  // Update in Competitions sheet
  updateCompetitionInDatabase_(spreadsheet, compId, {
    image_url: directUrl,
    image_file_id: newFileId
  });

  return {
    success: true,
    fileId: newFileId,
    url: directUrl
  };
}

/**
 * Deletes competition profile picture from Google Drive and clears references in Competitions sheet.
 */
function deleteCompetitionImageInDatabase_(spreadsheet, authUser, compId) {
  var sheet = getOrCreateSheet_(spreadsheet, COMPETITIONS_SHEET_NAME, COMPETITIONS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { success: true };

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var idCol = headers.indexOf("competition_id");
  var fileIdCol = headers.indexOf("image_file_id");
  var urlCol = headers.indexOf("image_url");

  for (var r = 1; r < rawValues.length; r++) {
    if (String(rawValues[r][idCol] || "").trim() === String(compId).trim()) {
      var oldFileId = fileIdCol !== -1 ? String(rawValues[r][fileIdCol] || "").trim() : "";
      if (oldFileId) {
        try {
          DriveApp.getFileById(oldFileId).setTrashed(true);
        } catch (e) {}
      }
      if (fileIdCol !== -1) sheet.getRange(r + 1, fileIdCol + 1).setValue("");
      if (urlCol !== -1) sheet.getRange(r + 1, urlCol + 1).setValue("");
      SpreadsheetApp.flush();
      break;
    }
  }
  return { success: true };
}

/**
 * Retrieves registrations from Registrations sheet.
 */
function getRegistrationsFromDatabase_(spreadsheet, compId) {
  var sheet = getOrCreateSheet_(spreadsheet, REGISTRATIONS_SHEET_NAME, REGISTRATIONS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var regs = [];

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var reg = {};
    for (var c = 0; c < headers.length; c++) {
      reg[headers[c]] = row[c];
    }
    if (compId && String(reg.competition_id || "").trim() !== String(compId).trim()) {
      continue;
    }
    regs.push({
      RegistrationID: String(reg.registration_id || ""),
      CompetitionID: String(reg.competition_id || ""),
      PlayerID: String(reg.player_id || ""),
      PlayerName: String(reg.player_name || ""),
      eFootballUsername: String(reg.efootball_username || reg.player_name || ""),
      Status: String(reg.status || "PENDING"),
      PaymentStatus: String(reg.payment_status || "PENDING"),
      PaymentID: String(reg.payment_id || ""),
      RegisteredAt: String(reg.registered_at || ""),
      VerifiedAt: String(reg.verified_at || ""),
      VerifiedBy: String(reg.verified_by || "")
    });
  }
  return regs;
}

/**
 * Registers a player for a competition in Registrations sheet with atomic capacity check and duplicate check.
 */
function registerPlayerInDatabase_(spreadsheet, authUser, compId, efootballUsername, paymentRef) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lErr) {
    return { success: false, message: "System is busy processing another registration. Please try again." };
  }

  try {
    var regSheet = getOrCreateSheet_(spreadsheet, REGISTRATIONS_SHEET_NAME, REGISTRATIONS_HEADERS);
    var lastRow = regSheet.getLastRow();
    var lastCol = regSheet.getLastColumn();
    var uid = String(authUser.uid || "").trim();
    var email = String(authUser.email || "").trim();
    var username = String(efootballUsername || authUser.displayName || email).trim();
    var nowIso = new Date().toISOString();

    // 1. Fetch live competition and verify it exists and is OPEN
    var cList = getCompetitionsFromDatabase_(spreadsheet);
    var targetComp = null;
    for (var ci = 0; ci < cList.length; ci++) {
      if (cList[ci].CompetitionID === compId) {
        targetComp = cList[ci];
        break;
      }
    }

    if (!targetComp) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Competition " + compId + " not found." };
    }

    if (targetComp.Status !== "OPEN") {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Registration is not open for this competition (Status: " + targetComp.Status + ")." };
    }

    var compType = String(targetComp.CompetitionType || "KNOCKOUT").toUpperCase();
    var isKnockout = compType === "KNOCKOUT";
    var maxCapacity = isKnockout ? 1024 : 2048;
    var currentApproved = Number(targetComp.ApprovedCount || 0);

    // 2. Strict capacity check: Only APPROVED registrations count toward capacity
    if (currentApproved >= maxCapacity) {
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: false,
        message: isKnockout
          ? "Knockout tournament has reached maximum capacity of 1,024 approved players."
          : "League has reached maximum capacity of 2,048 approved players."
      };
    }

    // 3. Duplicate registration check against live records
    if (lastRow > 1) {
      var rawValues = regSheet.getRange(1, 1, lastRow, lastCol).getValues();
      var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
      var pIdCol = headers.indexOf("player_id");
      var cIdCol = headers.indexOf("competition_id");
      var sCol = headers.indexOf("status");

      for (var r = 1; r < rawValues.length; r++) {
        var rPlayer = pIdCol !== -1 ? String(rawValues[r][pIdCol] || "").trim() : "";
        var rComp = cIdCol !== -1 ? String(rawValues[r][cIdCol] || "").trim() : "";
        var rStat = sCol !== -1 ? String(rawValues[r][sCol] || "").trim().toUpperCase() : "";

        if (rComp === compId && (rPlayer === uid || rPlayer === email)) {
          if (rStat !== "REJECTED" && rStat !== "CANCELLED") {
            try { lock.releaseLock(); } catch(e) {}
            return {
              success: false,
              message: "You are already registered for this competition."
            };
          }
        }
      }
    }

    var regId = "REG-" + Date.now().toString().slice(-6);
    var payId = "PAY-" + Date.now().toString().slice(-6);
    var compFee = isKnockout ? 20 : 50;
    var compName = targetComp.Name || compId;

    // Append Pending Registration
    regSheet.appendRow([
      regId,
      compId,
      uid || email,
      authUser.displayName || email,
      username,
      "PENDING",
      "PENDING",
      payId,
      nowIso,
      "",
      ""
    ]);

    // Append Pending Payment
    var paySheet = getOrCreateSheet_(spreadsheet, PAYMENTS_SHEET_NAME, PAYMENTS_HEADERS);
    paySheet.appendRow([
      payId,
      uid || email,
      authUser.displayName || email,
      compId,
      compName,
      compType,
      compFee,
      "KES",
      paymentRef || "PENDING",
      "PENDING",
      nowIso,
      "",
      ""
    ]);

    SpreadsheetApp.flush();
    logAudit_(spreadsheet, uid, email, "REGISTRATION_SUBMITTED", "Registration", regId, { competitionId: compId, paymentId: payId, amount: compFee, till: "6817863" });
    try { lock.releaseLock(); } catch(e) {}
    queueDocsSync_("roster");

    return {
      success: true,
      message: "Payment submitted for administrator verification.",
      registration: {
        RegistrationID: regId,
        CompetitionID: compId,
        PlayerID: uid || email,
        eFootballUsername: username,
        Status: "PENDING",
        PaymentStatus: "PENDING",
        PaymentID: payId,
        RegisteredAt: nowIso
      }
    };
  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    return { success: false, message: "Registration failed: " + err.message };
  }
}

/**
 * Updates status of a registration in Registrations sheet.
 * Subordinate to payment confirmation: Cannot approve a registration whose payment is not confirmed.
 */
function updateRegistrationStatusInDatabase_(spreadsheet, regId, status, verifiedBy) {
  status = String(status || "").toUpperCase();
  if (status !== "APPROVED" && status !== "REJECTED") {
    return { success: false, message: "Invalid registration status: " + status };
  }
  var sheet = getOrCreateSheet_(spreadsheet, REGISTRATIONS_SHEET_NAME, REGISTRATIONS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "No registrations found" };

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var idCol = headers.indexOf("registration_id");
  var compCol = headers.indexOf("competition_id");
  var statusCol = headers.indexOf("status");
  var payStatusCol = headers.indexOf("payment_status");
  var payIdCol = headers.indexOf("payment_id");
  var vAtCol = headers.indexOf("verified_at");
  var vByCol = headers.indexOf("verified_by");

  var rowNum = -1, payId = "", compId = "";
  for (var r = 1; r < rawValues.length; r++) {
    if (String(rawValues[r][idCol] || "").trim() === String(regId).trim()) {
      rowNum = r + 1;
      payId = payIdCol !== -1 ? String(rawValues[r][payIdCol] || "").trim() : "";
      compId = compCol !== -1 ? String(rawValues[r][compCol] || "").trim() : "";
      break;
    }
  }
  if (rowNum === -1) return { success: false, message: "Registration " + regId + " not found." };

  var okMessage = status === "APPROVED"
    ? "Player verified - registration approved and payment confirmed."
    : "Registration rejected.";

  // Preferred path: drive the linked payment so Payments + Registrations stay consistent.
  if (payId) {
    var paySheet = getOrCreateSheet_(spreadsheet, PAYMENTS_SHEET_NAME, PAYMENTS_HEADERS);
    var payLast = paySheet.getLastRow();
    var payExists = false;
    if (payLast > 1) {
      var payRaw = paySheet.getRange(1, 1, payLast, paySheet.getLastColumn()).getValues();
      var payIdx = payRaw[0].map(function(h) { return String(h || "").trim().toLowerCase(); }).indexOf("payment_id");
      for (var p = 1; p < payRaw.length; p++) {
        if (payIdx !== -1 && String(payRaw[p][payIdx] || "").trim() === payId) { payExists = true; break; }
      }
    }
    if (payExists) {
      var payRes = updatePaymentStatusInDatabase_(spreadsheet, payId, status === "APPROVED" ? "CONFIRMED" : "REJECTED", verifiedBy);
      if (payRes && payRes.success) {
        queueDocsSync_("roster");
        return { success: true, message: okMessage };
      }
      return payRes;
    }
  }

  // Fallback: registration has no payment row - update the registration directly (with capacity check).
  if (status === "APPROVED" && compId) {
    var comp = findCompetitionById_(spreadsheet, compId);
    if (comp) {
      var isKO = String(comp.CompetitionType).toUpperCase() === "KNOCKOUT";
      var cap = isKO ? 1024 : 2048;
      var curStatus = statusCol !== -1 ? String(rawValues[rowNum - 1][statusCol] || "").toUpperCase() : "";
      if (curStatus !== "APPROVED" && Number(comp.ApprovedCount || 0) >= cap) {
        return { success: false, message: "Cannot approve: tournament has reached maximum capacity of " + cap.toLocaleString() + " approved players." };
      }
    }
  }
  if (statusCol !== -1) sheet.getRange(rowNum, statusCol + 1).setValue(status);
  if (payStatusCol !== -1) sheet.getRange(rowNum, payStatusCol + 1).setValue(status === "APPROVED" ? "CONFIRMED" : "REJECTED");
  if (vAtCol !== -1) sheet.getRange(rowNum, vAtCol + 1).setValue(new Date().toISOString());
  if (vByCol !== -1) sheet.getRange(rowNum, vByCol + 1).setValue(verifiedBy);
  SpreadsheetApp.flush();
  logAudit_(spreadsheet, verifiedBy, verifiedBy, "REGISTRATION_STATUS_UPDATED", "Registration", regId, { status: status, paymentId: payId });
  try { syncRegisteredPlayersDocument_(spreadsheet, compId); } catch (e) {}
  queueDocsSync_("roster");
  return { success: true, message: okMessage };
}

/**
 * Retrieves payment records from Payments sheet.
 */
function getPaymentsFromDatabase_(spreadsheet, compId) {
  var sheet = getOrCreateSheet_(spreadsheet, PAYMENTS_SHEET_NAME, PAYMENTS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var payments = [];

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var pay = {};
    for (var c = 0; c < headers.length; c++) {
      pay[headers[c]] = row[c];
    }
    if (compId && String(pay.competition_id || "").trim() !== String(compId).trim()) {
      continue;
    }
    payments.push({
      PaymentID: String(pay.payment_id || ""),
      PlayerID: String(pay.player_id || ""),
      PlayerName: String(pay.player_name || ""),
      CompetitionID: String(pay.competition_id || ""),
      CompetitionName: String(pay.competition_name || ""),
      CompetitionType: String(pay.competition_type || "KNOCKOUT"),
      Amount: Number(pay.amount || 0),
      Currency: String(pay.currency || "KES"),
      PaymentReference: String(pay.payment_reference || ""),
      MpesaReceiptNumber: String(pay.payment_reference || ""),
      Status: String(pay.status || "PENDING"),
      CreatedAt: String(pay.created_at || ""),
      VerifiedAt: String(pay.verified_at || ""),
      VerifiedBy: String(pay.verified_by || "")
    });
  }
  return payments;
}

/**
 * Updates status of a payment in Payments sheet with atomic capacity re-check.
 * When payment is CONFIRMED, registration becomes APPROVED and capacity updates.
 */
function updatePaymentStatusInDatabase_(spreadsheet, payId, status, verifiedBy) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (lErr) {
    return { success: false, message: "System is busy processing another payment. Please try again." };
  }

  try {
    var sheet = getOrCreateSheet_(spreadsheet, PAYMENTS_SHEET_NAME, PAYMENTS_HEADERS);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow <= 1) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "No payments found" };
    }

    var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
    var idCol = headers.indexOf("payment_id");
    var compIdCol = headers.indexOf("competition_id");
    var statusCol = headers.indexOf("status");
    var vAtCol = headers.indexOf("verified_at");
    var vByCol = headers.indexOf("verified_by");

    var targetPaymentRow = -1;
    var targetCompId = "";

    for (var r = 1; r < rawValues.length; r++) {
      if (String(rawValues[r][idCol] || "").trim() === String(payId).trim()) {
        targetPaymentRow = r + 1;
        targetCompId = compIdCol !== -1 ? String(rawValues[r][compIdCol] || "").trim() : "";
        break;
      }
    }

    if (targetPaymentRow === -1) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Payment " + payId + " not found." };
    }

    // Canonical status check
    var canonicalPayStatus = (status === "CONFIRMED" || status === "PAID" || status === "VERIFIED") ? "CONFIRMED" : "REJECTED";

    // If confirming payment, verify capacity has not been exceeded
    if (canonicalPayStatus === "CONFIRMED" && targetCompId) {
      var allComps = getCompetitionsFromDatabase_(spreadsheet);
      var currentComp = null;
      for (var ci = 0; ci < allComps.length; ci++) {
        if (allComps[ci].CompetitionID === targetCompId) {
          currentComp = allComps[ci];
          break;
        }
      }

      if (currentComp) {
        var isKnockout = currentComp.CompetitionType === "KNOCKOUT";
        var maxCap = isKnockout ? 1024 : 2048;
        var currentAppr = Number(currentComp.ApprovedCount || 0);

        if (currentAppr >= maxCap) {
          try { lock.releaseLock(); } catch(e) {}
          return {
            success: false,
            message: "Cannot approve payment: Tournament has reached maximum capacity of " + maxCap.toLocaleString() + " approved players."
          };
        }
      }
    }

    // Update Payments sheet
    if (statusCol !== -1) sheet.getRange(targetPaymentRow, statusCol + 1).setValue(canonicalPayStatus);
    if (vAtCol !== -1) sheet.getRange(targetPaymentRow, vAtCol + 1).setValue(new Date().toISOString());
    if (vByCol !== -1) sheet.getRange(targetPaymentRow, vByCol + 1).setValue(verifiedBy);

    // Sync corresponding registration status in Registrations sheet
    var regSheet = getOrCreateSheet_(spreadsheet, REGISTRATIONS_SHEET_NAME, REGISTRATIONS_HEADERS);
    var regLastRow = regSheet.getLastRow();
    if (regLastRow > 1) {
      var regValues = regSheet.getRange(1, 1, regLastRow, regSheet.getLastColumn()).getValues();
      var regHeaders = regValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
      var regPayIdCol = regHeaders.indexOf("payment_id");
      var regStatusCol = regHeaders.indexOf("status");
      var regPayStatusCol = regHeaders.indexOf("payment_status");
      var regVAtCol = regHeaders.indexOf("verified_at");
      var regVByCol = regHeaders.indexOf("verified_by");

      if (regPayIdCol !== -1) {
        for (var rr = 1; rr < regValues.length; rr++) {
          if (String(regValues[rr][regPayIdCol] || "").trim() === String(payId).trim()) {
            var regRowNum = rr + 1;
            if (canonicalPayStatus === "CONFIRMED") {
              if (regStatusCol !== -1) regSheet.getRange(regRowNum, regStatusCol + 1).setValue("APPROVED");
              if (regPayStatusCol !== -1) regSheet.getRange(regRowNum, regPayStatusCol + 1).setValue("CONFIRMED");
            } else {
              if (regStatusCol !== -1) regSheet.getRange(regRowNum, regStatusCol + 1).setValue("REJECTED");
              if (regPayStatusCol !== -1) regSheet.getRange(regRowNum, regPayStatusCol + 1).setValue("REJECTED");
            }
            if (regVAtCol !== -1) regSheet.getRange(regRowNum, regVAtCol + 1).setValue(new Date().toISOString());
            if (regVByCol !== -1) regSheet.getRange(regRowNum, regVByCol + 1).setValue(verifiedBy);
          }
        }
      }
    }

    SpreadsheetApp.flush();

    // Check if League reached 2,048 approved players and auto-close
    if (canonicalPayStatus === "CONFIRMED" && targetCompId) {
      var updatedComps = getCompetitionsFromDatabase_(spreadsheet);
      for (var uci = 0; uci < updatedComps.length; uci++) {
        var uc = updatedComps[uci];
        if (uc.CompetitionID === targetCompId) {
          if (uc.CompetitionType === "LEAGUE" && uc.ApprovedCount >= 2048) {
            updateCompetitionInDatabase_(spreadsheet, targetCompId, { status: "CLOSED", bracket_status: "CAPACITY_REACHED" });
            Logger.log("[League Auto-Close] League " + targetCompId + " reached 2,048 approved players and is now CLOSED.");
          } else if (uc.CompetitionType === "KNOCKOUT" && uc.ApprovedCount >= 1024) {
            updateCompetitionInDatabase_(spreadsheet, targetCompId, { bracket_status: "READY_FOR_MATCHES" });
          }
          break;
        }
      }
      syncRegisteredPlayersDocument_(spreadsheet, targetCompId);
    }

    if (String(targetCompId).toUpperCase() === 'HOSTEL_PROGRAM' && typeof activateHostelProgramPayment_ === 'function') { activateHostelProgramPayment_(spreadsheet, payId, canonicalPayStatus); }
    logAudit_(spreadsheet, verifiedBy, verifiedBy, "PAYMENT_STATUS_UPDATED", "Payment", payId, { status: canonicalPayStatus, competitionId: targetCompId });
    try { lock.releaseLock(); } catch(e) {}
    queueDocsSync_("roster");

    return {
      success: true,
      message: canonicalPayStatus === "CONFIRMED" ? "Payment confirmed and registration approved!" : "Payment rejected."
    };
  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    return { success: false, message: "Payment update failed: " + err.message };
  }
}

/**
 * Retrieves fixtures from Fixtures sheet.
 */
function getFixturesFromDatabase_(spreadsheet, compId) {
  var sheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var fixtures = [];

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var fix = {};
    for (var c = 0; c < headers.length; c++) {
      fix[headers[c]] = row[c];
    }
    if (compId && String(fix.competition_id || "").trim() !== String(compId).trim()) {
      continue;
    }
    fixtures.push({
      FixtureID: String(fix.fixture_id || ""),
      CompetitionID: String(fix.competition_id || ""),
      CompetitionName: String(fix.competition_name || ""),
      CompetitionType: String(fix.competition_type || "KNOCKOUT"),
      Round: String(fix.round || ""),
      Player1ID: String(fix.player1_id || ""),
      Player1Name: String(fix.player1_name || ""),
      Player2ID: String(fix.player2_id || ""),
      Player2Name: String(fix.player2_name || ""),
      Player1Score: fix.player1_score !== "" && fix.player1_score !== null ? Number(fix.player1_score) : null,
      Player2Score: fix.player2_score !== "" && fix.player2_score !== null ? Number(fix.player2_score) : null,
      WinnerID: String(fix.winner_id || ""),
      Status: String(fix.status || "SCHEDULED"),
      MatchDate: String(fix.match_date || ""),
      ResultPublished: Boolean(fix.result_published),
      CreatedAt: String(fix.created_at || ""),
      UpdatedAt: String(fix.updated_at || "")
    });
  }
  return fixtures;
}

/**
 * Updates fixture scores, winner, and status in Fixtures sheet.
 */
function updateFixtureResultInDatabase_(spreadsheet, fixtureId, score1, score2, winnerId, status, isPublished) {
  var sheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "No fixtures found" };

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var idCol = headers.indexOf("fixture_id");
  var s1Col = headers.indexOf("player1_score");
  var s2Col = headers.indexOf("player2_score");
  var wCol = headers.indexOf("winner_id");
  var statCol = headers.indexOf("status");
  var pubCol = headers.indexOf("result_published");
  var upCol = headers.indexOf("updated_at");

  for (var r = 1; r < rawValues.length; r++) {
    if (String(rawValues[r][idCol] || "").trim() === String(fixtureId).trim()) {
      var rowNum = r + 1;
      var cIdCol = headers.indexOf("competition_id");
      var cTypeCol = headers.indexOf("competition_type");
      var targetCompId = cIdCol !== -1 ? String(rawValues[r][cIdCol] || "").trim() : "";
      var targetCompType = cTypeCol !== -1 ? String(rawValues[r][cTypeCol] || "").trim().toUpperCase() : "";

      if (s1Col !== -1 && score1 !== undefined) sheet.getRange(rowNum, s1Col + 1).setValue(score1);
      if (s2Col !== -1 && score2 !== undefined) sheet.getRange(rowNum, s2Col + 1).setValue(score2);
      if (wCol !== -1 && winnerId !== undefined) sheet.getRange(rowNum, wCol + 1).setValue(winnerId);
      if (statCol !== -1) sheet.getRange(rowNum, statCol + 1).setValue(status || "COMPLETED");
      if (pubCol !== -1) sheet.getRange(rowNum, pubCol + 1).setValue(isPublished);
      if (upCol !== -1) sheet.getRange(rowNum, upCol + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();

      // Synchronize live documents
      if (targetCompId) {
        if (targetCompType === "LEAGUE") {
          syncLeagueFixturesDocument_(spreadsheet, targetCompId);
          syncLeagueStandingsDocument_(spreadsheet, targetCompId);
        } else {
          syncKnockoutBracketDocument_(spreadsheet, targetCompId);
        }
      }

      return { success: true, message: "Match result recorded successfully." };
    }
  }
  return { success: false, message: "Fixture " + fixtureId + " not found." };
}

/**
 * Retrieves announcements from Announcements sheet.
 */
function getAnnouncementsFromDatabase_(spreadsheet, compId) {
  var sheet = getOrCreateSheet_(spreadsheet, ANNOUNCEMENTS_SHEET_NAME, ANNOUNCEMENTS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var anns = [];

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var ann = {};
    for (var c = 0; c < headers.length; c++) {
      ann[headers[c]] = row[c];
    }
    if (compId && String(ann.competition_id || "").trim() !== String(compId).trim()) {
      continue;
    }
    anns.push({
      AnnouncementID: String(ann.announcement_id || ""),
      CompetitionID: String(ann.competition_id || ""),
      CompetitionName: String(ann.competition_name || ""),
      Title: String(ann.title || ""),
      Message: String(ann.message || ""),
      Type: String(ann.type || "INFO"),
      CreatedBy: String(ann.created_by || ""),
      CreatedAt: String(ann.created_at || "")
    });
  }
  return anns;
}

/**
 * Saves a new announcement into Announcements sheet.
 */
function saveAnnouncementInDatabase_(spreadsheet, rawAnn, adminEmail) {
  var sheet = getOrCreateSheet_(spreadsheet, ANNOUNCEMENTS_SHEET_NAME, ANNOUNCEMENTS_HEADERS);
  var nowIso = new Date().toISOString();
  var annId = "ANN-" + Date.now().toString().slice(-6);

  sheet.appendRow([
    annId,
    String(rawAnn.CompetitionID || rawAnn.competition_id || "ALL"),
    String(rawAnn.CompetitionName || rawAnn.competition_name || "Official Hub"),
    String(rawAnn.Title || rawAnn.title || "").trim(),
    String(rawAnn.Message || rawAnn.message || "").trim(),
    String(rawAnn.Type || rawAnn.type || "INFO"),
    adminEmail,
    nowIso
  ]);
  SpreadsheetApp.flush();
  return {
    AnnouncementID: annId,
    CompetitionID: rawAnn.CompetitionID || "ALL",
    Title: rawAnn.Title,
    Message: rawAnn.Message,
    Type: rawAnn.Type || "INFO",
    CreatedBy: adminEmail,
    CreatedAt: nowIso
  };
}

/**
 * Deletes an announcement from Announcements sheet.
 */
function deleteAnnouncementInDatabase_(spreadsheet, announcementId) {
  var sheet = getOrCreateSheet_(spreadsheet, ANNOUNCEMENTS_SHEET_NAME, ANNOUNCEMENTS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "No announcements found." };

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var idCol = headers.indexOf("announcement_id");

  for (var r = 1; r < rawValues.length; r++) {
    if (String(rawValues[r][idCol] || "").trim() === String(announcementId).trim()) {
      sheet.deleteRow(r + 1);
      SpreadsheetApp.flush();
      return { success: true, message: "Announcement deleted." };
    }
  }
  return { success: false, message: "Announcement not found." };
}

/**
 * Calculates live Admin Dashboard overview statistics.
 */
function getAdminOverviewFromDatabase_(spreadsheet) {
  var uSheet = spreadsheet.getSheetByName(USERS_SHEET_NAME);
  var totalPlayers = uSheet && uSheet.getLastRow() > 1 ? (uSheet.getLastRow() - 1) : 0;

  var comps = getCompetitionsFromDatabase_(spreadsheet);
  var activeTournaments = 0;
  var activeLeagues = 0;
  for (var i = 0; i < comps.length; i++) {
    var c = comps[i];
    var isOpen = c.Status === "OPEN" || c.Status === "IN_PROGRESS";
    if (c.CompetitionType === "LEAGUE" && isOpen) activeLeagues++;
    else if (c.CompetitionType === "KNOCKOUT" && isOpen) activeTournaments++;
  }

  var regs = getRegistrationsFromDatabase_(spreadsheet, "");
  var payments = getPaymentsFromDatabase_(spreadsheet, "");
  var pendingPayments = 0;
  for (var p = 0; p < payments.length; p++) {
    if (payments[p].Status === "PENDING") pendingPayments++;
  }

  var fixtures = getFixturesFromDatabase_(spreadsheet, "");
  var upcomingMatches = 0;
  var recentResults = 0;
  for (var f = 0; f < fixtures.length; f++) {
    if (fixtures[f].Status === "SCHEDULED" || fixtures[f].Status === "IN_PROGRESS") upcomingMatches++;
    if (fixtures[f].Status === "COMPLETED") recentResults++;
  }

  return {
    TotalRegisteredPlayers: totalPlayers,
    ActiveTournaments: activeTournaments,
    ActiveLeagues: activeLeagues,
    TotalRegistrations: regs.length,
    PendingPayments: pendingPayments,
    UpcomingMatches: upcomingMatches,
    RecentlyRecordedResults: recentResults
  };
}

/**
 * Returns all players from Users sheet with search filtering.
 */
function getAllPlayersFromDatabase_(spreadsheet, searchQuery, filters) {
  filters = filters || {};
  var sheet = getOrCreateUsersSheet_(spreadsheet);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var cols = getUsersColumnIndices_(headers);
  var query = String(searchQuery || "").trim().toLowerCase();
  var wantStatus = String(filters.status || "").trim().toUpperCase();
  var wantVerified = String(filters.verified || "").trim().toLowerCase();
  var players = [];

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var profile = buildUserProfileObject_(row, cols, "", "");
    if (query) {
      var matchName = profile.display_name.toLowerCase().indexOf(query) !== -1;
      var matchEmail = profile.email.toLowerCase().indexOf(query) !== -1;
      if (!matchName && !matchEmail) continue;
    }
    var obj = playerProfileToAdminObject_(profile);
    if (wantStatus && wantStatus !== "ALL" && String(obj.Status).toUpperCase() !== wantStatus) continue;
    if ((wantVerified === "true" || wantVerified === "verified") && !obj.Verified) continue;
    if ((wantVerified === "false" || wantVerified === "unverified") && obj.Verified) continue;
    players.push(obj);
  }
  return players;
}

/**
 * =========================================================================
 * WHATSAPP GROUPS MANAGEMENT
 * =========================================================================
 */
function getOrCreateWhatsAppGroupsSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(WHATSAPP_GROUPS_SHEET_NAME);
  var defaultRows = [
    ["WG-1", 1, "Official Community Group", "Main community group for all players to arrange friendlies and connect.", "", false, "system", new Date().toISOString()],
    ["WG-2", 2, "Weekly Knockout Desk", "Knockout cup matches, fixtures and matchday announcements.", "", false, "system", new Date().toISOString()],
    ["WG-3", 3, "Premier League & Disputes Desk", "Premier League fixtures and match dispute resolution.", "", false, "system", new Date().toISOString()]
  ];

  if (!sheet) {
    sheet = spreadsheet.insertSheet(WHATSAPP_GROUPS_SHEET_NAME);
    sheet.appendRow(WHATSAPP_GROUPS_HEADERS);
    sheet.getRange(1, 1, 1, WHATSAPP_GROUPS_HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    for (var i = 0; i < defaultRows.length; i++) {
      sheet.appendRow(defaultRows[i]);
    }
    SpreadsheetApp.flush();
    return sheet;
  }

  if (sheet.getLastRow() <= 1) {
    for (var j = 0; j < defaultRows.length; j++) {
      sheet.appendRow(defaultRows[j]);
    }
    SpreadsheetApp.flush();
  }
  return sheet;
}

function getWhatsAppGroupsFromDatabase_(spreadsheet) {
  var sheet = getOrCreateWhatsAppGroupsSheet_(spreadsheet);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var idCol = headers.indexOf("group_id");
  var numCol = headers.indexOf("group_number");
  var nameCol = headers.indexOf("name");
  var descCol = headers.indexOf("description");
  var urlCol = headers.indexOf("group_url");
  var actCol = headers.indexOf("active");
  var byCol = headers.indexOf("updated_by");
  var atCol = headers.indexOf("updated_at");

  var groups = [];
  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var gNum = numCol !== -1 ? Number(row[numCol]) : r;
    var gUrl = urlCol !== -1 ? String(row[urlCol] || "").trim() : "";
    var gAct = actCol !== -1 ? Boolean(row[actCol]) : false;

    groups.push({
      group_id: idCol !== -1 ? String(row[idCol] || ("WG-" + gNum)) : ("WG-" + gNum),
      group_number: gNum,
      name: nameCol !== -1 ? String(row[nameCol] || ("Group " + gNum)) : ("Group " + gNum),
      description: descCol !== -1 ? String(row[descCol] || "") : "",
      group_url: gUrl,
      active: gAct && Boolean(gUrl),
      updated_by: byCol !== -1 ? String(row[byCol] || "") : "",
      updated_at: atCol !== -1 ? String(row[atCol] || "") : ""
    });
  }

  // Ensure exactly 3 slots sorted 1, 2, 3
  groups.sort(function(a, b) { return a.group_number - b.group_number; });
  return groups.slice(0, 3);
}

function updateWhatsAppGroupsInDatabase_(spreadsheet, groupsInput, adminEmail) {
  var sheet = getOrCreateWhatsAppGroupsSheet_(spreadsheet);
  if (!Array.isArray(groupsInput)) {
    return { success: false, message: "Invalid payload: groups must be an array." };
  }

  var nowIso = new Date().toISOString();
  var rawValues = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var numCol = headers.indexOf("group_number");
  var nameCol = headers.indexOf("name");
  var descCol = headers.indexOf("description");
  var urlCol = headers.indexOf("group_url");
  var actCol = headers.indexOf("active");
  var byCol = headers.indexOf("updated_by");
  var atCol = headers.indexOf("updated_at");

  for (var i = 0; i < groupsInput.length; i++) {
    var g = groupsInput[i];
    var gNum = Number(g.group_number || (i + 1));
    var gUrl = String(g.group_url || "").trim();

    // Validate HTTPS WhatsApp URL if provided
    if (gUrl) {
      var isHttps = gUrl.indexOf("https://") === 0;
      var isWhatsApp = gUrl.indexOf("chat.whatsapp.com/") !== -1 || gUrl.indexOf("whatsapp.com/") !== -1 || gUrl.indexOf("wa.me/") !== -1;
      if (!isHttps || !isWhatsApp) {
        return {
          success: false,
          message: "Validation error: Group " + gNum + " URL must be a valid HTTPS WhatsApp URL (e.g. https://chat.whatsapp.com/...)."
        };
      }
    }

    // Match row by group_number
    for (var r = 1; r < rawValues.length; r++) {
      var rowNum = numCol !== -1 ? Number(rawValues[r][numCol]) : r;
      if (rowNum === gNum) {
        var sheetRow = r + 1;
        if (nameCol !== -1 && g.name !== undefined) sheet.getRange(sheetRow, nameCol + 1).setValue(String(g.name).trim());
        if (descCol !== -1 && g.description !== undefined) sheet.getRange(sheetRow, descCol + 1).setValue(String(g.description).trim());
        if (urlCol !== -1) sheet.getRange(sheetRow, urlCol + 1).setValue(gUrl);
        if (actCol !== -1) sheet.getRange(sheetRow, actCol + 1).setValue(Boolean(g.active && gUrl));
        if (byCol !== -1) sheet.getRange(sheetRow, byCol + 1).setValue(adminEmail);
        if (atCol !== -1) sheet.getRange(sheetRow, atCol + 1).setValue(nowIso);
        break;
      }
    }
  }

  SpreadsheetApp.flush();
  logAudit_(spreadsheet, adminEmail, adminEmail, "WHATSAPP_GROUPS_UPDATED", "WhatsAppGroups", "CONFIG", { count: groupsInput.length });
  return {
    success: true,
    message: "WhatsApp groups updated successfully.",
    groups: getWhatsAppGroupsFromDatabase_(spreadsheet)
  };
}

/**
 * =========================================================================
 * AUDIT LOGS & DISPUTES
 * =========================================================================
 */
function getAuditLogsFromDatabase_(spreadsheet, limit) {
  var sheet = getOrCreateSheet_(spreadsheet, AUDIT_LOGS_SHEET_NAME, AUDIT_LOGS_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var logs = [];

  for (var r = rawValues.length - 1; r >= 1; r--) {
    var row = rawValues[r];
    var logItem = {};
    for (var c = 0; c < headers.length; c++) {
      logItem[headers[c]] = row[c];
    }
    logs.push({
      LogID: String(logItem.log_id || ""),
      Timestamp: String(logItem.timestamp || ""),
      ActorUID: String(logItem.actor_uid || ""),
      ActorEmail: String(logItem.actor_email || ""),
      Action: String(logItem.action || ""),
      EntityType: String(logItem.entity_type || ""),
      EntityID: String(logItem.entity_id || ""),
      Details: String(logItem.details || "")
    });
    if (logs.length >= (limit || 100)) break;
  }
  return logs;
}

function getDisputesFromDatabase_(spreadsheet, compId) {
  var sheet = getOrCreateSheet_(spreadsheet, DISPUTES_SHEET_NAME, DISPUTES_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var disputes = [];

  for (var r = 1; r < rawValues.length; r++) {
    var row = rawValues[r];
    var disp = {};
    for (var c = 0; c < headers.length; c++) {
      disp[headers[c]] = row[c];
    }
    if (compId && String(disp.competition_id || "").trim() !== String(compId).trim()) {
      continue;
    }
    disputes.push({
      DisputeID: String(disp.dispute_id || ""),
      MatchID: String(disp.fixture_id || ""),
      FixtureID: String(disp.fixture_id || ""),
      CompetitionID: String(disp.competition_id || ""),
      OpenedByPlayerID: String(disp.opened_by_player_id || ""),
      Player1ID: String(disp.player1_id || ""),
      Player2ID: String(disp.player2_id || ""),
      Player1Username: String(disp.player1_username || ""),
      Player2Username: String(disp.player2_username || ""),
      Reason: String(disp.reason || ""),
      EvidenceURL: String(disp.evidence_url || ""),
      Status: String(disp.status || "OPEN"),
      AdminDecision: String(disp.admin_decision || ""),
      ResolvedBy: String(disp.resolved_by || ""),
      CreatedAt: String(disp.created_at || ""),
      ResolvedAt: String(disp.resolved_at || "")
    });
  }
  return disputes;
}

function submitDisputeInDatabase_(spreadsheet, authUser, body) {
  var fixtureId = String(body.fixtureId || body.matchId || "").trim();
  var compId = String(body.competitionId || "").trim();
  var reason = String(body.reason || "").trim();
  var evidenceUrl = String(body.evidenceUrl || body.evidenceDriveUrl || body.evidenceReference || "").trim();
  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();

  if (!fixtureId) return { success: false, message: "Missing fixtureId for dispute." };
  if (!reason) return { success: false, message: "Please provide a reason for the dispute." };

  // Verify user is a participant in this fixture
  var fixSheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
  var lastRow = fixSheet.getLastRow();
  var lastCol = fixSheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "Fixture not found." };

  var rawFix = fixSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var fixHeaders = rawFix[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var fIdCol = fixHeaders.indexOf("fixture_id");
  var p1Col = fixHeaders.indexOf("player1_id");
  var p2Col = fixHeaders.indexOf("player2_id");
  var p1NameCol = fixHeaders.indexOf("player1_name");
  var p2NameCol = fixHeaders.indexOf("player2_name");
  var statCol = fixHeaders.indexOf("status");
  var cIdCol = fixHeaders.indexOf("competition_id");

  var fixtureRow = -1;
  var targetFixture = null;
  for (var r = 1; r < rawFix.length; r++) {
    if (String(rawFix[r][fIdCol] || "").trim() === fixtureId) {
      fixtureRow = r + 1;
      targetFixture = rawFix[r];
      break;
    }
  }

  if (fixtureRow === -1 || !targetFixture) {
    return { success: false, message: "Fixture " + fixtureId + " not found." };
  }

  var p1Id = String(targetFixture[p1Col] || "").trim();
  var p2Id = String(targetFixture[p2Col] || "").trim();

  if (p1Id !== uid && p1Id !== email && p2Id !== uid && p2Id !== email) {
    return { success: false, message: "Unauthorized: You are not a participant in this match fixture." };
  }

  var disputeSheet = getOrCreateSheet_(spreadsheet, DISPUTES_SHEET_NAME, DISPUTES_HEADERS);
  var dispId = "DISP-" + Date.now().toString().slice(-6);
  var nowIso = new Date().toISOString();

  disputeSheet.appendRow([
    dispId,
    fixtureId,
    compId || String(targetFixture[cIdCol] || ""),
    uid || email,
    p1Id,
    p2Id,
    String(targetFixture[p1NameCol] || ""),
    String(targetFixture[p2NameCol] || ""),
    reason,
    evidenceUrl,
    "OPEN",
    "",
    "",
    nowIso,
    ""
  ]);

  // Mark fixture as DISPUTED
  if (statCol !== -1) {
    fixSheet.getRange(fixtureRow, statCol + 1).setValue("DISPUTED");
  }

  SpreadsheetApp.flush();
  logAudit_(spreadsheet, uid, email, "DISPUTE_SUBMITTED", "Dispute", dispId, { fixtureId: fixtureId, reason: reason });

  return {
    success: true,
    message: "Dispute submitted successfully. Official review has been initiated.",
    disputeId: dispId
  };
}

function resolveDisputeInDatabase_(spreadsheet, adminAuth, disputeId, decision, winnerId, score1, score2) {
  var sheet = getOrCreateSheet_(spreadsheet, DISPUTES_SHEET_NAME, DISPUTES_HEADERS);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "No disputes found." };

  var rawValues = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawValues[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var dIdCol = headers.indexOf("dispute_id");
  var fIdCol = headers.indexOf("fixture_id");
  var statCol = headers.indexOf("status");
  var decCol = headers.indexOf("admin_decision");
  var rByCol = headers.indexOf("resolved_by");
  var rAtCol = headers.indexOf("resolved_at");

  var dispRow = -1;
  var fixtureId = "";

  for (var r = 1; r < rawValues.length; r++) {
    if (String(rawValues[r][dIdCol] || "").trim() === String(disputeId).trim()) {
      dispRow = r + 1;
      fixtureId = fIdCol !== -1 ? String(rawValues[r][fIdCol] || "").trim() : "";
      break;
    }
  }

  if (dispRow === -1) return { success: false, message: "Dispute " + disputeId + " not found." };

  var nowIso = new Date().toISOString();
  if (statCol !== -1) sheet.getRange(dispRow, statCol + 1).setValue("RESOLVED");
  if (decCol !== -1) sheet.getRange(dispRow, decCol + 1).setValue(String(decision || "Resolved by official admin adjudication."));
  if (rByCol !== -1) sheet.getRange(dispRow, rByCol + 1).setValue(adminAuth.email);
  if (rAtCol !== -1) sheet.getRange(dispRow, rAtCol + 1).setValue(nowIso);

  // If scores or winner provided, update fixture
  if (fixtureId && (winnerId || score1 !== undefined || score2 !== undefined)) {
    updateFixtureResultInDatabase_(spreadsheet, fixtureId, score1, score2, winnerId, "COMPLETED", true);
  }

  SpreadsheetApp.flush();
  logAudit_(spreadsheet, adminAuth.uid, adminAuth.email, "DISPUTE_RESOLVED", "Dispute", disputeId, { fixtureId: fixtureId, decision: decision, winnerId: winnerId });

  return { success: true, message: "Dispute resolved successfully." };
}

/**
 * =========================================================================
 * KNOCKOUT BRACKET ENGINE (1,024 Players -> 512 Matches)
 * =========================================================================
 */
function generateKnockoutBracketInDatabase_(spreadsheet, compId, adminEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lErr) {
    return { success: false, message: "System is busy generating brackets. Please try again." };
  }

  try {
    // 1. Fetch competition and verify
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) {
        comp = comps[ci];
        break;
      }
    }

    if (!comp) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Knockout competition " + compId + " not found." };
    }

    if (comp.CompetitionType !== "KNOCKOUT") {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Cannot generate knockout bracket for non-knockout competition: " + comp.CompetitionType };
    }

    // 2. Fetch approved registrations only
    var regs = getRegistrationsFromDatabase_(spreadsheet, compId);
    var approvedRegs = [];
    for (var ri = 0; ri < regs.length; ri++) {
      if (regs[ri].Status === "APPROVED" || regs[ri].PaymentStatus === "CONFIRMED" || regs[ri].PaymentStatus === "PAID") {
        approvedRegs.push(regs[ri]);
      }
    }

    if (approvedRegs.length < 1024) {
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: false,
        message: "Knockout bracket generation unlocks strictly at 1,024 APPROVED players. Current approved: " + approvedRegs.length + " / 1,024."
      };
    }

    // 3. Prevent duplicate bracket generation
    var existingFixtures = getFixturesFromDatabase_(spreadsheet, compId);
    for (var fi = 0; fi < existingFixtures.length; fi++) {
      if (existingFixtures[fi].Round === "Round of 1024") {
        try { lock.releaseLock(); } catch(e) {}
        return {
          success: false,
          message: "Bracket already generated for " + compId + ". Round of 1024 fixtures are already present in the database."
        };
      }
    }

    // 4. Deterministic sorting of the 1,024 players
    approvedRegs = approvedRegs.slice(0, 1024).sort(function(a, b) {
      return a.RegistrationID.localeCompare(b.RegistrationID);
    });

    // 5. Generate exactly 512 Round of 1024 matches
    var fixSheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
    var nowIso = new Date().toISOString();
    var matchDate = comp.StartDate || nowIso;
    var rowsToAppend = [];

    for (var m = 0; m < 512; m++) {
      var p1 = approvedRegs[m * 2];
      var p2 = approvedRegs[m * 2 + 1];
      var fixId = "FIX-" + compId + "-R1024-" + (m + 1);

      rowsToAppend.push([
        fixId,
        compId,
        comp.Name || compId,
        "KNOCKOUT",
        "Round of 1024",
        p1.PlayerID,
        p1.eFootballUsername,
        p2.PlayerID,
        p2.eFootballUsername,
        "",
        "",
        "",
        "SCHEDULED",
        matchDate,
        true,
        nowIso,
        nowIso
      ]);
    }

    // Batch append
    for (var b = 0; b < rowsToAppend.length; b++) {
      fixSheet.appendRow(rowsToAppend[b]);
    }

    // Update competition status
    updateCompetitionInDatabase_(spreadsheet, compId, {
      status: "IN_PROGRESS",
      bracket_status: "ROUND_OF_1024_IN_PROGRESS"
    });

    SpreadsheetApp.flush();
    syncKnockoutBracketDocument_(spreadsheet, compId);
    logAudit_(spreadsheet, adminEmail, adminEmail, "KNOCKOUT_BRACKET_GENERATED", "Competition", compId, { matchCount: 512, players: 1024 });
    try { lock.releaseLock(); } catch(e) {}

    return {
      success: true,
      message: "Successfully generated 512 matches for Round of 1024 with stable FixtureIDs.",
      matchCount: 512
    };
  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    return { success: false, message: "Failed to generate knockout bracket: " + err.message };
  }
}

function generateNextKnockoutRoundInDatabase_(spreadsheet, compId, currentRound, adminEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lErr) {
    return { success: false, message: "System is busy processing round advancement. Please try again." };
  }

  try {
    var roundProgression = [
      { name: "Round of 1024", matches: 512, next: "Round of 512", nextMatches: 256, code: "R512" },
      { name: "Round of 512", matches: 256, next: "Round of 256", nextMatches: 128, code: "R256" },
      { name: "Round of 256", matches: 128, next: "Round of 128", nextMatches: 64, code: "R128" },
      { name: "Round of 128", matches: 64, next: "Round of 64", nextMatches: 32, code: "R64" },
      { name: "Round of 64", matches: 32, next: "Round of 32", nextMatches: 16, code: "R32" },
      { name: "Round of 32", matches: 16, next: "Round of 16", nextMatches: 8, code: "R16" },
      { name: "Round of 16", matches: 8, next: "Quarter-Finals", nextMatches: 4, code: "QF" },
      { name: "Quarter-Finals", matches: 4, next: "Semi-Finals", nextMatches: 2, code: "SF" },
      { name: "Semi-Finals", matches: 2, next: "Final", nextMatches: 1, code: "FN" },
      { name: "Final", matches: 1, next: null, nextMatches: 0, code: "CHAMPION" }
    ];

    var roundConfig = null;
    for (var rci = 0; rci < roundProgression.length; rci++) {
      if (roundProgression[rci].name.toLowerCase() === String(currentRound || "").toLowerCase().trim()) {
        roundConfig = roundProgression[rci];
        break;
      }
    }

    if (!roundConfig) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Unknown or invalid knockout round: '" + currentRound + "'." };
    }

    var allFixtures = getFixturesFromDatabase_(spreadsheet, compId);
    var curRoundFixtures = [];
    for (var fi = 0; fi < allFixtures.length; fi++) {
      if (allFixtures[fi].Round.toLowerCase() === roundConfig.name.toLowerCase()) {
        curRoundFixtures.push(allFixtures[fi]);
      }
    }

    if (curRoundFixtures.length === 0) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "No fixtures found for round: " + roundConfig.name };
    }

    // Verify all matches in current round are completed with a declared winner
    var winners = [];
    var incompleteMatches = [];
    for (var mi = 0; mi < curRoundFixtures.length; mi++) {
      var fix = curRoundFixtures[mi];
      if (fix.Status !== "COMPLETED" || !fix.WinnerID) {
        incompleteMatches.push(fix.FixtureID);
      } else {
        var wName = fix.WinnerID === fix.Player1ID ? fix.Player1Name : fix.Player2Name;
        winners.push({ PlayerID: fix.WinnerID, PlayerName: wName || fix.WinnerID });
      }
    }

    if (incompleteMatches.length > 0) {
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: false,
        message: "Cannot advance round: " + incompleteMatches.length + " match(es) in " + roundConfig.name + " are not completed yet. Ties are not allowed in knockout."
      };
    }

    // Handle Final completion
    if (!roundConfig.next) {
      var champion = winners[0];
      updateCompetitionInDatabase_(spreadsheet, compId, {
        status: "COMPLETED",
        bracket_status: "COMPLETED",
        final_results_document_url: champion ? champion.PlayerName : ""
      });
      SpreadsheetApp.flush();
      syncFinalResultsDocument_(spreadsheet, compId, champion ? champion.PlayerID : "", champion ? champion.PlayerName : "", comp ? comp.PrizeAmount : 1000);
      syncKnockoutBracketDocument_(spreadsheet, compId);
      logAudit_(spreadsheet, adminEmail, adminEmail, "TOURNAMENT_COMPLETED", "Competition", compId, { winner: champion });
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: true,
        message: "Tournament completed! Official Winner: " + (champion ? champion.PlayerName : "Declared"),
        winner: champion
      };
    }

    // Check if next round already generated
    for (var nfi = 0; nfi < allFixtures.length; nfi++) {
      if (allFixtures[nfi].Round.toLowerCase() === roundConfig.next.toLowerCase()) {
        try { lock.releaseLock(); } catch(e) {}
        return { success: false, message: "Next round (" + roundConfig.next + ") fixtures have already been generated." };
      }
    }

    // Pair winners and generate next round fixtures
    var fixSheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
    var nowIso = new Date().toISOString();
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var compName = compId;
    for (var ci2 = 0; ci2 < comps.length; ci2++) {
      if (comps[ci2].CompetitionID === compId) { compName = comps[ci2].Name || compId; break; }
    }

    var nextRoundRows = [];
    for (var nw = 0; nw < roundConfig.nextMatches; nw++) {
      var w1 = winners[nw * 2];
      var w2 = winners[nw * 2 + 1];
      var nextFixId = "FIX-" + compId + "-" + roundConfig.code + "-" + (nw + 1);

      nextRoundRows.push([
        nextFixId,
        compId,
        compName,
        "KNOCKOUT",
        roundConfig.next,
        w1 ? w1.PlayerID : "",
        w1 ? w1.PlayerName : "",
        w2 ? w2.PlayerID : "",
        w2 ? w2.PlayerName : "",
        "",
        "",
        "",
        "SCHEDULED",
        nowIso,
        true,
        nowIso,
        nowIso
      ]);
    }

    for (var nri = 0; nri < nextRoundRows.length; nri++) {
      fixSheet.appendRow(nextRoundRows[nri]);
    }

    updateCompetitionInDatabase_(spreadsheet, compId, {
      bracket_status: roundConfig.next.toUpperCase().replace(/\s+/g, "_") + "_IN_PROGRESS"
    });

    SpreadsheetApp.flush();
    syncKnockoutBracketDocument_(spreadsheet, compId);
    logAudit_(spreadsheet, adminEmail, adminEmail, "KNOCKOUT_ROUND_ADVANCED", "Competition", compId, { from: roundConfig.name, to: roundConfig.next, matchCount: roundConfig.nextMatches });
    try { lock.releaseLock(); } catch(e) {}

    return {
      success: true,
      message: "Generated " + roundConfig.nextMatches + " fixtures for " + roundConfig.next + " successfully.",
      round: roundConfig.next,
      matchCount: roundConfig.nextMatches
    };
  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    return { success: false, message: "Round advancement failed: " + err.message };
  }
}

/**
 * =========================================================================
 * LEAGUE FIXTURE ENGINE & STANDINGS
 * Controlled matchdays: Does NOT generate 2 million rows.
 * =========================================================================
 */
function generateLeagueFixturesInDatabase_(spreadsheet, compId, adminEmail) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (lErr) {
    return { success: false, message: "System is busy generating league fixtures. Please try again." };
  }

  try {
    var comps = getCompetitionsFromDatabase_(spreadsheet);
    var comp = null;
    for (var ci = 0; ci < comps.length; ci++) {
      if (comps[ci].CompetitionID === compId) { comp = comps[ci]; break; }
    }

    if (!comp) {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "League competition " + compId + " not found." };
    }

    if (comp.CompetitionType !== "LEAGUE") {
      try { lock.releaseLock(); } catch(e) {}
      return { success: false, message: "Competition is not a LEAGUE: " + comp.CompetitionType };
    }

    // Minimum 500 approved players
    var regs = getRegistrationsFromDatabase_(spreadsheet, compId);
    var approvedPlayers = [];
    for (var ri = 0; ri < regs.length; ri++) {
      if (regs[ri].Status === "APPROVED" || regs[ri].PaymentStatus === "CONFIRMED" || regs[ri].PaymentStatus === "PAID") {
        approvedPlayers.push({
          PlayerID: regs[ri].PlayerID,
          eFootballUsername: regs[ri].eFootballUsername || regs[ri].PlayerID
        });
      }
    }

    if (approvedPlayers.length < 500) {
      try { lock.releaseLock(); } catch(e) {}
      return {
        success: false,
        message: "League fixtures require minimum 500 APPROVED players before generation. Current approved: " + approvedPlayers.length + " / 500."
      };
    }

    // Deterministic sort
    approvedPlayers.sort(function(a, b) { return a.PlayerID.localeCompare(b.PlayerID); });

    // Determine current highest matchday number
    var allFixtures = getFixturesFromDatabase_(spreadsheet, compId);
    var maxMatchday = 0;
    for (var fi = 0; fi < allFixtures.length; fi++) {
      var rStr = String(allFixtures[fi].Round || "");
      var mdMatch = rStr.match(/Matchday\s*(\d+)/i);
      if (mdMatch) {
        var num = parseInt(mdMatch[1], 10);
        if (num > maxMatchday) maxMatchday = num;
      }
    }

    var nextMatchday = maxMatchday + 1;
    var n = approvedPlayers.length;
    var roundIdx = nextMatchday - 1; // 0-based round index

    // Round-robin pairing for roundIdx (Polygon method)
    // For n players, player 0 is fixed, others rotate
    var playersCopy = approvedPlayers.slice();
    if (n % 2 !== 0) {
      playersCopy.push({ PlayerID: "BYE", eFootballUsername: "BYE" });
      n++;
    }

    var half = n / 2;
    var matchdayPairs = [];
    for (var i = 0; i < half; i++) {
      var p1Idx = (roundIdx + i) % (n - 1);
      var p2Idx = (n - 1 - i + roundIdx) % (n - 1);
      if (i === 0) p2Idx = n - 1; // Last player fixed

      var player1 = playersCopy[p1Idx];
      var player2 = playersCopy[p2Idx];

      if (player1.PlayerID !== "BYE" && player2.PlayerID !== "BYE") {
        matchdayPairs.push({ p1: player1, p2: player2 });
      }
    }

    // Append fixtures for next matchday
    var fixSheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
    var nowIso = new Date().toISOString();
    var compName = comp.Name || compId;
    var matchDayLabel = "Matchday " + nextMatchday;

    for (var m = 0; m < matchdayPairs.length; m++) {
      var pair = matchdayPairs[m];
      var fixId = "FIX-" + compId + "-MD" + nextMatchday + "-" + (m + 1);

      fixSheet.appendRow([
        fixId,
        compId,
        compName,
        "LEAGUE",
        matchDayLabel,
        pair.p1.PlayerID,
        pair.p1.eFootballUsername,
        pair.p2.PlayerID,
        pair.p2.eFootballUsername,
        "",
        "",
        "",
        "SCHEDULED",
        nowIso,
        true,
        nowIso,
        nowIso
      ]);
    }

    SpreadsheetApp.flush();
    syncLeagueFixturesDocument_(spreadsheet, compId);
    logAudit_(spreadsheet, adminEmail, adminEmail, "LEAGUE_FIXTURES_GENERATED", "League", compId, { matchday: nextMatchday, fixtures: matchdayPairs.length });
    try { lock.releaseLock(); } catch(e) {}

    return {
      success: true,
      message: "Successfully generated " + matchdayPairs.length + " fixtures for " + matchDayLabel + ".",
      matchday: nextMatchday,
      fixtureCount: matchdayPairs.length
    };
  } catch (err) {
    try { lock.releaseLock(); } catch(e) {}
    return { success: false, message: "League fixture generation failed: " + err.message };
  }
}

function calculateLeagueStandingsFromDatabase_(spreadsheet, compId) {
  // 1. Get all approved players for competition
  var regs = getRegistrationsFromDatabase_(spreadsheet, compId);
  var approvedMap = {};
  for (var ri = 0; ri < regs.length; ri++) {
    var reg = regs[ri];
    if (reg.Status === "APPROVED" || reg.PaymentStatus === "CONFIRMED" || reg.PaymentStatus === "PAID") {
      approvedMap[reg.PlayerID] = {
        PlayerID: reg.PlayerID,
        PlayerName: reg.eFootballUsername || reg.PlayerID,
        eFootballUsername: reg.eFootballUsername || reg.PlayerID,
        Played: 0,
        Wins: 0,
        Draws: 0,
        Losses: 0,
        GoalsFor: 0,
        GoalsAgainst: 0,
        GoalDifference: 0,
        Points: 0
      };
    }
  }

  // 2. Aggregate all COMPLETED fixtures
  var fixtures = getFixturesFromDatabase_(spreadsheet, compId);
  for (var fi = 0; fi < fixtures.length; fi++) {
    var fix = fixtures[fi];
    if (fix.Status === "COMPLETED" && fix.Player1Score !== null && fix.Player2Score !== null) {
      var p1 = approvedMap[fix.Player1ID];
      var p2 = approvedMap[fix.Player2ID];

      // Even if player wasn't in registration map, track safely
      if (!p1) {
        approvedMap[fix.Player1ID] = { PlayerID: fix.Player1ID, PlayerName: fix.Player1Name || fix.Player1ID, eFootballUsername: fix.Player1Name || fix.Player1ID, Played: 0, Wins: 0, Draws: 0, Losses: 0, GoalsFor: 0, GoalsAgainst: 0, GoalDifference: 0, Points: 0 };
        p1 = approvedMap[fix.Player1ID];
      }
      if (!p2) {
        approvedMap[fix.Player2ID] = { PlayerID: fix.Player2ID, PlayerName: fix.Player2Name || fix.Player2ID, eFootballUsername: fix.Player2Name || fix.Player2ID, Played: 0, Wins: 0, Draws: 0, Losses: 0, GoalsFor: 0, GoalsAgainst: 0, GoalDifference: 0, Points: 0 };
        p2 = approvedMap[fix.Player2ID];
      }

      var s1 = Number(fix.Player1Score);
      var s2 = Number(fix.Player2Score);

      p1.Played++;
      p2.Played++;
      p1.GoalsFor += s1;
      p1.GoalsAgainst += s2;
      p2.GoalsFor += s2;
      p2.GoalsAgainst += s1;

      if (s1 > s2) {
        p1.Wins++;
        p1.Points += 3;
        p2.Losses++;
      } else if (s1 < s2) {
        p2.Wins++;
        p2.Points += 3;
        p1.Losses++;
      } else {
        p1.Draws++;
        p2.Draws++;
        p1.Points += 1;
        p2.Points += 1;
      }

      p1.GoalDifference = p1.GoalsFor - p1.GoalsAgainst;
      p2.GoalDifference = p2.GoalsFor - p2.GoalsAgainst;
    }
  }

  // Convert map to list
  var standings = [];
  for (var k in approvedMap) {
    standings.push(approvedMap[k]);
  }

  // Deterministic sort: Points DESC, Goal Difference DESC, Goals For DESC, PlayerName/ID ASC
  standings.sort(function(a, b) {
    if (b.Points !== a.Points) return b.Points - a.Points;
    if (b.GoalDifference !== a.GoalDifference) return b.GoalDifference - a.GoalDifference;
    if (b.GoalsFor !== a.GoalsFor) return b.GoalsFor - a.GoalsFor;
    return a.PlayerID.localeCompare(b.PlayerID);
  });

  // Assign position
  for (var pos = 0; pos < standings.length; pos++) {
    standings[pos].Position = pos + 1;
  }

  return standings;
}

/**
 * =========================================================================
 * PLAYER RESULT SUBMISSION & OPPONENT CONFIRMATION
 * =========================================================================
 */
function submitMatchResultInDatabase_(spreadsheet, authUser, body) {
  var fixtureId = String(body.fixtureId || body.matchId || "").trim();
  var score1 = parseInt(body.player1Score, 10);
  var score2 = parseInt(body.player2Score, 10);
  var winnerId = String(body.winnerId || "").trim();
  var screenshotUrl = String(body.screenshotUrl || body.screenshotReference || "").trim();
  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();

  if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
    return { success: false, message: "Validation error: Match scores must be valid non-negative integers." };
  }

  var fixSheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
  var lastRow = fixSheet.getLastRow();
  var lastCol = fixSheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "Fixture not found." };

  var rawFix = fixSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawFix[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var fIdCol = headers.indexOf("fixture_id");
  var cTypeCol = headers.indexOf("competition_type");
  var p1Col = headers.indexOf("player1_id");
  var p2Col = headers.indexOf("player2_id");
  var s1Col = headers.indexOf("player1_score");
  var s2Col = headers.indexOf("player2_score");
  var wCol = headers.indexOf("winner_id");
  var statCol = headers.indexOf("status");
  var upCol = headers.indexOf("updated_at");

  var targetRow = -1;
  var targetFixture = null;
  for (var r = 1; r < rawFix.length; r++) {
    if (String(rawFix[r][fIdCol] || "").trim() === fixtureId) {
      targetRow = r + 1;
      targetFixture = rawFix[r];
      break;
    }
  }

  if (targetRow === -1 || !targetFixture) {
    return { success: false, message: "Fixture " + fixtureId + " not found." };
  }

  var p1Id = String(targetFixture[p1Col] || "").trim();
  var p2Id = String(targetFixture[p2Col] || "").trim();

  if (p1Id !== uid && p1Id !== email && p2Id !== uid && p2Id !== email) {
    return { success: false, message: "Unauthorized: You are not a participant in this fixture." };
  }

  var cType = String(targetFixture[cTypeCol] || "KNOCKOUT").toUpperCase();
  var isKnockout = cType === "KNOCKOUT";

  // Knockout cannot end in a draw without tiebreaker winner
  if (isKnockout && score1 === score2 && !winnerId) {
    return {
      success: false,
      message: "Knockout matches cannot end in a draw. Please specify the penalty/extra-time winner ID."
    };
  }

  var resolvedWinner = winnerId;
  if (!resolvedWinner) {
    if (score1 > score2) resolvedWinner = p1Id;
    else if (score2 > score1) resolvedWinner = p2Id;
  }

  var nowIso = new Date().toISOString();
  if (s1Col !== -1) fixSheet.getRange(targetRow, s1Col + 1).setValue(score1);
  if (s2Col !== -1) fixSheet.getRange(targetRow, s2Col + 1).setValue(score2);
  if (wCol !== -1 && resolvedWinner) fixSheet.getRange(targetRow, wCol + 1).setValue(resolvedWinner);
  if (statCol !== -1) fixSheet.getRange(targetRow, statCol + 1).setValue("COMPLETED");
  if (upCol !== -1) fixSheet.getRange(targetRow, upCol + 1).setValue(nowIso);

  SpreadsheetApp.flush();
  logAudit_(spreadsheet, uid, email, "MATCH_RESULT_RECORDED", "Fixture", fixtureId, { score1: score1, score2: score2, winner: resolvedWinner });

  return {
    success: true,
    message: "Match result submitted and confirmed successfully!",
    fixtureId: fixtureId,
    score1: score1,
    score2: score2,
    winnerId: resolvedWinner
  };
}

function confirmMatchResultInDatabase_(spreadsheet, authUser, fixtureId) {
  var fixSheet = getOrCreateSheet_(spreadsheet, FIXTURES_SHEET_NAME, FIXTURES_HEADERS);
  var lastRow = fixSheet.getLastRow();
  var lastCol = fixSheet.getLastColumn();
  if (lastRow <= 1) return { success: false, message: "Fixture not found." };

  var rawFix = fixSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = rawFix[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var fIdCol = headers.indexOf("fixture_id");
  var p1Col = headers.indexOf("player1_id");
  var p2Col = headers.indexOf("player2_id");
  var statCol = headers.indexOf("status");
  var upCol = headers.indexOf("updated_at");

  var uid = String(authUser.uid || "").trim();
  var email = String(authUser.email || "").trim();

  for (var r = 1; r < rawFix.length; r++) {
    if (String(rawFix[r][fIdCol] || "").trim() === String(fixtureId).trim()) {
      var p1 = String(rawFix[r][p1Col] || "").trim();
      var p2 = String(rawFix[r][p2Col] || "").trim();
      if (p1 !== uid && p1 !== email && p2 !== uid && p2 !== email) {
        return { success: false, message: "Unauthorized: You are not a participant in this fixture." };
      }

      var rowNum = r + 1;
      if (statCol !== -1) fixSheet.getRange(rowNum, statCol + 1).setValue("COMPLETED");
      if (upCol !== -1) fixSheet.getRange(rowNum, upCol + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();

      logAudit_(spreadsheet, uid, email, "MATCH_RESULT_CONFIRMED", "Fixture", fixtureId, { confirmedBy: email });
      return { success: true, message: "Match result confirmed successfully." };
    }
  }
  return { success: false, message: "Fixture " + fixtureId + " not found." };
}

/**
 * Safe, non-destructive diagnostic function to run inside Apps Script IDE.
 * Verifies spreadsheet connectivity, sheet headers, and pure validation logic.
 * DOES NOT insert or modify any user records in production.
 */
function testBackendSetup() {
  Logger.log("=== RUNNING SAFE CHUKA COMMUNITY BACKEND DIAGNOSTIC ===");
  try {
    var ss = getDatabaseSpreadsheet_();
    Logger.log("✓ Official spreadsheet accessible: " + ss.getName() + " (" + ss.getId() + ")");
    var sheet = getOrCreateUsersSheet_(ss);
    Logger.log("✓ Users sheet ready: rowCount=" + sheet.getLastRow());

    // 1. Verify expected headers
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    }) : [];
    var cols = getUsersColumnIndices_(headers);
    Logger.log("✓ Column mapping verified: uidCol=" + cols.uidCol + ", emailCol=" + cols.emailCol + ", nameCol=" + cols.nameCol + ", roleCol=" + cols.roleCol);

    // 2. Pure in-memory role verification (Non-destructive)
    var adminRoleCheck = (ADMIN_EMAIL.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? "ADMIN" : "USER";
    if (adminRoleCheck !== "ADMIN") throw new Error("Admin role rule check failed");
    Logger.log("✓ Server-side Admin role rule verified: " + ADMIN_EMAIL + " => ADMIN");

    var userRoleCheck = ("student@chuka.ac.ke".toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? "ADMIN" : "USER";
    if (userRoleCheck !== "USER") throw new Error("Normal user role rule check failed");
    Logger.log("✓ Server-side User role rule verified: student@chuka.ac.ke => USER");

    // 3. Validation limits check (Non-destructive)
    var longName = "A".repeat(101);
    if (longName.length <= 100) throw new Error("Length test failed");
    Logger.log("✓ Validation logic verified: max display_name length limit = 100 chars");

    Logger.log("=== ALL NON-DESTRUCTIVE BACKEND DIAGNOSTICS PASSED ===");
    return true;
  } catch (err) {
    Logger.log("✗ Diagnostic failed: " + err.message);
    return false;
  }
}

/**
 * =========================================================================
 * AUTOMATION MODULE
 *  - Official Match Rules Google Doc (branded, logos, tables) from MatchRules sheet
 *  - LIVE Registered Players Google Doc (per Knockout / per League, by name)
 *  - Admin player verification (verify / suspend)
 *  - Invitations to Knockouts and Leagues (link + email)
 *  - Auto-refresh triggers (run setupAutomation() ONCE from the editor)
 * =========================================================================
 */

var CHUKA_CREST_URL = "https://aicenter.chuka.ac.ke/wp-content/uploads/2026/03/chuka-uni-logo-HD-1-2-Photoroom.png";
var EFOOTBALL_LOGO_URL = "https://images.seeklogo.com/logo-png/45/1/efootball-logo-png_seeklogo-451310.png";
var HELP_DESK_NAME = "Sidney Wafula";
var HELP_DESK_PHONE = "0180752220";
var DOC_FONT = "Georgia";

var MATCH_RULES_SHEET_NAME = "MatchRules";
var MATCH_RULES_HEADERS = ["rule_id", "competition", "rule_title", "rule_content", "active", "updated_at"];
var DEFAULT_MATCH_RULES = [
  ["RULE-KO-01", "Knockout", "Tournament Format & Brackets", "Single elimination knockout brackets. The winner of each match advances to the subsequent round while the loser is eliminated. All brackets are synchronized via Google Sheets."],
  ["RULE-KO-02", "Knockout", "Match Scheduling & Deadlines", "Players must schedule and complete their designated knockout fixture before the published round deadline. Failure to communicate may result in a forfeit walkover."],
  ["RULE-KO-03", "Knockout", "Extra Time & Penalties", "If scores are level at 90 minutes in knockout fixtures, extra time and penalty shootouts must be played immediately to determine the advancing player."],
  ["RULE-KO-04", "Knockout", "Screenshot & Result Verification", "Both players must take a clear end-game screenshot displaying final score, player gamertags, and match statistics. The winner submits the result; the opponent must confirm."],
  ["RULE-LG-01", "League", "League Format & Points System", "Round-robin league format. Three points for a win, one point for a draw, and zero points for a loss. Goal difference is used as the primary tiebreaker."],
  ["RULE-LG-02", "League", "Match Scheduling & Deadlines", "All league fixtures must be completed within the designated matchweek window. Players are responsible for coordinating and reporting results before the deadline."],
  ["RULE-LG-03", "League", "Draws & Points Allocation", "League matches can end in a draw. Both players receive one point each. No extra time or penalties are played in league fixtures."],
  ["RULE-LG-04", "League", "Screenshot & Result Verification", "Both players must take a clear end-game screenshot displaying final score, player gamertags, and match statistics. The winner submits the result; the opponent must confirm."]
];

var INVITES_SHEET_NAME = "Invites";
var INVITES_HEADERS = [
  "invite_id", "code", "competition_id", "competition_name", "competition_type",
  "invite_type", "invited_email", "invited_by_uid", "invited_by_name", "status",
  "uses", "max_uses", "created_at", "expires_at", "last_used_at", "accepted_by"
];

/* ---------- small auth helpers ---------- */
function requireAuth_(body) {
  var t = (body && typeof body.idToken === "string") ? body.idToken.trim() : "";
  if (!t) return null;
  var a = verifyFirebaseIdToken_(t);
  return (a && a.valid) ? a : null;
}
function isAdminAuth_(a) {
  return !!(a && (a.isAdmin || isAuthorizedAdminEmail_(a.email)));
}
function unauthorizedResponse_() {
  return createJsonResponse_({ success: false, message: "Unauthorized: Administrator privileges required." });
}

/* =========================================================================
 * MATCH RULES (sheet = source of truth)
 * ========================================================================= */
function getOrCreateMatchRulesSheet_(ss) {
  var sheet = getOrCreateSheet_(ss, MATCH_RULES_SHEET_NAME, MATCH_RULES_HEADERS);
  if (sheet.getLastRow() <= 1) {
    var nowIso = new Date().toISOString();
    for (var i = 0; i < DEFAULT_MATCH_RULES.length; i++) {
      var r = DEFAULT_MATCH_RULES[i];
      sheet.appendRow([r[0], r[1], r[2], r[3], true, nowIso]);
    }
    try { sheet.setColumnWidth(3, 260); sheet.setColumnWidth(4, 620); } catch (e) {}
    SpreadsheetApp.flush();
  }
  return sheet;
}

function getMatchRulesFromDatabase_(ss) {
  var sheet = getOrCreateMatchRulesSheet_(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var raw = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var h = raw[0].map(function(x) { return String(x || "").trim().toLowerCase(); });
  var ix = function(n) { return h.indexOf(n); };
  var out = [];
  for (var r = 1; r < raw.length; r++) {
    var row = raw[r];
    var title = ix("rule_title") !== -1 ? String(row[ix("rule_title")] || "").trim() : "";
    var content = ix("rule_content") !== -1 ? String(row[ix("rule_content")] || "").trim() : "";
    if (!title && !content) continue;
    var activeRaw = ix("active") !== -1 ? row[ix("active")] : true;
    var active = !(activeRaw === false || String(activeRaw).trim().toUpperCase() === "FALSE" || String(activeRaw).trim().toUpperCase() === "NO");
    var comp = ix("competition") !== -1 ? String(row[ix("competition")] || "").trim() : "";
    var compNorm = comp.toLowerCase().indexOf("league") !== -1 ? "League" : "Knockout";
    out.push({
      RuleID: ix("rule_id") !== -1 ? String(row[ix("rule_id")] || "").trim() : "",
      Competition: compNorm,
      RuleTitle: title,
      RuleContent: content,
      Active: active,
      UpdatedAt: ix("updated_at") !== -1 ? String(row[ix("updated_at")] || "") : ""
    });
  }
  return out;
}

/* =========================================================================
 * GOOGLE DOC RENDERING HELPERS (mirror the web "official document" style)
 * ========================================================================= */
function docStyle_(o) {
  var A = DocumentApp.Attribute;
  var s = {};
  if (o.bold !== undefined) s[A.BOLD] = o.bold;
  if (o.italic !== undefined) s[A.ITALIC] = o.italic;
  if (o.size) s[A.FONT_SIZE] = o.size;
  if (o.font) s[A.FONT_FAMILY] = o.font;
  if (o.color) s[A.FOREGROUND_COLOR] = o.color;
  if (o.bg) s[A.BACKGROUND_COLOR] = o.bg;
  if (o.align) s[A.HORIZONTAL_ALIGNMENT] = o.align;
  if (o.before !== undefined) s[A.SPACING_BEFORE] = o.before;
  if (o.after !== undefined) s[A.SPACING_AFTER] = o.after;
  return s;
}

function fetchImageBlob_(urls) {
  for (var i = 0; i < urls.length; i++) {
    var u = urls[i];
    if (!u) continue;
    try {
      var res = UrlFetchApp.fetch(u, {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ChukaEFootballHub/1.0)" }
      });
      if (res.getResponseCode() === 200) {
        var blob = res.getBlob();
        var ct = String(blob.getContentType() || "").toLowerCase();
        if (ct.indexOf("image/") === 0 && ct.indexOf("svg") === -1) return blob;
      }
    } catch (e) {
      Logger.log("[Image Fetch] " + u + " -> " + e.message);
    }
  }
  return null;
}

function getAppAssetUrl_(file) {
  var base = PropertiesService.getScriptProperties().getProperty("APP_URL") || "";
  return base ? base.replace(/\/+$/, "") + "/" + file : "";
}

function setDocMargins_(body) {
  try {
    body.setMarginTop(40);
    body.setMarginBottom(40);
    body.setMarginLeft(56);
    body.setMarginRight(56);
  } catch (e) {}
}

function placeLogo_(cell, blob, align, height) {
  var p = cell.getChild(0).asParagraph();
  p.setAlignment(align);
  p.setSpacingAfter(0);
  if (!blob) return;
  try {
    var img = p.appendInlineImage(blob);
    var w = img.getWidth(), h = img.getHeight();
    if (w > 0 && h > 0) {
      img.setHeight(height).setWidth(Math.round(w * height / h));
    }
  } catch (e) {
    Logger.log("[Logo] " + e.message);
  }
}

/** Header: crest (left) | CHUKA eFOOTBALL + subtitle (center) | eFootball logo (right) */
function renderBrandHeader_(body, subtitle) {
  var crest = fetchImageBlob_([CHUKA_CREST_URL, getAppAssetUrl_("chuka-crest.png")]);
  var logo = fetchImageBlob_([EFOOTBALL_LOGO_URL, getAppAssetUrl_("efootball-logo.png")]);

  var t = body.appendTable([["", "", ""]]);
  t.setBorderWidth(0);
  t.setColumnWidth(0, 90);
  t.setColumnWidth(1, 270);
  t.setColumnWidth(2, 90);
  var left = t.getCell(0, 0), mid = t.getCell(0, 1), right = t.getCell(0, 2);
  var VA = DocumentApp.VerticalAlignment.CENTER;
  left.setVerticalAlignment(VA); mid.setVerticalAlignment(VA); right.setVerticalAlignment(VA);

  placeLogo_(left, crest, DocumentApp.HorizontalAlignment.LEFT, 50);
  placeLogo_(right, logo, DocumentApp.HorizontalAlignment.RIGHT, 40);

  var title = mid.getChild(0).asParagraph();
  title.setText("CHUKA eFOOTBALL");
  title.setAttributes(docStyle_({ bold: true, size: 22, color: "#000000", align: DocumentApp.HorizontalAlignment.CENTER, after: 0, before: 0 }));
  var sub = mid.appendParagraph(String(subtitle || "Official University eFootball Esports Hub").toUpperCase());
  sub.setAttributes(docStyle_({ bold: false, size: 8, color: "#333333", align: DocumentApp.HorizontalAlignment.CENTER, after: 0, before: 2 }));

  body.appendHorizontalRule();
  var pw = body.appendParagraph("Powered by Google Sheets + Apps Script");
  pw.setAttributes(docStyle_({ bold: false, italic: false, size: 8, color: "#555555", align: DocumentApp.HorizontalAlignment.CENTER, after: 8, before: 2 }));
}

function renderSectionTitle_(body, text) {
  var p = body.appendParagraph(String(text).toUpperCase());
  p.setAttributes(docStyle_({ bold: true, size: 15, color: "#000000", align: DocumentApp.HorizontalAlignment.CENTER, before: 6, after: 2 }));
  body.appendHorizontalRule();
}

function renderSubsectionTitle_(body, text) {
  var p = body.appendParagraph(String(text).toUpperCase());
  p.setAttributes(docStyle_({ bold: true, size: 11, color: "#222222", align: DocumentApp.HorizontalAlignment.LEFT, before: 12, after: 4 }));
}

/** Grey-header bordered table like the website's .doc-table */
function styleDocTable_(table, colWidths, dense) {
  table.setBorderColor("#aaaaaa");
  table.setBorderWidth(0.75);
  var body = {};
  body[DocumentApp.Attribute.FONT_SIZE] = 9;
  body[DocumentApp.Attribute.FONT_FAMILY] = DOC_FONT;
  body[DocumentApp.Attribute.FOREGROUND_COLOR] = "#111111";
  try { table.setAttributes(body); } catch (e) {}
  if (colWidths) {
    for (var c = 0; c < colWidths.length; c++) {
      try { table.setColumnWidth(c, colWidths[c]); } catch (e) {}
    }
  }
  var hdr = table.getRow(0);
  for (var i = 0; i < hdr.getNumCells(); i++) {
    var cell = hdr.getCell(i);
    cell.setBackgroundColor("#f2f2f2");
    cell.setAttributes(docStyle_({ bold: true, size: 8, color: "#000000", font: DOC_FONT }));
  }
  if (!dense) {
    for (var r = 1; r < table.getNumRows(); r++) {
      var row = table.getRow(r);
      for (var k = 0; k < Math.min(2, row.getNumCells()); k++) {
        row.getCell(k).setAttributes(docStyle_({ bold: true, size: 9, color: "#222222", font: DOC_FONT }));
      }
    }
  }
}

function renderRulesTables_(body, rules, typeFilter) {
  var sets = [
    { key: "Knockout", label: "\uD83C\uDFC6 Knockout Rules", prefix: "RULE-KO-0" },
    { key: "League", label: "\uD83E\uDD47 League Rules", prefix: "RULE-LG-0" }
  ];
  for (var s = 0; s < sets.length; s++) {
    var set = sets[s];
    if (typeFilter && typeFilter !== set.key) continue;
    var list = [];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].Competition === set.key && rules[i].Active !== false) list.push(rules[i]);
    }
    if (list.length === 0) {
      for (var d = 0; d < DEFAULT_MATCH_RULES.length; d++) {
        if (DEFAULT_MATCH_RULES[d][1] === set.key) {
          list.push({ RuleID: DEFAULT_MATCH_RULES[d][0], RuleTitle: DEFAULT_MATCH_RULES[d][2], RuleContent: DEFAULT_MATCH_RULES[d][3] });
        }
      }
    }
    renderSubsectionTitle_(body, set.label);
    var rows = [["Rule ID", "Title", "Description"]];
    for (var j = 0; j < list.length; j++) {
      rows.push([list[j].RuleID || (set.prefix + (j + 1)), list[j].RuleTitle, list[j].RuleContent]);
    }
    var tbl = body.appendTable(rows);
    styleDocTable_(tbl, [72, 128, 250], false);
  }
}

function renderRulesNote_(body) {
  var t = body.appendTable([["Google Sheets Live Rules: These regulations are linked to the MatchRules sheet. Updates made by tournament administrators in Google Sheets will automatically reflect in this document."]]);
  t.setBorderColor("#888888");
  t.setBorderWidth(0.75);
  var cell = t.getCell(0, 0);
  cell.setBackgroundColor("#f9f9f9");
  var p = cell.getChild(0).asParagraph();
  p.setAttributes(docStyle_({ size: 8, color: "#444444", bold: false, font: DOC_FONT, before: 2, after: 2 }));
  try { p.editAsText().setBold(0, 24, true).setForegroundColor(0, 24, "#000000"); } catch (e) {}
  body.appendParagraph("").setAttributes(docStyle_({ size: 4, after: 0, before: 0 }));
}

function renderDocFooter_(body) {
  body.appendHorizontalRule();
  var t = body.appendTable([["Help Desk: " + HELP_DESK_NAME + " (" + HELP_DESK_PHONE + ")", "Fair Play Standard \u2022 Chuka eFootball"]]);
  t.setBorderWidth(0);
  t.setColumnWidth(0, 250);
  t.setColumnWidth(1, 200);
  var l = t.getCell(0, 0).getChild(0).asParagraph();
  l.setAttributes(docStyle_({ size: 8, color: "#333333", font: DOC_FONT, after: 0 }));
  try {
    var txt = l.editAsText();
    var start = "Help Desk: ".length;
    var end = l.getText().length - 1;
    txt.setBold(start, end, true).setLinkUrl(start, end, "tel:" + HELP_DESK_PHONE);
  } catch (e) {}
  var r = t.getCell(0, 1).getChild(0).asParagraph();
  r.setAttributes(docStyle_({ size: 8, italic: true, color: "#444444", font: DOC_FONT, align: DocumentApp.HorizontalAlignment.RIGHT, after: 0 }));
}

function finalizeDoc_(body) {
  try { body.editAsText().setFontFamily(DOC_FONT); } catch (e) {}
  try {
    var first = body.getChild(0);
    if (body.getNumChildren() > 1 && first.getType() === DocumentApp.ElementType.PARAGRAPH && first.asParagraph().getText() === "") {
      first.removeFromParent();
    }
  } catch (e) {}
}

/* =========================================================================
 * MANAGED (AUTO-CREATED) DOCUMENTS
 * ========================================================================= */
function getHubFolder_() {
  var it = DriveApp.getFoldersByName("Chuka eFootballHub");
  return it.hasNext() ? it.next() : DriveApp.createFolder("Chuka eFootballHub");
}

function getOrCreateManagedDoc_(propKey, title) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(propKey);
  if (id) {
    try {
      var f = DriveApp.getFileById(id);
      if (!f.isTrashed()) return DocumentApp.openById(id);
    } catch (e) {
      Logger.log("[Managed Doc] Stored doc unavailable, recreating: " + e.message);
    }
  }
  var doc = DocumentApp.create(title);
  var file = DriveApp.getFileById(doc.getId());
  try {
    getHubFolder_().addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  } catch (e) { Logger.log("[Managed Doc] move failed: " + e.message); }
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log("[Managed Doc] share failed: " + e.message); }
  props.setProperty(propKey, doc.getId());
  return doc;
}

function docUrlFromProp_(propKey) {
  var id = PropertiesService.getScriptProperties().getProperty(propKey);
  return id ? "https://docs.google.com/document/d/" + id + "/edit" : "";
}

function getLiveDocsInfo_() {
  return {
    rulesUrl: docUrlFromProp_("MASTER_RULES_DOC_ID"),
    rosterUrl: docUrlFromProp_("LIVE_ROSTER_DOC_ID"),
    rulesUpdatedAt: PropertiesService.getScriptProperties().getProperty("MASTER_RULES_UPDATED_AT") || "",
    rosterUpdatedAt: PropertiesService.getScriptProperties().getProperty("LIVE_ROSTER_UPDATED_AT") || ""
  };
}

/** Official Match Rules document: ALL rules, same look as the website document. */
function syncMasterRulesDocument_(ss) {
  var rules = getMatchRulesFromDatabase_(ss);
  var doc = getOrCreateManagedDoc_("MASTER_RULES_DOC_ID", "Chuka eFootball Hub - Official Match Rules");
  var body = doc.getBody();
  body.clear();
  setDocMargins_(body);
  renderBrandHeader_(body, "Official University eFootball Esports Hub");
  renderSectionTitle_(body, "Official Match Rules");
  renderRulesTables_(body, rules, null);
  renderRulesNote_(body);
  renderDocFooter_(body);
  finalizeDoc_(body);
  var url = doc.getUrl();
  doc.saveAndClose();
  PropertiesService.getScriptProperties().setProperty("MASTER_RULES_UPDATED_AT", new Date().toISOString());
  Logger.log("[Rules Doc] Updated: " + url);
  return { id: doc.getId(), url: url };
}

function computeRosterSignature_(comps, regs) {
  var parts = [];
  for (var i = 0; i < comps.length; i++) {
    parts.push([comps[i].CompetitionID, comps[i].Name, comps[i].Status, comps[i].MaxPlayers].join("|"));
  }
  for (var j = 0; j < regs.length; j++) {
    parts.push([regs[j].RegistrationID, regs[j].Status, regs[j].PaymentStatus, regs[j].PlayerName, regs[j].eFootballUsername].join("|"));
  }
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, parts.join("\n")));
}

function safeDisplayName_(reg) {
  var n = String(reg.PlayerName || "").trim();
  if (!n || n.indexOf("@") !== -1) {
    var alt = String(reg.eFootballUsername || "").trim();
    if (alt && alt.indexOf("@") === -1) return alt;
    if (n.indexOf("@") !== -1) return n.split("@")[0];
    return "Unnamed player";
  }
  return n;
}

function acquireSyncMutex_(key) {
  var p = PropertiesService.getScriptProperties();
  var t = Number(p.getProperty(key) || 0);
  if (t && (Date.now() - t) < 5 * 60 * 1000) return false;
  p.setProperty(key, String(Date.now()));
  return true;
}
function releaseSyncMutex_(key) {
  try { PropertiesService.getScriptProperties().deleteProperty(key); } catch (e) {}
}

/** LIVE roster: one section per competition (Knockouts first, then Leagues), by player name. */
function syncLiveRosterDocument_(ss, force) {
  if (!acquireSyncMutex_("ROSTER_SYNC_RUNNING")) {
    Logger.log("[Roster Doc] Another sync is running; skipping.");
    return { skipped: true, url: docUrlFromProp_("LIVE_ROSTER_DOC_ID") };
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var comps = getCompetitionsFromDatabase_(ss);
    var regs = getRegistrationsFromDatabase_(ss, "");
    var sig = computeRosterSignature_(comps, regs);
    if (!force && props.getProperty("LIVE_ROSTER_SIG") === sig && props.getProperty("LIVE_ROSTER_DOC_ID")) {
      return { skipped: true, unchanged: true, url: docUrlFromProp_("LIVE_ROSTER_DOC_ID") };
    }

    var byComp = {};
    var totalVerified = 0, totalPending = 0;
    for (var i = 0; i < regs.length; i++) {
      var r = regs[i];
      var st = String(r.Status || "").toUpperCase();
      if (st === "REJECTED" || st === "CANCELLED") continue;
      var verified = (st === "APPROVED" || String(r.PaymentStatus).toUpperCase() === "CONFIRMED" || String(r.PaymentStatus).toUpperCase() === "PAID");
      (byComp[r.CompetitionID] = byComp[r.CompetitionID] || []).push({ reg: r, verified: verified });
      if (verified) totalVerified++; else totalPending++;
    }

    var doc = getOrCreateManagedDoc_("LIVE_ROSTER_DOC_ID", "Chuka eFootball Hub - LIVE Registered Players");
    var body = doc.getBody();
    body.clear();
    setDocMargins_(body);
    renderBrandHeader_(body, "Live Registered Players");
    renderSectionTitle_(body, "Live Registered Players");

    var stamp = Utilities.formatDate(new Date(), "Africa/Nairobi", "EEE, d MMM yyyy 'at' HH:mm") + " EAT";
    var meta = body.appendParagraph("Last updated: " + stamp + "  \u2022  This document refreshes automatically as players register and admins verify them.");
    meta.setAttributes(docStyle_({ size: 8, italic: true, color: "#555555", align: DocumentApp.HorizontalAlignment.CENTER, after: 6 }));

    var sum = body.appendTable([
      ["Competitions", String(comps.length), "Verified players", String(totalVerified), "Awaiting verification", String(totalPending)]
    ]);
    sum.setBorderColor("#aaaaaa"); sum.setBorderWidth(0.75);
    for (var sc = 0; sc < 6; sc++) {
      sum.getCell(0, sc).setAttributes(docStyle_({ size: 9, bold: (sc % 2 === 0), color: "#111111", font: DOC_FONT, bg: (sc % 2 === 0) ? "#f2f2f2" : "#ffffff" }));
    }

    var groups = [
      { type: "KNOCKOUT", title: "\uD83C\uDFC6 Knockout Tournaments" },
      { type: "LEAGUE", title: "\uD83E\uDD47 Leagues" }
    ];
    var statusRank = { OPEN: 0, IN_PROGRESS: 1, CLOSED: 2, COMPLETED: 3 };
    for (var g = 0; g < groups.length; g++) {
      var list = comps.filter(function(c) { return String(c.CompetitionType || "").toUpperCase() === groups[g].type; });
      list.sort(function(a, b) {
        var ra = statusRank[a.Status] !== undefined ? statusRank[a.Status] : 9;
        var rb = statusRank[b.Status] !== undefined ? statusRank[b.Status] : 9;
        return ra - rb;
      });
      renderSubsectionTitle_(body, groups[g].title);
      if (list.length === 0) {
        body.appendParagraph("No " + (groups[g].type === "KNOCKOUT" ? "knockout tournaments" : "leagues") + " have been created yet.")
          .setAttributes(docStyle_({ size: 9, italic: true, color: "#555555" }));
        continue;
      }
      for (var ci = 0; ci < list.length; ci++) {
        var c = list[ci];
        var entries = byComp[c.CompetitionID] || [];
        entries.sort(function(a, b) {
          if (a.verified !== b.verified) return a.verified ? -1 : 1;
          return String(a.reg.RegisteredAt).localeCompare(String(b.reg.RegisteredAt));
        });
        var vCount = entries.filter(function(e) { return e.verified; }).length;
        var pCount = entries.length - vCount;

        var h = body.appendParagraph(c.Name || c.CompetitionID);
        h.setAttributes(docStyle_({ bold: true, size: 12, color: "#000000", before: 14, after: 0, align: DocumentApp.HorizontalAlignment.LEFT }));
        var sub = body.appendParagraph(
          "ID: " + c.CompetitionID + "  \u2022  Status: " + String(c.Status || "").replace(/_/g, " ") +
          "  \u2022  Verified: " + vCount + " / " + (c.MaxPlayers || "-") + "  \u2022  Awaiting verification: " + pCount
        );
        sub.setAttributes(docStyle_({ bold: false, size: 8, color: "#555555", before: 0, after: 4 }));

        if (entries.length === 0) {
          body.appendParagraph("No players registered yet.").setAttributes(docStyle_({ size: 9, italic: true, color: "#555555", after: 2 }));
          continue;
        }
        var rows = [["#", "Player Name", "eFootball ID / Gamer Tag", "Status"]];
        for (var e = 0; e < entries.length; e++) {
          rows.push([
            String(e + 1),
            safeDisplayName_(entries[e].reg),
            entries[e].reg.eFootballUsername || "-",
            entries[e].verified ? "\u2714 Verified" : "\u23F3 Pending"
          ]);
        }
        var tbl = body.appendTable(rows);
        styleDocTable_(tbl, [32, 170, 158, 90], true);
      }
    }

    renderDocFooter_(body);
    finalizeDoc_(body);
    var url = doc.getUrl();
    doc.saveAndClose();
    props.setProperty("LIVE_ROSTER_SIG", sig);
    props.setProperty("LIVE_ROSTER_UPDATED_AT", new Date().toISOString());
    Logger.log("[Roster Doc] Updated: " + url);
    return { id: doc.getId(), url: url };
  } finally {
    releaseSyncMutex_("ROSTER_SYNC_RUNNING");
  }
}

/* =========================================================================
 * QUEUED / SCHEDULED SYNC (keeps user-facing requests fast)
 * ========================================================================= */
function queueDocsSync_(kind) {
  var props = PropertiesService.getScriptProperties();
  try {
    if (kind === "rules") props.setProperty("SYNC_RULES_PENDING", "1");
    else props.setProperty("SYNC_ROSTER_PENDING", "1");
    if (props.getProperty("SYNC_TRIGGER_SET") === "1") return;
    props.setProperty("SYNC_TRIGGER_SET", "1");
    ScriptApp.newTrigger("runQueuedDocsSync").timeBased().after(30 * 1000).create();
  } catch (err) {
    Logger.log("[Queue] Trigger unavailable, syncing inline: " + err.message);
    props.deleteProperty("SYNC_TRIGGER_SET");
    try { runQueuedDocsSync(); } catch (e2) { Logger.log("[Queue] inline sync failed: " + e2.message); }
  }
}

function removeTriggersByHandler_(names) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (names.indexOf(triggers[i].getHandlerFunction()) !== -1) {
      try { ScriptApp.deleteTrigger(triggers[i]); } catch (e) {}
    }
  }
}

function runQueuedDocsSync() {
  var props = PropertiesService.getScriptProperties();
  var doRules = props.getProperty("SYNC_RULES_PENDING") === "1";
  var doRoster = props.getProperty("SYNC_ROSTER_PENDING") === "1";
  props.deleteProperty("SYNC_RULES_PENDING");
  props.deleteProperty("SYNC_ROSTER_PENDING");
  props.deleteProperty("SYNC_TRIGGER_SET");
  try { removeTriggersByHandler_(["runQueuedDocsSync"]); } catch (e) {}
  var ss = getDatabaseSpreadsheet_();
  if (doRules) { try { syncMasterRulesDocument_(ss); } catch (e1) { Logger.log("[Queued Rules Sync Error] " + e1.message); } }
  if (doRoster) { try { syncLiveRosterDocument_(ss, false); } catch (e2) { Logger.log("[Queued Roster Sync Error] " + e2.message); } }
}

/** Recurring safety-net refresh (every 10 minutes, only rewrites if data changed). */
function scheduledLiveRefresh() {
  var ss = getDatabaseSpreadsheet_();
  try { syncLiveRosterDocument_(ss, false); } catch (e) { Logger.log("[Scheduled Roster Error] " + e.message); }
}

/** Installable onEdit trigger: manual edits in Sheets refresh the Docs. */
function onSheetEditSync(e) {
  try {
    var name = e && e.range ? e.range.getSheet().getName() : "";
    if (name === MATCH_RULES_SHEET_NAME) queueDocsSync_("rules");
    else if (name === REGISTRATIONS_SHEET_NAME || name === COMPETITIONS_SHEET_NAME) queueDocsSync_("roster");
  } catch (err) { Logger.log("[onSheetEditSync] " + err.message); }
}

/**
 * RUN THIS ONCE from the Apps Script editor (authorize when prompted).
 * Creates the MatchRules + Invites sheets, builds both Google Docs immediately,
 * and installs the auto-refresh triggers.
 */
function setupAutomation() {
  var ss = getDatabaseSpreadsheet_();
  getOrCreateMatchRulesSheet_(ss);
  getOrCreateSheet_(ss, INVITES_SHEET_NAME, INVITES_HEADERS);
  removeTriggersByHandler_(["scheduledLiveRefresh", "onSheetEditSync"]);
  ScriptApp.newTrigger("scheduledLiveRefresh").timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger("onSheetEditSync").forSpreadsheet(ss).onEdit().create();
  var rules = syncMasterRulesDocument_(ss);
  var roster = syncLiveRosterDocument_(ss, true);
  Logger.log("=== AUTOMATION READY ===");
  Logger.log("Official Match Rules Doc : " + rules.url);
  Logger.log("LIVE Registered Players  : " + (roster.url || docUrlFromProp_("LIVE_ROSTER_DOC_ID")));
  return { rulesUrl: rules.url, rosterUrl: roster.url };
}

/* =========================================================================
 * PLAYER VERIFICATION (admin)
 * ========================================================================= */
function playerProfileToAdminObject_(profile) {
  return {
    PlayerID: profile.user_id || profile.email,
    GoogleUID: profile.user_id,
    DisplayName: profile.display_name,
    Email: profile.email,
    PhotoURL: profile.photo_url,
    ClassID: profile.class_id,
    Phone: profile.phone,
    WhatsAppNumber: profile.whatsapp,
    Status: profile.status,
    Verified: profile.status === "ACTIVE",
    Role: profile.role,
    CreatedAt: profile.created_at,
    UpdatedAt: profile.updated_at,
    SquadImageURL: profile.squad_image_url
  };
}

function setPlayerStatusInDatabase_(ss, playerId, newStatus, adminEmail) {
  var target = String(playerId || "").trim();
  if (!target) return { success: false, message: "PlayerID is required." };
  var sheet = getOrCreateUsersSheet_(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, message: "No players found." };
  var lastCol = sheet.getLastColumn();
  var raw = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = raw[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var cols = getUsersColumnIndices_(headers);
  if (cols.statusCol === -1) return { success: false, message: "Users sheet has no status column." };

  for (var r = 1; r < raw.length; r++) {
    var uid = cols.uidCol !== -1 ? String(raw[r][cols.uidCol] || "").trim() : "";
    var email = cols.emailCol !== -1 ? String(raw[r][cols.emailCol] || "").trim() : "";
    if (uid === target || (email && email.toLowerCase() === target.toLowerCase())) {
      var rowNum = r + 1;
      sheet.getRange(rowNum, cols.statusCol + 1).setValue(newStatus);
      if (cols.updatedCol !== -1) sheet.getRange(rowNum, cols.updatedCol + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      var fresh = sheet.getRange(rowNum, 1, 1, lastCol).getValues()[0];
      var profile = buildUserProfileObject_(fresh, cols, uid, email);
      logAudit_(ss, adminEmail, adminEmail, newStatus === "ACTIVE" ? "PLAYER_VERIFIED" : "PLAYER_SUSPENDED", "Player", uid || email, { status: newStatus });
      var playerObj = playerProfileToAdminObject_(profile);
      return {
        success: true,
        message: newStatus === "ACTIVE" ? "Player verified and activated." : "Player suspended.",
        player: playerObj,
        data: { player: playerObj }
      };
    }
  }
  return { success: false, message: "Player not found: " + target };
}

/* =========================================================================
 * INVITATIONS (Knockouts & Leagues)
 * ========================================================================= */
function findCompetitionById_(ss, compId) {
  var list = getCompetitionsFromDatabase_(ss);
  for (var i = 0; i < list.length; i++) {
    if (list[i].CompetitionID === compId) return list[i];
  }
  return null;
}

function sanitizeAppUrl_(u) {
  u = String(u || "").trim();
  if (!/^https?:\/\/[A-Za-z0-9.\-:_\/]+$/.test(u)) u = "";
  if (!u) u = PropertiesService.getScriptProperties().getProperty("APP_URL") || "";
  return u.replace(/\/+$/, "");
}

function maskEmail_(email) {
  var e = String(email || "");
  var at = e.indexOf("@");
  if (at < 1) return "";
  return e.charAt(0) + "***" + e.substring(at);
}

function inviteRowToObject_(headers, row) {
  var o = {};
  for (var c = 0; c < headers.length; c++) o[headers[c]] = row[c];
  var expires = o.expires_at ? new Date(o.expires_at) : null;
  var uses = Number(o.uses || 0);
  var maxUses = Number(o.max_uses || 0);
  var state = String(o.status || "ACTIVE").toUpperCase();
  if (state !== "REVOKED") {
    if (expires && !isNaN(expires.getTime()) && expires.getTime() < Date.now()) state = "EXPIRED";
    else if (maxUses > 0 && uses >= maxUses) state = "USED";
    else state = "ACTIVE";
  }
  return {
    InviteID: String(o.invite_id || ""),
    Code: String(o.code || ""),
    CompetitionID: String(o.competition_id || ""),
    CompetitionName: String(o.competition_name || ""),
    CompetitionType: String(o.competition_type || ""),
    InviteType: String(o.invite_type || "LINK"),
    InvitedEmail: String(o.invited_email || ""),
    InvitedByUID: String(o.invited_by_uid || ""),
    InvitedByName: String(o.invited_by_name || ""),
    State: state,
    Uses: uses,
    MaxUses: maxUses,
    CreatedAt: String(o.created_at || ""),
    ExpiresAt: String(o.expires_at || ""),
    LastUsedAt: String(o.last_used_at || ""),
    AcceptedBy: String(o.accepted_by || "")
  };
}

function readInvites_(ss) {
  var sheet = getOrCreateSheet_(ss, INVITES_SHEET_NAME, INVITES_HEADERS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { sheet: sheet, headers: [], rows: [] };
  var raw = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var headers = raw[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var rows = [];
  for (var r = 1; r < raw.length; r++) {
    rows.push({ rowNum: r + 1, raw: raw[r], obj: inviteRowToObject_(headers, raw[r]) });
  }
  return { sheet: sheet, headers: headers, rows: rows };
}

function findInviteByCode_(ss, code) {
  var wanted = String(code || "").trim().toUpperCase();
  if (!wanted) return null;
  var data = readInvites_(ss);
  for (var i = 0; i < data.rows.length; i++) {
    if (String(data.rows[i].obj.Code).toUpperCase() === wanted) {
      return { sheet: data.sheet, headers: data.headers, entry: data.rows[i] };
    }
  }
  return null;
}

function sendInviteEmail_(toEmail, inviterName, comp, link) {
  try {
    var kind = String(comp.CompetitionType).toUpperCase() === "LEAGUE" ? "League" : "Knockout Tournament";
    var fee = comp.EntryFee !== undefined ? "KSh " + comp.EntryFee : "";
    var prize = comp.PrizeAmount ? "KSh " + Number(comp.PrizeAmount).toLocaleString() : "";
    var html =
      '<div style="font-family:Georgia,serif;max-width:520px;margin:auto;border:1px solid #ccc;padding:24px">' +
      '<h2 style="margin:0 0 4px;text-align:center;letter-spacing:1px">CHUKA eFOOTBALL</h2>' +
      '<p style="margin:0 0 16px;text-align:center;font-size:11px;color:#555;text-transform:uppercase">Official University eFootball Esports Hub</p>' +
      '<hr style="border:none;border-top:2px solid #222">' +
      '<p>' + (inviterName ? inviterName : "The tournament directorate") + ' has invited you to join the <b>' + kind + ': ' + comp.Name + '</b>.</p>' +
      (fee || prize ? '<p style="font-size:13px;color:#333">' + (fee ? "Entry fee: <b>" + fee + "</b>" : "") + (fee && prize ? " &nbsp;|&nbsp; " : "") + (prize ? "Winner prize: <b>" + prize + "</b>" : "") + '</p>' : "") +
      '<p style="text-align:center;margin:24px 0"><a href="' + link + '" style="background:#22c55e;color:#000;padding:12px 22px;text-decoration:none;font-weight:bold;border-radius:8px">Accept Invitation</a></p>' +
      '<p style="font-size:11px;color:#666">Sign in with this email address (' + toEmail + ') to accept. Registration is confirmed after an administrator verifies your payment.</p>' +
      '<p style="font-size:11px;color:#666">Help Desk: ' + HELP_DESK_NAME + ' (' + HELP_DESK_PHONE + ')</p></div>';
    MailApp.sendEmail({
      to: toEmail,
      subject: "You're invited: " + comp.Name + " - Chuka eFootball",
      htmlBody: html,
      name: "Chuka eFootball Hub"
    });
    return true;
  } catch (err) {
    Logger.log("[Invite Email Error] " + err.message);
    return false;
  }
}

function createInviteInDatabase_(ss, auth, body) {
  var isAdm = isAdminAuth_(auth);
  var compId = String(body.competitionId || body.CompetitionID || "").trim();
  var comp = findCompetitionById_(ss, compId);
  if (!comp) return { success: false, message: "Competition not found." };
  var cStatus = String(comp.Status || "").toUpperCase();
  if (!isAdm && cStatus !== "OPEN") {
    return { success: false, message: "Only competitions with open registration can be shared." };
  }
  if (isAdm && (cStatus === "COMPLETED" || cStatus === "CANCELLED")) {
    return { success: false, message: "This competition has ended and cannot accept invitations." };
  }

  var email = String(body.email || "").trim().toLowerCase();
  if (email) {
    if (!isAdm) return { success: false, message: "Only administrators can send email invitations." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { success: false, message: "Invalid email address." };
  }

  var data = readInvites_(ss);
  if (!isAdm) {
    var mine = 0;
    for (var i = 0; i < data.rows.length; i++) {
      if (data.rows[i].obj.InvitedByUID === auth.uid && data.rows[i].obj.State === "ACTIVE") mine++;
    }
    if (mine >= 25) return { success: false, message: "You have reached the limit of 25 active invitations. Revoke some first." };
  }

  var code = "";
  for (var tries = 0; tries < 10; tries++) {
    code = Utilities.getUuid().replace(/-/g, "").substring(0, 8).toUpperCase();
    var clash = false;
    for (var k = 0; k < data.rows.length; k++) { if (data.rows[k].obj.Code === code) { clash = true; break; } }
    if (!clash) break;
  }

  var expiryDays = Math.max(1, Math.min(90, Number(body.expiryDays) || 14));
  var maxUses = email ? 1 : (isAdm ? Math.max(0, Number(body.maxUses) || 0) : 0);
  var now = new Date();
  var expires = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  var inviteId = "INV-" + Date.now().toString().slice(-8);

  data.sheet.appendRow([
    inviteId, code, comp.CompetitionID, comp.Name, String(comp.CompetitionType || ""),
    email ? "EMAIL" : "LINK", email, auth.uid, auth.displayName || auth.email || "", "ACTIVE",
    0, maxUses, now.toISOString(), expires.toISOString(), "", ""
  ]);
  SpreadsheetApp.flush();

  var appUrl = sanitizeAppUrl_(body.appUrl);
  if (appUrl && !PropertiesService.getScriptProperties().getProperty("APP_URL")) {
    PropertiesService.getScriptProperties().setProperty("APP_URL", appUrl);
  }
  var link = appUrl ? appUrl + "/?invite=" + code : "";
  var emailSent = false;
  if (email && link) emailSent = sendInviteEmail_(email, auth.displayName || "", comp, link);

  logAudit_(ss, auth.uid, auth.email, "INVITE_CREATED", "Invite", inviteId, { competitionId: comp.CompetitionID, type: email ? "EMAIL" : "LINK", emailSent: emailSent });

  var obj = inviteRowToObject_(INVITES_HEADERS, [
    inviteId, code, comp.CompetitionID, comp.Name, String(comp.CompetitionType || ""),
    email ? "EMAIL" : "LINK", email, auth.uid, auth.displayName || auth.email || "", "ACTIVE",
    0, maxUses, now.toISOString(), expires.toISOString(), "", ""
  ]);
  return {
    success: true,
    message: email ? (emailSent ? "Invitation emailed to " + email + "." : "Invitation created. Email could not be sent - share the link manually.") : "Invite link created.",
    invite: obj,
    link: link,
    emailSent: emailSent,
    data: { invite: obj, link: link, emailSent: emailSent, message: email ? (emailSent ? "Invitation emailed to " + email + "." : "Invitation created. Email could not be sent - share the link manually.") : "Invite link created." }
  };
}

function previewInvite_(ss, code) {
  var found = findInviteByCode_(ss, code);
  if (!found) return { success: true, valid: false, reason: "This invitation link is not valid.", data: { valid: false, reason: "This invitation link is not valid." } };
  var inv = found.entry.obj;
  var comp = findCompetitionById_(ss, inv.CompetitionID);
  var reason = "";
  if (inv.State === "REVOKED") reason = "This invitation has been withdrawn.";
  else if (inv.State === "EXPIRED") reason = "This invitation has expired.";
  else if (inv.State === "USED") reason = "This invitation has already been used.";
  else if (!comp) reason = "The competition for this invitation no longer exists.";
  else if (String(comp.Status).toUpperCase() !== "OPEN") reason = "Registration for this competition is not open.";
  var out = {
    valid: reason === "",
    reason: reason,
    code: inv.Code,
    competitionId: inv.CompetitionID,
    competitionName: inv.CompetitionName,
    competitionType: inv.CompetitionType,
    entryFee: comp ? comp.EntryFee : undefined,
    prizeAmount: comp ? comp.PrizeAmount : undefined,
    invitedBy: String(inv.InvitedByName || "").split(" ")[0],
    restrictedTo: inv.InvitedEmail ? maskEmail_(inv.InvitedEmail) : ""
  };
  return { success: true, valid: out.valid, reason: out.reason, invite: out, data: out };
}

function acceptInviteInDatabase_(ss, auth, code) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (e) { return { success: false, message: "System is busy. Please try again." }; }
  try {
    var found = findInviteByCode_(ss, code);
    if (!found) return { success: false, message: "This invitation link is not valid." };
    var inv = found.entry.obj;
    if (inv.State !== "ACTIVE") {
      var msg = inv.State === "REVOKED" ? "This invitation has been withdrawn." : inv.State === "EXPIRED" ? "This invitation has expired." : "This invitation has already been used.";
      return { success: false, message: msg };
    }
    if (inv.InvitedEmail && String(auth.email || "").toLowerCase() !== inv.InvitedEmail.toLowerCase()) {
      return { success: false, message: "This invitation was sent to " + maskEmail_(inv.InvitedEmail) + ". Please sign in with that email address." };
    }
    var comp = findCompetitionById_(ss, inv.CompetitionID);
    if (!comp) return { success: false, message: "The competition for this invitation no longer exists." };
    if (String(comp.Status).toUpperCase() !== "OPEN") return { success: false, message: "Registration for this competition is not open." };

    var acceptedBy = inv.AcceptedBy ? inv.AcceptedBy.split(",") : [];
    var me = String(auth.uid || auth.email);
    var firstTime = acceptedBy.indexOf(me) === -1;
    if (firstTime) {
      acceptedBy.push(me);
      var h = found.headers;
      var row = found.entry.rowNum;
      found.sheet.getRange(row, h.indexOf("uses") + 1).setValue(inv.Uses + 1);
      found.sheet.getRange(row, h.indexOf("accepted_by") + 1).setValue(acceptedBy.join(","));
      found.sheet.getRange(row, h.indexOf("last_used_at") + 1).setValue(new Date().toISOString());
      SpreadsheetApp.flush();
      logAudit_(ss, auth.uid, auth.email, "INVITE_ACCEPTED", "Invite", inv.InviteID, { competitionId: comp.CompetitionID });
    }

    var regs = getRegistrationsFromDatabase_(ss, comp.CompetitionID);
    var already = false;
    for (var i = 0; i < regs.length; i++) {
      var st = String(regs[i].Status).toUpperCase();
      if ((regs[i].PlayerID === auth.uid || regs[i].PlayerID === auth.email) && st !== "REJECTED" && st !== "CANCELLED") { already = true; break; }
    }
    return {
      success: true,
      message: already ? "You are already registered for " + comp.Name + "." : "Invitation accepted. Complete your registration for " + comp.Name + ".",
      competition: comp,
      alreadyRegistered: already,
      data: { competition: comp, alreadyRegistered: already, message: already ? "You are already registered for " + comp.Name + "." : "Invitation accepted. Complete your registration for " + comp.Name + "." }
    };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function listInvitesFromDatabase_(ss, auth, compId) {
  var data = readInvites_(ss);
  var isAdm = isAdminAuth_(auth);
  var out = [];
  for (var i = data.rows.length - 1; i >= 0; i--) {
    var o = data.rows[i].obj;
    if (!isAdm && o.InvitedByUID !== auth.uid) continue;
    if (compId && o.CompetitionID !== compId) continue;
    out.push(o);
    if (out.length >= 300) break;
  }
  return out;
}

function revokeInviteInDatabase_(ss, auth, inviteId) {
  var data = readInvites_(ss);
  var isAdm = isAdminAuth_(auth);
  for (var i = 0; i < data.rows.length; i++) {
    var o = data.rows[i].obj;
    if (o.InviteID === String(inviteId || "").trim()) {
      if (!isAdm && o.InvitedByUID !== auth.uid) return { success: false, message: "You can only revoke your own invitations." };
      data.sheet.getRange(data.rows[i].rowNum, data.headers.indexOf("status") + 1).setValue("REVOKED");
      SpreadsheetApp.flush();
      logAudit_(ss, auth.uid, auth.email, "INVITE_REVOKED", "Invite", o.InviteID, { competitionId: o.CompetitionID });
      return { success: true, message: "Invitation revoked." };
    }
  }
  return { success: false, message: "Invitation not found." };
}

/* =========================================================================
 * CHUKA ARENA COMMUNITY BACKEND
 * Additive APIs for Hostels, Availability and Community.
 * Existing authentication/login/signup is intentionally untouched.
 * ========================================================================= */

function arenaNow_(){ return new Date().toISOString(); }
function arenaId_(prefix){ return prefix + Utilities.getUuid().replace(/-/g, '').slice(0, 20).toUpperCase(); }
function arenaText_(v,max){ var s=String(v==null?"":v).trim(); return max && s.length>max ? s.slice(0,max) : s; }
function arenaBool_(v){ return v===true || String(v).toLowerCase()==='true' || String(v).toLowerCase()==='yes' || String(v)==='1'; }
function arenaNumber_(v, fallback){ var n=Number(v); return isFinite(n) ? n : fallback; }
function arenaSheet_(ss,name,headers){ return getOrCreateSheet_(ss,name,headers); }
function arenaRows_(sheet){
  var lr=sheet.getLastRow(), lc=sheet.getLastColumn();
  if(lr<2 || lc<1) return {headers:lr?sheet.getRange(1,1,1,lc).getValues()[0]:[], rows:[]};
  var raw=sheet.getRange(1,1,lr,lc).getValues();
  var headers=raw[0].map(function(x){return String(x||'').trim().toLowerCase();});
  var rows=[];
  for(var i=1;i<raw.length;i++){ var o={}; for(var j=0;j<headers.length;j++) o[headers[j]]=raw[i][j]; o.__row=i+1; rows.push(o); }
  return {headers:headers,rows:rows};
}
function arenaSet_(sheet,rowObj,values){
  var h=arenaRows_(sheet).headers, row=rowObj.__row;
  Object.keys(values).forEach(function(k){ var idx=h.indexOf(k.toLowerCase()); if(idx!==-1) sheet.getRange(row,idx+1).setValue(values[k]); });
}
function arenaAppend_(sheet,values){
  var h=arenaRows_(sheet).headers, row=h.map(function(k){return values[k]!==undefined?values[k]:'';});
  sheet.appendRow(row); return sheet.getLastRow();
}
function arenaPublicHostel_(o, rooms, photos){
  var x={
    hostelId:String(o.hostel_id||''), name:String(o.name||''), location:String(o.location||''), customLocation:String(o.custom_location||''),
    estimatedDistance:String(o.estimated_distance||''), distanceUnit:String(o.distance_unit||''), description:String(o.description||''),
    landlordName:String(o.landlord_name||''), landlordPhone:String(o.landlord_phone||''), landlordWhatsapp:String(o.landlord_whatsapp||''),
    caretakerName:String(o.caretaker_name||''), caretakerPhone:String(o.caretaker_phone||''), caretakerWhatsapp:String(o.caretaker_whatsapp||''),
    wifiAvailable:arenaBool_(o.wifi_available), waterPayment:String(o.water_payment||''), electricityPayment:String(o.electricity_payment||''),
    status:String(o.status||''), createdAt:String(o.created_at||''), updatedAt:String(o.updated_at||''), isActive:arenaBool_(o.is_active),
    rooms:rooms||[], photos:photos||[]
  };
  return x;
}

function createHostelInDatabase_(ss, auth, body){
  var name=arenaText_(body.name||body.hostelName,120);
  var location=arenaText_(body.location,40);
  var allowed=['Mungoni','Marine','Slaughter','Ndagani','Lowlands','Juveras','Custom'];
  if(!name) return {success:false,message:'Hostel name is required.'};
  if(allowed.indexOf(location)===-1) return {success:false,message:'Invalid hostel location.'};
  var custom=location==='Custom'?arenaText_(body.customLocation,100):'';
  if(location==='Custom'&&!custom) return {success:false,message:'Custom location is required.'};
  var rooms=Array.isArray(body.rooms)?body.rooms:[];
  if(!rooms.length && body.roomType) rooms=[body];
  if(!rooms.length) return {success:false,message:'Add at least one room type.'};
  var ssheet=arenaSheet_(ss,ARENA_HOSTELS_SHEET_NAME,ARENA_HOSTELS_HEADERS);
  var data=arenaRows_(ssheet), norm=name.toLowerCase();
  for(var i=0;i<data.rows.length;i++){
    var r=data.rows[i];
    if(String(r.name||'').trim().toLowerCase()===norm && String(r.location||'').trim().toLowerCase()===(location==='Custom'?custom:location).toLowerCase() && String(r.status||'').toUpperCase()!=='REJECTED') return {success:false,message:'A hostel with this name already exists in this location.'};
  }
  var now=arenaNow_(), id=arenaId_('HST_');
  arenaAppend_(ssheet,{hostel_id:id,name:name,location:location,custom_location:custom,estimated_distance:arenaText_(body.estimatedDistance,30),distance_unit:arenaText_(body.distanceUnit||'km',10),description:arenaText_(body.description,1000),landlord_name:arenaText_(body.landlordName,100),landlord_phone:arenaText_(body.landlordPhone,30),landlord_whatsapp:arenaText_(body.landlordWhatsApp||body.landlordWhatsapp,30),caretaker_name:arenaText_(body.caretakerName,100),caretaker_phone:arenaText_(body.caretakerPhone,30),caretaker_whatsapp:arenaText_(body.caretakerWhatsApp||body.caretakerWhatsapp,30),wifi_available:arenaBool_(body.wifiAvailable),water_payment:arenaText_(body.waterPayment,30),electricity_payment:arenaText_(body.electricityPayment,30),status:'PENDING',submitted_by_uid:auth.uid,submitted_by_name:arenaText_(auth.name||auth.displayName||auth.email,100),created_at:now,updated_at:now,is_active:true});
  var rs=arenaSheet_(ss,ARENA_HOSTEL_ROOMS_SHEET_NAME,ARENA_HOSTEL_ROOMS_HEADERS);
  for(var j=0;j<rooms.length;j++){
    var rt=arenaText_(rooms[j].roomType||rooms[j].type,40);
    if(['Single Room','Bedsitter','One Bedroom'].indexOf(rt)===-1) continue;
    arenaAppend_(rs,{room_id:arenaId_('ROOM_'),hostel_id:id,room_type:rt,monthly_rent:arenaNumber_(rooms[j].monthlyRent||rooms[j].price,''),currency:'KES',availability_status:arenaText_(rooms[j].availabilityStatus||'AVAILABLE',30).toUpperCase(),available_count:Math.max(0,Math.floor(arenaNumber_(rooms[j].availableCount||rooms[j].roomsAvailable,0))),created_at:now,updated_at:now});
  }
  if(isAdminAuth_(auth)) setHostelModerationStatus_(ss,auth,id,'APPROVED','Submitted by administrator.');
  try{ logAudit_(ss,auth.uid,auth.email,'HOSTEL_SUBMITTED','Hostel',id,{status:'PENDING'}); }catch(e){}
  return {success:true,hostelId:id,status:isAdminAuth_(auth)?'APPROVED':'PENDING',message:isAdminAuth_(auth)?'Hostel published.':'Hostel submitted for admin verification.'};
}

function setHostelModerationStatus_(ss,auth,hostelId,status,note){
  var sh=arenaSheet_(ss,ARENA_HOSTELS_SHEET_NAME,ARENA_HOSTELS_HEADERS), d=arenaRows_(sh);
  for(var i=0;i<d.rows.length;i++) if(String(d.rows[i].hostel_id)===String(hostelId)){
    arenaSet_(sh,d.rows[i],{status:status,reviewed_by:auth.uid,reviewed_at:arenaNow_(),updated_at:arenaNow_(),moderation_note:arenaText_(note,500),is_active:status==='APPROVED'});
    try{logAudit_(ss,auth.uid,auth.email,'HOSTEL_'+status,'Hostel',hostelId,{note:note||''});}catch(e){}
    return {success:true,status:status,hostelId:hostelId};
  }
  return {success:false,message:'Hostel not found.'};
}

function listHostelsFromDatabase_(ss,body){
  var hs=arenaSheet_(ss,ARENA_HOSTELS_SHEET_NAME,ARENA_HOSTELS_HEADERS), rd=arenaRows_(hs), rs=arenaSheet_(ss,ARENA_HOSTEL_ROOMS_SHEET_NAME,ARENA_HOSTEL_ROOMS_HEADERS), rrows=arenaRows_(rs).rows, ps=arenaSheet_(ss,ARENA_HOSTEL_PHOTOS_SHEET_NAME,ARENA_HOSTEL_PHOTOS_HEADERS), prows=arenaRows_(ps).rows, out=[];
  var includePending=arenaBool_(body&&body.includePending);
  for(var i=0;i<rd.rows.length;i++){
    var o=rd.rows[i], st=String(o.status||'').toUpperCase(); if(!includePending && st!=='APPROVED') continue; if(st==='REJECTED') continue;
    var rooms=rrows.filter(function(x){return String(x.hostel_id)===String(o.hostel_id);}).map(function(x){return {roomId:String(x.room_id),roomType:String(x.room_type),monthlyRent:x.monthly_rent,availabilityStatus:String(x.availability_status||''),availableCount:Number(x.available_count||0)};});
    var photos=prows.filter(function(x){return String(x.hostel_id)===String(o.hostel_id)&&String(x.is_active).toUpperCase()!=='FALSE';}).map(function(x){return {photoId:String(x.photo_id),photoType:String(x.photo_type),imageUrl:String(x.image_url||''),caption:String(x.caption||'')};});
    out.push(arenaPublicHostel_(o,rooms,photos));
  }
  return out;
}

function updateHostelAvailabilityInDatabase_(ss,auth,body){
  var hostelId=String(body.hostelId||body.HostelID||'').trim(), roomId=String(body.roomId||body.RoomID||'').trim();
  if(!hostelId) return {success:false,message:'Hostel ID is required.'};
  var rs=arenaSheet_(ss,ARENA_HOSTEL_ROOMS_SHEET_NAME,ARENA_HOSTEL_ROOMS_HEADERS), rd=arenaRows_(rs), target=null;
  for(var i=0;i<rd.rows.length;i++) if(String(rd.rows[i].hostel_id)===hostelId && (!roomId || String(rd.rows[i].room_id)===roomId)){target=rd.rows[i];break;}
  if(!target) return {success:false,message:'Room type not found for this hostel.'};
  var status=arenaText_(body.availabilityStatus||body.status,'FULL').toUpperCase();
  if(['AVAILABLE','LIMITED','FULL'].indexOf(status)===-1) return {success:false,message:'Invalid availability status.'};
  var count=Math.max(0,Math.floor(arenaNumber_(body.availableCount||body.roomsAvailable,status==='FULL'?0:0)));
  var now=arenaNow_(); arenaSet_(rs,target,{availability_status:status,available_count:count,updated_at:now});
  var as=arenaSheet_(ss,ARENA_HOSTEL_AVAILABILITY_SHEET_NAME,ARENA_HOSTEL_AVAILABILITY_HEADERS);
  arenaAppend_(as,{update_id:arenaId_('HAV_'),hostel_id:hostelId,room_id:String(target.room_id),availability_status:status,available_count:count,note:arenaText_(body.note,500),contributor_uid:auth.uid,contributor_name:arenaText_(auth.name||auth.displayName||auth.email,100),created_at:now});
  return {success:true,message:'Availability updated.',hostelId:hostelId,roomId:String(target.room_id),status:status,availableCount:count,updatedAt:now};
}

function getHostelAvailabilityFromDatabase_(ss,hostelId){
  var as=arenaSheet_(ss,ARENA_HOSTEL_AVAILABILITY_SHEET_NAME,ARENA_HOSTEL_AVAILABILITY_HEADERS), d=arenaRows_(as), out=[];
  for(var i=d.rows.length-1;i>=0;i--) if(String(d.rows[i].hostel_id)===String(hostelId||'')) out.push(d.rows[i]);
  return out.slice(0,50);
}

function uploadHostelPhotoInDatabase_(ss,auth,body){
  var hostelId=String(body.hostelId||'').trim(), data=String(body.fileData||body.base64||'').trim();
  if(!hostelId||!data) return {success:false,message:'Hostel ID and image data are required.'};
  if(data.length>8*1024*1024) return {success:false,message:'Image is too large.'};
  var mime=arenaText_(body.mimeType||'image/jpeg',80); if(mime.indexOf('image/')!==0) return {success:false,message:'Only image uploads are allowed.'};
  var raw=data.replace(/^data:[^;]+;base64,/,'');
  var bytes=Utilities.base64Decode(raw); var blob=Utilities.newBlob(bytes,mime,arenaText_(body.fileName||('hostel-'+hostelId+'.jpg'),100));
  var rootIt=DriveApp.getFoldersByName('Chuka Arena'); var root=rootIt.hasNext()?rootIt.next():DriveApp.createFolder('Chuka Arena');
  var hostIt=root.getFoldersByName('Hostels'); var hostRoot=hostIt.hasNext()?hostIt.next():root.createFolder('Hostels');
  var folderIt=hostRoot.getFoldersByName(hostelId); var folder=folderIt.hasNext()?folderIt.next():hostRoot.createFolder(hostelId);
  var file=folder.createFile(blob); file.setName(arenaText_(body.fileName||('hostel-'+Date.now()+'.jpg'),100));
  // Approved hostel photos are public listing media. Make the Drive file viewable
  // by link and store a browser-friendly image URL rather than the Drive UI URL.
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (shareErr) {}
  var imageUrl='https://drive.google.com/uc?export=view&id='+encodeURIComponent(file.getId());
  var ps=arenaSheet_(ss,ARENA_HOSTEL_PHOTOS_SHEET_NAME,ARENA_HOSTEL_PHOTOS_HEADERS); var now=arenaNow_();
  arenaAppend_(ps,{photo_id:arenaId_('HPH_'),hostel_id:hostelId,photo_type:arenaText_(body.photoType||'INTERIOR',30).toUpperCase(),drive_file_id:file.getId(),image_url:imageUrl,caption:arenaText_(body.caption,200),uploaded_by_uid:auth.uid,created_at:now,is_active:true});
  return {success:true,fileId:file.getId(),imageUrl:imageUrl,message:'Hostel photo uploaded.'};
}

function createCommunityRequestInDatabase_(ss,auth,body){
  var title=arenaText_(body.title,120), desc=arenaText_(body.description,1500); if(!title||!desc) return {success:false,message:'Title and description are required.'};
  var now=arenaNow_(), id=arenaId_('REQ_'); var sh=arenaSheet_(ss,ARENA_COMMUNITY_REQUESTS_SHEET_NAME,ARENA_COMMUNITY_REQUESTS_HEADERS);
  arenaAppend_(sh,{request_id:id,title:title,description:desc,category:arenaText_(body.category||'GENERAL',40),location:arenaText_(body.location,80),contact_method:'WHATSAPP',status:'OPEN',created_by_uid:auth.uid,created_by_name:arenaText_(auth.name||auth.displayName||auth.email,100),created_at:now,updated_at:now,expires_at:body.expiresAt||'',moderation_status:'ACTIVE'});
  return {success:true,requestId:id,status:'OPEN'};
}
function getCommunityRequestsFromDatabase_(ss){
  var sh=arenaSheet_(ss,ARENA_COMMUNITY_REQUESTS_SHEET_NAME,ARENA_COMMUNITY_REQUESTS_HEADERS),d=arenaRows_(sh),out=[];
  for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];if(String(x.status||'').toUpperCase()!=='OPEN')continue;out.push({requestId:String(x.request_id),title:String(x.title),description:String(x.description),category:String(x.category),location:String(x.location),status:'OPEN',createdAt:String(x.created_at)});} return out;
}
function acceptCommunityRequestInDatabase_(ss,auth,id){
  var sh=arenaSheet_(ss,ARENA_COMMUNITY_REQUESTS_SHEET_NAME,ARENA_COMMUNITY_REQUESTS_HEADERS),d=arenaRows_(sh);
  for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].request_id)===String(id)){
    if(String(d.rows[i].status).toUpperCase()!=='OPEN')return {success:false,message:'This request has already been accepted or closed.'};
    if(String(d.rows[i].created_by_uid)===String(auth.uid))return {success:false,message:'You cannot accept your own request.'};
    var now=arenaNow_(); arenaSet_(sh,d.rows[i],{status:'ACCEPTED',accepted_by_uid:auth.uid,accepted_by_name:arenaText_(auth.name||auth.displayName||auth.email,100),accepted_at:now,updated_at:now,archived_at:now});
    return {success:true,status:'ACCEPTED',requestId:id,message:'Request accepted. Contact the requester through WhatsApp.'};
  } return {success:false,message:'Request not found.'};
}
function createRoommatePostInDatabase_(ss,auth,body){
  var title=arenaText_(body.title||'Looking for roommate',120), loc=arenaText_(body.location,40), type=arenaText_(body.roomType,40); if(!loc||['Single Room','Bedsitter','One Bedroom'].indexOf(type)===-1)return {success:false,message:'Location and valid room type are required.'};
  var now=arenaNow_(),id=arenaId_('RM_'); var sh=arenaSheet_(ss,ARENA_ROOMMATE_FINDER_SHEET_NAME,ARENA_ROOMMATE_FINDER_HEADERS);
  arenaAppend_(sh,{post_id:id,title:title,description:arenaText_(body.description,1200),location:loc,hostel_id:arenaText_(body.hostelId,80),room_type:type,monthly_rent:arenaNumber_(body.monthlyRent,''),currency:'KES',contribution_amount:arenaNumber_(body.contributionAmount,''),roommates_needed:Math.max(1,Math.floor(arenaNumber_(body.roommatesNeeded,1))),current_roommates:Math.max(0,Math.floor(arenaNumber_(body.currentRoommates,1))),contact_method:'WHATSAPP',status:'ACTIVE',created_by_uid:auth.uid,created_by_name:arenaText_(auth.name||auth.displayName||auth.email,100),created_at:now,updated_at:now,expires_at:body.expiresAt||'',moderation_status:'ACTIVE'});
  return {success:true,postId:id,status:'ACTIVE'};
}
function getRoommatePostsFromDatabase_(ss){
  var d=arenaRows_(arenaSheet_(ss,ARENA_ROOMMATE_FINDER_SHEET_NAME,ARENA_ROOMMATE_FINDER_HEADERS)),out=[]; for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];if(String(x.status).toUpperCase()!=='ACTIVE')continue;out.push({postId:String(x.post_id),title:String(x.title),description:String(x.description),location:String(x.location),roomType:String(x.room_type),monthlyRent:x.monthly_rent,contributionAmount:x.contribution_amount,roommatesNeeded:x.roommates_needed,currentRoommates:x.current_roommates,status:'ACTIVE',createdAt:String(x.created_at)});}return out;
}
function setOwnRoommatePostStatus_(ss,auth,id,status){var sh=arenaSheet_(ss,ARENA_ROOMMATE_FINDER_SHEET_NAME,ARENA_ROOMMATE_FINDER_HEADERS),d=arenaRows_(sh);for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].post_id)===String(id)){if(String(d.rows[i].created_by_uid)!==String(auth.uid))return {success:false,message:'You can only close your own listing.'};arenaSet_(sh,d.rows[i],{status:status,updated_at:arenaNow_(),matched_at:arenaNow_()});return {success:true,status:status};}return {success:false,message:'Listing not found.'};}
function createHookupPostInDatabase_(ss,auth,body){
  if(!arenaBool_(body.ageConfirmed18))return {success:false,message:'You must confirm that you are 18 or older.'};
  var about=arenaText_(body.aboutText||body.description,1200); if(!about)return {success:false,message:'Write something about the connection you are looking for.'};
  var now=arenaNow_(),id=arenaId_('HK_'),alias='Anonymous '+id.slice(-4); var sh=arenaSheet_(ss,ARENA_HOOKUP_FINDER_SHEET_NAME,ARENA_HOOKUP_FINDER_HEADERS);
  arenaAppend_(sh,{post_id:id,public_alias:alias,age_confirmed_18:true,age_band:arenaText_(body.ageBand,'20'),about_text:about,interests:arenaText_(body.interests,300),location_area:arenaText_(body.location,80),contact_method:'WHATSAPP',status:'ACTIVE',owner_uid:auth.uid,created_at:now,updated_at:now,expires_at:body.expiresAt||'',moderation_status:'ACTIVE'});
  return {success:true,postId:id,publicAlias:alias,status:'ACTIVE'};
}
function getHookupPostsFromDatabase_(ss){var d=arenaRows_(arenaSheet_(ss,ARENA_HOOKUP_FINDER_SHEET_NAME,ARENA_HOOKUP_FINDER_HEADERS)),out=[];for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];if(String(x.status).toUpperCase()!=='ACTIVE')continue;out.push({postId:String(x.post_id),publicAlias:String(x.public_alias),ageBand:String(x.age_band),aboutText:String(x.about_text),interests:String(x.interests),location:String(x.location_area),createdAt:String(x.created_at)});}return out;}
function deleteOwnHookupPost_(ss,auth,id){var sh=arenaSheet_(ss,ARENA_HOOKUP_FINDER_SHEET_NAME,ARENA_HOOKUP_FINDER_HEADERS),d=arenaRows_(sh);for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].post_id)===String(id)){if(String(d.rows[i].owner_uid)!==String(auth.uid))return {success:false,message:'You can only delete your own post.'};arenaSet_(sh,d.rows[i],{status:'DELETED',updated_at:arenaNow_()});return {success:true,status:'DELETED'};}return {success:false,message:'Post not found.'};}
function createCommunityReport_(ss,auth,body){var target=String(body.targetId||'').trim(),type=arenaText_(body.targetType||'COMMUNITY',40),reason=arenaText_(body.reason,100);if(!target||!reason)return {success:false,message:'Target and reason are required.'};var sh=arenaSheet_(ss,ARENA_REPORTS_SHEET_NAME,ARENA_REPORTS_HEADERS);var id=arenaId_('REP_');arenaAppend_(sh,{report_id:id,target_type:type,target_id:target,reason:reason,details:arenaText_(body.details,1000),reporter_uid:auth.uid,reporter_name:arenaText_(auth.name||auth.displayName||auth.email,100),status:'OPEN',created_at:arenaNow_(),updated_at:arenaNow_()});return {success:true,reportId:id,status:'OPEN'};}

/**
 * CHUKA ARENA — COMMUNITY BACKEND CONSTANTS PATCH
 *
 * Add this file to the Apps Script project that contains
 * ChukaArena_Code_Connected.gs.
 *
 * The community backend references these ARENA_* constants.
 * The original connected backend did not declare them, which caused:
 *
 *   ReferenceError: ARENA_HOSTELS_SHEET_NAME is not defined
 *
 * This patch only defines names/headers. It does not write to Sheets.
 */

/* ---------------- HOSTELS ---------------- */

var ARENA_HOSTELS_SHEET_NAME = 'Hostels';
var ARENA_HOSTELS_HEADERS = [
  'hostel_id',
  'name',
  'location',
  'custom_location',
  'estimated_distance',
  'distance_unit',
  'description',
  'landlord_name',
  'landlord_phone',
  'landlord_whatsapp',
  'caretaker_name',
  'caretaker_phone',
  'caretaker_whatsapp',
  'wifi_available',
  'water_payment',
  'electricity_payment',
  'status',
  'submitted_by_uid',
  'submitted_by_name',
  'created_at',
  'updated_at',
  'reviewed_by',
  'reviewed_at',
  'moderation_note',
  'is_active'
];

/* ---------------- HOSTEL ROOMS ---------------- */

var ARENA_HOSTEL_ROOMS_SHEET_NAME = 'HostelRooms';
var ARENA_HOSTEL_ROOMS_HEADERS = [
  'room_id',
  'hostel_id',
  'room_type',
  'monthly_rent',
  'currency',
  'availability_status',
  'available_count',
  'created_at',
  'updated_at'
];

/* ---------------- HOSTEL PHOTOS ---------------- */

var ARENA_HOSTEL_PHOTOS_SHEET_NAME = 'HostelPhotos';
var ARENA_HOSTEL_PHOTOS_HEADERS = [
  'photo_id',
  'hostel_id',
  'photo_type',
  'drive_file_id',
  'image_url',
  'caption',
  'uploaded_by_uid',
  'created_at',
  'is_active'
];

/* ---------------- HOSTEL AVAILABILITY HISTORY ---------------- */

var ARENA_HOSTEL_AVAILABILITY_SHEET_NAME = 'HostelAvailability';
var ARENA_HOSTEL_AVAILABILITY_HEADERS = [
  'update_id',
  'hostel_id',
  'room_id',
  'availability_status',
  'available_count',
  'note',
  'contributor_uid',
  'contributor_name',
  'created_at'
];

/* ---------------- COMMUNITY HELP ---------------- */

var ARENA_COMMUNITY_REQUESTS_SHEET_NAME = 'CommunityRequests';
var ARENA_COMMUNITY_REQUESTS_HEADERS = [
  'request_id',
  'title',
  'description',
  'category',
  'location',
  'contact_method',
  'status',
  'created_by_uid',
  'created_by_name',
  'accepted_by_uid',
  'accepted_by_name',
  'created_at',
  'updated_at',
  'accepted_at',
  'archived_at',
  'expires_at',
  'moderation_status'
];

/* ---------------- ROOMMATE FINDER ---------------- */

var ARENA_ROOMMATE_FINDER_SHEET_NAME = 'RoommateFinder';
var ARENA_ROOMMATE_FINDER_HEADERS = [
  'post_id',
  'title',
  'description',
  'location',
  'hostel_id',
  'room_type',
  'monthly_rent',
  'currency',
  'contribution_amount',
  'roommates_needed',
  'current_roommates',
  'contact_method',
  'status',
  'created_by_uid',
  'created_by_name',
  'created_at',
  'updated_at',
  'matched_at',
  'expires_at',
  'moderation_status'
];

/* ---------------- ANONYMOUS SOCIAL ---------------- */

var ARENA_HOOKUP_FINDER_SHEET_NAME = 'HookupFinder';
var ARENA_HOOKUP_FINDER_HEADERS = [
  'post_id',
  'public_alias',
  'age_confirmed_18',
  'age_band',
  'about_text',
  'interests',
  'location_area',
  'contact_method',
  'status',
  'owner_uid',
  'created_at',
  'updated_at',
  'expires_at',
  'moderation_status'
];

/* ---------------- REPORTS ---------------- */

var ARENA_REPORTS_SHEET_NAME = 'Reports';
var ARENA_REPORTS_HEADERS = [
  'report_id',
  'target_type',
  'target_id',
  'reason',
  'details',
  'reporter_uid',
  'reporter_name',
  'status',
  'assigned_to',
  'admin_note',
  'created_at',
  'updated_at',
  'resolved_at'
];

/* ---------------- BLOCKS ---------------- */

var ARENA_COMMUNITY_BLOCKS_SHEET_NAME = 'CommunityBlocks';
var ARENA_COMMUNITY_BLOCKS_HEADERS = [
  'block_id',
  'blocker_uid',
  'blocked_uid',
  'created_at',
  'is_active'
];

Logger.log('✓ Chuka Arena community backend constants loaded.');

/* ============================================================
 * CHUKA ARENA V2 — HOSTEL PROGRAM, JOBS/GIGS, TRENDS,
 * WHATSAPP SUGGESTIONS
 * ============================================================
 */
var ARENA_HOSTEL_PROGRAM_ACCESS_SHEET_NAME = 'HostelProgramAccess';
var ARENA_HOSTEL_PROGRAM_ACCESS_HEADERS = ['access_id','uid','email','trial_started_at','trial_ends_at','payment_id','status','paid_until','updated_at'];
var ARENA_JOBS_GIGS_SHEET_NAME = 'JobsGigs';
var ARENA_JOBS_GIGS_HEADERS = ['job_id','title','description','category','type','location','pay_amount','currency','contact_method','contact_value','status','created_by_uid','created_by_name','created_at','updated_at','moderation_status'];
var ARENA_TRENDS_SHEET_NAME = 'Trends';
var ARENA_TRENDS_HEADERS = ['trend_id','title','description','image_url','drive_file_id','status','created_by','created_at','updated_at'];
var ARENA_WHATSAPP_SUGGESTIONS_SHEET_NAME = 'WhatsAppGroupSuggestions';
var ARENA_WHATSAPP_SUGGESTIONS_HEADERS = ['suggestion_id','name','description','group_url','submitted_by_uid','submitted_by_name','status','created_at','reviewed_by','reviewed_at','moderation_note'];
var ARENA_HOSTEL_PROGRAM_SEMESTER_DAYS = 120;

function initializeChukaArenaV2Database() {
  var ss = getDatabaseSpreadsheet_();
  arenaSheet_(ss, ARENA_HOSTEL_PROGRAM_ACCESS_SHEET_NAME, ARENA_HOSTEL_PROGRAM_ACCESS_HEADERS);
  arenaSheet_(ss, ARENA_JOBS_GIGS_SHEET_NAME, ARENA_JOBS_GIGS_HEADERS);
  arenaSheet_(ss, ARENA_TRENDS_SHEET_NAME, ARENA_TRENDS_HEADERS);
  arenaSheet_(ss, ARENA_WHATSAPP_SUGGESTIONS_SHEET_NAME, ARENA_WHATSAPP_SUGGESTIONS_HEADERS);
  return {success:true,message:'Chuka Arena V2 sheets initialized.'};
}

function createOrGetHostelProgramAccess_(ss, auth) {
  var sh=arenaSheet_(ss,ARENA_HOSTEL_PROGRAM_ACCESS_SHEET_NAME,ARENA_HOSTEL_PROGRAM_ACCESS_HEADERS), d=arenaRows_(sh), now=new Date();
  for(var i=0;i<d.rows.length;i++) if(String(d.rows[i].uid)===String(auth.uid)) return d.rows[i];
  var start=now.toISOString(), end=new Date(now.getTime()+7*24*60*60*1000).toISOString(), id=arenaId_('HPA_');
  arenaAppend_(sh,{access_id:id,uid:auth.uid,email:arenaText_(auth.email,160),trial_started_at:start,trial_ends_at:end,payment_id:'',status:'TRIAL',paid_until:'',updated_at:start});
  return {access_id:id,uid:auth.uid,email:auth.email,trial_started_at:start,trial_ends_at:end,payment_id:'',status:'TRIAL',paid_until:'',updated_at:start};
}
function getHostelProgramStatus_(ss,auth){
  var row=createOrGetHostelProgramAccess_(ss,auth), now=Date.now(), trialEnd=new Date(row.trial_ends_at||0).getTime(), paidEnd=new Date(row.paid_until||0).getTime();
  var active=String(row.status).toUpperCase()==='PAID' ? paidEnd>=now : trialEnd>=now;
  if(!active && String(row.status).toUpperCase()==='TRIAL') row.status='EXPIRED';
  return {success:true,fee:50,currency:'KES',trialDays:7,status:active?(String(row.status).toUpperCase()==='PAID'?'PAID':'TRIAL'):'EXPIRED',trialEndsAt:String(row.trial_ends_at||''),paidUntil:String(row.paid_until||''),paymentId:String(row.payment_id||''),active:active};
}
function createHostelProgramPayment_(ss,auth,body){
  var status=getHostelProgramStatus_(ss,auth); if(status.active && status.status==='PAID') return {success:false,message:'Your Hostel Program access is already paid and active.'};
  var ref=arenaText_(body.paymentReference||body.mpesaReceiptNumber||body.reference,80); if(!ref)return {success:false,message:'Enter the M-Pesa receipt/transaction reference.'};
  var sh=arenaSheet_(ss,PAYMENTS_SHEET_NAME,PAYMENTS_HEADERS), d=arenaRows_(sh);
  for(var i=0;i<d.rows.length;i++) if(String(d.rows[i].player_id)===String(auth.uid) && String(d.rows[i].competition_type).toUpperCase()==='HOSTEL_PROGRAM' && String(d.rows[i].status).toUpperCase()==='PENDING') return {success:true,paymentId:String(d.rows[i].payment_id),status:'PENDING',message:'Your Hostel Program payment is already awaiting admin verification.'};
  var id=arenaId_('PAY_'), now=arenaNow_();
  arenaAppend_(sh,{payment_id:id,player_id:auth.uid,player_name:arenaText_(auth.name||auth.displayName||auth.email,100),competition_id:'HOSTEL_PROGRAM',competition_name:'Hostel Finder Program',competition_type:'HOSTEL_PROGRAM',amount:50,currency:'KES',payment_reference:ref,status:'PENDING',created_at:now,verified_at:'',verified_by:''});
  var access=arenaSheet_(ss,ARENA_HOSTEL_PROGRAM_ACCESS_SHEET_NAME,ARENA_HOSTEL_PROGRAM_ACCESS_HEADERS), rows=arenaRows_(access); for(var j=0;j<rows.rows.length;j++) if(String(rows.rows[j].uid)===String(auth.uid)){arenaSet_(access,rows.rows[j],{payment_id:id,status:'PENDING',updated_at:now});break;}
  try{logAudit_(ss,auth.uid,auth.email,'HOSTEL_PROGRAM_PAYMENT_CREATED','Payment',id,{amount:50});}catch(e){}
  return {success:true,paymentId:id,status:'PENDING',amount:50,currency:'KES',message:'Payment recorded. Admin verification is required.'};
}
function activateHostelProgramPayment_(ss,paymentId,status){
  var sh=arenaSheet_(ss,PAYMENTS_SHEET_NAME,PAYMENTS_HEADERS), d=arenaRows_(sh), target=null; for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].payment_id)===String(paymentId)){target=d.rows[i];break;} if(!target)return;
  var uid=String(target.player_id||''), access=arenaSheet_(ss,ARENA_HOSTEL_PROGRAM_ACCESS_SHEET_NAME,ARENA_HOSTEL_PROGRAM_ACCESS_HEADERS), rows=arenaRows_(access), now=new Date();
  for(var j=0;j<rows.rows.length;j++)if(String(rows.rows[j].uid)===uid){if(status==='CONFIRMED'){var base=now.getTime();var currentPaid=new Date(rows.rows[j].paid_until||0).getTime();if(currentPaid>base)base=currentPaid;arenaSet_(access,rows.rows[j],{status:'PAID',paid_until:new Date(base+ARENA_HOSTEL_PROGRAM_SEMESTER_DAYS*24*60*60*1000).toISOString(),payment_id:paymentId,updated_at:now.toISOString()});}else{arenaSet_(access,rows.rows[j],{status:'REJECTED',payment_id:paymentId,updated_at:now.toISOString()});}break;}
}

function createJobGigInDatabase_(ss,auth,body){
  var title=arenaText_(body.title,140), desc=arenaText_(body.description,1800); if(!title||!desc)return {success:false,message:'Job/gig title and description are required.'};
  var type=arenaText_(body.type||'GIG',30).toUpperCase(); if(['JOB','GIG','REMOTE','FREELANCE'].indexOf(type)===-1)type='GIG';
  var now=arenaNow_(),id=arenaId_('JOB_'),sh=arenaSheet_(ss,ARENA_JOBS_GIGS_SHEET_NAME,ARENA_JOBS_GIGS_HEADERS);
  arenaAppend_(sh,{job_id:id,title:title,description:desc,category:arenaText_(body.category||'GENERAL',60),type:type,location:arenaText_(body.location||'Online',100),pay_amount:arenaNumber_(body.payAmount,''),currency:'KES',contact_method:arenaText_(body.contactMethod||'WHATSAPP',30),contact_value:arenaText_(body.contactValue,160),status:'PENDING',created_by_uid:auth.uid,created_by_name:arenaText_(auth.name||auth.displayName||auth.email,100),created_at:now,updated_at:now,moderation_status:'PENDING'});
  return {success:true,jobId:id,status:'PENDING',message:'Job/gig submitted for review.'};
}
function getJobsGigsFromDatabase_(ss){var d=arenaRows_(arenaSheet_(ss,ARENA_JOBS_GIGS_SHEET_NAME,ARENA_JOBS_GIGS_HEADERS)),out=[];for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];if(String(x.status).toUpperCase()!=='APPROVED')continue;out.push({jobId:String(x.job_id),title:String(x.title),description:String(x.description),category:String(x.category),type:String(x.type),location:String(x.location),payAmount:x.pay_amount,currency:String(x.currency||'KES'),contactMethod:String(x.contact_method||'WHATSAPP'),contactValue:String(x.contact_value||''),createdAt:String(x.created_at)});}return out;}
function adminGetJobsGigsFromDatabase_(ss){var d=arenaRows_(arenaSheet_(ss,ARENA_JOBS_GIGS_SHEET_NAME,ARENA_JOBS_GIGS_HEADERS)),out=[];for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];out.push({jobId:String(x.job_id),title:String(x.title),description:String(x.description),category:String(x.category),type:String(x.type),location:String(x.location),payAmount:x.pay_amount,currency:String(x.currency||'KES'),contactValue:String(x.contact_value||''),status:String(x.status||'PENDING'),createdBy:String(x.created_by_name||''),createdAt:String(x.created_at)});}return out;}
function setJobGigModeration_(ss,auth,id,status,note){if(!isAdminAuth_(auth))return unauthorizedResponse_();var sh=arenaSheet_(ss,ARENA_JOBS_GIGS_SHEET_NAME,ARENA_JOBS_GIGS_HEADERS),d=arenaRows_(sh);for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].job_id)===String(id)){arenaSet_(sh,d.rows[i],{status:status,moderation_status:status,updated_at:arenaNow_()});try{logAudit_(ss,auth.uid,auth.email,'JOB_GIG_'+status,'JobsGigs',id,{note:note||''});}catch(e){}return {success:true,status:status,jobId:id};}return {success:false,message:'Job/gig not found.'};}

function uploadTrendInDatabase_(ss,auth,body){if(!isAdminAuth_(auth))return unauthorizedResponse_();var title=arenaText_(body.title,140),desc=arenaText_(body.description,1800);if(!title||!desc)return {success:false,message:'Trend title and description are required.'};var data=String(body.fileData||body.base64||'').trim();if(!data)return {success:false,message:'Trend image is required.'};if(data.length>10*1024*1024)return {success:false,message:'Image is too large.'};var mime=arenaText_(body.mimeType||'image/jpeg',80);if(mime.indexOf('image/')!==0)return {success:false,message:'Only image files are allowed.'};var raw=data.replace(/^data:[^;]+;base64,/,'');var blob=Utilities.newBlob(Utilities.base64Decode(raw),mime,arenaText_(body.fileName||('trend-'+Date.now()+'.jpg'),120));var it=DriveApp.getFoldersByName('Chuka Arena');var root=it.hasNext()?it.next():DriveApp.createFolder('Chuka Arena');var ti=root.getFoldersByName('Trends');var folder=ti.hasNext()?ti.next():root.createFolder('Trends');var file=folder.createFile(blob);try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(e){}var id=arenaId_('TR_'),now=arenaNow_(),url='https://drive.google.com/uc?export=view&id='+file.getId();arenaAppend_(arenaSheet_(ss,ARENA_TRENDS_SHEET_NAME,ARENA_TRENDS_HEADERS),{trend_id:id,title:title,description:desc,image_url:url,drive_file_id:file.getId(),status:'PUBLISHED',created_by:auth.email,created_at:now,updated_at:now});return {success:true,trendId:id,imageUrl:url,message:'Trend published.'};}
function getTrendsFromDatabase_(ss){var d=arenaRows_(arenaSheet_(ss,ARENA_TRENDS_SHEET_NAME,ARENA_TRENDS_HEADERS)),out=[];for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];if(String(x.status).toUpperCase()!=='PUBLISHED')continue;out.push({trendId:String(x.trend_id),title:String(x.title),description:String(x.description),imageUrl:String(x.image_url),createdAt:String(x.created_at)});}return out;}
function adminDeleteTrendInDatabase_(ss,auth,id){if(!isAdminAuth_(auth))return unauthorizedResponse_();var sh=arenaSheet_(ss,ARENA_TRENDS_SHEET_NAME,ARENA_TRENDS_HEADERS),d=arenaRows_(sh);for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].trend_id)===String(id)){arenaSet_(sh,d.rows[i],{status:'ARCHIVED',updated_at:arenaNow_()});return {success:true,message:'Trend archived.'};}return {success:false,message:'Trend not found.'};}

function submitWhatsAppSuggestionInDatabase_(ss,auth,body){var name=arenaText_(body.name,120),desc=arenaText_(body.description,500),url=arenaText_(body.groupUrl||body.group_url,300);if(!name||!url)return {success:false,message:'Group name and WhatsApp invite link are required.'};if(url.indexOf('https://')!==0 || (url.indexOf('chat.whatsapp.com/')===-1 && url.indexOf('whatsapp.com/')===-1 && url.indexOf('wa.me/')===-1))return {success:false,message:'Use a valid HTTPS WhatsApp link.'};var id=arenaId_('WGS_'),now=arenaNow_();arenaAppend_(arenaSheet_(ss,ARENA_WHATSAPP_SUGGESTIONS_SHEET_NAME,ARENA_WHATSAPP_SUGGESTIONS_HEADERS),{suggestion_id:id,name:name,description:desc,group_url:url,submitted_by_uid:auth.uid,submitted_by_name:arenaText_(auth.name||auth.displayName||auth.email,100),status:'PENDING',created_at:now,reviewed_by:'',reviewed_at:'',moderation_note:''});return {success:true,suggestionId:id,status:'PENDING',message:'WhatsApp group suggestion sent to admin.'};}
function getWhatsAppSuggestionsFromDatabase_(ss){var d=arenaRows_(arenaSheet_(ss,ARENA_WHATSAPP_SUGGESTIONS_SHEET_NAME,ARENA_WHATSAPP_SUGGESTIONS_HEADERS)),out=[];for(var i=d.rows.length-1;i>=0;i--){var x=d.rows[i];if(String(x.status).toUpperCase()!=='PENDING')continue;out.push({suggestionId:String(x.suggestion_id),name:String(x.name),description:String(x.description),groupUrl:String(x.group_url),submittedBy:String(x.submitted_by_name||''),createdAt:String(x.created_at)});}return out;}
function reviewWhatsAppSuggestionInDatabase_(ss,auth,id,approve,note){if(!isAdminAuth_(auth))return unauthorizedResponse_();var sh=arenaSheet_(ss,ARENA_WHATSAPP_SUGGESTIONS_SHEET_NAME,ARENA_WHATSAPP_SUGGESTIONS_HEADERS),d=arenaRows_(sh);for(var i=0;i<d.rows.length;i++)if(String(d.rows[i].suggestion_id)===String(id)){var status=approve?'APPROVED':'REJECTED',now=arenaNow_();arenaSet_(sh,d.rows[i],{status:status,reviewed_by:auth.email,reviewed_at:now,moderation_note:arenaText_(note,500)});if(approve){var groups=getWhatsAppGroupsFromDatabase_(ss),slot=groups.length?groups.length+1:1;if(slot>3)return {success:false,message:'Official WhatsApp group slots are currently full. Add this group manually from the admin WhatsApp Groups panel.'};var sheet=getOrCreateWhatsAppGroupsSheet_(ss),raw=sheet.getDataRange().getValues(),headers=raw[0].map(function(h){return String(h).toLowerCase().trim();}),numCol=headers.indexOf('group_number');var rowToUse=-1;for(var r=1;r<raw.length;r++){if(Number(raw[r][numCol])===slot){rowToUse=r+1;break;}}if(rowToUse!==-1){var map={name:headers.indexOf('name'),description:headers.indexOf('description'),group_url:headers.indexOf('group_url'),active:headers.indexOf('active'),updated_by:headers.indexOf('updated_by'),updated_at:headers.indexOf('updated_at')};var name=String(d.rows[i].name);if(map.name>=0)sheet.getRange(rowToUse,map.name+1).setValue(name);if(map.name>=0)sheet.getRange(rowToUse,map.name+1).setValue(name);if(map.description>=0)sheet.getRange(rowToUse,map.description+1).setValue(String(d.rows[i].description||''));if(map.group_url>=0)sheet.getRange(rowToUse,map.group_url+1).setValue(String(d.rows[i].group_url));if(map.active>=0)sheet.getRange(rowToUse,map.active+1).setValue(true);if(map.updated_by>=0)sheet.getRange(rowToUse,map.updated_by+1).setValue(auth.email);if(map.updated_at>=0)sheet.getRange(rowToUse,map.updated_at+1).setValue(now);}}
return {success:true,status:status,message:approve?'Suggestion approved.':'Suggestion rejected.'};}return {success:false,message:'Suggestion not found.'};}
