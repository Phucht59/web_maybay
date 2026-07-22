# KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Dự án áp dụng kiến trúc **Client-Server** kết hợp với **Single Page Application (SPA)** thông qua chuẩn giao tiếp **RESTful API**. Đây là kiến trúc tiêu chuẩn cho các hệ thống Web hiện đại, đảm bảo sự linh hoạt, dễ mở rộng và tách biệt hoàn toàn Logic nghiệp vụ (Backend) khỏi Logic trình diễn (Frontend).

## 1. Sơ đồ Kiến trúc Tổng thể (High-level Architecture)

1. **Client (Trình duyệt Web)**: Tải toàn bộ bundle React (HTML/CSS/JS) một lần duy nhất.
2. **Frontend (React SPA)**: Xử lý Routing (chuyển trang không reload), quản lý State (trạng thái ứng dụng) và gọi API bằng Axios.
3. **Backend (ASP.NET Core Web API)**: Tiếp nhận Request, xử lý Authentication/Authorization, thực thi nghiệp vụ (Services) và truy xuất dữ liệu.
4. **Database (SQLite)**: Lưu trữ dữ liệu vật lý.

## 2. Kiến trúc Frontend (React + Vite)
- **Vite**: Đóng vai trò là Build tool (bundler) thay thế cho Webpack hoặc Create React App, giúp khởi động dev server cực nhanh.
- **Routing (React Router DOM)**: 
  - Quản lý các tuyến đường công khai (Public Routes: Trang chủ, Login, Đăng ký, Tìm chuyến).
  - Cấu hình `ProtectedRoute` (Routes bảo vệ): Ngăn chặn truy cập trái phép vào các trang như Đặt ghế, Thanh toán hoặc Admin Dashboard nếu chưa có Token hoặc sai Role.
- **Axios & Interceptor**: Được cấu hình tại `flight-booking-frontend/src/services/...`. Interceptor tự động bắt các Request trước khi gửi đi để đính kèm header `Authorization: Bearer <token>`.
- **Thư mục tổ chức (Folder Structure)**:
  - `/pages`: Chứa các màn hình chính (booking, flight-selection, admin...).
  - `/components`: Chứa các UI elements dùng chung.
  - `/layouts`: Bố cục bao ngoài của trang (MainLayout cho khách, AdminLayout cho admin).

## 3. Kiến trúc Backend (ASP.NET Core 9/8)
Backend được xây dựng với kiến trúc hướng dịch vụ (Service-Oriented Architecture) tối giản trong phạm vi Monolithic. Sự tách biệt các layer rất rõ ràng:

1. **Controller Layer (`/Controllers`)**: 
   - Đóng vai trò tiếp nhận HTTP Request, validate Data Transfer Objects (DTOs), phân quyền Role (via `[Authorize]`) và trả về HTTP Response (200 OK, 400 Bad Request, v.v.).
   - Tránh việc viết logic phức tạp trực tiếp trong Controller.
2. **Service Layer (`/Services`)**: 
   - Xử lý các logic nghiệp vụ phức tạp. Ví dụ: `CheckoutCreationService` chịu trách nhiệm tạo booking, `PaymentFinalizationService` xử lý thanh toán và cấp vé.
   - Các Service này được tiêm vào (Inject) qua **Dependency Injection (DI)** (thiết lập trong `Program.cs`: `builder.Services.AddScoped<...>`). Việc này giúp dễ dàng test và thay đổi implementation.
3. **Data Access Layer / ORM (Entity Framework Core)**:
   - Cung cấp các thao tác CRUD lên Database thông qua `ApplicationDbContext`. 
   - Cấu hình quan hệ, khóa chính, khóa ngoại bằng Fluent API trong phương thức `OnModelCreating`.
   - Quản lý **Database Transaction** (`_db.Database.BeginTransactionAsync()`) đảm bảo tính ACID khi ghi dữ liệu vào nhiều bảng.

## 4. Các Công nghệ & Cơ chế Kỹ thuật khác
- **JWT (JSON Web Token)**: Kỹ thuật Authentication không trạng thái (Stateless). Token được Backend mã hóa bằng chuỗi bí mật (Secret Key) và cấp cho Frontend. Mọi API gọi lên sau đó đều kèm token để xác thực mà Backend không cần tra cứu database.
- **CORS (Cross-Origin Resource Sharing)**: Được cấu hình tại `Program.cs` (`builder.Services.AddCors(...)`) để cho phép Frontend (chạy trên port 5173) gọi API tới Backend (port 5071) mà không bị trình duyệt chặn lỗi bảo mật.
- **Swagger / OpenAPI**: Tích hợp sẵn trong ASP.NET Core để tự động tạo tài liệu API UI, giúp Frontend Developer dễ dàng test và tích hợp API.
- **Môi trường Database**: Sử dụng SQLite làm cơ sở dữ liệu chính. Toàn bộ cấu trúc Database được seed dữ liệu mẫu qua `ReferenceDataSeeder.cs`, giúp hệ thống chạy ngay từ lần build đầu tiên.
