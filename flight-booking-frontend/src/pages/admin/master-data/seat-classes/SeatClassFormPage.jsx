import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { seatClassService } from "../../../../services/seatClassService";

const initialForm = {
  tenHangGhe: "",
  heSoGia: "1",
  moTa: "",
};

function normalizeNumberInput(value) {
  return String(value ?? "").replace(",", ".");
}

function SeatClassFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const pageText = useMemo(() => {
    if (isEditMode) {
      return {
        title: "Sửa hạng ghế",
        description: "Cập nhật tên, hệ số giá và mô tả của hạng ghế.",
        submit: "Lưu dữ liệu",
      };
    }

    return {
      title: "Thêm mới hạng ghế",
      description: "Tạo hạng ghế mới và cấu hình hệ số giá cho hệ thống.",
      submit: "Lưu dữ liệu",
    };
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;

    let ignore = false;

    const loadSeatClass = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await seatClassService.getById(id);

        if (!ignore) {
          setForm({
            tenHangGhe: data.tenHangGhe ?? "",
            heSoGia: data.heSoGia ?? "1",
            moTa: data.moTa ?? "",
          });
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Không tìm thấy hoặc không tải được hạng ghế cần sửa.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSeatClass();

    return () => {
      ignore = true;
    };
  }, [id, isEditMode]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    const name = form.tenHangGhe.trim();
    const coefficient = Number(normalizeNumberInput(form.heSoGia));

    if (!name) nextErrors.tenHangGhe = "Vui lòng nhập tên hạng ghế.";
    if (name.length > 80) nextErrors.tenHangGhe = "Tên hạng ghế không được vượt quá 80 ký tự.";
    if (!Number.isFinite(coefficient) || coefficient <= 0) nextErrors.heSoGia = "Hệ số giá phải lớn hơn 0.";
    if (coefficient > 100) nextErrors.heSoGia = "Hệ số giá không được vượt quá 100.";
    if ((form.moTa ?? "").length > 500) nextErrors.moTa = "Mô tả không được vượt quá 500 ký tự.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validate()) return;

    const payload = {
      tenHangGhe: form.tenHangGhe.trim(),
      heSoGia: Number(normalizeNumberInput(form.heSoGia)),
      moTa: form.moTa.trim() || null,
    };

    try {
      setSaving(true);

      if (isEditMode) {
        await seatClassService.update(id, payload);
      } else {
        await seatClassService.create(payload);
      }

      navigate("/admin/danh-muc/hang-ghe");
    } catch (err) {
      console.error(err);
      setError(err.userMessage || "Không thể lưu hạng ghế. Vui lòng kiểm tra lại dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="master-page">
        <div className="master-empty-row">
          <strong>Đang tải dữ liệu...</strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page">
      <div className="master-page-head master-page-head-compact">
        <div>
          <h1>{pageText.title}</h1>
          <p>{pageText.description}</p>
        </div>
      </div>

      <form className="master-form-card seatclass-form-card" onSubmit={handleSubmit} noValidate>
        {error ? <div className="master-validation">{error}</div> : null}

        <div className="seatclass-form-grid">
          <div className="seatclass-form-left">
            <div className="master-form-group">
              <label htmlFor="tenHangGhe" className="master-label">
                Tên hạng ghế <span>*</span>
              </label>
              <input
                id="tenHangGhe"
                name="tenHangGhe"
                className="master-input"
                value={form.tenHangGhe}
                placeholder="VD: Economy"
                maxLength={80}
                onChange={(event) => updateField("tenHangGhe", event.target.value)}
              />
              {fieldErrors.tenHangGhe ? <span className="text-danger">{fieldErrors.tenHangGhe}</span> : null}
            </div>

            <div className="master-form-group">
              <label htmlFor="heSoGia" className="master-label">
                Hệ số giá <span>*</span>
              </label>
              <input
                id="heSoGia"
                name="heSoGia"
                className="master-input"
                type="number"
                step="0.1"
                min="0.01"
                max="100"
                value={form.heSoGia}
                placeholder="VD: 1.0"
                onChange={(event) => updateField("heSoGia", event.target.value)}
              />
              <span className="master-hint">Giá vé thực tế = Giá cơ bản của chuyến bay × Hệ số giá.</span>
              {fieldErrors.heSoGia ? <span className="text-danger">{fieldErrors.heSoGia}</span> : null}
            </div>
          </div>

          <div className="seatclass-form-right">
            <div className="master-form-group">
              <label htmlFor="moTa" className="master-label">Mô tả</label>
              <textarea
                id="moTa"
                name="moTa"
                className="master-input seatclass-description"
                value={form.moTa}
                placeholder="Nhập mô tả ngắn về hạng ghế, tiện ích hoặc phạm vi áp dụng..."
                maxLength={500}
                onChange={(event) => updateField("moTa", event.target.value)}
              />
              {fieldErrors.moTa ? <span className="text-danger">{fieldErrors.moTa}</span> : null}
            </div>
          </div>
        </div>

        <div className="master-form-actions">
          <Link to="/admin/danh-muc/hang-ghe" className="master-outline-btn">Hủy bỏ</Link>
          <button type="submit" className="master-primary-btn" disabled={saving}>
            {saving ? "Đang lưu..." : pageText.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SeatClassFormPage;
