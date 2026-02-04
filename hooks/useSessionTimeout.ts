"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseSessionTimeoutOptions {
  timeoutMs: number; // Total timeout duration (e.g., 60 minutes)
  warningMs: number; // When to show warning before timeout (e.g., 5 minutes before)
  onTimeout: () => void; // Called when session times out
  onWarning?: () => void; // Called when warning should be shown
  enabled?: boolean; // Whether the timeout is active
}

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  remainingTime: number; // Seconds until timeout
  resetTimer: () => void;
  dismissWarning: () => void;
}

export function useSessionTimeout({
  timeoutMs,
  warningMs,
  onTimeout,
  onWarning,
  enabled = true,
}: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(Math.floor(timeoutMs / 1000));

  const lastActivityRef = useRef<number>(Date.now());
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (finalTimeoutRef.current) {
      clearTimeout(finalTimeoutRef.current);
      finalTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();

    const warningDelay = timeoutMs - warningMs;

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning?.();

      // Start countdown
      setRemainingTime(Math.floor(warningMs / 1000));
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningDelay);

    // Set final timeout
    finalTimeoutRef.current = setTimeout(() => {
      clearAllTimers();
      setShowWarning(false);
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, warningMs, onTimeout, onWarning, clearAllTimers]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingTime(Math.floor(timeoutMs / 1000));
    startTimers();
  }, [timeoutMs, startTimers]);

  const dismissWarning = useCallback(() => {
    // User acknowledged warning, reset the timer
    resetTimer();
  }, [resetTimer]);

  // Track user activity
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    const handleActivity = () => {
      // Only reset if warning is not showing
      // If warning is showing, user must explicitly dismiss it
      if (!showWarning) {
        lastActivityRef.current = Date.now();
        startTimers();
      }
    };

    // Throttle activity handler to avoid excessive resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        handleActivity();
      }, 1000); // Only process activity once per second
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, throttledActivity, { passive: true });
    });

    // Start initial timers
    startTimers();

    return () => {
      clearAllTimers();
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, throttledActivity);
      });
    };
  }, [enabled, showWarning, startTimers, clearAllTimers]);

  return {
    showWarning,
    remainingTime,
    resetTimer,
    dismissWarning,
  };
}
