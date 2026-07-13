using FlightBookingSystem.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Data;

public static class DatabaseSeeder
{
    private const string Economy = "Economy";
    private const string Business = "Business";
    private const string First = "First Class";

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        logger.LogInformation("Clearing seeded data and applying the current schema.");
        await db.Database.MigrateAsync();
        await ClearDatabaseAsync(db);
        await DbInitializer.SeedAdminAsync(services);

        db.ChangeTracker.AutoDetectChangesEnabled = false;
        var rng = new Random(20260713);

        var airlines = new List<HangBay>
        {
            new() { TenHangBay = "Vietnam Airlines", MaCode = "VN", QuocGia = "Vietnam" },
            new() { TenHangBay = "VietJet Air", MaCode = "VJ", QuocGia = "Vietnam" },
        };
        db.HangBays.AddRange(airlines);

        var economy = new HangGhe { TenHangGhe = Economy, HeSoGia = 1.00m, MoTa = "Hạng phổ thông" };
        var business = new HangGhe { TenHangGhe = Business, HeSoGia = 1.85m, MoTa = "Hạng thương gia" };
        var first = new HangGhe { TenHangGhe = First, HeSoGia = 3.20m, MoTa = "Hạng nhất" };
        db.HangGhes.AddRange(economy, business, first);
        await db.SaveChangesAsync();

        var airports = new List<SanBay>
        {
            Airport("SGN", "Tân Sơn Nhất", "Hồ Chí Minh"),
            Airport("HAN", "Nội Bài", "Hà Nội"),
            Airport("DAD", "Đà Nẵng", "Đà Nẵng"),
            Airport("CXR", "Cam Ranh", "Nha Trang"),
            Airport("PQC", "Phú Quốc", "Phú Quốc"),
            Airport("VCA", "Cần Thơ", "Cần Thơ"),
            Airport("HPH", "Cát Bi", "Hải Phòng"),
            Airport("VII", "Vinh", "Vinh"),
            Airport("UIH", "Phù Cát", "Quy Nhơn"),
            Airport("THD", "Thọ Xuân", "Thanh Hóa"),
            Airport("VDO", "Vân Đồn", "Quảng Ninh"),
            Airport("DLI", "Liên Khương", "Đà Lạt"),
            Airport("HUI", "Phú Bài", "Huế"),
            Airport("BMV", "Buôn Ma Thuột", "Buôn Ma Thuột"),
            Airport("PXU", "Pleiku", "Pleiku"),
            Airport("TBB", "Tuy Hòa", "Phú Yên"),
            Airport("VDH", "Đồng Hới", "Quảng Bình"),
            Airport("VCL", "Chu Lai", "Quảng Nam"),
            Airport("VKG", "Rạch Giá", "Kiên Giang"),
            Airport("VCS", "Côn Đảo", "Bà Rịa - Vũng Tàu"),
        };
        db.SanBays.AddRange(airports);
        await db.SaveChangesAsync();

        // Five aircraft types. Each cabin is generated from its own real seat pattern.
        var aircraft = new List<MayBay>
        {
            new() { MaHangBay = airlines[1].MaHangBay, DongMayBay = "Airbus A320-200", SoHieuDangKy = "VJ-A201", TongSoGhe = 170, TrangThai = "Active" },
            new() { MaHangBay = airlines[1].MaHangBay, DongMayBay = "Airbus A321neo", SoHieuDangKy = "VJ-A321", TongSoGhe = 196, TrangThai = "Active" },
            new() { MaHangBay = airlines[0].MaHangBay, DongMayBay = "ATR 72-500", SoHieuDangKy = "VN-AT72", TongSoGhe = 72, TrangThai = "Active" },
            new() { MaHangBay = airlines[0].MaHangBay, DongMayBay = "Boeing 787-9 Dreamliner", SoHieuDangKy = "VN-B789", TongSoGhe = 260, TrangThai = "Active" },
            new() { MaHangBay = airlines[0].MaHangBay, DongMayBay = "Airbus A350-900", SoHieuDangKy = "VN-A359", TongSoGhe = 276, TrangThai = "Active" },
        };
        db.MayBays.AddRange(aircraft);
        await db.SaveChangesAsync();

