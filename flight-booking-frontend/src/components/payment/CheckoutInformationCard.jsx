function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("vi-VN");
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `${new Intl.NumberFormat("vi-VN").format(Number(value))} VND`;
}

function displayValue(value) {
  return value === null || value === undefined || value === "" ? "—" : value;
}

function Icon({ children }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

function DetailItem({ label, value }) {
  return (
    <div className="payment-information__detail">
      <dt>{label}</dt>
      <dd>{displayValue(value)}</dd>
    </div>
  );
}

function ServiceGroup({ title, icon, services, passengerId }) {
  return (
    <section className="payment-information__service-group">
      <h4><Icon>{icon}</Icon>{title}</h4>
      {services.length === 0 ? (
        <p className="payment-information__empty-service">Không thêm</p>
      ) : (
        <ul className="payment-information__service-list">
          {services.map((service, index) => (
            <li key={`${passengerId}-${service.maDichVu ?? index}`}>
              <div>
                <strong>{displayValue(service.tenDichVu)}</strong>
                <span>
                  {service.khoiLuongKg != null ? `${service.khoiLuongKg} kg` : null}
                  {service.khoiLuongKg != null && service.soLuong != null ? " · " : null}
                  {service.soLuong != null ? `Số lượng ${service.soLuong}` : null}
                </span>
              </div>
              <b>{formatMoney(service.thanhTien)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CheckoutInformationCard({ contact, passengers = [] }) {
  return (
    <section className="payment-card payment-information" aria-labelledby="payment-information-title">
      <div className="payment-card__heading">
        <span className="payment-card__icon"><Icon>person</Icon></span>
        <div>
          <p>THÔNG TIN ĐẶT CHỖ</p>
          <h2 id="payment-information-title">Khách hàng và hành khách</h2>
        </div>
      </div>

      <section className="payment-information__contact" aria-labelledby="payment-contact-title">
        <div className="payment-information__section-title">
          <h3 id="payment-contact-title">Thông tin liên hệ</h3>
          <span>Dùng chung cho đặt chỗ này</span>
        </div>
        <dl className="payment-information__contact-grid">
          <DetailItem label="Họ tên liên hệ" value={contact?.hoTenLienHe} />
          <DetailItem label="Email" value={contact?.emailLienHe} />
          <DetailItem label="Số điện thoại" value={contact?.soDienThoaiLienHe} />
        </dl>
      </section>

      <section className="payment-information__passengers" aria-labelledby="payment-passengers-title">
        <div className="payment-information__section-title">
          <h3 id="payment-passengers-title">Danh sách hành khách</h3>
          <span>{passengers.length} hành khách</span>
        </div>

        <div className="payment-information__passenger-list">
          {passengers.map((passenger, index) => {
            const services = Array.isArray(passenger.dichVus) ? passenger.dichVus : [];
            const baggageServices = services.filter(
              (service) => String(service.loaiDichVu || "").toLowerCase() === "baggage",
            );
            const protectionServices = services.filter(
              (service) => String(service.loaiDichVu || "").toLowerCase() === "protection",
            );
            const passengerKey = passenger.maHanhKhach ?? passenger.thuTuHanhKhach ?? index;

            return (
              <article className="payment-information__passenger" key={passengerKey}>
                <header className="payment-information__passenger-header">
                  <div>
                    <span className="payment-information__passenger-number">
                      <Icon>person</Icon> Hành khách {passenger.thuTuHanhKhach ?? index + 1}
                    </span>
                    <h3>{displayValue(passenger.hoTen)}</h3>
                    <p>{displayValue(passenger.loaiHanhKhach)}</p>
                  </div>
                  <div className="payment-information__seat">
                    <span>Ghế</span>
                    <strong>{displayValue(passenger.ve?.ghe?.soGhe)}</strong>
                    <small>{displayValue(passenger.ve?.ghe?.tenHangGhe)}</small>
                  </div>
                </header>

                <dl className="payment-information__passenger-details">
                  <DetailItem label="Ngày sinh" value={formatDate(passenger.ngaySinh)} />
                  <DetailItem label="Giới tính" value={passenger.gioiTinh} />
                  <DetailItem label="Quốc tịch" value={passenger.quocTich} />
                  <DetailItem label="Loại giấy tờ" value={passenger.loaiGiayTo} />
                  <DetailItem label="Số giấy tờ" value={passenger.soGiayTo} />
                  <DetailItem label="Hạng ghế" value={passenger.ve?.ghe?.tenHangGhe} />
                </dl>

                <div className="payment-information__services">
                  <ServiceGroup
                    title="Hành lý"
                    icon="luggage"
                    services={baggageServices}
                    passengerId={passengerKey}
                  />
                  <ServiceGroup
                    title="Bảo vệ chuyến đi"
                    icon="shield"
                    services={protectionServices}
                    passengerId={passengerKey}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
