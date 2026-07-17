const PAYMENT_STEPS = [
  "Tìm chuyến bay",
  "Chọn vé",
  "Thông tin hành khách",
  "Thanh toán",
  "Hoàn tất",
];

export default function PaymentFlowHeader({ activeStep = 4 }) {
  const requestedStep = Number(activeStep);
  const normalizedActiveStep = Number.isInteger(requestedStep)
    ? Math.min(PAYMENT_STEPS.length, Math.max(1, requestedStep))
    : 4;

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
            const completed = stepNumber < normalizedActiveStep;
            const active = stepNumber === normalizedActiveStep;

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
