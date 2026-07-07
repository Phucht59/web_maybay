import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { seatMapService } from "../../../../services/seatMapService";

function normalizeColumns(value) {
  return Array.from(new Set(String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").split(""))).join("");
}

function countSeats(row) {
  const rowCount = Number(row.soHang) || 0;
  const colCount = normalizeColumns(row.cotGhe).length;
  return rowCount > 0 ? rowCount * colCount : 0;
}

function SeatMapGeneratePage() {
  const { aircraftId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await seatMapService.getGenerateTemplate(aircraftId);
        if (ignore) return;

        setTemplate(result);
        setRows(
          (result.rows || []).map((row) => ({
            maHangGhe: row.maHangGhe,
            tenHangGhe: row.tenHangGhe,
            heSoGia: row.heSoGia,
            soHangBatDau: row.soHangBatDau ?? 1,
            soHang: row.soHang ?? 0,
            cotGhe: row.cotGhe || "ABCDEF",
          }))
        );
      } catch (err) {
        if (!ignore) setError(err.userMessage || "Không tải được cấu hình sinh ghế.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadTemplate();
    return () => {
      ignore = true;
    };
  }, [aircraftId]);

  const totalPreviewSeats = useMemo(() => rows.reduce((sum, row) => sum + countSeats(row), 0), [rows]);

  const updateRow = (index, field, value) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: field === "cotGhe" ? value : Number(value),
            }
          : row
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        maMayBay: Number(aircraftId),
        rows: rows.map((row) => ({
          maHangGhe: Number(row.maHangGhe),
          soHangBatDau: Number(row.soHangBatDau) || 1,
          soHang: Number(row.soHang) || 0,
          cotGhe: normalizeColumns(row.cotGhe) || "ABCDEF",
        })),
      };

      await seatMapService.generateSeats(aircraftId, payload);
      navigate(`/admin/danh-muc/ghe-may-bay/${aircraftId}`);
    } catch (err) {
      setError(err.userMessage || "Không sinh được sơ đồ ghế.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page seatmap-page master-form-page">
        <div className="master-table-card">
          <div className="master-empty-row">
            <strong>Đang tải cấu hình sinh ghế...</strong>
            <span>Vui lòng chờ trong giây lát.</span>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="master-page seatmap-page master-form-page">
        <div className="master-alert master-alert-danger">{error || "Không tìm thấy máy bay."}</div>
        <Link to="/admin/danh-muc/ghe-may-bay" className="master-outline-btn">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="master-page seatmap-page master-form-page">
      <div className="master-page-head master-page-head-compact">
        <div>
          <h1>Sinh sơ đồ ghế: {template.tenMayBay}</h1>
          <p>
            Tổng số ghế khai báo: <strong>{template.tongSoGheTheoMayBay}</strong>
            &nbsp;|&nbsp; Đã có sẵn: <strong>{template.soGheHienCo}</strong> ghế
            &nbsp;|&nbsp; Dự kiến sinh thêm: <strong>{totalPreviewSeats}</strong> ghế
          </p>
        </div>
      </div>

      <div className="master-form-card seatmap-generate-card">
        <form onSubmit={handleSubmit}>
          {error && <div className="master-validation">{error}</div>}

          <p className="seatmap-note">
            Với mỗi hạng ghế muốn sinh, nhập <strong>số hàng</strong> và <strong>cột ghế</strong>
            {" "}(VD: “ABCDEF” → sinh 6 ghế/hàng: 1A, 1B, 1C...). Để “Số hàng” = 0 nếu không muốn sinh hạng ghế đó ở lượt này.
          </p>

          <div className="master-table-card seatmap-inner-table">
            <div className="master-table-wrap">
              <table className="master-table">
                <thead>
                  <tr>
                    <th>Hạng ghế</th>
                    <th>Hàng bắt đầu</th>
                    <th>Số hàng</th>
                    <th>Cột ghế</th>
                    <th className="text-end">Số ghế sẽ sinh</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.maHangGhe}>
                      <td><strong>{row.tenHangGhe}</strong></td>
                      <td>
                        <input
                          value={row.soHangBatDau}
                          onChange={(event) => updateRow(index, "soHangBatDau", event.target.value)}
                          className="master-input seatmap-number-input"
                          type="number"
                          min="1"
                        />
                      </td>
                      <td>
                        <input
                          value={row.soHang}
                          onChange={(event) => updateRow(index, "soHang", event.target.value)}
                          className="master-input seatmap-number-input"
                          type="number"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          value={row.cotGhe}
                          onChange={(event) => updateRow(index, "cotGhe", event.target.value.toUpperCase())}
                          className="master-input seatmap-column-input"
                          placeholder="VD: ABCDEF"
                        />
                      </td>
                      <td className="master-money"><span className="seat-count">{countSeats(row)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="master-form-actions">
            <Link to={`/admin/danh-muc/ghe-may-bay/${aircraftId}`} className="master-outline-btn">Hủy</Link>
            <button type="submit" className="master-primary-btn" disabled={saving}>
              {saving ? "Đang sinh..." : "Sinh ghế"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SeatMapGeneratePage;
