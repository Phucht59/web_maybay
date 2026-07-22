# Original User Request

## 2026-07-12T03:56:35Z

# Teamwork Project Prompt — Draft

> Status: Step 4-6 — Drafting Requirements & Acceptance Criteria
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Hệ thống Agent tự động (Teamwork) sẽ đóng vai trò là một đội ngũ QA & Developer. Nhiệm vụ chính là liên tục kiểm thử, phát hiện và tự động sửa các lỗi (cả về UI/UX lẫn Logic API) xoay quanh **Module Chọn Ghế (Booking Seat)** trên cả Frontend và Backend.

Working directory: c:\Huflit\web_maybay
Integrity mode: demo

## Requirements

### R1. Rà soát và Sửa lỗi Frontend (Booking Seat)
Kiểm tra toàn diện giao diện `BookingSeatPage.jsx` và các component liên quan. Tìm và sửa các lỗi về layout, hiển thị thiếu dữ liệu, hiển thị sai trạng thái ghế, hoặc lỗi tràn CSS.

### R2. Rà soát và Sửa lỗi Backend API (Booking Seat)
Kiểm tra logic của `BookingController.cs` và các service xử lý trạng thái giữ chỗ (Hold), nhả chỗ (Release) và thanh toán. Đảm bảo dữ liệu trả về cho Frontend luôn đồng bộ và chính xác.

### R3. Quy trình Kiểm thử Liên tục (Continuous QA)
Sau khi sửa bất kỳ lỗi nào, đội ngũ Agent phải tự thực hiện quá trình kiểm tra (QA) độc lập để xác minh lỗi đó đã hoàn toàn được khắc phục trên trình duyệt hoặc thông qua API log.

## Acceptance Criteria

### Rà soát Frontend
- [ ] Truy cập trang `http://localhost:5173/booking/8` bằng công cụ DOM Inspector hoặc cURL thành công mà không gặp lỗi trắng màn hình (crash).
- [ ] Giao diện hiển thị đúng và đủ số lượng ghế trống/đã bán/đang chọn tương ứng với dữ liệu trả về từ API.
- [ ] Không có nút bấm hoặc văn bản nào bị tràn ra ngoài khung chứa (card) của nó.

### Logic Backend
- [ ] Thao tác giữ chỗ (Hold Seat) qua API trả về HTTP 200 OK và làm thay đổi đúng trạng thái ghế trong cơ sở dữ liệu.
- [ ] Các ghế đã hết thời gian giữ chỗ (Expired) phải được tự động chuyển về trạng thái Trống (Available) khi API được gọi.

### Verification (Kiểm chứng)
- [ ] Việc sửa lỗi phải được xác minh thông qua một Agent đóng vai trò QA: Agent này sẽ mô phỏng luồng thao tác của người dùng cuối (chọn 1 ghế trống -> giữ chỗ -> xác nhận giá tiền thay đổi) và phải báo cáo thành công.
