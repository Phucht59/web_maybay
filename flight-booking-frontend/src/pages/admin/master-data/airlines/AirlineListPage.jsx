import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { airlineService } from "../../../../services/airlineService";
import { getAssetUrl } from "../../../../services/assetUrl";
import { useDebouncedSearchParams } from "../../../../hooks/useDebouncedSearchParams";

const getInitial = (name, code) => {
  const source = code || name || "?";
  return source.trim().charAt(0).toUpperCase();
};

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

function AirlineLogo({ item }) {
  const [imageError, setImageError] = useState(false);
  const logoSrc = getAssetUrl(item.logoUrl);

  if (logoSrc && !imageError) {
    return (
      <img
        src={logoSrc}
        alt={`${item.tenHangBay} logo`}
        className="airline-list-logo"
        onError={() => setImageError(true)}
      />
    );
  }

  return <span className="airline-list-logo airline-logo-placeholder">{getInitial(item.tenHangBay, item.maCode)}</span>;
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

function AirlineListPage() {
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

  const loadAirlines = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await airlineService.getAll({ tuKhoa: keywordFromUrl, page: pageFromUrl });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách hãng bay. Vui lòng kiểm tra backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(keywordFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl]);

  useEffect(() => {
    loadAirlines();
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
      const result = await airlineService.remove(deleteItem.maHangBay);
      setSuccessMessage(result?.message || `Đã xóa hãng bay ${deleteItem.maCode}.`);
      setDeleteItem(null);
      await loadAirlines();
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa hãng bay này.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="master-page airline-page">
      <div className="master-page-head">
        <div>
          <h1>Quản lý hãng bay</h1>
          <p>Theo dõi và quản lý danh sách hãng bay được sử dụng trong đội máy bay.</p>
        </div>

        <Link to="/admin/danh-muc/hang-bay/them" className="master-primary-btn">
          <span aria-hidden="true">+</span>
          Thêm hãng bay
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
            placeholder="Tìm theo tên hãng, mã code, quốc gia..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="master-table-card">
        <div className="master-table-wrap">
          <table className="master-table airline-table">
            <thead>
              <tr>
                <th>Hãng bay</th>
                <th>Mã code</th>
                <th>Quốc gia</th>
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="master-empty-row">
                      <strong>Không tìm thấy hãng bay phù hợp.</strong>
                      <span>Thử thay đổi từ khóa tìm kiếm hoặc tạo hãng bay mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.maHangBay}>
                    <td>
                      <div className="airline-name-cell">
                        <AirlineLogo item={item} />
                        <div>
                          <strong>{item.tenHangBay}</strong>
                          <small>{item.maCode}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="airline-code">{item.maCode}</span></td>
                    <td><span className="airline-country-text">{item.quocGia || "—"}</span></td>
                    <td>
                      <div className="master-actions">
                        <Link to={`/admin/danh-muc/hang-bay/${item.maHangBay}`} className="master-icon-btn master-view" title="Xem chi tiết" aria-label="Xem chi tiết hãng bay">
                          <EyeIcon />
                        </Link>
                        <Link to={`/admin/danh-muc/hang-bay/${item.maHangBay}/sua`} className="master-icon-btn master-edit" title="Sửa hãng bay" aria-label="Sửa hãng bay">
                          <EditIcon />
                        </Link>
                        <button type="button" className="master-icon-btn master-delete" title="Xóa hãng bay" aria-label="Xóa hãng bay" onClick={() => { setDeleteItem(item); setDeleteError(""); }}>
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
            <nav className="master-pagination" aria-label="Phân trang hãng bay">
              <button type="button" className={`master-page-link ${currentPage <= 1 ? "disabled" : ""}`} onClick={() => setQuery({ page: currentPage - 1 })} disabled={currentPage <= 1} aria-label="Trang trước">&lt;</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" className={`master-page-link ${page === currentPage ? "active" : ""}`} onClick={() => setQuery({ page })}>
                  {page}
                </button>
              ))}
              <button type="button" className={`master-page-link ${currentPage >= totalPages ? "disabled" : ""}`} onClick={() => setQuery({ page: currentPage + 1 })} disabled={currentPage >= totalPages} aria-label="Trang sau">&gt;</button>
            </nav>

            <div className="master-table-count">
              Hiển thị {pagination.startItem ?? 0}-{pagination.endItem ?? 0} / {pagination.totalCount ?? 0} hãng bay
            </div>
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

export default AirlineListPage;