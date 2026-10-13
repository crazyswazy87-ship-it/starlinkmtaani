import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from './db.js';
import { deviceIdFromRequest, normalizeMac } from './identity.js';
import {
  TV_LIMIT,
  getActivePaidSession,
  iso,
  isTvLive,
  logEvent,
  paidWindow,
  subscriptionSummary,
  withLock
} from './entitlements.js';
import { grantAccess, revokeAccess } from './router-client.js';

export const tvRouter = Router();

function tvView(tv, now) {
  const live = isTvLive(tv, now);
  return {
    id: tv.id,
    name: tv.name,
    tvMac: tv.tvMac,
    status: tv.status === 'connected' && !live ? 'expired' : tv.status,
    connectedAt: tv.connectedAt,
    expiresAt: tv.expiresAt
  };
}

function overview(deviceId, now = Date.now()) {
  const subscription = subscriptionSummary(deviceId, now);
  const mine = db.data.tvConnections.filter((t) => t.ownerDeviceId === deviceId && t.status !== 'removed');
  const liveCount = mine.filter((t) => isTvLive(t, now)).length;
  return {
    serverTime: iso(now),
    subscription,
    tvs: mine.map((t) => tvView(t, now)),
    tvLimit: TV_LIMIT,
    canConnect: subscription.status === 'active' && liveCount < TV_LIMIT
  };
}

tvRouter.get('/', async (req, res) => {
  await db.read();
  res.json(overview(deviceIdFromRequest(req)));
});

async function connectTv(ownerDeviceId, body) {
  await db.read();
  const now = Date.now();

  const tvMac = normalizeMac(body?.tvMac);
  if (!tvMac) {
    return { http: 400, body: { code: 'INVALID_MAC', message: 'Enter the TV’s Wi-Fi MAC address, e.g. AA:BB:CC:DD:EE:FF.' } };
  }
  if (tvMac === ownerDeviceId) {
    return { http: 400, body: { code: 'SAME_DEVICE', message: 'That is the address of this device. Enter your TV’s address.' } };
  }

  // The authorisation decision. Frontend state is never consulted.
  const session = getActivePaidSession(ownerDeviceId, now);
  if (!session) {
    return {
      http: 402,
      body: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'You need an active package to connect a TV.',
        subscription: subscriptionSummary(ownerDeviceId, now)
      }
    };
  }

  const existing = db.data.tvConnections.find((t) => t.tvMac === tvMac && t.status !== 'removed');
  if (existing && existing.ownerDeviceId !== ownerDeviceId && isTvLive(existing, now)) {
    return { http: 409, body: { code: 'TV_IN_USE', message: 'That TV is already connected under another package.' } };
  }
  if (existing && existing.ownerDeviceId === ownerDeviceId && isTvLive(existing, now)) {
    return { http: 200, body: { ...overview(ownerDeviceId, now), alreadyConnected: true } };
  }

  const liveCount = db.data.tvConnections.filter((t) => t.ownerDeviceId === ownerDeviceId && isTvLive(t, now)).length;
  if (liveCount >= TV_LIMIT) {
    return {
      http: 409,
      body: { code: 'TV_LIMIT_REACHED', message: `You can connect up to ${TV_LIMIT} TVs on one package. Remove one first.` }
    };
  }

  const { end } = paidWindow(session);
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 40) : 'My TV';

  // Record first, grant second (same pattern as the trial).
  const record = existing ?? { id: uuid(), tvMac };
  Object.assign(record, {
    name,
    ownerDeviceId,
    transactionId: session.transactionId,
    status: 'connecting',
    createdAt: record.createdAt ?? iso(now),
    connectedAt: null,
    expiresAt: iso(end)
  });
  if (!existing) db.data.tvConnections.push(record);
  logEvent('tv_connect_started', { ownerDeviceId, tvMac, tvId: record.id });
  await db.write();

  try {
    await grantAccess({ mac: tvMac, ip: null, seconds: Math.max(1, Math.floor((end - Date.now()) / 1000)) });
  } catch (err) {
    await db.read();
    const failed = db.data.tvConnections.find((t) => t.id === record.id);
    if (failed) failed.status = 'failed';
    logEvent('tv_connect_failed', { ownerDeviceId, tvMac, error: String(err?.message || err) });
    await db.write();
    return { http: 502, body: { code: 'ACTIVATION_FAILED', message: 'We could not connect your TV. Please try again.' } };
  }

  await db.read();
  const done = db.data.tvConnections.find((t) => t.id === record.id);
  done.status = 'connected';
  done.connectedAt = iso(Date.now());
  logEvent('tv_connected', { ownerDeviceId, tvMac, tvId: done.id, expiresAt: done.expiresAt });
  await db.write();

  return { http: 201, body: overview(ownerDeviceId) };
}

tvRouter.post('/connect', async (req, res) => {
  const ownerDeviceId = deviceIdFromRequest(req);
  try {
    const { http, body } = await withLock(() => connectTv(ownerDeviceId, req.body));
    res.status(http).json(body);
  } catch (err) {
    console.error('[tv] connect failed', err);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' });
  }
});

tvRouter.delete('/:id', async (req, res) => {
  const ownerDeviceId = deviceIdFromRequest(req);
  try {
    const out = await withLock(async () => {
      await db.read();
      const tv = db.data.tvConnections.find((t) => t.id === req.params.id && t.ownerDeviceId === ownerDeviceId && t.status !== 'removed');
      if (!tv) return { http: 404, body: { code: 'NOT_FOUND', message: 'TV not found.' } };
      const { tvMac, id } = tv;

      try {
        await revokeAccess({ mac: tvMac });
      } catch (err) {
        console.error('[tv] revoke failed', err);
        return { http: 502, body: { code: 'REVOKE_FAILED', message: 'We could not disconnect the TV. Please try again.' } };
      }

      await db.read();
      const fresh = db.data.tvConnections.find((t) => t.id === id);
      if (fresh) fresh.status = 'removed';
      logEvent('tv_removed', { ownerDeviceId, tvMac });
      await db.write();
      return { http: 200, body: overview(ownerDeviceId) };
    });
    res.status(out.http).json(out.body);
  } catch (err) {
    console.error('[tv] remove failed', err);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong. Please try again.' });
  }
});
