import axiosClient from "./axiosClient";

const extractErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) return "Có lỗi xảy ra. Vui lòng thử lại.";
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.title && !data.errors) return data.title;

  if (data.errors && typeof data.errors === "object") {
    const firstError = Object.values(data.errors)
      .flat()
      .find((item) => typeof item === "string");

    if (firstError) return firstError;
  }

  const firstModelStateError = Object.values(data)
    .flat()
    .find((item) => typeof item === "string");

  return firstModelStateError || "Có lỗi xảy ra. Vui lòng kiểm tra lại dữ liệu.";
};

const normalizeListResponse = (data) => ({
  items: data?.items || [],
  chuyenBayCoVeIds: data?.chuyenBayCoVeIds || [],
  pagination: {
    page: data?.page || 1,
    pageSize: data?.pageSize || 10,
    totalItems: data?.totalItems || 0,
    totalPages: data?.totalPages || 1,
  },
});

export const flightService = {
  getAll: async ({ tuKhoa, trangThai, maLoTrinh, page = 1, pageSize = 10 } = {}) => {
    const response = await axiosClient.get("/ChuyenBay", {
      params: {
        tuKhoa: tuKhoa || undefined,
        trangThai: trangThai || undefined,
        maLoTrinh: maLoTrinh || undefined,
        page,
        pageSize,
      },
    });

    return normalizeListResponse(response.data);
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/ChuyenBay/${id}`);
    return response.data;
  },

  getRouteOptions: async () => {
    const response = await axiosClient.get("/ChuyenBay/lo-trinh-options");
    return Array.isArray(response.data) ? response.data : [];
  },

  getAircraftOptions: async () => {
    const response = await axiosClient.get("/ChuyenBay/may-bay-options");
    return Array.isArray(response.data) ? response.data : [];
  },

  getStatusOptions: async () => {
    const response = await axiosClient.get("/ChuyenBay/trang-thai-options");
    return Array.isArray(response.data) ? response.data : [];
  },

  create: async (payload) => {
    try {
      const response = await axiosClient.post("/ChuyenBay", payload);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  update: async (id, payload) => {
    try {
      const response = await axiosClient.put(`/ChuyenBay/${id}`, payload);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  updateStatus: async (id, trangThai) => {
    try {
      const response = await axiosClient.patch(`/ChuyenBay/${id}/status`, { trangThai });
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  cancel: async (id) => {
    try {
      const response = await axiosClient.post(`/ChuyenBay/${id}/cancel`);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },

  remove: async (id) => {
    try {
      const response = await axiosClient.delete(`/ChuyenBay/${id}`);
      return response.data;
    } catch (error) {
      error.userMessage = extractErrorMessage(error);
      throw error;
    }
  },
};
