import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { publicFlightService } from "../../services/publicFlightService";
import vietnamDestinations from "../../assets/destinations/vietnam-destinations.png";
import internationalDestinations from "../../assets/destinations/international-destinations.png";
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

const DOMESTIC_DEALS = [
  { from: "SGN", to: "HAN", route: "TP. Hồ Chí Minh đến Hà Nội", price: "977.181", seen: "Đã xem 16 giờ trước", position: "0% 0%" },
  { from: "HAN", to: "SGN", route: "Hà Nội đến TP. Hồ Chí Minh", price: "977.181", seen: "Đang được đặt nhiều", position: "33.333% 0%" },
  { from: "HAN", to: "DAD", route: "Hà Nội đến Đà Nẵng", price: "847.181", seen: "Đã xem 19 phút trước", position: "66.666% 0%" },
  { from: "SGN", to: "PQC", route: "TP. Hồ Chí Minh đến Phú Quốc", price: "815.181", seen: "Ưu đãi trong hôm nay", position: "100% 0%" },
  { from: "HAN", to: "VDO", route: "Hà Nội đến Hạ Long", price: "729.000", seen: "12 người vừa đặt", position: "0% 100%" },
  { from: "SGN", to: "HUI", route: "TP. Hồ Chí Minh đến Huế", price: "899.000", seen: "Giá tốt trong 48 giờ", position: "33.333% 100%" },
  { from: "SGN", to: "DLI", route: "TP. Hồ Chí Minh đến Đà Lạt", price: "765.000", seen: "Được yêu thích tuần này", position: "66.666% 100%" },
  { from: "HAN", to: "CXR", route: "Hà Nội đến Nha Trang", price: "935.000", seen: "18 người đang xem", position: "100% 100%" },
];

const INTERNATIONAL_DEALS = [
  { from: "HAN", to: "NRT", route: "Hà Nội đến Tokyo", country: "Nhật Bản", price: "5.990.000", position: "0% 0%" },
  { from: "SGN", to: "ICN", route: "TP. Hồ Chí Minh đến Seoul", country: "Hàn Quốc", price: "4.850.000", position: "33.333% 0%" },
  { from: "SGN", to: "SIN", route: "TP. Hồ Chí Minh đến Singapore", country: "Singapore", price: "3.290.000", position: "66.666% 0%" },
  { from: "HAN", to: "BKK", route: "Hà Nội đến Bangkok", country: "Thái Lan", price: "2.890.000", position: "100% 0%" },
  { from: "SGN", to: "CDG", route: "TP. Hồ Chí Minh đến Paris", country: "Pháp", price: "15.900.000", position: "0% 100%" },
  { from: "SGN", to: "SYD", route: "TP. Hồ Chí Minh đến Sydney", country: "Úc", price: "12.490.000", position: "33.333% 100%" },
  { from: "SGN", to: "DPS", route: "TP. Hồ Chí Minh đến Bali", country: "Indonesia", price: "4.190.000", position: "66.666% 100%" },
  { from: "HAN", to: "LHR", route: "Hà Nội đến London", country: "Anh", price: "16.800.000", position: "100% 100%" },
];

function DealCarousel({ title, eyebrow, deals, image, onBook }) {
  const railRef = useRef(null);
  const scroll = (direction) => {
    const rail = railRef.current;
    const firstCard = rail?.firstElementChild;
    if (!rail || !firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (cardWidth + gap) * 4, behavior: "smooth" });
  };

  return (
    <section className="deal-section">
      <div className="deal-heading">
        <div><span>{eyebrow}</span><h2>{title}</h2></div>
        <div className="deal-controls">
          <button type="button" onClick={() => scroll(-1)} aria-label={`Xem ${title} phía trước`}><MaterialIcon name="chevron_left" /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Xem thêm ${title}`}><MaterialIcon name="chevron_right" /></button>
        </div>
      </div>
      <div className="deal-rail" ref={railRef}>
        {deals.map((deal, index) => (
          <article className="deal-card" key={`${deal.from}-${deal.to}`}>
            <div className="deal-photo" style={{ backgroundImage: `url(${image})`, backgroundPosition: deal.position }}>
              <span className="deal-rank">{String(index + 1).padStart(2, "0")}/{deals.length}</span>
              {deal.country && <span className="deal-country">{deal.country}</span>}
              <div className="deal-gradient">
                <h3>{deal.route}</h3>
                <div className="deal-price"><small>Từ</small><strong>{deal.price} VND*</strong><span>{deal.seen || "Khứ hồi · Economy"}</span></div>
              </div>
            </div>
            <button type="button" onClick={() => onBook(deal)}>Mua ngay <MaterialIcon name="arrow_forward" /></button>
          </article>
        ))}
      </div>
      <p className="deal-note">*Giá vé tham khảo được cập nhật trong 48 giờ gần nhất và có thể thay đổi tại thời điểm đặt chỗ.</p>
    </section>
  );
}

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

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

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

  const handleBookDeal = ({ from, to }) => {
    navigate(`/flight-selection?${new URLSearchParams({ from, to }).toString()}`);
  };

  return (
    <div className="home-page">
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

        <DealCarousel
          eyebrow="Được tìm kiếm nhiều nhất"
          title="Các chuyến bay được ưa thích nhất"
          deals={DOMESTIC_DEALS}
          image={vietnamDestinations}
          onBook={handleBookDeal}
        />

        <DealCarousel
          eyebrow="Bay xa hơn, trải nghiệm nhiều hơn"
          title="Điểm đến quốc tế đang hot"
          deals={INTERNATIONAL_DEALS}
          image={internationalDestinations}
          onBook={handleBookDeal}
        />

        <section className="travel-stories" id="travel-stories">
          <div className="deal-heading">
            <div><span>Cảm hứng hành trình</span><h2>Cẩm nang du lịch mới nhất</h2></div>
            <a href="#travel-stories">Xem tất cả <MaterialIcon name="arrow_forward" /></a>
          </div>
          <div className="story-grid">
            {[
              { slug: "48-gio-kham-pha-ha-noi", tag: "Ẩm thực", title: "48 giờ ăn và khám phá Hà Nội như một người bản địa", time: "6 phút đọc", position: "0% 0%", image: vietnamDestinations },
              { slug: "bi-quyet-san-ve-quoc-te", tag: "Kinh nghiệm", title: "Bí quyết săn vé tốt cho chuyến đi quốc tế đầu tiên", time: "8 phút đọc", position: "66.666% 0%", image: internationalDestinations },
              { slug: "mua-hoa-anh-dao-nhat-ban", tag: "Điểm đến", title: "Mùa hoa anh đào Nhật Bản: đi đâu và vào thời điểm nào?", time: "5 phút đọc", position: "0% 0%", image: internationalDestinations },
            ].map((story) => (
              <article className="story-card" key={story.title}>
                <Link to={`/cam-nang/${story.slug}`} className="story-link">
                  <div className="story-photo" style={{ backgroundImage: `url(${story.image})`, backgroundPosition: story.position }} />
                  <div className="story-body">
                    <span>{story.tag}</span><h3>{story.title}</h3><p>{story.time}</p>
                    <span className="story-read-more">Đọc bài viết <MaterialIcon name="arrow_forward" /></span>
                  </div>
                </Link>
              </article>
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
