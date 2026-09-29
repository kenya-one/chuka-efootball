# Chuka Arena Frontend Rebuild

This rebuild replaces the authenticated dashboard experience with a mobile-first Chuka Arena shell while preserving the existing Firebase authentication stack and existing eFootball feature components.

## Main navigation
- Home
- eFootball
- Hostels
- Community
- Profile
- Admin entry for authorized administrators

## New frontend flows
### Hostels
- Approved-hostel browsing
- Search and location filters
- Room-type filters
- Hostel detail modal
- Live room availability update
- Hostel submission
- Up to four hostel photo uploads to the Apps Script Drive endpoint
- Pending/approval messaging

### Community
- Community Help feed
- Accept a help request
- Roommate Finder
- Anonymous 18+ social feed
- 18+ confirmation
- WhatsApp deep links
- Report controls
- Public anonymous alias only

## Existing systems retained
- Firebase authentication/session provider
- Existing login page
- Existing player/profile services
- Existing eFootball competitions, cup, league and registration components
- Existing admin hub
- Existing Apps Script API client

## Backend actions used by the new UI
- getHostels
- createHostel
- uploadHostelPhoto
- updateHostelAvailability
- getCommunityRequests
- createCommunityRequest
- acceptCommunityRequest
- getRoommatePosts
- createRoommatePost
- closeRoommatePost
- getHookupPosts
- createHookupPost
- deleteHookupPost
- reportCommunityItem
- getAnnouncements

## Important backend note
The connected Chuka Arena backend currently exposes the Hostel and Community actions above. The existing `Advertisements` sheet is present in the broader project history, but the connected backend file used for the verified Hostel diagnostic does not currently expose a business-advertisement API action. The new Home UI therefore uses the verified announcements feed rather than pretending to load business adverts from an endpoint that is not present.

Before production, add the advertisement API contract and then bind the Home business-board cards and Admin approval queue to it.
