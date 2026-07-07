import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { airportService, extractAirportFieldErrors } from "../../../../services/airportService";

const countries = [
  "Việt Nam", "Thái Lan", "Singapore", "Malaysia", "Indonesia",
  "Philippines", "Campuchia", "Lào", "Myanmar", "Trung Quốc",
  "Nhật Bản", "Hàn Quốc", "Hoa Kỳ", "Pháp", "Anh",
  "Đức", "Úc", "Ấn Độ", "UAE", "Qatar",
];

const initialForm = {
  maSanBay: "",
  tenSanBay: "",
  thanhPho: "",
  quocGia: "",
};

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function AirportFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const comboRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const pageText = useMemo(() => {
    if (isEditMode) {
      return {
        title: `Sửa sân bay: ${id}`,
        subtitle: "Cập nhật thông tin sân bay đang được sử dụng trong hệ thống.",
        submit: "Lưu thông tin",
      };
    }

    return {
      title: "Thêm mới sân bay",
      subtitle: "Tạo dữ liệu sân bay mới cho hệ thống.",
      submit: "Lưu thông tin",
    };
  }, [id, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    let ignore = false;

    const loadAirport = async () => {
      try {
        setLoading(true);
        setFormError("");
        const data = await airportService.getById(id);
        if (!ignore) {
          setForm({
            maSanBay: data.maSanBay ?? "",
            tenSanBay: data.tenSanBay ?? "",
            thanhPho: data.thanhPho ?? "",
            quocGia: data.quocGia ?? "",
          });
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setFormError("Không tải được thông tin sân bay cần sửa.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadAirport();

    return () => {
      ignore = true;
    };
  }, [id, isEditMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboRef.current && !comboRef.current.contains(event.target)) {
        setCountryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const keyword = form.quocGia.trim().toLowerCase();
    if (!keyword) return countries;
    return countries.filter((country) => country.toLowerCase().includes(keyword));
  }, [form.quocGia]);

  const updateField = (fieldName, value) => {
    const normalizedValue = fieldName === "maSanBay" ? value.toUpperCase().slice(0, 3) : value;
    setForm((current) => ({ ...current, [fieldName]: normalizedValue }));
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
    setFormError("");
  };

  const validate = () => {
    const errors = {};

    if (!form.maSanBay.trim()) errors.maSanBay = "Vui lòng nhập mã sân bay.";
    else if (form.maSanBay.trim().length !== 3) errors.maSanBay = "Mã sân bay phải gồm đúng 3 ký tự.";

    if (!form.tenSanBay.trim()) errors.tenSanBay = "Vui lòng nhập tên sân bay.";
    if (!form.thanhPho.trim()) errors.thanhPho = "Vui lòng nhập thành phố.";
    if (!form.quocGia.trim()) errors.quocGia = "Vui lòng nhập quốc gia.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      maSanBay: form.maSanBay.trim().toUpperCase(),
      tenSanBay: form.tenSanBay.trim(),
      thanhPho: form.thanhPho.trim(),
      quocGia: form.quocGia.trim(),
    };

    try {
      setSaving(true);
      setFormError("");
      setFieldErrors({});

      if (isEditMode) {
        await airportService.update(id, payload);
      } else {
        await airportService.create(payload);
      }

      navigate("/admin/danh-muc/san-bay");
    } catch (err) {
      console.error(err);
      setFieldErrors(extractAirportFieldErrors(err));
      setFormError(err.userMessage || "Không thể lưu thông tin sân bay.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page master-form-page airport-form-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page master-form-page airport-form-page">
      <div className="master-page-head master-page-head-compact">
        <div>
          <h1>{pageText.title}</h1>
          <p>{pageText.subtitle}</p>
        </div>
      </div>

      <div className="master-form-card airport-form-card">
        <form onSubmit={handleSubmit} noValidate>
          {formError ? <div className="master-validation">{formError}</div> : null}

          <div className="master-form-grid">
            <div className="master-form-group">
              <label htmlFor="maSanBay" className="master-label">Mã sân bay <span>*</span></label>
              <input
                id="maSanBay"
                name="maSanBay"
                className={`master-input ${isEditMode ? "master-input-readonly" : ""}`}
                value={form.maSanBay}
                maxLength={3}
                placeholder="VD: HAN"
                disabled={isEditMode}
                onChange={(event) => updateField("maSanBay", event.target.value)}
              />
              <span className="master-hint">
                {isEditMode ? "Mã sân bay không thể chỉnh sửa để đảm bảo đồng bộ dữ liệu." : "Mã IATA gồm 3 ký tự, hệ thống tự động chuyển thành chữ in hoa."}
              </span>
              {fieldErrors.maSanBay ? <span className="text-danger">{fieldErrors.maSanBay}</span> : null}
            </div>

            <div className="master-form-group">
              <label htmlFor="tenSanBay" className="master-label">Tên sân bay <span>*</span></label>
              <input
                id="tenSanBay"
                name="tenSanBay"
                className="master-input"
                value={form.tenSanBay}
                placeholder="VD: Sân bay quốc tế Nội Bài"
                maxLength={200}
                onChange={(event) => updateField("tenSanBay", event.target.value)}
              />
              {fieldErrors.tenSanBay ? <span className="text-danger">{fieldErrors.tenSanBay}</span> : null}
            </div>

            <div className="master-form-group">
              <label htmlFor="thanhPho" className="master-label">Thành phố <span>*</span></label>
              <input
                id="thanhPho"
                name="thanhPho"
                className="master-input"
                value={form.thanhPho}
                placeholder="VD: Hà Nội"
                maxLength={120}
                onChange={(event) => updateField("thanhPho", event.target.value)}
              />
              {fieldErrors.thanhPho ? <span className="text-danger">{fieldErrors.thanhPho}</span> : null}
            </div>

            <div className="master-form-group">
              <label htmlFor="quocGia" className="master-label">Quốc gia <span>*</span></label>

              <div className={`master-country-combobox ${countryOpen ? "is-open" : ""}`} ref={comboRef}>
                <input
                  id="quocGia"
                  name="quocGia"
                  className="master-input master-country-input"
                  value={form.quocGia}
                  placeholder="Gõ hoặc chọn quốc gia"
                  autoComplete="off"
                  onFocus={() => setCountryOpen(true)}
                  onChange={(event) => {
                    updateField("quocGia", event.target.value);
                    setCountryOpen(true);
                  }}
                />

                <button type="button" className="master-country-toggle" aria-label="Mở danh sách quốc gia" onClick={() => setCountryOpen((current) => !current)}>
                  <ChevronDownIcon />
                </button>

                <div className="master-country-options">
                  {filteredCountries.length === 0 ? (
                    <span className="master-country-option" style={{ cursor: "default" }}>Không có quốc gia phù hợp</span>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country}
                        type="button"
                        className="master-country-option"
                        onClick={() => {
                          updateField("quocGia", country);
                          setCountryOpen(false);
                        }}
                      >
                        {country}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {fieldErrors.quocGia ? <span className="text-danger">{fieldErrors.quocGia}</span> : null}
            </div>
          </div>

          <div className="master-form-actions">
            <Link to="/admin/danh-muc/san-bay" className="master-outline-btn">Hủy bỏ</Link>
            <button type="submit" className="master-primary-btn" disabled={saving}>
              {saving ? "Đang lưu..." : pageText.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AirportFormPage;
