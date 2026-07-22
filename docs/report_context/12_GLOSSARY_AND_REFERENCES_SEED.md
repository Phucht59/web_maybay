# DANH MỤC THUẬT NGỮ VÀ TÀI LIỆU THAM KHẢO (GLOSSARY & REFERENCES)

## 1. DANH MỤC TỪ VIẾT TẮT VÀ THUẬT NGỮ (GLOSSARY)

| Thuật ngữ / Viết tắt | Tên đầy đủ | Giải nghĩa tiếng Việt | Vai trò trong dự án | Source Evidence |
|---|---|---|---|---|
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng | Điểm kết nối để Frontend giao tiếp với Backend. | Toàn bộ `Controllers/` |
| **REST** | Representational State Transfer | Chuyển giao trạng thái đại diện | Tiêu chuẩn thiết kế kiến trúc API được sử dụng trong dự án (GET/POST/PUT). | Các HTTP Attributes trong `Controllers/` |
| **SPA** | Single Page Application | Ứng dụng Trang Đơn | Mô hình Frontend React, chỉ tải HTML 1 lần và cập nhật nội dung động mà không load lại trang. | `AppRoutes.jsx` |
| **JWT** | JSON Web Token | Token Web dạng JSON | Chuỗi mã hóa dùng để xác thực người dùng thay cho Session/Cookie truyền thống. | `Program.cs:95` (AddJwtBearer) |
| **ORM** | Object-Relational Mapping | Ánh xạ hướng đối tượng - quan hệ | Kỹ thuật dùng đối tượng lập trình để thao tác DB, bỏ qua truy vấn SQL thô. | `ApplicationDbContext.cs` |
| **EF Core** | Entity Framework Core | (Tương tự) | Thư viện ORM của .NET sử dụng cho Backend. | Khai báo `DbSet<T>` trong DbContext |
| **HTTP** | Hypertext Transfer Protocol | Giao thức truyền tải siêu văn bản | Giao thức nền tảng của Web, dự án sử dụng các hàm GET, POST cho API. | Trình duyệt gọi API |
| **JSON** | JavaScript Object Notation | Cú pháp đối tượng JavaScript | Định dạng dữ liệu chính dùng để trao đổi giữa Frontend và Backend. | Output của API |
| **CRUD** | Create, Read, Update, Delete | Tạo, Đọc, Sửa, Xóa | Các thao tác cơ bản nhất của quản trị CSDL (Dành cho Admin). | `SanBayController.cs` |
| **CORS** | Cross-Origin Resource Sharing| Chia sẻ tài nguyên chéo nguồn | Cấu hình cho phép Frontend (port 5173) gọi Backend API (port 5071). | `Program.cs:17` |
| **DI** | Dependency Injection | Tiêm phụ thuộc | Design Pattern giúp tiêm các `Service` vào `Controller` trong .NET một cách tự động, nới lỏng kết dính. | `Program.cs:81` (AddScoped) |
| **DBMS** | Database Management System | Hệ quản trị cơ sở dữ liệu | SQLite. | `flightbooking.db` |
| **PK / FK** | Primary Key / Foreign Key | Khóa chính / Khóa ngoại | Các trường để liên kết các bảng. | Định nghĩa trong Entity |
| **DTO** | Data Transfer Object | Đối tượng Truyền Dữ liệu | Lớp dữ liệu dùng để giao tiếp qua API, che giấu cấu trúc thật của Entity. | Folder `Models/DTOs` |
| **TTL** | Time-To-Live | Thời gian sống | Thời hạn hiệu lực của một chiếc ghế đang được giữ (VD: 30 phút). | Thuộc tính `GiuDenLuc` |
| **IATA** | International Air Transport Association | Hiệp hội Vận tải HK Quốc tế | Mã sân bay quốc tế 3 chữ cái (VD: SGN, HAN, DAD). | Thuộc tính `MaSanBay` |

---

## 2. TÀI LIỆU THAM KHẢO DỰ KIẾN (REFERENCES SEED)

Dưới đây là danh sách các tài liệu tham khảo chính thống, đóng vai trò là cơ sở lý thuyết cho việc phát triển dự án. (Sinh viên có thể trích dẫn vào mục Tài liệu tham khảo cuối báo cáo).

1. **Meta (Facebook).** *React Official Documentation*. Truy cập từ: https://react.dev/
2. **Remix Software.** *React Router Official Documentation*. Truy cập từ: https://reactrouter.com/
3. **Evan You.** *Vite Documentation*. Truy cập từ: https://vitejs.dev/
4. **Microsoft Corporation.** *ASP.NET Core Web API documentation*. Truy cập từ: https://learn.microsoft.com/en-us/aspnet/core/web-api/
5. **Microsoft Corporation.** *Entity Framework Core documentation*. Truy cập từ: https://learn.microsoft.com/en-us/ef/core/
6. **IETF.** *RFC 7519: JSON Web Token (JWT)*. Truy cập từ: https://tools.ietf.org/html/rfc7519
7. **SQLite Consortium.** *SQLite Official Documentation*. Truy cập từ: https://www.sqlite.org/docs.html
8. **SmartBear Software.** *Swagger/OpenAPI Documentation*. Truy cập từ: https://swagger.io/docs/
9. **Axios Contributors.** *Axios Documentation*. Truy cập từ: https://axios-http.com/docs/intro
10. **Fielding, Roy Thomas (2000).** *Architectural Styles and the Design of Network-based Software Architectures (REST)*. Ph.D. dissertation, University of California, Irvine.
