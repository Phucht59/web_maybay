import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { airportService } from "../../../../services/airportService";
import { useDebouncedSearchParams } from "../../../../hooks/useDebouncedSearchParams";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
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

  const linkedCount = Number(item.soLoTrinhDangLienKet ?? 0);
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

function AirportListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get("tuKhoa") ?? "";
  const pageFromUrl = Number(searchParams.get("page") ?? 1);

  const {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
    setSearchTerm,
  } = useDebouncedSearchParams(keywordFromUrl, 350);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0, startItem: 0, endItem: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadAirports = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await airportService.getAll({ tuKhoa: keywordFromUrl, page: pageFromUrl });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách sân bay. Vui lòng kiểm tra backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(keywordFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl]);

  useEffect(() => {
    loadAirports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl, pageFromUrl]);

  useEffect(() => {
    const nextKeyword = debouncedSearchTerm.trim();
    const currentKeyword = keywordFromUrl.trim();

    if (nextKeyword === currentKeyword) {
      return;
    }

    const nextParams = {};
    if (nextKeyword) {
      nextParams.tuKhoa = nextKeyword;
    }

    setSearchParams(nextParams, { replace: true });
  }, [debouncedSearchTerm, keywordFromUrl, setSearchParams]);

  const totalPages = useMemo(() => Math.max(1, Number(pagination?.totalPages ?? 1)), [pagination]);
  const currentPage = useMemo(() => Math.max(1, Number(pagination?.page ?? 1)), [pagination]);

  const setQuery = ({ tuKhoa = keywordFromUrl, page = 1 } = {}) => {
    const nextParams = {};
    if (tuKhoa?.trim()) nextParams.tuKhoa = tuKhoa.trim();
    if (Number(page) > 1) nextParams.page = String(page);
    setSearchParams(nextParams);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError("");
      const result = await airportService.remove(deleteItem.maSanBay);
      setSuccessMessage(result?.message || `Đã xóa sân bay ${deleteItem.maSanBay}.`);
      setDeleteItem(null);
      await loadAirports();
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa sân bay này.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="master-page airport-page">
      <div className="master-page-head">
        <div>
          <h1>Quản lý sân bay</h1>
          <p>Theo dõi và quản lý danh sách sân bay được sử dụng trong lộ trình bay.</p>
        </div>

        <Link to="/admin/danh-muc/san-bay/them" className="master-primary-btn">
          <span aria-hidden="true">+</span>
          Thêm sân bay
        </Link>
      </div>

      {successMessage ? <div className="master-validation" style={{ color: "#15803D" }}>{successMessage}</div> : null}
      {error ? <div className="master-validation">{error}</div> : null}

      <div className="master-toolbar master-toolbar-search-only">
        <div className="master-search-field">
          <span className="master-field-icon" aria-hidden="true"><SearchIcon /></span>
          <input
            type="text"
            value={searchTerm}
            className="master-control"
            placeholder="Tìm theo mã, tên sân bay, thành phố..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="master-table-card">
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Mã sân bay</th>
                <th>Tên sân bay</th>
                <th>Thành phố</th>
                <th>Quốc gia</th>
                <th className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="master-empty-row">
                      <strong>Đang tải dữ liệu...</strong>
                      <span>Vui lòng chờ trong giây lát.</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="master-empty-row">
                      <strong>Không tìm thấy sân bay phù hợp.</strong>
                      <span>Thử thay đổi từ khóa tìm kiếm hoặc tạo sân bay mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.maSanBay}>
                    <td><span className="airport-code">{item.maSanBay}</span></td>
                    <td>{item.tenSanBay}</td>
                    <td>{item.thanhPho}</td>
                    <td><span className="airport-country-text">{item.quocGia}</span></td>
                    <td>
                      <div className="master-actions">
                        <Link to={`/admin/danh-muc/san-bay/${item.maSanBay}`} className="master-icon-btn master-view" title="Xem chi tiết" aria-label="Xem chi tiết sân bay">
                          <EyeIcon />
                        </Link>
                        <Link to={`/admin/danh-muc/san-bay/${item.maSanBay}/sua`} className="master-icon-btn master-edit" title="Sửa sân bay" aria-label="Sửa sân bay">
                          <EditIcon />
                        </Link>
                        <button type="button" className="master-icon-btn master-delete" title="Xóa sân bay" aria-label="Xóa sân bay" onClick={() => { setDeleteItem(item); setDeleteError(""); }}>
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

        {totalPages > 1 ? (
          <div className="master-table-footer">
            <nav className="master-pagination" aria-label="Phân trang sân bay">
              <button type="button" className={`master-page-link ${currentPage <= 1 ? "disabled" : ""}`} onClick={() => setQuery({ page: currentPage - 1 })} disabled={currentPage <= 1} aria-label="Trang trước">&lt;</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" className={`master-page-link ${page === currentPage ? "active" : ""}`} onClick={() => setQuery({ page })}>
                  {page}
                </button>
              ))}
              <button type="button" className={`master-page-link ${currentPage >= totalPages ? "disabled" : ""}`} onClick={() => setQuery({ page: currentPage + 1 })} disabled={currentPage >= totalPages} aria-label="Trang sau">&gt;</button>
            </nav>
          </div>
        ) : null}
      </div>

      <DeleteModal
        item={deleteItem}
        deleting={deleting}
        error={deleteError}
        onClose={() => { setDeleteItem(null); setDeleteError(""); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default AirportListPage;