export default function LeafDivider({ className = '' }) {
  return (
    <div className={`leaf-divider ${className}`} aria-hidden="true">
      <svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 14 H40" stroke="currentColor" strokeWidth="1" />
        <path d="M80 14 H120" stroke="currentColor" strokeWidth="1" />
        <path
          d="M60 4C64 8 68 10 74 10C68 12 64 16 60 22C56 16 52 12 46 10C52 10 56 8 60 4Z"
          fill="currentColor"
        />
        <path d="M60 10V17" stroke="var(--color-forest)" strokeWidth="1" />
      </svg>
    </div>
  );
}
