import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import brandImage from "../../assets/auth/brand.png";
import { authService } from "../../services/authService";

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

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    try {
      const data = await authService.login(email, matKhau);

      localStorage.setItem("accessToken", data.token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          hoTen: data.hoTen,
          vaiTro: data.vaiTro,
          email: data.email,
        })
      );

      if (data.vaiTro === "Admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        const redirect = searchParams.get("redirect");
        navigate(redirect || "/", { replace: true });
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.title ||
            `Đăng nhập thất bại. Mã lỗi: ${err.response.status}`
        );
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
        <div className="auth-card">
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">Vui lòng đăng nhập để tiếp tục sử dụng hệ thống.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="auth-alert">{error}</div>}

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
                  placeholder="Nhập email"
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

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
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
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

            <div className="auth-row-between">
              <label className="form-check">
                <input className="form-check-input" type="checkbox" />
                <span className="form-check-label">Ghi nhớ đăng nhập</span>
              </label>

              <a href="#forgot-password" className="auth-link">Quên mật khẩu?</a>
            </div>

            <button type="submit" className="btn auth-submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <p className="auth-switch">
              Bạn chưa có tài khoản?{" "}
              <Link to="/register" className="auth-link">Đăng ký</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
