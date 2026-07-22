const BASE_URL = 'http://localhost:5071';

async function sendRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    let data = null;
    if (isJson) {
      data = await response.json();
    } else if (response.status !== 204) {
      data = await response.text();
    }
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      error: err.message
    };
  }
}

async function register(email, hoTen, soDienThoai, matKhau, xacNhanMatKhau) {
  return sendRequest(`${BASE_URL}/api/Account/Register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, hoTen, soDienThoai, matKhau, xacNhanMatKhau })
  });
}

async function login(email, matKhau) {
  return sendRequest(`${BASE_URL}/api/Account/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, matKhau })
  });
}

async function getSeats(flightId, sessionId, token) {
  const url = sessionId 
    ? `${BASE_URL}/api/booking/flights/${flightId}/seats?sessionId=${encodeURIComponent(sessionId)}`
    : `${BASE_URL}/api/booking/flights/${flightId}/seats`;
  return sendRequest(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function holdSeat(flightId, seatId, sessionId, token, maHangGhe = null, maxSeats = 1) {
  return sendRequest(`${BASE_URL}/api/booking/flights/${flightId}/seats/${seatId}/hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ sessionId, maHangGhe, maxSeats })
  });
}

async function releaseSeat(flightId, seatId, sessionId, token) {
  return sendRequest(`${BASE_URL}/api/booking/flights/${flightId}/seats/${seatId}/hold?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

async function startPaymentHold(flightId, sessionId, expectedSeats, seatIds, token) {
  return sendRequest(`${BASE_URL}/api/booking/flights/${flightId}/payment-hold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ sessionId, expectedSeats, seatIds })
  });
}

async function cancelPaymentHold(flightId, sessionId, token) {
  return sendRequest(`${BASE_URL}/api/booking/flights/${flightId}/payment-hold?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

module.exports = {
  BASE_URL,
  register,
  login,
  getSeats,
  holdSeat,
  releaseSeat,
  startPaymentHold,
  cancelPaymentHold
};
