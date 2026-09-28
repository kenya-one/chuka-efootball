# Live Docs, Verification & Invites — one-time setup

1. **Apps Script:** replace your project's `Code.gs` with the `Code.gs` in this folder.
2. In the Apps Script editor, select the function **`setupAutomation`** and click **Run**. Approve the permissions
   (Docs, Drive, Sheets, Mail, Triggers). This creates the `MatchRules` and `Invites` sheets, builds both Google Docs,
   installs the auto-refresh triggers, and prints both Doc links in the execution log.
3. **Deploy → Manage deployments → Edit → New version → Deploy** (keeps the same /exec URL).
4. Deploy the web app (push to GitHub). Open **Admin Hub → Docs & Invites** to see both Doc links.

## What updates automatically
- **Official Match Rules Doc** — rebuilt from the `MatchRules` sheet whenever you edit that sheet.
- **LIVE Registered Players Doc** — refreshed ~30s after any registration / verification / rejection, on manual edits to the
  Registrations or Competitions sheets, and every 10 minutes as a safety net (only rewrites when data changed).
- Per-competition rules docs now use the same branded header + the official rules for their type.
