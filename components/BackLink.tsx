import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="back-link">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10.5 3.25 4.75 8l5.75 4.75"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5.25 8h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {children}
    </Link>
  );
}
