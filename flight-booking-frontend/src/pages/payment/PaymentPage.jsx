import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import CancelPaymentModal from "../../components/payment/CancelPaymentModal";
import CheckoutInformationCard from "../../components/payment/CheckoutInformationCard";
import CheckoutSummaryCard from "../../components/payment/CheckoutSummaryCard";
import PaymentFlowHeader from "../../components/payment/PaymentFlowHeader";
import PaymentMethodSection from "../../components/payment/PaymentMethodSection";
import usePaymentCountdown from "../../hooks/usePaymentCountdown";
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import "../../styles/pages/payment-page.css";

const PAYMENT_STATES = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  ACCEPTED: "accepted",
  UNCERTAIN_ERROR: "uncertainError",
  REJECTED: "rejected",
};

const PAYMENT_METHODS = new Set(["Card", "OnlineBanking", "EWallet", "QrBanking"]);
const CLEAR_ATTEMPT_CODES = new Set([
  "BookingExpired",
  "BookingNotPayable",
  "BookingNotFound",
  "InvalidPaymentMethod",
  "InvalidIdempotencyKey",
]);

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getCheckoutErrorMessage(requestError) {
  const status = requestError.response?.status;
  const backendMessage = requestError.response?.data?.message;

  if (status === 401) return backendMessage || "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
  if (status === 403) return backendMessage || "Bạn không có quyền xem booking này.";
  if (status === 404) return backendMessage || "Không tìm thấy booking.";
  if (status === 409) return backendMessage || "Dữ liệu booking không nhất quán hoặc đang xung đột.";
  if (status === 400) return backendMessage || "Mã booking hoặc yêu cầu không hợp lệ.";
  if (!requestError.response) return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
  return backendMessage || "Không thể tải thông tin checkout.";
}

function getAttemptStorageKey(bookingId) {
  return `paymentAttempt:${bookingId}`;
}

function readPaymentAttempt(bookingId) {
  if (!Number.isInteger(bookingId) || bookingId <= 0) return null;

  try {
    const rawValue = window.sessionStorage.getItem(getAttemptStorageKey(bookingId));
    if (!rawValue) return null;

    const attempt = JSON.parse(rawValue);
    if (
      typeof attempt?.idempotencyKey !== "string"
      || attempt.idempotencyKey.trim() === ""
      || attempt.idempotencyKey.length > 120
      || !PAYMENT_METHODS.has(attempt.method)
    ) {
      return null;
    }

    return {
      idempotencyKey: attempt.idempotencyKey,
      method: attempt.method,
    };
  } catch {
    return null;
  }
}

