import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { airlineService, extractAirlineFieldErrors } from "../../../../services/airlineService";
import { getAssetUrl } from "../../../../services/assetUrl";

const countries = [
  "Việt Nam", "Thái Lan", "Singapore", "Malaysia", "Indonesia",
  "Philippines", "Campuchia", "Lào", "Myanmar", "Trung Quốc",
  "Nhật Bản", "Hàn Quốc", "Hoa Kỳ", "Pháp", "Anh",
  "Đức", "Úc", "Ấn Độ", "UAE", "Qatar",
];

const allowedLogoTypes = ["image/svg+xml", "image/png", "image/jpeg", "image/gif"];
const maxLogoSize = 2 * 1024 * 1024;

const initialForm = {
  tenHangBay: "",
  maCode: "",
  quocGia: "",
  logoUrl: "",
};

const getInitial = (name, code) => {
  const source = code || name || "?";
  return source.trim().charAt(0).toUpperCase();
};

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 16V7" />
      <path d="m8 11 4-4 4 4" />
      <path d="M20 16.5a4.5 4.5 0 0 0-4.5-4.5h-.8A6 6 0 1 0 4 15.5" />
      <path d="M7 19h10" />
    </svg>
  );
}

function AirlineFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const comboRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const pageText = useMemo(() => {
    if (isEditMode) {
      return {
        title: `Sửa hãng bay: ${form.tenHangBay || id}`,
        subtitle: "Cập nhật thông tin nhận diện và quốc gia của hãng bay.",
        submit: "Cập nhật",
      };
    }

    return {
      title: "Thêm mới hãng bay",
      subtitle: "Nhập thông tin chi tiết để đăng ký hãng hàng không mới vào hệ thống.",
      submit: "Lưu thông tin",
    };
  }, [form.tenHangBay, id, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    let ignore = false;

    const loadAirline = async () => {
      try {
        setLoading(true);
        setFormError("");
        const data = await airlineService.getById(id);
        if (!ignore) {
          setForm({
            tenHangBay: data.tenHangBay ?? "",
            maCode: data.maCode ?? "",
            quocGia: data.quocGia ?? "",
            logoUrl: data.logoUrl ?? "",
          });
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setFormError("Không tải được thông tin hãng bay cần sửa.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadAirline();

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
    const normalizedValue = fieldName === "maCode" ? value.toUpperCase().slice(0, 10) : value;
    setForm((current) => ({ ...current, [fieldName]: normalizedValue }));
    if (fieldName === "logoUrl") setLogoPreviewError(false);
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
    setFormError("");
  };

  const validateLogoFile = (file) => {
    const fileName = file.name.toLowerCase();
    const isValidType = allowedLogoTypes.includes(file.type) || fileName.endsWith(".svg");

    if (!isValidType) {
      return "Logo chỉ hỗ trợ SVG, PNG, JPG hoặc GIF.";
    }

    if (file.size > maxLogoSize) {
      return "Logo không được vượt quá 2MB.";
    }

    return "";
  };

  const uploadLogo = async (file) => {
    const logoError = validateLogoFile(file);
    if (logoError) {
      setFieldErrors((current) => ({ ...current, logoUrl: logoError }));
      return;
    }

    try {
      setUploadingLogo(true);
      setFormError("");
      setFieldErrors((current) => ({ ...current, logoUrl: "" }));

      const result = await airlineService.uploadLogo(file);
      updateField("logoUrl", result.logoUrl || result.relativeUrl || "");
    } catch (err) {
      console.error(err);
      setFieldErrors((current) => ({
        ...current,
        logoUrl: err.userMessage || "Không thể tải logo lên. Vui lòng thử lại.",
      }));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) uploadLogo(file);
  };

  const handleLogoDrop = (event) => {
    event.preventDefault();
    setIsDraggingLogo(false);

    const file = event.dataTransfer.files?.[0];
    if (file) uploadLogo(file);
  };

  const validate = () => {
    const errors = {};

    if (!form.tenHangBay.trim()) errors.tenHangBay = "Vui lòng nhập tên hãng bay.";
    if (!form.maCode.trim()) errors.maCode = "Vui lòng nhập mã code.";
    else if (form.maCode.trim().length > 10) errors.maCode = "Mã code không được vượt quá 10 ký tự.";
    if (form.logoUrl.trim().length > 500) errors.logoUrl = "Đường dẫn logo không được vượt quá 500 ký tự.";
    if (form.quocGia.trim().length > 120) errors.quocGia = "Quốc gia không được vượt quá 120 ký tự.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      tenHangBay: form.tenHangBay.trim(),
      maCode: form.maCode.trim().toUpperCase(),
      logoUrl: form.logoUrl.trim() || null,
      quocGia: form.quocGia.trim() || null,
    };

    try {
      setSaving(true);
      setFormError("");
      setFieldErrors({});

      if (isEditMode) {
        await airlineService.update(id, payload);
      } else {
        await airlineService.create(payload);
      }

      navigate("/admin/danh-muc/hang-bay");
    } catch (err) {
      console.error(err);
      setFieldErrors(extractAirlineFieldErrors(err));
      setFormError(err.userMessage || "Không thể lưu thông tin hãng bay.");
    } finally {
      setSaving(false);
    }
  };

  const logoPreviewSrc = getAssetUrl(form.logoUrl);

  if (loading) {
    return (
      <div className="master-page master-form-page airline-form-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page master-form-page airline-form-page">
      <div className="master-page-head master-page-head-compact">
        <div>
          <h1>{pageText.title}</h1>
          <p>{pageText.subtitle}</p>
        </div>
      </div>

      <div className="master-form-card airline-form-card">
        <form onSubmit={handleSubmit} noValidate>
          {formError ? <div className="master-validation">{formError}</div> : null}

          <section className="master-form-section">
            <h2>Thông tin cơ bản</h2>

            <div className="master-form-grid">
              <div className="master-form-group master-full-field">
                <label htmlFor="tenHangBay" className="master-label">Tên hãng bay <span>*</span></label>
                <input
                  id="tenHangBay"
                  name="tenHangBay"
                  className="master-input"
                  value={form.tenHangBay}
                  placeholder="Nhập tên đầy đủ của hãng bay"
                  maxLength={160}
                  onChange={(event) => updateField("tenHangBay", event.target.value)}
                />
                {fieldErrors.tenHangBay ? <span className="text-danger">{fieldErrors.tenHangBay}</span> : null}
              </div>

              <div className="master-form-group">
                <label htmlFor="maCode" className="master-label">Mã code (IATA) <span>*</span></label>
                <input
                  id="maCode"
                  name="maCode"
                  className="master-input"
                  value={form.maCode}
                  maxLength={10}
                  placeholder="Ví dụ: VN, VJ, QH"
                  onChange={(event) => updateField("maCode", event.target.value)}
                />
                <span className="master-hint">Backend hiện cho phép tối đa 10 ký tự; hệ thống tự động chuyển thành chữ in hoa.</span>
                {fieldErrors.maCode ? <span className="text-danger">{fieldErrors.maCode}</span> : null}
              </div>

              <div className="master-form-group">
                <label htmlFor="quocGia" className="master-label">Quốc gia</label>

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
          </section>

          <section className="master-form-section airline-brand-section">
            <h2>Logo &amp; Nhận diện</h2>

            <div className="airline-logo-edit-grid">
              <div className="master-form-group">
                <label className="master-label">Logo hiện tại</label>
                <div className="airline-current-logo-box">
                  {logoPreviewSrc && !logoPreviewError ? (
                    <img src={logoPreviewSrc} alt="Logo hãng bay" onError={() => setLogoPreviewError(true)} />
                  ) : (
                    <span>{getInitial(form.tenHangBay, form.maCode)}</span>
                  )}
                </div>
              </div>

              <div className="master-form-group">
                <label className="master-label" htmlFor="airlineLogoFile">Tải lên Logo mới</label>
                <div
                  className={`airline-upload-zone ${isDraggingLogo ? "is-dragging" : ""} ${uploadingLogo ? "is-uploading" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleLogoDrop}
                >
                  <input
                    id="airlineLogoFile"
                    ref={fileInputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.gif,image/svg+xml,image/png,image/jpeg,image/gif"
                    onChange={handleFileChange}
                  />

                  <div className="airline-upload-content">
                    <span className="airline-upload-icon"><UploadIcon /></span>
                    <strong>{uploadingLogo ? "Đang tải logo lên..." : "Nhấn để tải lên hoặc kéo thả file vào đây"}</strong>
                    <small>SVG, PNG, JPG hoặc GIF. Tối đa 2MB.</small>
                  </div>
                </div>

                <input type="hidden" name="logoUrl" value={form.logoUrl} readOnly />
                {fieldErrors.logoUrl ? <span className="text-danger">{fieldErrors.logoUrl}</span> : null}
                {form.logoUrl ? <span className="master-hint">Logo đã được tải lên. Khi bấm lưu, hệ thống sẽ lưu logo này cho hãng bay.</span> : null}
              </div>
            </div>
          </section>

          <div className="master-form-actions">
            <Link to="/admin/danh-muc/hang-bay" className="master-outline-btn">Hủy</Link>
            <button type="submit" className="master-primary-btn" disabled={saving || uploadingLogo}>
              <SaveIcon />
              {saving ? "Đang lưu..." : pageText.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AirlineFormPage;
