# KẾ HOẠCH CHỤP MÀN HÌNH (SCREENSHOT PLAN)

Để báo cáo trực quan và thuyết phục, sinh viên cần thực hiện chụp các màn hình giao diện (UI) theo danh sách dưới đây và chèn vào các mục tương ứng trong Chương 3 hoặc Phụ lục.

| STT | Màn hình | Route | Trạng thái dữ liệu cần chuẩn bị | Nội dung cần thấy | Caption đề xuất (Chèn vào Word) | Chương |
|---|---|---|---|---|---|---|
| 1 | Trang chủ | `/` | Mặc định | Banner, Thanh điều hướng, Form tìm kiếm chuyến bay | Giao diện Trang chủ và công cụ tra cứu chuyến bay | 3 |
| 2 | Đăng ký | `/register` | Nhập data có email trùng | Báo lỗi email đã tồn tại | Kiểm chứng ràng buộc tài khoản khi đăng ký | 4 |
| 3 | Đăng nhập | `/login` | Trống | Form điền Email/Mật khẩu | Giao diện Đăng nhập hệ thống | 3 |
| 4 | Chọn chuyến bay | `/flight-selection` | Có chuyến bay | Danh sách chuyến bay, Bộ lọc, Nút "Chọn" | Danh sách chuyến bay và bộ lọc theo hãng | 3 |
| 5 | Sơ đồ ghế (1) | `/booking/:id` | Trống | Máy bay hiện các hạng ghế (Eco/Biz) | Sơ đồ ghế trực quan của máy bay | 3 |
| 6 | Sơ đồ ghế (2) | `/booking/:id` | Chọn 2 ghế, 1 ghế đã bị giữ | Ghế màu vàng (đang giữ), màu xám (đã bán) | Trạng thái ghế hiển thị theo thời gian thực | 4 |
| 7 | Nhập hành khách | `/booking/.../tickets` | Điền thông tin | Form nhập tên, giấy tờ tùy thân, Hành lý | Form điền thông tin chi tiết hành khách | 3 |
| 8 | Thanh toán (Tổng) | `/payment/:id` | Trống | Bảng tổng tiền vé + thuế phí + hành lý | Giao diện xác nhận thanh toán (Checkout Summary) | 3 |
| 9 | Đang xử lý | `/payment/.../processing` | Loading | Biểu tượng Loading đang xoay | Màn hình chờ hệ thống xử lý giao dịch | 4 |
| 10 | Thanh toán OK | `/payment/.../result` | Success | Chữ xanh báo thành công, hiện mã PNR | Giao dịch thanh toán thành công và mã đặt chỗ | 4 |
| 11 | Admin Dashboard | `/admin/dashboard` | Dashboard | Các thẻ thống kê doanh thu, số vé, biểu đồ | Bảng điều khiển (Dashboard) của Quản trị viên | 3 |
| 12 | DS Chuyến bay | `/admin/chuyen-bay` | Có data | Bảng danh sách chuyến bay (Table) | Giao diện quản lý danh sách chuyến bay | 3 |
| 13 | Tạo Chuyến bay | `/admin/chuyen-bay/them`| Đang nhập liệu | Form chọn Lộ trình, Máy bay, Giờ bay | Form tạo mới lịch cất cánh hạ cánh | 3 |
| 14 | Quản lý Sơ đồ | `/admin/danh-muc/so-do-ghe`| Có data | Cấu hình hàng/cột ghế vật lý | Giao diện thiết lập cấu hình ghế vật lý | 3 |

**Lưu ý:**
- Tuyệt đối không đưa các màn hình liên quan đến bài viết, blog, cẩm nang du lịch vào báo cáo vì chúng nằm ngoài phạm vi đề tài nghiệp vụ lõi.
- Ảnh nên được chụp rõ nét, có thể khoanh đỏ các khu vực cần nhấn mạnh (như Validation Message hoặc Ghế bị khóa).