        var seats = new List<GheMayBay>();
        // A320: 5 Business rows x 4 seats, 25 Economy rows x 6 seats = 170.
        seats.AddRange(GenerateSeats(aircraft[0].MaMayBay, business.MaHangGhe, 1, 5, "ACDF"));
        seats.AddRange(GenerateSeats(aircraft[0].MaMayBay, economy.MaHangGhe, 6, 25, "ABCDEF"));
        // A321neo: 4 Business rows x 4 seats, 30 Economy rows x 6 seats = 196.
        seats.AddRange(GenerateSeats(aircraft[1].MaMayBay, business.MaHangGhe, 1, 4, "ACDF"));
        seats.AddRange(GenerateSeats(aircraft[1].MaMayBay, economy.MaHangGhe, 5, 30, "ABCDEF"));
        // ATR 72: regional 2-2 Economy, 18 rows = 72.
        seats.AddRange(GenerateSeats(aircraft[2].MaMayBay, economy.MaHangGhe, 1, 18, "ACDF"));
        // B787-9: 8 Business rows x 4 seats, 38 Economy rows x 6 seats = 260.
        seats.AddRange(GenerateSeats(aircraft[3].MaMayBay, business.MaHangGhe, 1, 8, "ACDF"));
        seats.AddRange(GenerateSeats(aircraft[3].MaMayBay, economy.MaHangGhe, 9, 38, "ABCDEF"));
        // A350-900: First 2x2, Business 8x4, Economy 40x6 = 276.
        seats.AddRange(GenerateSeats(aircraft[4].MaMayBay, first.MaHangGhe, 1, 2, "AF"));
        seats.AddRange(GenerateSeats(aircraft[4].MaMayBay, business.MaHangGhe, 3, 8, "ACDF"));
        seats.AddRange(GenerateSeats(aircraft[4].MaMayBay, economy.MaHangGhe, 11, 40, "ABCDEF"));
        db.GheMayBays.AddRange(seats);
        await db.SaveChangesAsync();

        ValidateSeatCapacities(aircraft, seats);

        var airportByCode = airports.ToDictionary(airport => airport.MaSanBay);
        var routePairs = new (string From, string To)[]
        {
            ("SGN", "HAN"), ("SGN", "DAD"), ("SGN", "CXR"), ("SGN", "PQC"), ("SGN", "HPH"),
            ("SGN", "VCA"), ("SGN", "DLI"), ("SGN", "HUI"), ("SGN", "BMV"), ("SGN", "UIH"),
            ("HAN", "DAD"), ("HAN", "CXR"), ("HAN", "PQC"), ("HAN", "VII"), ("HAN", "THD"),
            ("HAN", "VDO"), ("HAN", "VDH"), ("HAN", "VCL"), ("DAD", "HPH"), ("DAD", "CXR"),
            ("DAD", "PQC"), ("DAD", "VCA"), ("DAD", "DLI"), ("CXR", "VCA"), ("CXR", "DLI"),
            ("CXR", "PXU"), ("PQC", "VCA"), ("PQC", "VKG"), ("VCA", "VCS"), ("UIH", "TBB"),
        };

        var routes = new List<LoTrinh>();
        foreach (var (from, to) in routePairs)
        {
            routes.Add(Route(from, to, rng));
            routes.Add(Route(to, from, rng));
        }
        db.LoTrinhs.AddRange(routes);
        await db.SaveChangesAsync();

        var routeByDirection = routes.ToDictionary(route => (route.MaSanBayDi, route.MaSanBayDen));
        var flights = BuildRoundTripFlights(routePairs, routeByDirection, aircraft, airlines, rng);
        db.ChuyenBays.AddRange(flights);
        await db.SaveChangesAsync();

        var seatsByAircraft = seats.GroupBy(seat => seat.MaMayBay).ToDictionary(group => group.Key, group => group.ToList());
        await SeedFlightSeatsAndBookings(db, flights, seatsByAircraft, economy, business, first, rng, logger);

