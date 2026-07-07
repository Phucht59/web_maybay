import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { airportService } from "../../../../services/airportService";

const numberFormatter = new Intl.NumberFormat("vi-VN");

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

function DeleteModal({ item, deleting, error, onClose, onConfirm }) {
  if (!item) return null;

  const linkedCount = Number(item.thongKe?.soLoTrinhDangLienKet ?? 0);
  const isBlocked = linkedCount > 0;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, .45)", zIndex: 1040 }} />
      <div className="modal fade master-modal airport-modal show" style={{ display: "block", position: "fixed", inset: 0, zIndex: 1050, overflowY: "auto" }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered master-modal-sm" style={{ margin: "80px auto" }}>
          <div className="modal-content" style={{ background: "#fff" }}>
            <div className="modal-header master-modal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="master-modal-title-wrap">
                <span className="master-modal-icon master-modal-icon-danger" aria-hidden="true">
                  <TrashIcon fill="currentColor" />
                </span>
                <h5 className="modal-title">Xóa sân bay</h5>
              </div>
              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>×</button>
            </div>

            <div className="modal-body">
              {isBlocked ? (
                <div className="master-blocked-message">
                  <p className="master-modal-text mb-0">
                    Không thể xóa sân bay <strong>{item.maSanBay}</strong> vì đang được liên kết với <strong>{linkedCount}</strong> lộ trình. Vui lòng gỡ liên kết trước khi xóa.
                  </p>
                </div>
              ) : (
                <>
                  <p className="master-modal-text">
                    Bạn có chắc chắn muốn xóa sân bay <strong>{item.maSanBay}</strong> <span>{item.tenSanBay}</span>?
                  </p>
                  <p className="master-modal-text mb-0">Hành động này sẽ xóa dữ liệu sân bay khỏi hệ thống và không thể khôi phục.</p>
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

function AirportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("khoangThoiGian") || "today";

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
        const data = await airportService.getById(id, { khoangThoiGian: range });
        if (!ignore) setItem(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tìm thấy hoặc không tải được chi tiết sân bay.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [id, range]);

  const stats = item?.thongKe || {};
  const linkedCount = useMemo(() => Number(stats.soLoTrinhDangLienKet ?? 0), [stats.soLoTrinhDangLienKet]);

  const handleRangeChange = (event) => {
    setSearchParams({ khoangThoiGian: event.target.value });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");
      await airportService.remove(id);
      navigate("/admin/danh-muc/san-bay");
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa sân bay này.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page airport-detail-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="master-page airport-detail-page">
        <div className="master-empty-row">
          <strong>Không thể tải chi tiết sân bay.</strong>
          <span>{error || "Dữ liệu không tồn tại."}</span>
          <Link to="/admin/danh-muc/san-bay" className="master-outline-btn">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page airport-detail-page">
      <div className="airport-detail-topline">
        <div className="airport-detail-title">
          <Link to="/admin/danh-muc/san-bay" className="airport-back-link" aria-label="Quay lại danh sách">
            <BackIcon />
          </Link>
          <h1>{item.tenSanBay}</h1>
        </div>

        <div className="airport-detail-actions">
          <Link to={`/admin/danh-muc/san-bay/${item.maSanBay}/sua`} className="master-outline-btn">
            <EditIcon />
            Sửa thông tin
          </Link>
          <button type="button" className="master-danger-soft-btn" onClick={() => { setShowDelete(true); setDeleteError(""); }}>
            <TrashIcon />
            Xóa
          </button>
        </div>
      </div>

      <div className="airport-detail-grid">
        <section className="airport-info-card airport-overview-card">
          <div className="airport-overview-head">
            <h2>Thông tin sân bay</h2>
            <p>Thông tin định danh và vị trí của sân bay.</p>
          </div>

          <div className="airport-overview-grid">
            <div className="airport-info-item airport-code-item">
              <span>Mã sân bay</span>
              <strong>{item.maSanBay}</strong>
            </div>

            <div className="airport-info-item">
              <span>Tên sân bay</span>
              <strong>{item.tenSanBay}</strong>
            </div>

            <div className="airport-info-item">
              <span>Thành phố</span>
              <strong>{item.thanhPho}</strong>
            </div>

            <div className="airport-info-item">
              <span>Quốc gia</span>
              <strong>{item.quocGia}</strong>
            </div>

            <div className="airport-info-item">
              <span>Lộ trình liên kết</span>
              <strong>{numberFormatter.format(linkedCount)} lộ trình</strong>
            </div>
          </div>
        </section>

        <aside className="airport-stats-panel">
          <div className="airport-stats-head">
            <h2>THỐNG KÊ CHUYẾN BAY</h2>
            <select className="master-input airport-range-select" value={range} onChange={handleRangeChange}>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>

          <div className="airport-stat-card airport-stat-departure-card">
            <div>
              <span>Số chuyến bay đi</span>
              <strong>{numberFormatter.format(Number(stats.soChuyenBayDi ?? 0))}</strong>
            </div>
          </div>

          <div className="airport-stat-card airport-stat-arrival-card">
            <div>
              <span>Số chuyến bay đến</span>
              <strong>{numberFormatter.format(Number(stats.soChuyenBayDen ?? 0))}</strong>
            </div>
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

export default AirportDetailPage;
