import { v4 as uuid } from 'uuid';
import { db } from './db.js';
import { normalizeDeviceId } from './identity.js';

export const TRIAL_SECONDS = Number(process.env.TRIAL_SECONDS) || 30 * 60;
export const TV_LIMIT = Number(process.env.TV_LIMIT) || 2;

// -- one-at-a-time lock for state-changing routes ----------------------
// lowdb is a JSON file with no transactions. Anything that does
// "check eligibility -> call the router -> record it" must not
// interleave with another request doing the same, or two concurrent
// requests could both pass the check. This serialises them.
let tail = Promise.resolve();
export function withLock(fn) {
  const run = tail.then(() => fn());
  tail = run.catch(() => {});
  return run;
}

export const iso = (ms) => new Date(ms).toISOString();

export function logEvent(type, data = {}) {
  db.data.events.push({ id: uuid(), type, at: iso(Date.now()), ...data });
  if (db.data.events.length > 5000) db.data.events.splice(0, db.data.events.length - 5000);
}

// -- paid subscriptions ---------------------------------------------------
export function paidWindow(session) {
  const start = Date.parse(session.confirmedAt);
  return { start, end: start + session.hours * 3600 * 1000 };
}

export function getPaidSessions(deviceId) {
  const id = normalizeDeviceId(deviceId);
  return db.data.sessions.filter((s) => normalizeDeviceId(s.deviceId) === id);
}

/** Latest-expiring paid session that is still inside its window. */
export function getActivePaidSession(deviceId, now = Date.now()) {
  return (
    getPaidSessions(deviceId)
      .filter((s) => now < paidWindow(s).end)
      .sort((a, b) => paidWindow(b).end - paidWindow(a).end)[0] ?? null
  );
}

/** 'active' | 'expired' | 'inactive' — always derived server-side. */
export function subscriptionSummary(deviceId, now = Date.now()) {
  const active = getActivePaidSession(deviceId, now);
  if (active) {
    const { end } = paidWindow(active);
    return {
      status: 'active',
      packageLabel: active.packageLabel,
      expiresAt: iso(end),
      secondsRemaining: Math.max(0, Math.ceil((end - now) / 1000)),
      transactionId: active.transactionId
    };
  }
  const past = getPaidSessions(deviceId).sort((a, b) => paidWindow(b).end - paidWindow(a).end)[0];
  if (past) {
    return {
      status: 'expired',
      packageLabel: past.packageLabel,
      expiresAt: iso(paidWindow(past).end),
      secondsRemaining: 0,
      transactionId: past.transactionId
    };
  }
  return { status: 'inactive', packageLabel: null, expiresAt: null, secondsRemaining: 0, transactionId: null };
}

// -- free trial -------------------------------------------------------------
/** A trial that failed to activate never consumed the offer. */
export function getTrial(deviceId) {
  const id = normalizeDeviceId(deviceId);
  return (
    db.data.trials
      .filter((t) => t.deviceId === id && t.status !== 'failed')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null
  );
}

export function isTrialLive(trial, now = Date.now()) {
  return trial?.status === 'active' && now < Date.parse(trial.expiresAt);
}

// -- TV connections ---------------------------------------------------------
export function isTvLive(tv, now = Date.now()) {
  return tv.status === 'connected' && now < Date.parse(tv.expiresAt);
}
