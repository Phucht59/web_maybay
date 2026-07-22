import { useEffect, useRef } from "react";

export default function CancelPaymentModal({
  open,
  onClose,
  onConfirm,
  submitting,
  error,
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  return (
    <div
      className="payment-cancel-modal__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        className="payment-cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-cancel-modal-title"
        aria-describedby="payment-cancel-modal-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="payment-cancel-modal__close"
          onClick={onClose}
          disabled={submitting}
          aria-label="Đóng hộp xác nhận hủy"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <span className="payment-cancel-modal__icon material-symbols-outlined" aria-hidden="true">
          warning
        </span>
        <h2 id="payment-cancel-modal-title">Xác nhận hủy đặt chỗ</h2>
        <p id="payment-cancel-modal-description">
          Thao tác này sẽ hủy toàn bộ booking và áp dụng cho tất cả hành khách trong booking.
          Ghế chỉ được giải phóng sau khi máy chủ xác nhận hủy thành công.
        </p>

        <div className="payment-cancel-modal__notice" role="note">
          Booking chưa được xem là đã hủy cho đến khi máy chủ trả về kết quả thành công.
        </div>

        {error ? <div className="payment-cancel-modal__error" role="alert">{error}</div> : null}

        <div className="payment-cancel-modal__actions">
          <button
            type="button"
            className="is-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Tiếp tục thanh toán
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </section>
    </div>
  );
}
