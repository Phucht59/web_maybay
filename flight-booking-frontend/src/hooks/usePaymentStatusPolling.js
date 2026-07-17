import { useCallback, useEffect, useRef, useState } from "react";
import { paymentService } from "../services/paymentService";

const SUPPORTED_PAYMENT_STATUSES = new Set([
  "Pending",
  "Succeeded",
  "Cancelled",
  "Failed",
]);

class PaymentStatusValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PaymentStatusValidationError";
    this.code = code;
  }
}

function isValidDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validatePaymentStatusResponse(response, paymentId, bookingId) {
  if (!response || typeof response !== "object") {
    throw new PaymentStatusValidationError(
      "InvalidPaymentStatusResponse",
      "Máy chủ trả về dữ liệu trạng thái thanh toán không hợp lệ.",
    );
  }

  if (
    !Number.isInteger(response.paymentId)
    || response.paymentId <= 0
    || !Number.isInteger(response.bookingId)
    || response.bookingId <= 0
  ) {
    throw new PaymentStatusValidationError(
      "InvalidPaymentStatusResponse",
      "Mã thanh toán hoặc booking trong phản hồi không hợp lệ.",
    );
  }

  if (response.paymentId !== paymentId || response.bookingId !== bookingId) {
    throw new PaymentStatusValidationError(
      "PaymentStatusMismatch",
      "Dữ liệu thanh toán không khớp với địa chỉ đang mở. Polling đã được dừng.",
    );
  }

  if (!SUPPORTED_PAYMENT_STATUSES.has(response.status)) {
    throw new PaymentStatusValidationError(
      "UnsupportedPaymentStatus",
      "Máy chủ trả về trạng thái thanh toán chưa được hỗ trợ.",
    );
  }

  if (
    typeof response.amount !== "number"
    || !Number.isFinite(response.amount)
    || response.amount < 0
    || typeof response.method !== "string"
    || response.method.trim() === ""
    || typeof response.provider !== "string"
    || response.provider.trim() === ""
    || typeof response.simulationState !== "string"
    || response.simulationState.trim() === ""
    || !isValidDate(response.serverTime)
    || !isValidDate(response.processingDueAt)
    || !isValidDate(response.graceExpiresAt)
  ) {
    throw new PaymentStatusValidationError(
      "InvalidPaymentStatusResponse",
      "Máy chủ trả về dữ liệu trạng thái thanh toán chưa đầy đủ hoặc không hợp lệ.",
    );
  }

  return response;
}

function isAbortError(requestError) {
  return requestError?.name === "AbortError"
    || requestError?.name === "CanceledError"
    || requestError?.code === "ERR_CANCELED";
}

function classifyStatusError(requestError) {
  if (requestError instanceof PaymentStatusValidationError) {
    return { code: requestError.code, message: requestError.message };
  }

  const status = requestError.response?.status;
  const responseData = requestError.response?.data;
  const code = responseData?.code || "";
  const backendMessage = responseData?.message;

  if (!requestError.response) {
    return {
      code: "PaymentStatusNetworkError",
      message: "Không thể kết nối đến máy chủ để kiểm tra trạng thái.",
    };
  }

  if (status === 401) {
    return {
      code: code || "Unauthorized",
      message: backendMessage || "Phiên đăng nhập đã hết hạn.",
    };
  }

  if (status === 404) {
    return {
      code: code || "PaymentNotFound",
      message: backendMessage || "Không tìm thấy thanh toán hoặc bạn không có quyền truy cập.",
    };
  }

  if (status === 409) {
    return {
      code: code || "PaymentFinalizationConflict",
      message: backendMessage || "Dữ liệu thanh toán đang xung đột. Vui lòng kiểm tra lại.",
    };
  }

  if (status >= 500) {
    return {
      code: code || "PaymentFinalizationFailed",
      message: backendMessage || "Máy chủ chưa thể kiểm tra trạng thái thanh toán.",
    };
  }

  return {
    code: code || `PaymentStatusError${status || ""}`,
    message: backendMessage || "Không thể kiểm tra trạng thái thanh toán.",
  };
}

