import { Link } from "react-router-dom";
import baggageImage from "../../assets/travel-information/baggage.webp";
import travelOverviewImage from "../../assets/travel-information/travel-overview.webp";
import airportImage from "../../assets/travel-information/airports.webp";
import loungeImage from "../../assets/travel-information/articles/airports/business-lounges.webp";
import specialServicesImage from "../../assets/travel-information/special-services.webp";
import specialMealImage from "../../assets/travel-information/articles/special-services/special-meals.svg";
import checkInImage from "../../assets/travel-information/check-in.webp";
import "../../styles/pages/experience-pages.css";

const MaterialIcon = ({ name, fill = false }) => (
  <span
    className="material-symbols-outlined"
    aria-hidden="true"
    style={{
      fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
);

const SectionHeading = ({ eyebrow, title, description, align = "left" }) => (
  <div className={`experience-section-heading is-${align}`}>
    <span className="experience-eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>
);

const AccentLink = ({ to, children }) => (
  <Link className="experience-text-link" to={to}>
    <span>{children}</span>
    <MaterialIcon name="arrow_forward" />
  </Link>
);

export function AdditionalServicesPage() {
  const services = [
    {
      icon: "luggage",
      title: "Hành lý trả trước",
      description:
        "Chủ động chuẩn bị thêm hành lý ký gửi cho những hành trình cần mang theo nhiều hơn.",
      to: "/travel-information/baggage/extra-baggage",
      accent: "teal",
    },
    {
      icon: "airline_seat_recline_extra",
      title: "Chọn ghế & thêm chỗ ngồi",
      description:
        "Tìm hiểu các lựa chọn chỗ ngồi và cách chuẩn bị khi hành khách có nhu cầu về không gian riêng.",
      to: "/travel-information/special-services/extra-seat",
      accent: "gold",
    },
    {
      icon: "restaurant",
      title: "Suất ăn đặc biệt",
      description:
        "Chuẩn bị yêu cầu suất ăn phù hợp với nhu cầu cá nhân, văn hóa hoặc chế độ ăn uống.",
      to: "/travel-information/special-services/special-meals",
      accent: "coral",
    },
    {
      icon: "workspace_premium",
      title: "Nâng tầm trải nghiệm",
      description:
        "Khám phá những lựa chọn giúp hành trình thoải mái hơn từ sân bay đến khoang hành khách.",
      to: "/flight-experience",
      accent: "navy",
    },
    {
      icon: "hotel",
      title: "Khách sạn & hành trình",
      description:
        "Gợi ý cách chuẩn bị nơi lưu trú và kế hoạch di chuyển để chuyến đi liền mạch hơn.",
      to: "/travel-information/travel-advice",
      accent: "green",
    },
    {
      icon: "support_agent",
      title: "Hỗ trợ đặc biệt",
      description:
        "Thông tin dành cho trẻ em, hành khách cần hỗ trợ di chuyển và các nhu cầu phục vụ riêng.",
      to: "/travel-information/special-services",
      accent: "violet",
    },
  ];

  return (
    <main className="experience-page additional-services-page">
      <section className="experience-hero additional-services-hero">
        <img src={baggageImage} alt="Hành lý và dịch vụ chuẩn bị cho chuyến bay" />
        <div className="experience-hero-overlay" />
        <div className="experience-hero-glow" />
        <div className="experience-hero-content">
          <span className="experience-eyebrow light">Dịch vụ bổ trợ</span>
          <h1>Nâng tầm hành trình theo cách của bạn</h1>
          <p>
            Chuẩn bị trước những dịch vụ cần thiết để mỗi chuyến đi thuận tiện,
            thoải mái và phù hợp hơn với nhu cầu riêng của bạn.
          </p>
          <div className="experience-hero-actions">
            <a className="experience-button primary" href="#dich-vu-noi-bat">
              Khám phá dịch vụ
              <MaterialIcon name="south" />
            </a>
            <Link className="experience-button ghost" to="/flight-selection">
              Tìm chuyến bay
              <MaterialIcon name="flight_takeoff" />
            </Link>
          </div>
        </div>
        <div className="experience-hero-caption">
          <MaterialIcon name="verified" fill />
          <span>Chuẩn bị sớm · Chủ động hơn · Hành trình nhẹ nhàng hơn</span>
        </div>
      </section>

      <section id="dich-vu-noi-bat" className="experience-section services-showcase-section">
        <SectionHeading
          eyebrow="Tiện ích cho chuyến đi"
          title="Chọn điều bạn cần trước khi khởi hành"
          description="Các nội dung dưới đây giúp bạn hình dung và chuẩn bị những dịch vụ thường được hành khách quan tâm trước chuyến bay."
        />

        <div className="additional-service-grid">
          {services.map((service, index) => (
            <Link
              key={service.title}
              to={service.to}
              className={`additional-service-card accent-${service.accent}`}
              style={{ "--card-order": index }}
            >
              <div className="additional-service-icon">
                <MaterialIcon name={service.icon} />
              </div>
              <div className="additional-service-card-copy">
                <span className="additional-service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
              <span className="additional-service-arrow">
                <MaterialIcon name="north_east" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="experience-section service-preparation-section">
        <div className="service-preparation-media">
          <img src={specialServicesImage} alt="Hành khách được hỗ trợ trong hành trình" />
          <div className="service-floating-card">
            <span className="material-symbols-outlined">travel</span>
            <div>
              <strong>Một hành trình tốt</strong>
              <small>bắt đầu từ sự chuẩn bị phù hợp.</small>
            </div>
          </div>
        </div>

        <div className="service-preparation-copy">
          <span className="experience-eyebrow">Chuẩn bị thông minh</span>
          <h2>Ba điều nên làm trước chuyến bay</h2>
          <ol className="service-preparation-list">
            <li>
              <span>01</span>
              <div>
                <h3>Kiểm tra nhu cầu thực tế</h3>
                <p>Xác định hành lý, chỗ ngồi, suất ăn hoặc hỗ trợ mà bạn thực sự cần.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Đối chiếu điều kiện vé</h3>
                <p>Mỗi hành trình có thể có điều kiện khác nhau, vì vậy hãy kiểm tra thông tin trên đặt chỗ.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Chuẩn bị càng sớm càng tốt</h3>
                <p>Một số dịch vụ cần được yêu cầu trước để đơn vị khai thác có đủ thời gian sắp xếp.</p>
              </div>
            </li>
          </ol>
          <AccentLink to="/travel-information">Xem cẩm nang hành trình</AccentLink>
        </div>
      </section>

      <section className="experience-wide-banner service-wide-banner">
        <div>
          <span className="experience-eyebrow light">Bay nhẹ nhàng hơn</span>
          <h2>Chuẩn bị trước. An tâm tận hưởng hành trình.</h2>
          <p>
            Từ hành lý đến những nhu cầu phục vụ riêng, một chút chuẩn bị trước chuyến đi
            giúp bạn có nhiều thời gian hơn cho điều quan trọng nhất: tận hưởng hành trình.
          </p>
        </div>
        <Link className="experience-button pale" to="/flight-selection">
          Bắt đầu hành trình
          <MaterialIcon name="arrow_forward" />
        </Link>
      </section>

      <section className="experience-section service-note-section">
        <SectionHeading eyebrow="Lưu ý" title="Thông tin nên được xác nhận theo từng hành trình" />
        <div className="service-note-grid">
          {[
            ["confirmation_number", "Điều kiện vé", "Quyền lợi và điều kiện áp dụng có thể khác nhau theo hạng vé và chuyến bay."],
            ["schedule", "Thời điểm yêu cầu", "Một số dịch vụ cần được đăng ký hoặc xác nhận trước thời gian khởi hành."],
            ["support_agent", "Kênh hỗ trợ", "Nếu có nhu cầu đặc biệt, hãy cung cấp thông tin rõ ràng để được hướng dẫn phù hợp."],
          ].map(([icon, title, text]) => (
            <article key={title}>
              <MaterialIcon name={icon} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function FlightExperiencePage() {
  return (
    <main className="experience-page flight-experience-page">
      <section className="experience-hero flight-experience-hero">
        <img src={travelOverviewImage} alt="Hành trình bay và trải nghiệm của hành khách" />
        <div className="experience-hero-overlay" />
        <div className="experience-hero-content centered">
          <span className="experience-eyebrow light">Trải nghiệm bay</span>
          <h1>Thoải mái hơn trên mỗi hành trình</h1>
          <p>
            Từ lúc bước vào sân bay đến khi máy bay hạ cánh, mỗi điểm chạm đều góp phần
            tạo nên một chuyến đi dễ chịu và đáng nhớ hơn.
          </p>
          <a className="experience-scroll-hint" href="#khoang-hanh-khach" aria-label="Xem nội dung trải nghiệm bay">
            <span>Khám phá trải nghiệm</span>
            <MaterialIcon name="keyboard_arrow_down" />
          </a>
        </div>
      </section>

      <section id="khoang-hanh-khach" className="experience-section editorial-section">
        <SectionHeading
          eyebrow="Trên hành trình"
          title="Một không gian được chuẩn bị cho sự thoải mái"
          description="Trải nghiệm bay không chỉ nằm ở điểm đến mà còn ở cách hành khách cảm nhận từng khoảng thời gian trong chuyến đi."
        />

        <div className="editorial-grid">
          <article className="editorial-feature-card">
            <div className="editorial-image-wrap">
              <img src={loungeImage} alt="Không gian phòng chờ sân bay" />
              <span className="editorial-index">01</span>
            </div>
            <div className="editorial-copy">
              <span>Không gian & sự thoải mái</span>
              <h3>Thư thái từ trước giờ khởi hành</h3>
              <p>
                Chủ động thời gian tại sân bay, lựa chọn không gian nghỉ phù hợp và chuẩn bị
                những vật dụng cần thiết giúp hành trình bắt đầu nhẹ nhàng hơn.
              </p>
              <AccentLink to="/travel-information/airports/business-lounges">Tìm hiểu phòng khách sân bay</AccentLink>
            </div>
          </article>

          <article className="editorial-side-card">
            <img src={specialMealImage} alt="Suất ăn trong hành trình" />
            <div>
              <span>Ẩm thực trên không</span>
              <h3>Một bữa ăn phù hợp cũng là một phần của trải nghiệm</h3>
              <p>Chuẩn bị trước nhu cầu ăn uống giúp chuyến bay thoải mái và chủ động hơn.</p>
              <AccentLink to="/travel-information/special-services/special-meals">Xem thông tin suất ăn</AccentLink>
            </div>
          </article>

          <article className="editorial-side-card reverse">
            <img src={checkInImage} alt="Hành khách làm thủ tục chuyến bay" />
            <div>
              <span>Chủ động thời gian</span>
              <h3>Khởi đầu suôn sẻ với quá trình làm thủ tục</h3>
              <p>Chuẩn bị giấy tờ và làm thủ tục đúng cách giúp giảm bớt áp lực trước giờ bay.</p>
              <AccentLink to="/travel-information/check-in">Xem hướng dẫn làm thủ tục</AccentLink>
            </div>
          </article>
        </div>
      </section>

      <section className="experience-section journey-section">
        <SectionHeading
          eyebrow="Từ đầu đến cuối"
          title="Ba chặng của một trải nghiệm liền mạch"
          description="Mỗi giai đoạn đều có những việc nhỏ bạn có thể chuẩn bị để hành trình diễn ra tự nhiên và dễ chịu hơn."
          align="center"
        />

        <div className="journey-track">
          <article>
            <span className="journey-icon"><MaterialIcon name="flight_takeoff" /></span>
            <small>01</small>
            <h3>Trước chuyến bay</h3>
            <p>Kiểm tra hành lý, giấy tờ, thời gian làm thủ tục và những dịch vụ cần chuẩn bị trước.</p>
          </article>
          <article>
            <span className="journey-icon"><MaterialIcon name="airline_seat_recline_normal" /></span>
            <small>02</small>
            <h3>Trong chuyến bay</h3>
            <p>Sắp xếp đồ dùng dễ lấy, giữ nhịp nghỉ hợp lý và tận hưởng không gian trong hành trình.</p>
          </article>
          <article>
            <span className="journey-icon"><MaterialIcon name="flight_land" /></span>
            <small>03</small>
            <h3>Khi hạ cánh</h3>
            <p>Kiểm tra hành lý, tiếp tục hành trình tại điểm đến và liên hệ hỗ trợ nếu có vấn đề phát sinh.</p>
          </article>
        </div>
      </section>

      <section className="experience-cinematic-section">
        <img src={airportImage} alt="Không gian sân bay và hành trình tiếp nối" />
        <div className="experience-cinematic-overlay" />
        <div className="experience-cinematic-copy">
          <MaterialIcon name="airlines" />
          <blockquote>
            “Mỗi chuyến bay không chỉ là một điểm đến, mà còn là một phần của hành trình.”
          </blockquote>
          <p>Chuẩn bị tốt để từng khoảnh khắc trên đường đi trở nên nhẹ nhàng hơn.</p>
        </div>
      </section>

      <section className="experience-section experience-detail-cards">
        <article>
          <div className="experience-detail-icon"><MaterialIcon name="airline_seat_legroom_extra" /></div>
          <span>Không gian cá nhân</span>
          <h3>Chuẩn bị cho sự thoải mái</h3>
          <p>Chọn trang phục phù hợp, sắp xếp vật dụng gọn gàng và cân nhắc nhu cầu chỗ ngồi của bạn.</p>
        </article>
        <article>
          <div className="experience-detail-icon"><MaterialIcon name="restaurant_menu" /></div>
          <span>Ẩm thực</span>
          <h3>Ăn uống theo nhu cầu</h3>
          <p>Nếu có yêu cầu đặc biệt về ăn uống, hãy tìm hiểu và gửi yêu cầu qua kênh phù hợp trước chuyến đi.</p>
        </article>
        <article>
          <div className="experience-detail-icon"><MaterialIcon name="headphones" /></div>
          <span>Thư giãn</span>
          <h3>Tạo nhịp nghỉ cho riêng bạn</h3>
          <p>Mang theo tai nghe, nội dung giải trí cá nhân hoặc một cuốn sách để thời gian trên không dễ chịu hơn.</p>
        </article>
      </section>

      <section className="experience-wide-banner flight-experience-banner">
        <div>
          <span className="experience-eyebrow light">Sẵn sàng khởi hành?</span>
          <h2>Chọn chuyến bay và bắt đầu hành trình của bạn.</h2>
        </div>
        <Link className="experience-button pale" to="/flight-selection">
          Tìm chuyến bay
          <MaterialIcon name="arrow_forward" />
        </Link>
      </section>
    </main>
  );
}

export function LotusmilesPage() {
  const tiers = [
    {
      name: "Silver",
      icon: "filter_vintage",
      className: "silver",
      description: "Khởi đầu hành trình hội viên và làm quen với trải nghiệm tích lũy dặm.",
    },
    {
      name: "Titanium",
      icon: "diamond",
      className: "titanium",
      description: "Dành cho hội viên đồng hành thường xuyên hơn và mong muốn thêm sự thuận tiện.",
    },
    {
      name: "Gold",
      icon: "workspace_premium",
      className: "gold",
      description: "Trải nghiệm nổi bật hơn với các quyền lợi ưu tiên dành cho hội viên thân thiết.",
    },
    {
      name: "Platinum",
      icon: "hotel_class",
      className: "platinum",
      description: "Cấp hội viên cao với định hướng trải nghiệm đặc quyền và ưu tiên xuyên suốt hành trình.",
    },
  ];

  return (
    <main className="experience-page lotusmiles-page">
      <section className="lotus-hero">
        <div className="lotus-hero-pattern" />
        <div className="lotus-orb orb-one" />
        <div className="lotus-orb orb-two" />
        <div className="lotus-hero-copy">
          <span className="experience-eyebrow light">Lotusmiles</span>
          <h1>Bay nhiều hơn.<br />Nhận nhiều hơn.</h1>
          <p>
            Mỗi hành trình là một cơ hội tích lũy thêm giá trị và tiến gần hơn đến những
            trải nghiệm dành riêng cho khách hàng đồng hành thường xuyên.
          </p>
          <div className="experience-hero-actions">
            <a className="experience-button gold" href="#quyen-loi-hoi-vien">
              Khám phá quyền lợi
              <MaterialIcon name="south" />
            </a>
            <Link className="experience-button ghost" to="/flight-selection">
              Tìm chuyến bay
              <MaterialIcon name="flight_takeoff" />
            </Link>
          </div>
        </div>

        <div className="lotus-card-stage" aria-label="Minh họa thẻ hội viên Lotusmiles">
          <div className="lotus-membership-card card-back">
            <span className="lotus-card-chip" />
            <MaterialIcon name="filter_vintage" fill />
            <small>LOTUSMILES</small>
            <strong>MEMBER</strong>
          </div>
          <div className="lotus-membership-card card-front">
            <div className="lotus-card-topline">
              <MaterialIcon name="filter_vintage" fill />
              <span>LOTUSMILES</span>
            </div>
            <div className="lotus-card-center">
              <small>MEMBERSHIP</small>
              <strong>GOLD</strong>
            </div>
            <div className="lotus-card-bottom">
              <span>Fly · Earn · Enjoy</span>
              <MaterialIcon name="airlines" />
            </div>
          </div>
        </div>
      </section>

      <section className="experience-section lotus-how-section">
        <SectionHeading
          eyebrow="Mỗi hành trình đều mang lại giá trị"
          title="Bay · Tích lũy · Tận hưởng"
          description="Ý tưởng của Lotusmiles rất đơn giản: hành trình bạn thực hiện hôm nay có thể mở ra thêm giá trị cho những chuyến đi sau."
          align="center"
        />

        <div className="lotus-how-track">
          <article>
            <span className="lotus-step-number">01</span>
            <div className="lotus-step-icon"><MaterialIcon name="flight" /></div>
            <h3>Bay</h3>
            <p>Thực hiện những hành trình đủ điều kiện cùng chương trình khách hàng thân thiết.</p>
          </article>
          <article>
            <span className="lotus-step-number">02</span>
            <div className="lotus-step-icon"><MaterialIcon name="add_circle" /></div>
            <h3>Tích dặm</h3>
            <p>Tích lũy dặm từ hành trình và những hoạt động phù hợp với điều kiện chương trình.</p>
          </article>
          <article>
            <span className="lotus-step-number">03</span>
            <div className="lotus-step-icon"><MaterialIcon name="redeem" /></div>
            <h3>Tận hưởng</h3>
            <p>Sử dụng giá trị tích lũy và tận hưởng những quyền lợi dành cho từng hạng hội viên.</p>
          </article>
        </div>
      </section>

      <section id="quyen-loi-hoi-vien" className="lotus-benefits-section">
        <div className="lotus-benefits-inner">
          <SectionHeading
            eyebrow="Quyền lợi hội viên"
            title="Sự thuận tiện được cộng thêm qua mỗi chuyến đi"
            description="Các nhóm quyền lợi dưới đây mô tả định hướng trải nghiệm của chương trình, không thay thế điều kiện hội viên chính thức."
          />

          <div className="lotus-benefit-grid">
            {[
              ["toll", "Tích lũy dặm thưởng", "Ghi nhận giá trị từ những hành trình và hoạt động đủ điều kiện."],
              ["fast_forward", "Ưu tiên làm thủ tục", "Hướng đến trải nghiệm tại sân bay nhanh gọn hơn cho hội viên phù hợp."],
              ["luggage", "Ưu tiên hành lý", "Tăng sự thuận tiện trong quá trình xử lý hành lý theo quyền lợi từng hạng."],
              ["loyalty", "Ưu đãi hội viên", "Tiếp cận các quyền lợi và trải nghiệm được thiết kế cho khách hàng thân thiết."],
            ].map(([icon, title, text], index) => (
              <article key={title} style={{ "--benefit-order": index }}>
                <div className="lotus-benefit-icon"><MaterialIcon name={icon} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="lotus-benefit-line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="experience-section lotus-tier-section">
        <SectionHeading
          eyebrow="Hạng hội viên"
          title="Càng đồng hành, hành trình càng nhiều dấu ấn"
          description="Bốn thẻ dưới đây được trình bày như nội dung giới thiệu trực quan cho các cấp hội viên trong trang demo."
        />

        <div className="lotus-tier-grid">
          {tiers.map((tier, index) => (
            <article key={tier.name} className={`lotus-tier-card is-${tier.className}`}>
              <div className="lotus-tier-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <MaterialIcon name={tier.icon} fill />
              </div>
              <div className="lotus-tier-copy">
                <small>LOTUSMILES</small>
                <h3>{tier.name}</h3>
                <p>{tier.description}</p>
              </div>
              <div className="lotus-tier-footer">
                <span>Member tier</span>
                <MaterialIcon name="arrow_outward" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="lotus-story-section">
        <div className="lotus-story-media">
          <img src={loungeImage} alt="Không gian dành cho trải nghiệm hội viên" />
        </div>
        <div className="lotus-story-copy">
          <span className="experience-eyebrow">Hành trình của riêng bạn</span>
          <h2>Càng đồng hành, càng nhiều đặc quyền.</h2>
          <p>
            Lotusmiles được giới thiệu như một phần mở rộng của trải nghiệm bay: ghi nhận
            sự đồng hành, mang đến thêm giá trị và tạo cảm giác được chào đón trong những chuyến đi tiếp theo.
          </p>
          <div className="lotus-story-points">
            <span><MaterialIcon name="check_circle" fill /> Tích lũy qua hành trình</span>
            <span><MaterialIcon name="check_circle" fill /> Quyền lợi theo hạng hội viên</span>
            <span><MaterialIcon name="check_circle" fill /> Trải nghiệm ưu tiên hơn</span>
          </div>
          <Link className="experience-button dark" to="/flight-selection">
            Tiếp tục hành trình
            <MaterialIcon name="arrow_forward" />
          </Link>
        </div>
      </section>

      <section className="experience-wide-banner lotus-end-banner">
        <div>
          <span className="experience-eyebrow light">Lotusmiles</span>
          <h2>Mỗi chuyến đi là một bước tiến trên hành trình hội viên.</h2>
        </div>
        <Link className="experience-button gold" to="/flight-selection">
          Khám phá chuyến bay
          <MaterialIcon name="flight_takeoff" />
        </Link>
      </section>
    </main>
  );
}