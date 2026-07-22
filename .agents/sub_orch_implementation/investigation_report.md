# Investigation Report & Fix Plan — Booking Seat Module (Milestone 1)

This report consolidates the findings of Explorers 1, 2, and 3, identifying critical backend and frontend defects in the Booking Seat module of the Flight Booking System. It provides a consensus summary of all issues, their affected files and line numbers, the logic chains demonstrating how they manifest as errors, and a concrete, step-by-step plan for resolution.

---

## Part 1: Consensus Summary of Issues

### A. Backend Issues (`FlightBookingSystem.Web`)

1. **Ineffective Optimistic Concurrency Control (Double Booking Risk)**
   - **File**: `FlightBookingSystem.Web/Models/Entities.cs` (Line 195)
   - **File**: `FlightBookingSystem.Web/Data/ApplicationDbContext.cs` (Lines 95–98)
   - **File**: `FlightBookingSystem.Web/Controllers/BookingController.cs` (Lines 116, 161, 227)
   - **Description**: Although `seat.PhienBan++` is called when holding, updating, or resetting a seat, the `PhienBan` property has no concurrency annotations (`[ConcurrencyCheck]`, `.IsConcurrencyToken()`, or `.IsRowVersion()`). EF Core does not include it in the `WHERE` clause of `UPDATE` queries, which enables concurrent bookings to overwrite each other (lost updates).

2. **Timezone Offset Serialization Mismatch (Instant Timer Expiration)**
   - **File**: `FlightBookingSystem.Web/Controllers/BookingController.cs` (Lines 60–63)
   - **Description**: In `GetSeatMap`, `GiuDenLuc` is returned as a raw `DateTime?` without specifying the UTC kind or transforming it into a `DateTimeOffset` (unlike `StartPaymentHold` which correctly uses `DateTimeOffset`). As a result, the JSON serializer outputs the local-style ISO string without the `"Z"` suffix (e.g. `"2026-07-12T11:08:05"`). The browser parses this in the client's local timezone (e.g. UTC+7), causing the hold time to resolve as 7 hours in the past and instantly resetting the countdown timer.

3. **On-Demand Scoped Expired Seats Cleanup**
   - **File**: `FlightBookingSystem.Web/Controllers/BookingController.cs` (Lines 209–217)
   - **File**: `FlightBookingSystem.Web/Program.cs`
   - **Description**: Expired seats are only cleaned up for the current `flightId` on-demand when client requests target that specific flight via `ReleaseExpiredSeats(flightId)`. There is no background service globally monitoring and clearing expired holds across the database. Consequently, if a flight has no active traffic, expired holds remain indefinitely.

4. **Missing Database Transactions on Hold Release / Cancellations**
   - **File**: `FlightBookingSystem.Web/Controllers/BookingController.cs` (Lines 174–205)
   - **Description**: The `CancelPaymentHold` and `ReleaseSeat` endpoints modify seat states and call `SaveChangesAsync()` without wrapping the operations in an explicit database transaction. Although less critical for single-row updates, transaction safety is missing.

---

### B. Frontend Issues (`flight-booking-frontend`)

1. **Critical Property Name Mismatch (`seat.gheId` vs `seat.maGheChuyenBay`)**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Lines 76, 129, 145, 282, 290)
   - **Description**: The backend seat map API returns seat objects containing `maGheChuyenBay`, whereas the frontend UI references `seat.gheId` (which is `undefined`). This mismatch stores the user's selected seat IDs as `undefined`. Consequently, checking out triggers the validation block: `"Vui lòng chọn ít nhất 1 ghế trước khi thanh toán."`, preventing checkout.

2. **Missing `getSessionId()` Method in `authService` (Checkout Crash)**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Lines 177, 191)
   - **File**: `flight-booking-frontend/src/services/authService.js`
   - **Description**: The UI calls `authService.getSessionId()` to get/generate a persistent session ID during `startPaymentHold` and `cancelPaymentHold`. However, `authService.js` does not implement this method, resulting in a runtime `TypeError` and crashing the application.

3. **Missing Session ID on Page Load (State Recovery Failure)**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Line 59)
   - **Description**: `bookingService.getSeatMap(flightId)` expects `sessionId` as the second argument. The page load hook omits this parameter, which prevents the backend from identifying the user's session. Thus, `laGheCuaToi` evaluates to `false` on refresh, styling the user's own held seats as `"sold"` (gray) and preventing them from resuming checkout or releasing their seats.

4. **Stale Closure in `fetchSeatMap`**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Lines 57–89)
   - **Description**: `fetchSeatMap` is memoized with `useCallback` but has only `[flightId]` in its dependency array. It references `passengers` inside its body. Because `passengers` is not declared as a dependency, `fetchSeatMap` captures a stale empty passenger state. Invoking it after updating seats overwrites the passenger list with stale values.

