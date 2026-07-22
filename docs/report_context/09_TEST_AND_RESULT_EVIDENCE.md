# BẰNG CHỨNG KIỂM THỬ VÀ KẾT QUẢ THỰC THI (TEST & EXECUTION EVIDENCE)

Tài liệu này ghi lại các bằng chứng thực thi (Runtime Evidence) thu thập được trong quá trình audit mã nguồn. Tất cả các lệnh đều được chạy thực tế trên nhánh `update-trang-chu-muc-hanh-trinh`.

## 1. THÔNG TIN MÔI TRƯỜNG THỰC THI
- **Repository Branch**: `update-trang-chu-muc-hanh-trinh`
- **Commit hash**: `0c7ba2c87603a81c83db3f08ac8443750f198677`
- **Ngày kiểm tra**: 2026-07-20
- **.NET SDK**: .NET 8.0
- **Frontend Tooling**: Vite v8.1.3, React v19.2.7

## 2. KẾT QUẢ BUILD VÀ LINT

### 2.1. Backend Build (`dotnet build`)
- **Lệnh thực thi**: `dotnet build` tại `C:\Huflit\web_maybay\FlightBookingSystem.Web`
- **Kết quả**: **PASS**
- **Log đầu ra**:
```text
  Determining projects to restore...
  All projects are up-to-date for restore.
  FlightBookingSystem.Web -> C:\Huflit\web_maybay\FlightBookingSystem.Web\bin\Debug\net8.0\FlightBookingSystem.Web.dll

Build succeeded.
    0 Warning(s)
    0 Error(s)
Time Elapsed 00:00:04.27
```

### 2.2. Frontend Build (`npm run build`)
- **Lệnh thực thi**: `npm run build` tại `C:\Huflit\web_maybay\flight-booking-frontend`
- **Kết quả**: **PASS**
- **Log đầu ra**:
```text
> flight-booking-frontend@0.0.0 build
> vite build
vite v8.1.3 building client environment for production...
transforming...✓ 205 modules transformed.
rendering chunks...
dist/index.html                                          0.48 kB │ gzip:   0.31 kB
...
dist/assets/index-C6nq5ydG.js                          669.78 kB │ gzip: 176.16 kB
✓ built in 1.30s
```

### 2.3. Frontend Lint (`npm run lint`)
- **Lệnh thực thi**: `npm run lint` sử dụng công cụ `oxlint`
- **Kết quả**: **PASS** (0 Errors)
- **Ghi chú**: Tìm thấy 33 warnings liên quan đến biến chưa sử dụng (unused variables/functions), không có lỗi cú pháp nghiêm trọng.
```text
Found 33 warnings and 0 errors.
Finished in 140ms on 85 files with 91 rules using 12 threads.
```

## 3. MA TRẬN TEST CASE NGHIỆP VỤ (BUSINESS TEST CASE MATRIX)

*(Các test case dưới đây chưa được chạy End-to-End bằng tool Automation trong phiên audit, cần được kiểm chứng thủ công)*

| TC ID | Chức năng | Tiền điều kiện | Các bước | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|---|
| **TC-01** | Đăng ký tài khoản mới | Email chưa tồn tại | Nhập Form Đăng ký -> Click Đăng ký | Hệ thống báo thành công, tạo DB Record | Chưa thực thi trong phiên audit |
| **TC-02** | Đăng ký trùng Email | Đã có User A | Đăng ký bằng Email User A | Báo lỗi Email đã tồn tại (400 Bad Request) | Chưa thực thi trong phiên audit |
| **TC-03** | Giữ ghế thành công | Chuyến bay có ghế trống | Click vào ghế màu trắng -> Gọi API Hold | Ghế chuyển sang màu vàng (Của tôi) | Chưa thực thi trong phiên audit |
| **TC-04** | Xung đột giữ ghế (Concurrency) | User A và B cùng nhìn thấy 1 ghế trống | A và B click cùng lúc vào ghế | User A thành công, User B nhận lỗi 409 Conflict | Chưa thực thi trong phiên audit |
| **TC-05** | Hết hạn giữ ghế | Ghế đang Hold | Chờ 31 phút | Hệ thống nhả ghế sang Available | Chưa thực thi trong phiên audit |
| **TC-06** | Idempotency Payment | Đang ở màn hình Thanh toán | Bấm "Thanh toán" liên tiếp 2 lần (F5) | Hệ thống chỉ trừ tiền 1 lần, lần 2 trả về kết quả Cached | Chưa thực thi trong phiên audit |
