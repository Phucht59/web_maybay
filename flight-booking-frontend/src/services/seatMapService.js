import axiosClient from "./axiosClient";

const extractErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (Array.isArray(data.errors)) return data.errors.join("\n");

  const firstModelStateError = Object.values(data)
    .flat()
    .find((item) => typeof item === "string");

  return firstModelStateError || "Có lỗi xảy ra. Vui lòng kiểm tra lại dữ liệu.";
};

const withUserMessage = async (request) => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    error.userMessage = extractErrorMessage(error);
    throw error;
  }
};

export const seatMapService = {
  getAircraftOverview: async () => {
    const response = await axiosClient.get("/GheMayBay");
    return Array.isArray(response.data) ? response.data : [];
  },

  getSeatMap: async (aircraftId) => {
    const response = await axiosClient.get(`/GheMayBay/may-bay/${aircraftId}/seat-map`);
    return response.data;
  },

  getGenerateTemplate: async (aircraftId) =>
    withUserMessage(() =>
      axiosClient.get(`/GheMayBay/may-bay/${aircraftId}/generate-template`)
    ),
  generateSeats: async (aircraftId, payload) =>
    withUserMessage(() => axiosClient.post(`/GheMayBay/may-bay/${aircraftId}/generate`, payload)),

  getSeatById: async (seatId) => {
    const response = await axiosClient.get(`/GheMayBay/seats/${seatId}`);
    return response.data;
  },

  updateSeat: async (seatId, payload) =>
    withUserMessage(() => axiosClient.put(`/GheMayBay/seats/${seatId}`, payload)),

  deleteSeat: async (seatId) =>
    withUserMessage(() => axiosClient.delete(`/GheMayBay/seats/${seatId}`)),

  deleteAllUnused: async (aircraftId) =>
    withUserMessage(() => axiosClient.delete(`/GheMayBay/may-bay/${aircraftId}/unused`)),

  getSeatClassOptions: async () => {
    const response = await axiosClient.get("/GheMayBay/hang-ghe-options");
    return Array.isArray(response.data) ? response.data : [];
  },
};
