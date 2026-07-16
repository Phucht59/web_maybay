import { useEffect, useState } from "react";

const TEST_REMAINING_MS = null; //Test cooldown nhanh

function parseBackendTimestamp(value) {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Date.parse(value);
}

export function createPaymentCountdownAnchor({
  deadline,
  serverTime,
  anchorPerformanceTime = 0,
}) {
  const deadlineMs = parseBackendTimestamp(deadline);
  const serverTimeMs = parseBackendTimestamp(serverTime);
  const isValid = Number.isFinite(deadlineMs) && Number.isFinite(serverTimeMs);

  if (!isValid) {
    return {
      isValid: false,
      initialRemainingMs: null,
      anchorPerformanceTime,
    };
  }

  return {
    isValid: true,
    initialRemainingMs:
      TEST_REMAINING_MS ??
      Math.max(0, deadlineMs - serverTimeMs),
    anchorPerformanceTime,
  };
}

export function getPaymentRemainingSeconds(anchor, currentPerformanceTime) {
  if (!anchor?.isValid || anchor.initialRemainingMs === null) return null;

  const elapsedMs = Math.max(0, currentPerformanceTime - anchor.anchorPerformanceTime);
  const remainingMs = Math.max(0, anchor.initialRemainingMs - elapsedMs);
  return Math.ceil(remainingMs / 1000);
}

export function formatPaymentCountdown(remainingSeconds) {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds < 0) return "Không xác định";
  const wholeSeconds = Math.floor(remainingSeconds);
  const minutes = String(Math.floor(wholeSeconds / 60)).padStart(2, "0");
  const seconds = String(wholeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function canRunPaymentCountdown(enabled, isValid, remainingSeconds) {
  return Boolean(enabled && isValid && remainingSeconds > 0);
}

export default function usePaymentCountdown({ deadline, serverTime, enabled }) {
  const [snapshot, setSnapshot] = useState({
    remainingSeconds: null,
    isValid: false,
  });

  useEffect(() => {
    const anchor = createPaymentCountdownAnchor({
      deadline,
      serverTime,
      anchorPerformanceTime: performance.now(),
    });

    if (!enabled || !anchor.isValid) {
      setSnapshot({ remainingSeconds: null, isValid: anchor.isValid });
      return undefined;
    }

    let intervalId = null;

    const recompute = () => {
      const remainingSeconds = getPaymentRemainingSeconds(anchor, performance.now());
      setSnapshot({ remainingSeconds, isValid: true });

      if (remainingSeconds === 0 && intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const initialRemainingSeconds = getPaymentRemainingSeconds(anchor, performance.now());
    setSnapshot({ remainingSeconds: initialRemainingSeconds, isValid: true });

    if (initialRemainingSeconds > 0) {
      intervalId = window.setInterval(recompute, 1000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") recompute();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [deadline, enabled, serverTime]);

  const isExpired = Boolean(
    enabled && snapshot.isValid && snapshot.remainingSeconds === 0,
  );

  return {
    remainingSeconds: snapshot.remainingSeconds,
    isExpired,
    isValid: snapshot.isValid,
    isRunning: canRunPaymentCountdown(
      enabled,
      snapshot.isValid,
      snapshot.remainingSeconds,
    ),
    formattedTime: formatPaymentCountdown(snapshot.remainingSeconds),
  };
}
