using FlightBookingSystem.Web.Models;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Data;

public sealed record AdditionalServiceSyncResult(
    int Inserted,
    int Updated,
    int Unchanged,
    int DuplicatesDeactivated,
    string DatabasePath);

public static class ReferenceDataSeeder
{
    public static async Task<AdditionalServiceSyncResult> SyncAdditionalServicesAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();
        var databasePath = Path.GetFullPath(db.Database.GetDbConnection().DataSource);

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var existingServices = await db.DichVuThems
                .OrderBy(service => service.MaDichVu)
                .ToListAsync();
            var inserted = 0;
            var updated = 0;
            var unchanged = 0;
            var duplicatesDeactivated = 0;

            foreach (var definition in AdditionalServiceCatalog.All)
            {
                var matches = existingServices
                    .Where(service => IsMatch(service, definition))
                    .OrderBy(service => service.MaDichVu)
                    .ToList();

                if (matches.Count == 0)
                {
                    db.DichVuThems.Add(AdditionalServiceCatalog.CreateEntity(definition));
                    inserted++;
                    continue;
                }

                var primary = matches[0];
                if (AdditionalServiceCatalog.HasCanonicalValues(primary, definition))
                {
                    unchanged++;
                }
                else
                {
                    AdditionalServiceCatalog.Apply(primary, definition);
                    updated++;
                }

                if (matches.Count <= 1) continue;

                logger.LogWarning(
                    "Found {DuplicateCount} duplicate records for additional service {ServiceName}. Keeping MaDichVu {PrimaryId} active and deactivating the remaining records.",
                    matches.Count - 1,
                    definition.TenDichVu,
                    primary.MaDichVu);

                foreach (var duplicate in matches.Skip(1))
                {
                    if (string.Equals(duplicate.TrangThai, "Inactive", StringComparison.Ordinal)) continue;
                    duplicate.TrangThai = "Inactive";
                    duplicatesDeactivated++;
                }
            }

            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            logger.LogInformation(
                "Additional service sync completed. Inserted: {Inserted}, Updated: {Updated}, Unchanged: {Unchanged}, Duplicates deactivated: {DuplicatesDeactivated}, Database: {DatabasePath}.",
                inserted,
                updated,
                unchanged,
                duplicatesDeactivated,
                databasePath);

            return new AdditionalServiceSyncResult(inserted, updated, unchanged, duplicatesDeactivated, databasePath);
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync();
            logger.LogError(exception, "Additional service sync failed; transaction rolled back.");
            throw;
        }
    }

    private static bool IsMatch(DichVuThem service, AdditionalServiceDefinition definition)
    {
        if (!string.Equals(service.LoaiDichVu?.Trim(), definition.LoaiDichVu, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return string.Equals(definition.LoaiDichVu, "Baggage", StringComparison.OrdinalIgnoreCase)
            ? service.KhoiLuongKg == definition.KhoiLuongKg
            : string.Equals(service.TenDichVu?.Trim(), definition.TenDichVu, StringComparison.OrdinalIgnoreCase);
    }
}
