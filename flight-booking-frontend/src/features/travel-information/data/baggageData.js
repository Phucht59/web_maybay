import { article, fact, section, step } from "./helpers";

export const baggageGroup = {
  slug: "baggage",
  title: "Hành lý",
  icon: "business_center",
  description: "Chuẩn bị hành lý có chủ đích để mọi chặng di chuyển nhẹ nhàng và ít bất ngờ hơn.",
  imageKey: "category-baggage",
  accent: "teal",
  featuredArticleSlug: "carry-on-baggage",
  callout: { icon: "info", title: "Mỗi hành trình có điều kiện riêng", text: "Các hướng dẫn dưới đây giúp bạn chuẩn bị; hạn mức và điều kiện chính thức cần được xác nhận trên vé và với đơn vị khai thác." },
  items: [
    article({
      slug: "baggage-information", title: "Tra cứu thông tin hành lý", template: "service-overview", imageKey: "baggage-information",
      summary: "Bắt đầu từ loại hành lý và tình huống của bạn để biết những thông tin nào cần xác nhận trước chuyến đi.",
      quickFacts: [fact("luggage", "Phạm vi", "Xách tay, ký gửi và đặc biệt"), fact("search", "Công cụ", "Giao diện hướng dẫn demo"), fact("verified", "Kết quả", "Không thay thế điều kiện vé")],
      sections: [section("choose", "Chọn đúng ngữ cảnh", "Hành lý đi trong khoang, gửi tại quầy và vật dụng đặc biệt có cách chuẩn bị khác nhau."), section("confirm", "Xác nhận nguồn chính thức", "Dùng mã đặt chỗ và thông tin vé để kiểm tra điều kiện áp dụng cho đúng chặng bay.")],
      warnings: [{ tone: "info", title: "Công cụ hướng dẫn demo", text: "Bộ chọn chỉ định hướng nội dung cần đọc và không trả về hạn mức hành lý thực tế." }],
      relatedSlugs: ["carry-on-baggage", "checked-baggage", "special-baggage"],
    }),
    article({
      slug: "carry-on-baggage", title: "Hành lý xách tay", template: "checklist", imageKey: "baggage-carry-on",
      summary: "Sắp xếp những vật dụng cần dùng trong khoang sao cho gọn, dễ kiểm tra và dễ lấy khi cần.",
      checklist: [
        { title: "Nên mang", items: ["Giấy tờ và thuốc cá nhân", "Thiết bị cần thiết đã được bảo vệ", "Một lớp áo nhẹ cho hành trình"] },
        { title: "Không nên để", items: ["Vật chưa rõ điều kiện vận chuyển", "Đồ dễ rò rỉ không được bọc kín", "Giấy tờ quan trọng ở ngăn khó lấy"] },
        { title: "Kiểm tra trước khi đi", items: ["Đối chiếu điều kiện trên vé", "Gắn thông tin liên hệ kín đáo", "Dọn các vật dụng không cần thiết"] },
      ],
      sections: [section("pack", "Đóng gói theo lúc sử dụng", "Đặt giấy tờ, thiết bị và đồ dùng trong chuyến bay ở các ngăn riêng để không phải mở toàn bộ vali."), section("screening", "Chuẩn bị cho kiểm tra an ninh", "Sắp xếp đồ điện tử và chất lỏng theo hướng dẫn tại sân bay để thao tác thuận tiện hơn.")],
      relatedSlugs: ["baggage-information", "restricted-baggage", "checked-baggage"],
    }),
    article({
      slug: "checked-baggage", title: "Hành lý ký gửi miễn cước", template: "comparison", imageKey: "baggage-checked",
      summary: "Bảo vệ đồ đạc, nhận diện vali và lưu chứng từ để chủ động từ lúc đóng gói đến khi nhận hành lý.",
      comparisons: [
        { title: "Trước chuyến bay", icon: "inventory_2", items: ["Bọc vật dễ vỡ", "Gỡ thẻ cũ", "Chụp lại ngoại hình vali"] },
        { title: "Tại sân bay", icon: "conveyor_belt", items: ["Lưu cuống thẻ", "Kiểm tra điểm nhận", "Quan sát tình trạng khi lấy"] },
      ],
      relatedSlugs: ["carry-on-baggage", "extra-baggage", "baggage-issues"],
    }),
    article({
      slug: "extra-baggage", title: "Mua thêm hành lý ký gửi", template: "comparison", imageKey: "baggage-extra",
      summary: "Ước lượng nhu cầu sớm và kiểm tra các lựa chọn có trong đặt chỗ trước khi mang hành lý đến sân bay.",
      comparisons: [
        { title: "Chuẩn bị trước", icon: "event_available", items: ["Rà soát hành lý dự kiến", "Xem điều kiện vé", "Dùng kênh quản lý đặt chỗ nếu có"] },
        { title: "Xử lý tại sân bay", icon: "support_agent", items: ["Đến đúng quầy phục vụ", "Giữ xác nhận giao dịch", "Sắp xếp lại nếu được yêu cầu"] },
      ],
      warnings: [{ tone: "note", title: "Không hiển thị giá ước tính", text: "Chi phí phụ thuộc hành trình và điều kiện thực tế; trang này không tạo giá hoặc mức giảm giả định." }],
      relatedSlugs: ["checked-baggage", "baggage-information"],
    }),
    article({
      slug: "special-baggage", title: "Hành lý đặc biệt", template: "guide", imageKey: "baggage-special",
      summary: "Chuẩn bị nhạc cụ, dụng cụ thể thao hoặc kiện có hình dạng đặc biệt bằng kế hoạch đóng gói và xác nhận sớm.",
      checklist: [{ title: "Trước khi đóng gói", items: ["Mô tả chính xác vật dụng", "Dùng hộp bảo vệ phù hợp", "Hỏi kênh hỗ trợ về cách tiếp nhận"] }],
      relatedSlugs: ["restricted-baggage", "baggage-information"],
    }),
    article({
      slug: "restricted-baggage", title: "Hành lý hạn chế vận chuyển", template: "checklist", imageKey: "baggage-restricted",
      summary: "Nhận diện vật dụng cần kiểm tra thêm trước khi đóng gói để tránh phải xử lý lại tại điểm kiểm tra.",
      checklist: [{ title: "Dừng lại và xác nhận", items: ["Pin và thiết bị điện tử", "Chất lỏng hoặc bình nén", "Vật sắc nhọn và vật liệu chưa rõ thành phần"] }],
      warnings: [{ tone: "warning", title: "Không dựa vào phỏng đoán", text: "Danh mục có thể thay đổi theo cơ quan chức năng và chặng bay. Hãy xác nhận nguồn chính thức trước khi mang theo." }],
      relatedSlugs: ["carry-on-baggage", "special-baggage"],
    }),
    article({
      slug: "baggage-issues", title: "Gặp vấn đề với hành lý", template: "support-flow", imageKey: "baggage-issues",
      summary: "Bốn việc nên làm khi hành lý đến chậm, có dấu hiệu hư hỏng hoặc chưa xuất hiện tại băng chuyền.",
      steps: [step("Xác nhận tình trạng", "Kiểm tra đúng băng chuyền và khu vực nhận."), step("Giữ giấy tờ", "Chuẩn bị thẻ hành lý, thẻ lên máy bay và ảnh vali."), step("Liên hệ quầy hỗ trợ", "Mô tả tình trạng trước khi rời khu nhận hành lý."), step("Theo dõi yêu cầu", "Lưu mã hồ sơ và kênh cập nhật được cung cấp.")],
      warnings: [{ tone: "urgent", title: "Hành động ngay tại sân bay", text: "Nếu có thể, hãy ghi nhận tình trạng với quầy hỗ trợ trước khi rời khu vực nhận hành lý." }],
      relatedSlugs: ["checked-baggage", "baggage-information"],
    }),
  ],
};
