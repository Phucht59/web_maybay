using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// CORS cho frontend React
// React Vite thường chạy ở http://localhost:5173
// Nếu sau này frontend chạy port khác thì thêm vào WithOrigins(...)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "http://localhost:3000",
                "https://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Swagger để test API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FlightBookingSystem API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token theo dạng: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite(connectionString);

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging()
            .LogTo(Console.WriteLine, LogLevel.Information);
    }
});
builder.Services.AddScoped<CheckoutValidationService>();
builder.Services.AddScoped<CheckoutCreationService>();
builder.Services.AddScoped<CheckoutSummaryService>();

// Authentication JWT Bearer
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Chưa cấu hình Jwt:Key. Hãy chạy: dotnet user-secrets set \"Jwt:Key\" \"...\"");

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (args.Contains("--sync-reference-data"))
{
    try
    {
        var result = await ReferenceDataSeeder.SyncAdditionalServicesAsync(app.Services);
        Console.WriteLine(
            $"Reference data synchronized successfully. Inserted={result.Inserted}, Updated={result.Updated}, Unchanged={result.Unchanged}, DuplicatesDeactivated={result.DuplicatesDeactivated}, Database={result.DatabasePath}. Exiting.");
    }
    catch (Exception exception)
    {
        Console.Error.WriteLine($"Reference data synchronization failed: {exception.Message}");
        Environment.ExitCode = 1;
    }

    return;
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseStaticFiles();

// CORS phải đặt trước Authentication/Authorization
app.UseCors("ReactClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();



if (args.Contains("--seed"))
{
    await DatabaseSeeder.SeedAsync(app.Services);
    Console.WriteLine("Data seeded successfully. Exiting.");
    return;
}

app.Run();
