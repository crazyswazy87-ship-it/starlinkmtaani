import type { CSSProperties } from 'react';

// Same look as the existing inline-styled buttons (PendingPanel, ConnectedPanel),
// shared so the new screens don't each re-declare them.

export function primaryButton(disabled = false): CSSProperties {
  return {
    width: '100%',
    background: 'var(--brand)',
    border: 'none',
    color: '#04241a',
    borderRadius: 'var(--radius-sm)',
    padding: '13px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  };
}

export function secondaryButton(disabled = false): CSSProperties {
  return {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1
  };
}

export const linkButton: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 13,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
  padding: 0
};
