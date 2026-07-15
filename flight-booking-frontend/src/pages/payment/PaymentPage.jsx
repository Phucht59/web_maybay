import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CheckoutInformationCard from "../../components/payment/CheckoutInformationCard";
import CheckoutSummaryCard from "../../components/payment/CheckoutSummaryCard";
import PaymentFlowHeader from "../../components/payment/PaymentFlowHeader";
import PaymentMethodSection from "../../components/payment/PaymentMethodSection";
import { bookingService } from "../../services/bookingService";
import "../../styles/pages/payment-page.css";

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

export default function PaymentPage() {
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    let isActive = true;
    const normalizedBookingId = Number(bookingId);

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
  }, [bookingId, loadAttempt]);

  const normalizedBookingId = Number(bookingId);
  const canRetry = Number.isInteger(normalizedBookingId) && normalizedBookingId > 0;

  const retryCheckout = () => {
    if (canRetry) setLoadAttempt((attempt) => attempt + 1);
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
            {canRetry ? <button type="button" onClick={retryCheckout}>Thử tải lại</button> : null}
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
            {canRetry ? <button type="button" onClick={retryCheckout}>Thử tải lại</button> : null}
          </section>
        </div>
      </main>
    );
  }

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
            <PaymentMethodSection value={paymentMethod} onChange={setPaymentMethod} />

            <section className="payment-card payment-confirmation" aria-labelledby="payment-confirmation-title">
              <h2 id="payment-confirmation-title">Xác nhận thông tin</h2>
              <label className="payment-confirmation__terms" htmlFor="payment-terms">
                <input
                  id="payment-terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>Tôi xác nhận thông tin đặt vé là chính xác và đồng ý với điều kiện giá vé, chính sách hoàn/hủy vé.</span>
              </label>
            </section>
          </div>

          <aside className="payment-page__aside" aria-label="Tóm tắt thanh toán">
            <CheckoutSummaryCard checkout={checkout} />
            <section className="payment-card payment-page__action">
              <button type="button" disabled aria-describedby="payment-unavailable-note">
                Thanh toán {formatMoney(checkout.pricing?.tongThanhToan)}
              </button>
              <p id="payment-unavailable-note">
                Chức năng tạo giao dịch sẽ được kết nối ở task tiếp theo.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
