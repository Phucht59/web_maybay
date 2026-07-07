import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { flightService } from "../../../services/flightService";

const statusClass = (status) => {
  switch (status) {
    case "Scheduled":
      return "flight-status-scheduled";
    case "Delayed":
      return "flight-status-delayed";
    case "Cancelled":
      return "flight-status-cancelled";
    case "Completed":
      return "flight-status-completed";
    default:
      return "flight-status-default";
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

function FlightListPage() {
  const [flights, setFlights] = useState([]);
  const [ticketedFlightIds, setTicketedFlightIds] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [filters, setFilters] = useState({ tuKhoa: "", trangThai: "", maLoTrinh: "" });
  const [appliedFilters, setAppliedFilters] = useState({ tuKhoa: "", trangThai: "", maLoTrinh: "" });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const ticketedFlightIdSet = useMemo(
    () => new Set(ticketedFlightIds.map((id) => Number(id))),
    [ticketedFlightIds]
  );

  const loadFlights = async (page = pagination.page, currentFilters = appliedFilters) => {
    try {
      setLoading(true);
      const result = await flightService.getAll({
        ...currentFilters,
        page,
        pageSize: pagination.pageSize,
      });

      setFlights(result.items);
      setTicketedFlightIds(result.chuyenBayCoVeIds);
      setPagination(result.pagination);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error?.userMessage || "Không thể tải danh sách chuyến bay.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [routes, statuses] = await Promise.all([
          flightService.getRouteOptions(),
          flightService.getStatusOptions(),
        ]);

        setRouteOptions(routes);
        setStatusOptions(statuses);
      } catch {
        setMessage({ type: "danger", text: "Không thể tải dữ liệu bộ lọc chuyến bay." });
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    loadFlights(1, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleClearFilter = () => {
    const emptyFilters = { tuKhoa: "", trangThai: "", maLoTrinh: "" };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleCancel = async (flight) => {
    const confirmed = window.confirm(`Bạn có chắc muốn hủy chuyến bay ${flight.soHieuChuyenBay}?`);
    if (!confirmed) return;

    try {
      setActionLoadingId(flight.maChuyenBay);
      const result = await flightService.cancel(flight.maChuyenBay);
      setMessage({ type: "success", text: result?.message || "Đã hủy chuyến bay." });
      await loadFlights(pagination.page);
    } catch (error) {
      setMessage({ type: "danger", text: error?.userMessage || "Không thể hủy chuyến bay." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (flight) => {
    const hasTicket = ticketedFlightIdSet.has(Number(flight.maChuyenBay));
    if (hasTicket) {
      setMessage({
        type: "danger",
        text: "Không thể xóa vì chuyến bay đã có vé. Hãy dùng chức năng hủy chuyến.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa vĩnh viễn chuyến bay ${flight.soHieuChuyenBay}? Toàn bộ ghế bán của chuyến này cũng sẽ bị xóa.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(flight.maChuyenBay);
      const result = await flightService.remove(flight.maChuyenBay);
      setMessage({ type: "success", text: result?.message || "Đã xóa chuyến bay." });

      const nextPage = flights.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      await loadFlights(nextPage);
    } catch (error) {
      setMessage({ type: "danger", text: error?.userMessage || "Không thể xóa chuyến bay." });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flight-page">
      <div className="flight-page-head">
        <div>
          <h1>Quản lý chuyến bay</h1>
          <p>Theo dõi, lọc và thao tác nhanh các chuyến bay trong hệ thống.</p>
        </div>

        <Link to="/admin/chuyen-bay/them" className="flight-primary-btn">
          <span aria-hidden="true">+</span>
          Thêm chuyến bay
        </Link>
      </div>

      {message.text && (
        <div className={`flight-alert flight-alert-${message.type}`}>{message.text}</div>
      )}

      <form className="flight-filter-bar" onSubmit={handleFilterSubmit}>
        <div className="flight-search-field">
          <span className="flight-field-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>

          <input
            type="text"
            value={filters.tuKhoa}
            className="flight-control"
            placeholder="Tìm kiếm theo số hiệu chuyến bay, máy bay..."
            onChange={(event) => setFilters((prev) => ({ ...prev, tuKhoa: event.target.value }))}
          />
        </div>

        <select
          value={filters.trangThai}
          className="flight-control flight-select"
          onChange={(event) => setFilters((prev) => ({ ...prev, trangThai: event.target.value }))}
        >
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <select
          value={filters.maLoTrinh}
          className="flight-control flight-select"
          onChange={(event) => setFilters((prev) => ({ ...prev, maLoTrinh: event.target.value }))}
        >
          <option value="">Tất cả lộ trình</option>
          {routeOptions.map((route) => (
            <option key={route.value} value={route.value}>
              {route.label}
            </option>
          ))}
        </select>

        <button type="button" className="flight-clear-link" onClick={handleClearFilter}>
          Xóa lọc
        </button>

        <button type="submit" className="flight-filter-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Lọc
        </button>
      </form>

      <div className="flight-table-card">
        <div className="flight-table-wrap">
          <table className="flight-table">
            <thead>
              <tr>
                <th>Số hiệu</th>
                <th>Lộ trình</th>
                <th>Máy bay</th>
                <th>Giờ khởi hành</th>
                <th>Giờ hạ cánh</th>
                <th className="text-end">Giá cơ bản</th>
                <th>Trạng thái</th>
                <th className="text-end"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div className="flight-empty-row">
                      <strong>Đang tải dữ liệu...</strong>
                    </div>
                  </td>
                </tr>
              ) : flights.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="flight-empty-row">
                      <strong>Không tìm thấy chuyến bay phù hợp.</strong>
                      <span>Thử đổi bộ lọc hoặc tạo chuyến bay mới.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                flights.map((flight) => {
                  const hasTicket = ticketedFlightIdSet.has(Number(flight.maChuyenBay));
                  const disabled = actionLoadingId === flight.maChuyenBay;

                  return (
                    <tr key={flight.maChuyenBay}>
                      <td>
                        <Link to={`/admin/chuyen-bay/${flight.maChuyenBay}`} className="flight-code">
                          {flight.soHieuChuyenBay}
                        </Link>
                      </td>

                      <td className="flight-route">
                        {flight.loTrinh?.maSanBayDi} <span>→</span> {flight.loTrinh?.maSanBayDen}
                      </td>

                      <td>
                        <div className="flight-aircraft">{flight.mayBay?.dongMayBay}</div>
                        <small>{flight.mayBay?.soHieuDangKy || "—"}</small>
                      </td>

                      <td>{formatDateTime(flight.gioKhoiHanh)}</td>
                      <td>{formatDateTime(flight.gioHaCanh)}</td>
                      <td className="flight-money">{formatMoney(flight.giaCoBan)}</td>
                      <td>
                        <span className={`flight-status ${statusClass(flight.trangThai)}`}>
                          {flight.trangThai}
                        </span>
                      </td>

                      <td>
                        <div className="flight-actions">
                          <Link
                            to={`/admin/chuyen-bay/${flight.maChuyenBay}`}
                            className="flight-icon-btn flight-view"
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>

                          <Link
                            to={`/admin/chuyen-bay/${flight.maChuyenBay}/sua`}
                            className="flight-icon-btn flight-edit"
                            title="Sửa chuyến bay"
                            aria-label="Sửa chuyến bay"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </Link>

                          {flight.trangThai !== "Cancelled" && (
                            <button
                              type="button"
                              className="flight-icon-btn flight-cancel"
                              title="Hủy chuyến"
                              aria-label="Hủy chuyến"
                              disabled={disabled}
                              onClick={() => handleCancel(flight)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M15 9 9 15M9 9l6 6" />
                              </svg>
                            </button>
                          )}

                          <button
                            type="button"
                            className={`flight-icon-btn flight-delete ${hasTicket ? "disabled" : ""}`}
                            title={hasTicket ? "Không thể xóa vì chuyến bay đã có vé" : "Xóa vĩnh viễn"}
                            aria-label="Xóa vĩnh viễn"
                            disabled={disabled || hasTicket}
                            onClick={() => handleDelete(flight)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flight-form-actions">
          <button
            type="button"
            className="flight-outline-btn"
            disabled={pagination.page <= 1 || loading}
            onClick={() => loadFlights(pagination.page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {pagination.page}/{pagination.totalPages} · {pagination.totalItems} chuyến bay
          </span>
          <button
            type="button"
            className="flight-primary-btn"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => loadFlights(pagination.page + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}

export default FlightListPage;
