namespace FlightBookingSystem.Web.Models.DTOs;

public sealed class CreatePaymentRequest
{
    public int BookingId { get; set; }
    public string? Method { get; set; }
    public string? IdempotencyKey { get; set; }
}

public sealed record PaymentResponse(
    int PaymentId,
    int BookingId,
    string Status,
    decimal Amount,
    string Method,
    string Provider,
    DateTimeOffset CreatedAt,
    DateTimeOffset ServerTime);

public sealed record PaymentStatusResponse(
    int PaymentId,
    int BookingId,
    string Status,
    decimal Amount,
    string Method,
    string Provider,
    DateTimeOffset CreatedAt,
    DateTimeOffset? PaidAt,
    string? FailureReason,
    string SimulationState,
    int ProcessingDurationSeconds,
    DateTimeOffset ProcessingDueAt,
    DateTimeOffset GraceExpiresAt,
    DateTimeOffset ServerTime);

public sealed record PaymentErrorResponse(
    string Code,
    string Message,
    DateTimeOffset ServerTime);
