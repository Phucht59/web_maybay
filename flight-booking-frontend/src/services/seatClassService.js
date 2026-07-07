import axiosClient from "./axiosClient";

const extractErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (typeof data === "string") return data;
  if (data.message) return data.message;

  const firstModelStateError = Object.values(data)
    .flat()
    .find((item) => typeof item === "string");

  return firstModelStateError || "Có lỗi xảy ra. Vui lòng kiểm tra lại dữ liệu.";
};

export const seatClassService = {
  getAll: async ({ tuKhoa } = {}) => {
    const response = await axiosClient.get("/HangGhe", {
      params: {
        tuKhoa: tuKhoa || undefined,
      },
    });

    return Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/HangGhe/${id}`);
    return response.data;
  },

  create: async (payload) => {
    try {
      const response = await axiosClient.post("/HangGhe", payload);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  update: async (id, payload) => {
    try {
      const response = await axiosClient.put(`/HangGhe/${id}`, payload);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const response = await axiosClient.delete(`/HangGhe/${id}`);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },
};