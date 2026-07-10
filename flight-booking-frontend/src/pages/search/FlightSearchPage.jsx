import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { publicFlightService } from "../../services/publicFlightService";
import { authService } from "../../services/authService";
import "../../styles/pages/flight-search.css";

const MaterialIcon = ({ name, fill = false }) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

const formatVND = (n) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n).toLocaleString()) + " VND";

export default function FlightSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("earliest");

  const fromCode = searchParams.get("from") || "";
  const toCode = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  useEffect(() => {
    if (!fromCode || !toCode) return;
    setLoading(true);
    setError(null);
    publicFlightService
      .searchFlights({
        maSanBayDi: fromCode,
        maSanBayDen: toCode,
        ngayDi: date || undefined,
      })
      .then((data) => {
        setFlights(data.flights || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e?.response?.data?.message || "Lỗi tải chuyến bay"))
      .finally(() => setLoading(false));
  }, [fromCode, toCode, date]);

  const sorted = [...flights].sort((a, b) => {
    if (sortBy === "earliest")
      return new Date(a.gioKhoiHanh) - new Date(b.gioKhoiHanh);
    if (sortBy === "cheapest") return a.giaCoBan - b.giaCoBan;
    if (sortBy === "shortest")
      return (new Date(a.gioHaCanh) - new Date(a.gioKhoiHanh)) -
        (new Date(b.gioHaCanh) - new Date(b.gioKhoiHanh));
    return 0;
  });

  const handleSelect = (flight) => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate(`/login?redirect=/search?from=${fromCode}&to=${toCode}&date=${date}`);
      return;
    }
    navigate(`/booking/${flight.maChuyenBay}`, { state: { flight } });
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (dep, arr) => {
    const diff = new Date(arr) - new Date(dep);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h${m > 0 ? m + "m" : ""}`;
  };

  return (
    <div className="fs-page">
      <header className="fs-topbar">
        <button className="fs-back" onClick={() => navigate("/")}>
          <MaterialIcon name="arrow_back" />
        </button>
        <div className="fs-route-summary">
          <span className="fs-route-codes">{fromCode} → {toCode}</span>
          <span className="fs-route-date">{date ? formatDate(date) : ""}</span>
        </div>
      </header>

      <main className="fs-main">
        <div className="fs-header">
          <h1>{fromCode} → {toCode}</h1>
          <p className="fs-subtitle">{total} chuyến bay tìm thấy</p>
        </div>

        <div className="fs-toolbar">
          <label className="fs-sort">
            Sắp xếp:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="earliest">Sớm nhất</option>
              <option value="cheapest">Rẻ nhất</option>
              <option value="shortest">Ngắn nhất</option>
            </select>
          </label>
        </div>

        {loading && <div className="fs-loading">Đang tìm chuyến bay...</div>}
        {error && <div className="fs-error">{error}</div>}

        {!loading && !error && sorted.length === 0 && (
          <div className="fs-empty">Không tìm thấy chuyến bay phù hợp.</div>
        )}

        <div className="fs-list">
          {sorted.map((f) => (
            <div
              key={f.maChuyenBay}
              className="fs-card"
              onClick={() => handleSelect(f)}
            >
              <div className="fs-card-main">
                <div className="fs-time-block">
                  <span className="fs-time">{formatTime(f.gioKhoiHanh)}</span>
                  <span className="fs-airport-code">{f.maSanBayDi}</span>
                </div>
                <div className="fs-duration">
                  <span className="fs-dur-line">{getDuration(f.gioKhoiHanh, f.gioHaCanh)}</span>
                  <div className="fs-connector">
                    <span className="fs-dot" />
                    <span className="fs-line" />
                    <span className="fs-dot" />
                  </div>
                  <span className="fs-direct">Bay thẳng</span>
                </div>
                <div className="fs-time-block fs-right">
                  <span className="fs-time">{formatTime(f.gioHaCanh)}</span>
                  <span className="fs-airport-code">{f.maSanBayDen}</span>
                </div>

                <div className="fs-airline">
                  <span className="fs-airline-name">{f.hangBay}</span>
                  <span className="fs-flight-no">{f.soHieuChuyenBay}</span>
                  <span className="fs-aircraft">{f.dongMayBay}</span>
                </div>
              </div>

              <div className="fs-fare-section">
                {f.hangGhe?.slice(0, 3).map((hg) => (
                  <div key={hg.ten} className="fs-fare-item">
                    <span className="fs-fare-label">{hg.ten}</span>
                    <span className="fs-fare-price">{formatVND(hg.gia)}</span>
                    <button className="fs-choose" onClick={(e) => { e.stopPropagation(); handleSelect(f); }}>
                      Chọn
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
