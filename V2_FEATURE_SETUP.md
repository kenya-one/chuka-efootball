# Chuka Arena V2 feature setup

## Backend
1. Replace the Apps Script `Code.gs` with the supplied `Code.gs` from this build.
2. Save the Apps Script project.
3. Run `initializeChukaArenaV2Database()` once. It creates only these new sheets:
   - HostelProgramAccess
   - JobsGigs
   - Trends
   - WhatsAppGroupSuggestions
4. Redeploy the same Apps Script Web App deployment so the existing frontend endpoint serves the new code. Firebase Auth and the existing Users/Payments/eFootball sheets are not replaced.

## Hostel program fee
- Every authenticated user receives a 7-day free trial on first Hostel Finder access.
- After the trial, the program charge is KSh 50.
- Users submit an M-Pesa receipt/reference; the payment is stored in the existing `Payments` sheet as `HOSTEL_PROGRAM` and remains `PENDING` until an admin confirms it.
- Existing admin payment verification is reused. Confirming a `HOSTEL_PROGRAM` payment activates the user's access for the configured semester period (`ARENA_HOSTEL_PROGRAM_SEMESTER_DAYS`, currently 120 days).

## Jobs & Gigs
- Authenticated users can submit online jobs, remote work, freelance work and gigs.
- New submissions are `PENDING` and do not appear publicly until an admin approves them.
- Admin console has a Jobs & Gigs review section.

## Trends
- Admin-only image + description publishing.
- Images are stored in `Chuka Arena/Trends` on Google Drive and the backend attempts to enable link viewing.
- Published trends appear in Community → Trends.

## WhatsApp
- Existing official groups remain admin-controlled.
- Users can suggest new groups; suggestions stay pending until admin review.
- Approved suggestions are placed into an available official group slot.

## Responsive/performance
- Added mobile overflow fixes for filters, forms, tabs, modals and long text.
- Trend images use lazy loading.
- Existing Firebase login/signup flow is untouched.
