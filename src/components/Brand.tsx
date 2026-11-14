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
        d="M20 3.5 36.5 13v14L20 36.5 3.5 27V13L20 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="m20 11 9 5.2v7.6L20 29l-9-5.2v-7.6L20 11Z" fill="currentColor" />
      <path
        d="M20 3.5V11M36.5 13 29 17M36.5 27 29 23M20 36.5V29M3.5 27l7.5-4M3.5 13l7.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
