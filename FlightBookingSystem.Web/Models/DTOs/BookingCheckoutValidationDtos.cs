namespace FlightBookingSystem.Web.Models.DTOs;

public enum CheckoutValidationOutcome
{
    Valid,
    BadRequest,
    Unauthorized,
    NotFound,
    Conflict
}

public sealed record CheckoutValidationResult(
    CheckoutValidationOutcome Outcome,
    string Message,
    int MaChuyenBay = 0,
    int SoLuongHanhKhach = 0,
    DateTimeOffset? ServerTime = null)
{
    public bool IsValid => Outcome == CheckoutValidationOutcome.Valid;

    public static CheckoutValidationResult Success(
        int maChuyenBay,
        int soLuongHanhKhach,
        DateTimeOffset serverTime) =>
        new(
            CheckoutValidationOutcome.Valid,
            "Dữ liệu checkout hợp lệ.",
            maChuyenBay,
            soLuongHanhKhach,
            serverTime);

    public static CheckoutValidationResult Failure(
        CheckoutValidationOutcome outcome,
        string message) => new(outcome, message);
}
