import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { aircraftService, extractAircraftFieldErrors } from "../../../../services/aircraftService";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Inactive", label: "Inactive" },
];

const initialForm = {
  maHangBay: "",
  dongMayBay: "",
  soHieuDangKy: "",
  tongSoGhe: "",
  trangThai: "Active",
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
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

function AircraftFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [airlineOptions, detail] = await Promise.all([
          aircraftService.getAirlineOptions(),
          isEditMode ? aircraftService.getById(id) : Promise.resolve(null),
        ]);

        if (ignore) return;

        setAirlines(airlineOptions);

        if (detail) {
          setForm({
            maHangBay: String(detail.maHangBay ?? ""),
            dongMayBay: detail.dongMayBay ?? "",
            soHieuDangKy: detail.soHieuDangKy ?? "",
            tongSoGhe: String(detail.tongSoGhe ?? ""),
            trangThai: detail.trangThai || "Active",
          });
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tải được dữ liệu máy bay hoặc danh sách hãng bay.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [id, isEditMode]);

  const pageTitle = useMemo(() => (isEditMode ? "Chỉnh sửa máy bay" : "Thêm mới máy bay"), [isEditMode]);
  const pageDescription = useMemo(() => (isEditMode ? "Cập nhật thông tin kỹ thuật và trạng thái vận hành." : "Tạo dữ liệu máy bay mới cho hệ thống."), [isEditMode]);

  const updateField = (fieldName, value) => {
    setForm((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const validateClient = () => {
    const nextErrors = {};

    if (!form.maHangBay) nextErrors.maHangBay = "Vui lòng chọn hãng bay.";
    if (!form.dongMayBay.trim()) nextErrors.dongMayBay = "Vui lòng nhập dòng máy bay.";
    if (!form.tongSoGhe || Number(form.tongSoGhe) <= 0) nextErrors.tongSoGhe = "Tổng số ghế phải lớn hơn 0.";
    if (!form.trangThai.trim()) nextErrors.trangThai = "Vui lòng chọn trạng thái.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateClient()) return;

    const payload = {
      maHangBay: Number(form.maHangBay),
      dongMayBay: form.dongMayBay.trim(),
      soHieuDangKy: form.soHieuDangKy.trim() || null,
      tongSoGhe: Number(form.tongSoGhe),
      trangThai: form.trangThai.trim(),
    };

    try {
      setSaving(true);

      if (isEditMode) {
        await aircraftService.update(id, payload);
        navigate(`/admin/danh-muc/may-bay/${id}`);
      } else {
        const result = await aircraftService.create(payload);
        const newId = result?.data?.maMayBay;
        navigate(newId ? `/admin/danh-muc/may-bay/${newId}` : "/admin/danh-muc/may-bay");
      }
    } catch (err) {
      console.error(err);
      setFieldErrors(extractAircraftFieldErrors(err));
      setError(err.userMessage || "Không thể lưu máy bay. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page aircraft-form-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page aircraft-form-page">
      <div className="master-page-head master-page-head-compact aircraft-form-head">
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageDescription}</p>
        </div>
      </div>

      <form className="master-form-card aircraft-form-card" onSubmit={handleSubmit}>
        {error ? <div className="master-validation">{error}</div> : null}

        <div className="aircraft-form-grid">
          <div className="master-form-group">
            <label htmlFor="maHangBay" className="master-label">Hãng bay <span>*</span></label>
            <select
              id="maHangBay"
              className="master-input aircraft-select"
              value={form.maHangBay}
              onChange={(event) => updateField("maHangBay", event.target.value)}
            >
              <option value="">-- Chọn hãng bay --</option>
              {airlines.map((airline) => (
                <option key={airline.maHangBay} value={airline.maHangBay}>
                  {airline.label || `${airline.tenHangBay} (${airline.maCode})`}
                </option>
              ))}
            </select>
            {fieldErrors.maHangBay ? <span className="text-danger">{fieldErrors.maHangBay}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="dongMayBay" className="master-label">Dòng máy bay <span>*</span></label>
            <input
              id="dongMayBay"
              className="master-input"
              value={form.dongMayBay}
              maxLength={120}
              placeholder="Ví dụ: Airbus A321neo"
              onChange={(event) => updateField("dongMayBay", event.target.value)}
            />
            {fieldErrors.dongMayBay ? <span className="text-danger">{fieldErrors.dongMayBay}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="soHieuDangKy" className="master-label">Số hiệu đăng ký</label>
            <input
              id="soHieuDangKy"
              className="master-input"
              value={form.soHieuDangKy}
              maxLength={40}
              placeholder="Ví dụ: VN-A321"
              onChange={(event) => updateField("soHieuDangKy", event.target.value.toUpperCase())}
            />
            <span className="master-help-text">Có thể bỏ trống nếu chưa có số hiệu đăng ký.</span>
            {fieldErrors.soHieuDangKy ? <span className="text-danger">{fieldErrors.soHieuDangKy}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="tongSoGhe" className="master-label">Tổng số ghế <span>*</span></label>
            <input
              id="tongSoGhe"
              type="number"
              min="1"
              className="master-input"
              value={form.tongSoGhe}
              placeholder="Ví dụ: 230"
              onChange={(event) => updateField("tongSoGhe", event.target.value)}
            />
            {fieldErrors.tongSoGhe ? <span className="text-danger">{fieldErrors.tongSoGhe}</span> : null}
          </div>

          <div className="master-form-group aircraft-form-status">
            <label htmlFor="trangThai" className="master-label">Trạng thái <span>*</span></label>
            <select
              id="trangThai"
              className="master-input aircraft-select"
              value={form.trangThai}
              onChange={(event) => updateField("trangThai", event.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            {fieldErrors.trangThai ? <span className="text-danger">{fieldErrors.trangThai}</span> : null}
          </div>
        </div>

        <div className="aircraft-form-actions">
          <Link to={isEditMode ? `/admin/danh-muc/may-bay/${id}` : "/admin/danh-muc/may-bay"} className="master-outline-btn">
            <BackIcon />
            Hủy
          </Link>

          <button type="submit" className="master-primary-btn" disabled={saving}>
            <SaveIcon />
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AircraftFormPage;