function createIdempotencyKey() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues !== "function") {
    throw new Error("Trình duyệt không hỗ trợ tạo mã yêu cầu an toàn.");
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function classifyPaymentError(requestError) {
  const status = requestError.response?.status;
  const responseData = requestError.response?.data;
  const code = responseData?.code || "";
  const backendMessage = responseData?.message;

  if (!requestError.response || status >= 500) {
    return {
      state: PAYMENT_STATES.UNCERTAIN_ERROR,
      code: code || "PaymentStateUnknown",
      message: "Chưa xác định máy chủ đã tiếp nhận hay chưa. Hãy gửi lại đúng yêu cầu này.",
    };
  }

  const fallbackMessages = {
    InvalidPaymentMethod: "Hình thức thanh toán không hợp lệ.",
    InvalidIdempotencyKey: "Mã idempotency không hợp lệ.",
    BookingExpired: "Đã hết thời hạn thanh toán.",
    BookingNotPayable: "Booking không còn ở trạng thái có thể thanh toán.",
    BookingNotFound: "Không tìm thấy booking.",
    PaymentAlreadyPending: "Booking đã có thanh toán đang xử lý.",
    PaymentAlreadySucceeded: "Booking đã được thanh toán.",
    IdempotencyConflict: "Yêu cầu bị xung đột idempotency. Vui lòng tải lại trang để kiểm tra.",
  };

  if (status === 401) {
    return {
      state: PAYMENT_STATES.REJECTED,
      code: code || "SessionExpired",
      message: backendMessage || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    };
  }

  return {
    state: PAYMENT_STATES.REJECTED,
    code: code || `PaymentRejected${status || ""}`,
    message: backendMessage || fallbackMessages[code] || "Máy chủ đã từ chối yêu cầu thanh toán.",
  };
}

function getConfirmButtonLabel(paymentState, amount) {
  if (paymentState === PAYMENT_STATES.SUBMITTING) return "Đang gửi yêu cầu...";
  if (paymentState === PAYMENT_STATES.UNCERTAIN_ERROR) return "Gửi lại yêu cầu";
  if (paymentState === PAYMENT_STATES.ACCEPTED) return "Đã tiếp nhận";
  if (paymentState === PAYMENT_STATES.REJECTED) return "Không thể tiếp tục";
  return `Xác nhận thanh toán ${formatMoney(amount)}`;
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const normalizedBookingId = Number(bookingId);
  const initialAttempt = readPaymentAttempt(normalizedBookingId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(initialAttempt?.method || "Card");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentState, setPaymentState] = useState(PAYMENT_STATES.IDLE);
  const [paymentAttempt, setPaymentAttempt] = useState(initialAttempt);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [paymentFeedback, setPaymentFeedback] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const paymentAttemptRef = useRef(initialAttempt);
  const submitGuardRef = useRef(false);

  const isPaymentPending = checkout?.trangThai === "PaymentPending";
  const countdown = usePaymentCountdown({
    deadline: checkout?.giuDenLuc,
    serverTime: checkout?.serverTime,
    enabled: isPaymentPending && paymentState === PAYMENT_STATES.IDLE,
  });
  const basePaymentControlsDisabled = !isPaymentPending || !countdown.isValid || countdown.isExpired;
  const methodControlsDisabled = basePaymentControlsDisabled
    || paymentState !== PAYMENT_STATES.IDLE
    || Boolean(paymentAttempt);
  const termsDisabled = basePaymentControlsDisabled || paymentState !== PAYMENT_STATES.IDLE;
  const canStartPayment = paymentState === PAYMENT_STATES.IDLE
    && !basePaymentControlsDisabled
    && PAYMENT_METHODS.has(paymentMethod)
    && termsAccepted;
  const canRetryPayment = paymentState === PAYMENT_STATES.UNCERTAIN_ERROR
    && Boolean(paymentAttemptRef.current);
  const confirmDisabled = !canStartPayment && !canRetryPayment;

  useEffect(() => {
    const restoredAttempt = readPaymentAttempt(normalizedBookingId);
    paymentAttemptRef.current = restoredAttempt;
    submitGuardRef.current = false;
    setPaymentAttempt(restoredAttempt);
    setPaymentMethod(restoredAttempt?.method || "Card");
    setTermsAccepted(false);
    setPaymentState(PAYMENT_STATES.IDLE);
    setPaymentResponse(null);
    setPaymentFeedback(null);
    setCancelModalOpen(false);
  }, [normalizedBookingId]);

  useEffect(() => {
    let isActive = true;

    if (!Number.isInteger(normalizedBookingId) || normalizedBookingId <= 0) {
      setLoading(false);
      setCheckout(null);
      setError("Mã booking không hợp lệ.");
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    setError("");
    setCheckout(null);

    bookingService.getCheckoutSummary(normalizedBookingId)
      .then((summary) => {
        if (isActive) setCheckout(summary);
      })
      .catch((requestError) => {
        if (isActive) setError(getCheckoutErrorMessage(requestError));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [normalizedBookingId, loadAttempt]);

  const canRetryCheckout = Number.isInteger(normalizedBookingId) && normalizedBookingId > 0;
  const retryCheckout = () => {
    if (canRetryCheckout) setLoadAttempt((attempt) => attempt + 1);
  };

  const closeCancelModal = useCallback(() => setCancelModalOpen(false), []);

  const clearStoredAttempt = () => {
    window.sessionStorage.removeItem(getAttemptStorageKey(normalizedBookingId));
    paymentAttemptRef.current = null;
    setPaymentAttempt(null);
  };

  const submitPayment = async () => {
    if (submitGuardRef.current) return;
    if (!canStartPayment && !canRetryPayment) return;

    submitGuardRef.current = true;
    let activeAttempt = paymentAttemptRef.current;

    try {
      if (!activeAttempt) {
        activeAttempt = {
          idempotencyKey: createIdempotencyKey(),
          method: paymentMethod,
        };
        window.sessionStorage.setItem(
          getAttemptStorageKey(normalizedBookingId),
          JSON.stringify(activeAttempt),
        );
        paymentAttemptRef.current = activeAttempt;
        setPaymentAttempt(activeAttempt);
      }

      setPaymentMethod(activeAttempt.method);
      setPaymentState(PAYMENT_STATES.SUBMITTING);
      setPaymentFeedback(null);
      setCancelModalOpen(false);

      const response = await paymentService.createPayment({
        bookingId: normalizedBookingId,
        method: activeAttempt.method,
        idempotencyKey: activeAttempt.idempotencyKey,
      });

      setPaymentResponse(response);
      setPaymentState(PAYMENT_STATES.ACCEPTED);
    } catch (requestError) {
      const result = classifyPaymentError(requestError);

      if (CLEAR_ATTEMPT_CODES.has(result.code)) clearStoredAttempt();
      setPaymentResponse(null);
      setPaymentFeedback({ code: result.code, message: result.message });
      setPaymentState(result.state);
      submitGuardRef.current = false;
    }
  };

  if (loading) {
    return (
      <main className="payment-page">
        <div className="payment-page__shell">
          <PaymentFlowHeader />
          <section className="payment-page__state" aria-live="polite" aria-busy="true">
            <span className="payment-page__state-icon material-symbols-outlined" aria-hidden="true">progress_activity</span>
            <h2>Đang tải thông tin đặt chỗ</h2>
            <p>Vui lòng chờ trong khi hệ thống tải tóm tắt checkout.</p>
            <div className="payment-page__skeleton" aria-hidden="true"><span /><span /><span /></div>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="payment-page">
        <div className="payment-page__shell">
          <PaymentFlowHeader />
          <section className="payment-page__state is-error" role="alert">
            <span className="payment-page__state-icon material-symbols-outlined" aria-hidden="true">error</span>
            <h2>Không thể tải thông tin thanh toán</h2>
            <p>{error}</p>
            {canRetryCheckout ? <button type="button" onClick={retryCheckout}>Thử tải lại</button> : null}
          </section>
        </div>
      </main>
    );
  }

  if (!checkout) {
    return (
      <main className="payment-page">
        <div className="payment-page__shell">
          <PaymentFlowHeader />
          <section className="payment-page__state is-error" role="alert">
            <span className="payment-page__state-icon material-symbols-outlined" aria-hidden="true">warning</span>
            <h2>Không có dữ liệu checkout</h2>
            <p>Hệ thống chưa trả về thông tin đặt chỗ cần thiết.</p>
            {canRetryCheckout ? <button type="button" onClick={retryCheckout}>Thử tải lại</button> : null}
          </section>
        </div>
      </main>
    );
  }

  const amount = checkout.pricing?.tongThanhToan;
  const buttonLabel = getConfirmButtonLabel(paymentState, amount);
  const actionLocked = paymentState !== PAYMENT_STATES.IDLE;

  return (
    <main className="payment-page">
      <div className="payment-page__shell">
        <PaymentFlowHeader />

        <div className="payment-page__layout">
          <div className="payment-page__primary">
            <CheckoutInformationCard
              contact={checkout.thongTinLienHe}
              passengers={checkout.hanhKhachs}
            />
            <PaymentMethodSection
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={methodControlsDisabled}
            />

            <section className="payment-card payment-confirmation" aria-labelledby="payment-confirmation-title">
              <h2 id="payment-confirmation-title">Xác nhận thông tin</h2>
              <label
                className={`payment-confirmation__terms${termsDisabled ? " is-disabled" : ""}`}
                htmlFor="payment-terms"
              >
                <input
                  id="payment-terms"
                  type="checkbox"
                  checked={termsAccepted}
                  disabled={termsDisabled}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>Tôi xác nhận thông tin đặt vé là chính xác và đồng ý với điều kiện giá vé, chính sách hoàn/hủy vé.</span>
              </label>
            </section>
          </div>

          <aside className="payment-page__aside" aria-label="Tóm tắt thanh toán">
            <CheckoutSummaryCard
              checkout={checkout}
              countdown={countdown}
              paymentState={paymentState}
              paymentErrorCode={paymentFeedback?.code}
            />
            <section className="payment-card payment-page__action" aria-live="polite">
              {paymentState === PAYMENT_STATES.ACCEPTED && paymentResponse ? (
                <div className="payment-request-status is-accepted">
                  <span className="material-symbols-outlined" aria-hidden="true">hourglass_top</span>
                  <h2>Yêu cầu thanh toán đã được tiếp nhận.</h2>
                  <p>Thanh toán đang ở trạng thái Pending và chưa phải kết quả cuối cùng.</p>
                  <dl>
                    <div><dt>Payment ID</dt><dd>{paymentResponse.paymentId}</dd></div>
                    <div><dt>Phương thức</dt><dd>{paymentResponse.method}</dd></div>
                    <div><dt>Provider</dt><dd>{paymentResponse.provider}</dd></div>
                    <div><dt>Số tiền</dt><dd>{formatMoney(paymentResponse.amount)}</dd></div>
                  </dl>
                </div>
              ) : null}

              {paymentState === PAYMENT_STATES.UNCERTAIN_ERROR && paymentFeedback ? (
                <div className="payment-request-status is-uncertain" role="alert">
                  <span className="material-symbols-outlined" aria-hidden="true">help</span>
                  <h2>Chưa xác định máy chủ đã tiếp nhận hay chưa.</h2>
                  <p>{paymentFeedback.message}</p>
                </div>
              ) : null}

              {paymentState === PAYMENT_STATES.REJECTED && paymentFeedback ? (
                <div className="payment-request-status is-rejected" role="alert">
                  <span className="material-symbols-outlined" aria-hidden="true">block</span>
                  <h2>{paymentFeedback.message}</h2>
                  <p>Mã phản hồi: <code>{paymentFeedback.code}</code></p>
                </div>
              ) : null}

              <div className="payment-page__action-buttons">
                <button
                  type="button"
                  className="payment-page__confirm-button"
                  disabled={confirmDisabled}
                  onClick={submitPayment}
                >
                  {buttonLabel}
                </button>
                <button
                  type="button"
                  className="payment-page__cancel-button"
                  disabled={actionLocked}
                  onClick={() => setCancelModalOpen(true)}
                >
                  Hủy thanh toán
                </button>
              </div>

              <p className="payment-page__action-note">
                {paymentState === PAYMENT_STATES.SUBMITTING
                  ? "Đang gửi yêu cầu. Phương thức, điều khoản và các thao tác khác đã được khóa."
                  : paymentState === PAYMENT_STATES.ACCEPTED
                    ? "Không có polling trong bước này. Trạng thái cuối sẽ được xử lý ở task sau."
                    : paymentState === PAYMENT_STATES.UNCERTAIN_ERROR
                      ? "Nút gửi lại dùng nguyên bookingId, method và idempotencyKey của lần đầu."
                      : paymentAttempt
                        ? "Đã khôi phục một lần gửi trước. Phương thức được khóa và sẽ dùng lại cùng idempotencyKey."
                        : basePaymentControlsDisabled
                          ? "Chỉ có thể gửi khi booking còn thời hạn và đang chờ thanh toán."
                          : "Máy chủ quyết định số tiền và trạng thái. Không có dữ liệu mô phỏng nào được gửi."}
              </p>
            </section>
          </aside>
        </div>
      </div>

      <CancelPaymentModal open={cancelModalOpen} onClose={closeCancelModal} />
    </main>
  );
}
