import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { flightService } from "../../../services/flightService";

const statusClass = (status) => {
  switch (status) {
    case "Scheduled":
      return "flight-status-scheduled";
    case "Delayed":
      return "flight-status-delayed";
    case "Cancelled":
      return "flight-status-cancelled";
    case "Completed":
      return "flight-status-completed";
    default:
      return "flight-status-default";
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN");
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

const calcDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "—";

  const diffMinutes = Math.max(0, Math.round((endDate - startDate) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
};

function FlightDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const flight = detail?.chuyenBay;

  const seatStats = useMemo(() => detail?.thongKeGhe || [], [detail]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const result = await flightService.getById(id);
      setDetail(result);
    } catch (error) {
      setMessage({ type: "danger", text: error?.userMessage || "Không thể tải chi tiết chuyến bay." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!flight) return;
    const confirmed = window.confirm(`Bạn có chắc muốn hủy chuyến bay ${flight.soHieuChuyenBay}?`);
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const result = await flightService.cancel(flight.maChuyenBay);
      setMessage({ type: "success", text: result?.message || "Đã hủy chuyến bay." });
      await loadDetail();
    } catch (error) {
      setMessage({ type: "danger", text: error?.userMessage || "Không thể hủy chuyến bay." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!flight) return;

    if (!detail?.coTheXoa) {
      setMessage({
        type: "danger",
        text: "Không thể xóa vì chuyến bay đã có vé. Hãy dùng chức năng hủy chuyến.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa vĩnh viễn chuyến bay ${flight.soHieuChuyenBay}? Toàn bộ ghế bán của chuyến này cũng sẽ bị xóa.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await flightService.remove(flight.maChuyenBay);
      navigate("/admin/chuyen-bay");
    } catch (error) {
      setMessage({ type: "danger", text: error?.userMessage || "Không thể xóa chuyến bay." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flight-page">
        <div className="flight-empty-row">
          <strong>Đang tải chi tiết chuyến bay...</strong>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="flight-page">
        {message.text && <div className="flight-alert flight-alert-danger">{message.text}</div>}
        <Link to="/admin/chuyen-bay" className="flight-outline-btn">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="flight-page">
      <div className="flight-detail-head">
        <div className="flight-detail-title-wrap">
          <Link to="/admin/chuyen-bay" className="flight-back-btn" aria-label="Quay lại danh sách">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1>
              Chuyến bay {flight.soHieuChuyenBay}
              <span className={`flight-status ${statusClass(flight.trangThai)}`}>{flight.trangThai}</span>
            </h1>
          </div>
        </div>
        <div className="flight-detail-actions">
          <Link to={`/admin/chuyen-bay/${flight.maChuyenBay}/sua`} className="flight-outline-btn">
            Sửa chuyến bay
          </Link>
          {flight.trangThai !== "Cancelled" && (
            <button type="button" className="flight-warning-btn" disabled={actionLoading} onClick={handleCancel}>
              Hủy chuyến
            </button>
          )}
          <button
            type="button"
            className="flight-danger-btn"
            disabled={actionLoading || !detail?.coTheXoa}
            onClick={handleDelete}
            title={!detail?.coTheXoa ? "Không thể xóa vì chuyến bay đã có vé" : "Xóa vĩnh viễn"}
          >
            Xóa
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`flight-alert flight-alert-${message.type}`}>{message.text}</div>
      )}

      <div className="flight-detail-grid">
        <section className="flight-info-card">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M11 12h1v5h1" />
            </svg>
            Thông tin chung
          </h2>

          <div className="flight-description-grid">
            <div><span>Mã chuyến bay</span><strong>{flight.soHieuChuyenBay}</strong></div>
            <div><span>Hãng bay</span><strong>{flight.mayBay?.hangBay || "—"}</strong></div>
            <div><span>Máy bay</span><strong>{flight.mayBay?.dongMayBay || "—"}</strong></div>
            <div><span>Ngày bay</span><strong>{formatDate(flight.gioKhoiHanh)}</strong></div>
            <div><span>Nhà ga</span><strong>{flight.nhaGa || "—"}</strong></div>
            <div><span>Cửa lên</span><strong>{flight.cuaLen || "—"}</strong></div>
            <div><span>Giá cơ bản</span><strong>{formatMoney(flight.giaCoBan)}</strong></div>
            <div><span>Số hiệu ĐK</span><strong>{flight.mayBay?.soHieuDangKy || "—"}</strong></div>
            <div><span>Check-in bắt đầu</span><strong>{formatDateTime(flight.gioBatDauCheckIn)}</strong></div>
            <div><span>Check-in kết thúc</span><strong>{formatDateTime(flight.gioKetThucCheckIn)}</strong></div>
            <div><span>Ghế còn trống</span><strong>{flight.gheConTrong ?? 0}/{flight.tongSoGhe ?? 0}</strong></div>
            <div><span>Vé đã xuất</span><strong>{detail?.coVeDaXuat ? "Có" : "Chưa"}</strong></div>
          </div>

          <div className="flight-route-visual">
            <div>
              <span>Khởi hành</span>
              <strong>{flight.loTrinh?.maSanBayDi || "—"}</strong>
              <small>{flight.loTrinh?.sanBayDi || "—"}, {formatTime(flight.gioKhoiHanh)}</small>
            </div>
            <div className="flight-route-line">
              <span>{calcDuration(flight.gioKhoiHanh, flight.gioHaCanh)}</span>
              <i>✈</i>
              <small>{flight.loTrinh?.loaiDuongBay || "Direct"}</small>
            </div>
            <div className="text-end">
              <span>Đến</span>
              <strong>{flight.loTrinh?.maSanBayDen || "—"}</strong>
              <small>{flight.loTrinh?.sanBayDen || "—"}, {formatTime(flight.gioHaCanh)}</small>
            </div>
          </div>
        </section>

        <aside className="flight-seat-panel">
          <h2>Thống kê ghế</h2>
          {seatStats.length === 0 ? (
            <div className="flight-seat-empty">Chưa có dữ liệu ghế cho chuyến bay này.</div>
          ) : (
            seatStats.map((item) => {
              const lower = String(item.tenHangGhe || "").toLowerCase();
              const typeClass = lower.includes("business") || lower.includes("thương") ? "business" : "economy";

              return (
                <div key={item.tenHangGhe} className={`flight-seat-stat ${typeClass}`}>
                  <div className="flight-seat-stat-head">
                    <strong>{item.tenHangGhe}</strong>
                    <span>{item.tenHangGhe}</span>
                  </div>
                  <div className="flight-seat-stat-body">
                    <div><span>Tổng số</span><strong>{item.tong}</strong></div>
                    <div><span>Còn trống</span><strong className="available">{item.conTrong}</strong></div>
                    <div><span>Đang giữ</span><strong>{item.dangGiu}</strong></div>
                    <div><span>Đã bán</span><strong>{item.daBan}</strong></div>
                  </div>
                </div>
              );
            })
          )}
        </aside>
      </div>
    </div>
  );
}

export default FlightDetailPage;
