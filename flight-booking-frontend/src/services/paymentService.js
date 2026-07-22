import axiosClient from "./axiosClient";

export const paymentService = {
  createPayment: async ({ bookingId, method, idempotencyKey }) => {
    const response = await axiosClient.post("/payments", {
      bookingId,
      method,
      idempotencyKey,
    });

    return response.data;
  },

  getPaymentStatus: async (paymentId, { signal } = {}) => {
    const normalizedPaymentId = Number(paymentId);
    if (!Number.isInteger(normalizedPaymentId) || normalizedPaymentId <= 0) {
      throw new TypeError("Mã thanh toán không hợp lệ.");
    }

    const response = await axiosClient.get(`/payments/${normalizedPaymentId}/status`, {
      signal,
    });
    return response.data;
  },
};
