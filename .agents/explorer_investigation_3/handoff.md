# Handoff — Booking Seat Module Bug Investigation

## 1. Observation

### Backend Issues (`FlightBookingSystem.Web`)

- **Optimistic Concurrency Control Ineffective**:
  In `Controllers/BookingController.cs` (lines 116, 161, 227), the code increments `seat.PhienBan++`. However, checking `Models/Entities.cs` (line 195) and `Data/ApplicationDbContext.cs`, the `PhienBan` property is not configured with `[ConcurrencyCheck]`, `.IsConcurrencyToken()`, or `.IsRowVersion()`. EF Core does not include `PhienBan` in the `WHERE` clause of generated SQL `UPDATE` statements, disabling optimistic concurrency checks.
- **Scoped Expired Seats Cleanup**:
  In `Controllers/BookingController.cs` (lines 209-217), the `ReleaseExpiredSeats(int flightId)` method only queries and cleans up expired seats for the flight passed as a parameter. Expired seats on other flights remain in the `"Held"` state until a request specifically targets those flights.
- **No Database Transactions on Release/Cancel**:
  `ReleaseSeat` and `CancelPaymentHold` endpoints call `ResetSeat` and update seat states in the database without starting an explicit database transaction. While not strictly fatal for single-row updates, it lacks safety.

---

### Frontend Issues (`flight-booking-frontend`)

- **Missing `getSessionId` Method in `authService`**:
  In `BookingSeatPage.jsx`:
  ```javascript
  177:       await bookingService.startPaymentHold(flightId, authService.getSessionId(), numPassengers, selectedSeatIds);
  191:       await bookingService.cancelPaymentHold(flightId, authService.getSessionId());
  ```
  However, in `flight-booking-frontend/src/services/authService.js`, there is no `getSessionId` method defined. This throws a `TypeError: authService.getSessionId is not a function` when calling payment hold or cancel payment, blocking the user from checkout.
