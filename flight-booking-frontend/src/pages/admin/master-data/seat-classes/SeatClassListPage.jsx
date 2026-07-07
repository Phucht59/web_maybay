import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { seatClassService } from "../../../../services/seatClassService";
import { useDebouncedSearchParams } from "../../../../hooks/useDebouncedSearchParams";

const formatCoefficient = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "—";
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
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

  const linkedCount = Number(item.soGheDangLienKet ?? 0);
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
              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>
                ×
              </button>
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
              <button type="button" className="master-outline-btn" onClick={onClose} disabled={deleting}>
                Hủy bỏ
              </button>

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

function SeatClassListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get("tuKhoa") ?? "";

  const {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
    setSearchTerm,
  } = useDebouncedSearchParams(keywordFromUrl, 350);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadSeatClasses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await seatClassService.getAll({ tuKhoa: keywordFromUrl });
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách hạng ghế. Vui lòng kiểm tra backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(keywordFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl]);

  useEffect(() => {
    loadSeatClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl]);

  useEffect(() => {
    const nextKeyword = debouncedSearchTerm.trim();
    const currentKeyword = keywordFromUrl.trim();

    if (nextKeyword === currentKeyword) {
      return;
    }

    if (nextKeyword) {
      setSearchParams({ tuKhoa: nextKeyword }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedSearchTerm, keywordFromUrl, setSearchParams]);

  const totalItems = useMemo(() => items.length, [items]);

  const handleClear = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError("");
      const result = await seatClassService.remove(deleteItem.maHangGhe);
      setSuccessMessage(result?.message || `Đã xóa hạng ghế ${deleteItem.tenHangGhe}.`);
      setDeleteItem(null);
      await loadSeatClasses();
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa hạng ghế này.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="master-page seatclass-page">
      <div className="master-page-head">
        <div>
          <h1>Quản lý Hạng ghế</h1>
          <p>Quản lý các hạng ghế và hệ số giá áp dụng khi sinh ghế bán theo chuyến.</p>
        </div>

        <Link to="/admin/danh-muc/hang-ghe/them" className="master-primary-btn">
          <span aria-hidden="true">+</span>
          Thêm hạng ghế
        </Link>
      </div>

      {successMessage ? <div className="master-validation" style={{ color: "#15803D" }}>{successMessage}</div> : null}
      {error ? <div className="master-validation">{error}</div> : null}

      <div className="master-toolbar master-toolbar-search-only">
        <div className="master-search-field">
          <span className="master-field-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={searchTerm}
            className="master-control"
            placeholder="Tìm kiếm theo tên hạng ghế, mô tả..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="master-table-card">
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Tên hạng ghế</th>
                <th className="seatclass-price-head">Hệ số giá</th>
                <th>Mô tả</th>
                <th className="text-end"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">
                    <div className="master-empty-row">
                      <strong>Đang tải dữ liệu...</strong>
                      <span>Vui lòng chờ trong giây lát.</span>
                    </div>
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="master-empty-row">
                      <strong>Không tìm thấy hạng ghế phù hợp.</strong>
                      <span>Thử đổi từ khóa tìm kiếm hoặc tạo hạng ghế mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.maHangGhe}>
                    <td>
                      <span className="master-code">{item.tenHangGhe}</span>
                    </td>
                    <td className="master-money seatclass-price-cell">{formatCoefficient(item.heSoGia)}</td>
                    <td className="master-muted-cell seatclass-description-cell">{item.moTa?.trim() || "—"}</td>
                    <td>
                      <div className="master-actions">
                        <Link to={`/admin/danh-muc/hang-ghe/${item.maHangGhe}`} className="master-icon-btn master-view" title="Xem chi tiết" aria-label="Xem chi tiết hạng ghế">
                          <EyeIcon />
                        </Link>

                        <Link to={`/admin/danh-muc/hang-ghe/${item.maHangGhe}/sua`} className="master-icon-btn master-edit" title="Sửa hạng ghế" aria-label="Sửa hạng ghế">
                          <EditIcon />
                        </Link>

                        <button type="button" className="master-icon-btn master-delete" title="Xóa hạng ghế" aria-label="Xóa hạng ghế" onClick={() => { setDeleteError(""); setDeleteItem(item); }}>
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteModal item={deleteItem} deleting={deleting} error={deleteError} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />
    </div>
  );
}

export default SeatClassListPage;