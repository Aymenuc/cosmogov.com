import { GARDEN_BED } from "@/lib/stickers";

const petals = ["#FF785F", "#FFCF4D", "#6741D9", "#FF785F", "#E8DFFF", "#FFCF4D"];
const heights = [44, 58, 38, 64, 48, 54, 40, 60, 46, 56, 42, 62];

/**
 * The shared garden: one flower for each finished task, and an empty plot
 * for each one still to come. Original illustration in the CommonsArt palette.
 */
export default function GardenArt({ planted }: { planted: number }) {
  return (
    <svg
      className="garden-art"
      viewBox="0 -44 500 174"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="452" cy="-6" r="22" fill="#FFCF4D" />
      <path
        d="M60 6a14 14 0 0 1 27-5 11 11 0 0 1 19 8 9 9 0 0 1-2 18H62A11 11 0 0 1 60 6Zm196-34a11 11 0 0 1 21-4 9 9 0 0 1 15 6 7 7 0 0 1-2 14h-32a9 9 0 0 1-2-16Z"
        fill="#FFFDF7"
      />
      <path
        d="M0 108c80-14 170-10 250-2s170 6 250-8v32H0Z"
        fill="#B8E9CC"
      />
      {Array.from({ length: GARDEN_BED }, (_, i) => {
        const x = 30 + i * 38;
        const ground = 106 + (i % 3) * 2;
        if (i >= planted)
          return (
            <ellipse
              key={i}
              cx={x}
              cy={ground + 3}
              rx="9"
              ry="4"
              stroke="#28745B"
              strokeWidth="2"
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
          );
        const top = ground - heights[i];
        const petal = petals[i % petals.length];
        return (
          <g key={i} className="garden-flower">
            <path
              d={`M${x} ${ground}V${top + 8}`}
              stroke="#28745B"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d={`M${x} ${ground - 14}c-11 0-14-10-14-10 11-1 14 10 14 10Z`}
              fill="#28745B"
            />
            {i % 2 === 0 && (
              <path
                d={`M${x} ${ground - 24}c11 0 14-10 14-10-11-1-14 10-14 10Z`}
                fill="#28745B"
              />
            )}
            {[0, 72, 144, 216, 288].map((angle) => (
              <circle
                key={angle}
                cx={(x + 8 * Math.sin((angle * Math.PI) / 180)).toFixed(1)}
                cy={(top - 8 * Math.cos((angle * Math.PI) / 180)).toFixed(1)}
                r="6.5"
                fill={petal}
              />
            ))}
            <circle
              cx={x}
              cy={top}
              r="5"
              fill={petal === "#FFCF4D" ? "#FF785F" : "#FFCF4D"}
            />
          </g>
        );
      })}
    </svg>
  );
}
