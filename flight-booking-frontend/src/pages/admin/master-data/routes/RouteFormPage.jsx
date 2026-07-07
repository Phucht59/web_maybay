import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { extractRouteFieldErrors, routeService } from "../../../../services/routeService";

const routeTypeOptions = [
  { value: "Domestic", label: "Nội địa" },
  { value: "International", label: "Quốc tế" },
];

const statusOptions = [
  { value: "Active", label: "Hoạt động" },
  { value: "Inactive", label: "Ngưng hoạt động" },
];

const initialForm = {
  maSanBayDi: "",
  maSanBayDen: "",
  khoangCachKm: "",
  loaiDuongBay: "Domestic",
  giaCoBan: "",
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

function RouteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [airportOptions, detail] = await Promise.all([
          routeService.getAirportOptions(),
          isEditMode ? routeService.getById(id) : Promise.resolve(null),
        ]);

        if (ignore) return;

        setAirports(airportOptions);

        if (detail) {
          setForm({
            maSanBayDi: detail.maSanBayDi || "",
            maSanBayDen: detail.maSanBayDen || "",
            khoangCachKm: detail.khoangCachKm ?? "",
            loaiDuongBay: detail.loaiDuongBay || "Domestic",
            giaCoBan: detail.giaCoBan ?? "",
            trangThai: detail.trangThai || "Active",
          });
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tải được dữ liệu lộ trình. Vui lòng kiểm tra backend API.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [id, isEditMode]);

  const title = useMemo(() => (isEditMode ? "Cập nhật lộ trình" : "Thêm mới lộ trình"), [isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateClient = () => {
    const errors = {};

    if (!form.maSanBayDi) errors.maSanBayDi = "Vui lòng chọn sân bay đi.";
    if (!form.maSanBayDen) errors.maSanBayDen = "Vui lòng chọn sân bay đến.";
    if (form.maSanBayDi && form.maSanBayDen && form.maSanBayDi === form.maSanBayDen) {
      errors.maSanBayDen = "Sân bay đi và sân bay đến không được trùng nhau.";
    }
    if (!form.giaCoBan || Number(form.giaCoBan) <= 0) errors.giaCoBan = "Giá cơ bản phải lớn hơn 0.";
    if (form.khoangCachKm && Number(form.khoangCachKm) <= 0) errors.khoangCachKm = "Khoảng cách phải lớn hơn 0.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateClient()) return;

    const payload = {
      maSanBayDi: form.maSanBayDi,
      maSanBayDen: form.maSanBayDen,
      giaCoBan: Number(form.giaCoBan),
      khoangCachKm: form.khoangCachKm ? Number(form.khoangCachKm) : null,
      loaiDuongBay: form.loaiDuongBay,
      trangThai: form.trangThai,
    };

    try {
      setSaving(true);
      const result = isEditMode ? await routeService.update(id, payload) : await routeService.create(payload);
      const nextId = isEditMode ? id : result?.data?.maLoTrinh;
      navigate(nextId ? `/admin/danh-muc/lo-trinh/${nextId}` : "/admin/danh-muc/lo-trinh");
    } catch (err) {
      console.error(err);
      setFieldErrors(extractRouteFieldErrors(err));
      setError(err.userMessage || "Không thể lưu thông tin lộ trình.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page route-form-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page route-form-page">
      <div className="master-page-head master-page-head-compact route-form-head">
        <div>
          <h1>{title}</h1>
          <p>{isEditMode ? "Điều chỉnh tuyến bay, khoảng cách, giá cơ bản và trạng thái khai thác." : "Tạo tuyến bay mới, cấu hình khoảng cách, giá cơ bản và trạng thái khai thác."}</p>
        </div>
      </div>

      <form className="master-form-card route-form-card" onSubmit={handleSubmit}>
        {error ? <div className="master-validation">{error}</div> : null}

        <div className="route-form-grid">
          <div className="master-form-group">
            <label htmlFor="maSanBayDi" className="master-label">Sân bay đi <span>*</span></label>
            <select id="maSanBayDi" name="maSanBayDi" value={form.maSanBayDi} className="master-input route-select" onChange={handleChange}>
              <option value="">Chọn sân bay khởi hành</option>
              {airports.map((airport) => (
                <option key={airport.maSanBay} value={airport.maSanBay}>{airport.label || `${airport.maSanBay} - ${airport.tenSanBay}`}</option>
              ))}
            </select>
            {fieldErrors.maSanBayDi ? <span className="text-danger">{fieldErrors.maSanBayDi}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="maSanBayDen" className="master-label">Sân bay đến <span>*</span></label>
            <select id="maSanBayDen" name="maSanBayDen" value={form.maSanBayDen} className="master-input route-select" onChange={handleChange}>
              <option value="">Chọn sân bay hạ cánh</option>
              {airports.map((airport) => (
                <option key={airport.maSanBay} value={airport.maSanBay}>{airport.label || `${airport.maSanBay} - ${airport.tenSanBay}`}</option>
              ))}
            </select>
            {fieldErrors.maSanBayDen ? <span className="text-danger">{fieldErrors.maSanBayDen}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="khoangCachKm" className="master-label">Khoảng cách</label>
            <div className="master-money-input route-suffix-input">
              <input id="khoangCachKm" name="khoangCachKm" value={form.khoangCachKm} className="master-input" type="number" min="1" placeholder="Ví dụ: 1200" onChange={handleChange} />
              <span>km</span>
            </div>
            {fieldErrors.khoangCachKm ? <span className="text-danger">{fieldErrors.khoangCachKm}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="loaiDuongBay" className="master-label">Loại đường bay <span>*</span></label>
            <select id="loaiDuongBay" name="loaiDuongBay" value={form.loaiDuongBay} className="master-input route-select" onChange={handleChange}>
              {routeTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {fieldErrors.loaiDuongBay ? <span className="text-danger">{fieldErrors.loaiDuongBay}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="giaCoBan" className="master-label">Giá cơ bản <span>*</span></label>
            <div className="master-money-input route-suffix-input">
              <input id="giaCoBan" name="giaCoBan" value={form.giaCoBan} className="master-input" type="number" step="1000" min="0" placeholder="Nhập giá vé cơ bản" onChange={handleChange} />
              <span>VNĐ</span>
            </div>
            {fieldErrors.giaCoBan ? <span className="text-danger">{fieldErrors.giaCoBan}</span> : null}
          </div>

          <div className="master-form-group">
            <label htmlFor="trangThai" className="master-label">Trạng thái</label>
            <select id="trangThai" name="trangThai" value={form.trangThai} className="master-input route-select" onChange={handleChange}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {fieldErrors.trangThai ? <span className="text-danger">{fieldErrors.trangThai}</span> : null}
          </div>
        </div>

        <div className="route-form-actions">
          <Link to={isEditMode ? `/admin/danh-muc/lo-trinh/${id}` : "/admin/danh-muc/lo-trinh"} className="master-outline-btn">
            <BackIcon />
            Hủy
          </Link>
          <button type="submit" className="master-primary-btn" disabled={saving}>
            <SaveIcon />
            {saving ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RouteFormPage;
