"use client";

import { useEffect, useState } from "react";

function secondsBetween(now: number, target: number) {
  return Math.max(0, Math.ceil((target - now) / 1000));
}

function elapsedBetween(
  startedAtMs: number | null,
  pausedAtMs: number | null,
  accumulatedPausedSeconds: number,
) {
  return startedAtMs
    ? Math.max(
        0,
        Math.floor(((pausedAtMs ?? Date.now()) - startedAtMs) / 1000) -
          accumulatedPausedSeconds,
      )
    : 0;
}

export function useElapsedWorkoutSeconds(
  startedAt: string | null,
  pausedAt: string | null = null,
  accumulatedPausedSeconds = 0,
) {
  const startedAtMs = startedAt ? new Date(startedAt).getTime() : null;
  const pausedAtMs = pausedAt ? new Date(pausedAt).getTime() : null;
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    elapsedBetween(startedAtMs, pausedAtMs, accumulatedPausedSeconds),
  );

  useEffect(() => {
    if (!startedAtMs) {
      return;
    }

    const update = () =>
      setElapsedSeconds(
        elapsedBetween(startedAtMs, pausedAtMs, accumulatedPausedSeconds),
      );
    if (pausedAtMs) {
      update();
      return;
    }
    const interval = window.setInterval(update, 1000);

    update();
    return () => window.clearInterval(interval);
  }, [startedAtMs, pausedAtMs, accumulatedPausedSeconds]);

  return startedAt ? elapsedSeconds : 0;
}

export function useRestSeconds(restEndsAt: string | null) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    restEndsAt ? secondsBetween(Date.now(), new Date(restEndsAt).getTime()) : 0,
  );

  useEffect(() => {
    if (!restEndsAt) {
      return;
    }

    const target = new Date(restEndsAt).getTime();
    const update = () => {
      setRemainingSeconds(secondsBetween(Date.now(), target));
    };
    const interval = window.setInterval(update, 250);

    update();
    return () => window.clearInterval(interval);
  }, [restEndsAt]);

  return restEndsAt ? remainingSeconds : 0;
}

export function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
