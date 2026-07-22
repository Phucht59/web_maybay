import { useCallback, useEffect, useRef, useState } from "react";
import { bookingService } from "../services/bookingService";

class BookingTicketDataError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BookingTicketDataError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new BookingTicketDataError(code, message);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidDateTime(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isValidDateOnly(value) {
  if (value == null || value === "") return true;
  if (typeof value !== "string") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function readVnd(value, fieldName) {
  if (value == null || value === "" || typeof value === "boolean") {
    fail("BookingTicketDataMismatch", `${fieldName} không hợp lệ.`);
  }

  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < 0) {
    fail("BookingTicketDataMismatch", `${fieldName} phải là số nguyên VND không âm.`);
  }
  return normalized;
}

function validateAirport(airport, label) {
  if (
    !airport
    || !isNonEmptyString(airport.maSanBay)
    || !isNonEmptyString(airport.tenSanBay)
    || !isNonEmptyString(airport.thanhPho)
    || !isNonEmptyString(airport.quocGia)
  ) {
    fail("BookingTicketDataMismatch", `Thông tin ${label} không hợp lệ.`);
  }
}

function validateFlight(flight) {
  if (
    !flight
    || !isPositiveInteger(flight.maChuyenBay)
    || !isNonEmptyString(flight.soHieuChuyenBay)
    || !isNonEmptyString(flight.tenHangBay)
    || !isNonEmptyString(flight.maHangBay)
    || !isNonEmptyString(flight.dongMayBay)
    || !isValidDateTime(flight.gioKhoiHanh)
    || !isValidDateTime(flight.gioHaCanh)
    || !isNonEmptyString(flight.trangThai)
  ) {
    fail("BookingTicketDataMismatch", "Thông tin chuyến bay không hợp lệ.");
  }

  validateAirport(flight.sanBayDi, "sân bay đi");
  validateAirport(flight.sanBayDen, "sân bay đến");
}

function validateContact(contact) {
  if (
    !contact
    || !isNonEmptyString(contact.hoTenLienHe)
    || !isNonEmptyString(contact.emailLienHe)
    || !isNonEmptyString(contact.soDienThoaiLienHe)
  ) {
    fail("BookingTicketDataMismatch", "Thông tin liên hệ của booking không hợp lệ.");
  }
}

function validatePassenger(passenger, index, uniqueness) {
  if (
    !passenger
    || !isPositiveInteger(passenger.maHanhKhach)
    || !isPositiveInteger(passenger.thuTuHanhKhach)
    || !isNonEmptyString(passenger.hoTen)
    || !isNonEmptyString(passenger.loaiHanhKhach)
    || !isNonEmptyString(passenger.loaiGiayTo)
    || !isNonEmptyString(passenger.soGiayTo)
    || !isValidDateOnly(passenger.ngaySinh)
    || !isValidDateOnly(passenger.ngayHetHanGiayTo)
  ) {
    fail("BookingTicketDataMismatch", `Thông tin hành khách ${index + 1} không hợp lệ.`);
  }

  const ticket = passenger.ve;
  if (!ticket || ticket.trangThaiVe !== "Issued") {
    fail("TicketNotIssued", "Mọi vé phải được phát hành trước khi hiển thị.");
  }
  if (
    !isPositiveInteger(ticket.maVe)
    || !isNonEmptyString(ticket.soVeDienTu)
    || !isValidDateTime(ticket.ngayXuatVe)
    || !ticket.ghe
    || !isPositiveInteger(ticket.ghe.maGheChuyenBay)
    || !isNonEmptyString(ticket.ghe.soGhe)
    || !isPositiveInteger(ticket.ghe.maHangGhe)
    || !isNonEmptyString(ticket.ghe.tenHangGhe)
  ) {
    fail("TicketNotIssued", `Vé của hành khách ${index + 1} chưa có đủ dữ liệu phát hành.`);
  }

  const passengerId = passenger.maHanhKhach;
  const ticketId = ticket.maVe;
  const electronicTicket = ticket.soVeDienTu.trim().toUpperCase();
  const flightSeatId = ticket.ghe.maGheChuyenBay;
  const seatNumber = ticket.ghe.soGhe.trim().toUpperCase();
  const uniqueValues = [
    [uniqueness.passengerIds, passengerId],
    [uniqueness.ticketIds, ticketId],
    [uniqueness.electronicTickets, electronicTicket],
    [uniqueness.flightSeatIds, flightSeatId],
    [uniqueness.seatNumbers, seatNumber],
  ];

  if (uniqueValues.some(([values, value]) => values.has(value))) {
    fail("BookingTicketDataMismatch", "Hành khách, vé hoặc ghế trong booking bị trùng.");
  }
  uniqueValues.forEach(([values, value]) => values.add(value));

  const ticketPrice = readVnd(ticket.giaVe, `Giá vé hành khách ${index + 1}`);
  if (!Array.isArray(passenger.dichVus)) {
    fail("BookingTicketDataMismatch", `Dịch vụ hành khách ${index + 1} không hợp lệ.`);
  }

  let calculatedServiceTotal = 0;
  passenger.dichVus.forEach((service, serviceIndex) => {
    if (
      !service
      || !isPositiveInteger(service.maDichVu)
      || !isNonEmptyString(service.tenDichVu)
      || !isNonEmptyString(service.loaiDichVu)
      || !isPositiveInteger(service.soLuong)
      || service.khoiLuongKg != null
        && (!Number.isInteger(service.khoiLuongKg) || service.khoiLuongKg < 0)
    ) {
      fail(
        "BookingTicketDataMismatch",
        `Dịch vụ ${serviceIndex + 1} của hành khách ${index + 1} không hợp lệ.`,
      );
    }

    const unitPrice = readVnd(service.donGia, "Đơn giá dịch vụ");
    const lineTotal = readVnd(service.thanhTien, "Thành tiền dịch vụ");
    if (!Number.isSafeInteger(unitPrice * service.soLuong) || unitPrice * service.soLuong !== lineTotal) {
      fail("BookingTicketDataMismatch", "Đơn giá, số lượng và thành tiền dịch vụ không khớp.");
    }
    calculatedServiceTotal += lineTotal;
  });

  if (!Number.isSafeInteger(calculatedServiceTotal)) {
    fail("BookingTicketDataMismatch", "Tổng dịch vụ hành khách vượt giới hạn an toàn.");
  }

  const passengerServiceTotal = readVnd(
    passenger.tongTienDichVu,
    `Tổng dịch vụ hành khách ${index + 1}`,
  );
  const passengerTotal = readVnd(passenger.thanhTien, `Thành tiền hành khách ${index + 1}`);
  if (
    calculatedServiceTotal !== passengerServiceTotal
    || !Number.isSafeInteger(ticketPrice + passengerServiceTotal)
    || ticketPrice + passengerServiceTotal !== passengerTotal
  ) {
    fail("BookingTicketDataMismatch", `Tổng tiền hành khách ${index + 1} không nhất quán.`);
  }

  return {
    ticketPrice,
    serviceTotal: passengerServiceTotal,
    passengerTotal,
  };
}

function validateCheckout(checkout, expectedBookingId) {
  if (!checkout || typeof checkout !== "object") {
    fail("BookingTicketDataMismatch", "Máy chủ trả về dữ liệu booking không hợp lệ.");
  }
  if (
    !isPositiveInteger(checkout.maPhieuDatCho)
    || checkout.maPhieuDatCho !== expectedBookingId
  ) {
    fail("BookingIdentityMismatch", "Booking không khớp với địa chỉ trang vé đang mở.");
  }
  if (
    !isNonEmptyString(checkout.maDatCho)
    || !isPositiveInteger(checkout.soLuongHanhKhach)
    || !Array.isArray(checkout.hanhKhachs)
    || checkout.hanhKhachs.length === 0
    || checkout.hanhKhachs.length !== checkout.soLuongHanhKhach
    || !isValidDateTime(checkout.ngayDat)
  ) {
    fail("BookingTicketDataMismatch", "Thông tin booking không đầy đủ hoặc không nhất quán.");
  }
  if (checkout.loaiChuyenDi !== "OneWay") {
    fail("UnsupportedTripType", "Trang vé hiện chỉ hỗ trợ booking một chiều.");
  }
  if (checkout.trangThai !== "Confirmed") {
    fail("BookingNotConfirmed", "Vé điện tử chỉ khả dụng sau khi booking được xác nhận.");
  }

  validateFlight(checkout.chuyenBay);
  validateContact(checkout.thongTinLienHe);

  if (!checkout.pricing) {
    fail("BookingTicketDataMismatch", "Chi tiết giá booking không hợp lệ.");
  }
  const bookingSeatTotal = readVnd(checkout.pricing.tongTienGhe, "Tổng tiền ghế");
  const bookingServiceTotal = readVnd(checkout.pricing.tongTienDichVu, "Tổng tiền dịch vụ");
  const bookingTotal = readVnd(checkout.pricing.tongThanhToan, "Tổng thanh toán");
  if (
    !Number.isSafeInteger(bookingSeatTotal + bookingServiceTotal)
    || bookingSeatTotal + bookingServiceTotal !== bookingTotal
  ) {
    fail("BookingTicketDataMismatch", "Chi tiết giá booking không nhất quán.");
  }

  const uniqueness = {
    passengerIds: new Set(),
    ticketIds: new Set(),
    electronicTickets: new Set(),
    flightSeatIds: new Set(),
    seatNumbers: new Set(),
  };
  let calculatedSeatTotal = 0;
  let calculatedServiceTotal = 0;
  let calculatedBookingTotal = 0;

  checkout.hanhKhachs.forEach((passenger, index) => {
    const totals = validatePassenger(passenger, index, uniqueness);
    calculatedSeatTotal += totals.ticketPrice;
    calculatedServiceTotal += totals.serviceTotal;
    calculatedBookingTotal += totals.passengerTotal;
  });

  if (
    !Number.isSafeInteger(calculatedSeatTotal)
    || !Number.isSafeInteger(calculatedServiceTotal)
    || !Number.isSafeInteger(calculatedBookingTotal)
    || calculatedSeatTotal !== bookingSeatTotal
    || calculatedServiceTotal !== bookingServiceTotal
    || calculatedBookingTotal !== bookingTotal
  ) {
    fail("BookingTicketDataMismatch", "Tổng vé, dịch vụ hoặc booking không nhất quán.");
  }

  return checkout;
}

function safeBackendMessage(value) {
  if (typeof value !== "string") return "";
  const message = value.trim();
  if (
    message === ""
    || message.length > 300
    || /https?:\/\/|file:\/\/| at [\w.]+\(/i.test(message)
  ) return "";
  return message;
}

function classifyLoadError(requestError) {
  if (requestError instanceof BookingTicketDataError) {
    return { code: requestError.code, message: requestError.message };
  }

  const status = requestError.response?.status;
  const responseData = requestError.response?.data;
  const backendMessage = safeBackendMessage(responseData?.message);
  const fallbackMessages = {
    400: "Mã booking hoặc yêu cầu không hợp lệ.",
    401: "Phiên đăng nhập đã hết hạn.",
    403: "Bạn không có quyền xem booking này.",
    404: "Không tìm thấy booking.",
    409: "Dữ liệu booking không nhất quán.",
  };

  if (!requestError.response) {
    return {
      code: "BookingTicketNetworkError",
      message: "Không thể kết nối đến máy chủ để tải vé.",
    };
  }

  return {
    code: responseData?.code || `BookingTicketError${status || ""}`,
    message: backendMessage || fallbackMessages[status]
      || (status >= 500 ? "Máy chủ chưa thể tải vé điện tử." : "Không thể tải vé điện tử."),
  };
}

export default function useBookingTicketData({ bookingId }) {
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const generationRef = useRef(0);
  const retryHandlerRef = useRef(() => {});

  useEffect(() => {
    const normalizedBookingId = Number(bookingId);
    const generation = ++generationRef.current;
    let active = true;
    let inFlight = false;
    let hasLoadedData = false;

    const isCurrent = () => active && generationRef.current === generation;

    async function loadTickets() {
      if (!isCurrent() || inFlight) return;

      inFlight = true;
      setError(null);
      setLoading(!hasLoadedData);
      setRefreshing(hasLoadedData);

      try {
        if (!isPositiveInteger(normalizedBookingId)) {
          fail("InvalidBookingId", "Mã booking không hợp lệ.");
        }

        const result = validateCheckout(
          await bookingService.getCheckoutSummary(normalizedBookingId),
          normalizedBookingId,
        );

        if (!isCurrent()) return;

        hasLoadedData = true;
        setCheckout(result);
        setLoading(false);
        setRefreshing(false);
      } catch (requestError) {
        if (!isCurrent()) return;

        setCheckout(null);
        setError(classifyLoadError(requestError));
        setLoading(false);
        setRefreshing(false);
      } finally {
        inFlight = false;
      }
    }

    retryHandlerRef.current = () => {
      if (!isCurrent() || inFlight) return;
      void loadTickets();
    };

    setCheckout(null);
    setError(null);
    setLoading(true);
    setRefreshing(false);
    void loadTickets();

    return () => {
      active = false;
    };
  }, [bookingId]);

  const retry = useCallback(() => retryHandlerRef.current(), []);

  return {
    checkout,
    loading,
    refreshing,
    error,
    retry,
  };
}
