import { article, section, step } from "./helpers";

export const checkInGroup = {
  slug: "check-in", title: "Làm thủ tục", icon: "person_check",
  description: "Chọn cách làm thủ tục phù hợp và chuẩn bị một lộ trình rõ ràng từ xác nhận đặt chỗ đến cửa khởi hành.",
  imageKey: "category-check-in", accent: "sky",
  featuredArticleSlug: "online-check-in",
  callout: { icon: "schedule", title: "Theo dõi thông báo chuyến bay", text: "Thời điểm phục vụ có thể khác theo chặng và đơn vị khai thác. Hãy dùng thời gian trên vé và thông báo mới nhất làm căn cứ." },
  items: [
    article({
      slug: "online-check-in", title: "Làm thủ tục trực tuyến", template: "step-by-step", imageKey: "check-in-online",
      summary: "Chuẩn bị mã đặt chỗ, thông tin hành khách và các xác nhận cần thiết trước khi bắt đầu quy trình trực tuyến.",
      steps: [step("Mở kênh chính thức", "Truy cập chức năng từ website hoặc ứng dụng được xác nhận."), step("Nhập thông tin", "Dùng mã đặt chỗ và họ tên đúng như trên vé."), step("Rà soát hành trình", "Kiểm tra chặng, hành khách và lựa chọn hiển thị."), step("Lưu xác nhận", "Giữ thẻ lên máy bay hoặc hướng dẫn tiếp theo ở nơi dễ mở.")],
      sections: [section("ready", "Trước khi bắt đầu", "Đảm bảo thông tin giấy tờ khớp với đặt chỗ và thiết bị có kết nối ổn định."), section("after", "Sau khi hoàn tất", "Đọc kỹ hướng dẫn về hành lý, điểm phục vụ và các bước vẫn cần thực hiện tại sân bay.")],
      warnings: [{ tone: "info", title: "Chưa có chức năng check-in thật", text: "Dự án hiện chưa có route làm thủ tục trực tuyến. Hãy dùng kênh hỗ trợ hoặc thông tin của đơn vị khai thác." }],
      secondaryAction: { label: "Xem cách làm thủ tục tại sân bay", toSlug: "airport-check-in" },
      relatedSlugs: ["kiosk-check-in", "airport-check-in"],
    }),
    article({
      slug: "kiosk-check-in", title: "Làm thủ tục tại kiosk", template: "step-by-step", imageKey: "check-in-kiosk",
      summary: "Thao tác tại máy tự phục vụ theo từng bước và biết khi nào nên chuyển sang quầy hỗ trợ.",
      steps: [step("Chọn ngôn ngữ", "Bắt đầu trên màn hình chính của kiosk."), step("Xác định đặt chỗ", "Làm theo một trong các cách nhận diện được kiosk hỗ trợ."), step("Kiểm tra thông tin", "Rà soát hành khách và chặng bay."), step("Nhận hướng dẫn", "Lưu thẻ lên máy bay và đi đến điểm gửi hành lý nếu cần.")],
      faqs: [{ question: "Nếu kiosk không tìm thấy đặt chỗ?", answer: "Không nhập thử quá nhiều lần. Kiểm tra lại thông tin và chuyển đến quầy hỗ trợ gần nhất." }, { question: "Kiosk có thay thế mọi bước tại quầy?", answer: "Không phải trong mọi trường hợp; hành lý hoặc yêu cầu đặc biệt vẫn có thể cần nhân viên hỗ trợ." }],
      relatedSlugs: ["online-check-in", "airport-check-in"],
    }),
    article({
      slug: "airport-check-in", title: "Làm thủ tục tại sân bay", template: "step-by-step", imageKey: "check-in-airport",
      summary: "Theo một lộ trình dễ nhớ từ bảng thông tin, quầy thủ tục, kiểm tra an ninh đến cửa khởi hành.",
      steps: [step("Xác định quầy", "Đối chiếu chuyến bay trên bảng thông tin."), step("Hoàn tất thủ tục", "Chuẩn bị giấy tờ và đặt chỗ trước khi đến lượt."), step("Qua kiểm tra", "Sắp xếp đồ dùng để thao tác thuận tiện."), step("Đến cửa khởi hành", "Theo dõi thay đổi và thông báo tại nhà ga.")],
      checklist: [{ title: "Giấy tờ hướng dẫn chung", items: ["Giấy tờ tùy thân phù hợp hành trình", "Thông tin vé hoặc mã đặt chỗ", "Xác nhận dịch vụ đặc biệt nếu có"] }],
      relatedSlugs: ["online-check-in", "airport-information", "airport-maps"],
    }),
  ],
};
