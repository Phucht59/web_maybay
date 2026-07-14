namespace FlightBookingSystem.Web.Models.DTOs;

public sealed record CheckoutCreatedResponse(
    bool IsCreated,
    string Message,
    int MaPhieuDatCho,
    string MaDatCho,
    string TrangThai,
    CheckoutPricingResponse Pricing,
    DateTimeOffset ServerTime);

public sealed record CheckoutCreationResult(
    CheckoutValidationOutcome Outcome,
    string Message,
    CheckoutCreatedResponse? Response = null)
{
    public bool IsCreated =>
        Outcome == CheckoutValidationOutcome.Valid &&
        Response is not null;

    public static CheckoutCreationResult Success(CheckoutCreatedResponse response) =>
        new(CheckoutValidationOutcome.Valid, response.Message, response);

    public static CheckoutCreationResult Failure(
        CheckoutValidationOutcome outcome,
        string message) => new(outcome, message);
}
