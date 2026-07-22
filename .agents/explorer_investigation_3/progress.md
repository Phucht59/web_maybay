# Progress — Booking Seat Module Investigation

Last visited: 2026-07-12T04:00:00Z

## Tasks
- [x] Locate backend files and check hold/release logic, database persistence, and expired seats cleanup.
  - Investigated `BookingController.cs` and related files. Found concurrency issues, partial expired seat cleanup scoping, and missing database transactions for cancellation/release.
- [x] Locate frontend files and check layout overflows, status sync issues, and white screen crashes.
  - Investigated `BookingSeatPage.jsx` and styling. Found missing `getSessionId` method in authService, critical `gheId` vs `maGheChuyenBay` naming mismatch causing a blocker on checkout, stale closure in seat map fetching, UI status check mismatch, price calculation bugs, potential white screen crash in regex matching, and layout/responsive overflows.
- [ ] Document findings and recommendations in handoff.md.
