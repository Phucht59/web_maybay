import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { aircraftService } from "../../../../services/aircraftService";
import { useDebouncedSearchParams } from "../../../../hooks/useDebouncedSearchParams";

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
  return item.soHieuDangKy ? `${item.dongMayBay} (${item.soHieuDangKy})` : item.dongMayBay;
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
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke={fill === "none" ? "currentColor" : "none"}
      strokeWidth="2"
      aria-hidden="true"
    >
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

  const flightCount = Number(item.soChuyenBayDangLienKet ?? 0);
  const seatCount = Number(item.soGheDaKhaiBao ?? 0);
  const isBlocked = flightCount > 0 || seatCount > 0;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, .45)",
          zIndex: 1040,
        }}
      />

      <div
        className="modal fade master-modal show"
        style={{
          display: "block",
          position: "fixed",
          inset: 0,
          zIndex: 1050,
          overflowY: "auto",
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered master-modal-sm" style={{ margin: "80px auto" }}>
          <div className="modal-content" style={{ background: "#fff" }}>
            <div
              className="modal-header master-modal-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div className="master-modal-title-wrap">
                <span className="master-modal-icon master-modal-icon-danger" aria-hidden="true">
                  <TrashIcon fill="currentColor" />
                </span>
                <h5 className="modal-title">Xóa máy bay</h5>
              </div>

              <button type="button" className="master-icon-btn" aria-label="Đóng" onClick={onClose}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {isBlocked ? (
                <div className="master-blocked-message">
                  <p className="master-modal-text mb-0">
                    Không thể xóa máy bay <strong>{getAircraftDisplayName(item)}</strong>
                    {flightCount > 0 ? (
                      <>
                        {" "}
                        vì đang được gán cho <strong>{flightCount}</strong> chuyến bay
                      </>
                    ) : null}
                    {flightCount > 0 && seatCount > 0 ? <> và </> : null}
                    {seatCount > 0 ? (
                      <>
                        đã khai báo <strong>{seatCount}</strong> ghế
                      </>
                    ) : null}
                    . Vui lòng gỡ liên kết trước khi xóa.
                  </p>
                </div>
              ) : (
                <>
                  <p className="master-modal-text">
                    Bạn có chắc chắn muốn xóa máy bay <strong>{getAircraftDisplayName(item)}</strong>{" "}
                    <span>{item.hangBay?.tenHangBay || ""}</span>?
                  </p>
                  <p className="master-modal-text mb-0">
                    Dữ liệu này sẽ bị xóa vĩnh viễn và không thể khôi phục.
                  </p>
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

function AircraftListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keywordFromUrl = searchParams.get("tuKhoa") || "";
  const pageFromUrl = Math.max(1, Number(searchParams.get("page") || 1));

  const {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
    setSearchTerm,
  } = useDebouncedSearchParams(keywordFromUrl, 350);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    startItem: 0,
    endItem: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const setQuery = ({ tuKhoa = keywordFromUrl, page = 1 } = {}) => {
    const nextParams = {};

    if (tuKhoa?.trim()) {
      nextParams.tuKhoa = tuKhoa.trim();
    }

    if (Number(page) > 1) {
      nextParams.page = String(page);
    }

    setSearchParams(nextParams);
  };

  const loadAircrafts = async (tuKhoa = "", page = 1) => {
    const isFirstLoad = items.length === 0;

    try {
      if (isFirstLoad) {
        setLoading(true);
      }

      setError("");

      const result = await aircraftService.getAll({
        tuKhoa,
        page,
      });

      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách máy bay. Vui lòng kiểm tra backend API.");
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setSearchTerm(keywordFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFromUrl]);

  useEffect(() => {
    loadAircrafts(keywordFromUrl, pageFromUrl);
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

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      setDeleteError("");

      const result = await aircraftService.remove(deleteItem.maMayBay);

      setSuccessMessage(result?.message || `Đã xóa máy bay ${getAircraftDisplayName(deleteItem)}.`);
      setDeleteItem(null);

      await loadAircrafts(keywordFromUrl, pageFromUrl);
    } catch (err) {
      console.error(err);
      setDeleteError(err.userMessage || "Không thể xóa máy bay này.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="master-page aircraft-page">
      <div className="master-page-head">
        <div>
          <h1>Quản lý Máy bay</h1>
          <p>Quản lý đội máy bay, hãng khai thác, số ghế và trạng thái vận hành.</p>
        </div>

        <Link to="/admin/danh-muc/may-bay/them" className="master-primary-btn">
          <span aria-hidden="true">+</span>
          Thêm máy bay
        </Link>
      </div>

      {successMessage ? (
        <div className="master-validation" style={{ color: "#15803D" }}>
          {successMessage}
        </div>
      ) : null}

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
            placeholder="Tìm theo dòng máy bay, số hiệu, hãng bay, trạng thái, tổng số ghế..."
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="master-table-card">
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Dòng máy bay</th>
                <th>Số hiệu ĐK</th>
                <th>Hãng bay</th>
                <th className="aircraft-seat-total-head">Tổng số ghế</th>
                <th className="aircraft-status-head">Trạng thái</th>
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
                      <strong>Không tìm thấy máy bay phù hợp.</strong>
                      <span>Thử đổi từ khóa tìm kiếm hoặc tạo máy bay mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.maMayBay}>
                    <td>
                      <strong className="master-main-text">{item.dongMayBay}</strong>
                    </td>

                    <td>
                      <span className="master-code">{item.soHieuDangKy || "—"}</span>
                    </td>

                    <td className="master-muted-cell">{item.hangBay?.tenHangBay || "—"}</td>

                    <td className="aircraft-seat-total-cell">
                      {numberFormatter.format(Number(item.tongSoGhe || 0))}
                    </td>

                    <td className="aircraft-status-cell">
                      <span className={`aircraft-status ${getStatusClass(item.trangThai)}`}>
                        {getStatusText(item.trangThai)}
                      </span>
                    </td>

                    <td>
                      <div className="master-actions">
                        <Link
                          to={`/admin/danh-muc/may-bay/${item.maMayBay}`}
                          className="master-icon-btn aircraft-view"
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết máy bay"
                        >
                          <EyeIcon />
                        </Link>

                        <Link
                          to={`/admin/danh-muc/may-bay/${item.maMayBay}/sua`}
                          className="master-icon-btn master-edit"
                          title="Sửa máy bay"
                          aria-label="Sửa máy bay"
                        >
                          <EditIcon />
                        </Link>

                        <button
                          type="button"
                          className="master-icon-btn master-delete"
                          title="Xóa máy bay"
                          aria-label="Xóa máy bay"
                          onClick={() => {
                            setDeleteItem(item);
                            setDeleteError("");
                          }}
                        >
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
          <button
            type="button"
            className="master-outline-btn"
            disabled={currentPage <= 1}
            onClick={() => setQuery({ page: currentPage - 1 })}
          >
            Trước
          </button>

          <span>
            Trang {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            className="master-outline-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setQuery({ page: currentPage + 1 })}
          >
            Sau
          </button>
        </div>
      ) : null}

      <DeleteModal
        item={deleteItem}
        deleting={deleting}
        error={deleteError}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default AircraftListPage;