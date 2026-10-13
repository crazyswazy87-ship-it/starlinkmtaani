export function Spinner({ color = '#04241a', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="spin"
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <path
        d="M4 12a8 8 0 0113.66-5.66M20 12a8 8 0 01-13.66 5.66M4 5v5h5M20 19v-5h-5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
