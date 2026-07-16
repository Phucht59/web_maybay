using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using FlightBookingSystem.Web.Models;

namespace FlightBookingSystem.Web.Services;

public sealed class PaymentSimulationService
{
    public const int MinimumProcessingSeconds = 5;
    public const int MaximumProcessingSeconds = 10;
    public const int ProcessingGraceSeconds = 20;

    public PaymentSimulationResult Evaluate(ThanhToan payment, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(payment);

        var serverTime = ToUtc(now);
        var createdAt = ToUtc(payment.NgayTao);
        var processingDurationSeconds = GetProcessingDurationSeconds(payment);
        var processingDueAt = createdAt.AddSeconds(processingDurationSeconds);
        var graceExpiresAt = createdAt.AddSeconds(ProcessingGraceSeconds);

        var evaluationState = !string.Equals(
                payment.TrangThai,
                "Pending",
                StringComparison.Ordinal)
            ? PaymentSimulationState.NotPending
            : serverTime < processingDueAt
                ? PaymentSimulationState.Processing
                : serverTime <= graceExpiresAt
                    ? PaymentSimulationState.ReadyToFinalize
                    : PaymentSimulationState.GraceExpired;

        return new PaymentSimulationResult(
            processingDurationSeconds,
            processingDueAt,
            graceExpiresAt,
            evaluationState,
            serverTime);
    }

    public int GetProcessingDurationSeconds(ThanhToan payment)
    {
        ArgumentNullException.ThrowIfNull(payment);

        var stableInput = !string.IsNullOrWhiteSpace(payment.IdempotencyKey)
            ? $"idempotency:{payment.IdempotencyKey}"
            : $"payment:{payment.MaThanhToan}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(stableInput));
        var hashValue = BinaryPrimitives.ReadUInt32BigEndian(hash);
        var durationRange = MaximumProcessingSeconds - MinimumProcessingSeconds + 1;

        return MinimumProcessingSeconds + (int)(hashValue % durationRange);
    }

    private static DateTimeOffset ToUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => new DateTimeOffset(value),
            DateTimeKind.Local => new DateTimeOffset(value).ToUniversalTime(),
            _ => new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))
        };
}

public enum PaymentSimulationState
{
    Processing,
    ReadyToFinalize,
    GraceExpired,
    NotPending
}

public sealed record PaymentSimulationResult(
    int ProcessingDurationSeconds,
    DateTimeOffset ProcessingDueAt,
    DateTimeOffset GraceExpiresAt,
    PaymentSimulationState EvaluationState,
    DateTimeOffset ServerTime);
