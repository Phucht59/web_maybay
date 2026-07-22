# Scope: Implementation & Bug Fixes for Booking Seat module

## Architecture
- **Frontend Page**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx`
- **Backend API**: `FlightBookingSystem.Web/Controllers/BookingController.cs`
- Database: SQLite database `flightbooking.db` used by the backend.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Code Investigation | Run Explorer to find and document exact bugs in frontend and backend. Run Reviewer/Challenger/Auditor to verify investigation findings. | None | IN_PROGRESS |
| 2 | Backend API Fixes | Fix hold/release logic, database persistence, expired seats cleanup on backend. Verify via build, tests, and auditor. | M1 | PLANNED |
| 3 | Frontend UI Fixes | Fix layout overflows, status sync, and white screen crashes on frontend. Verify via build, tests, and auditor. | M1, M2 | PLANNED |
| 4 | E2E Test Verification | Wait for TEST_READY.md and pass 100% of E2E test suite (Tiers 1-4). | M2, M3 | PLANNED |
| 5 | Adversarial Hardening | Implement Tier 5 testing and harden edge-case coverage. | M4 | PLANNED |

## Interface Contracts
See PROJECT.md for details.
