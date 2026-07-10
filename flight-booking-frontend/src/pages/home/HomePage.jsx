import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { publicFlightService } from "../../services/publicFlightService";
import "../../styles/pages/home.css";
import "../../styles/pages/flight-selection.css";

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

const NAV_ITEMS = [
  { icon: "explore", label: "Khám Phá" },
  { icon: "confirmation_number", label: "Mua vé", active: true },
  { icon: "card_membership", label: "Dịch vụ bổ trợ" },
  { icon: "map", label: "Hành trình" },
  { icon: "flight_takeoff", label: "Trải nghiệm bay" },
  { icon: "star", label: "Lotusmiles" },
];

function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const topBarRef = useRef(null);
  const navigate = useNavigate();

  const user = authService.getCurrentUser();
  const isLoggedIn = authService.isAuthenticated();

  // Booking search state
  const [expanded, setExpanded] = useState(false);
  const [fromAirport, setFromAirport] = useState(null);
  const [toAirport, setToAirport] = useState(null);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [showFromSug, setShowFromSug] = useState(false);
  const [showToSug, setShowToSug] = useState(false);

  // All airports loaded once
  const [allAirports, setAllAirports] = useState([]);
  const [airportsLoaded, setAirportsLoaded] = useState(false);

  // Visible suggestions (filtered, max 10)
  const VISIBLE_LIMIT = 10;

  const fromSug = useMemo(() => {
    if (!fromInput || !fromInput.trim()) {
      return allAirports.slice(0, VISIBLE_LIMIT);
    }
    const kw = normalize(fromInput);
    return allAirports
      .filter((ap) =>
        normalize(ap.maSanBay).includes(kw) ||
        normalize(ap.tenSanBay).includes(kw) ||
        normalize(ap.thanhPho).includes(kw) ||
        normalize(ap.quocGia).includes(kw)
      )
      .slice(0, VISIBLE_LIMIT);
  }, [fromInput, allAirports]);

  const toSug = useMemo(() => {
    if (!toInput || !toInput.trim()) {
      return allAirports.slice(0, VISIBLE_LIMIT);
    }
    const kw = normalize(toInput);
    return allAirports
      .filter((ap) =>
        normalize(ap.maSanBay).includes(kw) ||
        normalize(ap.tenSanBay).includes(kw) ||
        normalize(ap.thanhPho).includes(kw) ||
        normalize(ap.quocGia).includes(kw)
      )
      .slice(0, VISIBLE_LIMIT);
  }, [toInput, allAirports]);

  // Load all airports once
  const loadAllAirports = useCallback(async () => {
    if (airportsLoaded) return;
    try {
      const data = await publicFlightService.getAllAirports();
      setAllAirports(data);
      setAirportsLoaded(true);
    } catch (e) {
      console.error("Failed to load airports", e);
      setAirportsLoaded(true);
    }
  }, [airportsLoaded]);

  const onFromChange = (val) => {
    setFromInput(val);
    setShowFromSug(val.length > 0);
    setExpanded(true);
    loadAllAirports();
  };

  const onToChange = (val) => {
    setToInput(val);
    setShowToSug(val.length > 0);
    setExpanded(true);
    loadAllAirports();
  };

  const selectFrom = (ap) => {
    setFromAirport(ap);
    setFromInput(ap.maSanBay);
    setShowFromSug(false);
  };

  const selectTo = (ap) => {
    setToAirport(ap);
    setToInput(ap.maSanBay);
    setShowToSug(false);
  };

  const swapAirports = () => {
    const tmp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(tmp);
    setFromInput(toAirport?.maSanBay || "");
    setToInput(tmp?.maSanBay || "");
  };

  const handleSearch = () => {
    const from = (fromAirport?.maSanBay || fromInput || "").trim().toUpperCase();
    const to = (toAirport?.maSanBay || toInput || "").trim().toUpperCase();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    if (!from && !to) {
      return;
    }

    const redirectTarget = `/flight-selection?${params.toString()}`;

    const user = authService.getCurrentUser();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    navigate(redirectTarget);
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load default airports on mount
  useEffect(() => {
    if (!fromAirport) {
      setFromAirport({ maSanBay: "HAN", tenSanBay: "Nội Bài", thanhPho: "Hà Nội" });
      // Không set fromInput - để rỗng để user tự nhập/click chọn
    }
  }, []);

  const tabs = [
    "Mua vé",
    "Quản lý đặt chỗ",
    "Làm thủ tục",
    "Trạng thái chuyến bay",
    "Tra cứu lịch bay",
  ];

  return (
    <div className="home-page">
      {/* Top Navigation */}
      <header
        ref={topBarRef}
        className={`top-bar ${scrolled ? "top-bar-solid" : ""}`}
      >
        <div className="top-bar-left">
          <div className="search-box">
            <MaterialIcon name="search" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className={`search-input ${scrolled ? "search-input-dark" : ""}`}
            />
          </div>
        </div>
        <div className="top-bar-right">
          <div className="lang-switcher">
            <img
              alt="Vietnam Flag"
              className="flag-icon"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvu0bcR_gfoq9hEwgZXzAI6ksGDmBiLkVLFk5EnZvn828qu8WEayCkmX1r3Qox9z8pnQJJBhTuFErpCHczcCEczWzPCAYfFYSvE3DSGOqwCCSsWhYN2sO0taw_WFC1Miej0WNd0myv-51Mp2vpTLEMWKqvUG5b5AAV6sslIlvWIDYOo1q73N6cp0rk3ourFKef7J8ciIZ2V7XX5ZsDTwZK1tU8ht9mQKdm4lXLeF00iRZqQJm2CbsmDkTgcu0ZfCowf6aEdUsLxf8z"
            />
            <span>VI</span>
          </div>
          {isLoggedIn ? (
            <Link to={user?.vaiTro === "Admin" ? "/admin/dashboard" : "/"} className="btn-login">
              {user?.hoTen || "Tài khoản"}
            </Link>
          ) : (
            <Link to="/login" className="btn-login">
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <aside className="flight-selection-sidebar">
        <div className="flight-selection-brand-mark">
          <MaterialIcon name="eco" fill />
        </div>
        <nav className="flight-selection-sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map((item, i) => (
            <a
              key={i}
              href="#"
              className={`flight-selection-sidebar-link${item.active ? " is-active" : ""}`}
            >
              <MaterialIcon name={item.icon} fill={!!item.active} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="flight-selection-sidebar-footer">
          <button type="button" className="flight-selection-icon-button" aria-label="Help">
            <MaterialIcon name="help" />
          </button>
          <button type="button" className="flight-selection-icon-button" aria-label="Support">
            <MaterialIcon name="support_agent" />
          </button>
        </div>
      </aside>

      <main className="home-main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-bg">
            <img
              alt="Tropical beach in Vietnam with turquoise waters and white sand"
              className="hero-img"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcLxTPHvXC--FUpPRIb8uDD2lSreM-Rf3jpI2QT4WdFJ2jVnFlSdy3wvsYnLnkovSyQ0RY54qxxK9zDGILeduvkYjVz7-2eZ4Wdzv6dL7hCo8eXx5uz-Ny0dFKTUATfqoaYj0mvDwn2kKBVPSKaXeDAF4z0HMksHH_nMWj7Z0NAqL4SrZYje6WMtiKZ-YFpmHk08MHW7eaxs_fv1NbLc2CFycceF6rqzl8drffAi6AodRTgvwBeJAb6ayKdeAj51cBk5rZ2L8S1EVn"
            />
            <div className="hero-overlay" />
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <p className="hero-eyebrow">Chào hè rực rỡ</p>
              <h1 className="hero-title">ƯU ĐÃI THẢ GA</h1>
              <button className="hero-cta">
                Khám phá ngay
                <MaterialIcon name="arrow_forward" />
              </button>
            </div>
            <div className="hero-pagination">
              {["01", "02", "03", "04"].map((n, i) => (
                <div key={n} className="pagination-item">
                  <span className={i === 0 ? "pagination-active" : ""}>{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spotlight overlay */}
          {expanded && <div className="booking-overlay" onClick={() => setExpanded(false)} />}

          {/* Booking Panel */}
          <div className={`booking-panel${expanded ? " expanded" : ""}`}>
            <div className="booking-tabs">
              {tabs.map((t, i) => (
                <button
                  key={i}
                  className={`booking-tab ${i === activeTab ? "booking-tab-active" : ""}`}
                  onClick={() => setActiveTab(i)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="booking-form">
              <div className="booking-field">
                <label>
                  <MaterialIcon name="flight_takeoff" /> Từ
                </label>
                <div
                  className="booking-value"
                  onClick={() => {
                    setExpanded(true);
                    document.getElementById("from-input")?.focus();
                    loadAllAirports();
                  }}
                >
                  <span className="booking-code">{fromAirport?.maSanBay || fromInput.toUpperCase() || "---"}</span>
                  <span className="booking-location">{fromAirport?.thanhPho || (fromInput ? "đang nhập..." : "Nhập điểm đi")}</span>
                </div>
                <input
                  id="from-input"
                  type="text"
                  className="booking-hidden-input"
                  value={fromInput}
                  onChange={(e) => onFromChange(e.target.value)}
                  onFocus={() => {
                    setExpanded(true);
                    setFromAirport(null);
                    loadAllAirports();
                    if (fromInput.length === 0) setShowFromSug(true);
                  }}
                  onBlur={() => setTimeout(() => setShowFromSug(false), 200)}
                  placeholder="Mã sân bay hoặc thành phố..."
                />
                {showFromSug && fromSug.length > 0 && (
                  <div className="booking-suggestions">
                    {fromSug.map((ap) => (
                      <div key={ap.maSanBay} className="suggestion-item" onMouseDown={() => selectFrom(ap)}>
                        <span className="sug-code">{ap.maSanBay}</span>
                        <span className="sug-name">{ap.tenSanBay}</span>
                        <span className="sug-city">{ap.thanhPho}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="booking-swap">
                <button className="swap-btn" type="button" onClick={swapAirports}>
                  <MaterialIcon name="sync_alt" />
                </button>
              </div>
              <div className="booking-field">
                <label>
                  <MaterialIcon name="flight_land" /> Đến
                </label>
                <div
                  className="booking-value"
                  onClick={() => {
                    setExpanded(true);
                    document.getElementById("to-input")?.focus();
                    loadAllAirports();
                  }}
                >
                  <span className="booking-code">{toAirport?.maSanBay || toInput.toUpperCase() || "---"}</span>
                  <span className="booking-location">{toAirport?.thanhPho || (toInput ? "đang nhập..." : "Chọn điểm đến")}</span>
                </div>
                <input
                  id="to-input"
                  type="text"
                  className="booking-hidden-input"
                  value={toInput}
                  onChange={(e) => onToChange(e.target.value)}
                  onFocus={() => {
                    setExpanded(true);
                    setToAirport(null);
                    loadAllAirports();
                    if (toInput.length === 0) setShowToSug(true);
                  }}
                  onBlur={() => setTimeout(() => setShowToSug(false), 200)}
                  placeholder="Mã sân bay hoặc thành phố..."
                />
                {showToSug && toSug.length > 0 && (
                  <div className="booking-suggestions">
                    {toSug.map((ap) => (
                      <div key={ap.maSanBay} className="suggestion-item" onMouseDown={() => selectTo(ap)}>
                        <span className="sug-code">{ap.maSanBay}</span>
                        <span className="sug-name">{ap.tenSanBay}</span>
                        <span className="sug-city">{ap.thanhPho}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="booking-search-btn" onClick={handleSearch}>
                <MaterialIcon name="search" />
                Tìm chuyến bay
              </button>
            </div>
          </div>
        </section>

        {/* Quick Service Links */}
        <section className="services">
          <div className="services-grid">
            {[
              { icon: "luggage", label: "Hành lý trả trước" },
              { icon: "airline_seat_recline_extra", label: "Nâng hạng ghế" },
              { icon: "shopping_bag", label: "Mua sắm" },
              { icon: "hotel", label: "Khách sạn & Tour" },
              { icon: "security", label: "Bảo hiểm" },
              { icon: "apps", label: "Các dịch vụ khác" },
            ].map((s, i) => (
              <a
                key={i}
                href="#"
                className="service-link"
                onClick={(e) => {
                  e.preventDefault();
                  setExpanded(true);
                  loadAllAirports();
                  setShowFromSug(true);
                  document.getElementById("from-input")?.focus();
                }}
              >
                <MaterialIcon name={s.icon} />
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Bento Experience */}
        <section className="experience">
          <h2 className="section-title">Trọn vẹn trải nghiệm</h2>
          <div className="bento-grid">
            <div className="bento-item bento-main">
              <img
                alt="Vietnam Airlines business class cabin"
                className="bento-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD54EKx_W833K3VrdezxipOWKKaWD7HBB6yaOvL0DVzdL_IjgTz3BOsgt4BLRewdFjTHEe9R-9gdT82c5beM3eMrh94jdCfTjYzvhEuDXZepjjpvR3ugFaf-Lira20c8RQ4eVdMz9sjQ-1PIIb66T7-5YygGSC6_7Niz0G3cShcbE_qMi0OkqLW7793hfhJ57A9QJ_GI0EFCRks5Wk24lexdNogjuk1Qn-44IDCNf9AFXj1dn8a6flYcKaOqduABIWS-Ym_mKijc19c"
              />
              <div className="bento-overlay">
                <h3>Hạng Thương gia</h3>
                <p>Sự sang trọng và riêng tư tuyệt đối trên mọi hành trình quốc tế.</p>
                <a href="#" className="bento-cta">
                  Khám phá ngay <MaterialIcon name="chevron_right" />
                </a>
              </div>
            </div>
            <div className="bento-item bento-sm">
              <img
                alt="Traditional Vietnamese silk Ao Dai"
                className="bento-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3RUwhl2n3reDOPKBYmW9BTQxHQLYBj1jPpuUPpC9B_87LuvWQEUO5MkYHC5KrgnkJvbfQ72SIzI7ChNnHKS_5kM3FCV6U-5gm6H2E-c_F_uIHZiO_z0-pykoUCoyeLAph1Q4YESlbjZetM4MsheW1RpTseSdZJrcn0vfYkeNH-zVNoNJDpQUh9rq-b6zsTNv7egw9EQSZnJRds0sePRSX43XPnZGhJIL5Nbf0iKF0R1QelINT3Pys0lFFfq2aS817HIBzsL1LsbMW"
              />
              <div className="bento-overlay">
                <h3>Lan tỏa bản sắc</h3>
              </div>
            </div>
            <div className="bento-item bento-sm">
              <img
                alt="Vietnam Airlines mobile app"
                className="bento-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6xx-1w4Xbns83wTTyq8yFTcuJXmFT7AguC-dP2W_DA_Z4KJIrrPnMMMiJ5v6ujTahQzUjFTdS3OzjMdNL-y0wTVHATUX19nwaktxZ16TBHiiflXW2tCYLZnqAKN2wJGjXILYvGcWopgeNevcWM5EDe1CUuNq3tPh6gkibSQQPTG3MpLTXNtJcF4nC2lQoi68A7CJspMH6948uaPOcUH-IyI5_hhycFWmeCWQJ9hf0v_fSStRvsTgBmEavfJw4jzC8Lj1hJdX3HsIB"
              />
              <div className="bento-overlay">
                <h3>Ứng dụng di động</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="newsletter">
          <div className="newsletter-content">
            <MaterialIcon name="mail" />
            <h2>Đăng ký E-Newsletter</h2>
            <p>Nhận thông tin ưu đãi mới nhất và tin tức du lịch từ Vietnam Airlines.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email của bạn" />
              <button type="submit">Đăng ký ngay</button>
            </form>
            <label className="newsletter-check">
              <input type="checkbox" defaultChecked />
              <span>Tôi đồng ý với Chính sách bảo mật và Điều khoản sử dụng</span>
            </label>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div>
              <h4>Vietnam Airlines</h4>
              <ul>
                <li><a href="#">Giới Thiệu Công Ty</a></li>
                <li><a href="#">Đội Bay</a></li>
                <li><a href="#">Đối Tác</a></li>
                <li><a href="#">Quan Hệ Cổ Đông</a></li>
              </ul>
            </div>
            <div>
              <h4>Hỗ Trợ</h4>
              <ul>
                <li><a href="#">Góp Ý Dịch Vụ</a></li>
                <li><a href="#">Trung tâm trợ giúp</a></li>
                <li><a href="#">Câu hỏi thường gặp</a></li>
                <li><a href="#">Liên hệ chi nhánh</a></li>
              </ul>
            </div>
            <div>
              <h4>Pháp Lý</h4>
              <ul>
                <li><a href="#">Điều Kiện & Điều Khoản</a></li>
                <li><a href="#">Điều Lệ Vận Chuyển</a></li>
                <li><a href="#">Bảo Mật Thông Tin</a></li>
                <li><a href="#">Cookies Policy</a></li>
              </ul>
            </div>
            <div>
              <h4>Kết nối với chúng tôi</h4>
              <div className="social-icons">
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.324v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                </a>
              </div>
              <img
                alt="Vietnam Airlines and SkyTeam logos"
                className="footer-brand-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyRp7zrGIrJianOCrORSsFEkbtznoZ_qdOSV0eX31X7VB9l78X9tXlMWO-But0-jTTSmNq3LhT9b2WaaSOhwfhGAyTlWmCtP6Y0mfGGdJIsOUt9bkzvDxKQuz7FilBJgHL_if8H2RCrduo-Qcj-YKxtWv_e158wBBumwcs-vrWGCZZHKxsS5dkAp7x-wW-gtg2goEGaL2UuKXr_sItuM2DD9YZkBCWru4PICC5__I5ySwFDFTItyn5dabuakm2QVZx8OYcC7Asee38"
              />
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Vietnam Airlines JSC. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Sơ đồ trang</a>
              <a href="#">Liên hệ mua vé</a>
              <a href="#">Cài đặt cookies</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default HomePage;
