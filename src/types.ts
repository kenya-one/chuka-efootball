// CHUKA eFOOTBALL TYPE DEFINITIONS
// Covers all 9 Google Sheets tables, player identity architecture, and app state.

export type AppView = 'landing' | 'rules' | 'whatsapp' | 'knockout' | 'league' | 'profile';

export type ThemeMode = 'dark' | 'light';

// ==========================================
// 1. PLAYER IDENTITY
// The authoritative player identity model in Production Backend API 1.0.0
export interface Player {
  PlayerID: string;            // Stable Primary Key (e.g. PLAYER-000127) - authoritative
  FirebaseUID: string;         // Authenticated Firebase UID
  Email: string;              // Player email
  FullName: string;           // Full legal or display name
  PhoneNumber: string;        // Primary phone contact
  WhatsAppNumber: string;     // WhatsApp communication number
  eFootballUsername: string;  // Unique public gaming tag (e.g. LAURENCE_WG)
  SquadImage?: string;        // Drive file URL/ID for team squad screenshot
  SquadImageFileID?: string;  // Google Drive file ID for squad screenshot
  SquadImageURL?: string;     // Direct Google Drive view/download URL for squad screenshot
  AvailableDays?: string | string[];  // Available days for matches
  AvailableTimes?: string | string[]; // Available time windows for matches
  RulesAccepted: boolean;     // Whether player accepted official rules
  RulesAcceptedAt?: string;   // Timestamp when rules were accepted
  Status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE' | 'Active' | 'Pending Verification' | 'Suspended';
  CreatedAt: string;
  UpdatedAt: string;

  // Backwards-compatible aliases for existing visual components
  DisplayName?: string;        // Alias for FullName
  Phone?: string;              // Alias for PhoneNumber
  WhatsApp?: string;           // Alias for WhatsAppNumber
  GoogleUID?: string;          // Alias for FirebaseUID
  Verified?: boolean;          // Alias for Status === 'ACTIVE'
  Division?: string;           // Optional division/class grouping
  class_id?: string;           // Student/Academic/Class ID
  ClassID?: string;            // Student/Academic/Class ID alias
  role?: 'ADMIN' | 'USER' | string; // Server-authoritative role
  Role?: 'ADMIN' | 'USER' | string; // Server-authoritative role alias
  ProfilePhotoFileID?: string; // Legacy Drive file id
  ProfilePhotoURL?: string;    // Legacy Direct URL
  SquadScreenshotFileID?: string; // Legacy Drive file id
  SquadScreenshotURL?: string; // Legacy Direct URL
  ProfileImage?: string;       // Legacy avatar
}

export interface ProfileCompletion {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

export interface PlayerMeResponse {
  profileExists: boolean;
  player?: Player;
  completion?: ProfileCompletion;
}

export interface AdminPlayersResponse {
  players: Player[];
  counts: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
  };
}

export interface GoogleAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  idToken?: string;
}

// ==========================================
// 2. KNOCKOUT TOURNAMENTS & REGISTRATIONS
// ==========================================
export interface KnockoutTournament {
  TournamentID: string;
  Week: string;
  Name: string;
  RegistrationStart: string;
  RegistrationEnd: string;
  Status: 'Upcoming' | 'Registration Open' | 'In Progress' | 'Completed';
  EntryFee: string;
  CreatedAt: string;
}

export interface KnockoutRegistration {
  RegistrationID: string;
  TournamentID: string;
  PlayerID: string;
  eFootballUsername: string;
  PaymentStatus: 'Pending' | 'Verified' | 'Refunded';
  VerificationStatus: 'Pending' | 'Approved' | 'Rejected';
  RegisteredAt: string;
}

export type KnockoutRound =
  | 'Round of 1024'
  | 'Round of 512'
  | 'Round of 256'
  | 'Round of 128'
  | 'Round of 64'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-Final'
  | 'Quarterfinals'
  | 'Semi-Final'
  | 'Semifinals'
  | 'Final';

