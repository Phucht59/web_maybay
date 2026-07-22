import { Link, Navigate, useParams } from "react-router-dom";
import vietnamDestinations from "../../assets/destinations/vietnam-destinations.png";
import internationalDestinations from "../../assets/destinations/international-destinations.png";
import "../../styles/pages/blog-article.css";

const ARTICLES = {
  "48-gio-kham-pha-ha-noi": {
    tag: "Ẩm thực & Văn hóa",
    title: "48 giờ ăn và khám phá Hà Nội như một người bản địa",
    intro: "Một cuối tuần đủ chậm để nghe tiếng phố thức giấc, đủ dài để nếm trọn những tầng hương vị làm nên linh hồn Hà Nội.",
    readTime: "6 phút đọc",
    date: "18 tháng 7, 2026",
    image: vietnamDestinations,
    position: "0% 0%",
    route: { from: "SGN", to: "HAN", label: "Bay đến Hà Nội" },
    quote: "Hà Nội đẹp nhất khi ta thôi vội vàng và để từng con phố tự kể câu chuyện của mình.",
    sections: [
      { title: "Ngày đầu tiên: chạm vào nhịp sống phố cổ", paragraphs: ["Hãy bắt đầu trước 7 giờ sáng, khi phố cổ còn trong trẻo và những gánh hàng vừa nhóm bếp. Một bát phở bò nóng ở phố Lò Đúc, chút quẩy giòn và ly trà đá là lời chào đúng chất Hà Nội.", "Từ hồ Hoàn Kiếm, đi bộ qua cầu Thê Húc rồi rẽ vào Đinh Liệt, Hàng Bạc và Mã Mây. Đừng chỉ nhìn mặt tiền: những ô cửa gỗ, ban công phủ rêu và tiếng rao trong ngõ nhỏ mới là phần ký ức sống động nhất của khu phố."], tips: ["Mang giày mềm vì hành trình đẹp nhất là đi bộ.", "Gọi món theo khẩu phần nhỏ để thử được nhiều hương vị."] },
      { title: "Buổi chiều của nghệ thuật và cà phê", paragraphs: ["Sau bữa bún chả thơm mùi than hoa, ghé Bảo tàng Mỹ thuật Việt Nam hoặc Văn Miếu. Khoảng 4 giờ chiều là lúc hoàn hảo để ngồi trên một ban công cũ, gọi cà phê trứng và nhìn dòng xe chảy chậm bên dưới.", "Khi hoàng hôn xuống, hồ Tây chuyển màu mật ong. Đi một vòng đường Thanh Niên, dừng ở chùa Trấn Quốc rồi thưởng thức bánh tôm giòn nóng bên hồ."], tips: ["Nên đặt chỗ trước tại các quán cà phê có sân thượng.", "Chiều hồ Tây có gió; mang theo một áo khoác mỏng."] },
      { title: "Ngày thứ hai: một Hà Nội thanh lịch", paragraphs: ["Dành buổi sáng cho khu phố Pháp với Nhà hát Lớn, khách sạn Metropole và những đại lộ rợp cây. Bữa trưa có thể là chả cá ăn cùng thì là, hành lá và mắm tôm đánh bông.", "Khép lại 48 giờ bằng một buổi xem múa rối nước hoặc dạo chợ đêm. Mang về một gói cốm, chút trà sen và cảm giác rằng Hà Nội vẫn còn rất nhiều điều để quay lại."], tips: ["Phố đi bộ hoạt động vào cuối tuần.", "Kiểm tra giờ mở cửa bảo tàng trước khi đến."] },
    ],
  },
  "bi-quyet-san-ve-quoc-te": {
    tag: "Kinh nghiệm bay",
    title: "Bí quyết săn vé tốt cho chuyến đi quốc tế đầu tiên",
    intro: "Từ chọn thời điểm, so sánh hành trình đến chuẩn bị giấy tờ: một kế hoạch thông minh giúp chuyến xuất ngoại đầu tiên nhẹ nhàng hơn nhiều.",
    readTime: "8 phút đọc",
    date: "16 tháng 7, 2026",
    image: internationalDestinations,
    position: "66.666% 0%",
    route: { from: "SGN", to: "SIN", label: "Khám phá vé quốc tế" },
    quote: "Vé tốt không chỉ là vé rẻ nhất, mà là hành trình phù hợp nhất với thời gian, hành lý và trải nghiệm bạn mong muốn.",
    sections: [
      { title: "Bắt đầu bằng một khoảng ngày linh hoạt", paragraphs: ["Thay vì khóa cứng một ngày khởi hành, hãy mở biên độ từ ba đến bảy ngày. Các chuyến giữa tuần thường dễ chịu hơn về giá và sân bay cũng ít đông hơn cuối tuần.", "Hãy so sánh tổng chi phí, bao gồm hành lý ký gửi, suất ăn, chọn ghế và thời gian nối chuyến. Một vé thấp hơn đôi khi lại tốn nhiều hơn sau khi cộng các dịch vụ cần thiết."], tips: ["Bật thông báo giá cho hai sân bay lân cận nếu có.", "Tránh đặt lịch sát ngày hết hạn hộ chiếu."] },
      { title: "Chọn hành trình thông minh", paragraphs: ["Với chuyến đầu tiên, bay thẳng thường đáng giá vì giảm rủi ro trễ nối chuyến và thất lạc hành lý. Nếu chọn quá cảnh, hãy dành ít nhất hai đến ba giờ giữa các chặng quốc tế.", "Kiểm tra sân bay đến có gần trung tâm hay không. Chi phí tàu, xe và thời gian di chuyển từ một sân bay xa có thể xóa sạch phần tiền bạn vừa tiết kiệm được."], tips: ["Đọc kỹ điều kiện đổi và hoàn vé.", "Chụp lại hộ chiếu, visa và bảo hiểm để lưu ngoại tuyến."] },
      { title: "Checklist trước ngày cất cánh", paragraphs: ["Xác nhận visa, thời hạn hộ chiếu, quy định nhập cảnh và bảo hiểm du lịch. Làm thủ tục trực tuyến sớm để chọn chỗ ngồi phù hợp và tránh xếp hàng lâu.", "Chuẩn bị một túi cabin gồm sạc, thuốc cá nhân, áo khoác và một bộ đồ mỏng. Đổi một ít tiền mặt, nhưng ưu tiên thẻ thanh toán quốc tế có phí chuyển đổi thấp."], tips: ["Có mặt trước giờ bay quốc tế khoảng ba tiếng.", "Luôn để giấy tờ và vật có giá trị trong hành lý xách tay."] },
    ],
  },
  "mua-hoa-anh-dao-nhat-ban": {
    tag: "Điểm đến",
    title: "Mùa hoa anh đào Nhật Bản: đi đâu và vào thời điểm nào?",
    intro: "Từ Tokyo rực hồng đến những thị trấn yên tĩnh dưới chân núi Phú Sĩ, đây là cách xây dựng hành trình hanami đáng nhớ.",
    readTime: "5 phút đọc",
    date: "12 tháng 7, 2026",
    image: internationalDestinations,
    position: "0% 0%",
    route: { from: "HAN", to: "NRT", label: "Bay đến Tokyo" },
    quote: "Hoa anh đào chỉ nở rộ trong một khoảnh khắc ngắn, vì vậy vẻ đẹp của hanami nằm cả trong sự chờ đợi.",
    sections: [
      { title: "Khi nào hoa nở đẹp nhất?", paragraphs: ["Ở Tokyo, Kyoto và Osaka, mùa hoa thường tập trung từ cuối tháng ba đến đầu tháng tư. Tuy nhiên thời tiết mỗi năm có thể khiến lịch nở thay đổi từ một đến hai tuần.", "Nếu đến sớm, hãy đi về phía nam như Fukuoka. Nếu đến muộn, Sendai, Aomori hoặc Hokkaido sẽ kéo dài mùa hoa đến cuối tháng tư và đầu tháng năm."], tips: ["Theo dõi dự báo sakura khoảng hai tuần trước chuyến đi.", "Đặt phòng có chính sách đổi ngày linh hoạt."] },
      { title: "Ba khung cảnh không nên bỏ lỡ", paragraphs: ["Tokyo có sông Meguro lung linh khi lên đèn và công viên Shinjuku Gyoen rộng rãi cho một buổi picnic. Kyoto lãng mạn với Con đường Triết gia, trong khi hồ Kawaguchi đem đến khung hình hoa anh đào ôm lấy núi Phú Sĩ.", "Hãy dành ít nhất một buổi sáng thật sớm. Trước 8 giờ, ánh sáng dịu, lối đi còn vắng và bạn có thể cảm nhận vẻ tĩnh lặng rất Nhật Bản."], tips: ["Không rung hoặc bẻ cành hoa để chụp ảnh.", "Mang túi đựng rác riêng khi picnic."] },
      { title: "Hành lý cho mùa xuân Nhật Bản", paragraphs: ["Nhiệt độ ngày và đêm chênh lệch rõ rệt. Cách tốt nhất là mặc nhiều lớp: áo giữ nhiệt mỏng, len nhẹ và áo khoác chống gió.", "Một chiếc khăn picnic, bình nước, pin dự phòng và thẻ giao thông sẽ giúp ngày ngắm hoa thuận tiện. Đừng quên chừa dung lượng máy ảnh cho hàng trăm khoảnh khắc màu hồng."], tips: ["Chọn giày phù hợp cho 15.000–20.000 bước mỗi ngày.", "Mang thuốc dị ứng nếu nhạy cảm với phấn hoa."] },
    ],
  },
};

