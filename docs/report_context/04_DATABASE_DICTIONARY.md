# TỪ ĐIỂN CƠ SỞ DỮ LIỆU (DATABASE DICTIONARY)

Hệ thống sử dụng cơ sở dữ liệu quan hệ (SQLite cho môi trường Dev, quản lý thông qua Entity Framework Core). Có tổng cộng 17 bảng được thiết kế chuẩn hóa cao, phân chia thành các nhóm logic nghiệp vụ chặt chẽ.

## I. BẢNG TỔNG QUAN

| STT | Tên bảng | Mục đích | Primary Key (PK) | Foreign Key chính (FK) |
|-----|----------|----------|-------------|-------------------|
| 1 | **TaiKhoan** | Quản lý người dùng, phân quyền | MaTaiKhoan | - |
| 2 | **SanBay** | Thông tin sân bay đi/đến | MaSanBay | - |
| 3 | **HangBay** | Thông tin hãng hàng không | MaHangBay | - |
| 4 | **LoTrinh** | Các tuyến đường bay cố định | MaLoTrinh | MaSanBayDi, MaSanBayDen |
| 5 | **MayBay** | Vật lý tàu bay | MaMayBay | MaHangBay |
| 6 | **HangGhe** | Định nghĩa cấu hình hạng vé | MaHangGhe | - |
| 7 | **GheMayBay** | Cấu hình vị trí ghế vật lý trên tàu | MaGheMayBay | MaMayBay, MaHangGhe |
| 8 | **ChuyenBay** | Lịch khởi hành cụ thể | MaChuyenBay | MaLoTrinh, MaMayBay |
| 9 | **GheChuyenBay** | Trạng thái ghế trên từng chuyến bay cụ thể | MaGheChuyenBay | MaChuyenBay, MaGheMayBay |
| 10 | **PhieuDatCho** | Đơn hàng Booking đặt vé tổng | MaPhieuDatCho | MaTaiKhoan |
| 11 | **ChangDatCho** | Các chặng bay trong một Booking | MaChangDatCho | MaPhieuDatCho, MaChuyenBay |
| 12 | **HanhKhach** | Người bay thực tế | MaHanhKhach | MaPhieuDatCho |
| 13 | **Ve** | Vé điện tử phát hành cho HanhKhach | MaVe | MaPhieuDatCho, MaChangDatCho, MaGheChuyenBay, MaHanhKhach |
| 14 | **ThanhToan** | Giao dịch tài chính (Idempotency) | MaThanhToan | MaPhieuDatCho |
| 15 | **HoanTien** | Giao dịch hoàn trả | MaHoanTien | MaThanhToan, MaPhieuDatCho |
| 16 | **DichVuThem** | Gói dịch vụ bán kèm (Hành lý, ăn uống) | MaDichVu | - |
| 17 | **ChiTietDichVu** | Dịch vụ đã mua trong Booking | MaChiTietDichVu| MaPhieuDatCho, MaVe, MaHanhKhach, MaDichVu |

---

## II. CHI TIẾT CÁC BẢNG (DATA DICTIONARY)

### 1. Bảng `TaiKhoan` (Tài khoản)
- **Tên bảng vật lý**: TaiKhoans
- **Mục đích**: Quản lý thông tin đăng nhập và phân quyền hệ thống.

| STT | Tên cột | Kiểu dữ liệu | Cho phép NULL | Giá trị mặc định | Khóa/Ràng buộc |
|-----|---------|--------------|----------------|------------------|--------|
| 1 | MaTaiKhoan | int | No | | PK |
| 2 | Email | string (256) | No | | Unique Index |
| 3 | HoTen | string (160) | No | | |
| 4 | MatKhauHash | string | No | | |
| 5 | SoDienThoai | string (30) | Yes | | Unique Index |
| 6 | VaiTro | string (30) | No | "Customer" | |
| 7 | TrangThai | string (30) | No | "Active" | |

### 2. Bảng `ChuyenBay` (Chuyến bay vận hành)
- **Tên bảng vật lý**: ChuyenBays
- **Mục đích**: Lưu thông tin lịch khởi hành thực tế của các tàu bay trên một tuyến bay.

| STT | Tên cột | Kiểu dữ liệu | Cho phép NULL | Giá trị mặc định | Khóa/Ràng buộc |
|-----|---------|--------------|----------------|------------------|--------|
| 1 | MaChuyenBay | int | No | | PK |
| 2 | SoHieuChuyenBay | string (20) | No | | Unique Index với GioKhoiHanh |
| 3 | MaLoTrinh | int | No | | FK -> LoTrinh |
| 4 | MaMayBay | int | No | | FK -> MayBay |
| 5 | GioKhoiHanh | DateTime | No | | |
| 6 | GioHaCanh | DateTime | No | | |
| 7 | GiaCoBan | decimal | No | | |
| 8 | TrangThai | string (30) | No | "Scheduled" | |

