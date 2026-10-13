import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { db, initDb } from './db.js';
import { stkPush } from './mpesa.js';
import { PACKAGES } from './packages.js';
import { grantAccess, isRouterConfigured } from './router-client.js';
import { deviceIdFromRequest, normalizeDeviceId } from './identity.js';
import { paidWindow } from './entitlements.js';
import { trialRouter } from './trial-routes.js';
import { tvRouter } from './tv-routes.js';
import { dashboardRouter } from './dashboard-routes.js';
import { startSweeper } from './sweeper.js';

const app = express();
app.use(cors());
app.use(express.json());

await initDb();

// -- device identity --------------------------------------------------
// See identity.js. A captive portal normally reaches this page via a
// redirect that includes the client's MAC address (e.g. RouterOS's
// $(mac) macro); the frontend forwards it as ?mac= on every API call.

app.get('/api/health', (req, res) => res.json({ ok: true, routerConfigured: isRouterConfigured() }));

// -- 1. start a payment ------------------------------------------------
app.post('/api/payments/initiate', async (req, res) => {
  const { packageId, phone } = req.body || {};
  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ message: 'Unknown package' });
  if (!/^254(7|1)\d{8}$/.test(phone || '')) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }

  const transactionId = uuid();
  const deviceId = deviceIdFromRequest(req);

  const transaction = {
    id: transactionId,
    packageId,
    phone,
    amount: pkg.price,
    status: 'pending',
    deviceId,
    createdAt: new Date().toISOString(),
    checkoutRequestId: null,
    mpesaReceipt: null,
    confirmedAt: null,
    connectedAt: null
  };

  await db.read();
  db.data.transactions.push(transaction);
  await db.write();

  try {
    const stkRes = await stkPush({
      phone,
      amount: pkg.price,
      accountRef: 'WIFI-GUEST',
      description: pkg.label
    });

    // Re-find the record: other requests call db.read() while we awaited
    // Safaricom, which replaces db.data, so our old reference is stale.
    await db.read();
    const fresh = db.data.transactions.find((t) => t.id === transactionId);
    fresh.checkoutRequestId = stkRes.CheckoutRequestID;
    await db.write();
  } catch (err) {
    await db.read();
    const fresh = db.data.transactions.find((t) => t.id === transactionId);
    if (fresh) {
      fresh.status = 'failed';
      fresh.reason = 'Could not reach M-PESA. Try again.';
      await db.write();
    }
    return res.status(502).json({ message: 'Could not start M-PESA payment. Please try again.' });
  }

  res.json({ transactionId });
});

// -- 2. Safaricom's asynchronous result ---------------------------------
// This is the ONLY place a transaction is allowed to become
// "confirmed". The frontend polls for this; it never sets the status
// itself. That's the "db accept confirmed to launch" gate: access is
// only unlocked once Safaricom's own callback has written it here.
app.post('/api/mpesa/callback', async (req, res) => {
  const callback = req.body?.Body?.stkCallback;
  if (!callback) return res.sendStatus(200);

  await db.read();
  const transaction = db.data.transactions.find((t) => t.checkoutRequestId === callback.CheckoutRequestID);
  if (!transaction) return res.sendStatus(200);

  if (callback.ResultCode === 0) {
    const items = callback.CallbackMetadata?.Item || [];
    const get = (name) => items.find((i) => i.Name === name)?.Value;

    transaction.status = 'confirmed';
    transaction.mpesaReceipt = get('MpesaReceiptNumber');
    transaction.confirmedAt = new Date().toISOString();

    const pkg = PACKAGES[transaction.packageId];
    db.data.sessions.push({
      transactionId: transaction.id,
      deviceId: transaction.deviceId,
      packageId: transaction.packageId,
      packageLabel: pkg.label,
      hours: pkg.hours,
      confirmedAt: transaction.confirmedAt,
      connectedAt: null,
      ip: null
    });
  } else {
    transaction.status = 'failed';
    transaction.reason = callback.ResultDesc || 'Payment was not completed';
  }

  await db.write();
  res.sendStatus(200);
});

// -- 3. frontend polls this — reflects the DB, nothing else -----------
app.get('/api/payments/:id', async (req, res) => {
  await db.read();
  const transaction = db.data.transactions.find((t) => t.id === req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  res.json(transaction);
});

// -- 5. does this device already have a live package? -------------------
// (declared BEFORE '/api/sessions/:transactionId', otherwise Express
// treats the word "active" as a transaction id and this never runs)
app.get('/api/sessions/active', async (req, res) => {
  await db.read();
  const deviceId = deviceIdFromRequest(req);
  const now = Date.now();

  const active = db.data.sessions
    .filter((s) => normalizeDeviceId(s.deviceId) === deviceId)
    .filter((s) => now < paidWindow(s).end)
    .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))[0];

  if (!active) return res.status(404).json({ message: 'No active session' });

  const remainingMs = active.hours * 3600 * 1000 - (now - new Date(active.confirmedAt).getTime());
  const remainingHours = Math.max(0, Math.ceil(remainingMs / 3600000));

  res.json({
    transactionId: active.transactionId,
    packageLabel: active.packageLabel,
    expiresInText: remainingHours <= 1 ? 'less than an hour' : `${remainingHours} hours`
  });
});

// -- 4. session info once confirmed -------------------------------------
app.get('/api/sessions/:transactionId', async (req, res) => {
  await db.read();
  const session = db.data.sessions.find((s) => s.transactionId === req.params.transactionId);
  if (!session) return res.status(404).json({ message: 'No session for this transaction yet' });

  const connectedSeconds = session.connectedAt ? (Date.now() - new Date(session.connectedAt).getTime()) / 1000 : 0;
  const elapsedFromConfirm = (Date.now() - new Date(session.confirmedAt).getTime()) / 1000;
  const totalSeconds = session.hours * 3600;

  res.json({
    ipAddress: session.ip || '10.10.8.7',
    bytesUp: Math.round(1030 + connectedSeconds * 40),
    bytesDown: Math.round(120 + connectedSeconds * 900),
    connectedSeconds: Math.round(connectedSeconds),
    secondsRemaining: Math.max(0, Math.round(totalSeconds - elapsedFromConfirm)),
    packageLabel: session.packageLabel
  });
});

// -- 6. explicit "connect now" — this is where we actually lift the ----
// walled-garden restriction on the router / RADIUS side.
app.post('/api/sessions/:transactionId/connect', async (req, res) => {
  await db.read();
  const session = db.data.sessions.find((s) => s.transactionId === req.params.transactionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const remainingSeconds = Math.floor((paidWindow(session).end - Date.now()) / 1000);
  if (remainingSeconds <= 0) return res.status(410).json({ message: 'This package has expired' });

  session.connectedAt = new Date().toISOString();
  session.ip = session.ip || `10.10.8.${7 + (db.data.sessions.length % 200)}`;
  await db.write();

  // Grant what is LEFT of the package (it started at payment, not now).
  await grantAccess({ mac: session.deviceId, ip: session.ip, seconds: remainingSeconds });

  res.json({ ok: true });
});

app.use('/api/trial', trialRouter);
app.use('/api/tv', tvRouter);
app.use('/api/dashboard', dashboardRouter);

if (!isRouterConfigured()) {
  console.warn(
    '[router] ROUTER_API_URL is not set: running in STUB mode. Trials, packages and TVs are tracked in the ' +
      'database but NO real network access is granted or cut off. Configure the router before going live.'
  );
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Captive portal backend listening on :${port}`);
  startSweeper(Number(process.env.SWEEP_INTERVAL_MS) || 15_000);
});
