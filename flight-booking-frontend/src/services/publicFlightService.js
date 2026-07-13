import axiosClient from "./axiosClient";

export const publicFlightService = {
  searchAirports: async (keyword) => {
    const res = await axiosClient.get("/Public/airports", {
      params: { keyword: keyword || undefined },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  getAllAirports: async () => {
    const res = await axiosClient.get("/Public/airports-all", {
      params: { size: 50 },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  searchFlights: async ({ maSanBayDi, maSanBayDen, ngayDi }) => {
    const res = await axiosClient.get("/Public/flights", {
      params: {
        maSanBayDi: maSanBayDi || undefined,
        maSanBayDen: maSanBayDen || undefined,
        ngayDi: ngayDi || undefined,
      },
    });
    return res.data;
  },
};
