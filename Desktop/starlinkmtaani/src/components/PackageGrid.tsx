
import ShinyText from '../componet/ShinyText';
import { PACKAGES } from '../data/packages';
import type { DataPackage } from '../types';

function PackageCard({ pkg, onSelect }: { pkg: DataPackage; onSelect: (pkg: DataPackage) => void }) {
  return (
    <>

    <button
      onClick={() => onSelect(pkg)}
      className="focus-ring packo"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-dim)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--brand)' }}>
        Ksh {pkg.price}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{pkg.label}</div>
      <ShinyText
      text={pkg.durationText}
      speed={6}
      delay={0}
      color="#898585"
      shineColor="#ffffff"
      spread={120}
      direction="left"
      yoyo={false}
      pauseOnHover
      disabled={false}
      className="b7-duration"
    />
    </button>
    </>
  );
}

export function PackageGrid({ onSelect }: { onSelect: (pkg: DataPackage) => void }) {
  return (
    <div className="scale-in">
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, margin: '0 0 3px' }}>
        Choose a package
      </p>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        Pay with M-PESA. Access starts the moment payment is confirmed.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PACKAGES.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
