/** 83 -> "1:23", 3725 -> "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** 8100 -> "2h 15m", 90 -> "1m", 172800 -> "2d" */
export function formatRemaining(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${Math.max(1, m)}m`;
}

export function formatKsh(amount: number): string {
  return `Ksh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/** "2026-05" -> "May" */
export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-KE', { month: 'short', timeZone: 'UTC' });
}

const HEX12 = /^[0-9A-F]{12}$/;

/** Accepts AA:BB:..., aa-bb-..., aabb.ccdd.eeff or 12 bare hex digits. Returns AA:BB:CC:DD:EE:FF or null. */
export function normalizeMacInput(raw: string): string | null {
  const hex = raw.replace(/[\s:.-]/g, '').toUpperCase();
  if (!HEX12.test(hex)) return null;
  return hex.match(/.{2}/g)!.join(':');
}
