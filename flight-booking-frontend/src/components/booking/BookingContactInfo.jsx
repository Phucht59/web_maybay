const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s+()-]+$/;

export function createContactInfo(authUser) {
  return {
    hoTenLienHe: String(authUser?.hoTen || ""),
    email: String(authUser?.email || ""),
    soDienThoai: String(authUser?.soDienThoai || ""),
  };
}

export function normalizeContactInfo(contactInfo = {}) {
  return {
    hoTenLienHe: String(contactInfo.hoTenLienHe || "").trim(),
    email: String(contactInfo.email || "").trim(),
    soDienThoai: String(contactInfo.soDienThoai || "").trim(),
  };
}

export function validateContactInfo(contactInfo) {
  const value = normalizeContactInfo(contactInfo);
  const errors = {};

  if (!value.hoTenLienHe) errors.hoTenLienHe = "Vui lòng nhập họ tên người liên hệ.";
  else if (value.hoTenLienHe.length > 160) errors.hoTenLienHe = "Họ tên không được vượt quá 160 ký tự.";

  if (!value.email) errors.email = "Vui lòng nhập email liên hệ.";
  else if (value.email.length > 254) errors.email = "Email không được vượt quá 254 ký tự.";
  else if (!EMAIL_PATTERN.test(value.email)) errors.email = "Email liên hệ không hợp lệ.";

  const phoneDigits = value.soDienThoai.replace(/\D/g, "");
  if (!value.soDienThoai) errors.soDienThoai = "Vui lòng nhập số điện thoại liên hệ.";
  else if (!PHONE_PATTERN.test(value.soDienThoai)) errors.soDienThoai = "Số điện thoại chỉ được chứa chữ số, khoảng trắng, +, dấu gạch ngang hoặc ngoặc.";
  else if (phoneDigits.length < 8 || phoneDigits.length > 15) errors.soDienThoai = "Số điện thoại phải có từ 8 đến 15 chữ số.";

  return errors;
}

export function isContactInfoValid(contactInfo) {
  return Object.keys(validateContactInfo(contactInfo)).length === 0;
}

function ContactField({ icon, label, name, type, autoComplete, maxLength, value, error, disabled, onChange }) {
  const errorId = error ? `booking-contact-${name}-error` : undefined;
  return (
    <label className="booking-contact-field">
      <span><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{label} *</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
      />
      {error && <small id={errorId} className="booking-contact-error" aria-live="polite">{error}</small>}
    </label>
  );
}

export default function BookingContactInfo({ contactInfo, errors, onChange, disabled, sectionRef }) {
  const updateField = (event) => onChange(event.target.name, event.target.value);

  return (
    <section className="booking-contact" ref={sectionRef} aria-labelledby="booking-contact-title">
      <div className="booking-contact-head">
        <h3 id="booking-contact-title">Thông tin liên hệ</h3>
        <p>Dùng để gửi xác nhận đặt vé và các thông báo về chuyến bay.</p>
      </div>
      <div className="booking-contact-fields">
        <ContactField icon="person" label="Họ tên người liên hệ" name="hoTenLienHe" type="text" autoComplete="name" maxLength={160} value={contactInfo.hoTenLienHe} error={errors.hoTenLienHe} disabled={disabled} onChange={updateField} />
        <ContactField icon="mail" label="Email" name="email" type="email" autoComplete="email" maxLength={254} value={contactInfo.email} error={errors.email} disabled={disabled} onChange={updateField} />
        <ContactField icon="call" label="Số điện thoại" name="soDienThoai" type="tel" autoComplete="tel" maxLength={40} value={contactInfo.soDienThoai} error={errors.soDienThoai} disabled={disabled} onChange={updateField} />
      </div>
    </section>
  );
}
