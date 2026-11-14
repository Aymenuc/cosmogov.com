import Link from "next/link";
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M20 5v8m0 14v8M7 12l7 4m12 8 7 4M7 28l7-4m12-8 7-4"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="4" fill="#FF785F" />
    </svg>
  );
}
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Cosmogov home"
      className={`brand ${light ? "brand-light" : ""}`}
    >
      <BrandMark />
      <span>
        cosmogov<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
