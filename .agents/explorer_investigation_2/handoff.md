# Booking Seat Module Investigation Handoff Report

## 1. Observation
We observed the following code structures and properties across the backend (`FlightBookingSystem.Web`) and frontend (`flight-booking-frontend`):

### Backend Concurrency Control Lack
- **File:** `c:\Huflit\web_maybay\FlightBookingSystem.Web\Models\Entities.cs`
  - Line 195: `public int PhienBan { get; set; }`
- **File:** `c:\Huflit\web_maybay\FlightBookingSystem.Web\Data\ApplicationDbContext.cs`
  - Lines 95-98:
    ```csharp
    modelBuilder.Entity<GheChuyenBay>().HasKey(e => e.MaGheChuyenBay);
    modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.MaGheMayBay }).IsUnique();
    modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.TrangThaiGhe }).HasDatabaseName("IX_GheChuyenBay_ChuyenBay");
    modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.TrangThaiGhe, e.GiuDenLuc }).HasDatabaseName("IX_GheChuyenBay_Realtime");
    ```

### Backend Timezone Offset Serialization Mismatch
- **File:** `c:\Huflit\web_maybay\FlightBookingSystem.Web\Controllers\BookingController.cs`
  - Lines 60-63:
    ```csharp
    LaGheCuaToi = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId,
    GiuDenLuc = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId
        ? g.GiuDenLuc
        : null,
    ```

### Backend On-Demand Expired Holds Cleanup
- **File:** `c:\Huflit\web_maybay\FlightBookingSystem.Web\Controllers\BookingController.cs`
  - Lines 209-217:
    ```csharp
    private async Task ReleaseExpiredSeats(int flightId)
    {
        var now = DateTime.UtcNow;
        var expired = await _db.GheChuyenBays
            .Where(g => g.MaChuyenBay == flightId && g.TrangThaiGhe == "Held" && g.GiuDenLuc < now)
            .ToListAsync();
        foreach (var seat in expired) ResetSeat(seat, now);
        if (expired.Count > 0) await _db.SaveChangesAsync();
    }
    ```

### Frontend Property Name Mismatch (`s.gheId` vs `s.maGheChuyenBay`)
- **File:** `c:\Huflit\web_maybay\flight-booking-frontend\src\pages\booking\BookingSeatPage.jsx`
  - Line 76: `newPassengers[idx].seatId = s.gheId;`
  - Line 129: `const existingOwnerIndex = newPassengers.findIndex(p => p.seatId === seat.gheId);`
  - Line 145: `newPassengers[currentPassengerIndex].seatId = seat.gheId;`
  - Line 164: `const selectedSeatIds = passengers.filter(p => p.seatId).map(p => p.seatId);`
  - Line 282: `const owner = passengers.find(p => p.seatId === seat.gheId);`
  - Line 290: `key={seat.gheId}`

### Frontend Price & Class Property Mismatches
- **File:** `c:\Huflit\web_maybay\flight-booking-frontend\src\pages\booking\BookingSeatPage.jsx`
  - Line 144:
    ```javascript
    const price = seat.phiChonGhe || (seat.loaiGhe === "Business" ? 500000 : seat.loaiGhe === "Premium Economy" ? 200000 : 0);
    ```

### Frontend White Screen Crash Hazard
- **File:** `c:\Huflit\web_maybay\flight-booking-frontend\src\pages\booking\BookingSeatPage.jsx`
  - Line 272:
    ```javascript
    <div className="cabin-row-number">{rowSeats[0].soGhe.match(/\d+/)[0]}</div>
    ```

### Frontend Layout Overflow
- **File:** `c:\Huflit\web_maybay\flight-booking-frontend\src\styles\pages\booking-seat.css`
  - Lines 53-58:
    ```css
    /* Grid Layout */
    .booking-main-grid {
      display: grid;
      grid-template-columns: 250px 1fr 380px;
      gap: 24px;
      align-items: start;
    }
    ```

---

## 2. Logic Chain

### Backend Issues
1. **Lack of Concurrency Control (Race Condition):**
   - **Observation:** `PhienBan` is not annotated with `[ConcurrencyCheck]` or `[Timestamp]` in `Entities.cs`, nor is it configured as a concurrency token in `ApplicationDbContext.cs` Fluent API configuration.
   - **Logic:** Without EF Core's concurrency check, a concurrent update query will not append `AND PhienBan = @OriginalPhienBan`. Two users can read the same seat as `"Available"` and concurrently update it to `"Held"` with `PhienBan++`. Both updates will succeed, and the second update will silently overwrite the first, resulting in double-booking of seats.
   - **Conclusion:** Concurrency token is missing and must be configured on `PhienBan`.

2. **Timezone Offset Serialization Mismatch:**
   - **Observation:** In `GetSeatMap`, `GiuDenLuc` is returned as a plain `DateTime?` without specifying the UTC kind or transforming it into a `DateTimeOffset`.
   - **Logic:** The JSON serializer outputs the `DateTime` without the UTC offset `Z` suffix. The browser's `new Date(giuDenLuc)` parses this string as local time (e.g. UTC+7). This local shift causes the hold time to be parsed as 7 hours in the past, meaning the remaining time evaluates to `0` or negative, which immediately triggers the hold cancellation logic on page reload.
   - **Conclusion:** `GiuDenLuc` must be wrapped in `DateTimeOffset` specifying UTC kind in `GetSeatMap`.

