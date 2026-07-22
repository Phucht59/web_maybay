# YÊU CẦU CHỨC NĂNG VÀ PHI CHỨC NĂNG (REQUIREMENTS SPECIFICATION)

## A. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### 1. Phân hệ Khách hàng (Customer)

| Mã FR | Tên yêu cầu | Actor | Mô tả | Input | Output | API liên quan | Nguồn (Evidence) |
|---|---|---|---|---|---|---|---|
| **FR-AUTH-01** | Đăng ký tài khoản | Customer | Cho phép người dùng tạo tài khoản mới. | Email, Họ Tên, Mật khẩu, SĐT. | Thông báo thành công, trả về Account data. | `POST /api/account/register` | `AccountController.cs` |
| **FR-AUTH-02** | Đăng nhập | Customer | Đăng nhập vào hệ thống bằng Email và Password. | Email, Mật khẩu. | JWT Token. | `POST /api/account/login` | `AccountController.cs` |
| **FR-SEARCH-01** | Tìm kiếm chuyến bay | Customer | Tra cứu chuyến bay theo điểm đi/đến và ngày. | MaSanBayDi, MaSanBayDen, Ngày đi. | Danh sách `ChuyenBay` hợp lệ. | `GET /api/public/flights/search` | `PublicController.cs:64` |
| **FR-SEAT-01** | Xem sơ đồ ghế | Customer | Hiển thị sơ đồ ghế và trạng thái (trống, đang giữ, đã bán) của một chuyến bay cụ thể. | FlightId. | Danh sách `GheChuyenBay`. | `GET /api/booking/flights/{id}/seats` | `BookingController.cs:31` |
| **FR-SEAT-02** | Giữ ghế (Hold Seat) | Customer | Khóa tạm thời ghế trong một khoảng thời gian bằng SessionId, chống Overbooking (Lỗi khi ghế đã bị giữ bởi phiên khác). | FlightId, SeatId, SessionId. | Cập nhật `Held`, `GiuDenLuc`. | `POST /api/booking/flights/.../hold` | `BookingController.cs:109` |
| **FR-SEAT-03** | Giải phóng ghế (Release) | Customer | Tự động hoặc thủ công bỏ ghế đang giữ. | FlightId, SeatId, SessionId. | Cập nhật `Available`. | `POST /api/booking/flights/.../release`| `BookingController.cs:157` |
| **FR-BOOKING-01** | Tạo Phiếu Đặt Chỗ (Checkout) | Customer | Sau khi chọn ghế và nhập thông tin (Hành lý, Tên khách), hệ thống gom lại tạo Checkout (PhieuDatCho). | Danh sách ghế, thông tin HK, Dịch vụ. | Trả về `BookingId` (MaPhieuDatCho). | `POST /api/booking/checkout/create` | `BookingCheckoutController.cs:33` |
| **FR-PAYMENT-01** | Thanh toán vé (Payment) | Customer | Gửi yêu cầu thanh toán với mã Idempotency Key chống trùng lặp. Cập nhật trạng thái thành công. | BookingId, IdempotencyKey, SoTien. | Chuyển `TrangThai` thành Completed, ghế thành Booked. | `POST /api/payments/.../process` | `PaymentsController.cs:102` |

### 2. Phân hệ Quản trị viên (Admin)

| Mã FR | Tên yêu cầu | Actor | Mô tả | Input | Output | API liên quan | Nguồn (Evidence) |
|---|---|---|---|---|---|---|---|
| **FR-ADMIN-01** | Quản lý Dashboard | Admin | Xem thống kê số lượng chuyến bay, doanh thu, vé bán ra. | (None) | Các chỉ số thống kê. | `GET /api/dashboard/stats` | `DashboardController.cs` |
| **FR-ADMIN-02** | Quản lý Sân bay | Admin | Thêm, sửa, xóa thông tin Sân bay. | Mã sân bay, Tên, Thành phố. | Dữ liệu sân bay được cập nhật. | `GET/POST/PUT /api/sanbay` | `SanBayController.cs` |
| **FR-ADMIN-03** | Quản lý Tuyến bay | Admin | Thiết lập lộ trình bay kết nối 2 sân bay. | MaSanBayDi, MaSanBayDen, GiaCoBan. | Lộ trình mới. | `GET/POST/PUT /api/lotrinh` | `LoTrinhController.cs` |
| **FR-ADMIN-04** | Quản lý Hãng bay | Admin | Quản lý dữ liệu hãng hàng không. | Tên hãng, MaCode, Logo. | Dữ liệu Hãng bay. | `GET/POST /api/hangbay` | `HangBayController.cs` |
| **FR-ADMIN-05** | Quản lý Máy bay | Admin | Quản lý thông tin tàu bay. | Số hiệu, Dòng máy bay, Hãng. | Dữ liệu Máy bay. | `GET/POST /api/maybay` | `MayBayController.cs` |
| **FR-ADMIN-06** | Quản lý Hạng ghế | Admin | Thiết lập hạng Economy, Business và Hệ số giá. | Tên, Hệ số giá. | Dữ liệu Hạng ghế. | `GET/POST /api/hangghe` | `HangGheController.cs` |
| **FR-ADMIN-07** | Quản lý Chuyến bay | Admin | Lên lịch chuyến bay, gắn tuyến bay và máy bay. Sinh ra các `GheChuyenBay` vật lý. | LoTrinh, MayBay, Giờ khởi hành. | Chuyến bay được tạo. | `GET/POST /api/chuyenbay` | `ChuyenBayController.cs` |

