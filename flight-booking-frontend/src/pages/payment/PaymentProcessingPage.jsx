import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CancelPaymentModal from "../../components/payment/CancelPaymentModal";
import PaymentFlowHeader from "../../components/payment/PaymentFlowHeader";
import usePaymentStatusPolling from "../../hooks/usePaymentStatusPolling";
import { bookingService } from "../../services/bookingService";
import "../../styles/pages/payment-page.css";
import "../../styles/pages/payment-processing-page.css";

const TERMINAL_STATUSES = new Set(["Succeeded", "Cancelled", "Failed"]);

function getAttemptStorageKey(bookingId) {
  return `paymentAttempt:${bookingId}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getExpectedProcessingText(payment) {
  const dueAt = Date.parse(payment?.processingDueAt || "");
  const serverTime = Date.parse(payment?.serverTime || "");
  if (!Number.isFinite(dueAt) || !Number.isFinite(serverTime)) return "Không xác định";

  const remainingSeconds = Math.ceil((dueAt - serverTime) / 1000);
  return remainingSeconds > 0 ? `Khoảng ${remainingSeconds} giây` : "Đang hoàn tất";
}

function getPendingMessage(simulationState) {
  if (simulationState === "Processing") {
    return "Hệ thống đang xử lý thanh toán mô phỏng.";
  }
  if (simulationState === "ReadyToFinalize") {
    return "Hệ thống đang hoàn tất giao dịch.";
  }
  return "Thanh toán vẫn đang chờ quyết định từ máy chủ.";
}

function getFailureMessage(failureReason) {
  if (failureReason === "PaymentTimeout") {
    return "Thanh toán đã vượt quá thời gian xử lý.";
  }
  if (failureReason === "UserCancelled") {
    return "Thanh toán đã được người dùng hủy.";
  }
  return "Thanh toán thất bại.";
}

function getFriendlyFailureReason(failureReason) {
  if (!failureReason) return "Máy chủ không cung cấp lý do chi tiết.";
  if (failureReason === "PaymentTimeout") return "Vượt quá thời gian xử lý thanh toán.";
  if (failureReason === "UserCancelled") return "Người dùng chủ động hủy booking.";
  return `Lý do từ máy chủ: ${failureReason}`;
}

function classifyCancellationError(requestError) {
  const status = requestError.response?.status;
  const responseData = requestError.response?.data;
  const code = responseData?.code || "";
  const backendMessage = responseData?.message;

  if (!requestError.response) {
    return {
      code: "BookingCancellationNetworkError",
      message: "Không thể xác nhận máy chủ đã hủy booking. Vui lòng kiểm tra kết nối và thử lại.",
    };
  }

  const fallbackMessages = {
    BookingAlreadyExpired: "Booking đã hết hạn và không thể chuyển sang trạng thái hủy.",
    BookingAlreadyConfirmed: "Booking đã được xác nhận và không thể hủy trong luồng thanh toán này.",
    PaymentAlreadySucceeded: "Thanh toán đã thành công nên booking không thể hủy tại đây.",
    BookingCancellationConflict: "Dữ liệu booking đang xung đột và chưa thể hủy an toàn.",
  };

  if (status === 401) {
    return {
      code: code || "Unauthorized",
      message: backendMessage || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    };
  }
  if (status === 404) {
    return {
      code: code || "BookingNotFound",
      message: backendMessage || "Không tìm thấy booking hoặc bạn không có quyền hủy booking này.",
    };
  }
  if (status === 409) {
    return {
      code: code || "BookingCancellationConflict",
      message: backendMessage || fallbackMessages[code]
        || "Dữ liệu booking đang xung đột và chưa thể hủy an toàn.",
    };
  }
  if (status >= 500) {
    return {
      code: code || "BookingCancellationFailed",
      message: backendMessage || "Máy chủ chưa thể hủy booking. Vui lòng thử lại.",
    };
  }

  return {
    code: code || `BookingCancellationError${status || ""}`,
    message: backendMessage || "Không thể hủy booking. Vui lòng thử lại.",
  };
}

function PaymentDetails({ payment }) {
  return (
    <dl className="payment-processing__details">
      <div><dt>Payment ID</dt><dd>{payment.paymentId}</dd></div>
      <div><dt>Booking ID</dt><dd>{payment.bookingId}</dd></div>
      <div className="is-total"><dt>Số tiền</dt><dd>{formatMoney(payment.amount)}</dd></div>
      <div><dt>Phương thức</dt><dd>{payment.method}</dd></div>
      <div><dt>Nhà cung cấp</dt><dd>{payment.provider}</dd></div>
      <div><dt>Trạng thái backend</dt><dd>{payment.status}</dd></div>
    </dl>
  );
}

export default function PaymentProcessingPage() {
  const { bookingId, paymentId } = useParams();
  const navigate = useNavigate();
  const normalizedBookingId = Number(bookingId);
  const normalizedPaymentId = Number(paymentId);
  const routeIsValid = Number.isInteger(normalizedBookingId)
    && normalizedBookingId > 0
    && Number.isInteger(normalizedPaymentId)
    && normalizedPaymentId > 0;

  const {
    payment,
    initialLoading,
    refreshing,
    polling,
    error,
    refreshNow,
    stopPolling,
  } = usePaymentStatusPolling({
    paymentId: normalizedPaymentId,
    expectedBookingId: normalizedBookingId,
    enabled: routeIsValid,
    intervalMs: 1500,
  });

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancellationNotice, setCancellationNotice] = useState("");
  const [cancelledResponse, setCancelledResponse] = useState(null);
  const cancelGuardRef = useRef(false);
  const resultNavigationRef = useRef(false);

  const paymentMatchesRoute = payment?.paymentId === normalizedPaymentId
    && payment?.bookingId === normalizedBookingId;
  const currentPayment = paymentMatchesRoute ? payment : null;
  const displayPayment = cancelledResponse && currentPayment
    ? {
      ...currentPayment,
      status: "Cancelled",
      failureReason: cancelledResponse.reason || "UserCancelled",
    }
    : currentPayment;
  const isTerminal = TERMINAL_STATUSES.has(displayPayment?.status);
  const isPending = displayPayment?.status === "Pending";

  useEffect(() => {
    cancelGuardRef.current = false;
    resultNavigationRef.current = false;
    setCancelModalOpen(false);
    setCancelSubmitting(false);
    setCancelError("");
    setCancellationNotice("");
    setCancelledResponse(null);
  }, [normalizedBookingId, normalizedPaymentId]);

  useEffect(() => {
    if (
      payment?.paymentId !== normalizedPaymentId
      || payment?.bookingId !== normalizedBookingId
      || !TERMINAL_STATUSES.has(payment.status)
      || resultNavigationRef.current
    ) return;

    resultNavigationRef.current = true;
    stopPolling();
    window.sessionStorage.removeItem(getAttemptStorageKey(normalizedBookingId));
    cancelGuardRef.current = true;
    setCancelModalOpen(false);
    setCancelSubmitting(false);
    setCancelError("");
    navigate(
      `/payment/${normalizedBookingId}/result/${normalizedPaymentId}`,
      { replace: true },
    );
  }, [navigate, normalizedBookingId, normalizedPaymentId, payment, stopPolling]);

  const closeCancelModal = useCallback(() => {
    if (cancelGuardRef.current || cancelSubmitting) return;
    setCancelModalOpen(false);
  }, [cancelSubmitting]);

  const openCancelModal = () => {
    if (!isPending || error || cancelSubmitting) return;
    setCancelError("");
    setCancelModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (cancelGuardRef.current || !isPending || error) return;

    cancelGuardRef.current = true;
    setCancelSubmitting(true);
    setCancelError("");
    setCancellationNotice("");
    stopPolling();

    try {
      const response = await bookingService.cancelBooking(normalizedBookingId);

      if (
        Number(response?.bookingId) !== normalizedBookingId
        || response?.bookingStatus !== "Cancelled"
      ) {
        cancelGuardRef.current = false;
        setCancelSubmitting(false);
        setCancelError("Phản hồi hủy booking từ máy chủ không hợp lệ. Vui lòng kiểm tra lại.");
        refreshNow();
        return;
      }

      window.sessionStorage.removeItem(getAttemptStorageKey(normalizedBookingId));
      setCancelledResponse(response);
      setCancellationNotice("Đã hủy booking và giải phóng ghế theo kết quả từ máy chủ.");
      setCancelSubmitting(false);
      setCancelModalOpen(false);
      resultNavigationRef.current = true;
      navigate(
        `/payment/${normalizedBookingId}/result/${normalizedPaymentId}`,
        { replace: true },
      );
    } catch (requestError) {
      const cancellationError = classifyCancellationError(requestError);
      const finalizationWon = requestError.response?.status === 409
        && ["PaymentAlreadySucceeded", "BookingAlreadyConfirmed"].includes(cancellationError.code);

      cancelGuardRef.current = false;
      setCancelSubmitting(false);

      if (finalizationWon) {
        setCancelModalOpen(false);
        setCancelError("");
        setCancellationNotice("Booking đã thay đổi trong lúc hủy. Đang đọc lại trạng thái từ máy chủ.");
      } else {
        setCancelError(cancellationError.message);
      }

      refreshNow();
    }
  };

  let content;

  if (!routeIsValid) {
    content = (
      <section className="payment-processing__card is-state is-error" role="alert">
        <span className="payment-processing__status-icon material-symbols-outlined" aria-hidden="true">link_off</span>
        <h2>Địa chỉ xử lý thanh toán không hợp lệ</h2>
        <p>Booking ID và Payment ID phải là số nguyên dương.</p>
      </section>
    );
  } else if (initialLoading) {
    content = (
      <section className="payment-processing__card is-state" aria-live="polite" aria-busy="true">
        <span className="payment-processing__spinner material-symbols-outlined" aria-hidden="true">progress_activity</span>
        <h2>Đang kiểm tra trạng thái thanh toán</h2>
        <p>Hệ thống đang đọc trạng thái mới nhất từ máy chủ.</p>
      </section>
    );
  } else if (error) {
    content = (
      <section className="payment-processing__card is-state is-error" role="alert">
        <span className="payment-processing__status-icon material-symbols-outlined" aria-hidden="true">error</span>
        <h2>Không thể kiểm tra trạng thái thanh toán</h2>
        <p>{error.message}</p>
        <small>Mã phản hồi: {error.code}</small>
        <button type="button" onClick={refreshNow} disabled={refreshing}>
          {refreshing ? "Đang kiểm tra..." : "Thử kiểm tra lại"}
        </button>
      </section>
    );
  } else if (isPending) {
    content = (
      <section className="payment-processing__card is-processing" aria-live="polite" aria-busy={refreshing}>
        <header className="payment-processing__hero">
          <span className="payment-processing__spinner material-symbols-outlined" aria-hidden="true">progress_activity</span>
          <p className="payment-processing__eyebrow">THANH TOÁN MÔ PHỎNG</p>
          <h2>Thanh toán đang được xử lý</h2>
          <p>{getPendingMessage(displayPayment.simulationState)}</p>
        </header>

        <div className="payment-processing__content">
          {cancellationNotice ? <p className="payment-processing__notice">{cancellationNotice}</p> : null}

          <section className="payment-processing__panel" aria-labelledby="payment-processing-details-title">
            <h3 id="payment-processing-details-title">Thông tin giao dịch</h3>
            <PaymentDetails payment={displayPayment} />
          </section>

          <div className="payment-processing__timing">
            <span>Thời gian xử lý dự kiến</span>
            <strong>{getExpectedProcessingText(displayPayment)}</strong>
            <small>
              Chu kỳ kiểm tra: 1,5 giây · {polling ? "Đang theo dõi" : "Tạm dừng"}
            </small>
          </div>

          <div className="payment-processing__actions">
            <button
              type="button"
              onClick={refreshNow}
              disabled={refreshing || cancelSubmitting}
            >
              {refreshing ? "Đang kiểm tra..." : "Kiểm tra ngay"}
            </button>
            <button
              type="button"
              className="is-danger"
              onClick={openCancelModal}
              disabled={cancelSubmitting}
            >
              {cancelSubmitting ? "Đang hủy..." : "Hủy thanh toán"}
            </button>
          </div>
        </div>
      </section>
    );
  } else if (isTerminal) {
    const succeeded = displayPayment.status === "Succeeded";
    const cancelled = displayPayment.status === "Cancelled";
    const title = succeeded
      ? "Thanh toán thành công"
      : cancelled
        ? "Đã hủy thanh toán"
        : getFailureMessage(displayPayment.failureReason);
    const icon = succeeded ? "task_alt" : cancelled ? "event_busy" : "error";

    content = (
      <section
        className={`payment-processing__card is-state is-terminal is-${displayPayment.status.toLowerCase()}`}
        aria-live="polite"
      >
        <span className="payment-processing__status-icon material-symbols-outlined" aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
        {succeeded ? <p>Máy chủ đã xác nhận và hoàn tất giao dịch.</p> : null}
        {cancelled ? <p>Booking đã được hủy và ghế đã được giải phóng theo kết quả backend.</p> : null}
        {displayPayment.status === "Failed" ? (
          <p>{getFriendlyFailureReason(displayPayment.failureReason)}</p>
        ) : null}
        {cancellationNotice ? <p className="payment-processing__notice">{cancellationNotice}</p> : null}

        <PaymentDetails payment={displayPayment} />
        {succeeded && displayPayment.paidAt ? (
          <p className="payment-processing__completed-at">
            Hoàn tất lúc: <strong>{formatDateTime(displayPayment.paidAt)}</strong>
          </p>
        ) : null}
      </section>
    );
  } else {
    content = (
      <section className="payment-processing__card is-state is-error" role="alert">
        <span className="payment-processing__status-icon material-symbols-outlined" aria-hidden="true">warning</span>
        <h2>Chưa có dữ liệu trạng thái hợp lệ</h2>
        <p>Vui lòng thử kiểm tra lại từ máy chủ.</p>
        <button type="button" onClick={refreshNow}>Thử kiểm tra lại</button>
      </section>
    );
  }

  return (
    <main className="payment-page payment-processing-page">
      <div className="payment-page__shell">
        <PaymentFlowHeader />
        <div className="payment-processing__layout">{content}</div>
      </div>

      <CancelPaymentModal
        open={cancelModalOpen && isPending && !error}
        onClose={closeCancelModal}
        onConfirm={confirmCancellation}
        submitting={cancelSubmitting}
        error={cancelError}
      />
    </main>
  );
}
