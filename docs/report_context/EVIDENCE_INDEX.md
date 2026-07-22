# CHỈ MỤC BẰNG CHỨNG (EVIDENCE INDEX)

Tài liệu này tổng hợp lại các nguồn (source code) được trích dẫn trong bộ tài liệu Context, giúp tác giả dễ dàng tra cứu lại logic hoặc copy vào Phụ lục báo cáo.

| Thành phần kỹ thuật | File/Thư mục (Evidence) | Chức năng minh chứng |
|---|---|---|
| **Dependencies Frontend** | `flight-booking-frontend/package.json` | Chứng minh dùng React 19, Vite 8, React Router 7, Axios. |
| **Dependencies Backend** | `FlightBookingSystem.Web.csproj` | Chứng minh dùng .NET 8, EF Core, SQLite, JWT, BCrypt. |
| **Middleware & DI** | `Program.cs` | Bằng chứng thiết lập CORS, JWT Authentication, Swagger, tiêm Services (Dependency Injection). |
| **Database Schema** | `Data/ApplicationDbContext.cs` | Bằng chứng về ORM, tạo 17 bảng, thiết lập khóa ngoại, Unique Index (ví dụ Index chống Overbooking `IX_ChuyenBay_TimKiem`). |
| **Optimistic Concurrency** | `Models/Entities.cs:175` | Class `GheChuyenBay` có cột `[Timestamp] public byte[] PhienBan { get; set; }` (Version token). |
| **Seat Holding Logic** | `Controllers/BookingController.cs:109` | Hàm `HoldSeat` và logic kiểm tra `sessionId` để cấp quyền giữ ghế. Cập nhật `GiuDenLuc`. |
| **Seat Release Logic** | `Controllers/BookingController.cs:34` | Hàm `ReleaseExpiredSeats` được gọi theo cơ chế Lazy Loading trước khi get danh sách ghế thay vì dùng background cron job. |
| **Idempotency Payment** | `Services/PaymentFinalizationService.cs` | Bằng chứng lưu `IdempotencyKey` vào bảng `ThanhToan` để ngăn frontend F5 lặp lệnh thanh toán. |
| **Database Transaction** | `Services/CheckoutCreationService.cs` | Bằng chứng dùng `await _db.Database.BeginTransactionAsync()` để bao bọc quá trình tạo PhieuDatCho + HanhKhach + ChiTietDichVu. Nếu 1 bảng lỗi, sẽ Rollback toàn bộ. |
| **Role-based Auth** | `Controllers/ChuyenBayController.cs` | Bằng chứng gắn attribute `[Authorize(Roles = "Admin")]` để cấm user thường truy cập. |
| **Frontend Routing** | `flight-booking-frontend/src/routes/AppRoutes.jsx` | Khai báo `ProtectedRoute` để bảo vệ các tuyến thanh toán và admin dashboard. |
| **Frontend Axios Interceptor**| `flight-booking-frontend/src/services/api.js` | Cơ chế đính kèm chuỗi `Bearer <token>` vào header của mọi request gọi lên API. |

*(Sinh viên có thể mở các file này trong trình biên tập Visual Studio hoặc VSCode để chụp ảnh code mẫu đưa vào Báo cáo).*
