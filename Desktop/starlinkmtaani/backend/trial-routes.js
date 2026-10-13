import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from './db.js';
import { deviceIdFromRequest, isTrustedDevice } from './identity.js';
import { TRIAL_SECONDS, getPaidSessions, getTrial, iso, isTrialLive, logEvent, withLock } from './entitlements.js';
import { grantAccess } from './router-client.js';

export const trialRouter = Router();

// Small in-memory limiter, keyed per DEVICE (not per IP: behind a reverse
// proxy every customer shares one IP, so an IP limit would lock everyone
// out together). It only stops a script hammering the endpoint; the real
// guarantee is the one-trial-per-device check in claimTrial().
const MAX_CLAIMS_PER_MINUTE = 20;
const claimAttempts = new Map();
function rateLimited(deviceId) {
  const now = Date.now();
  if (claimAttempts.size > 5000) {
    for (const [key, times] of claimAttempts) if (now - times[times.length - 1] > 60_000) claimAttempts.delete(key);
  }
  const recent = (claimAttempts.get(deviceId) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  claimAttempts.set(deviceId, recent);
  return recent.length > MAX_CLAIMS_PER_MINUTE;
}

/** The single source of truth the frontend renders from. */
export function trialPayload(deviceId, now = Date.now()) {
  const base = { serverTime: iso(now), durationSeconds: TRIAL_SECONDS, secondsRemaining: 0 };
  const trial = getTrial(deviceId);

  if (trial) {
    if (trial.status === 'activating') return { ...base, status: 'activating', eligible: false };
    const live = isTrialLive(trial, now);
    return {
      ...base,
      status: live ? 'active' : 'expired',
      eligible: false,
      startedAt: trial.startedAt,
      expiresAt: trial.expiresAt,
      secondsRemaining: live ? Math.ceil((Date.parse(trial.expiresAt) - now) / 1000) : 0
    };
  }
  if (getPaidSessions(deviceId).length > 0) {
    return { ...base, status: 'ineligible', eligible: false, reason: 'The free trial is for new users only.' };
  }
  if (!isTrustedDevice(deviceId)) {
    return {
      ...base,
      status: 'ineligible',
      eligible: false,
      reason: 'We could not identify your device. Reconnect to the Wi-Fi network and reopen this page.'
    };
  }
  return { ...base, status: 'available', eligible: true };
}

trialRouter.get('/status', async (req, res) => {
  await db.read();
  res.json(trialPayload(deviceIdFromRequest(req)));
});

async function claimTrial(deviceId) {
  await db.read();
  const now = Date.now();

  // Idempotent for a trial that is already running (reload / double tap),
  // a hard "no" for one that was already used.
  const existing = getTrial(deviceId);
  if (existing) {
    const payload = trialPayload(deviceId, now);
    if (payload.status === 'active') return { http: 200, body: { ...payload, alreadyActive: true } };
    return {
      http: 409,
      body: { ...payload, code: 'TRIAL_ALREADY_USED', message: 'You have already used your free trial.' }
    };
  }
  if (getPaidSessions(deviceId).length > 0) {
    return {
      http: 409,
      body: { code: 'NOT_ELIGIBLE', message: 'The free trial is for new users only.' }
    };
  }

  // 1. Record the claim as 'activating' BEFORE touching the router, so a
  //    crash mid-claim can never lead to a second free trial.
  const trial = {
    id: uuid(),
    deviceId,
    status: 'activating',
    createdAt: iso(now),
    startedAt: null,
    expiresAt: null,
    expiredAt: null,
    enforced: false
  };
  db.data.trials.push(trial);
  logEvent('trial_claim_started', { deviceId, trialId: trial.id });
  await db.write();

  // 2. Actually open the network for TRIAL_SECONDS.
  let grant;
  try {
    grant = await grantAccess({ mac: deviceId, ip: null, seconds: TRIAL_SECONDS });
  } catch (err) {
    await db.read();
    const failed = db.data.trials.find((t) => t.id === trial.id);
    if (failed) {
      failed.status = 'failed'; // does not consume the offer
      failed.failedAt = iso(Date.now());
    }
    logEvent('trial_activation_failed', { deviceId, trialId: trial.id, error: String(err?.message || err) });
    await db.write();
    return {
      http: 502,
      body: { code: 'ACTIVATION_FAILED', message: 'We could not start your free time. Please try again.' }
    };
  }

  // 3. The clock starts now: server-generated, after access really opened.
  await db.read();
  const active = db.data.trials.find((t) => t.id === trial.id);
  const startedAt = Date.now();
  active.status = 'active';
  active.startedAt = iso(startedAt);
  active.expiresAt = iso(startedAt + TRIAL_SECONDS * 1000);
  active.enforced = !grant?.stub;
  logEvent('trial_activated', { deviceId, trialId: trial.id, expiresAt: active.expiresAt, enforced: active.enforced });
  await db.write();

  return { http: 201, body: trialPayload(deviceId, startedAt) };
}

trialRouter.post('/claim', async (req, res) => {
  const deviceId = deviceIdFromRequest(req);

  if (rateLimited(deviceId)) {
    return res.status(429).json({ code: 'RATE_LIMITED', message: 'Too many attempts. Wait a minute and try again.' });
  }
  if (!isTrustedDevice(deviceId)) {
    return res.status(400).json({
      code: 'DEVICE_UNKNOWN',
      message: 'We could not identify your device. Reconnect to the Wi-Fi network and reopen this page.'
    });
  }

  try {
    const { http, body } = await withLock(() => claimTrial(deviceId));
    res.status(http).json(body);
  } catch (err) {
    console.error('[trial] claim failed', err);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' });
  }
});
