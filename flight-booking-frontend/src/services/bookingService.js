import axiosClient from "./axiosClient";

export const bookingService = {
  getSeatMap: async (flightId, sessionId) => {
    const response = await axiosClient.get(`/booking/flights/${flightId}/seats`, {
      params: { sessionId },
    });
    return response.data;
  },

  holdSeat: async (flightId, seatId, sessionId, maHangGhe, maxSeats) => {
    const response = await axiosClient.post(`/booking/flights/${flightId}/seats/${seatId}/hold`, {
      sessionId,
      maHangGhe,
      maxSeats,
    });
    return response.data;
  },

  releaseSeat: async (flightId, seatId, sessionId) => {
    await axiosClient.delete(`/booking/flights/${flightId}/seats/${seatId}/hold`, {
      params: { sessionId },
    });
  },

  startPaymentHold: async (flightId, sessionId, expectedSeats, seatIds) => {
    const response = await axiosClient.post(`/booking/flights/${flightId}/payment-hold`, {
      sessionId,
      expectedSeats,
      seatIds,
    });
    return response.data;
  },

  createCheckout: async (payload) => {
    const response = await axiosClient.post("/booking/checkout", payload);
    return response.data;
  },

  getCheckoutSummary: async (bookingId) => {
    const normalizedBookingId = Number(bookingId);
    if (!Number.isInteger(normalizedBookingId) || normalizedBookingId <= 0) {
      throw new TypeError("Mã booking không hợp lệ.");
    }

    const response = await axiosClient.get(`/booking/${normalizedBookingId}/checkout`);
    return response.data;
  },

  cancelPaymentHold: async (flightId, sessionId) => {
    await axiosClient.delete(`/booking/flights/${flightId}/payment-hold`, {
      params: { sessionId },
    });
  },
};
