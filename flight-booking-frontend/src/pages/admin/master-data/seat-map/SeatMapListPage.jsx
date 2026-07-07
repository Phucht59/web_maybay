import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { seatMapService } from "../../../../services/seatMapService";

function SeatMapListPage() {
  const [aircrafts, setAircrafts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await seatMapService.getAircraftOverview();
        if (!ignore) setAircrafts(data);
      } catch (err) {
        if (!ignore) setError(err.userMessage || "Không tải được danh sách máy bay.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredAircrafts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return aircrafts;

    return aircrafts.filter((item) => {
      const text = [
        item.dongMayBay,
        item.soHieuDangKy,
        item.trangThai,
        item.hangBay?.tenHangBay,
        item.hangBay?.maCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [aircrafts, keyword]);

  return (
    <div className="master-page seatmap-page">
      <div className="master-page-head">
        <div>
          <h1>Sơ đồ ghế</h1>
          <p>Chọn một máy bay để xem hoặc sinh sơ đồ ghế.</p>
        </div>
      </div>

      <div className="master-toolbar">
        <div className="master-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="master-input"
            placeholder="Tìm theo dòng máy bay, số hiệu đăng ký, hãng bay..."
          />
        </div>
      </div>

      {error && <div className="master-alert master-alert-danger">{error}</div>}

      <div className="master-table-card">
        <div className="master-table-wrap">
          <table className="master-table">
            <thead>
              <tr>
                <th>Dòng máy bay</th>
                <th>Số hiệu ĐK</th>
                <th>Hãng bay</th>
                <th>Trạng thái</th>
                <th className="text-end">Tổng số ghế</th>
                <th className="text-end">Số ghế đã sinh</th>
                <th className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="master-empty-row">
                      <strong>Đang tải dữ liệu...</strong>
                      <span>Vui lòng chờ trong giây lát.</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAircrafts.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="master-empty-row">
                      <strong>Chưa có máy bay để quản lý sơ đồ ghế.</strong>
                      <span>Hãy tạo máy bay trước, sau đó quay lại sinh ghế.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAircrafts.map((aircraft) => {
                  const generatedSeats = aircraft.soGheHienCo || 0;
                  const totalSeats = aircraft.tongSoGhe || 0;
                  const isMatched = generatedSeats === totalSeats;

                  return (
                    <tr key={aircraft.maMayBay}>
                      <td><strong>{aircraft.dongMayBay}</strong></td>
                      <td><span className="master-code">{aircraft.soHieuDangKy}</span></td>
                      <td>{aircraft.hangBay?.tenHangBay || "—"}</td>
                      <td>{aircraft.trangThai || "—"}</td>
                      <td className="master-money">{totalSeats}</td>
                      <td className="master-money">
                        {generatedSeats}
                        <span className={`seatmap-status ${isMatched ? "seatmap-status-ok" : "seatmap-status-warning"}`}>
                          {isMatched ? "Khớp" : "Chưa khớp"}
                        </span>
                      </td>
                      <td>
                        <div className="master-actions seatmap-actions">
                          <Link to={`/admin/danh-muc/ghe-may-bay/${aircraft.maMayBay}`} className="master-outline-btn">
                            Xem
                          </Link>
                          <Link to={`/admin/danh-muc/ghe-may-bay/${aircraft.maMayBay}/sinh-ghe`} className="master-primary-btn">
                            Sinh ghế
                          </Link>
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
    </div>
  );
}

export default SeatMapListPage;
