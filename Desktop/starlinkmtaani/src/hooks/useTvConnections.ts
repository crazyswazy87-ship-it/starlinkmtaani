import { useCallback, useEffect, useRef, useState } from 'react';
import { connectTv, errorMessage, getTvOverview, removeTv } from '../services/api';
import type { TvOverview, WithSkew } from '../types';

export function useTvConnections() {
  const [overview, setOverview] = useState<WithSkew<TvOverview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setOverview(await getTvOverview());
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your TV connections.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getTvOverview()
      .then(setOverview)
      .catch((err: unknown) => setError(errorMessage(err, 'Could not load your TV connections.')))
      .finally(() => setLoading(false));
  }, []);

  const run = useCallback(
    async (action: () => Promise<WithSkew<TvOverview>>, success: (o: WithSkew<TvOverview>) => string): Promise<boolean> => {
      if (busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        const next = await action();
        setOverview(next);
        setNotice(success(next));
        return true;
      } catch (err) {
        setError(errorMessage(err));
        await refresh(); // e.g. package expired while the form was open
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [refresh]
  );

  const connect = useCallback(
    (tvMac: string, name: string) =>
      run(
        () => connectTv({ tvMac, name }),
        (o) => (o.alreadyConnected ? 'That TV is already connected.' : 'TV connected. It can go online now.')
      ),
    [run]
  );

  const remove = useCallback((id: string) => run(() => removeTv(id), () => 'TV disconnected.'), [run]);

  return { overview, loading, busy, error, notice, connect, remove, refresh };
}
