const test = require('node:test');
const assert = require('node:assert');
const api = require('./helpers/api');
const dom = require('./helpers/dom');

test('E2E Smoke Test Suite', async (t) => {
  let token;
  const testEmail = `e2e_smoke_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
  const testPassword = 'Password123!';
  const testSessionId = `session_${Date.now()}`;

  await t.test('1. Authentication flow (Register and Login)', async () => {
    // Register
    const regRes = await api.register(
      testEmail,
      'E2E Smoke Test User',
      `0912${Math.floor(100000 + Math.random() * 900000)}`,
      testPassword,
      testPassword
    );
    assert.strictEqual(regRes.ok, true, `Registration failed: ${JSON.stringify(regRes.data || regRes.error)}`);
    assert.ok(regRes.data.Token, 'Registration should return a token');

    // Login
    const loginRes = await api.login(testEmail, testPassword);
    assert.strictEqual(loginRes.ok, true, `Login failed: ${JSON.stringify(loginRes.data || loginRes.error)}`);
    assert.ok(loginRes.data.Token, 'Login should return a token');
    token = loginRes.data.Token;
  });

  await t.test('2. Flight Booking flow (Seat map, Hold, Release, Payment hold)', async () => {
    // First, search for flights to find a valid flight ID
    const flightsRes = await fetch(`${api.BASE_URL}/api/Public/flights`);
    assert.strictEqual(flightsRes.ok, true);
    const flightsData = await flightsRes.json();
    
    let flightId = null;
    if (flightsData.flights && flightsData.flights.length > 0) {
      flightId = flightsData.flights[0].maChuyenBay;
      console.log(`Found dynamic flightId: ${flightId}`);
    } else {
      flightId = 1;
      console.log(`No active flights found, defaulting to flightId: ${flightId}`);
    }

    // Get seat map
    const seatMapRes = await api.getSeats(flightId, testSessionId, token);
    assert.strictEqual(seatMapRes.ok, true, `Failed to get seat map: ${JSON.stringify(seatMapRes.data || seatMapRes.error)}`);
    const seats = seatMapRes.data.seats;
    assert.ok(Array.isArray(seats), 'Seats should be an array');
    
    // Find an available seat
    const availableSeat = seats.find(s => s.trangThai === 'Available');
    if (!availableSeat) {
      console.log('No available seats found for this flight to test hold/release.');
      return;
    }

    const seatId = availableSeat.maGheChuyenBay;
    console.log(`Testing seat hold for seatId: ${seatId}`);

    // Hold seat
    const holdRes = await api.holdSeat(flightId, seatId, testSessionId, token);
    assert.strictEqual(holdRes.ok, true, `Failed to hold seat: ${JSON.stringify(holdRes.data || holdRes.error)}`);

    // Verify seat status is Held and it belongs to me
    const seatMapAfterHold = await api.getSeats(flightId, testSessionId, token);
    const heldSeat = seatMapAfterHold.data.seats.find(s => s.maGheChuyenBay === seatId);
    assert.strictEqual(heldSeat.trangThai, 'Held', 'Seat should have Held status');
    assert.strictEqual(heldSeat.laGheCuaToi, true, 'Seat should belong to this session');

    // Start payment hold
    const payHoldRes = await api.startPaymentHold(flightId, testSessionId, 1, [seatId], token);
    assert.strictEqual(payHoldRes.ok, true, `Failed to start payment hold: ${JSON.stringify(payHoldRes.data || payHoldRes.error)}`);

    // Cancel payment hold
    const cancelPayRes = await api.cancelPaymentHold(flightId, testSessionId, token);
    assert.strictEqual(cancelPayRes.ok, true, `Failed to cancel payment hold: ${JSON.stringify(cancelPayRes.data || cancelPayRes.error)}`);

    // Release seat hold
    const releaseRes = await api.releaseSeat(flightId, seatId, testSessionId, token);
    assert.strictEqual(releaseRes.ok, true, `Failed to release seat: ${JSON.stringify(releaseRes.data || releaseRes.error)}`);

    // Verify seat is available again
    const seatMapAfterRelease = await api.getSeats(flightId, testSessionId, token);
    const releasedSeat = seatMapAfterRelease.data.seats.find(s => s.maGheChuyenBay === seatId);
    assert.strictEqual(releasedSeat.trangThai, 'Available', 'Seat should be Available again');
  });

  await t.test('3. Frontend DOM Smoke Test (React page rendering)', async () => {
    // Load Homepage
    console.log('Loading frontend homepage...');
    const homepageHtml = await dom.loadPage('http://localhost:5173/');
    
    // Attest elements and text
    dom.assertContainsText(homepageHtml, 'ƯU ĐÃI THẢ GA');
    dom.assertHasElement(homepageHtml, '.booking-panel');
    
    // Load Login Page
    console.log('Loading frontend login page...');
    const loginHtml = await dom.loadPage('http://localhost:5173/login');
    
    // Attest elements and text on login page
    dom.assertContainsText(loginHtml, 'Đăng nhập');
    dom.assertHasElement(loginHtml, 'button');
  });
});
