import { db } from './db.js';
import { getActivePaidSession, getTrial, iso, isTrialLive, logEvent, paidWindow, withLock } from './entitlements.js';
import { revokeAccess } from './router-client.js';

// The router's own session-timeout is the primary enforcement. This
// sweeper is the backstop: it ends access explicitly the moment a
// trial / package / TV is over, records it, and retries if the router
// was unreachable. It also recovers claims interrupted by a crash.

const STUCK_ACTIVATION_MS = 60_000;

async function tryRevoke(mac, failures, key) {
  try {
    await revokeAccess({ mac });
    failures.delete(key);
    return true;
  } catch (err) {
    const n = (failures.get(key) || 0) + 1;
    failures.set(key, n);
    if (n === 1 || n % 20 === 0) console.error(`[sweeper] revoke failed for ${mac} (attempt ${n}):`, err?.message || err);
    return false;
  }
}

const failures = new Map();

export function sweepExpired() {
  return withLock(async () => {
    await db.read();
    const now = Date.now();

    // Phase 1 (sync): decide what is due. Nothing is mutated yet because
    // the revoke calls below await, and other requests may reload db.data.
    const dueTrials = db.data.trials.filter((t) => t.status === 'active' && now >= Date.parse(t.expiresAt));
    const stuckTrials = db.data.trials.filter(
      (t) => t.status === 'activating' && now - Date.parse(t.createdAt) > STUCK_ACTIVATION_MS
    );
    const dueTvs = db.data.tvConnections.filter((t) => t.status === 'connected' && now >= Date.parse(t.expiresAt));
    const dueSessions = db.data.sessions.filter((s) => s.connectedAt && !s.revokedAt && now >= paidWindow(s).end);

    // Phase 2 (async): talk to the router.
    const done = { trials: [], stuck: [], tvs: [], sessions: [] };

    for (const t of dueTrials) {
      // A device that bought a package mid-trial must keep its access.
      const keep = getActivePaidSession(t.deviceId, now);
      if (keep || (await tryRevoke(t.deviceId, failures, `trial:${t.id}`))) done.trials.push(t.id);
    }
    for (const t of stuckTrials) {
      await tryRevoke(t.deviceId, failures, `stuck:${t.id}`);
      done.stuck.push(t.id);
    }
    for (const tv of dueTvs) {
      if (await tryRevoke(tv.tvMac, failures, `tv:${tv.id}`)) done.tvs.push(tv.id);
    }
    for (const s of dueSessions) {
      const stillCovered = getActivePaidSession(s.deviceId, now) || isTrialLive(getTrial(s.deviceId), now);
      if (stillCovered || (await tryRevoke(s.deviceId, failures, `session:${s.transactionId}`))) {
        done.sessions.push(s.transactionId);
      }
    }

    if (!Object.values(done).some((list) => list.length)) return done;

    // Phase 3: re-read and apply by id.
    await db.read();
    const stamp = iso(Date.now());
    for (const t of db.data.trials) {
      if (done.trials.includes(t.id)) {
        t.status = 'expired';
        t.expiredAt = stamp;
        logEvent('trial_expired', { deviceId: t.deviceId, trialId: t.id });
      } else if (done.stuck.includes(t.id)) {
        t.status = 'failed';
        t.failedAt = stamp;
        logEvent('trial_activation_abandoned', { deviceId: t.deviceId, trialId: t.id });
      }
    }
    for (const tv of db.data.tvConnections) {
      if (done.tvs.includes(tv.id)) {
        tv.status = 'expired';
        logEvent('tv_expired', { ownerDeviceId: tv.ownerDeviceId, tvMac: tv.tvMac });
      }
    }
    for (const s of db.data.sessions) {
      if (done.sessions.includes(s.transactionId)) {
        s.revokedAt = stamp;
        logEvent('session_expired', { deviceId: s.deviceId, transactionId: s.transactionId });
      }
    }
    await db.write();
    return done;
  });
}

export function startSweeper(intervalMs = 15_000) {
  const run = () => sweepExpired().catch((err) => console.error('[sweeper] failed', err));
  run(); // also recovers anything left over from a restart
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}
