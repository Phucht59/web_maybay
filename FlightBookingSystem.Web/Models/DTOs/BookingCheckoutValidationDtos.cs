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
    CheckoutPricingResponse? Pricing = null)
{
    public bool IsValid => Outcome == CheckoutValidationOutcome.Valid;

    public static CheckoutValidationResult Success(CheckoutPricingResponse pricing) =>
        new(
            CheckoutValidationOutcome.Valid,
            "Dữ liệu checkout hợp lệ.",
            pricing);

    public static CheckoutValidationResult Failure(
        CheckoutValidationOutcome outcome,
        string message) => new(outcome, message);
}
