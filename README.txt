Chuka Arena - Updated Admin Hostel Files

Included:
- src/components/admin/AdminMasterHub.tsx
  Adds a Hostels tab and renders AdminHostelsView.
  No normal-user management tab was added/kept in this admin hub; the existing
  eFootball Players section remains untouched.
- src/components/admin/AdminHostelsView.tsx
  Adds admin hostel moderation:
  - load pending/reviewed hostels
  - view hostel images/details
  - approve/reject pending hostels
  - update room availability (AVAILABLE/LIMITED/FULL)
  - optional WhatsApp contact link

The uploaded project already contains the Apps Script actions used by this UI:
adminGetHostels, adminApproveHostel, adminRejectHostel, and
updateHostelAvailability. No backend file was changed in this patch.

Build note:
I could not complete a local Vite build in the sandbox because the uploaded
node_modules is missing its platform-specific Rolldown native binding. The
source changes were written directly against the uploaded project.
