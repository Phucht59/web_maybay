import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../../services/dashboardService";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const timeFilterOptions = [
  { value: "all", label: "Tất cả" },
  { value: "today", label: "Hôm nay" },
  { value: "7days", label: "7 ngày tới" },
  { value: "30days", label: "30 ngày tới" },
  { value: "thismonth", label: "Tháng này" },
];
const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getFlightBadgeClass = (status) => {
  switch (status) {
    case "Scheduled":
      return "flight-badge-scheduled";
    case "Delayed":
      return "flight-badge-delayed";
    case "Cancelled":
      return "flight-badge-cancelled";
    case "Completed":
      return "flight-badge-completed";
    default:
      return "flight-badge-default";
  }
};

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

function AirportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function StatusPill({ children }) {
  return <span className="summary-status-pill">{children}</span>;
}

function SummaryCard({ title, status, value, description, icon }) {
  return (
    <article className="summary-card">
      <div className="summary-card-head">
        <div className="summary-title-stack">
          <h2>{title}</h2>
          {status ? <StatusPill>{status}</StatusPill> : null}
        </div>

        <span className="summary-icon" aria-hidden="true">
          {icon}
        </span>
      </div>

      <div className="summary-number">{numberFormatter.format(value ?? 0)}</div>
      <p>{description}</p>
    </article>
  );
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await dashboardService.getDashboard(timeFilter);

        if (!ignore) setDashboard(data);
      } catch (err) {
        console.error(err);

        if (!ignore) {
          setError("Không tải được dữ liệu dashboard. Vui lòng kiểm tra backend API và đăng nhập lại nếu cần.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [timeFilter]);

  const summary = dashboard?.summary ?? {};
  const upcomingFlights = useMemo(() => dashboard?.chuyenBaySapKhoiHanh ?? [], [dashboard]);

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-empty-state">
          <strong>Đang tải dashboard...</strong>
          <span>Hệ thống đang lấy dữ liệu tổng quan từ API.</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-empty-state">
          <strong>Không thể tải dashboard.</strong>
          <span>{error}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Trung tâm điều hành</p>
          <h1>Tổng quan hệ thống</h1>
          <p>Theo dõi nhanh tình trạng dữ liệu nền và các chuyến bay sắp khởi hành.</p>
        </div>
        <div className="dashboard-filter">
          <select
            id="dashboardTimeFilter"
            value={timeFilter}
            onChange={(event) => setTimeFilter(event.target.value)}
          >
            {timeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-summary-grid">
        <SummaryCard
          title="Tổng số Chuyến bay"
          value={summary.soChuyenBay}
          description="Bao gồm nội địa & quốc tế"
          icon={<PlaneIcon />}
        />

        <SummaryCard
          title="Tổng số Lộ trình"
          status="Đang hoạt động"
          value={summary.soLoTrinhActive}
          description="Tuyến bay khả dụng"
          icon={<RouteIcon />}
        />

        <SummaryCard
          title="Số lượng Máy bay"
          status="Đang hoạt động"
          value={summary.soMayBayActive}
          description="Quy mô đội bay"
          icon={<PlaneIcon />}
        />

        <SummaryCard
          title="Số lượng Sân bay"
          value={summary.soSanBay}
          description="Mạng lưới kết nối"
          icon={<AirportIcon />}
        />
      </div>

      <section className="dashboard-table-card">
        <div className="dashboard-table-head">
          <div>
            <h2>Chuyến bay sắp khởi hành</h2>
            <p>Danh sách các chuyến bay gần nhất cần theo dõi.</p>
          </div>
          <Link to="/admin/chuyen-bay" className="admin-secondary-btn">
            Xem tất cả chuyến bay
          </Link>
        </div>

        {upcomingFlights.length === 0 ? (
          <div className="dashboard-empty-state">
            <strong>Không có chuyến bay sắp khởi hành.</strong>
            <span>Khi có chuyến bay phù hợp, dữ liệu sẽ hiển thị tại đây.</span>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table dashboard-flight-table">
              <thead>
                <tr>
                  <th>Số hiệu</th>
                  <th>Lộ trình</th>
                  <th>Giờ cất cánh</th>
                  <th className="text-end">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {upcomingFlights.map((flight) => (
                  <tr key={flight.maChuyenBay}>
                    <td>
                      <Link className="flight-code-link" to={`/admin/chuyen-bay/${flight.maChuyenBay}`}>
                        {flight.soHieuChuyenBay}
                      </Link>
                    </td>
                    <td className="route-cell">{flight.loTrinhHienThi}</td>
                    <td>{formatDateTime(flight.gioKhoiHanh)}</td>
                    <td className="text-end">
                      <span className={`flight-badge ${getFlightBadgeClass(flight.trangThai)}`}>{flight.trangThai}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default DashboardPage;
