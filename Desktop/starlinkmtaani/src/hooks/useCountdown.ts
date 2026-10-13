import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Whole seconds left until `expiresAt`, ticking once a second.
 *
 * Display only. The server decides when access ends (and cuts it off at
 * the router); this just shows the person how long they have. `skewMs` is
 * the server-minus-browser clock difference from the API response, so a
 * wrong device clock cannot make the timer lie.
 *
 * Mount the component that uses this when the countdown starts (give it a
 * `key` that changes with `expiresAt`) so the first render is already fresh.
 */
export function useCountdown(expiresAt: string | null | undefined, skewMs: number, onExpire?: () => void): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const remaining = expiresAt ? Math.max(0, Math.ceil((Date.parse(expiresAt) - (now + skewMs)) / 1000)) : 0;

  const fireExpire = useEffectEvent(() => onExpire?.());
  useEffect(() => {
    if (expiresAt && remaining === 0) fireExpire();
  }, [expiresAt, remaining]);

  return remaining;
}
