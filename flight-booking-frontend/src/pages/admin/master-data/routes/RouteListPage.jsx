import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { routeService } from "../../../../services/routeService";
import { useDebouncedSearchParams } from "../../../../hooks/useDebouncedSearchParams";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

const getRouteText = (item) => `${item?.maSanBayDi || "---"} → ${item?.maSanBayDen || "---"}`;
const getStatusText = (status) => String(status || "").trim() || "Không xác định";
const getRouteTypeText = (type) => {
  const value = String(type || "").trim();

  if (value === "Domestic") return "Nội địa";
  if (value === "International") return "Quốc tế";

  return value || "—";
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

  const linkedCount = Number(item.soChuyenBayDangLienKet ?? item.thongKe?.tongSoChuyenBayDangLienKet ?? 0);
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
                  <p className="master-modal-text">
                    Bạn có chắc chắn muốn xóa lộ trình <strong>{getRouteText(item)}</strong> <span>{item.loaiDuongBay || ""}</span>?
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

function RouteListPage() {
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

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await routeService.getAll({ tuKhoa: keywordFromUrl, page: pageFromUrl });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách lộ trình. Vui lòng kiểm tra backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(keywordFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl]);

  useEffect(() => {
    loadRoutes();
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
      const result = await routeService.remove(deleteItem.maLoTrinh);
      setSuccessMessage(result?.message || `Đã xóa lộ trình ${getRouteText(deleteItem)}.`);
      setDeleteItem(null);
      await loadRoutes();
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa lộ trình này.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="master-page route-page">
      <div className="master-page-head">
        <div>
          <h1>Quản lý Lộ trình</h1>
          <p>Quản lý tuyến bay, giá cơ bản, khoảng cách và trạng thái khai thác.</p>
        </div>

        <Link to="/admin/danh-muc/lo-trinh/them" className="master-primary-btn">
          <span aria-hidden="true">+</span>
          Thêm lộ trình
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
            placeholder="Tìm kiếm theo sân bay, thành phố, loại đường bay..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="master-table-card">
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Lộ trình</th>
                <th className="text-end">Giá cơ bản</th>
                <th className="route-distance-head">Khoảng cách</th>
                <th className="route-type-head">Loại đường bay</th>
                <th className="route-status-head">Trạng thái</th>
                <th className="text-end"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="master-empty-row">
                      <strong>Đang tải dữ liệu...</strong>
                      <span>Vui lòng chờ trong giây lát.</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="master-empty-row">
                      <strong>Không tìm thấy lộ trình phù hợp.</strong>
                      <span>Thử đổi từ khóa tìm kiếm hoặc tạo lộ trình mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.maLoTrinh}>
                    <td>
                      <div className="master-route-cell">
                        <strong>{item.maSanBayDi}</strong>
                        <span>→</span>
                        <strong>{item.maSanBayDen}</strong>
                      </div>
                      <small className="master-table-subtext">
                        {item.sanBayDi?.thanhPho || "—"} → {item.sanBayDen?.thanhPho || "—"}
                      </small>
                    </td>
                    <td className="master-money">{currencyFormatter.format(Number(item.giaCoBan || 0))} đ</td>
                    <td className="route-distance-cell">{item.khoangCachKm ? `${numberFormatter.format(Number(item.khoangCachKm))} km` : "—"}</td>
                    <td className="route-type-cell">{getRouteTypeText(item.loaiDuongBay)}</td>
                    <td className="route-status-cell">
                      <span className={`master-status master-status-${String(item.trangThai || "").toLowerCase()}`}>{getStatusText(item.trangThai)}</span>
                    </td>
                    <td>
                      <div className="master-actions">
                        <Link to={`/admin/danh-muc/lo-trinh/${item.maLoTrinh}`} className="master-icon-btn route-view" title="Xem chi tiết" aria-label="Xem chi tiết lộ trình">
                          <EyeIcon />
                        </Link>
                        <Link to={`/admin/danh-muc/lo-trinh/${item.maLoTrinh}/sua`} className="master-icon-btn master-edit" title="Sửa lộ trình" aria-label="Sửa lộ trình">
                          <EditIcon />
                        </Link>
                        <button type="button" className="master-icon-btn master-delete" title="Xóa lộ trình" aria-label="Xóa lộ trình" onClick={() => { setDeleteItem(item); setDeleteError(""); }}>
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

      {totalPages > 1 ? (
        <div className="master-pagination">
          <button type="button" className="master-outline-btn" disabled={currentPage <= 1} onClick={() => setQuery({ page: currentPage - 1 })}>Trước</button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button type="button" className="master-outline-btn" disabled={currentPage >= totalPages} onClick={() => setQuery({ page: currentPage + 1 })}>Sau</button>
        </div>
      ) : null}

      <DeleteModal item={deleteItem} deleting={deleting} error={deleteError} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} />
    </div>
  );
}

export default RouteListPage;