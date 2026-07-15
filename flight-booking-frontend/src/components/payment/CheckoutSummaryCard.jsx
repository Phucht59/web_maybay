function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `${new Intl.NumberFormat("vi-VN").format(Number(value))} VND`;
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDuration(startValue, endValue) {
  const start = Date.parse(startValue || "");
  const end = Date.parse(endValue || "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours ? `${hours} giờ` : ""}${hours && remainingMinutes ? " " : ""}${remainingMinutes ? `${remainingMinutes} phút` : ""}`;
}

function airportName(airport) {
  return airport?.tenSanBay || airport?.thanhPho || "—";
}

function Icon({ children, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export default function CheckoutSummaryCard({ checkout }) {
  const flight = checkout?.chuyenBay;
  const pricing = checkout?.pricing;
  const duration = getDuration(flight?.gioKhoiHanh, flight?.gioHaCanh);
  const seatClasses = [...new Set(
    (checkout?.hanhKhachs || [])
      .map((passenger) => passenger.ve?.ghe?.tenHangGhe)
      .filter(Boolean),
  )];

  return (
    <section className="payment-card payment-summary" aria-labelledby="payment-summary-title">
      <header className="payment-summary__header">
        <div>
          <p>TÓM TẮT ĐẶT CHỖ</p>
          <h2 id="payment-summary-title">Chuyến bay</h2>
        </div>
        <span className="payment-summary__booking-code">{checkout?.maDatCho || "—"}</span>
      </header>

      <div className="payment-summary__flight-meta">
        <span><Icon>flight</Icon>{flight?.soHieuChuyenBay || "—"}</span>
        <span>{formatDate(flight?.gioKhoiHanh)}</span>
      </div>

      <div className="payment-summary__route">
        <div className="payment-summary__airport">
          <strong>{formatTime(flight?.gioKhoiHanh)}</strong>
          <b>{flight?.sanBayDi?.maSanBay || "—"}</b>
          <span>{airportName(flight?.sanBayDi)}</span>
        </div>
        <div className="payment-summary__route-line" aria-hidden="true">
          <span className="payment-summary__route-segment" />
          <Icon className="payment-summary__route-icon">flight</Icon>
          <span className="payment-summary__route-segment" />
          {duration ? <small>{duration}</small> : null}
        </div>
        <div className="payment-summary__airport is-arrival">
          <strong>{formatTime(flight?.gioHaCanh)}</strong>
          <b>{flight?.sanBayDen?.maSanBay || "—"}</b>
          <span>{airportName(flight?.sanBayDen)}</span>
        </div>
      </div>

      <dl className="payment-summary__details">
        <div><dt>Loại chuyến đi</dt><dd>{checkout?.loaiChuyenDi || "—"}</dd></div>
        <div><dt>Số hành khách</dt><dd>{checkout?.soLuongHanhKhach ?? "—"}</dd></div>
        {seatClasses.length ? <div><dt>Hạng ghế</dt><dd>{seatClasses.join(", ")}</dd></div> : null}
      </dl>

      <section className="payment-summary__pricing" aria-labelledby="payment-pricing-title">
        <h3 id="payment-pricing-title">Chi tiết giá</h3>
        <dl>
          <div><dt>Tổng giá ghế</dt><dd>{formatMoney(pricing?.tongTienGhe)}</dd></div>
          <div><dt>Tổng dịch vụ</dt><dd>{formatMoney(pricing?.tongTienDichVu)}</dd></div>
          <div className="payment-summary__total"><dt>Tổng thanh toán</dt><dd>{formatMoney(pricing?.tongThanhToan)}</dd></div>
        </dl>
      </section>

      <div className="payment-summary__deadline">
        <Icon>schedule</Icon>
        <div>
          <span>Vui lòng hoàn tất thanh toán trước:</span>
          <strong>{formatDateTime(checkout?.giuDenLuc)}</strong>
        </div>
      </div>
    </section>
  );
}
