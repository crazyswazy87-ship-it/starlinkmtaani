import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, claimTrial, errorMessage, getTrialStatus } from '../services/api';
import type { TrialStatus, WithSkew } from '../types';

/**
 * Free-trial state. Everything shown comes from the server: a reload, a
 * second tab or a returning visitor all see the same truth, and the claim
 * button can never grant time by itself.
 */
export function useTrial() {
  const [trial, setTrial] = useState<WithSkew<TrialStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimingRef = useRef(false); // blocks double-taps before React re-renders

  const refresh = useCallback(async () => {
    try {
      setTrial(await getTrialStatus());
    } catch (err) {
      setError(errorMessage(err, 'Could not check the free offer.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getTrialStatus()
      .then(setTrial)
      .catch((err: unknown) => setError(errorMessage(err, 'Could not check the free offer.')))
      .finally(() => setLoading(false));
  }, []);

  // Coming back to the tab / reconnecting after an interruption: re-sync.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [refresh]);

  const claim = useCallback(async () => {
    if (claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    setError(null);
    try {
      setTrial(await claimTrial());
    } catch (err) {
      setError(errorMessage(err));
      // The server may know better than our screen (already used, ineligible…).
      if (err instanceof ApiError && err.status !== 502 && err.status !== 429) await refresh();
    } finally {
      claimingRef.current = false;
      setClaiming(false);
    }
  }, [refresh]);

  return { trial, loading, claiming, error, claim, refresh };
}
