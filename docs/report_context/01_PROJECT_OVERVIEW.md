# TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

## 1. Bối cảnh bài toán & Lý do chọn đề tài
Trong kỷ nguyên chuyển đổi số, ngành hàng không đang chứng kiến sự dịch chuyển mạnh mẽ từ mô hình bán vé truyền thống thông qua đại lý vật lý sang mô hình đặt vé trực tuyến (Online Travel Agency - OTA và Direct Booking). 

**Vấn đề của cách đặt vé thủ công/truyền thống:**
- Khách hàng tốn nhiều thời gian di chuyển, tra cứu lịch trình và khó khăn trong việc so sánh giá.
- Nhân viên bán vé dễ sai sót khi nhập liệu thông tin hành khách (sai tên, sai giấy tờ).
- Rủi ro **Overbooking** (bán quá số ghế thực tế) rất cao nếu hệ thống liên lạc giữa đại lý và hãng không đồng bộ theo thời gian thực.
- Khó khăn trong việc quản trị doanh thu, phân bổ tàu bay và tối ưu hóa hệ số sử dụng ghế (Seat Load Factor).

**Lý do chọn đề tài:** 
Dự án "Xây dựng website đặt vé máy bay trực tuyến" được lựa chọn nhằm giải quyết các bài toán trên bằng cách ứng dụng công nghệ web hiện đại (React, ASP.NET Core) kết hợp cơ chế kiểm soát đồng thời (Concurrency Control). Đồ án không chỉ mang tính ứng dụng cao mà còn giải quyết được những thách thức kỹ thuật phức tạp như xử lý giao dịch đồng thời và thanh toán an toàn.

## 2. Mục tiêu tổng quát và cụ thể
**Mục tiêu tổng quát:**
Phát triển một hệ thống thông tin hoàn chỉnh, đáng tin cậy và thân thiện với người dùng, số hóa toàn bộ quy trình từ lúc tra cứu chuyến bay cho đến khi xuất vé điện tử, phục vụ cho cả Khách hàng và Ban Quản trị Hãng hàng không.

**Mục tiêu cụ thể:**
- Xây dựng giao diện Frontend tương tác cao bằng React (SPA), đảm bảo trải nghiệm mượt mà, phản hồi nhanh.
- Thiết kế Backend bằng ASP.NET Core Web API theo chuẩn RESTful, đảm bảo tính mở rộng và dễ bảo trì.
- Ứng dụng kỹ thuật Optimistic Concurrency bằng Entity Framework Core để chống xung đột dữ liệu khi nhiều người cùng chọn một ghế.
- Tích hợp kỹ thuật Idempotency trong quá trình thanh toán để tránh việc người dùng bị trừ tiền nhiều lần do lỗi mạng hoặc bấm F5.

## 3. Người dùng mục tiêu & Phạm vi nghiệp vụ
**Người dùng mục tiêu:**
- Khách hàng cá nhân có nhu cầu đi lại bằng đường hàng không.
- Nhân viên quản trị hệ thống của hãng hàng không (Admin).

**Phạm vi nghiệp vụ:**
- **Không bao gồm:** Phân hệ tin tức, cẩm nang du lịch, bài viết blog, quản trị nội dung CMS bài viết (Dự án tập trung 100% vào nghiệp vụ hàng không cốt lõi).
- **Giới hạn hiện tại:** Hệ thống hỗ trợ xử lý luồng đặt vé một chiều (OneWay) và nhiều hành khách trong cùng một phiên. Cơ sở dữ liệu đang thiết lập trên SQLite phục vụ mô phỏng và kiểm thử.

## 4. Danh sách chức năng chính

### 4.1. Phân hệ Khách hàng (Customer)
- **Tài khoản:** Đăng nhập, đăng ký, xác thực qua JWT.
- **Tìm kiếm chuyến bay:** Tra cứu theo sân bay đi, sân bay đến, ngày khởi hành.
- **Chọn chuyến bay:** Lọc chuyến bay, xem chi tiết giờ khởi hành, giá vé.
- **Đặt chỗ & Chỗ ngồi:** Xem sơ đồ ghế trực quan, chọn ghế (tự động khóa tạm thời - hold seat).
- **Thông tin chuyến đi:** Nhập chi tiết hành khách, chọn dịch vụ bổ sung (Hành lý, Bảo hiểm).
- **Thanh toán:** Xem tổng hợp chi phí (Checkout Summary), xác nhận thanh toán (có cơ chế Idempotency).
- **Hủy & Hết hạn:** Tự động giải phóng ghế nếu khách không hoàn tất thanh toán trong thời gian quy định (Time-to-Live).

### 4.2. Phân hệ Quản trị (Admin)
- **Dashboard:** Thống kê tổng quan về chuyến bay, vé, doanh thu.
- **Quản lý Danh mục:** CRUD (Tạo, Đọc, Cập nhật, Xóa) dữ liệu Sân bay, Hãng bay, Máy bay, Hạng ghế.
- **Quản lý Tuyến bay (Route):** Thiết lập các chặng bay tiêu chuẩn giữa các sân bay.
- **Quản lý Sơ đồ ghế (Seat Map):** Khởi tạo và chỉnh sửa vị trí vật lý của ghế trên máy bay.
- **Quản lý Chuyến bay (Flight):** Lên lịch chuyến bay, gắn máy bay, tạo cấu hình ghế thực tế cho chuyến bay.

## 5. Giá trị của hệ thống
- **Về mặt kỹ thuật:** Là một ứng dụng minh chứng được năng lực xử lý nghiệp vụ phức tạp (Concurrency, Transaction, Idempotency) và kiến trúc Client-Server hiện đại.
- **Về mặt nghiệp vụ:** Đảm bảo tính toàn vẹn dữ liệu cực cao (không bao giờ xảy ra tình trạng 2 khách mua cùng 1 ghế), luồng đi rõ ràng và trải nghiệm người dùng (UX) tối ưu nhờ kỹ thuật SPA.
