import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/pages/home.css"; // Giữ các class CSS của header/sidebar
import "../styles/pages/flight-selection.css";

const TravelInformationMenu = React.lazy(() => import("../features/travel-information/TravelInformationMenu"));

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
  { icon: "explore", label: "Khám Phá", to: "/" },
  { icon: "confirmation_number", label: "Mua vé", to: "/flight-selection" },
  { icon: "card_membership", label: "Dịch vụ bổ trợ", to: "#" },
  { icon: "map", label: "Hành trình", to: "#" },
  { icon: "flight_takeoff", label: "Trải nghiệm bay", to: "#" },
  { icon: "star", label: "Lotusmiles", to: "#" },
];

function MainLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [isTopBarHidden, setIsTopBarHidden] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTravelMenuOpen, setIsTravelMenuOpen] = useState(false);
  const topBarRef = useRef(null);
  const travelMenuRef = useRef(null);
  const travelTriggerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const user = authService.getCurrentUser();
  const isLoggedIn = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };
  const closeTravelMenu = useCallback(() => setIsTravelMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 50);

      const flightList = document.querySelector(".flight-selection-section");
      const hasReachedFlightList =
        location.pathname === "/flight-selection" &&
        flightList &&
        flightList.getBoundingClientRect().top <= 96;

      if (!hasReachedFlightList || y < lastScrollYRef.current) {
        setIsTopBarHidden(false);
      } else if (y > lastScrollYRef.current) {
        setIsTopBarHidden(true);
      }

      lastScrollYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  useEffect(() => {
    setIsTopBarHidden(false);
    setIsTravelMenuOpen(false);
    lastScrollYRef.current = window.scrollY;
  }, [location.pathname]);

  return (
    <div className="main-app-layout">
      {/* Top Navigation */}
      <header
        ref={topBarRef}
        className={`top-bar ${scrolled ? "top-bar-solid" : ""}${isTopBarHidden ? " is-hidden" : ""}`}
        style={{ zIndex: 1000 }}
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
            <div className="admin-user-dropdown dropdown" style={{ position: "relative" }}>
              <button 
                className="btn-login"
                type="button"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((value) => !value)}
              >
                {user?.hoTen || "Tài khoản"}
              </button>

              {isUserMenuOpen && (
                <ul className="dropdown-menu dropdown-menu-end admin-dropdown-menu show" style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", minWidth: "160px", background: "white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "8px 0", listStyle: "none", zIndex: 1001 }}>
                  <li><Link className="dropdown-item" to={user?.vaiTro === "Admin" ? "/admin/dashboard" : "/"}>{user?.vaiTro === "Admin" ? "Trang quản trị" : "Hồ sơ cá nhân"}</Link></li>
                  <li><button className="dropdown-item" type="button">Đổi mật khẩu</button></li>
                  <li><hr className="dropdown-divider" style={{ margin: "8px 0", borderColor: "#eee" }} /></li>
                  <li>
                    <button className="dropdown-item text-danger" type="button" onClick={handleLogout} style={{ color: "#d93025" }}>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <aside className="flight-selection-sidebar" style={{ zIndex: 999, position: 'fixed', top: 0, left: 0, bottom: 0, width: '92px', height: '100vh' }}>
        <div className="flight-selection-brand-mark">
          <MaterialIcon name="eco" fill />
        </div>
        <nav className="flight-selection-sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map((item, i) => {
             // Logic to highlight active item
             let isActive = false;
             if (item.to === "/" && location.pathname === "/") isActive = true;
             else if (item.to !== "/" && location.pathname.startsWith(item.to)) isActive = true;
             // special case for booking
             if (location.pathname.includes("/booking") && item.label === "Mua vé") isActive = true;
             if (location.pathname.includes("/flight-selection") && item.label === "Mua vé") isActive = true;
             if ((isTravelMenuOpen || location.pathname.startsWith("/travel-information")) && item.label === "Hành trình") isActive = true;

             if (item.label === "Hành trình") {
               return (
                 <button
                   key={i}
                   ref={travelTriggerRef}
                   type="button"
                   className={`flight-selection-sidebar-link${isActive ? " is-active" : ""}`}
                   aria-expanded={isTravelMenuOpen}
                   aria-controls="travel-information-menu"
                   onClick={() => setIsTravelMenuOpen((value) => !value)}
                 >
                   <MaterialIcon name={item.icon} fill={!!isActive} />
                   <span>{item.label}</span>
                 </button>
               );
             }
             
             return (
              <Link
                key={i}
                to={item.to}
                className={`flight-selection-sidebar-link${isActive ? " is-active" : ""}`}
              >
                <MaterialIcon name={item.icon} fill={!!isActive} />
                <span>{item.label}</span>
              </Link>
             );
          })}
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
      <React.Suspense fallback={null}>
        <TravelInformationMenu open={isTravelMenuOpen} onClose={closeTravelMenu} ref={travelMenuRef} triggerRef={travelTriggerRef} />
      </React.Suspense>

      {/* Main Content Area */}
      <div className="main-content-wrapper" style={{ marginLeft: "80px", minHeight: "100vh", position: "relative" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
