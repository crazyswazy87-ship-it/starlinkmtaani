import type {
  ActiveSession,
  ApiErrorCode,
  SessionInfo,
  SpendingSummary,
  Transaction,
  TrialStatus,
  TvConnectRequest,
  TvOverview,
  WithSkew
} from "../types";


const BASE = '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  message?: string;
  code?: ApiErrorCode;
}

/**
 * The router redirects the customer here with their device address in the
 * query string (?mac=…). Forward it so the backend identifies the real
 * device instead of falling back to its demo identity.
 */
function apiUrl(path: string): string {
  const mac = new URLSearchParams(window.location.search).get('mac');
  return mac ? `${BASE}${path}${path.includes('?') ? '&' : '?'}mac=${encodeURIComponent(mac)}` : `${BASE}${path}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status, body.code ?? 'UNKNOWN');
  }
  return res.json() as Promise<T>;
}

/** Records how far this browser's clock is from the server's, so countdowns can't drift. */
function withSkew<T extends { serverTime: string }>(payload: T): WithSkew<T> {
  return { ...payload, skewMs: Date.parse(payload.serverTime) - Date.now() };
}

export async function initiatePayment(params: {
  packageId: string;
  phone: string;
}): Promise<{ transactionId: string }> {
  const res = await fetch(apiUrl('/payments/initiate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return handle(res);
}

/**
 * Polls the backend's transaction store. The backend only reports
 * status "confirmed" once the M-PESA callback (Daraja) has written
 * that confirmation to the database — the frontend never marks a
 * payment successful on its own.
 */
export async function getTransactionStatus(transactionId: string): Promise<Transaction> {
  const res = await fetch(apiUrl(`/payments/${transactionId}`));
  return handle(res);
}

export async function getSession(transactionId: string): Promise<SessionInfo> {
  const res = await fetch(apiUrl(`/sessions/${transactionId}`));
  return handle(res);
}

/**
 * Called on page load. The captive-portal router identifies the
 * requesting device (by MAC, as in the JSS-xxxx session ID shown in
 * the URL) and the backend checks the database for a package that is
 * still within its validity window for that device.
 */
export async function getActiveSessionForDevice(): Promise<ActiveSession | null> {
  const res = await fetch(apiUrl('/sessions/active'));
  if (res.status === 404) return null;
  return handle(res);
}

export async function confirmConnect(transactionId: string): Promise<{ ok: true }> {
  const res = await fetch(apiUrl(`/sessions/${transactionId}/connect`), { method: 'POST' });
  return handle(res);
}

// -- free trial ---------------------------------------------------------------
// Eligibility, the start time and the expiry are all decided by the server.

export async function getTrialStatus(): Promise<WithSkew<TrialStatus>> {
  return withSkew(await handle<TrialStatus>(await fetch(apiUrl('/trial/status'))));
}

export async function claimTrial(): Promise<WithSkew<TrialStatus>> {
  const res = await fetch(apiUrl('/trial/claim'), { method: 'POST' });
  return withSkew(await handle<TrialStatus>(res));
}

// -- connect TV -----------------------------------------------------------------

export async function getTvOverview(): Promise<WithSkew<TvOverview>> {
  return withSkew(await handle<TvOverview>(await fetch(apiUrl('/tv'))));
}

export async function connectTv(request: TvConnectRequest): Promise<WithSkew<TvOverview>> {
  const res = await fetch(apiUrl('/tv/connect'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return withSkew(await handle<TvOverview>(res));
}

export async function removeTv(id: string): Promise<WithSkew<TvOverview>> {
  const res = await fetch(apiUrl(`/tv/${id}`), { method: 'DELETE' });
  return withSkew(await handle<TvOverview>(res));
}

// -- spending dashboard -------------------------------------------------------------

export async function getSpending(): Promise<SpendingSummary> {
  return handle(await fetch(apiUrl('/dashboard/spending')));
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
