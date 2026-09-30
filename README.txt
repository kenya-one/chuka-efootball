CHUKA ARENA ADMIN UI + HOSTEL IMAGE PATCH

Updated:
- Redesigned Admin Console with a responsive sidebar/menu.
- Added grouped admin navigation for Command, eFootball and Community tools.
- Added mobile admin menu button.
- Kept normal student navigation out of the admin workspace.
- Improved Hostel Moderation cards and admin workspace presentation.
- Improved Google Drive hostel image handling with multiple URL formats and fallbacks.
- Added image error fallback so a broken Drive URL does not leave a blank image area.

Files:
- src/components/admin/AdminMasterHub.tsx
- src/components/admin/AdminHostelsView.tsx

Apply these files to the current project, then run:
  npm run build

If the build passes, commit and push the changes from your project checkout.
