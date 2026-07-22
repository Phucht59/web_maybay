# Booking Seat Module Investigation Handoff

## 1. Observation

### Backend Observations (`FlightBookingSystem.Web`)

- **Concurrency Control in `Entities.cs`**:
  Line 195 of `Entities.cs` declares the `PhienBan` property for optimistic concurrency tracking:
  ```csharp
  public int PhienBan { get; set; }
  ```
  Neither `Entities.cs` nor `Data/ApplicationDbContext.cs` configures this property with `[ConcurrencyCheck]`, `[Timestamp]`, or `.IsConcurrencyToken()`.
  
- **Concurrency Hold/Release Logic in `BookingController.cs`**:
  Line 89 fetches the seat without checking the concurrency token:
  ```csharp
  var seat = await _db.GheChuyenBays
      .Include(g => g.GheMayBay)
      .FirstOrDefaultAsync(g => g.MaChuyenBay == flightId && g.MaGheChuyenBay == seatId);
  ```
  Lines 111-118 write the updated state and increment `PhienBan`:
  ```csharp
  seat.TrangThaiGhe = "Held";
  ...
  seat.PhienBan++;
  await _db.SaveChangesAsync();
  ```
  Since `PhienBan` is not mapped as a concurrency token in EF Core, the database `UPDATE` is not validated against the original `PhienBan` version, which permits concurrent overwrites.

- **DateTime Serialization in `BookingController.cs`**:
  In `GetSeatMap`, lines 61-63 return `GiuDenLuc`:
  ```csharp
  GiuDenLuc = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId
      ? g.GiuDenLuc
      : null,
  ```
  When retrieved from SQLite, `g.GiuDenLuc` returns `Unspecified` DateTimeKind. As a result, serialization produces a date string without a time zone suffix (e.g., `"2026-07-12T11:08:05"`), which browsers parse in the user's local timezone rather than UTC.

- **Cleanup Scope in `BookingController.cs`**:
  Line 209 declares `ReleaseExpiredSeats(int flightId)`. This cleanup is restricted to a single `flightId` and is only invoked when client requests target that specific flight. No background hosted service is registered in `Program.cs` to clean up expired seats globally.

---

### Frontend Observations (`flight-booking-frontend`)

- **Property Naming Error in `BookingSeatPage.jsx`**:
  Line 76 maps the returned seat to passenger data:
  ```javascript
  newPassengers[idx].seatId = s.gheId;
  ```
  Line 129 checks if a seat is assigned:
  ```javascript
  const existingOwnerIndex = newPassengers.findIndex(p => p.seatId === seat.gheId);
  ```
  However, the backend API `GetSeatMap` retrieves `g.MaGheChuyenBay` (which serializes to `maGheChuyenBay`). There is no `gheId` property on the seat object.

- **Missing method `authService.getSessionId()`**:
  Line 177 calls `authService.getSessionId()`:
  ```javascript
  await bookingService.startPaymentHold(flightId, authService.getSessionId(), numPassengers, selectedSeatIds);
  ```
  But `authService.js` (lines 1-47) only implements `login`, `register`, `logout`, `getCurrentUser`, and `isAuthenticated`. It does not contain `getSessionId()`.

- **Missing session ID on load in `BookingSeatPage.jsx`**:
  Line 59 fetches the seat map:
  ```javascript
  const data = await bookingService.getSeatMap(flightId);
  ```
  It omits the `sessionId` parameter, which is required by `bookingService.getSeatMap(flightId, sessionId)` to compute `laGheCuaToi` on the server.

- **Client-Server Timer Discrepancy**:
  Lines 67-69 calculate the remaining seat hold time:
  ```javascript
  const lockTime = new Date(heldSeats[0].giuDenLuc).getTime();
  const now = new Date().getTime();
  const diff = Math.floor((lockTime - now) / 1000);
  ```
  This compares the parsed server expiration time (`lockTime`) directly with client-side local system time (`now`).

- **Incomplete Status Checks**:
  Line 118 checks:
  ```javascript
  if (seat.trangThai === "DaBan" || seat.trangThai === "DangGiu")
  ```
  But the API status strings are `"Sold"` and `"Held"`.

- **Seat Pricing Bug**:
  Line 144 resolves the seat price using:
  ```javascript
  const price = seat.phiChonGhe || (seat.loaiGhe === "Business" ? 500000 : seat.loaiGhe === "Premium Economy" ? 200000 : 0);
  ```
  The seat map endpoint returns the price in `giaGhe` (not `phiChonGhe` or `loaiGhe`).