- **Critical Data Mismatch: `gheId` vs `maGheChuyenBay`**:
  The backend API returns seat objects with `maGheChuyenBay` (from `MaGheChuyenBay` in C#). But the frontend page refers to `seat.gheId`:
  ```javascript
  76:               newPassengers[idx].seatId = s.gheId;
  129:     const existingOwnerIndex = newPassengers.findIndex(p => p.seatId === seat.gheId);
  145:         newPassengers[currentPassengerIndex].seatId = seat.gheId;
  282:                       const owner = passengers.find(p => p.seatId === seat.gheId);
  290:                           key={seat.gheId}
  ```
  As `seat.gheId` is always `undefined`, the user's selected seat IDs are saved as `undefined`. When proceeding to payment:
  ```javascript
  164:     const selectedSeatIds = passengers.filter(p => p.seatId).map(p => p.seatId);
  165:     if (selectedSeatIds.length === 0) { ...
  ```
  `selectedSeatIds.length` is always `0`, triggering the alert `"Vui lòng chọn ít nhất 1 ghế trước khi thanh toán."` and blocking checkout.
- **Stale State Closure in `fetchSeatMap`**:
  `fetchSeatMap` (line 57) is wrapped in a `useCallback` with only `[flightId]` as a dependency. It accesses the `passengers` state within its body to restore seats:
  ```javascript
  73:         let newPassengers = [...passengers];
  ```
  Since `passengers` is not in the dependency array, `fetchSeatMap` captures a stale copy of the passengers array (empty/initial state). When called inside `handlePaymentHold` or `handleCancelHold`, it overwrites the current passenger list with stale values.
- **Mismatched Status Strings**:
  In `handleSeatClick` (line 118):
  ```javascript
  if (seat.trangThai === "DaBan" || seat.trangThai === "DangGiu")
  ```
  The backend returns `"Sold"` and `"Held"` for occupied seats. Because the frontend checks `"DaBan"` and `"DangGiu"`, the condition evaluates to `false` for occupied seats. Users are not blocked from clicking and selecting already sold or held seats in the UI, leading to unexpected server-side conflict errors during checkout.
- **Missing `sessionId` in `getSeatMap`**:
  In `BookingSeatPage.jsx` (line 59):
  ```javascript
  const data = await bookingService.getSeatMap(flightId);
  ```
  `bookingService.getSeatMap` expects `sessionId` as the second argument. Omitting it prevents the backend from matching the current session ID, causing `laGheCuaToi` to evaluate to `false`. Users' own held seats are styled as `"sold"` (gray) and the timer/seats are not restored on reload.
- **Incorrect Price Fallback Fields**:
  In `handleSeatClick` (line 144):
  ```javascript
  const price = seat.phiChonGhe || (seat.loaiGhe === "Business" ? 500000 : seat.loaiGhe === "Premium Economy" ? 200000 : 0);
  ```
  The backend API returns `giaGhe` and `tenHangGhe`. Because `phiChonGhe` and `loaiGhe` are undefined, the seat price is always set to `0`.
- **Potential White Screen Crash**:
  In `BookingSeatPage.jsx` (line 272):
  ```javascript
  <div className="cabin-row-number">{rowSeats[0].soGhe.match(/\d+/)[0]}</div>
  ```
  If `soGhe` does not contain a digit (e.g. `"A"`), `match` returns `null` and calling `[0]` on it throws a `TypeError`, crashing the React application render loop (white screen).
- **Layout and Responsive Overflows**:
  - `booking-seat.css` has no media queries. The grid layout `grid-template-columns: 250px 1fr 380px` causes horizontal overflow on screens narrower than ~1200px.
  - Container width overflow: The `.booking-cabin-glass` has a fixed width of `80%` of `.booking-aircraft` (which is `max-width: 400px`, i.e., max width 320px). After subtracting the left/right padding of 30px (total 60px), the content area is at most 260px. However, the row of seats with 6 seats (width 40px each = 240px), 5 gaps of 8px (40px), and an aisle of 32px requires 312px of width. 312px > 260px, so the seats will always overflow horizontally out of the glass cabin container, breaking the UI design.

---

## 2. Logic Chain

1. **Stating missing function crash**: Calling `authService.getSessionId()` when it is not defined in `authService.js` raises an unhandled `TypeError` in Javascript, halting code execution. Therefore, the payment hold request cannot be sent.
2. **Stating data mismatch blocker**: Using `seat.gheId` when the backend returns `maGheChuyenBay` results in `seatId` being stored as `undefined`. Since `selectedSeatIds` filters out any passenger without a truthy `seatId`, the list of selected seats will always be empty, triggering the warning alert.
3. **Stating stale state reset**: Because the `useCallback` hook memoizing `fetchSeatMap` does not include `passengers` as a dependency, it references a stale empty passenger state. Invoking `fetchSeatMap` after seat updates results in the passenger list being overwritten with the stale empty state.
4. **Stating status check bypass**: Checking `"DaBan"` and `"DangGiu"` on the client while the server serves `"Sold"` and `"Held"` bypasses the click block on already booked seats. This allows users to select them, causing validation to fail on backend submission.
5. **Stating session mapping failure**: Not passing `sessionId` to `getSeatMap` leaves the parameter null on the backend. Thus, `g.SessionId == sessionId` is always `false`, evaluating `LaGheCuaToi` to `false` and preventing restoration of the user's booking state and timer.
6. **Stating price calculation failure**: Querying `seat.phiChonGhe` and `seat.loaiGhe` which are absent from the JSON model resolves to `undefined`, making the price fallback evaluate to `0` and rendering seat additions free.
7. **Stating regex crash**: Accessing index `[0]` on a null array returned by `match(/\d+/)` for non-digit seat names throws a `TypeError` which React cannot recover from without an Error Boundary, resulting in a white screen.
8. **Stating layout overflow**: Fixed grid layouts without media queries cause viewport overflows. Fixed cabin content widths smaller than the sum of seat item widths, gaps, and aisles cause seats to overflow outside their borders.
9. **Stating concurrency race condition**: Since `PhienBan` is not configured as a concurrency token in Entity Framework, EF Core does not include it in the `WHERE` clause of `UPDATE` statements. This fails to block concurrent double-hold requests, allowing overwrites.
10. **Stating inefficient cleanup**: Restricting `ReleaseExpiredSeats` to the request's `flightId` means expired holds on other flights will persist in the database until they are explicitly queried.

---

## 3. Caveats

- No caveats. All files have been read directly, and observations were verified.

---

## 4. Conclusion

The Booking Seat module has multiple critical bugs on both the backend and frontend:
1. The frontend is completely blocked from completing checkout due to the `getSessionId` TypeError and the `gheId` vs `maGheChuyenBay` data binding mismatch.
2. The user experience is degraded by state sync issues (missing `sessionId` in seat map fetching, stale passenger state closure, incorrect status checks, and price fallback).
3. Concurrency control is broken in the backend due to missing concurrency token configuration on `PhienBan`.
4. Layout overflows occur on both small viewports and within the aircraft seat map container itself due to size mismatches.

### Recommendations for Fixing:

1. **Fix missing authService method**:
   Add `getSessionId` to `flight-booking-frontend/src/services/authService.js`:
   ```javascript
   getSessionId: () => {
     let sessionId = sessionStorage.getItem("bookingSessionId");
     if (!sessionId) {
       sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
       sessionStorage.setItem("bookingSessionId", sessionId);
     }
     return sessionId;
   }
   ```
2. **Fix `gheId` vs `maGheChuyenBay` mismatch**:
   In `BookingSeatPage.jsx`, replace all instances of `seat.gheId` or `s.gheId` with `seat.maGheChuyenBay` or `s.maGheChuyenBay`.
3. **Fix stale closure in `fetchSeatMap`**:
   Update `setPassengers` inside `fetchSeatMap` to use the functional state update format to avoid capturing stale values:
   ```javascript
   setPassengers(prev => {
     let newPassengers = [...prev];
     heldSeats.forEach((s, idx) => {
        if (idx < newPassengers.length) {
           newPassengers[idx].seatId = s.maGheChuyenBay;
           newPassengers[idx].seatName = s.soGhe;
           newPassengers[idx].seatPrice = s.giaGhe || 0;
        }
     });
     return newPassengers;
   });
   ```
4. **Fix status checks in frontend**:
   Update line 118 in `BookingSeatPage.jsx` to block selection of sold/held seats:
   ```javascript
   if (seat.trangThai === "Sold" || seat.trangThai === "DaBan" || seat.trangThai === "Held" || seat.trangThai === "DangGiu") {
   ```
5. **Fix session ID parameter in `getSeatMap`**:
   In `BookingSeatPage.jsx` line 59, pass the session ID:
   ```javascript
   const data = await bookingService.getSeatMap(flightId, authService.getSessionId());
   ```
6. **Fix seat pricing and class extraction**:
   Update line 144 in `BookingSeatPage.jsx` to match backend fields:
   ```javascript
   const price = seat.giaGhe || (seat.tenHangGhe === "Business" ? 500000 : seat.tenHangGhe === "Premium Economy" ? 200000 : 0);
   ```
7. **Prevent white screen crashes**:
   Update line 272 in `BookingSeatPage.jsx` to safely parse row numbers:
   ```javascript
   <div className="cabin-row-number">{rowSeats[0].soGhe.match(/\d+/)?.[0] || "0"}</div>
   ```
8. **Fix layout and CSS overflows**:
   - Add media queries to `booking-seat.css` to switch `.booking-main-grid` to a single column layout on smaller viewports:
     ```css
     @media (max-width: 1024px) {
       .booking-main-grid {
         grid-template-columns: 1fr;
       }
     }
     ```
   - In `booking-seat.css`, increase `.booking-aircraft` max-width or adjust `.booking-cabin-glass` width and padding to ensure the 312px wide seat rows fit without overflowing. E.g., set `.booking-cabin-glass` width to `90%` and padding to `30px 15px`.
9. **Configure optimistic concurrency in EF Core**:
   In `FlightBookingSystem.Web/Data/ApplicationDbContext.cs`, add configuration to make `PhienBan` a concurrency token:
   ```csharp
   modelBuilder.Entity<GheChuyenBay>()
       .Property(g => g.PhienBan)
       .IsConcurrencyToken();
   ```
10. **Implement system-wide expired seats cleanup**:
    Create a hosted background service (`IHostedService` or background worker) in ASP.NET Core that runs a query periodically (e.g., every 1 minute) to clean up expired seats across all flights:
    ```csharp
    var now = DateTime.UtcNow;
    var expiredSeats = await db.GheChuyenBays
        .Where(g => g.TrangThaiGhe == "Held" && g.GiuDenLuc < now)
        .ToListAsync();
    foreach (var seat in expiredSeats) ResetSeat(seat, now);
    await db.SaveChangesAsync();
    ```

---

## 5. Verification Method

- **Backend verification**:
  - Run `dotnet build` in `FlightBookingSystem.Web/` to verify backend builds successfully.
- **Frontend verification**:
  - Run `npm run build` in `flight-booking-frontend/` to verify frontend compiles without issues.
- **Verification points**:
  - Open `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` and ensure `gheId` has been replaced by `maGheChuyenBay`.
  - Check `flight-booking-frontend/src/services/authService.js` and verify `getSessionId()` is defined.
  - Verify that `ApplicationDbContext.cs` configures `PhienBan` as a concurrency token.
