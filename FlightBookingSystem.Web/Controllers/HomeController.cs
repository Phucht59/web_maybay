using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightBookingSystem.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class HomeController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public HomeController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet]
    public IActionResult GetApiInfo()
    {
        return Ok(new
        {
            application = "Flight Booking System API",
            status = "Running",
            environment = _environment.EnvironmentName,
            serverTime = DateTime.Now,
            documentation = "/swagger"
        });
    }

    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new
        {
            status = "Healthy",
            checkedAt = DateTime.Now
        });
    }

    [HttpGet("~/")]
    public IActionResult Root()
    {
        return Ok(new
        {
            application = "Flight Booking System API",
            message = "API đang hoạt động. Mở /swagger để test các endpoint.",
            documentation = "/swagger"
        });
    }
}
