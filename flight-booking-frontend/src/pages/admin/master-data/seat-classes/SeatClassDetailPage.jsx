import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { seatClassService } from "../../../../services/seatClassService";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const formatCoefficient = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "—";
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m4 16 4-4 4 3 5-7" />
      <path d="M4 20h16" />
    </svg>
  );
}

function SeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="10" cy="4" r="2.4" />
      <path d="M7.7 7.2h3.1c1 0 1.8.6 2.1 1.5l1.3 4h4.3c.8 0 1.5.7 1.5 1.5v5.3h-2.2v-4.4h-5.4l-1.5-4.5H9.4v4.1h4v2.1H8.7c-.9 0-1.6-.7-1.6-1.6V8c0-.4.3-.8.6-.8Z" />
      <path d="M5.2 10.2h2v8h8.4v2.2H5.2c-1.1 0-2-.9-2-2v-8.2h2Z" />
    </svg>
  );
}

function BarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-7" />
    </svg>
  );
}

function TrashIcon({ fill = "none" }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill} stroke={fill === "none" ? "currentColor" : "none"} strokeWidth="2" aria-hidden="true">
      {fill === "none" ? (
        <>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
        </>
      ) : (
        <path d="M9 3h6l1 2h5v2H3V5h5l1-2Zm-2 6h10l-.8 12H7.8L7 9Zm3 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
      )}
    </svg>
  );
}

function DeleteModal({ item, deleting, error, onClose, onConfirm }) {
  if (!item) return null;

  const linkedCount = Number(item.tongSoGheDangLienKet ?? 0);
  const isBlocked = linkedCount > 0;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, .45)", zIndex: 1040 }} />
      <div className="modal fade master-modal show" style={{ display: "block", position: "fixed", inset: 0, zIndex: 1050, overflowY: "auto" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered master-modal-sm" style={{ margin: "80px auto" }}>
          <div className="modal-content" style={{ background: "#fff" }}>
            <div className="modal-header master-modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="master-modal-title-wrap">
                <span className="master-modal-icon master-modal-icon-danger" aria-hidden="true">
                  <TrashIcon fill="currentColor" />
                </span>
                <h5 className="modal-title">Xóa hạng ghế</h5>
              </div>
              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>×</button>
            </div>

            <div className="modal-body">
              {isBlocked ? (
                <div className="master-blocked-message">
                  <p className="master-modal-text mb-0">
                    Không thể xóa hạng ghế <strong>{item.tenHangGhe}</strong> vì đang được liên kết với <strong>{linkedCount}</strong> ghế máy bay. Vui lòng gỡ liên kết trước khi xóa.
                  </p>
                </div>
              ) : (
                <>
                  <p className="master-modal-text">
                    Bạn có chắc chắn muốn xóa hạng ghế <strong>{item.tenHangGhe}</strong> <span>Hệ số {formatCoefficient(item.heSoGia)}</span>?
                  </p>
                  <p className="master-modal-text mb-0">Dữ liệu này sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                </>
              )}
              {error ? <p className="master-validation">{error}</p> : null}
            </div>

            <div className="modal-footer master-modal-footer">
              <button type="button" className="master-outline-btn" onClick={onClose} disabled={deleting}>Hủy bỏ</button>
              {!isBlocked ? (
                <button type="button" className="master-danger-btn" onClick={onConfirm} disabled={deleting}>
                  {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SeatClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await seatClassService.getById(id);
        if (!ignore) setItem(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tìm thấy hoặc không tải được chi tiết hạng ghế.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  const usageRate = Number(item?.tiLeSuDungTrungBinh ?? 0);
  const usageProgressWidth = useMemo(() => Math.min(100, Math.max(0, usageRate)), [usageRate]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");
      await seatClassService.remove(id);
      navigate("/admin/danh-muc/hang-ghe");
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa hạng ghế này.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page seatclass-detail-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="master-page seatclass-detail-page">
        <div className="master-empty-row">
          <strong>Không thể tải chi tiết hạng ghế.</strong>
          <span>{error || "Dữ liệu không tồn tại."}</span>
          <Link to="/admin/danh-muc/hang-ghe" className="master-outline-btn">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page seatclass-detail-page">
      <div className="seatclass-detail-header">
        <Link to="/admin/danh-muc/hang-ghe" className="seatclass-back-link" aria-label="Quay lại danh sách">
          <BackIcon />
        </Link>

        <div className="seatclass-detail-title">
          <h1>Hạng ghế: {item.tenHangGhe}</h1>
          <p>ID: SC-{String(item.maHangGhe).padStart(3, "0")} • Cập nhật lần cuối: gần đây</p>
        </div>

        <div className="seatclass-detail-actions">
          <Link to={`/admin/danh-muc/hang-ghe/${item.maHangGhe}/sua`} className="master-outline-btn">
            <EditIcon />
            Chỉnh sửa
          </Link>

          <button type="button" className="master-danger-btn seatclass-delete-btn" onClick={() => { setDeleteError(""); setShowDelete(true); }}>
            <TrashIcon />
            Xóa
          </button>
        </div>
      </div>

      <div className="seatclass-detail-grid">
        <section className="seatclass-info-card">
          <div className="seatclass-section-title">
            <span className="seatclass-small-icon" aria-hidden="true">
              <InfoIcon />
            </span>
            <h2>THÔNG TIN HẠNG GHẾ</h2>
          </div>

          <div className="seatclass-info-row">
            <span>Tên Hạng Ghế</span>
            <strong>{item.tenHangGhe}</strong>
          </div>

          <div className="seatclass-price-box">
            <div>
              <span>Hệ số giá cơ bản</span>
              <div>
                <strong>x{formatCoefficient(item.heSoGia)}</strong>
                <small>so với Hạng Phổ thông</small>
              </div>
            </div>
          </div>

          <div className="seatclass-description-detail">
            <span>Mô tả chi tiết</span>
            <p>{item.moTa?.trim() || "Chưa có mô tả cho hạng ghế này."}</p>
          </div>
        </section>

        <aside className="seatclass-stats-panel">
          <div className="seatclass-section-title">
            <span className="seatclass-small-icon" aria-hidden="true">
              <ChartIcon />
            </span>
            <h2>THỐNG KÊ NHANH</h2>
          </div>

          <div className="seatclass-stat-card seatclass-stat-seat">
            <div>
              <span>Tổng số ghế toàn đội bay</span>
              <strong>{numberFormatter.format(item.tongSoGheDangLienKet ?? 0)}</strong>
            </div>
            <span className="seatclass-stat-icon" aria-hidden="true">
              <SeatIcon />
            </span>
          </div>

          <div className="seatclass-stat-card seatclass-stat-usage">
            <div>
              <span>Tần suất sử dụng trung bình</span>
              <strong>{formatCoefficient(usageRate)}%</strong>
              <div className="seatclass-progress">
                <span style={{ width: `${usageProgressWidth}%` }} />
              </div>
              <small>Mục tiêu: 85%</small>
            </div>
            <span className="seatclass-stat-icon" aria-hidden="true">
              <BarIcon />
            </span>
          </div>
        </aside>
      </div>

      <DeleteModal item={showDelete ? item : null} deleting={deleting} error={deleteError} onClose={() => setShowDelete(false)} onConfirm={handleDelete} />
    </div>
  );
}

export default SeatClassDetailPage;
