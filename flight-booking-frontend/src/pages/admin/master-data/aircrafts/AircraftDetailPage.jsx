import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { aircraftService } from "../../../../services/aircraftService";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const getStatusClass = (status) => {
  const value = String(status || "").trim().toLowerCase();

  if (["active", "hoạt động"].includes(value)) return "aircraft-status-active";
  if (["maintenance", "bảo trì", "đang bảo trì"].includes(value)) return "aircraft-status-maintenance";
  if (["inactive", "ngưng hoạt động", "không hoạt động"].includes(value)) return "aircraft-status-inactive";

  return "aircraft-status-default";
};

const getStatusText = (status) => String(status || "").trim() || "Không xác định";

const getAircraftDisplayName = (item) => {
  if (!item) return "---";
  return item.soHieuDangKy || item.dongMayBay || "---";
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

function AirlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 17h18" />
      <path d="M6 17 8 7h8l2 10" />
      <path d="M9 11h6" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 16l20-7-8 8-2 5-3-4-5 1-2-3Z" />
      <path d="M12 17 22 9" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function SeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M7 11V7a4 4 0 0 1 8 0v4" />
      <path d="M5 11h14v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-4Z" />
      <path d="M8 22v-3" />
      <path d="M16 22v-3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13V9" />
      <path d="M12 13l3 2" />
      <path d="M9 2h6" />
    </svg>
  );
}

function DeleteModal({ item, deleting, error, onClose, onConfirm }) {
  if (!item) return null;

  const flightCount = Number(item.tongSoChuyenBay ?? 0);
  const seatCount = Number(item.soGheDaKhaiBao ?? 0);
  const isBlocked = flightCount > 0 || seatCount > 0;

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
                <h5 className="modal-title">Xóa máy bay</h5>
              </div>

              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>×</button>
            </div>

            <div className="modal-body">
              {isBlocked ? (
                <div className="master-blocked-message">
                  <p className="master-modal-text mb-0">
                    Không thể xóa máy bay <strong>{getAircraftDisplayName(item)}</strong>
                    {flightCount > 0 ? <> vì đang được gán cho <strong>{flightCount}</strong> chuyến bay</> : null}
                    {flightCount > 0 && seatCount > 0 ? <> và </> : null}
                    {seatCount > 0 ? <>đã khai báo <strong>{seatCount}</strong> ghế</> : null}. Vui lòng gỡ liên kết trước khi xóa.
                  </p>
                </div>
              ) : (
                <>
                  <p className="master-modal-text">
                    Bạn có chắc chắn muốn xóa máy bay <strong>{getAircraftDisplayName(item)}</strong> <span>{item.hangBay?.tenHangBay || ""}</span>?
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

function InfoItem({ label, icon, children }) {
  return (
    <div className="aircraft-info-item">
      <span>{label}</span>
      <strong>
        {icon}
        {children}
      </strong>
    </div>
  );
}

function AircraftDetailPage() {
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
        const data = await aircraftService.getById(id);
        if (!ignore) setItem(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tìm thấy hoặc không tải được chi tiết máy bay.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  const displayName = useMemo(() => getAircraftDisplayName(item), [item]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");
      await aircraftService.remove(id);
      navigate("/admin/danh-muc/may-bay");
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa máy bay này.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page aircraft-detail-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="master-page aircraft-detail-page">
        <div className="master-empty-row">
          <strong>Không thể tải chi tiết máy bay.</strong>
          <span>{error || "Dữ liệu không tồn tại."}</span>
          <Link to="/admin/danh-muc/may-bay" className="master-outline-btn">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page aircraft-detail-page">
      <div className="aircraft-detail-header">
        <Link to="/admin/danh-muc/may-bay" className="aircraft-back-link" aria-label="Quay lại danh sách">
          <BackIcon />
        </Link>

        <div className="aircraft-detail-title">
          <h1>{displayName}</h1>
          <p>Hồ sơ chi tiết &amp; trạng thái hoạt động</p>
        </div>

        <div className="aircraft-detail-actions">
          <Link to={`/admin/danh-muc/may-bay/${item.maMayBay}/sua`} className="aircraft-outline-btn">
            <EditIcon />
            Chỉnh sửa
          </Link>

          <button type="button" className="aircraft-danger-soft-btn" onClick={() => { setShowDelete(true); setDeleteError(""); }}>
            <TrashIcon />
            Xóa
          </button>
        </div>
      </div>

      <div className="aircraft-detail-grid">
        <section className="aircraft-info-card">
          <h2>Thông tin kỹ thuật</h2>
          <div className="aircraft-info-divider" />

          <div className="aircraft-info-grid">
            <InfoItem label="Hãng bay" icon={<AirlineIcon />}>{item.hangBay?.tenHangBay || "—"}</InfoItem>
            <InfoItem label="Dòng máy bay" icon={<PlaneIcon />}>{item.dongMayBay}</InfoItem>
            <InfoItem label="Số hiệu" icon={<CardIcon />}>{item.soHieuDangKy || "—"}</InfoItem>
            <InfoItem label="Tổng số ghế" icon={<SeatIcon />}>{numberFormatter.format(Number(item.tongSoGhe || 0))} ghế</InfoItem>
            <InfoItem label="Ghế đã khai báo" icon={<SeatIcon />}>{numberFormatter.format(Number(item.soGheDaKhaiBao || 0))} ghế</InfoItem>
            <div className="aircraft-info-item">
              <span>Trạng thái</span>
              <strong>
                <span className={`aircraft-status ${getStatusClass(item.trangThai)}`}>{getStatusText(item.trangThai)}</span>
              </strong>
            </div>
          </div>
        </section>

        <aside className="aircraft-stats-panel">
          <h2>Thống kê hoạt động</h2>

          <div className="aircraft-stat-card aircraft-stat-hours">
            <span className="aircraft-stat-icon" aria-hidden="true"><ClockIcon /></span>
            <div>
              <span>Tổng số giờ bay</span>
              <strong>{numberFormatter.format(Number(item.tongSoGioBay || 0))} <small>giờ</small></strong>
              <p>↗ +{numberFormatter.format(Number(item.soGioBay30NgayGanNhat || 0))} giờ (30 ngày gần nhất)</p>
            </div>
          </div>

          <div className="aircraft-stat-card aircraft-stat-flights">
            <span className="aircraft-stat-icon" aria-hidden="true"><PlaneIcon /></span>
            <div>
              <span>Số chuyến bay đã thực hiện</span>
              <strong>{numberFormatter.format(Number(item.tongSoChuyenBay || 0))} <small>chuyến</small></strong>
              <p>↗ +{numberFormatter.format(Number(item.soChuyenBay30NgayGanNhat || 0))} chuyến (30 ngày gần nhất)</p>
            </div>
          </div>
        </aside>
      </div>

      <DeleteModal item={showDelete ? item : null} deleting={deleting} error={deleteError} onClose={() => setShowDelete(false)} onConfirm={handleDelete} />
    </div>
  );
}

export default AircraftDetailPage;
