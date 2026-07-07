import axiosClient from "./axiosClient";

export const authService = {
  login: async (email, matKhau) => {
    const response = await axiosClient.post("/Account/Login", {
      email,
      matKhau,
    });

    return response.data;
  },

  register: async ({ hoTen, email, soDienThoai, matKhau, xacNhanMatKhau }) => {
    const response = await axiosClient.post("/Account/Register", {
      hoTen,
      email,
      soDienThoai,
      matKhau,
      xacNhanMatKhau,
    });

    return response.data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
  },

  getCurrentUser: () => {
    const userJson = localStorage.getItem("currentUser");

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("accessToken");
  },
};