# ĐỀ CƯƠNG BÁO CÁO 40 TRANG (REPORT BLUEPRINT)

Tài liệu này cung cấp bộ khung dàn ý chi tiết để viết Báo cáo Đồ án tốt nghiệp / Kết thúc học phần, ước tính khoảng 40 trang nội dung chính, bám sát hệ thống Đặt vé máy bay đã phát triển.

## CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (Dự kiến 4 trang)
1. **Đặt vấn đề (1 trang)**
   - Sự bùng nổ của TMĐT và hàng không giá rẻ. 
   - Những khó khăn của đặt vé truyền thống (nhầm lẫn, overbooking, không quản lý được doanh thu).
2. **Mục tiêu hệ thống (1.5 trang)**
   - Xây dựng giải pháp OTA toàn diện.
   - Ứng dụng kỹ thuật bảo toàn dữ liệu đồng thời.
3. **Phạm vi dự án (1.5 trang)**
   - Phân hệ khách hàng: Tìm kiếm, giữ chỗ, thanh toán.
   - Phân hệ Admin: Quản trị cấu hình.
   - Không bàn tới các chức năng quảng cáo/blog.

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ (Dự kiến 7 trang)
*(Lưu ý: Chỉ đưa các công nghệ đã thực sự sử dụng trong source code)*
1. **Kiến trúc Client-Server & RESTful API (1.5 trang)**
   - Mô hình tách biệt Frontend/Backend.
2. **Frontend: React & Vite (1.5 trang)**
   - Lợi ích của Single Page Application (SPA). Virtual DOM.
3. **Backend: ASP.NET Core & EF Core (2 trang)**
   - Dependency Injection.
   - Kiến trúc Service Pattern.
4. **Các kỹ thuật nâng cao (2 trang)**
   - JWT (JSON Web Token) trong xác thực.
   - Kỹ thuật Khóa đồng thời lạc quan (Optimistic Concurrency) chống Overbooking.
   - Idempotency trong thanh toán.

## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG (Dự kiến 20 trang)
Đây là chương trọng tâm nhất, chiếm 50% thời lượng báo cáo.

1. **Phân tích yêu cầu (3 trang)**
   - Phân tích User Roles (Customer, Admin).
   - Biểu đồ Use Case tổng quát và chi tiết.
   - *Tham khảo tài liệu: `02_FUNCTIONAL_REQUIREMENTS.md`*
2. **Thiết kế Cơ sở dữ liệu (5 trang)**
   - Phân tích 17 bảng dữ liệu.
   - Biểu đồ ERD. Mối quan hệ giữa Ghế Vật Lý và Ghế Chuyến Bay.
   - *Tham khảo: `04_DATABASE_DICTIONARY.md`*
3. **Thiết kế luồng xử lý nghiệp vụ (7 trang)**
   - **Mục tiêu**: Trình bày bằng sơ đồ Activity và Sequence.
   - Luồng 1: Tìm kiếm chuyến bay.
   - Luồng 2: Cấu hình giữ chỗ (Hold Seat) - Phải có Sequence Diagram.
   - Luồng 3: Thanh toán an toàn với Idempotency Key.
   - *Tham khảo: `05_BUSINESS_WORKFLOWS.md`*
4. **Thiết kế giao diện (5 trang)**
   - Bố cục chung (Header, Footer, Sidebar Admin).
   - Danh sách các màn hình quan trọng (Chụp ảnh minh họa).
   - *Tham khảo: `07_FRONTEND_SCREEN_CATALOG.md`*

## CHƯƠNG 4: KẾT QUẢ TRIỂN KHAI VÀ ĐÁNH GIÁ (Dự kiến 6 trang)
1. **Kết quả đạt được (3 trang)**
   - Hệ thống đáp ứng đúng yêu cầu thiết kế.
   - Vượt qua các bài kiểm thử biên dịch (Build & Lint).
   - Mô tả bằng hình ảnh trải nghiệm thực tế (Màn hình Home -> Payment).
2. **Kiểm thử hệ thống (2 trang)**
   - Trình bày một số Test Case nổi bật (Kiểm thử đăng nhập sai, kiểm thử xung đột đặt ghế, kiểm thử tự động giải phóng ghế).
   - *Tham khảo: `09_TEST_AND_RESULT_EVIDENCE.md`*
3. **Đánh giá giải pháp kỹ thuật (1 trang)**
   - Điểm mạnh: Kiến trúc vững chắc, logic chống overbooking hoạt động hoàn hảo, UX mượt mà.

## CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN (Dự kiến 3 trang)
1. **Kết luận (1 trang)**
   - Tóm tắt các chức năng đã xây dựng. Khẳng định hoàn thành đồ án.
2. **Khuyến nghị và Hướng phát triển (2 trang)**
   - Trình bày như một định hướng mở rộng:
     - Tích hợp thêm Payment Gateway thực tế (VNPay, MoMo).
     - Đưa hệ thống lên Cloud (Azure/AWS).
     - Áp dụng Microservices nếu số lượng hãng hàng không tăng mạnh.
     - Xây dựng app Mobile bằng React Native.

---
**TÀI LIỆU THAM KHẢO**
**PHỤ LỤC** (Mã nguồn, JSON API Mẫu)
