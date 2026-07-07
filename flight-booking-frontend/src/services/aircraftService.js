import axiosClient from "./axiosClient";

const extractErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (typeof data === "string") return data;
  if (data.message) return data.message;

  const modelState = data.errors && typeof data.errors === "object" ? data.errors : data;
  const firstModelStateError = Object.values(modelState)
    .flat()
    .find((item) => typeof item === "string");

  return firstModelStateError || "Có lỗi xảy ra. Vui lòng kiểm tra lại dữ liệu.";
};

export const extractAircraftFieldErrors = (error) => {
  const data = error?.response?.data;
  if (!data || typeof data !== "object" || typeof data === "string") return {};

  const errors = data.errors && typeof data.errors === "object" ? data.errors : data;

  return Object.entries(errors).reduce((result, [key, value]) => {
    const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
    const messages = Array.isArray(value) ? value : [value];
    const message = messages.find((item) => typeof item === "string");

    if (message) result[fieldName] = message;
    return result;
  }, {});
};

const normalizeListResponse = (payload) => ({
  items: payload?.data || [],
  pagination: payload?.pagination || {
    page: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 1,
    startItem: 0,
    endItem: 0,
  },
  filters: payload?.filters || {},
});

export const aircraftService = {
  getAll: async ({ tuKhoa, page } = {}) => {
    const response = await axiosClient.get("/MayBay", {
      params: {
        tuKhoa: tuKhoa || undefined,
        page: page || undefined,
      },
    });

    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/MayBay/${id}`);
    return response.data;
  },

  getAirlineOptions: async () => {
    const response = await axiosClient.get("/MayBay/hang-bay-options");
    return Array.isArray(response.data) ? response.data : [];
  },

  create: async (payload) => {
    try {
      const response = await axiosClient.post("/MayBay", payload);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  update: async (id, payload) => {
    try {
      const response = await axiosClient.put(`/MayBay/${id}`, payload);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const response = await axiosClient.delete(`/MayBay/${id}`);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },
};
