import type { ReactNode } from 'react';

export function ActionRow({
  icon,
  title,
  subtitle,
  onClick
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="focus-ring"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        marginBottom: 10,
        cursor: 'pointer',
        color: 'inherit'
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--brand-tint)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brand)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function TvIcon() {
  return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="12" rx="2" stroke="var(--brand)" strokeWidth="2" />
    <path d="M8 21h8" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
  </svg>
  );
}

export function ChartIcon() {
  return (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 20V10M11 20V4M18 20v-6" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
  );
}
