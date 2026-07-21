const item = (slug, title, summary) => ({ slug, title, summary });

export const TRAVEL_GROUPS = [
  {
    slug: "baggage", title: "Hành lý", icon: "business_center",
    description: "Chuẩn bị hành lý đúng cách để hành trình nhẹ nhàng và chủ động hơn.",
    items: [
      item("baggage-information", "Tra cứu thông tin hành lý", "Tổng quan các loại hành lý và những điều nên kiểm tra trước chuyến bay."),
      item("carry-on-baggage", "Hành lý xách tay", "Cách sắp xếp vật dụng cần thiết và chuẩn bị hành lý mang lên khoang khách."),
      item("checked-baggage", "Hành lý ký gửi miễn cước", "Thông tin hướng dẫn chung về hành lý ký gửi đi cùng vé."),
      item("extra-baggage", "Mua thêm hành lý ký gửi", "Các bước tham khảo khi nhu cầu hành lý vượt quá tiêu chuẩn vé."),
      item("special-baggage", "Hành lý đặc biệt", "Chuẩn bị dụng cụ thể thao, nhạc cụ và vật dụng có kích thước đặc biệt."),
      item("restricted-baggage", "Hành lý hạn chế vận chuyển", "Nhận biết những vật phẩm cần kiểm tra kỹ trước khi đóng gói."),
      item("baggage-issues", "Gặp vấn đề với hành lý", "Những việc nên làm khi hành lý chậm, hư hỏng hoặc thất lạc."),
    ],
  },
  {
    slug: "check-in", title: "Làm thủ tục", icon: "person_check",
    description: "Chọn phương thức làm thủ tục phù hợp và đến cửa khởi hành đúng giờ.",
    items: [
      item("online-check-in", "Làm thủ tục trực tuyến", "Chuẩn bị thông tin đặt chỗ và nhận thẻ lên máy bay trực tuyến."),
      item("kiosk-check-in", "Làm thủ tục tại kiosk", "Hướng dẫn thao tác nhanh tại kiosk tự phục vụ ở sân bay."),
      item("airport-check-in", "Làm thủ tục tại sân bay", "Các bước từ quầy làm thủ tục đến khu vực kiểm tra an ninh."),
    ],
  },
  {
    slug: "airports", title: "Thông tin sân bay", icon: "domain",
    description: "Tìm hiểu tiện ích, lối di chuyển và dịch vụ hỗ trợ tại sân bay.",
    items: [
      item("business-lounges", "Phòng khách Thương gia", "Không gian nghỉ ngơi và tiện ích trước giờ khởi hành."),
      item("airport-priority-services", "Dịch vụ ưu tiên tại sân bay", "Thông tin chung về các luồng phục vụ ưu tiên."),
      item("airport-information", "Thông tin sân bay", "Những thông tin hữu ích về nhà ga, giao thông và thời gian có mặt."),
      item("connecting-services", "Dịch vụ nối chuyến", "Chuẩn bị cho hành trình có một hoặc nhiều chặng nối chuyến."),
      item("airport-maps", "Bản đồ sân bay", "Cách xác định quầy làm thủ tục, cửa ra máy bay và khu tiện ích."),
    ],
  },
  {
    slug: "special-services", title: "Dịch vụ đặc biệt", icon: "featured_seasonal_and_gifts",
    description: "Chủ động đăng ký hỗ trợ phù hợp với nhu cầu riêng của từng hành khách.",
    items: [
      item("pet-transport", "Vận chuyển thú cưng", "Chuẩn bị giấy tờ, lồng vận chuyển và kế hoạch chăm sóc thú cưng."),
      item("special-meals", "Suất ăn đặc biệt", "Tham khảo cách gửi yêu cầu suất ăn theo nhu cầu cá nhân."),
      item("services-for-children", "Dịch vụ cho trẻ em", "Chuẩn bị một chuyến bay thoải mái hơn cho gia đình có trẻ nhỏ."),
      item("unaccompanied-minors", "Trẻ em đi một mình", "Các bước chuẩn bị và bàn giao trẻ trong hành trình không có người lớn đi cùng."),
      item("infant-separate-seat", "Trẻ em dưới 02 tuổi ngồi ghế riêng", "Những điểm gia đình nên xác nhận khi đặt ghế riêng cho em bé."),
      item("reduced-mobility", "Hành khách hạn chế khả năng di chuyển", "Hướng dẫn chung để yêu cầu xe lăn và hỗ trợ tại sân bay."),
      item("pregnant-passengers", "Phụ nữ mang thai", "Các lưu ý sức khỏe và giấy tờ nên chuẩn bị trước chuyến bay."),
      item("extra-seat", "Mua thêm ghế", "Tham khảo lựa chọn thêm ghế cho sự thoải mái hoặc vật dụng đặc biệt."),
      item("medical-clearance", "Hành khách cần xác nhận sức khỏe", "Chuẩn bị thông tin y tế khi hành trình cần được đánh giá trước."),
      item("special-service-fees", "Phí dịch vụ đặc biệt", "Tổng quan các yếu tố có thể ảnh hưởng đến chi phí dịch vụ hỗ trợ."),
    ],
  },
  {
    slug: "travel-advice", title: "Chuẩn bị cho chuyến bay", icon: "checklist",
    description: "Checklist thiết thực cho từng loại hành trình trước ngày cất cánh.",
    items: [
      item("vietnam-domestic-flights", "Chuyến bay nội địa Việt Nam", "Giấy tờ, thời gian và hành lý cho hành trình trong nước."),
      item("flights-to-vietnam", "Chuyến bay đến Việt Nam", "Chuẩn bị nhập cảnh, kết nối và di chuyển khi đến Việt Nam."),
      item("international-flights-from-vietnam", "Chuyến bay từ Việt Nam đi quốc tế", "Checklist hộ chiếu, thị thực và thời gian có mặt tại sân bay."),
      item("smooth-journey-guide", "Cẩm nang cho một hành trình thuận lợi", "Những thói quen nhỏ giúp chuyến đi bớt căng thẳng và nhiều trải nghiệm hơn."),
    ],
  },
];

export const travelGroupPath = (group) => `/travel-information/${group.slug}`;
export const travelItemPath = (group, entry) => `${travelGroupPath(group)}/${entry.slug}`;
export const findTravelGroup = (slug) => TRAVEL_GROUPS.find((group) => group.slug === slug);
export const findTravelItem = (groupSlug, itemSlug) => {
  const group = findTravelGroup(groupSlug);
  const entry = group?.items.find((candidate) => candidate.slug === itemSlug);
  return group && entry ? { group, entry } : null;
};