3. **On-Demand Expired Holds Cleanup:**
   - **Observation:** `ReleaseExpiredSeats(flightId)` only scans and cleans up expired seats belonging to the current `flightId` on-demand when user requests are made.
   - **Logic:** If a flight has no active bookings/queries, its expired held seats will remain `"Held"` indefinitely in the database, polluting booking statistics until someone queries that flight.
   - **Conclusion:** A background hosted service should be registered to clean up expired seats globally across the database periodically.

### Frontend Issues
1. **Critical Property Name Mismatch (`s.gheId` vs `s.maGheChuyenBay`):**
   - **Observation:** The frontend accesses `.gheId` on seat objects, whereas the backend JSON payload maps `MaGheChuyenBay` to `maGheChuyenBay`.
   - **Logic:** Since `seat.gheId` is `undefined`, the React state records `seatId: undefined`. This breaks passenger seat selection, maps duplicate `undefined` keys during rendering, and filters out selected seats in `handlePaymentHold`. As a result, the payment hold fails with the error alert: `"Vui lòng chọn ít nhất 1 ghế trước khi thanh toán."`, completely blocking the booking process.
   - **Conclusion:** All instances of `gheId` must be replaced with `maGheChuyenBay`.

2. **Price & Seat Class Property Mismatches:**
   - **Observation:** `handleSeatClick` uses `seat.phiChonGhe` and `seat.loaiGhe`, but the backend returns `giaGhe` and `tenHangGhe` respectively.
   - **Logic:** Both fields evaluate to `undefined`, so the pricing fallback defaults to `0` for all seats. The price breakdown section therefore displays `0 đ` for seat fees.
   - **Conclusion:** Update the pricing logic to reference `seat.giaGhe` and `seat.tenHangGhe`.

3. **Status Sync Selection Hold Bypass:**
   - **Observation:** The frontend only updates local React state when seats are clicked and does not call backend `holdSeat` or `releaseSeat` endpoints until `startPaymentHold` is invoked.
   - **Logic:** This means seats are not held in the database during the selection phase (which can take several minutes). Multiple users can select the same seats without being blocked, only encountering conflicts at the final step.
   - **Conclusion:** Integrate calls to `bookingService.holdSeat` and `bookingService.releaseSeat` directly inside `handleSeatClick` to leverage the backend selection hold duration.

4. **White Screen Crash on Non-Numeric Seat Labels:**
   - **Observation:** The row number is rendered using `rowSeats[0].soGhe.match(/\d+/)[0]`.
   - **Logic:** If a seat number (such as `"A"`, `"VIP"`, or crew seats) contains no digits, `.match(/\d+/)` returns `null`. Accessing `[0]` on `null` throws a runtime `TypeError`, crashing the React render loop and showing a white screen.
   - **Conclusion:** Add optional chaining and fallback: `rowSeats[0]?.soGhe?.match(/\d+/)?.[0] || ""`.

5. **Layout Overflow on Narrow Viewports:**
   - **Observation:** `.booking-main-grid` uses a fixed 3-column layout (`250px 1fr 380px`) with no responsive media queries.
   - **Logic:** When the viewport width is resized below ~1000px, the grid columns fail to stack, causing horizontal scrollbars and layout clipping.
   - **Conclusion:** Add responsive media queries in CSS to stack columns on smaller screens.

---

## 3. Caveats
- No caveats. All files have been read directly, and the findings are fully supported by code structure and configuration analysis.

---

## 4. Conclusion
The Booking Seat module contains several critical bugs that block seat bookings (property name mismatch), crash the rendering thread (seat labeling), cause immediate hold release on page reload (timezone mismatch), and risk double-booking due to a lack of concurrency protection on the database. Addressing these issues on both the frontend and backend is essential.

---

## 5. Verification Method

### Backend Verification:
1. Run the backend server: `dotnet run` (in `FlightBookingSystem.Web`).
2. Verify timezone serialization: Query `GET /api/booking/flights/{flightId}/seats` and ensure `giuDenLuc` is returned with a `Z` suffix.
3. Verify concurrency: Perform concurrent `POST` requests to `/api/booking/flights/{flightId}/seats/{seatId}/hold` using a script. Verify that the second request fails with a `409 Conflict` status.

### Frontend Verification:
1. Run the frontend dev server: `npm run dev` in `flight-booking-frontend`.
2. Open the browser to the seat selection page:
   - Click a seat and verify it changes status class to `selected`, displays the correct seat fee in the summary card, and allows selecting subsequent passengers.
   - Reload the page while holding a seat; verify the timer continues to tick down instead of resetting to `0` and canceling the hold.
   - Click "Tiếp tục thanh toán" and verify that it successfully creates a payment hold and transitions to the payment hold timer view.
3. Shrink the browser window width; verify the layout stacks vertically on narrow/mobile viewports.
