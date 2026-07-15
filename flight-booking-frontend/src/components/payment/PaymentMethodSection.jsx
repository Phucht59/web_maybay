const PAYMENT_METHODS = [
  { code: "Card", label: "Thẻ tín dụng/ghi nợ", icon: "credit_card" },
  { code: "OnlineBanking", label: "Ngân hàng trực tuyến", icon: "account_balance" },
  { code: "EWallet", label: "Ví điện tử", icon: "account_balance_wallet" },
  { code: "QrBanking", label: "QR Banking", icon: "qr_code_2" },
];

export default function PaymentMethodSection({ value, onChange }) {
  return (
    <section className="payment-card payment-method" aria-labelledby="payment-method-title">
      <div className="payment-card__heading">
        <span className="payment-card__icon">
          <span className="material-symbols-outlined" aria-hidden="true">payments</span>
        </span>
        <div>
          <p>LỰA CHỌN GIAO DIỆN</p>
          <h2 id="payment-method-title">Phương thức thanh toán</h2>
        </div>
      </div>

      <fieldset className="payment-method__fieldset">
        <legend>Chọn nhóm phương thức</legend>
        <div className="payment-method__grid">
          {PAYMENT_METHODS.map((method) => (
            <label
              className={`payment-method__option${value === method.code ? " is-selected" : ""}`}
              key={method.code}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.code}
                checked={value === method.code}
                onChange={(event) => onChange(event.target.value)}
              />
              <span className="material-symbols-outlined" aria-hidden="true">{method.icon}</span>
              <strong>{method.label}</strong>
              <small>Chọn nhóm</small>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="payment-method__note">
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
        Đây mới là lựa chọn giao diện. Cổng thanh toán sẽ được kết nối ở task tiếp theo.
      </p>
    </section>
  );
}
