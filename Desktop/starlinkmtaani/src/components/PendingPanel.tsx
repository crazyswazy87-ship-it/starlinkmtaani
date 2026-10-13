import type { DataPackage, TransactionStatus } from "../types";


interface Props {
  pkg: DataPackage;
  phone: string;
  status: TransactionStatus;
  onRefresh: () => void;
  onCancel: () => void;
  refreshing: boolean;
}

const COPY: Record<string, { title: string; body: string }> = {
  pending: {
    title: 'Waiting for confirmation',
    body: 'Enter your M-PESA PIN on your phone to complete the payment. This screen updates automatically once it clears.'
  },
  failed: {
    title: 'Payment did not go through',
    body: 'The prompt was cancelled or timed out. You can try again with the same or a different number.'
  },
  timeout: {
    title: 'Still waiting',
    body: "We haven't heard back from M-PESA yet. If you've already paid, tap refresh — otherwise try sending the prompt again."
  }
};

export function PendingPanel({ pkg, phone, status, onRefresh, onCancel, refreshing }: Props) {
  const isFailed = status === 'failed' || status === 'timeout';
  const copy = COPY[status] ?? COPY.pending;

  return (
    <div className="scale-in" style={{ textAlign: 'center', paddingTop: 12 }}>
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 22px',
          borderRadius: '50%',
          background: isFailed ? 'var(--danger-tint)' : 'var(--warn-tint)',
          display: 'grid',
          placeItems: 'center',
          position: 'relative'
        }}
      >
        {!isFailed && (
          <span
            className="pulse-ring"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1.5px solid var(--warn)',
              animation: 'pulseRing 1.8s ease-out infinite'
            }}
          />
        )}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          {isFailed ? (
            <path d="M12 8v5m0 3.5h.01M12 3l9.5 16.5H2.5L12 3z" stroke="var(--danger)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M12 6v6l4 2" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: '0 0 8px' }}>{copy.title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 auto 22px', maxWidth: 320, lineHeight: 1.55 }}>
        {copy.body}
      </p>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          textAlign: 'left',
          fontSize: 13,
          marginBottom: 22
        }}
      >
        <Row label="Package" value={pkg.label} />
        <Row label="Amount" value={`Ksh ${pkg.price}`} />
        <Row label="Phone" value={phone} mono last />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          className="focus-ring"
          style={{
            flex: 1,
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
          Back
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="focus-ring"
          style={{
            flex: 1,
            background: 'var(--brand)',
            border: 'none',
            color: '#04241a',
            borderRadius: 'var(--radius-sm)',
            padding: '13px',
            fontSize: 14,
            fontWeight: 600,
            cursor: refreshing ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={refreshing ? 'spin' : undefined}
            style={refreshing ? { animation: 'spin 0.7s linear infinite' } : undefined}
          >
            <path
              d="M4 12a8 8 0 0113.66-5.66M20 12a8 8 0 01-13.66 5.66M4 5v5h5M20 19v-5h-5"
              stroke="#04241a"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '7px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-soft)'
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : undefined, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