export default function usePaymentStatusPolling({
  paymentId,
  expectedBookingId,
  enabled,
  intervalMs = 1500,
}) {
  const [payment, setPayment] = useState(null);
  const [initialLoading, setInitialLoading] = useState(Boolean(enabled));
  const [refreshing, setRefreshing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);

  const generationRef = useRef(0);
  const refreshHandlerRef = useRef(() => {});
  const stopHandlerRef = useRef(() => {});

  useEffect(() => {
    const normalizedPaymentId = Number(paymentId);
    const normalizedBookingId = Number(expectedBookingId);
    const pollingInterval = Number.isFinite(intervalMs) && intervalMs > 0
      ? intervalMs
      : 1500;
    const generation = ++generationRef.current;

    let active = true;
    let stopped = !enabled;
    let inFlight = false;
    let pendingManualRefresh = false;
    let timerId = null;
    let controller = null;
    let hasReceivedPayment = false;

    const isCurrent = () => active && generationRef.current === generation;

    const clearTimer = () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    function scheduleNext() {
      if (!isCurrent() || stopped || timerId !== null) return;

      setPolling(true);
      timerId = window.setTimeout(() => {
        timerId = null;
        void requestStatus(false);
      }, pollingInterval);
    }

    async function requestStatus(isManual) {
      if (!isCurrent() || stopped) return;

      if (inFlight) {
        if (isManual) pendingManualRefresh = true;
        return;
      }

      clearTimer();
      inFlight = true;
      setError(null);
      setInitialLoading(!hasReceivedPayment);
      setRefreshing(hasReceivedPayment);
      setPolling(true);
      controller = new AbortController();
      let shouldScheduleNext = false;

      try {
        const response = await paymentService.getPaymentStatus(normalizedPaymentId, {
          signal: controller.signal,
        });
        const validatedPayment = validatePaymentStatusResponse(
          response,
          normalizedPaymentId,
          normalizedBookingId,
        );

        if (!isCurrent()) return;

        hasReceivedPayment = true;
        setPayment(validatedPayment);
        setError(null);
        setInitialLoading(false);
        setRefreshing(false);

        if (validatedPayment.status === "Pending") {
          shouldScheduleNext = true;
        } else {
          stopped = true;
          pendingManualRefresh = false;
          setPolling(false);
        }
      } catch (requestError) {
        if (!isCurrent()) return;

        if (isAbortError(requestError)) {
          setRefreshing(false);
          setPolling(false);
        } else {
          stopped = true;
          pendingManualRefresh = false;
          setError(classifyStatusError(requestError));
          setInitialLoading(false);
          setRefreshing(false);
          setPolling(false);
        }
      } finally {
        inFlight = false;
        controller = null;

        if (isCurrent()) {
          if (pendingManualRefresh && !stopped) {
            pendingManualRefresh = false;
            void requestStatus(true);
          } else if (shouldScheduleNext && !stopped) {
            scheduleNext();
          }
        }
      }
    }

    refreshHandlerRef.current = () => {
      if (!isCurrent()) return;

      stopped = false;
      clearTimer();
      if (inFlight) {
        pendingManualRefresh = true;
        return;
      }

      void requestStatus(true);
    };

    stopHandlerRef.current = () => {
      if (!isCurrent()) return;

      stopped = true;
      pendingManualRefresh = false;
      clearTimer();
      controller?.abort();
      setRefreshing(false);
      setPolling(false);
    };

    setPayment(null);
    setError(null);
    setInitialLoading(Boolean(enabled));
    setRefreshing(false);
    setPolling(false);

    if (enabled) {
      void requestStatus(false);
    }

    return () => {
      active = false;
      stopped = true;
      pendingManualRefresh = false;
      clearTimer();
      controller?.abort();
    };
  }, [enabled, expectedBookingId, intervalMs, paymentId]);

  const refreshNow = useCallback(() => refreshHandlerRef.current(), []);
  const stopPolling = useCallback(() => stopHandlerRef.current(), []);

  return {
    payment,
    initialLoading,
    refreshing,
    polling,
    error,
    refreshNow,
    stopPolling,
  };
}