export interface KnockoutMatch {
  MatchID: string;
  TournamentID: string;
  Round: KnockoutRound | string;
  Player1ID: string;
  Player2ID: string;
  Player1Username: string;
  Player2Username: string;
  Player1Score?: number | null;
  Player2Score?: number | null;
  Status: 'Scheduled' | 'Result Submitted' | 'Confirmed' | 'Disputed';
  Deadline: string;
  WinnerID?: string;
  ScreenshotReference?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// ==========================================
// 3. LEAGUE MATCHES & STANDINGS
// ==========================================
export interface LeagueMatch {
  MatchID: string;
  Player1ID: string;
  Player2ID: string;
  Player1Username: string;
  Player2Username: string;
  Player1Score?: number | null;
  Player2Score?: number | null;
  Status: 'Scheduled' | 'Result Submitted' | 'Confirmed' | 'Disputed';
  ScreenshotReference?: string;
  PlayedAt?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface LeagueStanding {
  Position?: number;
  PlayerID: string;
  PlayerName?: string;
  eFootballUsername: string;
  Played: number;
  Wins: number;
  Draws: number;
  Losses: number;
  GoalsFor: number;
  GoalsAgainst: number;
  GoalDifference: number;
  Points: number;
}

export interface WhatsAppGroup {
  group_id: string;
  group_number: number;
  name: string;
  description: string;
  group_url: string;
  active: boolean;
  updated_by?: string;
  updated_at?: string;
}

// ==========================================
// 4. PAYMENTS & DISPUTES
// ==========================================
export interface Payment {
  PaymentID: string;
  PlayerID: string;
  Competition: 'Knockout' | 'League';
  Amount: number;
  PaymentReference: string;
  Status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'REJECTED' | 'REFUNDED' | 'Pending' | 'Verified' | 'Failed';
  VerifiedBy?: string;
  CreatedAt: string;
}

export interface Dispute {
  DisputeID: string;
  MatchID: string;
  PlayerID: string;
  Reason: string;
  EvidenceReference?: string;
  Status: 'Open' | 'Under Review' | 'Resolved';
  AdminDecision?: string;
  CreatedAt: string;
  ResolvedAt?: string;
}

// ==========================================
// 5. MATCH RULES
// ==========================================
export interface MatchRule {
  RuleID: string;
  Competition: 'Knockout' | 'League' | 'General';
  RuleTitle: string;
  RuleContent: string;
  Active: boolean;
  UpdatedAt: string;
}

// ==========================================
// 6. RESULT SUBMISSION PAYLOAD
// ==========================================
export interface ResultSubmissionPayload {
  matchId: string;
  competition: 'Knockout' | 'League';
  player1Score: number;
  player2Score: number;
  screenshotFile?: File | null;
  screenshotBase64?: string;
  screenshotName?: string;
  googleUid?: string;
}

// ==========================================
// 7. SETUP 7: COMPETITIONS & PLAYER REGISTRATION
// ==========================================
export type CompetitionType = 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY' | 'SPECIAL';

export type CompetitionStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'FULL'
  | 'CLOSED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Competition {
  CompetitionID: string;
  Name: string;
  Description?: string;
  CompetitionType: CompetitionType | string;
  Format: string;
  Division: string;
  MaxPlayers: number;
  EntryFee: number;
  Currency: string;
  RegistrationStart: string;
  RegistrationEnd: string;
  StartDate: string;
  EndDate: string;
  StartTime?: string;
  RegistrationDeadline?: string;
  Status: CompetitionStatus | string;
  MinPlayers?: number;
  PaymentTill?: string;
  RulesDocumentID?: string;
  RulesDocumentURL?: string;
  StandingsDocumentID?: string;
  StandingsDocumentURL?: string;
  RegisteredPlayersDocumentURL?: string;
  KnockoutBracketDocumentURL?: string;
  LeagueFixturesDocumentURL?: string;
  FinalResultsDocumentURL?: string;
  BracketStatus?: 'REGISTRATION_OPEN' | 'MINIMUM_NOT_REACHED' | 'READY_FOR_BRACKET' | 'BRACKET_GENERATED' | 'IN_PROGRESS' | 'COMPLETED';
  CreatedBy?: string;
  CreatedAt: string;
  UpdatedAt: string;
  // Computed & enriched fields
  RegisteredCount?: number;
  ApprovedCount?: number;
  PendingCount?: number;
  RemainingCapacity?: number;
  IsRegistrationOpen?: boolean;
  // Profile picture
  ProfileImageURL?: string;
  ProfileImageFileID?: string;
  ImageURL?: string;
  ImageFileID?: string;
  WinnerID?: string;
  WinnerName?: string;
  PrizeAmount?: number;
}

export interface MatchFixture {
  FixtureID: string;
  CompetitionID: string;
  CompetitionName?: string;
  CompetitionType: 'KNOCKOUT' | 'LEAGUE' | string;
  Round: string; // e.g. "Round of 32", "Round of 16", "Quarter-Final", "Semi-Final", "Final", or "Matchday 1"
  Player1ID: string;
  Player1Name: string;
  Player2ID: string;
  Player2Name: string;
  Player1Score?: number | null;
  Player2Score?: number | null;
  WinnerID?: string;
  Status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
  MatchDate?: string;
  Deadline?: string;
  ResultPublished?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface AnnouncementRecord {
  AnnouncementID: string;
  CompetitionID?: string;
  CompetitionName?: string;
  Title: string;
  Message: string;
  Type: 'INFO' | 'WARNING' | 'CHAMPION' | 'NOTICE';
  CreatedBy: string;
  CreatedAt: string;
}

export interface AdminDashboardOverview {
  totalPlayers: number;
  activeTournaments: number;
  activeLeagues: number;
  totalRegistrations: number;
  pendingPayments: number;
  upcomingMatches: number;
  recentlyRecordedResults: number;
}

export interface CompetitionRegistration {
  RegistrationID: string;
  CompetitionID: string;
  PlayerID: string;
  PlayerName?: string;
  GoogleUID: string;
  eFootballUsername: string;
  Status: RegistrationStatus | string;
  PaymentStatus: PaymentStatus | string;
  PaymentID?: string;
  RegisteredAt: string;
  VerifiedAt?: string;
  VerifiedBy?: string;
  // Enriched fields from joined Competition
  CompetitionName?: string;
  CompetitionType?: string;
  Format?: string;
  Division?: string;
  EntryFee?: number;
  Currency?: string;
  StartDate?: string;
  EndDate?: string;
  RulesDocumentURL?: string;
  StandingsDocumentURL?: string;
}

export interface CompetitionsResponse {
  competitions: Competition[];
}

export interface CompetitionDetailResponse {
  competition: Competition;
  registeredCount: number;
  remainingCapacity: number;
  isRegistrationOpen: boolean;
  userRegistration?: CompetitionRegistration | null;
}

export interface AdminCompetitionsResponse {
  competitions: Competition[];
  counts: {
    total: number;
    draft: number;
    open: number;
    full: number;
    inProgress: number;
    completed: number;
    closed: number;
  };
}

export interface AdminRegistrationsResponse {
  registrations: CompetitionRegistration[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// ==========================================
// 8. PRODUCTION DATABASE: 21 SHEETS MODEL
// ==========================================

// 1. Settings
export interface AppSettings {
  SettingKey: string;
  SettingValue: string;
  Description?: string;
  UpdatedAt: string;
}

// 2. Admins
export interface AdminRecord {
  AdminID: string;
  FirebaseUID: string;
  Email: string;
  FullName: string;
  Role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
  Status: 'ACTIVE' | 'INACTIVE';
  CreatedAt: string;
}

// 5. Notifications
export interface NotificationRecord {
  NotificationID: string;
  PlayerID: string;
  Title: string;
  Message: string;
  Type: 'INFO' | 'SUCCESS' | 'WARNING' | 'MATCH' | 'DISPUTE';
  IsRead: boolean;
  CreatedAt: string;
}

// 6. Courses
export interface CourseRecord {
  CourseID: string;
  CourseCode: string;
  CourseName: string;
  Department: string;
  Faculty: string;
  CreatedAt: string;
}

// 7. Classes
export interface ClassRecord {
  ClassID: string;
  CourseID: string;
  ClassName: string;
  YearOfStudy: number | string;
  WhatsAppGroupLink: string;
  RepresentativeName?: string;
  RepresentativePhone?: string;
  CreatedAt: string;
}

// 8. LeagueSeasons
export interface LeagueSeasonRecord {
  SeasonID: string;
  SeasonNumber: number;
  Name: string;
  Year?: number | string;
  Semester?: string;
  Capacity?: number;
  ActivationFee: number;
  Currency: string;
  Status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  StartDate: string;
  EndDate: string;
  RulesDocumentID?: string;
  StandingDocumentID?: string;
  StandingsDocID?: string;
  StandingsDocURL?: string;
  RulesDocID?: string;
  RulesDocURL?: string;
  CreatedBy?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// 9. LeagueParticipants
export interface LeagueParticipantRecord {
  ParticipantID: string;
  SeasonID: string;
  PlayerID: string;
  eFootballUsername: string;
  CourseID: string;
  ClassID: string;
  ActivationFeePaid: boolean;
  PaymentReference?: string;
  Status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  JoinedAt: string;
}

// 10. LeagueFixtures
export interface LeagueFixtureRecord {
  FixtureID: string;
  SeasonID: string;
  Matchday: number;
  HomePlayerID: string;
  AwayPlayerID: string;
  HomeUsername: string;
  AwayUsername: string;
  ScheduledDate: string;
  HomeScore?: number | null;
  AwayScore?: number | null;
  Status: 'SCHEDULED' | 'SUBMITTED' | 'CONFIRMED' | 'DISPUTED';
  CreatedAt: string;
  UpdatedAt: string;
}

// 11. LeagueResults
export interface LeagueResultRecord {
  ResultID: string;
  FixtureID: string;
  SeasonID: string;
  SubmittingPlayerID: string;
  HomeScore: number;
  AwayScore: number;
  ScreenshotDriveURL?: string;
  ConfirmationStatus: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  ConfirmedByOpponent: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

// 12. LeagueStandings
export interface LeagueStandingRecord {
  StandingID: string;
  SeasonID: string;
  PlayerID: string;
  eFootballUsername: string;
  FullName?: string;
  Played: number;
  Wins: number;
  Draws: number;
  Losses: number;
  GoalsFor: number;
  GoalsAgainst: number;
  GoalDifference: number;
  Points: number;
  Position: number;
}

// 13. CupTournaments (Weekly Cup)
export interface CupTournamentRecord {
  TournamentID: string;
  TournamentNumber: number;
  Name: string;
  RegistrationStart: string;
  RegistrationEnd: string;
  TournamentStart: string;
  TournamentEnd: string;
  Capacity: number;
  RegistrationFee: number;
  PrizeAmount: number;
  Currency: string;
  Status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  WinnerPlayerID?: string;
  WinnerID?: string;
  WinnerUsername?: string;
  WinnerAnnouncedAt?: string;
  WinnerAnnouncement?: string;
  RegisteredCount?: number;
  TotalCollected?: number;
  PrizePaid?: boolean;
  PrizePaidAt?: string;
  RulesDocumentID?: string;
  AnnouncementDocumentID?: string;
  CreatedBy?: string;
  PaymentInfo?: string;
  BracketJSON?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// 14. CupRegistrations
export interface CupRegistrationRecord {
  RegistrationID: string;
  TournamentID: string;
  PlayerID: string;
  eFootballUsername: string;
  FullName?: string;
  WhatsAppNumber?: string;
  PaymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'REFUNDED';
  VerificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  PaymentReference?: string;
  RegisteredAt: string;
  VerifiedAt?: string;
}

// 15. CupMatches
export interface CupMatchRecord {
  MatchID: string;
  TournamentID: string;
  Round: string; // 'Round of 32' | 'Round of 16' | 'Quarter-Final' | 'Semi-Final' | 'Final'
  Player1ID: string;
  Player2ID: string;
  Player1Username: string;
  Player2Username: string;
  Player1Score?: number | null;
  Player2Score?: number | null;
  Status: 'SCHEDULED' | 'SUBMITTED' | 'CONFIRMED' | 'DISPUTED';
  WinnerID?: string;
  Deadline: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// 16. CupResultSubmissions (Dual submission flow)
export interface CupResultSubmissionRecord {
  SubmissionID: string;
  MatchID: string;
  TournamentID: string;
  PlayerID: string;
  SubmitterScore: number;
  OpponentScore: number;
  ScreenshotDriveID?: string;
  ScreenshotDriveURL?: string;
  SubmittedAt: string;
  Status: 'PENDING' | 'AGREED' | 'DISAGREED';
}

// 17. CupDisputes
export interface CupDisputeRecord {
  DisputeID: string;
  MatchID: string;
  TournamentID: string;
  DisputingPlayerID: string;
  Reason: string;
  EvidenceDriveURL?: string;
  Status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
  AdminDecision?: string;
  ResolvedBy?: string;
  CreatedAt: string;
  ResolvedAt?: string;
}

// 18. ChampionshipHistory
export interface ChampionshipHistoryRecord {
  ChampionshipID: string;
  CompetitionType: 'CUP' | 'LEAGUE';
  CompetitionName: string;
  SeasonOrNumber: string | number;
  WinnerPlayerID: string;
  WinnerUsername: string;
  RunnerUpPlayerID?: string;
  RunnerUpUsername?: string;
  PrizeAmount?: number;
  DateCompleted: string;
}

// 19. Payments
export interface PaymentRecord {
  PaymentID: string;
  PlayerID: string;
  CompetitionType: 'CUP' | 'LEAGUE';
  CompetitionID: string;
  Amount: number;
  Currency: string;
  PaymentReference: string;
  MpesaReceiptNumber?: string;
  Status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
  VerifiedBy?: string;
  CreatedAt: string;
  VerifiedAt?: string;
}

// 20. Documents
export interface DocumentRecord {
  DocumentID: string;
  Title: string;
  DocumentType: 'RULES' | 'STANDINGS' | 'TERMS' | 'GUIDELINES';
  DocURL: string;
  IsPublic: boolean;
  UpdatedAt: string;
}

// 21. MediaFiles
export interface MediaFileRecord {
  FileID: string;
  DriveFileID: string;
  DriveFileURL: string;
  OwnerPlayerID: string;
  Category: 'SQUAD' | 'SCREENSHOT' | 'AVATAR' | 'EVIDENCE';
  MimeType: string;
  CreatedAt: string;
}



/* ==========================================================================
   INVITES & LIVE GOOGLE DOCS
   ========================================================================== */
export type InviteState = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';

export interface InviteRecord {
  InviteID: string;
  Code: string;
  CompetitionID: string;
  CompetitionName: string;
  CompetitionType: string;
  InviteType: 'LINK' | 'EMAIL' | string;
  InvitedEmail: string;
  InvitedByUID: string;
  InvitedByName: string;
  State: InviteState | string;
  Uses: number;
  MaxUses: number;
  CreatedAt: string;
  ExpiresAt: string;
  LastUsedAt: string;
  AcceptedBy: string;
}

export interface InvitePreview {
  valid: boolean;
  reason: string;
  code?: string;
  competitionId?: string;
  competitionName?: string;
  competitionType?: string;
  entryFee?: number;
  prizeAmount?: number;
  invitedBy?: string;
  restrictedTo?: string;
}

export interface LiveDocsInfo {
  rulesUrl: string;
  rosterUrl: string;
  rulesUpdatedAt: string;
  rosterUpdatedAt: string;
}
