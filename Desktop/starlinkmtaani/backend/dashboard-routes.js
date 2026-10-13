import { Router } from 'express';
import { db } from './db.js';
import { deviceIdFromRequest, normalizeDeviceId } from './identity.js';
import { PACKAGES } from './packages.js';
import { getPaidSessions, getTrial, subscriptionSummary, iso } from './entitlements.js';

export const dashboardRouter = Router();

// Months are bucketed in East Africa Time so a 00:30 purchase on the 1st
// lands in the right month for the customer.
const TZ_OFFSET_HOURS = Number(process.env.REPORT_TZ_OFFSET_HOURS ?? 3);
const monthKey = (ms) => new Date(ms + TZ_OFFSET_HOURS * 3600_000).toISOString().slice(0, 7);

function lastMonthKeys(count, now) {
  const d = new Date(now + TZ_OFFSET_HOURS * 3600_000);
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
  }
  return keys;
}

export function spendingPayload(deviceId, now = Date.now()) {
  const id = normalizeDeviceId(deviceId);
  const mine = db.data.transactions.filter((t) => normalizeDeviceId(t.deviceId) === id);
  const confirmed = mine
    .filter((t) => t.status === 'confirmed')
    .sort((a, b) => Date.parse(b.confirmedAt) - Date.parse(a.confirmedAt));

  const payments = confirmed.map((t) => ({
    id: t.id,
    packageLabel: PACKAGES[t.packageId]?.label ?? t.packageId,
    amount: t.amount,
    paidAt: t.confirmedAt,
    receipt: t.mpesaReceipt ?? null
  }));

  const sum = (rows) => rows.reduce((total, t) => total + t.amount, 0);
  const thisMonth = monthKey(now);
  const since30 = now - 30 * 24 * 3600_000;

  const totals = {
    lifetime: sum(confirmed),
    thisMonth: sum(confirmed.filter((t) => monthKey(Date.parse(t.confirmedAt)) === thisMonth)),
    last30Days: sum(confirmed.filter((t) => Date.parse(t.confirmedAt) >= since30)),
    purchaseCount: confirmed.length,
    averagePurchase: confirmed.length ? Math.round(sum(confirmed) / confirmed.length) : 0
  };

  const hoursBought = confirmed.reduce((h, t) => h + (PACKAGES[t.packageId]?.hours ?? 0), 0);

  const keys = lastMonthKeys(6, now);
  const monthly = keys.map((month) => ({
    month,
    total: sum(confirmed.filter((t) => monthKey(Date.parse(t.confirmedAt)) === month))
  }));

  const counts = {};
  for (const p of payments) counts[p.packageLabel] = (counts[p.packageLabel] || 0) + 1;
  const topPackage = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const trial = getTrial(id);
  return {
    serverTime: iso(now),
    currency: 'KES',
    totals,
    hoursPurchased: hoursBought,
    costPerHour: hoursBought ? Math.round((totals.lifetime / hoursBought) * 100) / 100 : 0,
    topPackage,
    monthly,
    payments: payments.slice(0, 50),
    subscription: subscriptionSummary(id, now),
    freeTrialUsed: Boolean(trial),
    pendingOrFailedCount: mine.filter((t) => t.status !== 'confirmed').length,
    sessionsCount: getPaidSessions(id).length
  };
}

dashboardRouter.get('/spending', async (req, res) => {
  await db.read();
  res.json(spendingPayload(deviceIdFromRequest(req)));
});
