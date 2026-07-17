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

function formatDateOnly(value) {
  if (!value) return "Chưa cập nhật";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function optionalValue(value) {
  if (value == null || String(value).trim() === "") return "Chưa cập nhật";
  return String(value).trim();
}

function maskDocumentNumber(value) {
  const documentNumber = String(value || "").trim();
  if (documentNumber.length <= 4) return "•".repeat(documentNumber.length);
  return `${"•".repeat(documentNumber.length - 4)}${documentNumber.slice(-4)}`;
}

function Detail({ label, value }) {
  return (
    <div className="electronic-ticket__detail">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function ElectronicTicketCard({ passenger, flight, index }) {
  const ticket = passenger.ve;
  const services = passenger.dichVus;
  const titleId = `electronic-ticket-${ticket.maVe}-title`;

  return (
    <article className="electronic-ticket" aria-labelledby={titleId}>
      <header className="electronic-ticket__header">
        <div>
          <p>VÉ HÀNH KHÁCH {index + 1}</p>
          <h3 id={titleId}>{passenger.hoTen}</h3>
        </div>
        <span className="electronic-ticket__status">
          <span className="material-symbols-outlined" aria-hidden="true">verified</span>
          Đã phát hành
        </span>
      </header>

      <section className="electronic-ticket__number" aria-label="Số vé điện tử">
        <span>Số vé điện tử</span>
        <strong>{ticket.soVeDienTu}</strong>
        <small>Ticket ID: {ticket.maVe} · Phát hành {formatDateTime(ticket.ngayXuatVe)}</small>
      </section>

      <section className="electronic-ticket__journey" aria-label="Hành trình của vé">
        <div className="electronic-ticket__airport">
          <strong>{flight.sanBayDi.maSanBay}</strong>
          <span>{flight.sanBayDi.thanhPho}</span>
        </div>
        <div className="electronic-ticket__route">
          <span>{flight.soHieuChuyenBay}</span>
          <div aria-hidden="true">
            <i />
            <span className="material-symbols-outlined">flight</span>
            <i />
          </div>
          <small>{formatDateTime(flight.gioKhoiHanh)}</small>
        </div>
        <div className="electronic-ticket__airport is-arrival">
          <strong>{flight.sanBayDen.maSanBay}</strong>
          <span>{flight.sanBayDen.thanhPho}</span>
        </div>
      </section>

      <div className="electronic-ticket__columns">
        <section className="electronic-ticket__section" aria-labelledby={`${titleId}-seat`}>
          <h4 id={`${titleId}-seat`}>
            <span className="material-symbols-outlined" aria-hidden="true">airline_seat_recline_normal</span>
            Ghế và giá vé
          </h4>
          <dl className="electronic-ticket__details">
            <Detail label="Số ghế" value={ticket.ghe.soGhe} />
            <Detail label="Hạng ghế" value={ticket.ghe.tenHangGhe} />
            <Detail label="Giá vé" value={formatMoney(ticket.giaVe)} />
          </dl>
        </section>

        <section className="electronic-ticket__section" aria-labelledby={`${titleId}-passenger`}>
          <h4 id={`${titleId}-passenger`}>
            <span className="material-symbols-outlined" aria-hidden="true">person</span>
            Hành khách
          </h4>
          <dl className="electronic-ticket__details">
            <Detail label="Loại hành khách" value={passenger.loaiHanhKhach} />
            <Detail label="Ngày sinh" value={formatDateOnly(passenger.ngaySinh)} />
            <Detail label="Giới tính" value={optionalValue(passenger.gioiTinh)} />
            <Detail label="Quốc tịch" value={optionalValue(passenger.quocTich)} />
            <Detail label="Loại giấy tờ" value={passenger.loaiGiayTo} />
            <Detail label="Số giấy tờ" value={maskDocumentNumber(passenger.soGiayTo)} />
            <Detail label="Ngày hết hạn" value={formatDateOnly(passenger.ngayHetHanGiayTo)} />
          </dl>
        </section>
      </div>

      <section className="electronic-ticket__section is-services" aria-labelledby={`${titleId}-services`}>
        <h4 id={`${titleId}-services`}>
          <span className="material-symbols-outlined" aria-hidden="true">luggage</span>
          Dịch vụ bổ sung
        </h4>
        {services.length ? (
          <ul className="electronic-ticket__services">
            {services.map((service, serviceIndex) => (
              <li key={`${ticket.maVe}-${service.maDichVu}-${serviceIndex}`}>
                <div>
                  <strong>{service.tenDichVu}</strong>
                  <span>
                    {service.khoiLuongKg != null ? `${service.khoiLuongKg} kg · ` : ""}
                    Số lượng {service.soLuong}
                  </span>
                </div>
                <dl>
                  <div><dt>Đơn giá</dt><dd>{formatMoney(service.donGia)}</dd></div>
                  <div><dt>Thành tiền</dt><dd>{formatMoney(service.thanhTien)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="electronic-ticket__empty-service">Không có dịch vụ bổ sung.</p>
        )}
      </section>

      <footer className="electronic-ticket__total">
        <div><span>Giá ghế</span><strong>{formatMoney(ticket.giaVe)}</strong></div>
        <div><span>Tổng dịch vụ</span><strong>{formatMoney(passenger.tongTienDichVu)}</strong></div>
        <div className="is-grand-total"><span>Thành tiền</span><strong>{formatMoney(passenger.thanhTien)}</strong></div>
      </footer>
    </article>
  );
}
