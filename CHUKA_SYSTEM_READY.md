# CHUKA eFootball — Ready System Build

This build extends the existing Firebase + React/Vite + Google Apps Script + Google Sheets platform. Existing Firebase authentication is preserved.

## Included

- Existing Firebase login / Google sign-in preserved.
- Competition discovery with premium Knockout and League card styling.
- Competition share links carry competition ID and referral code.
- Referral dashboard:
  - stable CHUKA referral code
  - referral link
  - verified/pending referral counts
  - 10 verified referrals = 1 free Knockout ticket
  - carry-forward at 20, 30, 40, etc.
  - server-side ticket consumption
  - self-referral / duplicate protection
- Referred new-member registration benefit is recorded server-side and does not rely on browser trust.
- Knockout:
  - existing bracket engine retained
  - automatic first bracket generation when the configured minimum verified roster is reached
  - automatic next-round generation after a confirmed completed round
  - disputed/incomplete matches do not advance
  - shared deep links select the requested tournament
- League:
  - players can create their own community league
  - creator is stored as manager
  - manager-specific league list
  - share code/link
  - configurable match window, e.g. Saturday 2–6 PM
  - manager-only fixture generation
  - existing league standings/result/dispute engine retained
- Official documents:
  - Rules document converted to the same CHUKA Gazette visual system used by competition documents
  - crest + eFootball mark + masthead + official footer
  - consistent printable/downloadable document presentation
- Business advertising:
  - business submission form
  - package/payment reference/status workflow
  - admin approve/reject/pause controls
  - expiry fields
- Homepage media:
  - YouTube URL stored in PlatformSettings
  - muted autoplay embed when browser permits
  - admin can change the URL without code

## Google Apps Script deployment

1. Open the existing official Apps Script project used by the platform.
2. Replace/update its `Code.gs` with the `Code.gs` in this build.
3. Deploy a new web-app version using the same production spreadsheet and Firebase project.
4. If the deployment URL changes, update `APPS_SCRIPT_BASE_URL` in `src/api/client.ts` (or set `VITE_APPS_SCRIPT_URL`).
5. Run the existing backend diagnostic `testBackendSetup()` once from Apps Script.
6. Authorize Drive/Sheets permissions when Apps Script asks.

New Sheets are created lazily by the backend when first used:

- `Referrals`
- `RewardClaims`
- `ManagedLeagues`
- `Advertisements`
- `PlatformSettings`

Existing competition/payment/fixture sheets are preserved.

## Homepage video

Admin can set the video through **Invite & Grow → Admin Commercial Manager → Homepage media**.
The value is stored under `HOME_YOUTUBE_URL` in `PlatformSettings`.

## Advertising

Business submissions enter `Advertisements`. Admin can approve, reject or pause them. Approved ads can be queried through the active-ad endpoint and are designed for homepage/business-placement integration.

## Important production note

The repository could not complete a full dependency installation/build inside this execution environment because `npm install` timed out while resolving packages. The modified TypeScript/TSX files were syntax/transpile checked individually, and `Code.gs` was parsed successfully. Run `npm install` followed by `npm run build` in the deployment environment before publishing.
