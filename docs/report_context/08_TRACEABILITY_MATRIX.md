# MA TRẬN TRUY VẾT (TRACEABILITY MATRIX)

Ma trận này kết nối các thành phần từ Yêu cầu chức năng (Requirement) đến giao diện, API, logic xử lý và cơ sở dữ liệu. Nó giúp chứng minh tính toàn vẹn của thiết kế hệ thống và giúp người đánh giá dễ dàng tìm thấy mã nguồn minh chứng cho mỗi chức năng.

| Requirement | Use Case | Frontend Route | Frontend Component | API Endpoint | Controller | Service | Entity / Bảng | Diagram (nếu có) |
|---|---|---|---|---|---|---|---|---|
| **FR-AUTH-01** | Đăng ký | `/register` | `RegisterPage.jsx` | `POST /api/account/register` | `AccountController` | N/A | `TaiKhoan` | Sequence Đăng ký |
| **FR-AUTH-02** | Đăng nhập | `/login` | `LoginPage.jsx` | `POST /api/account/login` | `AccountController` | N/A | `TaiKhoan` | Sequence Đăng nhập |
| **FR-SEARCH-01** | Tìm chuyến bay | `/flight-selection` | `FlightSelectionPage.jsx`| `GET /api/public/flights/search`| `PublicController` | N/A | `ChuyenBay`, `LoTrinh`, `SanBay` | Activity End-to-End |
| **FR-SEAT-01** | Xem sơ đồ ghế | `/booking/:id` | `BookingSeatPage.jsx` | `GET /api/booking/flights/{id}/seats`| `BookingController` | N/A | `GheChuyenBay`, `GheMayBay` | |
| **FR-SEAT-02** | Giữ ghế (Hold Seat) | `/booking/:id` | `BookingSeatPage.jsx` | `POST /api/booking/flights/{id}/seats/{seatId}/hold`| `BookingController` | N/A | `GheChuyenBay` | Sequence Hold Seat |
| **FR-BOOKING-01** | Tạo Booking (Checkout)| `/booking/:id/tickets`| `BookingTicketPage.jsx` | `POST /api/booking/checkout/create`| `BookingCheckoutController`| `CheckoutCreationService` | `PhieuDatCho`, `HanhKhach`, `ChangDatCho` | Sequence Checkout |
| **FR-PAYMENT-01** | Xử lý thanh toán | `/payment/:bookingId` | `PaymentPage.jsx` | `POST /api/payments/.../process`| `PaymentsController` | `PaymentFinalizationService`| `ThanhToan`, `PhieuDatCho`, `Ve` | Sequence Payment |
| **FR-ADMIN-01** | Xem Dashboard | `/admin/dashboard` | `DashboardPage.jsx` | `GET /api/dashboard/stats` | `DashboardController` | N/A | (Tổng hợp nhiều bảng) | |
| **FR-ADMIN-02** | Quản lý Sân bay | `/admin/danh-muc/san-bay`| `AirportListPage.jsx` | `GET/POST /api/sanbay` | `SanBayController` | N/A | `SanBay` | |
| **FR-ADMIN-07** | Lập lịch Chuyến bay | `/admin/chuyen-bay` | `FlightFormPage.jsx` | `POST /api/chuyenbay` | `ChuyenBayController` | N/A | `ChuyenBay`, `GheChuyenBay` | Activity Admin |

## Hướng dẫn đọc Ma trận:
- Khi Báo cáo yêu cầu chứng minh tính năng **Tạo Booking (FR-BOOKING-01)**, sinh viên có thể đưa ra file Frontend `BookingTicketPage.jsx`, chỉ ra nó đang gọi lên API `POST /api/booking/checkout/create`.
- Tại Backend, logic không được đặt ở Controller mà được truyền sang tầng Service là `CheckoutCreationService.cs`. Tại đây, transaction cơ sở dữ liệu sẽ can thiệp vào các bảng `PhieuDatCho` và `HanhKhach`.
