// Integration tests: start the REAL server (stub router) against a throw-away
// database and drive the HTTP API. Run with `npm test` in /backend.
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4300 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const TRIAL_SECONDS = 3;
const dir = mkdtempSync(join(tmpdir(), 'portal-test-'));
const DB_FILE = join(dir, 'db.json');
const backendDir = fileURLToPath(new URL('..', import.meta.url));

const PAID = 'AA:BB:CC:00:00:01'; // has an active 24h package + 2 confirmed payments
const EXPIRED = 'AA:BB:CC:00:00:02'; // package ended days ago
const FRESH = 'AA:BB:CC:00:00:03';
const FRESH_2 = 'AA:BB:CC:00:00:04';
const RACE = 'AA:BB:CC:00:00:05';
const CALLBACK_DEVICE = 'AA:BB:CC:00:00:06';

interface Json {
  [key: string]: unknown;
}
interface Reply {
  status: number;
  body: Json;
}

async function api(
  path: string,
  opts: { method?: string; device?: string; body?: unknown; base?: string } = {}
): Promise<Reply> {
  const res = await fetch(`${opts.base ?? BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.device ? { 'x-device-id': opts.device } : {})
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });
  const body = (await res.json().catch(() => ({}))) as Json;
  return { status: res.status, body };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const HOUR = 3600_000;

let server: ChildProcess;

before(async () => {
  writeFileSync(
    DB_FILE,
    JSON.stringify({
      transactions: [
        { id: 't1', packageId: 'p-1h', phone: '254700000001', amount: 10, status: 'confirmed', deviceId: PAID, createdAt: ago(5 * HOUR), confirmedAt: ago(5 * HOUR), mpesaReceipt: 'RCP1' },
        { id: 't2', packageId: 'p-24h', phone: '254700000001', amount: 50, status: 'confirmed', deviceId: PAID, createdAt: ago(HOUR), confirmedAt: ago(HOUR), mpesaReceipt: 'RCP2' },
        { id: 't3', packageId: 'p-1h', phone: '254700000001', amount: 10, status: 'failed', deviceId: PAID, createdAt: ago(2 * HOUR) },
        { id: 't4', packageId: 'p-1h', phone: '254700000006', amount: 10, status: 'pending', deviceId: CALLBACK_DEVICE, createdAt: ago(1000), checkoutRequestId: 'ws_CO_TEST' }
      ],
      sessions: [
        { transactionId: 't1', deviceId: PAID, packageId: 'p-1h', packageLabel: '1 hour unlimited', hours: 1, confirmedAt: ago(5 * HOUR), connectedAt: null, ip: null },
        { transactionId: 't2', deviceId: PAID, packageId: 'p-24h', packageLabel: '24 hour unlimited', hours: 24, confirmedAt: ago(HOUR), connectedAt: null, ip: null },
        { transactionId: 'old', deviceId: EXPIRED, packageId: 'p-1h', packageLabel: '1 hour unlimited', hours: 1, confirmedAt: ago(72 * HOUR), connectedAt: null, ip: null }
      ]
    })
  );

  server = spawn(process.execPath, ['server.js'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT), DB_FILE, TRIAL_SECONDS: String(TRIAL_SECONDS), SWEEP_INTERVAL_MS: '400', TV_LIMIT: '2', NODE_ENV: 'test', ROUTER_API_URL: '' },
    stdio: 'ignore'
  });

  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  throw new Error('server did not start');
});

after(() => {
  server?.kill();
});

describe('route fix', () => {
  it('/api/sessions/active is reachable (was shadowed by /:transactionId)', async () => {
    assert.equal((await api('/api/sessions/active', { device: PAID })).status, 200);
    assert.equal((await api('/api/sessions/active', { device: FRESH })).status, 404);
  });
});

describe('free trial', () => {
  it('is available to a new device', async () => {
    const r = await api('/api/trial/status', { device: FRESH });
    assert.equal(r.body.status, 'available');
    assert.equal(r.body.eligible, true);
  });

  it('does not start the clock until the claim succeeds', async () => {
    const r = await api('/api/trial/status', { device: FRESH });
    assert.equal(r.body.startedAt, undefined);
  });

  it('refuses devices it cannot identify', async () => {
    const r = await api('/api/trial/claim', { method: 'POST', device: 'not-a-mac' });
    assert.equal(r.status, 400);
    assert.equal(r.body.code, 'DEVICE_UNKNOWN');
  });

  it('lets exactly ONE of many concurrent claims create a trial', async () => {
    const replies = await Promise.all(Array.from({ length: 10 }, () => api('/api/trial/claim', { method: 'POST', device: RACE })));
    const created = replies.filter((r) => r.status === 201);
    assert.equal(created.length, 1, 'exactly one 201');
    assert.ok(replies.every((r) => r.status === 201 || r.status === 200), 'the rest are idempotent, never errors');
    const expiries = new Set(replies.map((r) => r.body.expiresAt));
    assert.equal(expiries.size, 1, 'everyone sees the same server-set expiry');

    const db = JSON.parse(readFileSync(DB_FILE, 'utf8')) as { trials: { deviceId: string }[] };
    assert.equal(db.trials.filter((t) => t.deviceId === RACE).length, 1, 'only one trial row stored');
  });

  it('repeating the claim never restarts or extends the trial', async () => {
    const before = await api('/api/trial/status', { device: RACE });
    const again = await api('/api/trial/claim', { method: 'POST', device: RACE });
    assert.equal(again.status, 200);
    assert.equal(again.body.alreadyActive, true);
    assert.equal(again.body.expiresAt, before.body.expiresAt);
  });

  it('server sets a 3s window and reports remaining time', async () => {
    const r = await api('/api/trial/status', { device: RACE });
    const span = Date.parse(r.body.expiresAt as string) - Date.parse(r.body.startedAt as string);
    assert.equal(span, TRIAL_SECONDS * 1000);
  });

  it('expires on its own, is recorded, and cannot be claimed again', async () => {
    await sleep(TRIAL_SECONDS * 1000 + 900);
    const status = await api('/api/trial/status', { device: RACE });
    assert.equal(status.body.status, 'expired');
    assert.equal(status.body.secondsRemaining, 0);

    const claim = await api('/api/trial/claim', { method: 'POST', device: RACE });
    assert.equal(claim.status, 409);
    assert.equal(claim.body.code, 'TRIAL_ALREADY_USED');

    const db = JSON.parse(readFileSync(DB_FILE, 'utf8')) as { trials: { deviceId: string; status: string }[]; events: { type: string }[] };
    assert.equal(db.trials.find((t) => t.deviceId === RACE)?.status, 'expired', 'sweeper recorded expiry');
    assert.ok(db.events.some((e) => e.type === 'trial_expired'));
  });

  it('is for new users only', async () => {
    const status = await api('/api/trial/status', { device: PAID });
    assert.equal(status.body.status, 'ineligible');
    const claim = await api('/api/trial/claim', { method: 'POST', device: PAID });
    assert.equal(claim.status, 409);
    assert.equal(claim.body.code, 'NOT_ELIGIBLE');
  });

  it('normalises the device id so a case/separator change is not a new user', async () => {
    const lower = RACE.toLowerCase().replace(/:/g, '-');
    const claim = await api('/api/trial/claim', { method: 'POST', device: lower });
    assert.equal(claim.status, 409);
  });
});

describe('connect TV', () => {
  const TV_A = 'DD:EE:FF:00:00:0A';
  const TV_B = 'DD:EE:FF:00:00:0B';
  const TV_C = 'DD:EE:FF:00:00:0C';
  let tvId = '';

  it('reports inactive / expired / active from the server', async () => {
    assert.equal(((await api('/api/tv', { device: FRESH_2 })).body.subscription as Json).status, 'inactive');
    assert.equal(((await api('/api/tv', { device: EXPIRED })).body.subscription as Json).status, 'expired');
    assert.equal(((await api('/api/tv', { device: PAID })).body.subscription as Json).status, 'active');
  });

  it('rejects (402) without a subscription — inactive, expired, and trial-only', async () => {
    for (const device of [FRESH_2, EXPIRED]) {
      const r = await api('/api/tv/connect', { method: 'POST', device, body: { tvMac: TV_A } });
      assert.equal(r.status, 402);
      assert.equal(r.body.code, 'SUBSCRIPTION_REQUIRED');
    }
    await api('/api/trial/claim', { method: 'POST', device: FRESH });
    const trialOnly = await api('/api/tv/connect', { method: 'POST', device: FRESH, body: { tvMac: TV_A } });
    assert.equal(trialOnly.status, 402, 'a running free trial is not a subscription');
  });

  it('validates the TV address', async () => {
    const bad = await api('/api/tv/connect', { method: 'POST', device: PAID, body: { tvMac: 'nope' } });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.code, 'INVALID_MAC');
    const same = await api('/api/tv/connect', { method: 'POST', device: PAID, body: { tvMac: PAID } });
    assert.equal(same.body.code, 'SAME_DEVICE');
  });

  it('connects a TV without a new payment when the package is active', async () => {
    const r = await api('/api/tv/connect', { method: 'POST', device: PAID, body: { tvMac: TV_A.toLowerCase(), name: 'Lounge' } });
    assert.equal(r.status, 201);
    const tvs = r.body.tvs as { id: string; tvMac: string; status: string; name: string }[];
    assert.equal(tvs[0].status, 'connected');
    assert.equal(tvs[0].tvMac, TV_A, 'stored normalised');
    assert.equal(tvs[0].name, 'Lounge');
    tvId = tvs[0].id;
  });

  it('is idempotent, enforces the per-package limit, and blocks TV theft', async () => {
    const again = await api('/api/tv/connect', { method: 'POST', device: PAID, body: { tvMac: TV_A } });
    assert.equal(again.status, 200);
    assert.equal(again.body.alreadyConnected, true);

    assert.equal((await api('/api/tv/connect', { method: 'POST', device: PAID, body: { tvMac: TV_B } })).status, 201);
    const third = await api('/api/tv/connect', { method: 'POST', device: PAID, body: { tvMac: TV_C } });
    assert.equal(third.status, 409);
    assert.equal(third.body.code, 'TV_LIMIT_REACHED');

    // another customer with a package cannot grab a TV that is in use
    const cb = await api('/api/mpesa/callback', { method: 'POST', body: { Body: { stkCallback: { CheckoutRequestID: 'ws_CO_TEST', ResultCode: 0, CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'RCPCB' }] } } } } });
    assert.equal(cb.status, 200);
    const stolen = await api('/api/tv/connect', { method: 'POST', device: CALLBACK_DEVICE, body: { tvMac: TV_A } });
    assert.equal(stolen.status, 409);
    assert.equal(stolen.body.code, 'TV_IN_USE');
  });

  it('M-PESA callback still creates a usable session (existing flow intact)', async () => {
    const r = await api('/api/sessions/active', { device: CALLBACK_DEVICE });
    assert.equal(r.status, 200);
  });

  it('removing a TV frees a slot', async () => {
    const del = await api(`/api/tv/${tvId}`, { method: 'DELETE', device: PAID });
    assert.equal(del.status, 200);
    assert.equal(del.body.canConnect, true);
    assert.equal((await api(`/api/tv/${tvId}`, { method: 'DELETE', device: FRESH_2 })).status, 404, 'cannot remove someone else’s TV');
  });
});

describe('spending dashboard', () => {
  it('totals only confirmed payments for this device', async () => {
    const r = await api('/api/dashboard/spending', { device: PAID });
    assert.equal(r.status, 200);
    const totals = r.body.totals as Json;
    assert.equal(totals.lifetime, 60);
    assert.equal(totals.purchaseCount, 2);
    assert.equal(totals.averagePurchase, 30);
    assert.equal((r.body.payments as unknown[]).length, 2);
    assert.equal(r.body.hoursPurchased, 25);
    assert.equal(r.body.pendingOrFailedCount, 1);
    assert.equal((r.body.monthly as unknown[]).length, 6);
  });

  it('is empty (not an error) for a brand-new device', async () => {
    const r = await api('/api/dashboard/spending', { device: FRESH_2 });
    assert.equal(r.status, 200);
    assert.equal((r.body.totals as Json).lifetime, 0);
    assert.deepEqual(r.body.payments, []);
  });
});

describe('router failure (router configured but unreachable)', () => {
  const BAD_PORT = PORT + 1000;
  const BAD_BASE = `http://127.0.0.1:${BAD_PORT}`;
  const BAD_DB = join(dir, 'bad-db.json');
  const DEVICE = 'AA:BB:CC:00:00:09';
  let bad: ChildProcess;

  before(async () => {
    bad = spawn(process.execPath, ['server.js'], {
      cwd: backendDir,
      env: { ...process.env, PORT: String(BAD_PORT), DB_FILE: BAD_DB, TRIAL_SECONDS: '30', NODE_ENV: 'test', ROUTER_API_URL: 'http://127.0.0.1:1/grant' },
      stdio: 'ignore'
    });
    for (let i = 0; i < 50; i++) {
      try {
        if ((await fetch(`${BAD_BASE}/api/health`)).ok) return;
      } catch {
        /* not up yet */
      }
      await sleep(100);
    }
    throw new Error('second server did not start');
  });

  after(() => {
    bad?.kill();
  });

  it('a failed activation returns 502, starts no clock and does NOT use up the free trial', async () => {
    const claim = await api('/api/trial/claim', { method: 'POST', device: DEVICE, base: BAD_BASE });
    assert.equal(claim.status, 502);
    assert.equal(claim.body.code, 'ACTIVATION_FAILED');

    const status = await api('/api/trial/status', { device: DEVICE, base: BAD_BASE });
    assert.equal(status.body.status, 'available', 'user can retry');
    assert.equal(status.body.startedAt, undefined);

    const db = JSON.parse(readFileSync(BAD_DB, 'utf8')) as { trials: { status: string }[]; events: { type: string }[] };
    assert.equal(db.trials[0].status, 'failed');
    assert.ok(db.events.some((e) => e.type === 'trial_activation_failed'));
  });
});
