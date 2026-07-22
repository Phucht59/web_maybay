import { useEffect, useRef, useState } from "react";

const GENDER_VALUES = new Set(["Male", "Female", "Other"]);
const DOCUMENT_VALUES = new Set(["CCCD", "Passport", "BirthCertificate"]);
const PASSENGER_TYPE_VALUES = new Set(["Adult", "Child", "Infant"]);

export function createEmptyPassenger() {
  return {
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "",
    quocTich: "",
    loaiGiayTo: "CCCD",
    soGiayTo: "",
    ngayHetHanGiayTo: "",
    loaiHanhKhach: "Adult",
  };
}

export function createPassengerState(count) {
  return Array.from({ length: count }, () => createEmptyPassenger());
}

export function normalizePassenger(passenger = {}) {
  return {
    hoTen: String(passenger.hoTen || "").trim(),
    ngaySinh: String(passenger.ngaySinh || ""),
    gioiTinh: String(passenger.gioiTinh || ""),
    quocTich: String(passenger.quocTich || "").trim(),
    loaiGiayTo: String(passenger.loaiGiayTo || "CCCD"),
    soGiayTo: String(passenger.soGiayTo || "").trim(),
    ngayHetHanGiayTo: String(passenger.ngayHetHanGiayTo || ""),
    loaiHanhKhach: String(passenger.loaiHanhKhach || "Adult"),
  };
}

export function normalizePassengers(current, count) {
  return Array.from({ length: count }, (_, index) => (
    current[index] ? normalizePassenger(current[index]) : createEmptyPassenger()
  ));
}

