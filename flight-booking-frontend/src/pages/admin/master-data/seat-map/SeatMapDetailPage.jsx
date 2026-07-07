import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { seatMapService } from "../../../../services/seatMapService";

function groupSeatsBySeatClass(seats) {
  return seats.reduce((groups, seat) => {
    const groupName = seat.tenHangGhe || "Chưa phân hạng";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(seat);
    return groups;
  }, {});
}

function sortSeatNumber(a, b) {
  return String(a.soGhe).localeCompare(String(b.soGhe), "vi", {
    numeric: true,
    sensitivity: "base",
  });
}

function SeatMapDetailPage() {
  const { aircraftId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await seatMapService.getSeatMap(aircraftId);
      setData(result);
    } catch (err) {
      setError(err.userMessage || "Không tải được sơ đồ ghế.");
    } finally {
      setLoading(false);
    }
  }, [aircraftId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedSeats = useMemo(() => {
    const groups = groupSeatsBySeatClass(data?.seats || []);
    return Object.entries(groups).map(([name, seats]) => [name, [...seats].sort(sortSeatNumber)]);
  }, [data]);

  const handleDeleteSeat = async (seat) => {
    const confirmed = window.confirm(`Xóa ghế ${seat.soGhe}?`);
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");
      const result = await seatMapService.deleteSeat(seat.maGheMayBay);
      setMessage(result.message || `Đã xóa ghế ${seat.soGhe}.`);
      await loadData();
    } catch (err) {
      setError(err.userMessage || "Không xóa được ghế.");
    }
  };

  const handleDeleteAllUnused = async () => {
    const confirmed = window.confirm(
      "Xóa toàn bộ ghế CHƯA được dùng trong chuyến bay nào? Ghế đã dùng sẽ được giữ lại."
    );
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");
      const result = await seatMapService.deleteAllUnused(aircraftId);
      setMessage(result.message || "Đã xóa các ghế chưa dùng.");
      await loadData();
    } catch (err) {
      setError(err.userMessage || "Không xóa được ghế chưa dùng.");
    }
  };

  if (loading) {
    return (
      <div className="master-page seatmap-page">
        <div className="master-table-card">
          <div className="master-empty-row">
            <strong>Đang tải sơ đồ ghế...</strong>
            <span>Vui lòng chờ trong giây lát.</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="master-page seatmap-page">
        <div className="master-alert master-alert-danger">{error || "Không tìm thấy sơ đồ ghế."}</div>
        <Link to="/admin/danh-muc/ghe-may-bay" className="master-outline-btn">Quay lại</Link>
      </div>
    );
  }

  const aircraft = data.mayBay;
  const seats = data.seats || [];

  return (
    <div className="master-page seatmap-page">
      <div className="master-page-head">
        <div>
          <h1>Sơ đồ ghế: {aircraft.dongMayBay} ({aircraft.soHieuDangKy})</h1>
          <p>
            Tổng số ghế khai báo: <strong>{aircraft.tongSoGhe}</strong>
            &nbsp;|&nbsp; Đã sinh: <strong>{data.soGheHienCo || seats.length}</strong> ghế
          </p>
        </div>

        <div className="seatmap-head-actions">
          <Link to={`/admin/danh-muc/ghe-may-bay/${aircraft.maMayBay}/sinh-ghe`} className="master-primary-btn">
            + Sinh thêm ghế
          </Link>
          <Link to="/admin/danh-muc/ghe-may-bay" className="master-outline-btn">Quay lại</Link>
        </div>
      </div>

      {message && <div className="master-alert master-alert-success">{message}</div>}
      {error && <div className="master-alert master-alert-danger">{error}</div>}

      {seats.length > 0 && (
        <div className="seatmap-danger-action">
          <button type="button" className="master-danger-soft-btn" onClick={handleDeleteAllUnused}>
            Xóa toàn bộ ghế chưa dùng
          </button>
        </div>
      )}

      {seats.length === 0 ? (
        <div className="master-table-card">
          <div className="master-empty-row">
            <strong>Máy bay này chưa có ghế nào.</strong>
            <span>Bấm “Sinh thêm ghế” để tạo sơ đồ ghế.</span>
          </div>
        </div>
      ) : (
        groupedSeats.map(([groupName, groupSeats]) => (
          <section className="seatmap-section" key={groupName}>
            <h2>{groupName} <span>({groupSeats.length} ghế)</span></h2>
            <div className="seatmap-grid">
              {groupSeats.map((seat) => (
                <article
                  key={seat.maGheMayBay}
                  className={`seatmap-seat-card ${seat.dangSuDung ? "is-active" : "is-inactive"}`}
                >
                  <strong>{seat.soGhe}</strong>
                  <span>{seat.dangSuDung ? "Hoạt động" : "Ngưng dùng"}</span>
                  <Link to={`/admin/danh-muc/ghe-may-bay/ghe/${seat.maGheMayBay}/sua`} className="master-outline-btn">
                    Sửa
                  </Link>
                  <button type="button" className="master-danger-soft-btn" onClick={() => handleDeleteSeat(seat)}>
                    Xóa
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default SeatMapDetailPage;
