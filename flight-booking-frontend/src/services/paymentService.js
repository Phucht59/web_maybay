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
};
