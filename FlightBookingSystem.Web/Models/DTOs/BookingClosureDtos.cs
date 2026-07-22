namespace FlightBookingSystem.Web.Models.DTOs;

public sealed record BookingCancellationResponse(
    int BookingId,
    string BookingStatus,
    int CancelledPendingPaymentCount,
    string Reason,
    DateTimeOffset ServerTime);

public sealed record BookingClosureErrorResponse(
    string Code,
    string Message,
    DateTimeOffset ServerTime);
