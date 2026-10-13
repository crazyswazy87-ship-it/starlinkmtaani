import { useEffect, useState } from 'react';
import { errorMessage, getSpending } from '../services/api';
import type { SpendingSummary } from '../types';
import { formatDateTime, formatKsh, formatMonthShort } from '../utils/format';
import { linkButton, primaryButton, secondaryButton } from './layout/buttonStyles';

interface Props {
  onBack: () => void;
  onViewPackages: () => void;
}

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '14px 16px'
} as const;

export function DashboardPanel({ onBack, onViewPackages }: Props) {
  const [data, setData] = useState<SpendingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSpending()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load your spending.'));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <div className="scale-in">
      <button onClick={onBack} className="focus-ring" style={{ ...linkButton, marginBottom: 14 }}>
        ← Back
      </button>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 4px' }}>My spending</h2>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        What you&rsquo;ve paid for Wi-Fi on this device.
      </p>

      {!data && !error && (
        <p role="status" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
          Loading your spending…
        </p>
      )}

      {error && (
        <div style={card}>
          <p role="alert" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </p>
          <button onClick={retry} className="focus-ring" style={secondaryButton()}>
            Try again
          </button>
        </div>
      )}

      {data && <Report data={data} onViewPackages={onViewPackages} />}
    </div>
  );
}

function Report({ data, onViewPackages }: { data: SpendingSummary; onViewPackages: () => void }) {
  const { totals } = data;

  if (totals.purchaseCount === 0) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '28px 18px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>No payments yet</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Once you buy a package, your spending shows up here.
          {data.freeTrialUsed && ' Your free trial is already used.'}
        </p>
        <button onClick={onViewPackages} className="focus-ring" style={primaryButton()}>
          View packages
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label="This month" value={formatKsh(totals.thisMonth)} highlight />
        <Stat label="Last 30 days" value={formatKsh(totals.last30Days)} />
        <Stat label="All time" value={formatKsh(totals.lifetime)} />
        <Stat label="Average purchase" value={formatKsh(totals.averagePurchase)} />
      </div>

      <MonthlyChart monthly={data.monthly} />

      <div style={{ ...card, margin: '14px 0', padding: '4px 16px' }}>
        <Row label="Packages bought" value={String(totals.purchaseCount)} />
        <Row label="Hours purchased" value={`${data.hoursPurchased} h`} />
        <Row label="Average cost per hour" value={formatKsh(data.costPerHour)} />
        <Row label="Most bought" value={data.topPackage ?? '-'} />
        <Row label="Current package" value={data.subscription.status === 'active' ? data.subscription.packageLabel ?? 'Active' : 'None active'} />
        <Row label="Free trial" value={data.freeTrialUsed ? 'Used' : 'Not used'} last />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, margin: '0 0 8px' }}>Payments</h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {data.payments.map((p) => (
          <li key={p.id} style={{ ...card, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.packageLabel}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {formatDateTime(p.paidAt)}
                {p.receipt && <span style={{ fontFamily: 'var(--font-mono)' }}> · {p.receipt}</span>}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--brand)', whiteSpace: 'nowrap' }}>
              {formatKsh(p.amount)}
            </div>
          </li>
        ))}
      </ul>

      {data.pendingOrFailedCount > 0 && (
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: '12px 0 0', lineHeight: 1.5 }}>
          {data.pendingOrFailedCount} payment attempt{data.pendingOrFailedCount === 1 ? '' : 's'} didn&rsquo;t complete
          and {data.pendingOrFailedCount === 1 ? 'isn’t' : 'aren’t'} counted.
        </p>
      )}
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        ...card,
        ...(highlight ? { background: 'var(--brand-tint)', borderColor: 'var(--brand-dim)' } : null)
      }}
    >
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 500, color: highlight ? 'var(--brand)' : 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '11px 0',
        borderBottom: last ? 'none' : '1px solid var(--border-soft)',
        fontSize: 13
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const CHART_HEIGHT = 96;

function MonthlyChart({ monthly }: { monthly: SpendingSummary['monthly'] }) {
  const max = Math.max(...monthly.map((m) => m.total), 1);
  const summary = monthly.map((m) => `${formatMonthShort(m.month)}: ${formatKsh(m.total)}`).join(', ');

  return (
    <figure style={{ ...card, margin: 0 }}>
      <figcaption style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>Spending, last 6 months</figcaption>
      <div role="img" aria-label={`Spending by month. ${summary}`} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: CHART_HEIGHT + 34 }}>
        {monthly.map((m, i) => {
          const h = m.total > 0 ? Math.max(4, Math.round((m.total / max) * CHART_HEIGHT)) : 2;
          const current = i === monthly.length - 1;
          return (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minHeight: 12 }}>
                {m.total > 0 ? m.total.toLocaleString('en-KE') : ''}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 36,
                  height: h,
                  borderRadius: '4px 4px 0 0',
                  background: m.total > 0 ? (current ? 'var(--brand)' : 'var(--brand-dim)') : 'var(--border-soft)'
                }}
              />
              <span style={{ fontSize: 10.5, color: current ? 'var(--text)' : 'var(--text-faint)' }}>{formatMonthShort(m.month)}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
