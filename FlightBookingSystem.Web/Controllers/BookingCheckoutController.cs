using FlightBookingSystem.Web.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBookingSystem.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/booking")]
public class BookingCheckoutController : ControllerBase
{
    [HttpPost("checkout")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateCheckout([FromBody] CheckoutRequest request)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            message = "Contract checkout đã sẵn sàng. Logic xác thực và tạo booking sẽ được thực hiện trong Task 2.3."
        });
    }
}
