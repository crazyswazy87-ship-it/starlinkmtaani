import { useId, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { useTvConnections } from '../hooks/useTvConnections';
import type { DataPackage, SubscriptionSummary, TvConnection, TvConnectionState } from '../types';
import { formatDateTime, formatRemaining, normalizeMacInput } from '../utils/format';
import { PackageGrid } from './PackageGrid';
import { linkButton, primaryButton, secondaryButton } from './layout/buttonStyles';
import { Spinner } from './layout/Spinner';

interface Props {
  network: string;
  onBack: () => void;
  /** Reuses the normal package → M-PESA flow. */
  onSelectPackage: (pkg: DataPackage) => void;
}

const panel = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '16px 18px',
  marginBottom: 14
} as const;

export function ConnectTvPanel({ network, onBack, onSelectPackage }: Props) {
  const { overview, loading, busy, error, notice, connect, remove, refresh } = useTvConnections();

  return (
    <div className="scale-in">
      <button onClick={onBack} className="focus-ring" style={{ ...linkButton, marginBottom: 14 }}>
        ← Back
      </button>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 4px' }}>Connect your TV</h2>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
        Your active package covers your TV too. No extra payment.
      </p>

      {loading && (
        <p role="status" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '28px 0' }}>
          Checking your subscription…
        </p>
      )}

      {!loading && !overview && error && (
        <div style={panel}>
          <p role="alert" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </p>
          <button onClick={() => void refresh()} className="focus-ring" style={secondaryButton()}>
            Try again
          </button>
        </div>
      )}

      {overview && (
        <>
          <SubscriptionStatus subscription={overview.subscription} skewMs={overview.skewMs} />

          {notice && (
            <p role="status" style={{ ...panel, borderColor: 'var(--brand-dim)', background: 'var(--brand-tint)', color: 'var(--brand)', fontSize: 13, padding: '12px 16px' }}>
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" style={{ ...panel, borderColor: 'var(--danger)', background: 'var(--danger-tint)', color: 'var(--danger)', fontSize: 13, padding: '12px 16px' }}>
              {error}
            </p>
          )}

          {overview.subscription.status === 'active' ? (
            <>
              <ConnectForm
                disabled={busy || !overview.canConnect}
                busy={busy}
                limitReached={!overview.canConnect}
                tvLimit={overview.tvLimit}
                onSubmit={connect}
              />
              <TvList tvs={overview.tvs} busy={busy} onRemove={remove} onReconnect={connect} />
              <Instructions network={network} />
            </>
          ) : (
            <>
              <div style={panel}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
                  {overview.subscription.status === 'expired'
                    ? `Your ${overview.subscription.packageLabel ?? 'package'} has ended. Choose a package to connect your TV again.`
                    : 'You don’t have an active package yet. Choose one below to connect your TV.'}
                </p>
              </div>
              <PackageGrid onSelect={onSelectPackage} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// -- subscription status ---------------------------------------------------

const STATUS_STYLE: Record<SubscriptionSummary['status'], { label: string; color: string; tint: string }> = {
  active: { label: 'Active', color: 'var(--brand)', tint: 'var(--brand-tint)' },
  expired: { label: 'Expired', color: 'var(--warn)', tint: 'var(--warn-tint)' },
  inactive: { label: 'Inactive', color: 'var(--text-muted)', tint: 'var(--wabling)' }
};

function Chip({ label, color, tint }: { label: string; color: string; tint: string }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        color,
        background: tint,
        border: `1px solid ${color}`,
        borderRadius: 20,
        padding: '3px 10px',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  );
}

function SubscriptionStatus({ subscription, skewMs }: { subscription: SubscriptionSummary; skewMs: number }) {
  const style = STATUS_STYLE[subscription.status];
  return (
    <div style={{ ...panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Subscription</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{subscription.packageLabel ?? 'No package'}</div>
        {subscription.status === 'active' && subscription.expiresAt && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Expires in <ExpiresIn key={subscription.expiresAt} expiresAt={subscription.expiresAt} skewMs={skewMs} />
          </div>
        )}
        {subscription.status === 'expired' && subscription.expiresAt && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Ended {formatDateTime(subscription.expiresAt)}
          </div>
        )}
      </div>
      <Chip {...style} />
    </div>
  );
}

function ExpiresIn({ expiresAt, skewMs }: { expiresAt: string; skewMs: number }) {
  const left = useCountdown(expiresAt, skewMs);
  return <>{formatRemaining(left)}</>;
}

// -- connect form ---------------------------------------------------------------

function ConnectForm({
  disabled,
  busy,
  limitReached,
  tvLimit,
  onSubmit
}: {
  disabled: boolean;
  busy: boolean;
  limitReached: boolean;
  tvLimit: number;
  onSubmit: (tvMac: string, name: string) => Promise<boolean>;
}) {
  const [mac, setMac] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const macId = useId();
  const nameId = useId();
  const hintId = useId();

  const normalized = normalizeMacInput(mac);
  const showInvalid = touched && !normalized;

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    if (!normalized || disabled) return;
    if (await onSubmit(normalized, name)) {
      setMac('');
      setName('');
      setTouched(false);
    }
  };

  const inputStyle = (invalid: boolean) =>
    ({
      width: '100%',
      background: 'var(--surface-2)',
      border: `1px solid ${invalid ? 'var(--danger)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text)',
      padding: '12px 13px',
      fontSize: 14,
      fontFamily: 'inherit'
    }) as const;

  return (
    <form onSubmit={handleSubmit} style={panel} noValidate>
      <label htmlFor={nameId} style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>
        TV name (optional)
      </label>
      <input
        id={nameId}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder="Living room TV"
        disabled={disabled}
        className="focus-ring"
        style={{ ...inputStyle(false), marginBottom: 12 }}
      />

      <label htmlFor={macId} style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>
        TV Wi-Fi address (MAC)
      </label>
      <input
        id={macId}
        value={mac}
        onChange={(e) => setMac(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="AA:BB:CC:DD:EE:FF"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        aria-invalid={showInvalid}
        aria-describedby={hintId}
        className="focus-ring"
        style={{ ...inputStyle(showInvalid), fontFamily: 'var(--font-mono)', marginBottom: 6 }}
      />
      <p id={hintId} style={{ fontSize: 11.5, margin: '0 0 14px', color: showInvalid ? 'var(--danger)' : 'var(--text-faint)' }}>
        {showInvalid ? 'Enter 12 characters (0–9, A–F), e.g. AA:BB:CC:DD:EE:FF.' : 'Find it in your TV’s network settings. See how below.'}
      </p>

      {limitReached && (
        <p style={{ fontSize: 12.5, color: 'var(--warn)', margin: '0 0 12px' }}>
          You&rsquo;ve connected the maximum of {tvLimit} TVs. Remove one to add another.
        </p>
      )}

      <button type="submit" disabled={disabled || !normalized} aria-busy={busy} className="focus-ring" style={primaryButton(disabled || !normalized)}>
        {busy ? (
          <>
            <Spinner /> Connecting…
          </>
        ) : (
          'Connect TV'
        )}
      </button>
    </form>
  );
}

// -- connected TVs ------------------------------------------------------------------

const TV_STATUS: Record<TvConnectionState, { label: string; color: string; tint: string }> = {
  connected: { label: 'Connected', color: 'var(--brand)', tint: 'var(--brand-tint)' },
  connecting: { label: 'Connecting', color: 'var(--warn)', tint: 'var(--warn-tint)' },
  expired: { label: 'Expired', color: 'var(--warn)', tint: 'var(--warn-tint)' },
  failed: { label: 'Failed', color: 'var(--danger)', tint: 'var(--danger-tint)' }
};

function TvList({
  tvs,
  busy,
  onRemove,
  onReconnect
}: {
  tvs: TvConnection[];
  busy: boolean;
  onRemove: (id: string) => Promise<boolean>;
  onReconnect: (tvMac: string, name: string) => Promise<boolean>;
}) {
  if (tvs.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, margin: '0 0 8px' }}>Your TVs</h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {tvs.map((tv) => (
          <li key={tv.id} style={{ ...panel, marginBottom: 0, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tv.name}</div>
                <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{tv.tvMac}</div>
              </div>
              <Chip {...TV_STATUS[tv.status]} />
            </div>
            {tv.status === 'connected' && tv.expiresAt && (
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                Covered until {formatDateTime(tv.expiresAt)}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {(tv.status === 'expired' || tv.status === 'failed') && (
                <button
                  onClick={() => void onReconnect(tv.tvMac, tv.name)}
                  disabled={busy}
                  className="focus-ring"
                  style={secondaryButton(busy)}
                >
                  Reconnect
                </button>
              )}
              <button
                onClick={() => void onRemove(tv.id)}
                disabled={busy}
                aria-label={`Disconnect ${tv.name}`}
                className="focus-ring"
                style={secondaryButton(busy)}
              >
                Disconnect
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -- instructions ---------------------------------------------------------------------

function Instructions({ network }: { network: string }) {
  return (
    <details style={{ ...panel, padding: '12px 16px' }}>
      <summary className="focus-ring" style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>
        How to connect your TV
      </summary>
      <ol style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
        <li>
          On the TV, open <strong style={{ color: 'var(--text)' }}>Settings → Network → About / Status</strong> and note
          the <strong style={{ color: 'var(--text)' }}>Wi-Fi MAC address</strong> (not the Ethernet one).
        </li>
        <li>Enter it above and tap <strong style={{ color: 'var(--text)' }}>Connect TV</strong>.</li>
        <li>
          On the TV, join the <strong style={{ color: 'var(--text)' }}>{network}</strong> network. TVs often can&rsquo;t
          open sign-in pages, which is why we link it by address.
        </li>
        <li>
          If the TV shows a sign-in page, just wait a few seconds. Otherwise open any app and it should go online. If it
          stays offline, forget the network on the TV and join again.
        </li>
      </ol>
    </details>
  );
}