        db.ChangeTracker.AutoDetectChangesEnabled = true;
        logger.LogInformation("Seeded {AirportCount} airports, {AircraftCount} aircraft types, {FlightCount} flights and dynamic flight seats.", airports.Count, aircraft.Count, flights.Count);
    }

    private static SanBay Airport(string code, string name, string city) => new()
    {
        MaSanBay = code,
        TenSanBay = name,
        ThanhPho = city,
        QuocGia = "Vietnam",
    };

    private static async Task ClearDatabaseAsync(ApplicationDbContext db)
    {
        // Keep the SQLite file and its schema in place so an open read-only database tool
        // does not prevent a developer seed run. Children must be cleared before parents.
        var deleteCommands = new[]
        {
            "DELETE FROM \"ChiTietDichVus\";", "DELETE FROM \"HoanTiens\";", "DELETE FROM \"ThanhToans\";",
            "DELETE FROM \"Ves\";", "DELETE FROM \"ChangDatChos\";", "DELETE FROM \"HanhKhachs\";",
            "DELETE FROM \"PhieuDatChos\";", "DELETE FROM \"GheChuyenBays\";", "DELETE FROM \"ChuyenBays\";",
            "DELETE FROM \"GheMayBays\";", "DELETE FROM \"DichVuThems\";", "DELETE FROM \"LoTrinhs\";",
            "DELETE FROM \"MayBays\";", "DELETE FROM \"HangGhes\";", "DELETE FROM \"SanBays\";",
            "DELETE FROM \"HangBays\";", "DELETE FROM \"TaiKhoans\";",
        };

        await db.Database.OpenConnectionAsync();
        try
        {
            await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
            foreach (var command in deleteCommands)
            {
                await db.Database.ExecuteSqlRawAsync(command);
            }

            await db.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence;");
            await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;");
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private static LoTrinh Route(string from, string to, Random rng) => new()
    {
        MaSanBayDi = from,
        MaSanBayDen = to,
        GiaCoBan = rng.Next(850, 3101) * 1000m,
        TrangThai = "Active",
    };

    private static List<ChuyenBay> BuildRoundTripFlights(
        IEnumerable<(string From, string To)> routePairs,
        IReadOnlyDictionary<(string From, string To), LoTrinh> routeByDirection,
        IReadOnlyList<MayBay> aircraft,
        IReadOnlyList<HangBay> airlines,
        Random rng)
    {
        var flights = new List<ChuyenBay>();
        var start = DateTime.Today.AddDays(1);
        var flightSerial = 100;
        var pairIndex = 0;

        // Thirty route pairs run twice on separate dates: 60 round trips = 120 flights.
        foreach (var frequency in Enumerable.Range(0, 2))
        {
            foreach (var (from, to) in routePairs)
            {
                var aircraftItem = aircraft[(pairIndex + frequency) % aircraft.Count];
                var airline = airlines.Single(item => item.MaHangBay == aircraftItem.MaHangBay);
                var outboundDeparture = start
                    .AddDays((pairIndex * 2 + frequency * 19) % 58)
                    .AddHours(5 + (pairIndex * 3 + frequency * 5) % 17)
                    .AddMinutes((pairIndex * 7) % 6 * 10);
                var duration = TimeSpan.FromMinutes(70 + rng.Next(45, 126));
                var returnDeparture = outboundDeparture.Date
                    .AddDays(1 + pairIndex % 4)
                    .AddHours(7 + (pairIndex * 5 + frequency * 3) % 14)
                    .AddMinutes((pairIndex * 11) % 6 * 10);

                flights.Add(Flight($"{airline.MaCode}{flightSerial++}", routeByDirection[(from, to)], aircraftItem, outboundDeparture, duration));
                flights.Add(Flight($"{airline.MaCode}{flightSerial++}", routeByDirection[(to, from)], aircraftItem, returnDeparture, duration));
                pairIndex++;
            }
        }

        return flights;
    }

    private static ChuyenBay Flight(string number, LoTrinh route, MayBay aircraft, DateTime departure, TimeSpan duration) => new()
    {
        SoHieuChuyenBay = number,
        MaLoTrinh = route.MaLoTrinh,
        MaMayBay = aircraft.MaMayBay,
        GioKhoiHanh = departure,
        GioHaCanh = departure.Add(duration),
        NhaGa = "T1",
        CuaLen = $"{(char)('A' + departure.Hour % 4)}{10 + departure.Minute / 10}",
        GioBatDauCheckIn = departure.AddHours(-2),
        GioKetThucCheckIn = departure.AddMinutes(-40),
        GioLenMayBay = departure.AddMinutes(-35),
        GiaCoBan = route.GiaCoBan,
        TrangThai = "Scheduled",
    };

    private static async Task SeedFlightSeatsAndBookings(
        ApplicationDbContext db,
        IReadOnlyList<ChuyenBay> flights,
        IReadOnlyDictionary<int, List<GheMayBay>> seatsByAircraft,
        HangGhe economy,
        HangGhe business,
        HangGhe first,
        Random rng,
        ILogger logger)
    {
        var firstNames = new[] { "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng" };
        var lastNames = new[] { "An", "Bình", "Cường", "Dung", "Hải", "Hương", "Khánh", "Linh", "Minh", "Nhung", "Phong", "Quân", "Trang", "Tuấn", "Vy" };
        var fillProfiles = new[] { 1.00m, 0.86m, 0.66m, 0.50m, 0.32m, 0.14m, 0.00m };

        foreach (var (flight, index) in flights.Select((flight, index) => (flight, index)))
        {
            var flightSeats = seatsByAircraft[flight.MaMayBay]
                .Select(seat => new GheChuyenBay
                {
                    MaChuyenBay = flight.MaChuyenBay,
                    MaGheMayBay = seat.MaGheMayBay,
                    TrangThaiGhe = "Available",
                    GiaGhe = decimal.Round(flight.GiaCoBan * FareMultiplier(seat.MaHangGhe, economy, business, first), 0),
                    PhienBan = 1,
                    UpdatedAt = DateTime.UtcNow,
                })
                .ToList();

            db.GheChuyenBays.AddRange(flightSeats);
            await db.SaveChangesAsync();

            var fillRate = fillProfiles[index % fillProfiles.Length];
            var soldCount = (int)Math.Round(flightSeats.Count * fillRate, MidpointRounding.AwayFromZero);
            if (soldCount > 0)
            {
                var soldSeats = flightSeats.OrderBy(_ => rng.Next()).Take(soldCount).ToList();
                await CreateBookings(db, flight, soldSeats, firstNames, lastNames, rng);
            }

            // Add a few active holds only to partly filled future flights for real-time seat-map tests.
            if (fillRate is > 0m and < 1m)
            {
                foreach (var seat in flightSeats.Where(seat => seat.TrangThaiGhe == "Available").OrderBy(_ => rng.Next()).Take(2))
                {
                    seat.TrangThaiGhe = "Held";
                    seat.SessionId = "seeded-other-session";
                    seat.GiuDenLuc = DateTime.UtcNow.AddMinutes(30);
                    seat.UpdatedAt = DateTime.UtcNow;
                }
            }

            db.ChangeTracker.DetectChanges();
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();
        }

        logger.LogInformation("Created seat availability, half-full, near-full and sold-out flight scenarios.");
    }

    private static async Task CreateBookings(
        ApplicationDbContext db,
        ChuyenBay flight,
        IReadOnlyList<GheChuyenBay> soldSeats,
        IReadOnlyList<string> firstNames,
        IReadOnlyList<string> lastNames,
        Random rng)
    {
        for (var offset = 0; offset < soldSeats.Count;)
        {
            var groupSize = Math.Min(rng.Next(1, 5), soldSeats.Count - offset);
            var group = soldSeats.Skip(offset).Take(groupSize).ToList();
            var booking = new PhieuDatCho
            {
                MaDatCho = GeneratePnr(),
                LoaiChuyenDi = "OneWay",
                SoLuongHanhKhach = groupSize,
                TongTien = group.Sum(seat => seat.GiaGhe),
                TrangThai = "Confirmed",
                NgayDat = flight.GioKhoiHanh.AddDays(-rng.Next(2, 45)),
            };
            var leg = new ChangDatCho { PhieuDatCho = booking, MaChuyenBay = flight.MaChuyenBay, ThuTuChang = 1, LoaiChang = "Outbound" };
            db.PhieuDatChos.Add(booking);
            db.ChangDatChos.Add(leg);

            foreach (var seat in group)
            {
                seat.TrangThaiGhe = "Sold";
                seat.UpdatedAt = DateTime.UtcNow;
                var passenger = new HanhKhach
                {
                    PhieuDatCho = booking,
                    HoTen = $"{firstNames[rng.Next(firstNames.Count)]} {lastNames[rng.Next(lastNames.Count)]}",
                    LoaiGiayTo = "CCCD",
                    SoGiayTo = rng.NextInt64(100_000_000, 999_999_999).ToString(),
                    LoaiHanhKhach = "Adult",
                };
                db.HanhKhachs.Add(passenger);
                db.Ves.Add(new Ve
                {
                    PhieuDatCho = booking,
                    ChangDatCho = leg,
                    HanhKhach = passenger,
                    GheChuyenBay = seat,
                    SoVeDienTu = $"738{Guid.NewGuid():N}"[..13].ToUpperInvariant(),
                    GiaVe = seat.GiaGhe,
                    TrangThaiVe = "Issued",
                });
            }

            offset += groupSize;
        }

        db.ChangeTracker.DetectChanges();
        await db.SaveChangesAsync();
    }

    private static decimal FareMultiplier(int seatFareId, HangGhe economy, HangGhe business, HangGhe first) =>
        seatFareId == first.MaHangGhe ? first.HeSoGia :
        seatFareId == business.MaHangGhe ? business.HeSoGia : economy.HeSoGia;

    private static List<GheMayBay> GenerateSeats(int aircraftId, int fareId, int firstRow, int rows, string columns) =>
        Enumerable.Range(firstRow, rows)
            .SelectMany(row => columns.Select(column => new GheMayBay
            {
                MaMayBay = aircraftId,
                SoGhe = $"{row}{column}",
                MaHangGhe = fareId,
                DangSuDung = true,
            }))
            .ToList();

    private static void ValidateSeatCapacities(IEnumerable<MayBay> aircraft, IEnumerable<GheMayBay> seats)
    {
        var seatCounts = seats.GroupBy(seat => seat.MaMayBay).ToDictionary(group => group.Key, group => group.Count());
        foreach (var aircraftItem in aircraft)
        {
            if (!seatCounts.TryGetValue(aircraftItem.MaMayBay, out var count) || count != aircraftItem.TongSoGhe)
            {
                throw new InvalidOperationException($"Seat layout for {aircraftItem.DongMayBay} does not match TongSoGhe.");
            }
        }
    }

    private static string GeneratePnr() => Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
}
