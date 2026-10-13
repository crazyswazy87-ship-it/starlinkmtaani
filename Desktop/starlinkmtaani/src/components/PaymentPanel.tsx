import { useState } from 'react'
import type { DataPackage } from '../types';

interface Props {
  pkg: DataPackage;
  paybill: string;
  accountRef: string;
  onBack: () => void;
  onSubmit: (phone: string) => Promise<void>;
}

function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (/^2547\d{8}$/.test(digits) || /^2541\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{label}</span>
      <button
        className="focus-ring"
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => undefined);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--brand)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13.5,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        {value}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          {copied ? (
            <path d="M5 12.5l4.5 4.5L19 7" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <rect x="8" y="8" width="12" height="12" rx="2" stroke="var(--text-muted)" strokeWidth="1.6" />
          )}
          {!copied && <path d="M4 16V5a1 1 0 011-1h11" stroke="var(--text-muted)" strokeWidth="1.6" />}
        </svg>
      </button>
    </div>
  );
}

export function PaymentPanel({ pkg, paybill, accountRef, onBack, onSubmit }: Props) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) {
      setError('Enter a valid Safaricom number, e.g. 0712345678');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start payment. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="scale-in">
      <button
        onClick={onBack}
        className="focus-ring"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 12.5,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to packages
      </button>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{pkg.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pkg.durationText}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 19, color: 'var(--brand)' }}>Ksh {pkg.price}</div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px 18px',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--mpesa)' }}>
            M-PESA
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Lipa na M-PESA</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 6px' }}>
          We'll send a payment prompt to your phone. You can also pay manually with the details below.
        </p>
        <div style={{ borderTop: '1px solid var(--border-soft)' }}>
          <CopyField label="Paybill" value={paybill} />
          <div style={{ borderTop: '1px solid var(--border-soft)' }} />
          <CopyField label="Account number" value={accountRef} />
        </div>
      </div>

      <label style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
        M-PESA phone number
      </label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="07XX XXX XXX"
        inputMode="tel"
        className="focus-ring"
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '13px 14px',
          fontSize: 15,
          color: 'var(--text)',
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          marginBottom: error ? 6 : 18
        }}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 14px' }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="focus-ring"
        style={{
          width: '100%',
          background: submitting ? 'var(--mpesa-dim)' : 'var(--mpesa)',
          color: '#0a1a0c',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '15px',
          fontSize: 15,
          fontWeight: 600,
          cursor: submitting ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        {submitting ? (
          <>
            <span
              className="spin"
              style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(10,26,12,0.35)',
                borderTopColor: '#0a1a0c',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }}
            />
            Sending prompt…
          </>
        ) : (
          `Send M-PESA prompt · Ksh ${pkg.price}`
        )}
      </button>
    </div>
  );
}
