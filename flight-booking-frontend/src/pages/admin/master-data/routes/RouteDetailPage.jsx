import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import planeRouteIcon from "../../../../assets/icons/plane-route.png";
import { routeService } from "../../../../services/routeService";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const getRouteText = (item) => `${item?.maSanBayDi || "---"} – ${item?.maSanBayDen || "---"}`;
const getStatusText = (status) => String(status || "").trim() || "Không xác định";
const getStatusClass = (status) => {
  const value = String(status || "").trim().toLowerCase();
  if (["active", "hoạt động"].includes(value)) return "route-status-active";
  if (["inactive", "ngưng hoạt động", "không hoạt động"].includes(value)) return "route-status-inactive";
  if (["maintenance", "bảo trì"].includes(value)) return "route-status-maintenance";
  return "route-status-maintenance";
};

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

function DeleteModal({ item, deleting, error, onClose, onConfirm }) {
  if (!item) return null;

  const linkedCount = Number(item.thongKe?.tongSoChuyenBayDangLienKet ?? item.soChuyenBayDangLienKet ?? 0);
  const isBlocked = linkedCount > 0;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, .45)", zIndex: 1040 }} />
      <div className="modal fade master-modal show" style={{ display: "block", position: "fixed", inset: 0, zIndex: 1050, overflowY: "auto" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered master-modal-sm" style={{ margin: "80px auto" }}>
          <div className="modal-content" style={{ background: "#fff" }}>
            <div className="modal-header master-modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="master-modal-title-wrap">
                <span className="master-modal-icon master-modal-icon-danger" aria-hidden="true"><TrashIcon fill="currentColor" /></span>
                <h5 className="modal-title">Xóa lộ trình</h5>
              </div>
              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>×</button>
            </div>

            <div className="modal-body">
              {isBlocked ? (
                <div className="master-blocked-message">
                  <p className="master-modal-text mb-0">
                    Không thể xóa lộ trình <strong>{getRouteText(item)}</strong> vì đang được dùng cho <strong>{linkedCount}</strong> chuyến bay. Vui lòng gỡ liên kết trước khi xóa.
                  </p>
                </div>
              ) : (
                <>
                  <p className="master-modal-text">Bạn có chắc chắn muốn xóa lộ trình <strong>{getRouteText(item)}</strong>?</p>
                  <p className="master-modal-text mb-0">Dữ liệu này sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                </>
              )}
              {error ? <p className="master-validation">{error}</p> : null}
            </div>

            <div className="modal-footer master-modal-footer">
              <button type="button" className="master-outline-btn" onClick={onClose} disabled={deleting}>Hủy bỏ</button>
              {!isBlocked ? (
                <button type="button" className="master-danger-btn" onClick={onConfirm} disabled={deleting}>{deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}</button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RouteDetailPage() {
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
        const data = await routeService.getById(id);
        if (!ignore) setItem(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tìm thấy hoặc không tải được chi tiết lộ trình.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  const routeTitle = useMemo(() => getRouteText(item), [item]);
  const statistics = item?.thongKe || {};
  const otp = Math.max(0, Math.min(100, Number(statistics.tyLeDungGio ?? 0)));

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");
      await routeService.remove(id);
      navigate("/admin/danh-muc/lo-trinh");
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa lộ trình này.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page route-detail-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="master-page route-detail-page">
        <div className="master-empty-row">
          <strong>{error || "Không tìm thấy lộ trình."}</strong>
          <span>Kiểm tra lại đường dẫn hoặc quay về danh sách lộ trình.</span>
          <Link to="/admin/danh-muc/lo-trinh" className="master-outline-btn">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page route-detail-page">
      <div className="route-detail-header">
        <div>
          <h1>Lộ trình: {routeTitle}</h1>
          <span className={`route-status-pill ${getStatusClass(item.trangThai)}`}>
            <span aria-hidden="true" />
            {getStatusText(item.trangThai)}
          </span>
        </div>

        <div className="route-detail-actions">
          <Link to={`/admin/danh-muc/lo-trinh/${item.maLoTrinh}/sua`} className="route-outline-btn">
            <EditIcon />
            Chỉnh sửa
          </Link>

          <button type="button" className="route-danger-soft-btn" onClick={() => { setShowDelete(true); setDeleteError(""); }}>
            <TrashIcon />
            Xóa
          </button>
        </div>
      </div>

      <section className="route-map-card">
        <div className="route-airport route-airport-left">
          <strong>{item.maSanBayDi}</strong>
          <span>{item.sanBayDi?.tenSanBay || item.maSanBayDi}</span>
          <small>{item.sanBayDi?.thanhPho || "—"}, {item.sanBayDi?.quocGia || "—"}</small>
        </div>

        <div className="route-line-wrap" aria-hidden="true">
          <div className="route-distance-label">
            {item.khoangCachKm ? `${numberFormatter.format(Number(item.khoangCachKm))} km` : "—"}
          </div>
          <div className="route-dashed-line" />
          <span className="route-plane-icon" aria-hidden="true">
            <img src={planeRouteIcon} alt="" />
          </span>
        </div>

        <div className="route-airport route-airport-right">
          <strong>{item.maSanBayDen}</strong>
          <span>{item.sanBayDen?.tenSanBay || item.maSanBayDen}</span>
          <small>{item.sanBayDen?.thanhPho || "—"}, {item.sanBayDen?.quocGia || "—"}</small>
        </div>

        <div className="route-performance">
          <h2>Performance Stats (30 days)</h2>

          <div className="route-performance-grid">
            <div className="route-performance-item">
              <div>
                <span>Số chuyến bay đã thực hiện</span>
                <strong>{numberFormatter.format(Number(statistics.tongSoChuyenBay30NgayGanNhat || 0))}</strong>
              </div>
              <small>↗ theo dữ liệu 30 ngày</small>
            </div>

            <div className="route-performance-item">
              <div>
                <span>Giá vé trung bình</span>
                <strong>{currencyFormatter.format(Number(statistics.giaTrungBinh ?? item.giaCoBan ?? 0))} đ</strong>
              </div>
              <small>→ Giá cơ bản hiện tại</small>
            </div>

            <div className="route-performance-item route-otp-item">
              <div>
                <span>On-Time Performance (OTP)</span>
                <strong>{otp.toLocaleString("vi-VN")}%</strong>
              </div>
              <div className="route-progress">
                <span style={{ width: `${otp}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <DeleteModal item={showDelete ? item : null} deleting={deleting} error={deleteError} onClose={() => setShowDelete(false)} onConfirm={handleDelete} />
    </div>
  );
}

export default RouteDetailPage;
