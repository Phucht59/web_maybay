# LUỒNG NGHIỆP VỤ (BUSINESS WORKFLOWS & RULES)

Tài liệu này trình bày các luồng nghiệp vụ chính của hệ thống từ góc độ logic, cách hệ thống thao tác với cơ sở dữ liệu và các quy tắc (Business Rules) cần tuân thủ.

## 1. BẢNG QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| Rule ID | Quy tắc | Đối tượng | Điều kiện | Xử lý | Source evidence |
|---------|---------|-----------|-----------|-------|-----------------|
| BR-01 | Giới hạn số ghế | Customer | Khi Hold Seat | Số ghế đang chọn trong cùng Session <= số lượng giới hạn (VD: 9) | Báo lỗi BadRequest nếu quá. | `BookingController.cs:135-143` |
| BR-02 | Chống Overbooking | Ghế (Seat) | Khi gọi API Hold | `TrangThaiGhe` phải là `Available` HOẶC thuộc về chính user/session đó. | Đổi trạng thái, tăng `PhienBan` (Optimistic Concurrency). Báo lỗi Conflict (409) nếu xung đột. | `BookingController.cs:131-133` |
| BR-03 | Thời hạn giữ ghế (Timeout) | Ghế (Seat) | Sau khi Hold Seat | Cột `GiuDenLuc` được set (VD: 30 phút). Nếu chưa Checkout mà quá hạn, ghế sẽ bị nhả ra. | Chạy background task / check Lazy Load để set về `Available`. | `BookingController.cs:34` |
| BR-04 | Ràng buộc Hạng vé | Ghế (Seat) | Khi chọn ghế | `MaHangGhe` request truyền lên phải khớp với cấu hình ghế vật lý. | Báo lỗi BadRequest. | `BookingController.cs:128-129` |
| BR-05 | Chống trùng lặp thanh toán | Thanh toán | Submit form thanh toán | Yêu cầu phải gửi kèm `IdempotencyKey`. | Nếu Key đã tồn tại, trả về giao dịch cũ. | `PaymentFinalizationService.cs` |
| BR-06 | Phát hành vé | Vé (Ticket) | Thanh toán hoàn tất | Trạng thái Thanh Toán -> Completed. | Gán `TrangThaiGhe` = Booked, insert vào bảng `Ve` (Vé Issued). | `PaymentFinalizationService.cs` |

---

## 2. QUY TRÌNH NGHIỆP VỤ CHI TIẾT (WORKFLOWS)

### 2.1. Quy trình Chọn và Giữ Ghế (Hold Seat)
- **Actor:** Khách hàng.
- **Tiền điều kiện:** Người dùng đã vào xem sơ đồ ghế của chuyến bay.
- **Các bước xử lý:**
  1. Frontend gọi API `POST /api/booking/flights/{id}/seats/{seatId}/hold`, đính kèm `SessionId` (do Frontend tự generate) và Token (nếu đã login).
  2. Backend kiểm tra và giải phóng các ghế đã hết hạn (`ReleaseExpiredSeats(flightId)`).
  3. Lấy record `GheChuyenBay` từ DB.
  4. Xác thực trạng thái `Available`. Nếu ghế đang `Held` nhưng không phải do cùng SessionId/AccountId giữ, trả lỗi 409 (Conflict).
  5. Đánh dấu ghế `Held`, update `GiuBoiTaiKhoanId = accountId`, `SessionId = sessionId`, set `GiuDenLuc = Now + 30m`, và `PhienBan++`.
  6. Lưu xuống DB. Cơ chế EF Core sẽ tự block nếu có 1 request khác cũng đang cố lưu cùng Version (Concurrency).
- **Kết quả:** Ghế bị khóa, chỉ có session hiện tại có quyền thực hiện tiếp Checkout.