---

## B. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
*(Lưu ý: Chỉ mô tả các yêu cầu có căn cứ thiết kế thực tế từ Source Code)*

1. **Bảo mật và Phân quyền (Security & Authorization):**
   - Hệ thống yêu cầu xác thực bằng JWT (JSON Web Token) cho các chức năng nhạy cảm (VD: Đặt vé, Thanh toán, Quản trị).
   - Phân quyền (Role-based) nghiêm ngặt: Các route bắt đầu bằng `/api/...` của Admin đều được bảo vệ bởi attribute `[Authorize(Roles = "Admin")]`. Các thao tác của Customer được đối chiếu ID (ví dụ ghế chỉ được nhả bởi người đã giữ nó `seat.GiuBoiTaiKhoanId == accountId`).

2. **Tính nhất quán dữ liệu (Data Consistency):**
   - Ứng dụng mô hình **Optimistic Concurrency Control** thông qua trường `PhienBan` của bảng `GheChuyenBay`. Khi lưu trữ, EF Core sẽ ném ra ngoại lệ `DbUpdateConcurrencyException` nếu dữ liệu đã bị sửa bởi một tiến trình khác, đảm bảo không thể bán 1 ghế cho 2 người cùng lúc.
   - Các thao tác thay đổi nhiều bảng (ví dụ: CheckoutCreationService tạo PhieuDatCho, HanhKhach, ChiTietDichVu) đều được bọc trong **Database Transaction** (`_db.Database.BeginTransactionAsync()`).

3. **Tính toàn vẹn (Idempotency):**
   - Các request thanh toán (Payment) sử dụng `IdempotencyKey` để đảm bảo thao tác gửi 2 lần cùng một yêu cầu thanh toán không tạo ra 2 giao dịch trừ tiền.

4. **Trải nghiệm người dùng (UX):**
   - Áp dụng kiến trúc Single Page Application (React) cho phép chuyển trang không tải lại (No reload), cung cấp các trạng thái Loading State, Error State và Disabled buttons thông suốt.

---

## C. ĐẶC TẢ USE CASE CHÍNH (USE CASE SPECIFICATION)

### UC-CUST-01: Chọn và Giữ Ghế (Hold Seat)
- **Actor chính:** Customer.
- **Mục tiêu:** Chọn một ghế trống trên sơ đồ và giữ chỗ tạm thời (khóa ghế đối với người khác).
- **Tiền điều kiện:** Đã chọn một chuyến bay và đang ở màn hình Sơ đồ ghế.
- **Kích hoạt:** Người dùng click vào một ghế có trạng thái `Available`.
- **Luồng chính:**
  1. Frontend gửi yêu cầu `POST /api/booking/flights/{id}/seats/{seatId}/hold` kèm `SessionId`.
  2. Backend kiểm tra `TrangThaiGhe` trong Database.
  3. Nếu `Available`, Backend cập nhật `TrangThaiGhe = Held`, gán `GiuBoiTaiKhoanId`, `SessionId`, thời gian `GiuDenLuc` và tăng `PhienBan`.
  4. Trả về thành công (200 OK).
  5. Frontend đổi màu ghế thành "Đang chọn".
- **Ngoại lệ (Concurrency Conflict):** Ở bước 2, nếu ghế bị người khác chọn trước đó vài mili-giây (thay đổi `PhienBan` hoặc Trạng thái), Backend ném lỗi Conflict (409) và Frontend thông báo "Ghế vừa được chọn, vui lòng chọn ghế khác".

### UC-CUST-02: Thanh toán (Payment)
- **Actor chính:** Customer.
- **Mục tiêu:** Thanh toán cho Phiếu đặt chỗ (Booking) đã tạo thành công.
- **Tiền điều kiện:** Đã tạo Phiếu đặt chỗ, ghế chưa hết hạn giữ.
- **Kích hoạt:** Người dùng bấm "Thanh toán".
- **Luồng chính:**
  1. Frontend khởi tạo `IdempotencyKey` (UUID) và gửi API `POST /api/payments/.../process`.
  2. Backend (Service `PaymentFinalizationService`) bắt đầu Transaction.
  3. Kiểm tra `IdempotencyKey` đã tồn tại chưa. Nếu chưa, tiến hành trừ tiền/mô phỏng gọi Cổng thanh toán.
  4. Cập nhật `ThanhToan` thành `Completed`.
  5. Phát hành Vé (`Ve`), chuyển trạng thái `GheChuyenBay` sang `Booked`.
  6. Commit Transaction và trả về Frontend kết quả thành công.

### UC-ADM-01: Quản lý Chuyến bay
- **Actor chính:** Admin.
- **Mục tiêu:** Lên lịch chuyến bay mới.
- **Luồng chính:**
  1. Admin mở mục Chuyến bay, bấm "Thêm mới".
  2. Điền Lộ trình, Máy bay, Giờ khởi hành.
  3. Khi lưu, Backend tự động sao chép toàn bộ cấu hình ghế từ bảng `GheMayBay` (vật lý) thành các record trong bảng `GheChuyenBay` (logic) để phục vụ việc giữ ghế sau này. Trạng thái các ghế đều là `Available`.
