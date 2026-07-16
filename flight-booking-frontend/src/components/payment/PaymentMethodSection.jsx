import { useState } from "react";

const PAYMENT_METHODS = [
  { code: "Card", label: "Thẻ mô phỏng", icon: "credit_card" },
  { code: "OnlineBanking", label: "Ngân hàng mô phỏng", icon: "account_balance" },
  { code: "EWallet", label: "Ví mô phỏng", icon: "account_balance_wallet" },
  { code: "QrBanking", label: "QR mô phỏng", icon: "qr_code_2" },
];

const SIMULATION_OPTIONS = {
  Card: ["Thẻ mô phỏng nội địa", "Thẻ mô phỏng quốc tế"],
  OnlineBanking: ["Ngân hàng mô phỏng 01", "Ngân hàng mô phỏng 02"],
  EWallet: ["Ví mô phỏng cá nhân", "Ví mô phỏng nhanh"],
};

function SimulationChoicePanel({ method, disabled, value, onChange }) {
  if (method === "QrBanking") {
    return (
      <section className="payment-method__simulation-panel" data-method-panel="QrBanking">
        <div className="payment-method__qr-placeholder" aria-hidden="true">
          <span className="material-symbols-outlined">qr_code_2</span>
          <small>QR DEMO</small>
        </div>
        <div>
          <h3>Quét mã QR mô phỏng</h3>
          <p>QR thật sẽ không được tạo trong phiên bản này. Không dùng ứng dụng ngân hàng để quét.</p>
        </div>
      </section>
    );
  }

  const options = SIMULATION_OPTIONS[method] || [];
  const titles = {
    Card: "Chọn loại thẻ mô phỏng",
    OnlineBanking: "Chọn ngân hàng mô phỏng",
    EWallet: "Chọn ví mô phỏng",
  };

  return (
    <section className="payment-method__simulation-panel" data-method-panel={method}>
      <div>
        <h3>{titles[method]}</h3>
        <p>Lựa chọn này chỉ thay đổi giao diện và không được gửi đến máy chủ.</p>
      </div>
      <fieldset disabled={disabled}>
        <legend>{titles[method]}</legend>
        <div className="payment-method__simulation-choices">
          {options.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={`simulation-${method}`}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

export default function PaymentMethodSection({ value, onChange, disabled = false }) {
  const [simulationSelections, setSimulationSelections] = useState({
    Card: SIMULATION_OPTIONS.Card[0],
    OnlineBanking: SIMULATION_OPTIONS.OnlineBanking[0],
    EWallet: SIMULATION_OPTIONS.EWallet[0],
  });

  return (
    <section
      className={`payment-card payment-method${disabled ? " is-disabled" : ""}`}
      aria-labelledby="payment-method-title"
      aria-disabled={disabled || undefined}
    >
      <div className="payment-card__heading">
        <span className="payment-card__icon">
          <span className="material-symbols-outlined" aria-hidden="true">payments</span>
        </span>
        <div>
          <p>THANH TOÁN MÔ PHỎNG</p>
          <h2 id="payment-method-title">Phương thức thanh toán</h2>
        </div>
      </div>

      <fieldset className="payment-method__fieldset" disabled={disabled}>
        <legend>Chọn phương thức</legend>
        <div className="payment-method__grid">
          {PAYMENT_METHODS.map((method) => (
            <label
              className={`payment-method__option${value === method.code ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
              key={method.code}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.code}
                checked={value === method.code}
                disabled={disabled}
                onChange={(event) => {
                  if (!disabled) onChange(event.target.value);
                }}
              />
              <span className="material-symbols-outlined" aria-hidden="true">{method.icon}</span>
              <strong>{method.label}</strong>
              <small>{method.code}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <SimulationChoicePanel
        method={value}
        disabled={disabled}
        value={simulationSelections[value]}
        onChange={(selection) => {
          setSimulationSelections((current) => ({ ...current, [value]: selection }));
        }}
      />

      <p className="payment-method__note" role="note">
        <span className="material-symbols-outlined" aria-hidden="true">shield</span>
        <strong>Đây là thanh toán mô phỏng. Không nhập thông tin tài chính thật.</strong>
      </p>
    </section>
  );
}