### 2.2. Quy trình Giải phóng ghế tự động (Lazy Release)
- **Actor:** Hệ thống (Backend).
- **Mô tả:** Hệ thống không dùng 1 background cron-job chạy liên tục gây tốn resource, mà dùng phương pháp "Lazy Evaluation".
- **Các bước xử lý:**
  1. Mỗi khi có request lấy danh sách ghế hoặc trước khi Hold/Checkout, Backend sẽ gọi `ReleaseExpiredSeats(flightId)`.
  2. Hàm này Query tất cả `GheChuyenBay` có trạng thái `Held` và `GiuDenLuc < Now`.
  3. Update trạng thái các ghế đó thành `Available`, xóa SessionId và AccountId.
  4. Những ghế này lập tức khả dụng cho các khách hàng khác.

### 2.3. Quy trình Tạo Checkout (Create Booking / Phiếu đặt chỗ)
- **Actor:** Khách hàng.
- **Input:** Danh sách `SeatIds`, mảng thông tin `HanhKhach` (tên, CCCD), danh sách `DichVuThem` (hành lý).
- **Các bước xử lý:**
  1. Nhận Request tại `BookingCheckoutController`.
  2. Bắt đầu Database Transaction (`_db.Database.BeginTransactionAsync()`).
  3. Kiểm tra các ghế truyền lên phải đang được `Held` bởi chính khách hàng/session đó và chưa hết hạn.
  4. Tạo bảng `PhieuDatCho`, sinh mã Booking code (VD: PNR - 6 ký tự).
  5. Tính toán tiền ghế: Cứ mỗi ghế có 1 giá (GiaCoBan * HeSoGia).
  6. Tạo các record vào bảng `HanhKhach`.
  7. Liên kết hành lý vào `ChiTietDichVu`, cộng tiền.
  8. Gán `MaPhieuDatChoDangGiu` vào các ghế tương ứng, và gia hạn thêm 10-15 phút để hoàn tất thanh toán.
  9. Commit Transaction.
- **Kết quả:** Phiếu đặt chỗ được lưu, trạng thái "Holding". Chờ khách thanh toán.

### 2.4. Quy trình Thanh Toán và Cấp Vé (Payment & Ticketing)
- **Actor:** Khách hàng.
- **Input:** Mã Booking (`MaPhieuDatCho`), Số tiền, Thông tin thẻ/phương thức, `IdempotencyKey`.
- **Các bước xử lý:**
  1. Frontend gửi yêu cầu xử lý thanh toán (thực tế hoặc mô phỏng qua `PaymentSimulationService`).
  2. Nếu thanh toán giả lập báo lỗi -> Hủy.
  3. `PaymentFinalizationService` bắt đầu Transaction.
  4. Kiểm tra `IdempotencyKey`.
  5. Cập nhật `ThanhToan` status = `Completed`.
  6. Vòng lặp cấp vé: Dựa vào số Hành Khách và Số Ghế, sinh ra record `Ve` điện tử (Trạng thái Issued).
  7. Chuyển `TrangThaiGhe` từ `Held` -> `Booked` (Đã bán kiên cố).
  8. Cập nhật `PhieuDatCho` status = `Confirmed`.
  9. Commit Transaction.
- **Kết quả:** Khách hàng nhận được mã Vé điện tử. Ghế bị khóa vĩnh viễn không bán cho người khác được.

### 2.5. Quy trình Quản lý Chuyến bay (Admin)
- **Actor:** Quản trị viên (Admin).
- **Mô tả:** Lên lịch bay.
- **Quy trình:**
  1. Chọn Lộ trình (`LoTrinh`) và Tàu bay (`MayBay`).
  2. Nhập giờ khởi hành, giờ hạ cánh.
  3. Nhấn Lưu -> Backend lưu `ChuyenBay`. 
  4. **Quan trọng:** Backend trigger một sự kiện tự động query toàn bộ `GheMayBay` vật lý của cái `MayBay` đó, và sinh ra một ma trận ghế vào bảng `GheChuyenBay` gắn liền với `ChuyenBay` mới tạo. Tất cả mặc định set trạng thái `Available`.
