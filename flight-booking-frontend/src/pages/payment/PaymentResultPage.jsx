import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PaymentFlowHeader from "../../components/payment/PaymentFlowHeader";
import usePaymentResultData from "../../hooks/usePaymentResultData";
import "../../styles/pages/payment-page.css";
import "../../styles/pages/payment-result-page.css";

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

function airportLabel(airport) {
  if (!airport) return "—";
  const location = airport.thanhPho || airport.tenSanBay;
  return `${airport.maSanBay || "—"}${location ? ` · ${location}` : ""}`;
}

function getSeatSummary(checkout) {
  const seats = (checkout?.hanhKhachs || [])
    .map((passenger) => passenger?.ve?.ghe?.soGhe)
    .filter(Boolean);
  return [...new Set(seats)].join(", ") || "—";
}

function getFriendlyFailureReason(failureReason) {
  if (!failureReason) return "Máy chủ không cung cấp lý do chi tiết.";
  if (failureReason === "PaymentTimeout") return "Vượt quá thời gian xử lý thanh toán.";
  if (failureReason === "UserCancelled") return "Booking đã được người dùng chủ động hủy.";
  return "Giao dịch không thể hoàn tất theo kết quả được máy chủ ghi nhận.";
}

function ResultActions({ actions }) {
  return (
    <div className="payment-result__actions">
      {actions.map((action, index) => (
        <Link
          className={`payment-result__action ${index === 0 ? "is-primary" : index === 1 ? "is-secondary" : "is-tertiary"}`}
          key={`${action.to}-${action.label}`}
          to={action.to}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}

function ResultSummary({ checkout, payment }) {
  return (
    <div className="payment-result__summary">
      <section className="payment-result__booking-reference" aria-label="Mã đặt chỗ">
        <span>Mã đặt chỗ</span>
        <strong>{checkout.maDatCho}</strong>
        <small>Booking ID: {checkout.maPhieuDatCho}</small>
      </section>

      <div className="payment-result__summary-grid">
        <section className="payment-result__panel" aria-labelledby="payment-result-booking-title">
          <h2 id="payment-result-booking-title">Thông tin giao dịch</h2>
          <dl className="payment-result__details">
            {payment ? <div><dt>Payment ID</dt><dd>{payment.paymentId}</dd></div> : null}
            {payment ? <div><dt>Phương thức</dt><dd>{payment.method}</dd></div> : null}
            {payment ? <div><dt>Nhà cung cấp</dt><dd>{payment.provider}</dd></div> : null}
            <div><dt>Trạng thái booking</dt><dd>{checkout.trangThai}</dd></div>
            {payment?.paidAt ? <div><dt>Thanh toán lúc</dt><dd>{formatDateTime(payment.paidAt)}</dd></div> : null}
          </dl>
        </section>

        <section className="payment-result__panel" aria-labelledby="payment-result-flight-title">
          <h2 id="payment-result-flight-title">Tóm tắt chuyến bay</h2>
          <dl className="payment-result__details">
            <div><dt>Hãng bay</dt><dd>{checkout.chuyenBay.tenHangBay}</dd></div>
            <div><dt>Số hiệu</dt><dd>{checkout.chuyenBay.soHieuChuyenBay}</dd></div>
            <div><dt>Điểm đi</dt><dd>{airportLabel(checkout.chuyenBay.sanBayDi)}</dd></div>
            <div><dt>Điểm đến</dt><dd>{airportLabel(checkout.chuyenBay.sanBayDen)}</dd></div>
            <div><dt>Khởi hành</dt><dd>{formatDateTime(checkout.chuyenBay.gioKhoiHanh)}</dd></div>
            <div><dt>Hành khách</dt><dd>{checkout.hanhKhachs.length}</dd></div>
            <div><dt>Ghế</dt><dd>{getSeatSummary(checkout)}</dd></div>
          </dl>
        </section>
      </div>

      <section className="payment-result__total" aria-label="Tổng thanh toán">
        <span>Tổng thanh toán</span>
        <strong>{formatMoney(checkout.pricing.tongThanhToan)}</strong>
      </section>
    </div>
  );
}

export default function PaymentResultPage({ mode }) {
  const { bookingId, paymentId } = useParams();
  const navigate = useNavigate();
  const redirectGuardRef = useRef(false);
  const normalizedBookingId = Number(bookingId);
  const normalizedPaymentId = Number(paymentId);

  const {
    payment,
    checkout,
    loading,
    refreshing,
    error,
    pending,
    retry,
  } = usePaymentResultData({
    mode,
    bookingId: normalizedBookingId,
    paymentId: normalizedPaymentId,
  });

  useEffect(() => {
    redirectGuardRef.current = false;
  }, [mode, normalizedBookingId, normalizedPaymentId]);

  useEffect(() => {
    if (
      mode !== "payment"
      || !pending
      || payment?.status !== "Pending"
      || payment.paymentId !== normalizedPaymentId
      || payment.bookingId !== normalizedBookingId
      || redirectGuardRef.current
    ) return;

    redirectGuardRef.current = true;
    navigate(
      `/payment/${normalizedBookingId}/processing/${normalizedPaymentId}`,
      { replace: true },
    );
  }, [mode, navigate, normalizedBookingId, normalizedPaymentId, payment, pending]);

  let content;

  if (loading || pending) {
    content = (
      <section className="payment-result__state-card" aria-live="polite" aria-busy="true">
        <span className="payment-result__spinner material-symbols-outlined" aria-hidden="true">progress_activity</span>
        <h1>Đang tải kết quả thanh toán</h1>
        <p>{pending ? "Thanh toán vẫn đang xử lý. Đang quay lại màn hình theo dõi." : "Đang đọc dữ liệu mới nhất từ máy chủ."}</p>
      </section>
    );
  } else if (error) {
    content = (
      <section className="payment-result__state-card is-error" role="alert">
        <span className="payment-result__status-icon material-symbols-outlined" aria-hidden="true">error</span>
        <h1>Không thể tải kết quả thanh toán</h1>
        <p>{error.message}</p>
        <small>Mã phản hồi: {error.code}</small>
        <div className="payment-result__actions">
          <button
            type="button"
            className="payment-result__action is-primary"
            onClick={retry}
            disabled={refreshing}
          >
            {refreshing ? "Đang tải lại..." : "Thử tải lại"}
          </button>
          <Link className="payment-result__action is-secondary" to="/">Về trang chủ</Link>
        </div>
      </section>
    );
  } else if (checkout) {
    const resultType = mode === "booking-cancelled" || payment?.status === "Cancelled"
      ? "cancelled"
      : payment?.status === "Succeeded"
        ? "success"
        : payment?.status === "Failed" && payment.failureReason === "PaymentTimeout"
          ? "timeout"
          : "failed";
    const seatsReleased = ["Expired", "Cancelled"].includes(checkout.trangThai);
    const view = {
      success: {
        icon: "task_alt",
        eyebrow: "THANH TOÁN HOÀN TẤT",
        title: "Thanh toán thành công",
        description: "Đặt chỗ của bạn đã được xác nhận.",
        noteTitle: "Booking đã Confirmed và vé đã được phát hành.",
        noteBody: "Vé điện tử đã được phát hành cho từng hành khách.",
        actions: [
          { label: "Xem vé", to: `/booking/${checkout.maPhieuDatCho}/tickets` },
          { label: "Về trang chủ", to: "/" },
          { label: "Tìm chuyến khác", to: "/search" },
        ],
      },
      cancelled: {
        icon: "event_busy",
        eyebrow: "ĐẶT CHỖ ĐÃ HỦY",
        title: "Đã hủy đặt chỗ",
        description: "Yêu cầu hủy đã được máy chủ xác nhận.",
        noteTitle: "Booking và vé chờ đã được hủy.",
        noteBody: "Ghế đã được giải phóng theo kết quả backend.",
        actions: [
          { label: "Tìm chuyến bay", to: "/search" },
          { label: "Về trang chủ", to: "/" },
        ],
      },
      timeout: {
        icon: "timer_off",
        eyebrow: "THỜI GIAN THANH TOÁN ĐÃ HẾT",
        title: "Đã hết thời gian thanh toán",
        description: "Thanh toán đã vượt quá thời gian xử lý và booking đã hết hạn.",
        noteTitle: "Không phát hành vé.",
        noteBody: "Ghế đã được giải phóng theo kết quả backend. Bạn cần tạo một booking mới.",
        actions: [
          { label: "Đặt vé lại", to: "/search" },
          { label: "Về trang chủ", to: "/" },
        ],
      },
      failed: {
        icon: "error",
        eyebrow: "GIAO DỊCH KHÔNG HOÀN TẤT",
        title: "Thanh toán thất bại",
        description: getFriendlyFailureReason(payment?.failureReason),
        noteTitle: `Booking hiện ở trạng thái ${checkout.trangThai}.`,
        noteBody: seatsReleased
          ? "Ghế đã được giải phóng theo trạng thái booking từ backend."
          : "Trang này không xác nhận ghế đã được giải phóng. Không có retry payment tự động.",
        actions: [
          { label: "Tìm chuyến khác", to: "/search" },
          { label: "Về trang chủ", to: "/" },
        ],
      },
    }[resultType];

    content = (
      <article className={`payment-result__card is-${resultType}`} aria-live="polite">
        <header className="payment-result__hero">
          <span className="payment-result__status-icon material-symbols-outlined" aria-hidden="true">{view.icon}</span>
          <p className="payment-result__eyebrow">{view.eyebrow}</p>
          <h1>{view.title}</h1>
          <p>{view.description}</p>
        </header>

        <ResultSummary checkout={checkout} payment={payment} />

        <section className="payment-result__message" aria-label="Thông tin tiếp theo">
          <strong>{view.noteTitle}</strong>
          <p>{view.noteBody}</p>
        </section>

        <ResultActions actions={view.actions} />
      </article>
    );
  } else {
    content = (
      <section className="payment-result__state-card is-error" role="alert">
        <span className="payment-result__status-icon material-symbols-outlined" aria-hidden="true">warning</span>
        <h1>Chưa có dữ liệu kết quả</h1>
        <p>Vui lòng thử tải lại dữ liệu từ máy chủ.</p>
        <button type="button" className="payment-result__action is-primary" onClick={retry}>Thử tải lại</button>
      </section>
    );
  }

  return (
    <main className="payment-page payment-result-page">
      <div className="payment-page__shell">
        <PaymentFlowHeader activeStep={5} />
        <div className="payment-result__layout">{content}</div>
      </div>
    </main>
  );
}
