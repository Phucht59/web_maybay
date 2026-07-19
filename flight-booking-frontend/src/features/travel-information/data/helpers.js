export const fact = (icon, label, value) => ({ icon, label, value });
export const step = (title, description, icon = "arrow_forward") => ({ title, description, icon });
export const section = (id, title, body, bullets = []) => ({ id, title, body, bullets });

const DEFAULT_FAQS = [
  {
    question: "Tôi nên xác nhận thông tin ở đâu trước chuyến đi?",
    answer: "Hãy ưu tiên thông tin trên vé, thông báo của đơn vị khai thác và hướng dẫn của cơ quan chức năng tại thời điểm khởi hành.",
  },
  {
    question: "Khi nào tôi nên liên hệ bộ phận hỗ trợ?",
    answer: "Liên hệ sớm nếu hành trình có nhu cầu đặc biệt, nhiều chặng hoặc thông tin trên đặt chỗ chưa trùng khớp với giấy tờ.",
  },
];

export function article(config) {
  const {
    slug,
    title,
    summary,
    template = "guide",
    sections,
    ...rest
  } = config;

  return {
    slug,
    title,
    summary,
    template,
    readTime: rest.readTime || "5 phút đọc",
    quickFacts: rest.quickFacts || [
      fact("verified_user", "Mục đích", `Chuẩn bị cho ${title.toLocaleLowerCase("vi")}`),
      fact("update", "Cập nhật", "Kiểm tra lại trước ngày đi"),
    ],
    sections: sections || [
      section(
        "prepare",
        `Chuẩn bị cho ${title}`,
        summary,
        ["Đối chiếu thông tin đặt chỗ", "Lưu giấy tờ ở nơi dễ lấy", "Dành thời gian xử lý thay đổi phát sinh"],
      ),
      section(
        "at-airport",
        "Khi bắt đầu hành trình",
        `Giữ các xác nhận liên quan đến ${title.toLocaleLowerCase("vi")} trong suốt chuyến đi và làm theo hướng dẫn tại điểm phục vụ.`,
      ),
    ],
    faqs: rest.faqs || DEFAULT_FAQS,
    primaryAction: rest.primaryAction || { label: "Tìm chuyến bay", to: "/flight-selection" },
    secondaryAction: rest.secondaryAction,
    relatedSlugs: rest.relatedSlugs || [],
    ...rest,
  };
}

export const travelChecklist = (focus) => [
  { title: "7 ngày trước", items: [`Rà soát giấy tờ và điều kiện liên quan đến ${focus}`, "Kiểm tra thông tin liên hệ trên đặt chỗ"] },
  { title: "24 giờ trước", items: ["Theo dõi thông báo chuyến bay", "Sắp xếp hành lý và tài liệu cần dùng"] },
  { title: "3 giờ trước", items: ["Kiểm tra tuyến đường đến sân bay", "Đảm bảo thiết bị và giấy tờ sẵn sàng"] },
  { title: "Tại sân bay", items: ["Theo dõi bảng thông tin", "Làm theo hướng dẫn của nhân viên và cơ quan chức năng"] },
];
