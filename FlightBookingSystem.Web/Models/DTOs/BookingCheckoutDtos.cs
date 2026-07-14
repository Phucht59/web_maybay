using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs;

public class CheckoutRequest : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Mã chuyến bay phải lớn hơn 0.")]
    public int MaChuyenBay { get; set; }

    [Required(ErrorMessage = "Phiên giữ ghế là bắt buộc.")]
    [MaxLength(80, ErrorMessage = "Phiên giữ ghế tối đa 80 ký tự.")]
    public string SessionId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Loại chuyến đi là bắt buộc.")]
    [RegularExpression("^OneWay$", ErrorMessage = "Giai đoạn hiện tại chỉ hỗ trợ chuyến một chiều (OneWay).")]
    public string LoaiChuyenDi { get; set; } = string.Empty;

    [Required(ErrorMessage = "Thông tin liên hệ là bắt buộc.")]
    public CheckoutContactRequest ThongTinLienHe { get; set; } = null!;

    [Required(ErrorMessage = "Danh sách hành khách là bắt buộc.")]
    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 hành khách.")]
    [MaxLength(9, ErrorMessage = "Chỉ được có tối đa 9 hành khách.")]
    public List<CheckoutPassengerRequest> HanhKhachs { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (HanhKhachs is null)
        {
            yield break;
        }

        if (HanhKhachs.Any(passenger => passenger is null))
        {
            yield return new ValidationResult(
                "Danh sách hành khách không được chứa phần tử rỗng.",
                [nameof(HanhKhachs)]);
        }

        var duplicateSeatIds = HanhKhachs
            .Where(passenger => passenger is not null && passenger.MaGheChuyenBay > 0)
            .GroupBy(passenger => passenger.MaGheChuyenBay)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateSeatIds.Count > 0)
        {
            yield return new ValidationResult(
                $"Mỗi ghế chỉ được gắn với một hành khách. Mã ghế bị trùng: {string.Join(", ", duplicateSeatIds)}.",
                [nameof(HanhKhachs)]);
        }
    }
}

public class CheckoutPassengerRequest : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Mã ghế chuyến bay phải lớn hơn 0.")]
    public int MaGheChuyenBay { get; set; }

    [Required(ErrorMessage = "Họ tên hành khách là bắt buộc.")]
    [MaxLength(160, ErrorMessage = "Họ tên hành khách tối đa 160 ký tự.")]
    public string HoTen { get; set; } = string.Empty;

    [Required(ErrorMessage = "Ngày sinh là bắt buộc.")]
    public DateOnly? NgaySinh { get; set; }

    [Required(ErrorMessage = "Giới tính là bắt buộc.")]
    [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Giới tính phải là Male, Female hoặc Other.")]
    public string GioiTinh { get; set; } = string.Empty;

    [Required(ErrorMessage = "Quốc tịch là bắt buộc.")]
    [MaxLength(120, ErrorMessage = "Quốc tịch tối đa 120 ký tự.")]
    public string QuocTich { get; set; } = string.Empty;

    [Required(ErrorMessage = "Loại giấy tờ là bắt buộc.")]
    [RegularExpression("^(CCCD|Passport|BirthCertificate)$", ErrorMessage = "Loại giấy tờ phải là CCCD, Passport hoặc BirthCertificate.")]
    public string LoaiGiayTo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số giấy tờ là bắt buộc.")]
    [MaxLength(40, ErrorMessage = "Số giấy tờ tối đa 40 ký tự.")]
    public string SoGiayTo { get; set; } = string.Empty;

    public DateOnly? NgayHetHanGiayTo { get; set; }

    [Required(ErrorMessage = "Loại hành khách là bắt buộc.")]
    [RegularExpression("^(Adult|Child|Infant)$", ErrorMessage = "Loại hành khách phải là Adult, Child hoặc Infant.")]
    public string LoaiHanhKhach { get; set; } = string.Empty;

    [Required(ErrorMessage = "Danh sách dịch vụ là bắt buộc.")]
    public List<int> MaDichVus { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (NgaySinh.HasValue && NgaySinh.Value > DateOnly.FromDateTime(DateTime.Today))
        {
            yield return new ValidationResult(
                "Ngày sinh không được nằm trong tương lai.",
                [nameof(NgaySinh)]);
        }

        if (string.Equals(LoaiGiayTo, "Passport", StringComparison.Ordinal) && !NgayHetHanGiayTo.HasValue)
        {
            yield return new ValidationResult(
                "Ngày hết hạn giấy tờ là bắt buộc khi loại giấy tờ là Passport.",
                [nameof(NgayHetHanGiayTo)]);
        }

        if (MaDichVus is null)
        {
            yield break;
        }

        if (MaDichVus.Count > 2)
        {
            yield return new ValidationResult(
                "Mỗi hành khách chỉ được chọn tối đa 2 dịch vụ.",
                [nameof(MaDichVus)]);
        }

        if (MaDichVus.Any(serviceId => serviceId <= 0))
        {
            yield return new ValidationResult(
                "Mã dịch vụ phải lớn hơn 0.",
                [nameof(MaDichVus)]);
        }

        if (MaDichVus.Distinct().Count() != MaDichVus.Count)
        {
            yield return new ValidationResult(
                "Không được chọn trùng dịch vụ cho cùng một hành khách.",
                [nameof(MaDichVus)]);
        }
    }
}

public class CheckoutContactRequest : IValidatableObject
{
    [Required(ErrorMessage = "Họ tên liên hệ là bắt buộc.")]
    [MaxLength(160, ErrorMessage = "Họ tên liên hệ tối đa 160 ký tự.")]
    public string HoTenLienHe { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email liên hệ là bắt buộc.")]
    [EmailAddress(ErrorMessage = "Email liên hệ không đúng định dạng.")]
    [MaxLength(254, ErrorMessage = "Email liên hệ tối đa 254 ký tự.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại liên hệ là bắt buộc.")]
    [RegularExpression(@"^[0-9\s+\-()]+$", ErrorMessage = "Số điện thoại chỉ được chứa chữ số, khoảng trắng và các ký tự +, -, (, ).")]
    public string SoDienThoai { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(SoDienThoai))
        {
            yield break;
        }

        var digitCount = SoDienThoai.Count(character => character is >= '0' and <= '9');
        if (digitCount is < 8 or > 15)
        {
            yield return new ValidationResult(
                "Số điện thoại phải có từ 8 đến 15 chữ số sau khi bỏ ký tự định dạng.",
                [nameof(SoDienThoai)]);
        }
    }
}