- **Unsafe Row Parsing**:
  Line 272 renders the row label using:
  ```javascript
  <div className="cabin-row-number">{rowSeats[0].soGhe.match(/\d+/)[0]}</div>
  ```
  This throws an exception if `rowSeats` is empty or if `soGhe` contains no digits.

- **Layout Overflow in CSS**:
  Line 53 of `booking-seat.css` configures the grid columns:
  ```css
  grid-template-columns: 250px 1fr 380px;
  ```
  No responsive media queries are defined in the CSS stylesheet to stack these columns on mobile/tablet viewports.

---

## 2. Logic Chain

1. **Lost Updates / Race Conditions**: Because `PhienBan` is not marked as `[ConcurrencyCheck]`, EF Core does not add `AND PhienBan = @OriginalPhienBan` to the SQL `UPDATE` statement. Thus, concurrent updates to the same seat will overwrite each other without throwing a `DbUpdateConcurrencyException`.
2. **Immediate Timer Expiration**: Because `g.GiuDenLuc` has an `Unspecified` DateTimeKind, it serializes without the `"Z"` suffix. The frontend browser parses this local-style ISO string in the user's local timezone. For a user in GMT+7, this results in the hold expiration being calculated as 7 hours in the past. This makes `diff` negative, which instantly resets the timer to `00:00` and clears the seats.
3. **Checkout Blocked (Empty selections)**: Because `seat.gheId` is undefined, the React state records `seatId: undefined` for selected seats. When filtering for payment hold via `passengers.filter(p => p.seatId)`, the list of IDs evaluates to empty, blocking the checkout action with the alert `"Vui lòng chọn ít nhất 1 ghế trước khi thanh toán."`.
4. **White Screen Crashes**:
   - Calling `authService.getSessionId()` throws a `TypeError: authService.getSessionId is not a function`, crashing the UI during the checkout flow.
   - Calling `.match(/\d+/)[0]` on an empty row or non-digit seat number throws `TypeError: Cannot read properties of null`, crashing the page.
5. **No Self-Recovery on Refresh**: Because the frontend calls `getSeatMap` without the user's session ID on page load, `LaGheCuaToi` returns `false` from the API. The frontend then classifies the user's own held seats as `"sold"` (grayed out) rather than `"paying"` (red/selected), making it impossible to resume payment or cancel the hold.
6. **Layout Breakage**: Lacking media queries, the grid layout demands a minimum width of ~630px, forcing horizontal scrollbars and breaking mobile responsiveness.

---

## 3. Caveats

- We assumed that `sessionStorage` is the preferred mechanism to store and share a persistent `sessionId` across page reloads in a single tab.
- We did not implement these changes directly in the source files because our task archetypes mandate a **read-only investigation**. All proposed fixes are provided as `.patch` files inside this directory.

---

## 4. Conclusion

The Booking Seat module contains critical issues in both the backend and frontend that lead to:
1. Concurrency vulnerabilities (lost updates).
2. UI crashes (white screen on checkout and data loading).
3. Blocked business flows (inability to check out due to property mismatch).
4. Major usability defects (timer immediately expiring, lack of responsiveness).

Applying the provided patch files (`backend.patch`, `frontend.patch`, `layout.patch`) will fully resolve these defects.

---

## 5. Verification Method

### Backend Verification
1. Run `dotnet build` in the `FlightBookingSystem.Web` directory to ensure compilation succeeds:
   ```powershell
   dotnet build
   ```
2. Verify that `Entities.cs` includes `using System.ComponentModel.DataAnnotations;` and that `PhienBan` is decorated with `[ConcurrencyCheck]`.
3. Verify that requests to `GET /api/booking/flights/{id}/seats` serialize `giuDenLuc` with a `"Z"` timezone suffix (confirming `DateTimeKind.Utc`).

### Frontend Verification
1. Run `npm run build` inside `flight-booking-frontend` to verify there are no compilation or syntax errors:
   ```powershell
   npm run build
   ```
2. Open the browser console, select seats, and verify:
   - No `TypeError` crashes occur when clicking "Tiếp tục thanh toán" or "Hủy giữ chỗ".
   - The countdown timer correctly starts at `10:00` (or the actual remaining duration) and does not instantly drop to `00:00`.
   - On page refresh, the user's held seats are correctly restored as selected (red) and the timer resumes.
3. Simulate mobile viewports (e.g. 375px width) in Chrome DevTools to ensure the grid stacks vertically and does not overflow horizontally.
