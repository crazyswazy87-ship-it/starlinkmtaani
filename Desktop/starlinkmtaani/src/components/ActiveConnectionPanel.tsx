import { useEffect, useState } from 'react';
import type { ActiveSession } from '../types';
import { ActionRow, ChartIcon, TvIcon } from './layout/ActionRow';


const AUTO_CONNECT_SECONDS = 5;

export function ActiveConnectionPanel({
  activeSession,
  onConnect,
  onViewPackages,
  onOpenUsage,
  onAddDevice,
  onConnectTv
}: {
  activeSession: ActiveSession;
  onConnect: () => void;
  onViewPackages: () => void;
  onOpenUsage: () => void;
  onAddDevice: () => void;
  onConnectTv: () => void;
}) {
  const [countdown, setCountdown] = useState(AUTO_CONNECT_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      onConnect();
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  return (
    <div className="scale-in">
      <div
        style={{
          background: 'var(--brand-tint)',
          border: '1px solid var(--brand-dim)',
          borderRadius: 'var(--radius)',
          padding: '20px 20px 18px',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '1.5px solid var(--brand)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--brand)' }}>
            You have an active connection
          </span>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(34,232,163,0.18)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 14 }}>
            Package: <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{activeSession.packageLabel}</span>
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
            Expires in {activeSession.expiresInText}
          </p>
        </div>

        <div style={{ textAlign: 'center', padding: '18px 0 6px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
            You'll be connected automatically in
          </p>
          <button
            onClick={onConnect}
            className="focus-ring"
            style={{
              background: 'var(--brand)',
              border: '2px solid rgba(255,255,255,0.5)',
              color: '#04241a',
              borderRadius: 40,
              padding: '13px 30px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Connect now ({countdown})
          </button>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 14 }}>
          <button
            onClick={onViewPackages}
            className="focus-ring"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              cursor: 'pointer'
            }}
          >
            View all packages
          </button>
        </div>
      </div>

      <ActionRow
        icon={<ChartIcon />}
        title="My spending"
        subtitle="Payments, totals and subscription history."
        onClick={onOpenUsage}
      />
      <ActionRow
        icon={<TvIcon />}
        title="Connect your TV"
        subtitle="Included with your active package, no extra payment."
        onClick={onConnectTv}
      />
      <ActionRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
        title="Connect another device"
        subtitle="Connect a TV, phone, laptop, tablet or CCTV — each with its own package."
        onClick={onAddDevice}
      />
    </div>
  );
}
