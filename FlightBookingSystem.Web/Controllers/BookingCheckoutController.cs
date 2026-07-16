using System.Security.Claims;
using FlightBookingSystem.Web.Models.DTOs;
using FlightBookingSystem.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBookingSystem.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/booking")]
public class BookingCheckoutController : ControllerBase
{
    private readonly CheckoutCreationService _creationService;
    private readonly CheckoutSummaryService _summaryService;
    private readonly BookingPaymentClosureService _closureService;

    public BookingCheckoutController(
        CheckoutCreationService creationService,
        CheckoutSummaryService summaryService,
        BookingPaymentClosureService closureService)
    {
        _creationService = creationService;
        _summaryService = summaryService;
        _closureService = closureService;
    }

    [HttpPost("{bookingId:int}/cancel")]
    [ProducesResponseType<BookingCancellationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<BookingClosureErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<BookingClosureErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<BookingClosureErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<BookingClosureErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CancelBooking(
        int bookingId,
        CancellationToken cancellationToken)
    {
        var accountIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(accountIdClaim, out var accountId) || accountId <= 0)
        {
            return Unauthorized(ClosureError(
                "Unauthorized",
                "Thông tin tài khoản trong token không hợp lệ."));
        }

        if (bookingId <= 0)
        {
            return NotFound(ClosureError(
                "BookingNotFound",
                "Không tìm thấy booking."));
        }

        var now = DateTime.UtcNow;
        var result = await _closureService.CancelByUserAsync(
            bookingId,
            accountId,
            User.IsInRole("Admin"),
            now,
            cancellationToken);

        if (result.State is BookingPaymentClosureState.Cancelled or
            BookingPaymentClosureState.AlreadyCancelled)
        {
            return Ok(new BookingCancellationResponse(
                bookingId,
                "Cancelled",
                result.CancelledPendingPaymentCount,
                BookingPaymentClosureService.UserCancellationReason,
                new DateTimeOffset(now, TimeSpan.Zero)));
        }

        return result.State switch
        {
            BookingPaymentClosureState.NotFound => NotFound(ClosureError(
                "BookingNotFound",
                "Không tìm thấy booking.")),
            BookingPaymentClosureState.BookingAlreadyExpired => Conflict(ClosureError(
                "BookingAlreadyExpired",
                "Booking đã hết hạn.")),
            BookingPaymentClosureState.BookingAlreadyConfirmed => Conflict(ClosureError(
                "BookingAlreadyConfirmed",
                "Booking đã được xác nhận.")),
            BookingPaymentClosureState.PaymentAlreadySucceeded or
                BookingPaymentClosureState.AlreadySucceeded => Conflict(ClosureError(
                    "PaymentAlreadySucceeded",
                    "Booking đã được thanh toán thành công.")),
            BookingPaymentClosureState.Conflict or
                BookingPaymentClosureState.NotApplicable => Conflict(ClosureError(
                    "BookingCancellationConflict",
                    "Booking không thể được hủy ở trạng thái hiện tại.")),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ClosureError(
                    "BookingCancellationFailed",
                    "Không thể hủy booking."))
        };
    }

    [HttpPost("checkout")]
    [ProducesResponseType<CheckoutCreatedResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCheckout(
        [FromBody] CheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var accountIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(accountIdClaim, out var accountId) || accountId <= 0)
        {
            return Unauthorized(new { message = "Thông tin tài khoản trong token không hợp lệ." });
        }

        var result = await _creationService.CreateAsync(accountId, request, cancellationToken);

        if (result.IsCreated && result.Response is not null)
        {
            return StatusCode(StatusCodes.Status201Created, result.Response);
        }

        var error = new { result.Message };
        return result.Outcome switch
        {
            CheckoutValidationOutcome.BadRequest => BadRequest(error),
            CheckoutValidationOutcome.Unauthorized => Unauthorized(error),
            CheckoutValidationOutcome.NotFound => NotFound(error),
            CheckoutValidationOutcome.Conflict => Conflict(error),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new { message = "Không thể tạo checkout." })
        };
    }

    [HttpGet("{bookingId:int}/checkout")]
    [ProducesResponseType<CheckoutSummaryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetCheckoutSummary(
        int bookingId,
        CancellationToken cancellationToken)
    {
        if (bookingId <= 0)
        {
            return BadRequest(new { message = "Mã booking phải lớn hơn 0." });
        }

        var accountIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(accountIdClaim, out var accountId) || accountId <= 0)
        {
            return Unauthorized(new { message = "Thông tin tài khoản trong token không hợp lệ." });
        }

        var result = await _summaryService.GetAsync(
            accountId,
            User.IsInRole("Admin"),
            bookingId,
            cancellationToken);

        if (result.IsSuccess)
        {
            return Ok(result.Response);
        }

        var error = new { result.Message };
        return result.Outcome switch
        {
            CheckoutSummaryOutcome.BadRequest => BadRequest(error),
            CheckoutSummaryOutcome.Forbidden => StatusCode(StatusCodes.Status403Forbidden, error),
            CheckoutSummaryOutcome.NotFound => NotFound(error),
            CheckoutSummaryOutcome.Conflict => Conflict(error),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new { message = "Không thể lấy checkout summary." })
        };
    }

    private static BookingClosureErrorResponse ClosureError(
        string code,
        string message) =>
        new(code, message, DateTimeOffset.UtcNow);
}
