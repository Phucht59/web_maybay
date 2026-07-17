import { useCallback, useEffect, useRef, useState } from "react";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";

const PAYMENT_STATUSES = new Set(["Pending", "Succeeded", "Cancelled", "Failed"]);
const BOOKING_STATUSES = new Set(["PaymentPending", "Confirmed", "Cancelled", "Expired"]);

class PaymentResultDataError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PaymentResultDataError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new PaymentResultDataError(code, message);
}

function isValidDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validatePayment(payment, expectedPaymentId, expectedBookingId) {
  if (!payment || typeof payment !== "object") {
    fail("InvalidPaymentResult", "Máy chủ trả về dữ liệu thanh toán không hợp lệ.");
  }

  if (
    !isPositiveInteger(payment.paymentId)
    || !isPositiveInteger(payment.bookingId)
    || payment.paymentId !== expectedPaymentId
    || payment.bookingId !== expectedBookingId
  ) {
    fail("PaymentResultIdentityMismatch", "Thanh toán không khớp với địa chỉ kết quả đang mở.");
  }

  if (!PAYMENT_STATUSES.has(payment.status)) {
    fail("UnsupportedPaymentResult", "Trạng thái thanh toán chưa được trang kết quả hỗ trợ.");
  }

  if (
    typeof payment.amount !== "number"
    || !Number.isFinite(payment.amount)
    || payment.amount < 0
    || typeof payment.method !== "string"
    || payment.method.trim() === ""
    || typeof payment.provider !== "string"
    || payment.provider.trim() === ""
    || !isValidDate(payment.serverTime)
  ) {
    fail("InvalidPaymentResult", "Thông tin thanh toán từ máy chủ chưa đầy đủ hoặc không hợp lệ.");
  }

  return payment;
}

function validateCheckout(checkout, expectedBookingId) {
  if (!checkout || typeof checkout !== "object") {
    fail("InvalidCheckoutResult", "Máy chủ trả về dữ liệu booking không hợp lệ.");
  }

  if (
    !isPositiveInteger(checkout.maPhieuDatCho)
    || checkout.maPhieuDatCho !== expectedBookingId
  ) {
    fail("CheckoutResultIdentityMismatch", "Booking không khớp với địa chỉ kết quả đang mở.");
  }

  if (
    typeof checkout.maDatCho !== "string"
    || checkout.maDatCho.trim() === ""
    || !BOOKING_STATUSES.has(checkout.trangThai)
    || !checkout.pricing
    || typeof checkout.pricing.tongThanhToan !== "number"
    || !Number.isFinite(checkout.pricing.tongThanhToan)
    || checkout.pricing.tongThanhToan < 0
    || !checkout.chuyenBay
    || !Array.isArray(checkout.hanhKhachs)
    || !isValidDate(checkout.serverTime)
  ) {
    fail("InvalidCheckoutResult", "Thông tin booking từ máy chủ chưa đầy đủ hoặc không hợp lệ.");
  }

  return checkout;
}

function hasTicketState(checkout, expectedState) {
  return checkout.hanhKhachs.length > 0
    && checkout.hanhKhachs.every((passenger) => passenger?.ve?.trangThaiVe === expectedState);
}

function validateAggregate(payment, checkout) {
  if (
    payment.bookingId !== checkout.maPhieuDatCho
    || payment.amount !== checkout.pricing.tongThanhToan
  ) {
    fail("PaymentAggregateMismatch", "Số tiền hoặc booking của kết quả thanh toán không nhất quán.");
  }

  if (payment.status === "Succeeded") {
    const issuedTicketsAreValid = checkout.hanhKhachs.length > 0
      && checkout.hanhKhachs.every((passenger) => (
        passenger?.ve?.trangThaiVe === "Issued"
        && typeof passenger.ve.soVeDienTu === "string"
        && passenger.ve.soVeDienTu.trim() !== ""
        && isValidDate(passenger.ve.ngayXuatVe)
      ));

    if (
      checkout.trangThai !== "Confirmed"
      || !isValidDate(payment.paidAt)
      || payment.failureReason !== null
      || !issuedTicketsAreValid
    ) {
      fail(
        "SucceededAggregateMismatch",
        "Thanh toán đã thành công nhưng booking hoặc vé chưa được xác nhận đồng bộ.",
      );
    }
    return;
  }

  if (payment.status === "Cancelled") {
    if (checkout.trangThai !== "Cancelled" || !hasTicketState(checkout, "Canceled")) {
      fail(
        "CancelledAggregateMismatch",
        "Thanh toán đã hủy nhưng booking hoặc vé chưa ở trạng thái hủy đồng bộ.",
      );
    }
    return;
  }

  if (payment.status === "Failed" && payment.failureReason === "PaymentTimeout") {
    if (checkout.trangThai !== "Expired" || !hasTicketState(checkout, "Canceled")) {
      fail(
        "TimeoutAggregateMismatch",
        "Thanh toán đã timeout nhưng booking hoặc vé chưa hết hạn đồng bộ.",
      );
    }
    return;
  }

  if (payment.status !== "Failed") {
    fail("UnsupportedTerminalResult", "Kết quả thanh toán chưa phải trạng thái cuối hợp lệ.");
  }
}

function validateBookingCancelledAggregate(checkout) {
  if (checkout.trangThai !== "Cancelled" || !hasTicketState(checkout, "Canceled")) {
    fail(
      "BookingCancelledAggregateMismatch",
      "Booking hoặc vé chưa được máy chủ xác nhận hủy đồng bộ.",
    );
  }
}

