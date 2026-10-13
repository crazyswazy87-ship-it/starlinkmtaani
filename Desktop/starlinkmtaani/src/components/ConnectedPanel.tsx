import type { SessionInfo } from "../types";


function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export function ConnectedPanel({ session, onNewPackage }: { session: SessionInfo; onNewPackage: () => void }) {
  return (
    <div className="scale-in">
      <div style={{ textAlign: 'center', padding: '8px 0 22px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--brand-tint)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 4px' }}>You're connected</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{session.packageLabel}</p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '4px 18px'
        }}
      >
        <DataRow label="IP address" value={session.ipAddress} mono />
        <DataRow label="Bytes up / down" value={`${formatBytes(session.bytesUp)} / ${formatBytes(session.bytesDown)}`} mono />
        <DataRow label="Connected" value={formatDuration(session.connectedSeconds)} mono />
        <DataRow label="Time remaining" value={formatDuration(session.secondsRemaining)} mono last />
      </div>

      <button
        onClick={onNewPackage}
        className="focus-ring"
        style={{
          width: '100%',
          marginTop: 16,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: 'var(--radius-sm)',
          padding: '13px',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Buy another package
      </button>
    </div>
  );
}

function DataRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '13px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-soft)',
        fontSize: 13.5
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : undefined, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
