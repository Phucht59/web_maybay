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

    public BookingCheckoutController(
        CheckoutCreationService creationService,
        CheckoutSummaryService summaryService)
    {
        _creationService = creationService;
        _summaryService = summaryService;
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
}
