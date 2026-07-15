const PAYMENT_STEPS = [
  "Tìm chuyến bay",
  "Chọn vé",
  "Thông tin hành khách",
  "Thanh toán",
  "Hoàn tất",
];

export default function PaymentFlowHeader() {
  return (
    <header className="payment-flow">
      <div className="payment-flow__intro">
        <p className="payment-flow__eyebrow">HOÀN TẤT ĐẶT CHỖ</p>
        <h1>Thanh toán đặt vé</h1>
        <p>Kiểm tra hành trình và hoàn tất thanh toán</p>
      </div>

      <nav className="payment-flow__nav" aria-label="Tiến trình đặt vé">
        <ol className="payment-flow__steps">
          {PAYMENT_STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const completed = stepNumber < 4;
            const active = stepNumber === 4;

            return (
              <li
                key={label}
                className={`payment-flow__step${completed ? " is-complete" : ""}${active ? " is-active" : ""}`}
                aria-current={active ? "step" : undefined}
              >
                <span className="payment-flow__marker" aria-hidden="true">
                  {completed ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : stepNumber}
                </span>
                <span className="payment-flow__label">{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
