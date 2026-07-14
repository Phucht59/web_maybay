using System.Data;
using System.Security.Cryptography;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models;
using FlightBookingSystem.Web.Models.DTOs;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Services;

public sealed class CheckoutCreationService
{
    private const int BookingCodeAttempts = 5;

    private static readonly TimeSpan PaymentWindow =
        TimeSpan.FromMinutes(10);

    private static readonly HashSet<string> BookableFlightStatuses =
        new(StringComparer.Ordinal) { "Scheduled", "Delayed" };

    private static readonly HashSet<string> SupportedServiceTypes =
        new(StringComparer.Ordinal) { "Baggage", "Protection" };

    private readonly ApplicationDbContext _db;

    public CheckoutCreationService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<CheckoutCreationResult> CreateAsync(
        int accountId,
        CheckoutRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

            async Task<CheckoutCreationResult> RollbackFailureAsync(
                CheckoutValidationOutcome outcome,
                string message)
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();
                return CheckoutCreationResult.Failure(outcome, message);
            }

            try
            {
                var now = DateTime.UtcNow;
                var paymentDeadline = now.Add(PaymentWindow);
                var serverTime = new DateTimeOffset(now, TimeSpan.Zero);
                var paymentDeadlineOffset = new DateTimeOffset(paymentDeadline, TimeSpan.Zero);

                var accountIsActive = await _db.TaiKhoans
                    .AsNoTracking()
                    .AnyAsync(
                        account => account.MaTaiKhoan == accountId && account.TrangThai == "Active",
                        cancellationToken);

                if (!accountIsActive)
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.Unauthorized,
                        "Tài khoản không tồn tại hoặc không còn hoạt động.");
                }

                var flight = await _db.ChuyenBays
                    .AsNoTracking()
                    .Where(candidate => candidate.MaChuyenBay == request.MaChuyenBay)
                    .Select(candidate => new
                    {
                        candidate.MaChuyenBay,
                        candidate.GioKhoiHanh,
                        candidate.TrangThai
                    })
                    .FirstOrDefaultAsync(cancellationToken);

                if (flight is null)
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.NotFound,
                        "Không tìm thấy chuyến bay.");
                }

                if (!BookableFlightStatuses.Contains(flight.TrangThai) || flight.GioKhoiHanh <= now)
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.Conflict,
                        "Chuyến bay không còn cho phép đặt chỗ.");
                }

                if (request.ThongTinLienHe is null ||
                    request.HanhKhachs is null ||
                    request.HanhKhachs.Count is < 1 or > 9 ||
                    request.HanhKhachs.Any(passenger => passenger is null))
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.BadRequest,
                        "Dữ liệu liên hệ hoặc danh sách hành khách không hợp lệ.");
                }

                var passengerRequests = request.HanhKhachs;
                var seatIds = passengerRequests
                    .Select(passenger => passenger.MaGheChuyenBay)
                    .ToList();

                if (seatIds.Any(seatId => seatId <= 0) ||
                    seatIds.Distinct().Count() != seatIds.Count)
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.BadRequest,
                        "Mỗi hành khách phải có một ghế hợp lệ và các ghế không được trùng nhau.");
                }

                var departureDate = DateOnly.FromDateTime(flight.GioKhoiHanh);
                foreach (var passenger in passengerRequests)
                {
                    if (!passenger.NgaySinh.HasValue ||
                        passenger.MaDichVus is null ||
                        passenger.MaDichVus.Count > 2 ||
                        passenger.MaDichVus.Any(serviceId => serviceId <= 0) ||
                        passenger.MaDichVus.Distinct().Count() != passenger.MaDichVus.Count)
                    {
                        return await RollbackFailureAsync(
                            CheckoutValidationOutcome.BadRequest,
                            "Dữ liệu hành khách hoặc danh sách dịch vụ không hợp lệ.");
                    }

                    if (string.Equals(passenger.LoaiGiayTo, "Passport", StringComparison.Ordinal) &&
                        (!passenger.NgayHetHanGiayTo.HasValue ||
                         passenger.NgayHetHanGiayTo.Value < departureDate))
                    {
                        return await RollbackFailureAsync(
                            CheckoutValidationOutcome.BadRequest,
                            "Hộ chiếu phải còn hạn đến ngày khởi hành.");
                    }
                }

                var seats = await _db.GheChuyenBays
                    .Where(seat => seatIds.Contains(seat.MaGheChuyenBay))
                    .ToListAsync(cancellationToken);

                if (seats.Count != seatIds.Count ||
                    seats.Any(seat => seat.MaChuyenBay != request.MaChuyenBay))
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.BadRequest,
                        "Một hoặc nhiều ghế không tồn tại hoặc không thuộc chuyến bay đã chọn.");
                }

                if (seats.Any(seat =>
                        !string.Equals(seat.TrangThaiGhe, "Held", StringComparison.Ordinal) ||
                        seat.GiuBoiTaiKhoanId != accountId ||
                        !string.Equals(seat.SessionId, request.SessionId, StringComparison.Ordinal) ||
                        seat.GiuDenLuc is null ||
                        seat.GiuDenLuc <= now ||
                        seat.MaPhieuDatChoDangGiu is not null))
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.Conflict,
                        "Một hoặc nhiều ghế không còn thuộc phiên giữ chỗ hiện tại.");
                }

                if (seats.Any(seat => seat.GiaGhe < 0))
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.Conflict,
                        "Không thể xác định giá ghế tại thời điểm hiện tại.");
                }

                var serviceIds = passengerRequests
                    .SelectMany(passenger => passenger.MaDichVus)
                    .Distinct()
                    .ToList();

                var services = serviceIds.Count == 0
                    ? []
                    : await _db.DichVuThems
                        .AsNoTracking()
                        .Where(service => serviceIds.Contains(service.MaDichVu))
                        .ToListAsync(cancellationToken);

                if (services.Count != serviceIds.Count ||
                    services.Any(service =>
                        !string.Equals(service.TrangThai, "Active", StringComparison.Ordinal) ||
                        !SupportedServiceTypes.Contains(service.LoaiDichVu) ||
                        service.Gia < 0))
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.BadRequest,
                        "Một hoặc nhiều dịch vụ không tồn tại, không hoạt động hoặc không được hỗ trợ.");
                }

                var servicesById = services.ToDictionary(service => service.MaDichVu);
                foreach (var passenger in passengerRequests)
                {
                    var selectedTypes = passenger.MaDichVus
                        .Select(serviceId => servicesById[serviceId].LoaiDichVu)
                        .ToList();

                    if (selectedTypes.Count(type => type == "Baggage") > 1 ||
                        selectedTypes.Count(type => type == "Protection") > 1)
                    {
                        return await RollbackFailureAsync(
                            CheckoutValidationOutcome.BadRequest,
                            "Mỗi hành khách chỉ được chọn tối đa một dịch vụ Baggage và một dịch vụ Protection.");
                    }
                }

                var bookingCode = await GenerateUniqueBookingCodeAsync(cancellationToken);
                if (bookingCode is null)
                {
                    return await RollbackFailureAsync(
                        CheckoutValidationOutcome.Conflict,
                        "Không thể tạo mã đặt chỗ duy nhất. Vui lòng thử lại.");
                }

                var seatsById = seats.ToDictionary(seat => seat.MaGheChuyenBay);
                var passengerPricing = passengerRequests
                    .Select((passenger, index) =>
                    {
                        var seat = seatsById[passenger.MaGheChuyenBay];
                        var selectedServices = passenger.MaDichVus
                            .Select(serviceId => servicesById[serviceId])
                            .Select(service => new CheckoutServicePricingDto(
                                service.MaDichVu,
                                service.TenDichVu,
                                service.LoaiDichVu,
                                service.KhoiLuongKg,
                                service.Gia))
                            .ToList();
                        var passengerServiceTotal = selectedServices.Sum(service => service.Gia);

                        return new CheckoutPassengerPricingDto(
                            index + 1,
                            passenger.MaGheChuyenBay,
                            seat.GiaGhe,
                            selectedServices,
                            passengerServiceTotal,
                            seat.GiaGhe + passengerServiceTotal);
                    })
                    .ToList();

                var seatTotal = seats.Sum(seat => seat.GiaGhe);
                var serviceTotal = passengerPricing.Sum(passenger => passenger.TongTienDichVu);
                var total = seatTotal + serviceTotal;

                var pricing = new CheckoutPricingResponse(
                    true,
                    "Dữ liệu checkout hợp lệ.",
                    flight.MaChuyenBay,
                    passengerRequests.Count,
                    passengerPricing,
                    seatTotal,
                    serviceTotal,
                    total,
                    serverTime);

                var booking = new PhieuDatCho
                {
                    MaDatCho = bookingCode,
                    MaTaiKhoan = accountId,
                    HoTenLienHe = request.ThongTinLienHe.HoTenLienHe.Trim(),
                    EmailLienHe = request.ThongTinLienHe.Email.Trim(),
                    SoDienThoaiLienHe = request.ThongTinLienHe.SoDienThoai.Trim(),
                    LoaiChuyenDi = request.LoaiChuyenDi,
                    SoLuongHanhKhach = passengerRequests.Count,
                    NgayDat = now,
                    GiuDenLuc = paymentDeadline,
                    TongTien = total,
                    TrangThai = "PaymentPending",
                    NgayTao = now,
                    NgayCapNhat = now
                };

                var bookingLeg = new ChangDatCho
                {
                    PhieuDatCho = booking,
                    MaChuyenBay = request.MaChuyenBay,
                    LoaiChang = "Outbound",
                    ThuTuChang = 1
                };
                booking.ChangDatChos.Add(bookingLeg);

                foreach (var passengerRequest in passengerRequests)
                {
                    var passenger = new HanhKhach
                    {
                        PhieuDatCho = booking,
                        HoTen = passengerRequest.HoTen.Trim(),
                        NgaySinh = ConvertDateOnly(passengerRequest.NgaySinh!.Value),
                        GioiTinh = passengerRequest.GioiTinh,
                        QuocTich = passengerRequest.QuocTich.Trim(),
                        LoaiGiayTo = passengerRequest.LoaiGiayTo,
                        SoGiayTo = passengerRequest.SoGiayTo.Trim(),
                        NgayHetHanGiayTo = ConvertNullableDateOnly(passengerRequest.NgayHetHanGiayTo),
                        LoaiHanhKhach = passengerRequest.LoaiHanhKhach
                    };
                    booking.HanhKhachs.Add(passenger);

                    var selectedSeat = seatsById[passengerRequest.MaGheChuyenBay];
                    var pendingTicket = new Ve
                    {
                        PhieuDatCho = booking,
                        ChangDatCho = bookingLeg,
                        HanhKhach = passenger,
                        GheChuyenBay = selectedSeat,
                        SoVeDienTu = null,
                        GiaVe = selectedSeat.GiaGhe,
                        TrangThaiVe = "PaymentPending",
                        NgayXuatVe = null,
                        NgayTao = now
                    };
                    booking.Ves.Add(pendingTicket);

                    foreach (var serviceId in passengerRequest.MaDichVus)
                    {
                        var selectedService = servicesById[serviceId];
                        booking.ChiTietDichVus.Add(new ChiTietDichVu
                        {
                            PhieuDatCho = booking,
                            HanhKhach = passenger,
                            MaVe = null,
                            MaDichVu = selectedService.MaDichVu,
                            SoLuong = 1,
                            Gia = selectedService.Gia
                        });
                    }

                    selectedSeat.PhieuDatChoDangGiu = booking;
                    selectedSeat.GiuDenLuc = paymentDeadline;
                    selectedSeat.UpdatedAt = now;
                    selectedSeat.PhienBan++;
                }

                _db.PhieuDatChos.Add(booking);
                await _db.SaveChangesAsync(cancellationToken);

                var response = new CheckoutCreatedResponse(
                    true,
                    "Đã tạo booking chờ thanh toán.",
                    booking.MaPhieuDatCho,
                    booking.MaDatCho,
                    booking.TrangThai,
                    paymentDeadlineOffset,
                    pricing,
                    serverTime);

                await transaction.CommitAsync(cancellationToken);
                return CheckoutCreationResult.Success(response);
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();
                return CheckoutCreationResult.Failure(
                    CheckoutValidationOutcome.Conflict,
                    "Checkout xung đột với dữ liệu hiện tại. Vui lòng thử lại.");
            }
            catch (SqliteException exception) when (IsExpectedSqliteConflict(exception))
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();
                return CheckoutCreationResult.Failure(
                    CheckoutValidationOutcome.Conflict,
                    "Checkout xung đột với dữ liệu hiện tại. Vui lòng thử lại.");
            }
        }
        catch (SqliteException exception) when (IsExpectedSqliteConflict(exception))
        {
            _db.ChangeTracker.Clear();
            return CheckoutCreationResult.Failure(
                CheckoutValidationOutcome.Conflict,
                "Hệ thống đang xử lý một checkout khác. Vui lòng thử lại.");
        }
    }

    private async Task<string?> GenerateUniqueBookingCodeAsync(
        CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < BookingCodeAttempts; attempt++)
        {
            var candidate = Convert.ToHexString(RandomNumberGenerator.GetBytes(6));
            var exists = await _db.PhieuDatChos
                .AsNoTracking()
                .AnyAsync(booking => booking.MaDatCho == candidate, cancellationToken);

            if (!exists)
            {
                return candidate;
            }
        }

        return null;
    }

    private static DateTime ConvertDateOnly(DateOnly value) =>
        value.ToDateTime(TimeOnly.MinValue);

    private static DateTime? ConvertNullableDateOnly(DateOnly? value) =>
        value.HasValue ? ConvertDateOnly(value.Value) : null;

    private static bool IsExpectedSqliteConflict(SqliteException exception) =>
        exception.SqliteErrorCode is 5 or 6 or 19;
}
