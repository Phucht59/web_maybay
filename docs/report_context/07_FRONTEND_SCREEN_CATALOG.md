# DANH MỤC MÀN HÌNH FRONTEND (SCREEN CATALOG)

Tài liệu này liệt kê các màn hình (Screens/Pages) thuộc phân hệ Khách hàng và Admin, chỉ tập trung vào nghiệp vụ Đặt vé và Quản trị, loại trừ toàn bộ trang liên quan đến Cẩm nang/Blog.

## I. MÀN HÌNH KHÁCH HÀNG (CUSTOMER PAGES)

| Mã màn hình | Route | Tên màn hình | Component chính | Chức năng chính | API sử dụng |
|---|---|---|---|---|---|
| **SCR-PUB-01** | `/` | Trang chủ (Home) | `HomePage.jsx` | Hiển thị Banner, Form tìm kiếm chuyến bay nhanh. | `/api/public/airports` |
| **SCR-PUB-02** | `/login` | Đăng nhập | `LoginPage.jsx` | Form điền Email, Password. Chuyển hướng về trang trước đó sau khi đăng nhập thành công. | `/api/account/login` |
| **SCR-PUB-03** | `/register` | Đăng ký | `RegisterPage.jsx` | Form tạo tài khoản. Yêu cầu nhập đầy đủ Họ tên, SĐT, Email, Password. | `/api/account/register` |
| **SCR-FLI-01** | `/flight-selection`| Chọn chuyến bay | `FlightSelectionPage.jsx` | Hiển thị danh sách kết quả tìm kiếm. Cho phép lọc, sắp xếp. User bấm chọn để bắt đầu quy trình Booking. | `/api/public/flights/search` |
| **SCR-BOK-01** | `/booking/:id` | Chọn ghế (Seat Map) | `BookingSeatPage.jsx` | Yêu cầu đăng nhập (`ProtectedRoute`). Trình bày sơ đồ ghế, gọi API Hold Seat khi user click vào ghế trống. Quản lý timeout Session. | `/api/booking/flights/.../seats`<br>`.../hold` |
| **SCR-BOK-02** | `/booking/:id/tickets`| Thông tin hành khách | `BookingTicketPage.jsx` | Form động điền thông tin (Họ tên, CCCD, Ngày sinh) cho từng ghế đã chọn. Tích hợp chọn Dịch vụ thêm (Hành lý). Nút "Tiếp tục" sẽ tạo Checkout. | `/api/booking/checkout/create` |
| **SCR-PAY-01** | `/payment/:bookingId`| Thanh toán | `PaymentPage.jsx` | Hiển thị Checkout Summary (Tổng tiền, Dịch vụ). Chọn phương thức thanh toán. Gửi kèm IdempotencyKey. | `/api/booking/checkout/summary` |
| **SCR-PAY-02** | `/payment/.../processing`| Đang xử lý | `PaymentProcessingPage.jsx`| Màn hình trung gian (Loading State) chờ hệ thống Backend và Cổng thanh toán (mô phỏng) xử lý. | `/api/payments/.../process` |
| **SCR-PAY-03** | `/payment/.../result`| Kết quả thanh toán | `PaymentResultPage.jsx` | Hiển thị thông báo Thành công / Thất bại. Nếu thành công, hiển thị PNR Code (Mã đặt chỗ). | N/A |

## II. MÀN HÌNH QUẢN TRỊ (ADMIN PAGES)

Toàn bộ các trang dưới đây được bọc trong `ProtectedRoute` và yêu cầu User có Role = `Admin`. Tất cả sử dụng layout `AdminLayout`.

| Mã màn hình | Route | Tên màn hình | Chức năng chính |
|---|---|---|---|
| **SCR-ADM-01** | `/admin/dashboard` | Dashboard | Thống kê số liệu, xem tổng doanh thu, chuyến bay sắp khởi hành. |
| **SCR-ADM-02** | `/admin/chuyen-bay` | Quản lý Chuyến bay | Danh sách chuyến bay, tạo mới, sửa giờ cất cánh/hạ cánh, gán máy bay. |
| **SCR-ADM-03** | `/admin/danh-muc/san-bay` | Quản lý Sân bay | `AirportListPage`, `AirportFormPage` thêm sửa Sân bay. |
| **SCR-ADM-04** | `/admin/danh-muc/hang-bay` | Quản lý Hãng bay | `AirlineListPage`, `AirlineFormPage`. |
| **SCR-ADM-05** | `/admin/danh-muc/loai-may-bay`| Quản lý Máy bay | `AircraftListPage`, `AircraftFormPage` (Thêm số hiệu đăng ký). |
| **SCR-ADM-06** | `/admin/danh-muc/hang-ghe` | Quản lý Hạng ghế | `SeatClassListPage`, thiết lập Hệ số giá vé (VD: Business = 2.0). |
| **SCR-ADM-07** | `/admin/danh-muc/tuyen-bay` | Quản lý Tuyến bay | `RouteListPage`, thiết lập điểm đi, điểm đến và giá cơ bản (Base price). |
| **SCR-ADM-08** | `/admin/danh-muc/so-do-ghe` | Quản lý Sơ đồ ghế | Khởi tạo cấu hình ghế vật lý trên máy bay (VD: 30 hàng, 6 cột). |

---

## III. MÔ TẢ TRẠNG THÁI GIAO DIỆN ĐẶC BIỆT (UI STATES)

1. **Trạng thái Ghế trên Sơ đồ (Seat States in `BookingSeatPage`)**:
   - **Màu Trắng (Available)**: Ghế trống, có thể click.
   - **Màu Vàng (Holding by me)**: Ghế đang được khóa tạm bởi chính người dùng này (`LaGheCuaToi = true`). User có thể bỏ chọn (Click again to Release).
   - **Màu Xám (Booked/Held by other)**: Ghế đã có người thanh toán hoặc người khác đang chọn. Disabled không thể click.
   
2. **Trạng thái Xử lý (Loading/Error States)**:
   - Các API Submit (VD: Đăng nhập, Thanh toán, Lưu cấu hình) đều được disable nút bấm và hiển thị spinner để tránh người dùng click 2 lần liên tục.
   - Khi có lỗi (400, 401, 409), Toast notification sẽ hiện lên góc màn hình, thông báo lỗi cụ thể trả về từ API (ví dụ: "Ghế vừa bị người khác chọn").
