/** Original geometric illustration: people making room for possibility. */
export default function CommonsArt({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`commons-art ${className}`}
      viewBox="0 0 480 240"
      fill="none"
      aria-hidden="true"
    >
      <path fill="#E8DFFF" d="M0 0h480v240H0z" />
      <circle cx="417" cy="44" r="57" fill="#FFCF4D" />
      <path d="M0 207c94-64 173-55 247-12s158 31 233-16v61H0Z" fill="#B8E9CC" />
      <path
        d="M45 216V109m0 57c-32 0-41-29-41-29 33-3 41 29 41 29Zm0-28c30-1 37-29 37-29-30-1-37 29-37 29Z"
        stroke="#28745B"
        strokeWidth="6"
        strokeLinecap="round"
        fill="#28745B"
      />
      <g className="art-flower">
        <path
          d="M45 67c-25-29-49 1-27 20-30 12-12 46 14 32 0 33 37 33 37 2 28 14 45-18 18-32 24-24-7-48-26-24-3-17-12-18-16 2Z"
          fill="#FF785F"
        />
        <circle cx="49" cy="92" r="12" fill="#FFCF4D" />
      </g>
      <path d="M102 240v-68a57 57 0 0 1 114 0v68" fill="#6741D9" />
      <path
        d="m119 181 43 28 70-47"
        stroke="#6741D9"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <rect x="140" y="92" width="44" height="57" rx="22" fill="#D99770" />
      <path
        d="M137 113c-5-29 10-42 29-40 20 2 26 21 19 39-8-2-14-10-17-18-8 12-18 17-31 19Z"
        fill="#302248"
      />
      <path
        d="M163 119c4 4 8 4 12 0"
        stroke="#302248"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="174" cy="111" r="2" fill="#302248" />
      <path d="M276 240v-74c0-30 22-48 49-48s49 18 49 48v74" fill="#FF785F" />
      <path
        d="m291 161-34 43-29-43"
        stroke="#FF785F"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <rect x="304" y="77" width="44" height="60" rx="22" fill="#764A3E" />
      <path
        d="M302 99c-11-3-16-24-4-32-2-14 15-22 25-16 13-11 33 2 29 13 16 9 10 30-4 34l-1-17c-15 5-29 3-42-3Z"
        fill="#302248"
      />
      <path
        d="M312 109c4 4 8 4 12 0"
        stroke="#FFF4DF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="313" cy="100" r="2" fill="#302248" />
      <g className="art-bubble">
        <path
          d="M182 23a17 17 0 0 1 17-17h64a17 17 0 0 1 17 17v34a17 17 0 0 1-17 17h-24l-23 19 4-19h-21a17 17 0 0 1-17-17Z"
          fill="#FFFDF7"
        />
        <path
          d="m216 40 10 10 22-23"
          stroke="#6741D9"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M412 218v-50m0 23c-26 0-34-23-34-23 26 0 34 23 34 23Zm0-11c26-1 33-23 33-23-26-1-33 23-33 23Z"
        stroke="#28745B"
        strokeWidth="5"
        fill="#28745B"
        strokeLinecap="round"
      />
      <path d="M391 214h42l-6 26h-30Z" fill="#6741D9" />
      <path
        d="m106 34 3 12 12 3-12 4-3 12-4-12-12-4 12-3Zm296 69 3 12 12 3-12 4-3 12-4-12-12-4 12-3Z"
        fill="#6741D9"
      />
    </svg>
  );
}
