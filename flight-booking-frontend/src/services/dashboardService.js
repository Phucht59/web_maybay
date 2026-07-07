import axiosClient from "./axiosClient";

export const dashboardService = {
  getDashboard: async (timeFilter = "all") => {
    const response = await axiosClient.get("/Dashboard", {
      params: { timeFilter },
    });

    return response.data;
  },

  getSummary: async (timeFilter = "all") => {
    const response = await axiosClient.get("/Dashboard/summary", {
      params: { timeFilter },
    });

    return response.data;
  },
};