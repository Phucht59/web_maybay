import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import flightBrandIcon from "../assets/icons/flight-brand.png";

const PlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 16l20-7-8 8-2 5-3-4-5 1-2-3Z" />
    <path d="M12 17 22 9" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
    <circle cx="7" cy="7" r="1" />
    <circle cx="7" cy="12" r="1" />
    <circle cx="7" cy="17" r="1" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const masterLinks = [
  { to: "/admin/danh-muc/san-bay", label: "Sân bay" },
  { to: "/admin/danh-muc/hang-bay", label: "Hãng bay" },
  { to: "/admin/danh-muc/hang-ghe", label: "Hạng ghế" },
  { to: "/admin/danh-muc/may-bay", label: "Máy bay" },
  { to: "/admin/danh-muc/lo-trinh", label: "Lộ trình" },
  { to: "/admin/danh-muc/ghe-may-bay", label: "Sơ đồ ghế" },
];

const pageTitles = [
  { match: "/admin/dashboard", title: "Dashboard" },
  { match: "/admin/chuyen-bay", title: "Quản lý Chuyến bay" },
  { match: "/admin/danh-muc/san-bay", title: "Sân bay" },
  { match: "/admin/danh-muc/hang-bay", title: "Hãng bay" },
  { match: "/admin/danh-muc/hang-ghe", title: "Hạng ghế" },
  { match: "/admin/danh-muc/may-bay", title: "Máy bay" },
  { match: "/admin/danh-muc/lo-trinh", title: "Lộ trình" },
  { match: "/admin/danh-muc/ghe-may-bay", title: "Sơ đồ ghế" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isMasterActive = location.pathname.startsWith("/admin/danh-muc");
  const userName = currentUser?.hoTen || currentUser?.email || "System Administrator";
  const userRole = currentUser?.vaiTro || "Admin";
  const avatarText = (userName || "A").trim().slice(0, 1).toUpperCase();

  const pageName = useMemo(() => {
    return pageTitles.find((item) => location.pathname.startsWith(item.match))?.title || "Trang chủ";
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login", { replace: true });
  };

  const shellClassName = isSidebarCollapsed ? "admin-shell sidebar-collapsed" : "admin-shell";

  return (
    <div className={shellClassName} id="adminShell">
      <aside className="admin-sidebar" id="adminSidebar">
        <Link className="admin-brand" to="/admin/dashboard">
          <div className="admin-brand-icon">
            <img src={flightBrandIcon} alt="Flight Booking" />
          </div>
          <span className="admin-brand-text">
            <strong>Flight Booking</strong>
            <small>Admin Portal</small>
          </span>
        </Link>

        <nav className="admin-menu" aria-label="Admin navigation">
          <NavLink className="admin-menu-link" to="/admin/dashboard">
            <span className="admin-menu-icon" aria-hidden="true">
              <DashboardIcon />
            </span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink className="admin-menu-link" to="/admin/chuyen-bay">
            <span className="admin-menu-icon" aria-hidden="true">
              <PlaneIcon />
            </span>
            <span>Quản lý Chuyến bay</span>
          </NavLink>

          <button
            className={`admin-menu-link admin-menu-toggle${isMasterActive ? " active" : ""}`}
            type="button"
            aria-expanded={isMasterActive}
            onClick={() => navigate("/admin/danh-muc/san-bay")}
          >
            <span className="admin-menu-icon" aria-hidden="true">
              <ListIcon />
            </span>
            <span>Quản lý danh mục</span>
            <span className="admin-menu-chevron" aria-hidden="true">▾</span>
          </button>

          <div className={`admin-submenu${isMasterActive ? " show" : ""}`}>
            {masterLinks.map((item) => (
              <NavLink key={item.to} className="admin-submenu-link" to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-avatar" aria-hidden="true">{avatarText}</div>
          <div className="admin-user-mini">
            <strong>{userRole}</strong>
            <small>{userName}</small>
          </div>
        </div>
      </aside>

      <div className="admin-backdrop" />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-icon-btn"
              type="button"
              aria-label="Thu gọn hoặc mở sidebar"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
            >
              <MenuIcon />
            </button>

            <div className="admin-breadcrumb">
              <Link to="/admin/dashboard">Trang chủ</Link>
              {location.pathname !== "/admin/dashboard" && (
                <>
                  <span>/</span>
                  {isMasterActive && (
                    <>
                      <span>Quản lý danh mục</span>
                      <span>/</span>
                    </>
                  )}
                  <strong>{pageName}</strong>
                </>
              )}
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-user-greeting">Xin chào, {userName}</span>
            <button className="admin-icon-btn" type="button" aria-label="Thông báo">
              <BellIcon />
            </button>

            <div className="admin-user-dropdown dropdown">
              <button
                className="admin-user-button"
                type="button"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((value) => !value)}
              >
                <span className="admin-avatar admin-avatar-sm" aria-hidden="true">{avatarText}</span>
              </button>

              {isUserMenuOpen && (
                <ul className="dropdown-menu dropdown-menu-end admin-dropdown-menu show">
                  <li><button className="dropdown-item" type="button">Đổi mật khẩu</button></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
