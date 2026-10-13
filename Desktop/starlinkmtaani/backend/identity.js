// Device identity helpers shared by every route.
//
// A captive portal has no user accounts: the "user" is the device the
// router redirected here, identified by its MAC address. Normalising it
// in ONE place means "aa-bb-cc..." and "AA:BB:CC..." are the same
// device for sessions, trials and TV connections.

const MAC_RE = /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/i;

export const DEMO_DEVICE = 'demo-device';

export function normalizeMac(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!MAC_RE.test(trimmed)) return null;
  return trimmed.toUpperCase().replace(/-/g, ':');
}

export function normalizeDeviceId(value) {
  if (typeof value !== 'string' || !value.trim()) return DEMO_DEVICE;
  return normalizeMac(value) ?? value.trim();
}

export function deviceIdFromRequest(req) {
  return normalizeDeviceId(req.query.mac || req.headers['x-device-id']);
}

/**
 * The free trial is keyed on the device identity, so it must be a real
 * one. The 'demo-device' fallback is shared by everybody, so it is only
 * accepted outside production (local development / demos).
 */
export function isTrustedDevice(deviceId) {
  if (normalizeMac(deviceId)) return true;
  return deviceId === DEMO_DEVICE && process.env.NODE_ENV !== 'production';
}
