using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Services;

public sealed class CheckoutValidationService
{
    private static readonly HashSet<string> BookableFlightStatuses =
        new(StringComparer.Ordinal) { "Scheduled", "Delayed" };

    private static readonly HashSet<string> SupportedServiceTypes =
        new(StringComparer.Ordinal) { "Baggage", "Protection" };

    private readonly ApplicationDbContext _db;

    public CheckoutValidationService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<CheckoutValidationResult> ValidateAsync(
        int accountId,
        CheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var accountIsActive = await _db.TaiKhoans
            .AsNoTracking()
            .AnyAsync(
                account => account.MaTaiKhoan == accountId && account.TrangThai == "Active",
                cancellationToken);

        if (!accountIsActive)
        {
            return CheckoutValidationResult.Failure(
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
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.NotFound,
                "Không tìm thấy chuyến bay.");
        }

        if (!BookableFlightStatuses.Contains(flight.TrangThai))
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.Conflict,
                "Chuyến bay không còn cho phép đặt chỗ.");
        }

        if (flight.GioKhoiHanh <= now)
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.Conflict,
                "Chuyến bay đã khởi hành hoặc không còn thời gian để đặt chỗ.");
        }

        if (request.HanhKhachs is null || request.HanhKhachs.Count is < 1 or > 9 ||
            request.HanhKhachs.Any(passenger => passenger is null))
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.BadRequest,
                "Danh sách hành khách phải có từ 1 đến 9 người và không được chứa phần tử rỗng.");
        }

        var seatIds = request.HanhKhachs
            .Select(passenger => passenger.MaGheChuyenBay)
            .ToList();

        if (seatIds.Count != request.HanhKhachs.Count ||
            seatIds.Any(seatId => seatId <= 0) ||
            seatIds.Distinct().Count() != seatIds.Count)
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.BadRequest,
                "Mỗi hành khách phải có một ghế hợp lệ và các ghế không được trùng nhau.");
        }

        var seats = await _db.GheChuyenBays
            .AsNoTracking()
            .Where(seat => seatIds.Contains(seat.MaGheChuyenBay))
            .Select(seat => new
            {
                seat.MaGheChuyenBay,
                seat.MaChuyenBay,
                seat.TrangThaiGhe,
                seat.GiuBoiTaiKhoanId,
                seat.SessionId,
                seat.GiuDenLuc,
                seat.MaPhieuDatChoDangGiu,
                seat.GiaGhe
            })
            .ToListAsync(cancellationToken);

        if (seats.Count != seatIds.Count)
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.BadRequest,
                "Một hoặc nhiều ghế không tồn tại.");
        }

        if (seats.Any(seat => seat.MaChuyenBay != request.MaChuyenBay))
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.BadRequest,
                "Một hoặc nhiều ghế không thuộc chuyến bay đã chọn.");
        }

        var holdIsInvalid = seats.Any(seat =>
            !string.Equals(seat.TrangThaiGhe, "Held", StringComparison.Ordinal) ||
            seat.GiuBoiTaiKhoanId != accountId ||
            !string.Equals(seat.SessionId, request.SessionId, StringComparison.Ordinal) ||
            seat.GiuDenLuc is null ||
            seat.GiuDenLuc <= now ||
            seat.MaPhieuDatChoDangGiu is not null);

        if (holdIsInvalid)
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.Conflict,
                "Một hoặc nhiều ghế không còn thuộc phiên giữ chỗ hiện tại. Vui lòng chọn lại ghế.");
        }

        var departureDate = DateOnly.FromDateTime(flight.GioKhoiHanh);
        if (request.HanhKhachs.Any(passenger =>
                string.Equals(passenger.LoaiGiayTo, "Passport", StringComparison.Ordinal) &&
                (!passenger.NgayHetHanGiayTo.HasValue ||
                 passenger.NgayHetHanGiayTo.Value < departureDate)))
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.BadRequest,
                "Hộ chiếu phải còn hạn đến ngày khởi hành.");
        }

        foreach (var passenger in request.HanhKhachs)
        {
            if (passenger.MaDichVus is null || passenger.MaDichVus.Count > 2 ||
                passenger.MaDichVus.Any(serviceId => serviceId <= 0) ||
                passenger.MaDichVus.Distinct().Count() != passenger.MaDichVus.Count)
            {
                return CheckoutValidationResult.Failure(
                    CheckoutValidationOutcome.BadRequest,
                    "Danh sách dịch vụ của hành khách không hợp lệ.");
            }
        }

        var serviceIds = request.HanhKhachs
            .SelectMany(passenger => passenger.MaDichVus)
            .Distinct()
            .ToList();

        var servicesById = new Dictionary<int, CheckoutServicePricingDto>();

        if (serviceIds.Count > 0)
        {
            var services = await _db.DichVuThems
                .AsNoTracking()
                .Where(service => serviceIds.Contains(service.MaDichVu))
                .Select(service => new
                {
                    service.MaDichVu,
                    service.TenDichVu,
                    service.LoaiDichVu,
                    service.KhoiLuongKg,
                    service.Gia,
                    service.TrangThai
                })
                .ToListAsync(cancellationToken);

            if (services.Count != serviceIds.Count)
            {
                return CheckoutValidationResult.Failure(
                    CheckoutValidationOutcome.BadRequest,
                    "Một hoặc nhiều dịch vụ không tồn tại.");
            }

            if (services.Any(service =>
                    !string.Equals(service.TrangThai, "Active", StringComparison.Ordinal) ||
                    !SupportedServiceTypes.Contains(service.LoaiDichVu)))
            {
                return CheckoutValidationResult.Failure(
                    CheckoutValidationOutcome.BadRequest,
                    "Một hoặc nhiều dịch vụ không còn hoạt động hoặc không được hỗ trợ.");
            }

            var serviceTypesById = services.ToDictionary(
                service => service.MaDichVu,
                service => service.LoaiDichVu);

            foreach (var passenger in request.HanhKhachs)
            {
                var selectedTypes = passenger.MaDichVus
                    .Select(serviceId => serviceTypesById[serviceId])
                    .ToList();

                if (selectedTypes.Count(type => type == "Baggage") > 1 ||
                    selectedTypes.Count(type => type == "Protection") > 1)
                {
                    return CheckoutValidationResult.Failure(
                        CheckoutValidationOutcome.BadRequest,
                        "Mỗi hành khách chỉ được chọn tối đa một dịch vụ Baggage và một dịch vụ Protection.");
                }
            }

            if (services.Any(service => service.Gia < 0))
            {
                return CheckoutValidationResult.Failure(
                    CheckoutValidationOutcome.Conflict,
                    "Không thể xác định giá checkout tại thời điểm hiện tại.");
            }

            servicesById = services.ToDictionary(
                service => service.MaDichVu,
                service => new CheckoutServicePricingDto(
                    service.MaDichVu,
                    service.TenDichVu,
                    service.LoaiDichVu,
                    service.KhoiLuongKg,
                    service.Gia));
        }

        if (seats.Any(seat => seat.GiaGhe < 0))
        {
            return CheckoutValidationResult.Failure(
                CheckoutValidationOutcome.Conflict,
                "Không thể xác định giá checkout tại thời điểm hiện tại.");
        }

        var seatsById = seats.ToDictionary(seat => seat.MaGheChuyenBay);
        var passengerPricing = request.HanhKhachs
            .Select((passenger, index) =>
            {
                var seat = seatsById[passenger.MaGheChuyenBay];
                var selectedServices = passenger.MaDichVus
                    .Select(serviceId => servicesById[serviceId])
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
        var pricing = new CheckoutPricingResponse(
            true,
            "Dữ liệu checkout hợp lệ.",
            flight.MaChuyenBay,
            request.HanhKhachs.Count,
            passengerPricing,
            seatTotal,
            serviceTotal,
            seatTotal + serviceTotal,
            new DateTimeOffset(DateTime.SpecifyKind(now, DateTimeKind.Utc)));

        // Task 2.5 must re-check every seat invariant inside the booking transaction.
        return CheckoutValidationResult.Success(pricing);
    }
}
