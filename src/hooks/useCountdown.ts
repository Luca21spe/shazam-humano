'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCountdownReturn {
  timeLeft: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  progress: number;
}

export function useCountdown(
  durationSec: number,
  onComplete?: () => void
): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const startTimeRef = useRef<number>(0);
  const durationMsRef = useRef(durationSec * 1000);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    setTimeLeft(durationSec);
    durationMsRef.current = durationSec * 1000;
    startTimeRef.current = Date.now();
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, durationMsRef.current - elapsed);
      const remainingSec = Math.ceil(remaining / 1000);

      setTimeLeft(remainingSec);

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        onCompleteRef.current?.();
      }
    }, 100);
  }, [durationSec, stop]);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(durationSec);
  }, [durationSec, stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const progress = isRunning ? timeLeft / durationSec : 1;

  return { timeLeft, isRunning, start, stop, reset, progress };
}