function dateInputValue(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function validatePassenger(passenger, flightDeparture) {
  const value = normalizePassenger(passenger);
  const errors = {};
  const today = dateInputValue(new Date());
  const departureDate = dateInputValue(flightDeparture);

  if (!value.hoTen) errors.hoTen = "Vui lòng nhập họ tên hành khách.";
  else if (value.hoTen.length > 160) errors.hoTen = "Họ tên không được vượt quá 160 ký tự.";

  if (!value.ngaySinh) errors.ngaySinh = "Vui lòng chọn ngày sinh.";
  else if (!isValidDateInput(value.ngaySinh)) errors.ngaySinh = "Ngày sinh không hợp lệ.";
  else if (value.ngaySinh > today) errors.ngaySinh = "Ngày sinh không được lớn hơn ngày hiện tại.";

  if (!GENDER_VALUES.has(value.gioiTinh)) errors.gioiTinh = "Vui lòng chọn giới tính.";

  if (!value.quocTich) errors.quocTich = "Vui lòng nhập quốc tịch.";
  else if (value.quocTich.length > 120) errors.quocTich = "Quốc tịch không được vượt quá 120 ký tự.";

  if (!DOCUMENT_VALUES.has(value.loaiGiayTo)) errors.loaiGiayTo = "Vui lòng chọn loại giấy tờ hợp lệ.";

  if (!value.soGiayTo) errors.soGiayTo = "Vui lòng nhập số giấy tờ.";
  else if (value.soGiayTo.length > 40) errors.soGiayTo = "Số giấy tờ không được vượt quá 40 ký tự.";

  if (value.ngayHetHanGiayTo && !isValidDateInput(value.ngayHetHanGiayTo)) {
    errors.ngayHetHanGiayTo = "Ngày hết hạn giấy tờ không hợp lệ.";
  } else if (value.loaiGiayTo === "Passport") {
    if (!value.ngayHetHanGiayTo) errors.ngayHetHanGiayTo = "Hộ chiếu phải có ngày hết hạn.";
    else if (departureDate && value.ngayHetHanGiayTo < departureDate) {
      errors.ngayHetHanGiayTo = "Hộ chiếu phải còn hạn đến ngày khởi hành.";
    }
  }

  if (!PASSENGER_TYPE_VALUES.has(value.loaiHanhKhach)) errors.loaiHanhKhach = "Vui lòng chọn loại hành khách.";
  return errors;
}

export function isPassengerValid(passenger, flightDeparture) {
  return Object.keys(validatePassenger(passenger, flightDeparture)).length === 0;
}

function FieldError({ id, message }) {
  return message ? <small id={id} className="booking-passenger-error" aria-live="polite">{message}</small> : null;
}

export default function PassengerInfoModal({ passengerIndex, passenger, seat, flightDeparture, onSave, onClose, disabled }) {
  const [draft, setDraft] = useState(() => normalizePassenger(passenger));
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const today = dateInputValue(new Date());
  const departureDate = dateInputValue(flightDeparture);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const updateDraft = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name] && !(name === "loaiGiayTo" && current.ngayHetHanGiayTo)) return current;
      const next = { ...current };
      delete next[name];
      if (name === "loaiGiayTo") delete next.ngayHetHanGiayTo;
      return next;
    });
  };

  const submit = (event) => {
    event.preventDefault();
    if (disabled) return;
    const normalized = normalizePassenger(draft);
    const nextErrors = validatePassenger(normalized, flightDeparture);
    setDraft(normalized);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      window.setTimeout(() => formRef.current?.elements.namedItem(firstError)?.focus(), 0);
      return;
    }
    onSave(normalized);
  };

  const describedBy = (field) => errors[field] ? `passenger-${passengerIndex}-${field}-error` : undefined;
  return (
    <div className="booking-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="booking-modal booking-passenger-modal" role="dialog" aria-modal="true" aria-labelledby={`passenger-${passengerIndex}-title`} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="booking-modal-close" onClick={onClose} aria-label="Đóng"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
        <div className="booking-modal-icon"><span className="material-symbols-outlined" aria-hidden="true">person_edit</span></div>
        <p>THÔNG TIN HÀNH KHÁCH {passengerIndex + 1}</p>
        <h2 id={`passenger-${passengerIndex}-title`}>Thông tin hành khách</h2>
        <div className="booking-passenger-seat-note"><span className="material-symbols-outlined" aria-hidden="true">airline_seat_recline_normal</span>Ghế: <strong>{seat?.soGhe || "Chưa chọn"}</strong></div>

        <form ref={formRef} className="booking-passenger-form" onSubmit={submit} noValidate>
          <label className="booking-passenger-field booking-passenger-field-wide">
            <span>Họ tên *</span>
            <input name="hoTen" type="text" maxLength={160} value={draft.hoTen} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.hoTen)} aria-describedby={describedBy("hoTen")} />
            <FieldError id={describedBy("hoTen")} message={errors.hoTen} />
          </label>
          <label className="booking-passenger-field">
            <span>Loại hành khách *</span>
            <select name="loaiHanhKhach" value={draft.loaiHanhKhach} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.loaiHanhKhach)} aria-describedby={describedBy("loaiHanhKhach")}>
              <option value="Adult">Người lớn</option><option value="Child">Trẻ em</option><option value="Infant">Em bé</option>
            </select>
            <FieldError id={describedBy("loaiHanhKhach")} message={errors.loaiHanhKhach} />
          </label>
          <label className="booking-passenger-field">
            <span>Ngày sinh *</span>
            <input name="ngaySinh" type="date" max={today} value={draft.ngaySinh} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.ngaySinh)} aria-describedby={describedBy("ngaySinh")} />
            <FieldError id={describedBy("ngaySinh")} message={errors.ngaySinh} />
          </label>
          <label className="booking-passenger-field">
            <span>Giới tính *</span>
            <select name="gioiTinh" value={draft.gioiTinh} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.gioiTinh)} aria-describedby={describedBy("gioiTinh")}>
              <option value="">Chọn giới tính</option><option value="Male">Nam</option><option value="Female">Nữ</option><option value="Other">Khác</option>
            </select>
            <FieldError id={describedBy("gioiTinh")} message={errors.gioiTinh} />
          </label>
          <label className="booking-passenger-field">
            <span>Quốc tịch *</span>
            <input name="quocTich" type="text" maxLength={120} value={draft.quocTich} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.quocTich)} aria-describedby={describedBy("quocTich")} />
            <FieldError id={describedBy("quocTich")} message={errors.quocTich} />
          </label>
          <label className="booking-passenger-field">
            <span>Loại giấy tờ *</span>
            <select name="loaiGiayTo" value={draft.loaiGiayTo} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.loaiGiayTo)} aria-describedby={describedBy("loaiGiayTo")}>
              <option value="CCCD">Căn cước công dân</option><option value="Passport">Hộ chiếu</option><option value="BirthCertificate">Giấy khai sinh</option>
            </select>
            <FieldError id={describedBy("loaiGiayTo")} message={errors.loaiGiayTo} />
          </label>
          <label className="booking-passenger-field">
            <span>Số giấy tờ *</span>
            <input name="soGiayTo" type="text" maxLength={40} value={draft.soGiayTo} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.soGiayTo)} aria-describedby={describedBy("soGiayTo")} />
            <FieldError id={describedBy("soGiayTo")} message={errors.soGiayTo} />
          </label>
          <label className="booking-passenger-field">
            <span>Ngày hết hạn {draft.loaiGiayTo === "Passport" ? "*" : ""}</span>
            <input name="ngayHetHanGiayTo" type="date" min={draft.loaiGiayTo === "Passport" ? departureDate : undefined} value={draft.ngayHetHanGiayTo} onChange={updateDraft} disabled={disabled} aria-invalid={Boolean(errors.ngayHetHanGiayTo)} aria-describedby={describedBy("ngayHetHanGiayTo")} />
            <FieldError id={describedBy("ngayHetHanGiayTo")} message={errors.ngayHetHanGiayTo} />
          </label>
          <div className="booking-passenger-form-actions">
            <button type="button" className="booking-passenger-form-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="booking-passenger-form-save" disabled={disabled}>Lưu thông tin</button>
          </div>
        </form>
      </section>
    </div>
  );
}
