import axios from 'axios';

/**
 * This is the one piece that's genuinely site-specific: how your
 * router grants (and removes) internet access.
 *
 * Two common real-world options:
 *  1. MikroTik hotspot — call RouterOS's REST/API to add the client's
 *     MAC/IP to the "authorized" address list or bind it to a user
 *     profile with the right rate-limit and session-timeout.
 *  2. RADIUS (FreeRADIUS, etc.) — send a CoA (Change of Authorization)
 *     packet to move the session from the walled-garden profile to a
 *     full-access profile (and a Disconnect-Request to end it).
 *
 * Wire ROUTER_API_URL / ROUTER_API_KEY / ROUTER_REVOKE_URL in .env to
 * point this at your gear. Until then it just logs ("stub" mode), so the
 * rest of the app is testable without hardware — BUT in stub mode nothing
 * is actually cut off when a package or free trial ends.
 */
export const isRouterConfigured = () => Boolean(process.env.ROUTER_API_URL);

const authHeaders = () => ({ Authorization: `Bearer ${process.env.ROUTER_API_KEY}` });

/**
 * Grants access for `seconds` (preferred) or `hours` (legacy callers).
 * The router MUST also apply this as a hard session timeout so access
 * ends even if this server is down when the time runs out.
 */
export async function grantAccess({ mac, ip, hours, seconds }) {
  const durationSeconds = Math.max(1, Math.round(seconds ?? (hours ?? 0) * 3600));
  const url = process.env.ROUTER_API_URL;
  if (!url) {
    console.log(`[router] (stub) would grant ${durationSeconds}s access to mac=${mac} ip=${ip}`);
    return { granted: true, stub: true };
  }

  const res = await axios.post(
    url,
    { mac, ip, durationSeconds, durationHours: durationSeconds / 3600 },
    { headers: authHeaders(), timeout: 10000 }
  );
  return res.data;
}

/** Ends a device's access immediately (trial / package / TV expiry). */
export async function revokeAccess({ mac }) {
  if (!isRouterConfigured()) {
    console.log(`[router] (stub) would revoke access for mac=${mac}`);
    return { revoked: true, stub: true };
  }
  const url = process.env.ROUTER_REVOKE_URL;
  if (!url) throw new Error('ROUTER_REVOKE_URL is not configured, cannot revoke access');

  const res = await axios.post(url, { mac }, { headers: authHeaders(), timeout: 10000 });
  return res.data;
}
