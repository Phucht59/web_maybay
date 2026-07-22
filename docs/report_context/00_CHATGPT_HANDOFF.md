# BÀN GIAO NGỮ CẢNH DỰ ÁN CHO CHATGPT (HANDOFF)

Tài liệu này chứa toàn bộ ngữ cảnh kỹ thuật cốt lõi của dự án "Xây dựng website đặt vé máy bay trực tuyến", đóng vai trò là "Nguồn sự thật" (Source of Truth) để AI (ChatGPT) sử dụng làm nền tảng viết một Báo cáo Đồ án tốt nghiệp / Kết thúc học phần khoảng 40 trang.

## 1. Thông tin chung
- **Tên đề tài**: Xây dựng website đặt vé máy bay trực tuyến.
- **Mục tiêu**: Xây dựng hệ thống số hóa quy trình kinh doanh vé máy bay, quản lý ghế ngồi và xử lý thanh toán trực tuyến.
- **Đối tượng sử dụng (Actors)**:
  - Khách hàng (Customer): Tìm chuyến bay, đặt vé, chọn ghế, thanh toán.
  - Quản trị viên (Admin): Quản lý danh mục hàng không (Sân bay, Hãng bay, Máy bay, Hạng ghế), quản lý chuyến bay và sơ đồ ghế.
- **Thông tin hành chính cần bổ sung (Sinh viên điền sau)**:
  - Tên giảng viên hướng dẫn.
  - Danh sách thành viên nhóm, MSSV, Lớp.
  - Thời gian nộp báo cáo.

## 2. Công nghệ và Kiến trúc
- **Kiến trúc tổng thể**: Client - Server, RESTful API. Tách biệt Frontend (SPA) và Backend.
- **Frontend**: React v19, Vite v8, React Router DOM v7, Axios, CSS module.
  - *Evidence: `flight-booking-frontend/package.json`*
- **Backend**: ASP.NET Core Web API, Entity Framework Core.
  - *Evidence: `FlightBookingSystem.Web/Program.cs`*
- **Database**: SQLite (Sử dụng cho môi trường phát triển, có thể dễ dàng chuyển sang SQL Server/PostgreSQL nhờ EF Core).
- **Authentication**: JWT Bearer Authentication.
- **Authorization**: Role-based (Customer, Admin).

## 3. Các Luồng Nghiệp Vụ Cốt Lõi (Core Workflows)
### 3.1. Luồng Đặt Vé End-to-End (Customer)
1. **Tìm kiếm chuyến bay**: Dựa trên `MaSanBayDi`, `MaSanBayDen` và thời gian.
2. **Chọn chuyến bay & Hạng ghế**: Chọn một `ChuyenBay` cụ thể từ danh sách.
3. **Chọn và Giữ Ghế (Hold Seat)**: Gửi request lên Backend để khóa ghế tạm thời bằng kỹ thuật Optimistic Concurrency.
4. **Nhập thông tin hành khách**: Điền tên, giấy tờ tùy thân, chọn dịch vụ bổ sung (Hành lý, suất ăn).
5. **Thanh toán (Payment)**: Xác nhận tổng tiền, gọi API thanh toán với cơ chế Idempotency chống trùng lặp.
6. **Nhận vé**: Hệ thống tự động chuyển trạng thái ghế thành `Booked` và phát hành `Ve` (Issued).

### 3.2. Luồng Quản Trị (Admin)
1. Đăng nhập với quyền Admin.
2. Quản lý danh mục nền tảng: Sân bay, Hãng bay, Cấu hình máy bay và Hạng ghế.
3. Lập lịch chuyến bay: Chọn Lộ trình, Máy bay và thiết lập giờ khởi hành.
4. Quản lý sơ đồ ghế cho từng chuyến bay cụ thể.

## 4. Các Quy Tắc Nghiệp Vụ & Cơ Chế Nổi Bật
- **Cơ chế Giữ Ghế (Seat Holding & Optimistic Concurrency)**: 
  - Khi khách chọn ghế, trạng thái `GheChuyenBay` chuyển sang `Held`.
  - Khóa đồng thời (Concurrency) được quản lý bằng cột `PhienBan` (Version).
  - Có thời hạn giữ ghế `GiuDenLuc` (VD: 30 phút). Nếu hết hạn, ghế sẽ bị release.
  - *Evidence: `FlightBookingSystem.Web/Controllers/BookingController.cs:110-150`*
- **Chống thanh toán trùng lặp (Idempotency)**: 
  - Khi thanh toán, Frontend tạo ra một UUID `IdempotencyKey`. Nếu user bấm F5 gửi lại request, hệ thống nhận diện key này và trả về kết quả cũ thay vì tạo giao dịch mới.
  - *Evidence: `FlightBookingSystem.Web/Services/PaymentFinalizationService.cs`*

## 5. Cơ sở dữ liệu (Database Entities)
- **Tài khoản**: `TaiKhoan`.
- **Danh mục Hàng không**: `SanBay`, `HangBay`, `MayBay`, `HangGhe`, `LoTrinh`.
- **Vận hành**: `ChuyenBay`, `GheMayBay` (vị trí vật lý), `GheChuyenBay` (trạng thái thực tế trên chuyến bay).
- **Giao dịch**: `PhieuDatCho`, `ChangDatCho`, `HanhKhach`, `Ve`, `ThanhToan`, `HoanTien`.
- **Dịch vụ**: `DichVuThem`, `ChiTietDichVu`.
- *Evidence: `FlightBookingSystem.Web/Data/ApplicationDbContext.cs`*

## 6. Danh sách các tài liệu trong bộ Context
1. `01_PROJECT_OVERVIEW.md`
2. `02_FUNCTIONAL_REQUIREMENTS.md`
3. `03_SYSTEM_ARCHITECTURE.md`
4. `04_DATABASE_DICTIONARY.md`
5. `05_BUSINESS_WORKFLOWS.md`
6. `06_API_CATALOG.md`
7. `07_FRONTEND_SCREEN_CATALOG.md`
8. `08_TRACEABILITY_MATRIX.md`
9. `09_TEST_AND_RESULT_EVIDENCE.md`
10. `10_REPORT_40_PAGE_BLUEPRINT.md`
11. `11_SCREENSHOT_PLAN.md`
12. `12_GLOSSARY_AND_REFERENCES_SEED.md`
13. `EVIDENCE_INDEX.md`
14. Các file biểu đồ trong thư mục `diagrams/` (ERD, Use Case, Activity, Sequence).

LƯU Ý QUAN TRỌNG CHO AI VIẾT BÁO CÁO: 
- KHÔNG nhắc tới bất kỳ module nào liên quan đến Blog, Cẩm nang du lịch (Travel Information).
- Báo cáo phải có văn phong học thuật, khách quan, minh chứng bằng code từ các file Context này.
