import { Link, useParams } from "react-router-dom";
import ElectronicTicketCard from "../../components/booking/ElectronicTicketCard";
import PaymentFlowHeader from "../../components/payment/PaymentFlowHeader";
import useBookingTicketData from "../../hooks/useBookingTicketData";
import "../../styles/pages/payment-page.css";
import "../../styles/pages/booking-ticket-page.css";

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function optionalValue(value) {
  if (value == null || String(value).trim() === "") return "Chưa cập nhật";
  return String(value).trim();
}

function Detail({ label, value }) {
  return (
    <div className="booking-ticket__detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Airport({ airport, time, arrival = false }) {
  return (
    <div className={`booking-ticket__airport${arrival ? " is-arrival" : ""}`}>
      <span>{arrival ? "Điểm đến" : "Điểm đi"}</span>
      <strong>{airport.maSanBay}</strong>
      <b>{airport.tenSanBay}</b>
      <small>{airport.thanhPho}, {airport.quocGia}</small>
      <time>{formatDateTime(time)}</time>
    </div>
  );
}

export default function BookingTicketPage() {
  const { bookingId } = useParams();
  const normalizedBookingId = Number(bookingId);
  const {
    checkout,
    loading,
    refreshing,
    error,
    retry,
  } = useBookingTicketData({ bookingId: normalizedBookingId });

  let content;

  if (loading) {
    content = (
      <section className="booking-ticket__state" aria-live="polite" aria-busy="true">
        <span className="booking-ticket__spinner material-symbols-outlined" aria-hidden="true">progress_activity</span>
        <h2>Đang tải vé điện tử</h2>
        <p>Hệ thống đang đọc booking và vé mới nhất từ máy chủ.</p>
      </section>
    );
  } else if (error) {
    content = (
      <section className="booking-ticket__state is-error" role="alert">
        <span className="booking-ticket__state-icon material-symbols-outlined" aria-hidden="true">error</span>
        <h2>Không thể hiển thị vé điện tử</h2>
        <p>{error.message}</p>
        <small>Mã phản hồi: {error.code}</small>
        <div className="booking-ticket__actions">
          <button type="button" className="is-primary" onClick={retry} disabled={refreshing}>
            {refreshing ? "Đang tải lại..." : "Thử tải lại"}
          </button>
          <Link className="is-secondary" to="/">Về trang chủ</Link>
        </div>
      </section>
    );
  } else if (checkout) {
    const flight = checkout.chuyenBay;
    content = (
      <article className="booking-ticket__document">
        <header className="booking-ticket__hero">
          <span className="booking-ticket__hero-icon material-symbols-outlined" aria-hidden="true">confirmation_number</span>
          <p>VÉ ĐIỆN TỬ ĐÃ PHÁT HÀNH</p>
          <h2>Vé điện tử và chi tiết đặt chỗ</h2>
          <span>Booking đã được xác nhận cho tất cả hành khách.</span>
          <div className="booking-ticket__reference">
            <small>Mã đặt chỗ</small>
            <strong>{checkout.maDatCho}</strong>
            <span>Booking ID: {checkout.maPhieuDatCho} · Trạng thái: Confirmed</span>
          </div>
        </header>

        <section className="booking-ticket__panel is-flight" aria-labelledby="booking-ticket-flight-title">
          <div className="booking-ticket__section-heading">
            <div>
              <p>HÀNH TRÌNH</p>
              <h2 id="booking-ticket-flight-title">Thông tin chuyến bay</h2>
            </div>
            {flight.logoHangBay ? (
              <img
                src={flight.logoHangBay}
                alt={`Logo ${flight.tenHangBay}`}
                onError={(event) => { event.currentTarget.hidden = true; }}
              />
            ) : null}
          </div>

          <div className="booking-ticket__flight-meta">
            <strong>{flight.tenHangBay}</strong>
            <span>{flight.maHangBay} · {flight.soHieuChuyenBay}</span>
            <span>{flight.dongMayBay}</span>
            <span className="booking-ticket__flight-status">{flight.trangThai}</span>
          </div>

          <div className="booking-ticket__route">
            <Airport airport={flight.sanBayDi} time={flight.gioKhoiHanh} />
            <div className="booking-ticket__route-line" aria-hidden="true">
              <i />
              <span className="material-symbols-outlined">flight</span>
              <i />
            </div>
            <Airport airport={flight.sanBayDen} time={flight.gioHaCanh} arrival />
          </div>

          <dl className="booking-ticket__compact-details">
            <Detail label="Nhà ga" value={optionalValue(flight.nhaGa)} />
            <Detail label="Cửa lên máy bay" value={optionalValue(flight.cuaLen)} />
            <Detail label="Loại chuyến đi" value={checkout.loaiChuyenDi} />
            <Detail label="Ngày đặt" value={formatDateTime(checkout.ngayDat)} />
          </dl>
        </section>

        <section className="booking-ticket__panel" aria-labelledby="booking-ticket-contact-title">
          <div className="booking-ticket__section-heading">
            <div>
              <p>LIÊN HỆ</p>
              <h2 id="booking-ticket-contact-title">Thông tin người đặt chỗ</h2>
            </div>
          </div>
          <dl className="booking-ticket__compact-details is-contact">
            <Detail label="Họ tên" value={checkout.thongTinLienHe.hoTenLienHe} />
            <Detail label="Email" value={checkout.thongTinLienHe.emailLienHe} />
            <Detail label="Điện thoại" value={checkout.thongTinLienHe.soDienThoaiLienHe} />
          </dl>
        </section>

        <section className="booking-ticket__tickets" aria-labelledby="booking-ticket-list-title">
          <div className="booking-ticket__section-heading">
            <div>
              <p>VÉ ĐIỆN TỬ</p>
              <h2 id="booking-ticket-list-title">Danh sách vé hành khách</h2>
            </div>
            <span>{checkout.hanhKhachs.length} vé đã phát hành</span>
          </div>
          <div className="booking-ticket__ticket-list">
            {checkout.hanhKhachs.map((passenger, index) => (
              <ElectronicTicketCard
                key={passenger.ve.maVe}
                passenger={passenger}
                flight={flight}
                index={index}
              />
            ))}
          </div>
        </section>

        <section className="booking-ticket__panel is-pricing" aria-labelledby="booking-ticket-pricing-title">
          <div className="booking-ticket__section-heading">
            <div>
              <p>CHI TIẾT GIÁ</p>
              <h2 id="booking-ticket-pricing-title">Tổng thanh toán</h2>
            </div>
          </div>
          <dl className="booking-ticket__pricing">
            <div><dt>Tổng tiền ghế</dt><dd>{formatMoney(checkout.pricing.tongTienGhe)}</dd></div>
            <div><dt>Tổng tiền dịch vụ</dt><dd>{formatMoney(checkout.pricing.tongTienDichVu)}</dd></div>
            <div className="is-total"><dt>Tổng thanh toán</dt><dd>{formatMoney(checkout.pricing.tongThanhToan)}</dd></div>
          </dl>
        </section>

        <section className="booking-ticket__note" aria-label="Ghi chú vé điện tử">
          <span className="material-symbols-outlined" aria-hidden="true">info</span>
          <div>
            <strong>Vé điện tử được phát hành theo dữ liệu backend.</strong>
            <p>Đây là luồng mô phỏng của hệ thống đặt vé máy bay.</p>
          </div>
        </section>

        <div className="booking-ticket__actions">
          <Link className="is-primary" to="/">Về trang chủ</Link>
          <Link className="is-secondary" to="/search">Tìm chuyến khác</Link>
        </div>
      </article>
    );
  } else {
    content = (
      <section className="booking-ticket__state is-error" role="alert">
        <span className="booking-ticket__state-icon material-symbols-outlined" aria-hidden="true">warning</span>
        <h2>Chưa có dữ liệu vé điện tử</h2>
        <p>Vui lòng thử tải lại booking từ máy chủ.</p>
        <button type="button" className="is-primary" onClick={retry}>Thử tải lại</button>
      </section>
    );
  }

  return (
    <main className="payment-page booking-ticket-page">
      <div className="payment-page__shell">
        <PaymentFlowHeader activeStep={5} />
        <div className="booking-ticket__layout">{content}</div>
      </div>
    </main>
  );
}