const Icon = ({ children }) => <span className="material-symbols-outlined">{children}</span>;

export default function BlogArticlePage() {
  const { slug } = useParams();
  const article = ARTICLES[slug];
  if (!article) return <Navigate to="/" replace />;

  return (
    <main className="article-page">
      <header className="article-hero">
        <div className="article-hero-image" style={{ backgroundImage: `url(${article.image})`, backgroundPosition: article.position }} />
        <div className="article-hero-shade" />
        <div className="article-hero-content">
          <Link to="/#travel-stories" className="article-back"><Icon>arrow_back</Icon> Cẩm nang du lịch</Link>
          <span className="article-tag">{article.tag}</span>
          <h1>{article.title}</h1>
          <p>{article.intro}</p>
          <div className="article-meta"><span><Icon>calendar_today</Icon>{article.date}</span><span><Icon>schedule</Icon>{article.readTime}</span></div>
        </div>
      </header>

      <div className="article-layout">
        <aside className="article-aside">
          <strong>Trong bài viết</strong>
          {article.sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`}>{String(index + 1).padStart(2, "0")} · {section.title}</a>)}
        </aside>
        <article className="article-content">
          <p className="article-lead">{article.intro}</p>
          <blockquote><Icon>format_quote</Icon><p>{article.quote}</p></blockquote>
          {article.sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.title}>
              <span className="article-section-number">0{index + 1}</span>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div className="article-tips"><strong><Icon>lightbulb</Icon>Mẹo nhỏ cho bạn</strong><ul>{section.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div>
            </section>
          ))}
          <div className="article-cta">
            <div><span>Sẵn sàng lên đường?</span><h2>Biến cảm hứng thành hành trình</h2><p>Khám phá lịch bay và chọn chuyến đi phù hợp nhất với bạn.</p></div>
            <Link to={`/flight-selection?from=${article.route.from}&to=${article.route.to}`}>{article.route.label}<Icon>arrow_forward</Icon></Link>
          </div>
        </article>
      </div>
    </main>
  );
}
