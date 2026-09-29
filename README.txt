Chuka Arena Hostel feature patch

Copy these files into your project, preserving the folder structure:
- src/pages/DashboardPage.tsx
- src/components/admin/AdminMasterHub.tsx
- src/components/admin/AdminHostelsView.tsx (new file)

What this patch changes:
1. Uses Google Drive thumbnail URLs for hostel photos in the listing/detail and admin preview.
2. Adds an Admin > Hostels section that loads submissions through the existing adminGetHostels action and offers Approve/Reject through the existing adminApproveHostel/adminRejectHostel actions.
3. Adds a vacant-room count input and visible success/error feedback to the existing room availability buttons. Signed-in users can update status via the existing updateHostelAvailability action.

No spreadsheet data or Apps Script backend changes are included. Your Code.gs already contains the admin approval and availability actions. The build could not be verified in this Linux workspace because the uploaded node_modules lacked platform-specific native dependencies; run npm run build in your Windows project after copying the files.
