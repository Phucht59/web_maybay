import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import brandImage from "../../assets/auth/brand.png";
import { authService } from "../../services/authService";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m4.8 7.2 7.2 5.4 7.2-5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.2 5.3 9.4 8c.3.7.1 1.5-.5 2l-.9.7a12.2 12.2 0 0 0 5.3 5.3l.7-.9c.5-.6 1.3-.8 2-.5l2.7 1.2c.8.4 1.2 1.2 1 2.1l-.3 1.4c-.2.8-.9 1.3-1.7 1.3C9.8 20.5 3.5 14.2 3.5 6.3c0-.8.5-1.5 1.3-1.7l1.4-.3c.8-.2 1.7.2 2 1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 10h11A1.5 1.5 0 0 1 19 11.5v6A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-6A1.5 1.5 0 0 1 6.5 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 14v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 18.5 6v5.4c0 4.1-2.7 7.7-6.5 9.1-3.8-1.4-6.5-5-6.5-9.1V6L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2 11.3 14l3.4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ hidden = false }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10.6 10.6A2 2 0 0 0 13.4 13.4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M9.5 5.4A8.7 8.7 0 0 1 12 5c5 0 8.5 4.2 9.6 5.8.3.5.3.9 0 1.4a15 15 0 0 1-2.5 2.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.7 6.8a15.8 15.8 0 0 0-4.3 4c-.3.5-.3.9 0 1.4C3.5 13.8 7 18 12 18c1.2 0 2.3-.2 3.3-.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.4 10.8C3.5 9.2 7 5 12 5s8.5 4.2 9.6 5.8c.3.5.3.9 0 1.4C20.5 13.8 17 18 12 18s-8.5-4.2-9.6-5.8c-.3-.5-.3-.9 0-1.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RegisterPage() {
  const navigate = useNavigate();

  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => document.body.classList.remove("auth-body");
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    if (matKhau !== xacNhanMatKhau) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.register({
        hoTen,
        email,
        soDienThoai: soDienThoai.trim() || null,
        matKhau,
        xacNhanMatKhau,
      });

      localStorage.setItem("accessToken", data.token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          hoTen: data.hoTen,
          vaiTro: data.vaiTro,
          email: data.email,
          soDienThoai: data.soDienThoai || soDienThoai.trim(),
        })
      );

      if (data.vaiTro === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      if (err.response) {
        const responseData = err.response.data;

        if (responseData?.errors) {
          const messages = Object.values(responseData.errors).flat();
          setError(messages.join(" "));
        } else {
          setError(
            responseData?.message ||
              responseData?.title ||
              `Đăng ký thất bại. Mã lỗi: ${err.response.status}`
          );
        }
      } else if (err.request) {
        setError("Không kết nối được tới backend. Kiểm tra backend, CORS hoặc HTTPS certificate.");
      } else {
        setError("Lỗi frontend: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Brand image">
        <img src={brandImage} alt="Flight Booking" className="auth-visual-image" />
      </section>

      <section className="auth-content">
        <div className="auth-card auth-card-register">
          <h1 className="auth-title">Đăng ký</h1>
          <p className="auth-subtitle">Tạo tài khoản để bắt đầu sử dụng hệ thống.</p>

          <form className="auth-form auth-form-register" onSubmit={handleSubmit} noValidate>
            {error && <div className="auth-alert">{error}</div>}

            <div className="mb-3">
              <label className="form-label" htmlFor="hoTen">Họ và tên</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <UserIcon />
                </span>

                <input
                  id="hoTen"
                  className="form-control auth-input"
                  type="text"
                  value={hoTen}
                  placeholder="Nhập họ và tên"
                  autoComplete="name"
                  onChange={(event) => setHoTen(event.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <EmailIcon />
                </span>

                <input
                  id="email"
                  className="form-control auth-input"
                  type="email"
                  value={email}
                  placeholder="example@aerometric.com"
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="soDienThoai">Số điện thoại (không bắt buộc)</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <PhoneIcon />
                </span>

                <input
                  id="soDienThoai"
                  className="form-control auth-input"
                  type="tel"
                  value={soDienThoai}
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  onChange={(event) => setSoDienThoai(event.target.value)}
                />
              </div>
            </div>

            <div className="auth-grid-2 auth-password-grid">
              <div className="mb-3">
                <label className="form-label" htmlFor="matKhau">Mật khẩu</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <LockIcon />
                  </span>

                  <input
                    id="matKhau"
                    className="form-control auth-input"
                    type={showPassword ? "text" : "password"}
                    value={matKhau}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    onChange={(event) => setMatKhau(event.target.value)}
                  />

                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="xacNhanMatKhau">Xác nhận mật khẩu</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <ShieldLockIcon />
                  </span>

                  <input
                    id="xacNhanMatKhau"
                    className="form-control auth-input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={xacNhanMatKhau}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    onChange={(event) => setXacNhanMatKhau(event.target.value)}
                  />

                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    <EyeIcon hidden={!showConfirmPassword} />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>

            <p className="auth-switch">
              Bạn đã có tài khoản?{" "}
              <Link to="/login" className="auth-link">Đăng nhập</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
