# DANH MỤC API (API CATALOG)

Tài liệu này tổng hợp toàn bộ các RESTful API của hệ thống thuộc phạm vi lõi (Đặt vé & Quản trị), loại trừ toàn bộ các module về Cẩm nang du lịch, Tin tức.

## I. TỔNG HỢP DANH MỤC API (API ENDPOINTS)

| Nhóm | Method | Endpoint | Authorization | Mục đích | Bảng liên quan (Chính) | Nguồn (Evidence) |
|---|---|---|---|---|---|---|
| **Account** | POST | `/api/account/register` | Public | Đăng ký tài khoản Khách hàng. | TaiKhoan | `AccountController.cs` |
| **Account** | POST | `/api/account/login` | Public | Đăng nhập và lấy JWT. | TaiKhoan | `AccountController.cs` |
| **Account** | GET | `/api/account/me` | Bearer Token | Lấy thông tin User hiện tại. | TaiKhoan | `AccountController.cs` |
| **Public** | GET | `/api/public/airports` | Public | Lấy danh sách sân bay cho form tìm kiếm. | SanBay | `PublicController.cs` |
| **Public** | GET | `/api/public/flights/search` | Public | Tìm kiếm chuyến bay theo tiêu chí. | ChuyenBay, LoTrinh, SanBay | `PublicController.cs` |
| **Booking** | GET | `/api/booking/flights/{id}/seats` | Bearer Token | Lấy sơ đồ ghế và trạng thái của chuyến bay. | GheChuyenBay, GheMayBay | `BookingController.cs` |
| **Booking** | POST | `/api/booking/flights/{id}/seats/{seatId}/hold` | Bearer Token | Yêu cầu giữ chỗ (Hold Seat). | GheChuyenBay | `BookingController.cs` |
| **Booking** | POST | `/api/booking/flights/{id}/seats/{seatId}/release` | Bearer Token | Yêu cầu nhả ghế (Release). | GheChuyenBay | `BookingController.cs` |
| **Checkout** | GET | `/api/booking/checkout/summary/{bookingId}` | Bearer Token | Lấy tổng quan Phiếu đặt chỗ để hiển thị cho Khách xác nhận. | PhieuDatCho, HanhKhach, GheChuyenBay | `BookingCheckoutController.cs` |
| **Checkout** | POST | `/api/booking/checkout/create` | Bearer Token | Xử lý chốt danh sách ghế, hành khách và tạo Phiếu. | PhieuDatCho, HanhKhach, ChangDatCho | `BookingCheckoutController.cs` |
| **Payment** | POST | `/api/payments/bookings/{bookingId}/process` | Bearer Token | Gửi yêu cầu thanh toán (có cơ chế Idempotency). | ThanhToan, PhieuDatCho, Ve | `PaymentsController.cs` |
| **Admin** | GET | `/api/dashboard/stats` | Admin | Lấy số liệu tổng quan hệ thống. | (All) | `DashboardController.cs` |
| **Admin** | CRUD | `/api/sanbay` | Admin | Quản lý Sân bay (Get All, Get 1, Post, Put, Delete). | SanBay | `SanBayController.cs` |
| **Admin** | CRUD | `/api/hangbay` | Admin | Quản lý Hãng hàng không. | HangBay | `HangBayController.cs` |
| **Admin** | CRUD | `/api/maybay` | Admin | Quản lý Máy bay. | MayBay | `MayBayController.cs` |
| **Admin** | CRUD | `/api/hangghe` | Admin | Quản lý Hạng ghế. | HangGhe | `HangGheController.cs` |
| **Admin** | CRUD | `/api/ghemaybay` | Admin | Quản lý sơ đồ cấu hình ghế vật lý trên tàu bay. | GheMayBay | `GheMayBayController.cs` |
| **Admin** | CRUD | `/api/lotrinh` | Admin | Quản lý Tuyến bay. | LoTrinh | `LoTrinhController.cs` |
| **Admin** | CRUD | `/api/chuyenbay` | Admin | Quản lý Chuyến bay. | ChuyenBay, GheChuyenBay | `ChuyenBayController.cs` |

---

## II. CHI TIẾT MỘT SỐ API QUAN TRỌNG

### 1. API: Tìm kiếm chuyến bay
- **Endpoint**: `GET /api/public/flights/search`
- **Method**: `GET`
- **Authorization**: Public
- **Mục đích**: Tìm kiếm danh sách các chuyến bay hợp lệ theo điểm đi, điểm đến và ngày khởi hành.
- **Query Params**:
  - `departureAirport` (string)
  - `arrivalAirport` (string)
  - `departureDate` (string: YYYY-MM-DD)
  - `adults` (int), `children` (int)
- **Response Mẫu (200 OK)**:
```json
{
  "totalFlights": 1,
  "flights": [
    {
      "flightId": 12,
      "flightNumber": "VN202",
      "departureTime": "2026-10-10T15:00:00Z",
      "arrivalTime": "2026-10-10T17:10:00Z",
      "basePrice": 1500000,
      "airlineName": "Vietnam Airlines",
      "aircraft": "Airbus A321"
    }
  ]
}
```

### 2. API: Hold Seat (Giữ ghế)
- **Endpoint**: `POST /api/booking/flights/{id}/seats/{seatId}/hold`
- **Method**: `POST`
- **Authorization**: Bearer Token (Customer)
- **Mục đích**: Chuyển trạng thái ghế thành Held, khóa cho tài khoản hiện tại. Tránh Overbooking bằng Optimistic Concurrency (`PhienBan`).
- **Request Body Mẫu**:
```json
{
  "sessionId": "abc-123-uuid",
  "maHangGhe": 1,
  "maxSeats": 9
}
```
- **Xử lý nghiệp vụ & Validation**:
  - Phải chứa `sessionId` hợp lệ.
  - Kiểm tra số ghế đã giữ không vượt quá `maxSeats`.
  - Kiểm tra trạng thái Database: Phải là `Available` mới được chuyển sang `Held`.
  - Tăng `PhienBan++`. Cập nhật `GiuDenLuc = Now + 30m`.
- **Response**:
  - `200 OK`: `{"message": "Ghế đã được giữ thành công."}`
  - `409 Conflict`: `{"message": "Ghế vừa được hành khách khác chọn. Vui lòng chọn ghế khác."}` (Xảy ra do EF Core bắt lỗi db concurrency).

### 3. API: Xử lý Thanh Toán (Payment Process)
- **Endpoint**: `POST /api/payments/bookings/{bookingId}/process`
- **Method**: `POST`
- **Authorization**: Bearer Token (Customer)
- **Mục đích**: Chốt thanh toán, phát hành vé, chốt cứng ghế.
- **Request Body Mẫu**:
```json
{
  "idempotencyKey": "99b0c95a-b620-4a8e-...",
  "paymentMethod": "CreditCard",
  "amount": 2000000
}
```
- **Xử lý nghiệp vụ**: 
  - `PaymentFinalizationService` tìm kiếm `IdempotencyKey`.
  - Nếu đã xử lý rồi -> Báo thành công (bỏ qua bước giao dịch).
  - Nếu chưa -> Trừ tiền mô phỏng.
  - Sinh vé (`Ve`).
  - Gán trạng thái Booking là `Confirmed`.
  - Update trạng thái Seat là `Booked`.