5. **Mismatched Seat Status Checks (Click/Selection Block Bypass)**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Lines 118, 276, 277)
   - **Description**: The frontend checks `seat.trangThai === "DaBan"` or `"DangGiu"`, but the backend API returns status strings `"Sold"` or `"Held"`. Because the condition fails on already held or sold seats, users can click and select occupied seats in the UI, only to fail at backend validation.

6. **Incorrect Price and Class Field Extraction (0 đ Seat Pricing)**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Line 144)
   - **Description**: The frontend extracts `seat.phiChonGhe` and `seat.loaiGhe`. The API, however, returns `giaGhe` and `tenHangGhe`. Both variables resolve to `undefined`, which defaults the price fallback to `0 đ` for all seats.

7. **White Screen Crash on Non-Numeric Seat Labels**
   - **File**: `flight-booking-frontend/src/pages/booking/BookingSeatPage.jsx` (Line 272)
   - **Description**: Row labels are parsed using `rowSeats[0].soGhe.match(/\d+/)[0]`. If a seat number does not contain a digit (e.g. `"VIP"`, `"Crew"`, or crew rows), `match` returns `null` and index access throws a runtime `TypeError`, crashing the React render loop.

8. **Grid and Container Layout Overflows**
   - **File**: `flight-booking-frontend/src/styles/pages/booking-seat.css` (Lines 53, 101–126)
   - **Description**: 
     - **Viewport responsiveness**: `.booking-main-grid` uses a fixed 3-column layout (`250px 1fr 380px`) with no media queries, resulting in horizontal overflow on smaller screens.
     - **Cabin Container Overflow**: `.booking-aircraft` has a `max-width: 400px` and `.booking-cabin-glass` has a width of `80%` and `padding: 40px 30px`. This leaves a maximum available width of 260px (`320px - 60px`). However, a row of 6 seats (40px each = 240px) with 5 gaps of 8px (40px) and a 32px aisle requires 312px. The seats therefore overflow the border of the cabin.

---

## Part 2: Evidence Chains & Logic Chains

### 1. Concurrency Vulnerabilities (Lost Updates)
- **Observation**: `Entities.cs` has `public int PhienBan { get; set; }` (line 195) but `ApplicationDbContext.cs` lacks any config or annotations for optimistic concurrency token configuration.
- **Logic**: EF Core doesn't append `AND PhienBan = @OriginalPhienBan` during updates. Concurrent updates to `/hold` will execute standard `UPDATE` queries. The last query to execute overwrites the first one without triggering a `DbUpdateConcurrencyException`, allowing double bookings.

### 2. Immediate Reset of Countdown Timer on Refresh
- **Observation**: `GiuDenLuc` returned in `GetSeatMap` (line 61) is a raw `DateTime` with an unspecified kind.
- **Logic**: JSON serialization prints it without the timezone offset (`"Z"` suffix). When the browser runs `new Date(giuDenLuc)`, it interprets it as local system time (e.g. UTC+7), which is 7 hours in the past compared to UTC. The computed difference `diff` is negative, instantly resetting the timer to `00:00` and canceling the hold.

### 3. Blocked Checkout (Empty seat ID selections)
- **Observation**: The frontend refers to `seat.gheId` (lines 76, 129, 145, 282, 290) instead of `maGheChuyenBay`.
- **Logic**: `seat.gheId` resolves to `undefined`. In React state, `seatId: undefined` is recorded. When proceed to payment is clicked, `passengers.filter(p => p.seatId)` results in an empty array `[]` (length 0). This triggers the validation block, completely preventing checkout.

### 4. White Screen on Checkout Click
- **Observation**: `authService.js` lacks `getSessionId` method; `BookingSeatPage.jsx` calls it on lines 177 and 191.
- **Logic**: Calling a non-existent method raises `TypeError: authService.getSessionId is not a function`, crashing Javascript execution and leaving a blank white screen.

### 5. White Screen on Loading Non-Numeric Rows
- **Observation**: `rowSeats[0].soGhe.match(/\d+/)[0]` (line 272) is used to draw the row number.
- **Logic**: If the seat number lacks digits (e.g., `"VIP"`), `match` returns `null`, and indexing `[0]` on `null` throws a runtime `TypeError`, breaking the React rendering process.

---

## Part 3: Fix Plan & Step-by-Step Action Items

To resolve all identified issues, we will execute the following plan in the next milestone.

### Task 1: Backend Fixes (`FlightBookingSystem.Web`)

