# Project: Booking Seat module QA & Bug Fixes

## Architecture
The application is a web-based flight booking system composed of:
1. **Frontend**: React application built with Vite (`flight-booking-frontend`) rendering the seat booking interface.
2. **Backend**: ASP.NET Core Web API (`FlightBookingSystem.Web`) using SQLite (`flightbooking.db`) as the database.
3. **Communication**: Frontend communicates with the Backend via REST APIs.

### Main Components
- **Frontend Page**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx`
- **Backend API**: `FlightBookingSystem.Web/Controllers/BookingController.cs`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | E2E Test Suite Creation | Design and build E2E test suite (Tiers 1-4) and publish `TEST_READY.md`. | None | IN_PROGRESS (b976bee2-b4c3-4b68-948b-f979734c53ae) |
| 2 | Code Investigation | Investigate frontend and backend issues and identify exact bugs. | None | IN_PROGRESS (d5a7bb1c-9177-4c6d-aa8f-8c5bb073cada) |
| 3 | Backend API Fixes | Fix hold/release logic, database persistence, and expired seats cleanup. | M2 | PLANNED |
| 4 | Frontend UI Fixes | Fix layout overflows, status sync, and white screen crashes on `BookingSeatPage.jsx`. | M2, M3 | PLANNED |
| 5 | E2E Test Verification | Pass 100% of E2E tests. | M1, M4 | PLANNED |
| 6 | Adversarial Hardening | Implement Tier 5 testing and harden edge-case coverage. | M5 | PLANNED |

## Interface Contracts
### Seat API endpoints
- `GET /api/booking/{flightId}`: Retrieve seats list and booking info for a flight.
- `POST /api/booking/hold`: Hold a seat.
  - Request body: `{ "flightId": number, "seatId": number }`
  - Response: `200 OK` with updated seat or status.
- `POST /api/booking/release`: Release a seat.
- `POST /api/booking/check-expired`: Trigger cleanup of expired seat holds.

## Code Layout
- Frontend: `flight-booking-frontend/`
- Backend: `FlightBookingSystem.Web/`
- E2E Tests: `tests/e2e/`