function isAbortError(requestError) {
  return requestError?.name === "AbortError"
    || requestError?.name === "CanceledError"
    || requestError?.code === "ERR_CANCELED";
}

function classifyLoadError(requestError) {
  if (requestError instanceof PaymentResultDataError) {
    return { code: requestError.code, message: requestError.message };
  }

  const status = requestError.response?.status;
  const responseData = requestError.response?.data;
  const backendMessage = responseData?.message;
  const backendCode = responseData?.code;

  if (!requestError.response) {
    return {
      code: "PaymentResultNetworkError",
      message: "Không thể kết nối đến máy chủ để tải kết quả thanh toán.",
    };
  }
  if (status === 401) {
    return {
      code: backendCode || "Unauthorized",
      message: backendMessage || "Phiên đăng nhập đã hết hạn.",
    };
  }
  if (status === 403) {
    return {
      code: backendCode || "BookingForbidden",
      message: backendMessage || "Bạn không có quyền xem booking này.",
    };
  }
  if (status === 404) {
    return {
      code: backendCode || "PaymentResultNotFound",
      message: backendMessage || "Không tìm thấy thanh toán hoặc booking.",
    };
  }
  if (status === 409) {
    return {
      code: backendCode || "PaymentResultConflict",
      message: backendMessage || "Dữ liệu kết quả đang xung đột. Vui lòng thử tải lại.",
    };
  }
  if (status >= 500) {
    return {
      code: backendCode || "PaymentResultServerError",
      message: backendMessage || "Máy chủ chưa thể tải kết quả thanh toán.",
    };
  }

  return {
    code: backendCode || `PaymentResultError${status || ""}`,
    message: backendMessage || "Không thể tải kết quả thanh toán.",
  };
}

export default function usePaymentResultData({ mode, bookingId, paymentId }) {
  const [payment, setPayment] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const generationRef = useRef(0);
  const retryHandlerRef = useRef(() => {});

  useEffect(() => {
    const normalizedBookingId = Number(bookingId);
    const normalizedPaymentId = Number(paymentId);
    const generation = ++generationRef.current;

    let active = true;
    let inFlight = false;
    let controller = null;
    let hasLoadedData = false;

    const isCurrent = () => active && generationRef.current === generation;

    async function loadResult() {
      if (!isCurrent() || inFlight) return;

      inFlight = true;
      setError(null);
      setPending(false);
      setLoading(!hasLoadedData);
      setRefreshing(hasLoadedData);

      try {
        if (!isPositiveInteger(normalizedBookingId)) {
          fail("InvalidResultRoute", "Booking ID trên địa chỉ kết quả không hợp lệ.");
        }
        if (mode !== "payment" && mode !== "booking-cancelled") {
          fail("InvalidResultMode", "Loại trang kết quả không hợp lệ.");
        }

        if (mode === "booking-cancelled") {
          const bookingResult = validateCheckout(
            await bookingService.getCheckoutSummary(normalizedBookingId),
            normalizedBookingId,
          );
          validateBookingCancelledAggregate(bookingResult);

          if (!isCurrent()) return;

          window.sessionStorage.removeItem(`paymentAttempt:${normalizedBookingId}`);
          hasLoadedData = true;
          setPayment(null);
          setCheckout(bookingResult);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        if (!isPositiveInteger(normalizedPaymentId)) {
          fail("InvalidResultRoute", "Payment ID trên địa chỉ kết quả không hợp lệ.");
        }

        controller = new AbortController();
        const paymentResult = validatePayment(
          await paymentService.getPaymentStatus(normalizedPaymentId, {
            signal: controller.signal,
          }),
          normalizedPaymentId,
          normalizedBookingId,
        );
        controller = null;

        if (!isCurrent()) return;

        if (paymentResult.status === "Pending") {
          setPayment(paymentResult);
          setCheckout(null);
          setPending(true);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const bookingResult = validateCheckout(
          await bookingService.getCheckoutSummary(normalizedBookingId),
          normalizedBookingId,
        );
        validateAggregate(paymentResult, bookingResult);

        if (!isCurrent()) return;

        window.sessionStorage.removeItem(`paymentAttempt:${normalizedBookingId}`);
        hasLoadedData = true;
        setPayment(paymentResult);
        setCheckout(bookingResult);
        setPending(false);
        setLoading(false);
        setRefreshing(false);
      } catch (requestError) {
        if (!isCurrent() || isAbortError(requestError)) return;

        setPayment(null);
        setCheckout(null);
        setPending(false);
        setError(classifyLoadError(requestError));
        setLoading(false);
        setRefreshing(false);
      } finally {
        inFlight = false;
        controller = null;
      }
    }

    retryHandlerRef.current = () => {
      if (!isCurrent() || inFlight) return;
      void loadResult();
    };

    setPayment(null);
    setCheckout(null);
    setError(null);
    setPending(false);
    setLoading(true);
    setRefreshing(false);
    void loadResult();

    return () => {
      active = false;
      controller?.abort();
    };
  }, [bookingId, mode, paymentId]);

  const retry = useCallback(() => retryHandlerRef.current(), []);

  return {
    payment,
    checkout,
    loading,
    refreshing,
    error,
    pending,
    retry,
  };
}
