import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { airlineService } from "../../../../services/airlineService";
import { getAssetUrl } from "../../../../services/assetUrl";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const getInitial = (name, code) => {
  const source = code || name || "?";
  return source.trim().charAt(0).toUpperCase();
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

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 16l20-7-8 8-2 5-3-4-5 1-2-3Z" />
      <path d="M12 17 22 9" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 19V5" />
      <path d="M18 19V5" />
      <circle cx="6" cy="5" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M6 8c0 4 12 4 12 8" />
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

  const linkedCount = Number(item.soMayBayDangLienKet ?? 0);
  const isBlocked = linkedCount > 0;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, .45)", zIndex: 1040 }} />
      <div className="modal fade master-modal airline-modal show" style={{ display: "block", position: "fixed", inset: 0, zIndex: 1050, overflowY: "auto" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered master-modal-sm" style={{ margin: "80px auto" }}>
          <div className="modal-content" style={{ background: "#fff" }}>
            <div className="modal-header master-modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="master-modal-title-wrap">
                <span className="master-modal-icon master-modal-icon-danger" aria-hidden="true">
                  <TrashIcon fill="currentColor" />
                </span>
                <h5 className="modal-title">Xóa hãng bay</h5>
              </div>
              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>×</button>
            </div>

            <div className="modal-body">
              {isBlocked ? (
                <div className="master-blocked-message">
                  <p className="master-modal-text mb-0">
                    Không thể xóa hãng bay <strong>{item.maCode}</strong> vì đang được liên kết với <strong>{linkedCount}</strong> máy bay. Vui lòng gỡ liên kết trước khi xóa.
                  </p>
                </div>
              ) : (
                <>
                  <p className="master-modal-text">
                    Bạn có chắc chắn muốn xóa hãng bay <strong>{item.maCode}</strong> <span>{item.tenHangBay}</span>?
                  </p>
                  <p className="master-modal-text mb-0">Hành động này sẽ xóa dữ liệu hãng bay khỏi hệ thống và không thể khôi phục.</p>
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

function AirlineLogoPanel({ item }) {
  const [imageError, setImageError] = useState(false);
  const logoSrc = getAssetUrl(item.logoUrl);

  if (logoSrc && !imageError) {
    return <img src={logoSrc} alt={`${item.tenHangBay} logo`} onError={() => setImageError(true)} />;
  }

  return <span>{getInitial(item.tenHangBay, item.maCode)}</span>;
}

function AirlineDetailPage() {
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
        const data = await airlineService.getById(id);
        if (!ignore) setItem(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tìm thấy hoặc không tải được chi tiết hãng bay.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  const linkedCount = useMemo(() => Number(item?.soMayBayDangLienKet ?? 0), [item?.soMayBayDangLienKet]);
  const routeCount = useMemo(() => Number(item?.soLoTrinhDangKhaiThac ?? 0), [item?.soLoTrinhDangKhaiThac]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");
      await airlineService.remove(id);
      navigate("/admin/danh-muc/hang-bay");
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa hãng bay này.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page airline-detail-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="master-page airline-detail-page">
        <div className="master-empty-row">
          <strong>Không thể tải chi tiết hãng bay.</strong>
          <span>{error || "Dữ liệu không tồn tại."}</span>
          <Link to="/admin/danh-muc/hang-bay" className="master-outline-btn">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page airline-detail-page">
      <div className="airline-detail-topline">
        <div className="airline-detail-title">
          <Link to="/admin/danh-muc/hang-bay" className="airline-back-link" aria-label="Quay lại danh sách">
            <BackIcon />
          </Link>

          <div>
            <h1>{item.tenHangBay}</h1>
            <p>Thông tin chi tiết và dữ liệu khai thác</p>
          </div>
        </div>

        <div className="airline-detail-actions">
          <Link to={`/admin/danh-muc/hang-bay/${item.maHangBay}/sua`} className="master-outline-btn">
            <EditIcon />
            Chỉnh sửa
          </Link>

          <button type="button" className="master-danger-soft-btn" onClick={() => { setShowDelete(true); setDeleteError(""); }}>
            <TrashIcon />
            Xóa
          </button>
        </div>
      </div>

      <div className="airline-profile-grid">
        <section className="airline-profile-card">
          <div className="airline-logo-panel">
            <AirlineLogoPanel item={item} />
          </div>

          <div className="airline-profile-info">
            <h2>Hồ sơ Hãng bay</h2>

            <div className="airline-profile-fields">
              <div className="airline-info-item">
                <span>Tên hãng</span>
                <strong>{item.tenHangBay}</strong>
              </div>

              <div className="airline-info-item airline-code-item">
                <span>Mã code (IATA)</span>
                <strong>{item.maCode}</strong>
              </div>

              <div className="airline-info-item">
                <span>Quốc gia</span>
                <strong>{item.quocGia || "Chưa cập nhật"}</strong>
              </div>
            </div>
          </div>
        </section>

        <aside className="airline-detail-side">
          <h2 className="airline-stats-title">THỐNG KÊ LIÊN QUAN</h2>

          <div className="airline-stat-card airline-stat-plane">
            <div>
              <span>Máy bay khai thác</span>
              <strong>{numberFormatter.format(linkedCount)}</strong>
              <small>chiếc</small>
            </div>
            <span className="airline-stat-icon" aria-hidden="true">
              <PlaneIcon />
            </span>
          </div>

          <div className="airline-stat-card airline-stat-route">
            <div>
              <span>Số lượng đường bay</span>
              <strong>{numberFormatter.format(routeCount)}</strong>
              <small>tuyến</small>
            </div>
            <span className="airline-stat-icon" aria-hidden="true">
              <RouteIcon />
            </span>
          </div>
        </aside>
      </div>

      <DeleteModal
        item={showDelete ? item : null}
        deleting={deleting}
        error={deleteError}
        onClose={() => { setShowDelete(false); setDeleteError(""); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default AirlineDetailPage;
