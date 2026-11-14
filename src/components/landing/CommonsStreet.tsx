/**
 * Original illustration: a street on repair-café day. Drawn for a violet
 * background, in the CommonsArt palette, with flat fills and rounded geometry.
 */
const INK = "#302248";
const DEEP = "#5932C4";
const SHADE = "#4C2AA7";
const SUN = "#FFCF4D";
const CORAL = "#FF785F";
const MINT = "#B8E9CC";
const GREEN = "#28745B";
const PAPER = "#FFFDF7";
const LILAC = "#E8DFFF";

// Points along the bunting string, with one flag hanging from each.
const flags: [number, number, string][] = [
  [317, 85, SUN],
  [388, 97, CORAL],
  [459, 106, MINT],
  [530, 112, PAPER],
  [602, 116, SUN],
  [673, 116, CORAL],
  [745, 114, MINT],
  [816, 110, PAPER],
  [888, 102, SUN],
];

function Window({ x, y, lit = false }: { x: number; y: number; lit?: boolean }) {
  return (
    <rect x={x} y={y} width="22" height="26" rx="6" fill={lit ? SUN : LILAC} />
  );
}

export default function CommonsStreet() {
  return (
    <svg
      className="commons-street"
      viewBox="0 0 1200 260"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Sun and a few stars */}
      <circle cx="1118" cy="34" r="46" fill={SUN} />
      <path
        d="m206 26 4 12 12 4-12 4-4 12-4-12-12-4 12-4Zm690 6 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"
        fill={LILAC}
      />

      {/* Buildings */}
      <rect x="36" y="100" width="124" height="150" rx="12" fill={DEEP} />
      <rect x="150" y="62" width="100" height="188" rx="12" fill={SHADE} />
      <path d="M250 250V146l58-46 58 46v104Z" fill={DEEP} />
      <rect x="958" y="86" width="112" height="164" rx="12" fill={SHADE} />
      <rect x="1060" y="122" width="108" height="128" rx="12" fill={DEEP} />
      <Window x={58} y={124} />
      <Window x={96} y={124} lit />
      <Window x={58} y={168} lit />
      <Window x={96} y={168} />
      <Window x={170} y={86} lit />
      <Window x={208} y={86} />
      <Window x={170} y={130} />
      <Window x={208} y={130} lit />
      <Window x={170} y={174} lit />
      <Window x={208} y={174} />
      <circle cx="308" cy="150" r="12" fill={LILAC} />
      <path d="M296 250v-40a12 12 0 0 1 24 0v40Z" fill={CORAL} />
      <Window x={980} y={110} lit />
      <Window x={1026} y={110} />
      <Window x={980} y={154} />
      <Window x={1026} y={154} lit />
      <Window x={1084} y={146} />
      <Window x={1124} y={146} lit />
      <path d="M1100 250v-36a14 14 0 0 1 28 0v36Z" fill={SUN} />

      {/* Bunting */}
      <path
        d="M246 70Q600 150 960 92"
        stroke={PAPER}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {flags.map(([x, y, fill]) => (
        <path
          key={x}
          d={`M${x - 13} ${y}l13 26 13-26Z`}
          fill={fill}
          strokeLinejoin="round"
        />
      ))}

      {/* Tree */}
      <rect x="454" y="158" width="16" height="92" rx="6" fill="#764A3E" />
      <circle cx="462" cy="138" r="46" fill={GREEN} />
      <circle cx="424" cy="162" r="28" fill={GREEN} />
      <circle cx="502" cy="158" r="32" fill={GREEN} />
      <circle cx="478" cy="120" r="17" fill={MINT} />
      <circle cx="436" cy="150" r="9" fill={MINT} />

      {/* Planter */}
      <path
        d="M548 226v-22m0 8c-10 0-13-9-13-9 10-1 13 9 13 9Zm16 14v-26m0 10c10 0 13-10 13-10-10 0-13 10-13 10Z"
        stroke={MINT}
        strokeWidth="4"
        strokeLinecap="round"
        fill={MINT}
      />
      <circle cx="548" cy="200" r="8" fill={CORAL} />
      <circle cx="564" cy="196" r="8" fill={SUN} />
      <rect x="530" y="224" width="52" height="26" rx="7" fill={PAPER} />

      {/* Sign */}
      <path
        d="M676 132v58m92-58v58"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect
        x="652"
        y="96"
        width="140"
        height="40"
        rx="12"
        fill={SUN}
        stroke={INK}
        strokeWidth="3"
      />
      <text
        x="722"
        y="122"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="16"
        fontWeight="800"
        letterSpacing="1"
        fill={INK}
      >
        REPAIR CAFÉ
      </text>

      {/* The fixer, behind the table */}
      <path d="M574 250v-48a34 34 0 0 1 68 0v48Z" fill={SUN} />
      <rect x="595" y="132" width="26" height="36" rx="13" fill="#D99770" />
      <path
        d="M592 146c-3-18 6-26 18-25 12 1 16 13 12 24-5-1-9-6-11-11-5 8-11 11-19 12Z"
        fill={INK}
      />
      <path
        d="M632 198l30-14"
        stroke={SUN}
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* The table and what is on it */}
      <path
        d="M642 204l-7 46m165-46 7 46"
        stroke={PAPER}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <rect x="620" y="190" width="204" height="16" rx="8" fill={PAPER} />
      <rect x="652" y="160" width="50" height="30" rx="9" fill={CORAL} />
      <path
        d="M664 160v-5m12 5v-5m12 5v-5"
        stroke={PAPER}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="694" cy="176" r="3.5" fill={PAPER} />
      <path
        d="M716 184l30-10"
        stroke={INK}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M746 174l14-5"
        stroke={SUN}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="778" y="164" width="36" height="26" rx="7" fill={MINT} />
      <circle cx="789" cy="177" r="6" fill={GREEN} />
      <path
        d="M801 172h8m-8 9h8"
        stroke={GREEN}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* A neighbour arriving with something to fix */}
      <path d="M838 250v-52a34 34 0 0 1 68 0v52Z" fill={CORAL} />
      <rect x="859" y="126" width="26" height="36" rx="13" fill="#764A3E" />
      <path
        d="M857 140c-7-2-10-15-3-20-1-9 9-14 16-10 8-7 21 1 18 8 10 6 6 19-3 22v-11c-10 3-19 2-28-2Z"
        fill={INK}
      />
      <path
        d="M846 204l-18 22"
        stroke={CORAL}
        strokeWidth="15"
        strokeLinecap="round"
      />
      <rect x="806" y="218" width="30" height="24" rx="7" fill={LILAC} />
      <path
        d="M814 218v-6a7 7 0 0 1 14 0v6"
        stroke={LILAC}
        strokeWidth="4"
      />

      {/* A bike, parked for later */}
      <circle cx="930" cy="226" r="22" stroke={PAPER} strokeWidth="5" />
      <circle cx="996" cy="226" r="22" stroke={PAPER} strokeWidth="5" />
      <path
        d="M930 226l20-36h32l14 36m-46-36 22 36h-42m52-36-6-12h16m-48 12-4-10h-12"
        stroke={SUN}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* A neighbour waving from the left */}
      <path d="M368 250v-44a30 30 0 0 1 60 0v44Z" fill={MINT} />
      <rect x="386" y="146" width="24" height="32" rx="12" fill="#D99770" />
      <path
        d="M384 158c-2-15 5-21 14-20 11 1 14 10 11 20-4-1-8-5-9-9-4 6-9 8-16 9Z"
        fill={INK}
      />
      <path
        d="M420 204l18-26"
        stroke={MINT}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle cx="440" cy="174" r="7" fill="#D99770" />

      {/* Ground */}
      <path
        d="M0 246c150-12 300 10 450 0s300-12 450 0 200 8 300-4v18H0Z"
        fill={SHADE}
      />
    </svg>
  );
}