1. **Configure Concurrency Token**
   - **Action**: In `FlightBookingSystem.Web/Data/ApplicationDbContext.cs`, add configuration to make `PhienBan` a concurrency token for the `GheChuyenBay` entity:
     ```csharp
     modelBuilder.Entity<GheChuyenBay>()
         .Property(g => g.PhienBan)
         .IsConcurrencyToken();
     ```

2. **Fix Timezone Serialization**
   - **Action**: In `BookingController.cs` inside `GetSeatMap` (lines 61-63), wrap `g.GiuDenLuc` in a `DateTimeOffset` with UTC kind if it is not null:
     ```csharp
     GiuDenLuc = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId && g.GiuDenLuc.HasValue
         ? new DateTimeOffset(DateTime.SpecifyKind(g.GiuDenLuc.Value, DateTimeKind.Utc))
         : null,
     ```

3. **Register Background Cleanup Worker (Optional/Recommended)**
   - **Action**: Implement a background `IHostedService` (e.g., `ExpiredSeatsCleanupService`) running every 1 minute to release expired holds database-wide:
     ```csharp
     using (var scope = _serviceProvider.CreateScope())
     {
         var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
         var now = DateTime.UtcNow;
         var expired = await db.GheChuyenBays
             .Where(g => g.TrangThaiGhe == "Held" && g.GiuDenLuc < now)
             .ToListAsync();
         foreach (var seat in expired)
         {
             seat.TrangThaiGhe = "Available";
             seat.GiuBoiTaiKhoanId = null;
             seat.SessionId = null;
             seat.GiuDenLuc = null;
             seat.PhienBan++;
         }
         await db.SaveChangesAsync();
     }
     ```

---

### Task 2: Frontend Fixes (`flight-booking-frontend`)

1. **Add `getSessionId()` in `authService.js`**
   - **Action**: Add the method in `flight-booking-frontend/src/services/authService.js`:
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

2. **Replace Mismatched Mappings in `BookingSeatPage.jsx`**
   - **Action**: Replace `seat.gheId` and `s.gheId` with `seat.maGheChuyenBay` and `s.maGheChuyenBay` across the component.
   - **Action**: Replace `seat.phiChonGhe` and `seat.loaiGhe` with `seat.giaGhe` and `seat.tenHangGhe` to fix the pricing fields.

3. **Pass Session ID on Page Load**
   - **Action**: Modify `fetchSeatMap` to pass `authService.getSessionId()` to `getSeatMap`:
     ```javascript
     const data = await bookingService.getSeatMap(flightId, authService.getSessionId());
     ```

4. **Solve Stale Closure in `fetchSeatMap`**
   - **Action**: Modify `setPassengers` inside `fetchSeatMap` to use the functional state update form (`prev => ...`) or include `passengers` in the `useCallback` dependency array. The functional state form is cleaner:
     ```javascript
     setPassengers((prev) => {
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

5. **Align Status Checks**
   - **Action**: Align UI validations with API status values `"Held"` and `"Sold"` in `handleSeatClick` and render functions:
     ```javascript
     if (seat.trangThai === "Sold" || seat.trangThai === "DaBan" || seat.trangThai === "Held" || seat.trangThai === "DangGiu")
     ```

6. **Prevent Row Number Regex Crash**
   - **Action**: Use optional chaining and a fallback default in row rendering:
     ```javascript
     <div className="cabin-row-number">{rowSeats[0]?.soGhe?.match(/\d+/)?.[0] || ""}</div>
     ```

7. **Fix Layout and Responsive CSS**
   - **Action**: In `booking-seat.css`, add media queries to stack the grid column on viewports below `1024px`:
     ```css
     @media (max-width: 1024px) {
       .booking-main-grid {
         grid-template-columns: 1fr;
       }
     }
     ```
   - **Action**: Increase the max-width of `.booking-aircraft` (e.g. to `460px`) and adjust `.booking-cabin-glass` width to `90%` with left/right padding to `30px 15px` to ensure the 312px wide seat rows fit perfectly without layout overflow.

---

## Part 4: Verification Plan

### 1. Build Verification
- Execute `dotnet build` in `FlightBookingSystem.Web` to verify no compilation errors are introduced.
- Execute `npm run build` in `flight-booking-frontend` to verify there are no compilation or syntax errors.

### 2. Functional Verification
- **Checkout Flow**: Select seats, verify no alert block occurs, click "Tiếp tục thanh toán" and confirm transition to payment hold timer view.
- **Timer Durability**: Hold a seat, refresh the page, and check if the countdown continues from 10 minutes rather than resetting to `0`.
- **Concurrency Test**: Simulate two sessions attempting to hold the same seat simultaneously; verify that the second request fails with `409 Conflict` and throws a Db concurrency exception behind the scenes.
- **Responsive Layout**: Resize the window to mobile resolutions (375px–768px) to verify columns stack and the cabin seats remain contained inside the glass background border.
