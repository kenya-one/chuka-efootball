CHUKA ARENA - ADMIN-ONLY DASHBOARD ROUTING UPDATE

Files:
- src/pages/DashboardPage.tsx
- src/components/admin/AdminMasterHub.tsx
- src/components/admin/AdminHostelsView.tsx

What changed:
- Admin accounts are routed directly to #admin.
- Admin accounts no longer see the normal student navigation: Home, eFootball, Hostels, Community, Marketplace, Profile.
- Admin accounts see the Admin Console only, plus logout/admin controls.
- Normal student accounts keep the existing student navigation and features.
- The Admin Console keeps the existing administration tools and the Hostel approval section.
- No normal student user/profile data or Firebase/Apps Script user backend was removed.

Install:
1. Extract this ZIP into the project root and replace the matching files.
2. Run: npm run build
3. Run: npm run dev
4. Test with an admin account and a normal student account.

Git:
After the local build passes:
  git status
  git add src/pages/DashboardPage.tsx src/components/admin/AdminMasterHub.tsx src/components/admin/AdminHostelsView.tsx
  git commit -m "Make admin dashboard admin-only"
  git push origin index
