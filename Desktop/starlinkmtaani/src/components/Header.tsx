import type { Screen } from "../types";
import konekt from "../../public/assets/images/konectlogo.png"

const HOPS: { key: Screen; label: string }[] = [
  { key: 'plans', label: 'Select' },
  { key: 'payment', label: 'Pay' },
  { key: 'connected', label: 'Connect' }
];

function hopIndex(screen: Screen): number {
  if (screen === 'checking' || screen === 'plans') return 0;
  if (screen === 'payment' || screen === 'pending') return 1;
  return 2;
}

export function Header({ screen, supportPhone, network }: { screen: Screen; supportPhone: string; network: string }) {
  const active = hopIndex(screen);
  const showSteps = screen !== 'tv' && screen !== 'dashboard';

  return (
    <header style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 34, height: 34, display: 'grid', placeItems: 'center' }}>
            <span
              className="pulse-ring"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '1.5px solid var(--brand)',
                animation: 'pulseRing 2.4s ease-out infinite'
              }}
            />
            <img 
              src={konekt}
              alt="!"
              className="konekt-icon"
            />
           
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>
            {network}
          </div>
        </div>
        <a
          href={`tel:${supportPhone}`}
          className="focus-ring"
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '6px 11px'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
            />
          </svg>
          {supportPhone}
        </a>
      </div>

      {showSteps && <div style={{ display: 'flex', alignItems: 'center' }}>
        {HOPS.map((hop, i) => {
          const state = i < active ? 'done' : i === active ? 'active' : 'upcoming';
          return (
            <div key={hop.key} style={{ display: 'flex', alignItems: 'center', flex: i < HOPS.length - 1 ? 1 : 'unset' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: state === 'upcoming' ? 'var(--border)' : 'var(--brand)',
                    boxShadow: state === 'active' ? '0 0 0 4px var(--brand-tint)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <span
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: state === 'upcoming' ? 'var(--text-faint)' : 'var(--text-muted)',
                    fontWeight: state === 'active' ? 600 : 500
                  }}
                >
                  {hop.label}
                </span>
              </div>
              {i < HOPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    margin: '0 6px 15px',
                    background:
                      i < active
                        ? 'var(--brand-dim)'
                        : 'repeating-linear-gradient(90deg, var(--border) 0 4px, transparent 4px 8px)'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>}
    </header>
  );
}
