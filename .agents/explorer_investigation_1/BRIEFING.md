# BRIEFING — 2026-07-12T03:58:05Z

## Mission
Investigate backend and frontend bugs in the Booking Seat module of the FlightBookingSystem.

## 🔒 My Identity
- Archetype: explorer
- Roles: Investigator, Synthesizer
- Working directory: c:\Huflit\web_maybay\.agents\explorer_investigation_1
- Original parent: d5a7bb1c-9177-4c6d-aa8f-8c5bb073cada
- Milestone: Booking Seat Module Bug Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Code-only network mode (no external services/documentation/HTTP requests)

## Current Parent
- Conversation ID: d5a7bb1c-9177-4c6d-aa8f-8c5bb073cada
- Updated: 2026-07-12T04:05:00Z

## Investigation State
- **Explored paths**:
  - FlightBookingSystem.Web/Controllers/BookingController.cs
  - FlightBookingSystem.Web/Models/Entities.cs
  - FlightBookingSystem.Web/Data/ApplicationDbContext.cs
  - FlightBookingSystem.Web/Program.cs
  - flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx
  - flight-booking-frontend/src/styles/pages/booking-seat.css
  - flight-booking-frontend/src/services/authService.js
  - flight-booking-frontend/src/services/bookingService.js
- **Key findings**:
  1. Backend Concurrency Bug: The `PhienBan` column is not configured as a concurrency token, making seat holds vulnerable to lost updates and race conditions.
  2. Expired seat cleanup is only triggered on specific flights during API requests, meaning inactive flights' held seats are never cleared unless requested.
  3. Timezone conversion and SQLite datetime kinds lead to `giuDenLuc` serializing without the `Z` suffix. Browsers parse it as local time, causing the client timer to immediately expire for GMT+7 users.
  4. Frontend uses `seat.gheId` instead of `seat.maGheChuyenBay` returned by the API, causing seat selections to resolve to `undefined` and blocking checkout.
  5. The frontend calls `authService.getSessionId()`, which does not exist, causing white screen crashes during checkout.
  6. The seat click check in the frontend only checks `"DaBan"` and `"DangGiu"`, failing to block selections on `"Sold"` and `"Held"` returned by the API.
  7. Client-server clock drifts cause premature expiration because the frontend compares server time with local client time.
  8. CSS Grid lacks responsive media queries, leading to layout overflows on tablets/mobile.
  9. Seat pricing resolves to 0 due to looking up non-existent properties `phiChonGhe` and `loaiGhe`.
- **Unexplored areas**: None

## Key Decisions Made
- Completed a comprehensive audit of the backend API endpoints and the frontend JSX and CSS code.
- Generated patch files (`backend.patch`, `frontend.patch`, `layout.patch`) in the agent workspace containing precise fixes for all identified bugs.

## Artifact Index
- c:\Huflit\web_maybay\.agents\explorer_investigation_1\ORIGINAL_REQUEST.md — Original request from caller
- c:\Huflit\web_maybay\.agents\explorer_investigation_1\backend.patch — Proposed backend changes
- c:\Huflit\web_maybay\.agents\explorer_investigation_1\frontend.patch — Proposed frontend JS changes
- c:\Huflit\web_maybay\.agents\explorer_investigation_1\layout.patch — Proposed frontend responsive layout CSS changes
