export function ThroughlineLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="throughline-bg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0075e7" />
          <stop offset="1" stopColor="#002855" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#throughline-bg)" />
      <path d="M5.6 16.2h20.8" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8.6" cy="16.2" r="3.15" fill="#00c18e" />
      <circle cx="16" cy="16.2" r="3.15" fill="#f5c14a" />
      <path
        d="M21.7 16.55V12.75A1.8 1.8 0 0 1 25.3 12.75V13.45"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="20.45" y="14.55" width="6.1" height="5.3" rx="1.1" fill="#ffffff" />
    </svg>
  );
}
