import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { flightService } from "../../../services/flightService";

const emptyForm = {
  soHieuChuyenBay: "",
  maLoTrinh: "",
  maMayBay: "",
  gioKhoiHanh: "",
  gioHaCanh: "",
  gioBatDauCheckIn: "",
  gioKetThucCheckIn: "",
  nhaGa: "",
  cuaLen: "",
  giaCoBan: "",
  trangThai: "Scheduled",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

function FlightFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [routeOptions, setRouteOptions] = useState([]);
  const [aircraftOptions, setAircraftOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [currentAircraftLabel, setCurrentAircraftLabel] = useState("");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedRoute = useMemo(
    () => routeOptions.find((route) => String(route.value) === String(form.maLoTrinh)),
    [routeOptions, form.maLoTrinh]
  );

  const selectedAircraft = useMemo(
    () => aircraftOptions.find((aircraft) => String(aircraft.value) === String(form.maMayBay)),
    [aircraftOptions, form.maMayBay]
  );

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [routes, aircrafts, statuses] = await Promise.all([
          flightService.getRouteOptions(),
          flightService.getAircraftOptions(),
          flightService.getStatusOptions(),
        ]);

        setRouteOptions(routes);
        setAircraftOptions(aircrafts);
        setStatusOptions(statuses);
      } catch {
        setError("Không thể tải dữ liệu lộ trình, máy bay hoặc trạng thái.");
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadFlight = async () => {
      try {
        setLoading(true);
        const result = await flightService.getById(id);
        const flight = result?.chuyenBay;

        if (!flight) {
          setError("Không tìm thấy chuyến bay.");
          return;
        }

        setForm({
          soHieuChuyenBay: flight.soHieuChuyenBay || "",
          maLoTrinh: flight.maLoTrinh || "",
          maMayBay: flight.maMayBay || "",
          gioKhoiHanh: toDateTimeLocal(flight.gioKhoiHanh),
          gioHaCanh: toDateTimeLocal(flight.gioHaCanh),
          gioBatDauCheckIn: toDateTimeLocal(flight.gioBatDauCheckIn),
          gioKetThucCheckIn: toDateTimeLocal(flight.gioKetThucCheckIn),
          nhaGa: flight.nhaGa || "",
          cuaLen: flight.cuaLen || "",
          giaCoBan: flight.giaCoBan ?? "",
          trangThai: flight.trangThai || "Scheduled",
        });

        setCurrentAircraftLabel(
          `${flight.mayBay?.dongMayBay || "Máy bay"} (${flight.mayBay?.soHieuDangKy || "—"}) - ${flight.mayBay?.hangBay || "—"}`
        );
      } catch (err) {
        setError(err?.userMessage || "Không thể tải thông tin chuyến bay.");
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [id, isEditMode]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload = {
      soHieuChuyenBay: form.soHieuChuyenBay.trim(),
      maLoTrinh: Number(form.maLoTrinh),
      gioKhoiHanh: form.gioKhoiHanh,
      gioHaCanh: form.gioHaCanh,
      nhaGa: form.nhaGa.trim() || null,
      cuaLen: form.cuaLen.trim() || null,
      gioBatDauCheckIn: form.gioBatDauCheckIn || null,
      gioKetThucCheckIn: form.gioKetThucCheckIn || null,
      giaCoBan: Number(form.giaCoBan),
    };

    if (isEditMode) {
      return {
        ...payload,
        trangThai: form.trangThai,
      };
    }

    return {
      ...payload,
      maMayBay: Number(form.maMayBay),
    };
  };

  const validateForm = () => {
    if (!form.soHieuChuyenBay.trim()) return "Vui lòng nhập số hiệu chuyến bay.";
    if (!form.maLoTrinh) return "Vui lòng chọn lộ trình.";
    if (!isEditMode && !form.maMayBay) return "Vui lòng chọn máy bay.";
    if (!form.gioKhoiHanh) return "Vui lòng nhập giờ khởi hành.";
    if (!form.gioHaCanh) return "Vui lòng nhập giờ hạ cánh.";
    if (new Date(form.gioHaCanh) <= new Date(form.gioKhoiHanh)) {
      return "Giờ hạ cánh phải sau giờ khởi hành.";
    }
    if (form.gioBatDauCheckIn && form.gioKetThucCheckIn && new Date(form.gioKetThucCheckIn) <= new Date(form.gioBatDauCheckIn)) {
      return "Giờ kết thúc check-in phải sau giờ bắt đầu check-in.";
    }
    if (!form.giaCoBan || Number(form.giaCoBan) <= 0) return "Vui lòng nhập giá cơ bản lớn hơn 0.";

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();
      const result = isEditMode
        ? await flightService.update(id, payload)
        : await flightService.create(payload);

      const flightId = isEditMode ? id : result?.maChuyenBay;
      navigate(flightId ? `/admin/chuyen-bay/${flightId}` : "/admin/chuyen-bay");
    } catch (err) {
      setError(err?.userMessage || "Không thể lưu thông tin chuyến bay.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flight-page">
        <div className="flight-empty-row">
          <strong>Đang tải thông tin chuyến bay...</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="flight-page">
      <div className="flight-page-head flight-page-head-compact">
        <div>
          <h1>{isEditMode ? "Sửa chuyến bay" : "Thêm mới chuyến bay"}</h1>
          <p>
            {isEditMode
              ? "Cập nhật lịch trình, lộ trình, trạng thái và giá cơ bản của chuyến bay."
              : "Thiết lập thông tin lịch trình, máy bay và giá cơ bản cho chuyến bay mới."}
          </p>
        </div>
      </div>

      {!isEditMode && (
        <div className="flight-info-banner">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M11 12h1v5h1" />
            </svg>
          </span>
          Khi lưu, hệ thống sẽ tự động tạo toàn bộ ghế bán cho chuyến bay này dựa trên sơ đồ ghế của máy bay đã chọn.
        </div>
      )}

      {error && <div className="flight-alert flight-alert-danger">{error}</div>}

      <form className="flight-form-card" onSubmit={handleSubmit}>
        {isEditMode && (
          <>
            <div className="flight-form-section-title">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17 10 7l4 6 3-4 3 8H4Z" />
                </svg>
              </span>
              Lịch trình & Lộ trình
            </div>
          </>
        )}

        <div className="flight-form-grid">
          <div className="flight-form-group">
            <label className="flight-label" htmlFor="soHieuChuyenBay">Số hiệu chuyến bay</label>
            <input
              id="soHieuChuyenBay"
              className="form-control flight-input"
              value={form.soHieuChuyenBay}
              placeholder="VD: VN123"
              maxLength={20}
              onChange={(event) => handleChange("soHieuChuyenBay", event.target.value)}
            />
          </div>

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="maLoTrinh">Lộ trình</label>
            <select
              id="maLoTrinh"
              className="form-control flight-input flight-select-input"
              value={form.maLoTrinh}
              onChange={(event) => handleChange("maLoTrinh", event.target.value)}
            >
              <option value="">Chọn lộ trình...</option>
              {routeOptions.map((route) => (
                <option key={route.value} value={route.value}>
                  {route.label}
                </option>
              ))}
            </select>
            {selectedRoute && (
              <small className="flight-hint">
                {selectedRoute.khoangCachKm ? `${selectedRoute.khoangCachKm.toLocaleString("vi-VN")} km · ` : ""}
                {selectedRoute.loaiDuongBay} · Giá gợi ý {Number(selectedRoute.giaCoBan || 0).toLocaleString("vi-VN")} đ
              </small>
            )}
          </div>

          {isEditMode ? (
            <div className="flight-form-group flight-full">
              <label className="flight-label">
                Máy bay
                <span className="flight-help" title="Sơ đồ ghế đã gắn theo máy bay lúc tạo, không thể đổi">?</span>
              </label>
              <input value={currentAircraftLabel} className="form-control flight-input flight-input-readonly" disabled />
            </div>
          ) : (
            <div className="flight-form-group flight-full">
              <label className="flight-label" htmlFor="maMayBay">Máy bay</label>
              <select
                id="maMayBay"
                className="form-control flight-input flight-select-input"
                value={form.maMayBay}
                onChange={(event) => handleChange("maMayBay", event.target.value)}
              >
                <option value="">Chọn máy bay...</option>
                {aircraftOptions.map((aircraft) => (
                  <option key={aircraft.value} value={aircraft.value}>
                    {aircraft.label}
                  </option>
                ))}
              </select>
              <small className="flight-hint">
                Chỉ liệt kê máy bay Active và đã có sơ đồ ghế.
                {selectedAircraft ? ` Máy bay này đã khai báo ${selectedAircraft.soGheDaKhaiBao} ghế.` : ""}
              </small>
            </div>
          )}

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="gioKhoiHanh">Giờ khởi hành</label>
            <input
              id="gioKhoiHanh"
              className="form-control flight-input"
              type="datetime-local"
              value={form.gioKhoiHanh}
              onChange={(event) => handleChange("gioKhoiHanh", event.target.value)}
            />
          </div>

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="gioHaCanh">Giờ hạ cánh</label>
            <input
              id="gioHaCanh"
              className="form-control flight-input"
              type="datetime-local"
              value={form.gioHaCanh}
              onChange={(event) => handleChange("gioHaCanh", event.target.value)}
            />
          </div>

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="gioBatDauCheckIn">Giờ bắt đầu check-in</label>
            <input
              id="gioBatDauCheckIn"
              className="form-control flight-input"
              type="datetime-local"
              value={form.gioBatDauCheckIn}
              onChange={(event) => handleChange("gioBatDauCheckIn", event.target.value)}
            />
          </div>

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="gioKetThucCheckIn">Giờ kết thúc check-in</label>
            <input
              id="gioKetThucCheckIn"
              className="form-control flight-input"
              type="datetime-local"
              value={form.gioKetThucCheckIn}
              onChange={(event) => handleChange("gioKetThucCheckIn", event.target.value)}
            />
          </div>

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="nhaGa">Nhà ga</label>
            <input
              id="nhaGa"
              className="form-control flight-input"
              value={form.nhaGa}
              placeholder="VD: T1"
              maxLength={40}
              onChange={(event) => handleChange("nhaGa", event.target.value)}
            />
          </div>

          <div className="flight-form-group">
            <label className="flight-label" htmlFor="cuaLen">Cửa lên</label>
            <input
              id="cuaLen"
              className="form-control flight-input"
              value={form.cuaLen}
              placeholder="VD: G4"
              maxLength={20}
              onChange={(event) => handleChange("cuaLen", event.target.value)}
            />
          </div>

          <div className={isEditMode ? "flight-form-group" : "flight-form-group flight-full"}>
            <label className="flight-label" htmlFor="giaCoBan">Giá cơ bản (VNĐ)</label>
            <div className="flight-money-input">
              <input
                id="giaCoBan"
                className="form-control flight-input"
                type="number"
                step="1000"
                min="0"
                value={form.giaCoBan}
                onChange={(event) => handleChange("giaCoBan", event.target.value)}
              />
              <span>VNĐ</span>
            </div>
            {isEditMode && (
              <small className="flight-hint flight-hint-warning">
                Chỉ ghế còn trống sẽ được cập nhật giá mới, ghế đã giữ/đã bán giữ nguyên giá cũ.
              </small>
            )}
          </div>

          {isEditMode && (
            <div className="flight-form-group">
              <label className="flight-label" htmlFor="trangThai">Trạng thái</label>
              <select
                id="trangThai"
                className="form-control flight-input flight-select-input"
                value={form.trangThai}
                onChange={(event) => handleChange("trangThai", event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flight-form-actions">
          <Link to="/admin/chuyen-bay" className="flight-outline-btn">
            {isEditMode ? "Hủy thay đổi" : "Hủy bỏ"}
          </Link>
          <button type="submit" className="flight-primary-btn" disabled={saving}>
            {saving ? "Đang lưu..." : isEditMode ? "Lưu thông tin" : "Lưu chuyến bay"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FlightFormPage;