### 3. Bảng `GheChuyenBay` (Trạng thái ghế)
- **Tên bảng vật lý**: GheChuyenBays
- **Mục đích**: Bảng CỰC KỲ QUAN TRỌNG dùng để kiểm soát việc bán ghế, chống Overbooking và quản lý giữ chỗ.

| STT | Tên cột | Kiểu dữ liệu | Cho phép NULL | Giá trị mặc định | Khóa/Ràng buộc |
|-----|---------|--------------|----------------|------------------|--------|
| 1 | MaGheChuyenBay | int | No | | PK |
| 2 | MaChuyenBay | int | No | | FK -> ChuyenBay |
| 3 | MaGheMayBay | int | No | | FK -> GheMayBay (vật lý) |
| 4 | TrangThaiGhe | string (30) | No | "Available" | (Available, Held, Booked) |
| 5 | GiaGhe | decimal | No | | Bằng GiaCoBan * HeSoGia |
| 6 | PhienBan | int | No | 0 | Concurrency Token |
| 7 | MaPhieuDatChoDangGiu | int | Yes | | FK -> PhieuDatCho (nếu có) |
| 8 | GiuDenLuc | DateTime | Yes | | Thời hạn Timeout giữ ghế |
| 9 | GiuBoiTaiKhoanId | int | Yes | | FK -> TaiKhoan |
| 10| SessionId | string (80) | Yes | | Phiên làm việc frontend |

### 4. Bảng `PhieuDatCho` (Booking / Đơn hàng)
- **Tên bảng vật lý**: PhieuDatChos
- **Mục đích**: Lưu trữ 1 giao dịch đặt vé tổng, chứa thông tin liên hệ và tổng tiền thanh toán.

| STT | Tên cột | Kiểu dữ liệu | Cho phép NULL | Giá trị mặc định | Khóa/Ràng buộc |
|-----|---------|--------------|----------------|------------------|--------|
| 1 | MaPhieuDatCho | int | No | | PK |
| 2 | MaDatCho | string (12) | No | | Mã Booking Code (VD: PNR), Unique |
| 3 | MaTaiKhoan | int | Yes | | FK -> TaiKhoan |
| 4 | HoTenLienHe | string (160) | No | | |
| 5 | TrangThai | string (30) | No | "Holding" | (Holding, Confirmed, Cancelled) |
| 6 | TongTien | decimal | No | | |
| 7 | GiuDenLuc | DateTime | Yes | | Hạn thanh toán |

### 5. Bảng `ThanhToan` (Payment)
- **Tên bảng vật lý**: ThanhToans
- **Mục đích**: Ghi nhận giao dịch trả tiền cho PhieuDatCho, ứng dụng Idempotency.

| STT | Tên cột | Kiểu dữ liệu | Cho phép NULL | Giá trị mặc định | Khóa/Ràng buộc |
|-----|---------|--------------|----------------|------------------|--------|
| 1 | MaThanhToan | int | No | | PK |
| 2 | MaPhieuDatCho | int | No | | FK -> PhieuDatCho |
| 3 | IdempotencyKey | string (120) | Yes | | Chống trùng lặp giao dịch |
| 4 | SoTien | decimal | No | | |
| 5 | TrangThai | string (30) | No | "Pending" | (Pending, Completed, Failed) |

*(Lưu ý: Các bảng khác như `HanhKhach`, `Ve`, `MayBay`, `LoTrinh` có cấu trúc chuẩn hóa tương tự, chứa các FK nối các bảng chính).*

---

## III. MÔI QUAN HỆ & GIẢI THÍCH NGHIỆP VỤ (RELATIONSHIPS)

**1. Sự khác biệt giữa `GheMayBay` (Vật lý) và `GheChuyenBay` (Logic):**
- **`GheMayBay`**: Là thiết kế cố định của cái tàu bay đó. (VD: Tàu bay Boeing 737 có ghế 1A, hạng Business). Dữ liệu này tĩnh.
- **`GheChuyenBay`**: Khi 1 `ChuyenBay` được tạo, hệ thống sẽ Clone toàn bộ `GheMayBay` của tàu bay đó để chèn vào `GheChuyenBay`. Tại đây, mỗi ghế sẽ có một trạng thái (Trống/Đã bán/Đang chọn) độc lập cho chuyến bay cụ thể vào ngày cụ thể đó.

**2. Vé (Ticket) và Hành khách (Passenger):**
Một Booking (`PhieuDatCho`) có thể có nhiều `HanhKhach`. Khi giao dịch hoàn tất, hệ thống sẽ phát hành nhiều `Ve` (Vé điện tử). Mỗi `Ve` sẽ liên kết 1 `HanhKhach` cụ thể với 1 `GheChuyenBay` trên 1 `ChangDatCho` cụ thể.
