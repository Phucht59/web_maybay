import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { seatMapService } from "../../../../services/seatMapService";

function SeatEditPage() {
  const { seatId } = useParams();
  const navigate = useNavigate();
  const [seat, setSeat] = useState(null);
  const [options, setOptions] = useState([]);
  const [formData, setFormData] = useState({ soGhe: "", maHangGhe: "", dangSuDung: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [seatData, seatClassOptions] = await Promise.all([
          seatMapService.getSeatById(seatId),
          seatMapService.getSeatClassOptions(),
        ]);

        if (ignore) return;

        setSeat(seatData);
        setOptions(seatClassOptions);
        setFormData({
          soGhe: seatData.soGhe || "",
          maHangGhe: seatData.maHangGhe || "",
          dangSuDung: Boolean(seatData.dangSuDung),
        });
      } catch (err) {
        if (!ignore) setError(err.userMessage || "Không tải được dữ liệu ghế.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, [seatId]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.soGhe.trim()) {
      setError("Vui lòng nhập số ghế.");
      return;
    }

    if (!formData.maHangGhe) {
      setError("Vui lòng chọn hạng ghế.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await seatMapService.updateSeat(seatId, {
        soGhe: formData.soGhe.trim().toUpperCase(),
        maHangGhe: Number(formData.maHangGhe),
        dangSuDung: Boolean(formData.dangSuDung),
      });
      navigate(`/admin/danh-muc/ghe-may-bay/${seat.maMayBay}`);
    } catch (err) {
      setError(err.userMessage || "Không cập nhật được ghế.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page seatmap-page master-form-page">
        <div className="master-table-card">
          <div className="master-empty-row">
            <strong>Đang tải dữ liệu ghế...</strong>
            <span>Vui lòng chờ trong giây lát.</span>
          </div>
        </div>
      </div>
    );
  }

  if (!seat) {
    return (
      <div className="master-page seatmap-page master-form-page">
        <div className="master-alert master-alert-danger">{error || "Không tìm thấy ghế."}</div>
        <Link to="/admin/danh-muc/ghe-may-bay" className="master-outline-btn">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="master-page seatmap-page master-form-page">
      <div className="master-page-head master-page-head-compact">
        <div>
          <h1>Sửa ghế {seat.soGhe}</h1>
          <p>
            Máy bay: <strong>{seat.tenMayBay} ({seat.soHieuDangKy})</strong>. Cập nhật số ghế, hạng ghế và trạng thái sử dụng.
          </p>
        </div>
      </div>

      <div className="master-form-card seatmap-edit-card">
        <form onSubmit={handleSubmit}>
          {error && <div className="master-validation">{error}</div>}

          <div className="master-form-group">
            <label className="master-label" htmlFor="soGhe">Số ghế</label>
            <input
              id="soGhe"
              value={formData.soGhe}
              onChange={(event) => updateField("soGhe", event.target.value.toUpperCase())}
              className="master-input"
              maxLength="10"
            />
          </div>

          <div className="master-form-group">
            <label className="master-label" htmlFor="maHangGhe">Hạng ghế</label>
            <select
              id="maHangGhe"
              value={formData.maHangGhe}
              onChange={(event) => updateField("maHangGhe", event.target.value)}
              className="master-input"
            >
              <option value="">-- Chọn hạng ghế --</option>
              {options.map((option) => (
                <option key={option.maHangGhe} value={option.maHangGhe}>
                  {option.tenHangGhe} - Hệ số {option.heSoGia}
                </option>
              ))}
            </select>
          </div>

          <label className="seatmap-check-row">
            <input
              type="checkbox"
              checked={formData.dangSuDung}
              onChange={(event) => updateField("dangSuDung", event.target.checked)}
            />
            <span>Ghế đang sử dụng</span>
          </label>

          <div className="master-form-actions">
            <Link to={`/admin/danh-muc/ghe-may-bay/${seat.maMayBay}`} className="master-outline-btn">Hủy</Link>
            <button type="submit" className="master-primary-btn" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SeatEditPage;
