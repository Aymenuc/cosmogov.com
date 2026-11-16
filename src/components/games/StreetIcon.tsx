/** Flat sticker icons for Dream street, in the house style (ink outline, warm palette). */
const INK = "#29223d";
const s = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

export default function StreetIcon({ id, size = 56 }: { id: string; size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true" focusable="false">
      {id === "trees" && (
        <>
          <rect x="27" y="36" width="6" height="18" fill="#a46a3c" {...s} />
          <circle cx="30" cy="26" r="16" fill="#3e9b6e" {...s} />
          <circle cx="24" cy="22" r="4" fill="#b8e9cc" />
        </>
      )}
      {id === "bench" && (
        <>
          <rect x="8" y="26" width="44" height="8" rx="2" fill="#c98a52" {...s} />
          <rect x="8" y="36" width="44" height="6" rx="2" fill="#c98a52" {...s} />
          <path d="M14 42v10M46 42v10" {...s} />
        </>
      )}
      {id === "flowers" && (
        <>
          <rect x="8" y="40" width="44" height="12" rx="3" fill="#a46a3c" {...s} />
          {[16, 30, 44].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 40V30`} {...s} />
              <circle cx={x} cy="26" r="6" fill={["#ff785f", "#ffcf4d", "#9b7bff"][i]} {...s} />
            </g>
          ))}
        </>
      )}
      {id === "lights" && (
        <>
          <path d="M30 54V18" {...s} strokeWidth={3} />
          <path d="M30 18h12" {...s} />
          <path d="M36 18l12 0-4 8h-4Z" fill="#ffcf4d" {...s} />
          <circle cx="42" cy="32" r="6" fill="#fff1c6" opacity="0.8" />
        </>
      )}
      {id === "fountain" && (
        <>
          <path d="M12 44h36l-4 10H16Z" fill="#9fd8f5" {...s} />
          <path d="M30 44V24" {...s} />
          <path d="M30 24c-8 0-12 8-12 14M30 24c8 0 12 8 12 14" fill="none" stroke="#3a8fc0" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx="30" cy="20" r="4" fill="#9fd8f5" {...s} />
        </>
      )}
      {id === "art" && (
        <>
          <rect x="8" y="14" width="44" height="34" rx="3" fill="#fffdf7" {...s} />
          <circle cx="22" cy="28" r="7" fill="#ff785f" />
          <path d="M30 42c6-12 10-14 18-16" stroke="#6741d9" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M14 42h10" stroke="#ffcf4d" strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {id === "bus" && (
        <>
          <path d="M14 54V12" {...s} strokeWidth={3} />
          <rect x="6" y="8" width="16" height="12" rx="3" fill="#6741d9" {...s} />
          <rect x="24" y="22" width="30" height="26" rx="4" fill="#9fd8f5" {...s} />
          <path d="M24 30h30" {...s} />
        </>
      )}
      {id === "bikes" && (
        <>
          <circle cx="16" cy="40" r="10" fill="none" {...s} />
          <circle cx="44" cy="40" r="10" fill="none" {...s} />
          <path d="M16 40l10-16h12l6 16M26 24l6 16h12M24 20h8" fill="none" stroke="#6741d9" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {id === "market" && (
        <>
          <path d="M6 22h48l-4-10H10Z" fill="#ff785f" {...s} />
          <path d="M6 22c4 6 8 6 12 0 4 6 8 6 12 0 4 6 8 6 12 0 4 6 8 6 12 0" fill="#fffdf7" {...s} />
          <rect x="10" y="30" width="40" height="22" fill="#ffcf4d" {...s} />
          <circle cx="20" cy="38" r="3" fill="#3e9b6e" />
          <circle cx="30" cy="38" r="3" fill="#ff785f" />
          <circle cx="40" cy="38" r="3" fill="#6741d9" />
        </>
      )}
      {id === "play" && (
        <>
          <path d="M10 54 22 18l12 36" fill="none" {...s} />
          <path d="M22 18h22v36" fill="none" {...s} />
          <path d="M44 30c-8 2-10 10-12 24" stroke="#ff785f" strokeWidth={5} fill="none" strokeLinecap="round" />
          <circle cx="22" cy="14" r="4" fill="#ffcf4d" {...s} />
        </>
      )}
      {id === "cafe" && (
        <>
          <path d="M8 20c8-12 36-12 44 0Z" fill="#9b7bff" {...s} />
          <path d="M30 20v14" {...s} />
          <ellipse cx="30" cy="36" rx="14" ry="4" fill="#fffdf7" {...s} />
          <path d="M30 40v12M20 52h20" {...s} />
          <path d="M40 30h5a3 3 0 0 1 0 6h-3" fill="none" {...s} />
        </>
      )}
      {id === "parking" && (
        <>
          <rect x="12" y="10" width="36" height="40" rx="6" fill="#3a8fc0" {...s} />
          <path d="M24 40V20h8a6 6 0 0 1 0 12h-8" fill="none" stroke="#fffdf7" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
