import { useCountdown } from '../hooks/useCountdown';
import type { TrialStatus, WithSkew } from '../types';
import { formatClock } from '../utils/format';
import { primaryButton } from './layout/buttonStyles';
import { Spinner } from './layout/Spinner';

interface Props {
  trial: WithSkew<TrialStatus> | null;
  loading: boolean;
  claiming: boolean;
  error: string | null;
  onClaim: () => void;
  /** Called when the on-screen timer hits zero, so the page re-checks with the server. */
  onExpired: () => void;
  onChoosePlan: () => void;
}

const card = {
  borderRadius: 'var(--radius)',
  padding: '18px 18px 16px',
  marginBottom: 18
} as const;

export function TrialCard({ trial, loading, claiming, error, onClaim, onExpired, onChoosePlan }: Props) {
  if (!trial) {
    return loading ? (
      <p role="status" style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 18px' }}>
        Checking for a free offer…
      </p>
    ) : null;
  }

  if (trial.status === 'available') {
    return (
      <section
        aria-labelledby="trial-title"
        style={{ ...card, background: 'var(--brand-tint)', border: '1px solid var(--brand-dim)' }}
      >
        <p style={{ margin: '0 0 2px', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 600 }}>
          New here?
        </p>
        <h2 id="trial-title" style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 6px' }}>
          First connection free
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Try the Wi-Fi for {Math.round(trial.durationSeconds / 60)} minutes on us. No payment needed. The timer starts
          only once you&rsquo;re connected, and you can use this offer once.
        </p>
        <button onClick={onClaim} disabled={claiming} aria-busy={claiming} className="focus-ring" style={primaryButton(claiming)}>
          {claiming ? (
            <>
              <Spinner /> Connecting…
            </>
          ) : (
            `Get ${Math.round(trial.durationSeconds / 60)} Minutes Free`
          )}
        </button>
        {error && <ErrorLine message={error} />}
      </section>
    );
  }

  if (trial.status === 'activating') {
    return (
      <section style={{ ...card, background: 'var(--brand-tint)', border: '1px solid var(--brand-dim)' }}>
        <p role="status" style={{ margin: 0, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Spinner color="var(--brand)" /> Starting your free time…
        </p>
      </section>
    );
  }

  if (trial.status === 'active' && trial.expiresAt) {
    return (
      <ActiveTrial
        key={trial.expiresAt}
        expiresAt={trial.expiresAt}
        skewMs={trial.skewMs}
        durationSeconds={trial.durationSeconds}
        onExpired={onExpired}
      />
    );
  }

  if (trial.status === 'expired') {
    return (
      <section
        aria-labelledby="trial-title"
        style={{ ...card, background: 'var(--warn-tint)', border: '1px solid var(--warn)' }}
      >
        <h2 id="trial-title" style={{ fontFamily: 'var(--font-display)', fontSize: 17, margin: '0 0 6px', color: 'var(--warn)' }}>
          Your free time has ended
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Hope you enjoyed it. Pick a package below to stay connected. You pay with M-PESA and access starts the
          moment payment is confirmed.
        </p>
        <button onClick={onChoosePlan} className="focus-ring" style={primaryButton()}>
          Choose a package
        </button>
      </section>
    );
  }

  // 'ineligible' (existing customer): nothing to show.
  return null;
}

function ActiveTrial({
  expiresAt,
  skewMs,
  durationSeconds,
  onExpired
}: {
  expiresAt: string;
  skewMs: number;
  durationSeconds: number;
  onExpired: () => void;
}) {
  const remaining = useCountdown(expiresAt, skewMs, onExpired);
  const pct = Math.min(100, Math.max(0, (remaining / durationSeconds) * 100));
  const low = remaining <= 300;

  return (
    <section
      aria-labelledby="trial-title"
      style={{ ...card, background: 'var(--brand-tint)', border: '1px solid var(--brand-dim)' }}
    >
      <h2 id="trial-title" style={{ fontFamily: 'var(--font-display)', fontSize: 15, margin: '0 0 2px', color: 'var(--brand)' }}>
        You&rsquo;re online. Free trial running
      </h2>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 10px' }}>Time left on your free connection</p>
      <div
        role="timer"
        aria-label={`${formatClock(remaining)} remaining`}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: low ? 'var(--warn)' : 'var(--text)',
          marginBottom: 12
        }}
      >
        {formatClock(remaining)}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={remaining}
        aria-label="Free time remaining"
        style={{ height: 6, borderRadius: 3, background: 'var(--border-soft)', overflow: 'hidden', marginBottom: 12 }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: low ? 'var(--warn)' : 'var(--brand)',
            transition: 'width 1s linear'
          }}
        />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        When it ends, access stops automatically. You can buy a package below at any time to keep going.
      </p>
    </section>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" style={{ fontSize: 12.5, color: 'var(--danger)', margin: '10px 0 0', lineHeight: 1.45 }}>
      {message}
    </p>
  );
}
