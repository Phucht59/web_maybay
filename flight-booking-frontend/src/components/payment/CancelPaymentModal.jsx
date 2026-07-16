import { useEffect, useRef } from "react";

export default function CancelPaymentModal({ open, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="payment-cancel-modal__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
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
          aria-label="Đóng hộp xác nhận hủy"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <span className="payment-cancel-modal__icon material-symbols-outlined" aria-hidden="true">
          warning
        </span>
        <h2 id="payment-cancel-modal-title">Xác nhận hủy đặt chỗ</h2>
        <p id="payment-cancel-modal-description">
          Hủy sẽ kết thúc toàn bộ booking và giải phóng ghế sau khi chức năng hủy phía máy chủ được triển khai.
          Đây là hành động ảnh hưởng đến tất cả hành khách trong booking.
        </p>

        <div className="payment-cancel-modal__notice" role="note">
          Chức năng xác nhận hủy sẽ được kết nối ở bước xử lý hủy.
        </div>

        <div className="payment-cancel-modal__actions">
          <button type="button" className="is-secondary" onClick={onClose}>Tiếp tục thanh toán</button>
          <button type="button" className="is-danger" disabled>Xác nhận hủy</button>
        </div>
      </section>
    </div>
  );
}
