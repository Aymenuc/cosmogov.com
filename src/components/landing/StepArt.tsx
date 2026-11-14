/**
 * Original sticker illustrations for the landing page's mission path.
 * People are drawn as people; the four AI steps are drawn as tools, because
 * that is what they are. Palette and flat geometry follow CommonsArt.
 */
export type StepArtName =
  "goal" | "scout" | "bridge" | "maker" | "studio" | "decide";

const INK = "#302248";
const VIOLET = "#6741D9";
const CORAL = "#FF785F";
const SUN = "#FFCF4D";
const GREEN = "#28745B";
const PAPER = "#FFFDF7";

function Goal() {
  return (
    <>
      {/* Two neighbours with one shared idea. */}
      <path d="M8 96V78a18 18 0 0 1 36 0v18Z" fill={VIOLET} />
      <rect x="16" y="42" width="20" height="26" rx="10" fill="#D99770" />
      <path
        d="M14 52c-2-13 5-19 14-18 9 1 12 9 9 18-4-1-7-5-8-9-4 6-9 8-15 9Z"
        fill={INK}
      />
      <path d="M52 96V80a18 18 0 0 1 36 0v16Z" fill={CORAL} />
      <rect x="60" y="44" width="20" height="26" rx="10" fill="#764A3E" />
      <path
        d="M58 54c-5-2-7-11-2-15-1-6 7-10 12-7 6-5 15 1 13 6 7 4 5 14-2 16v-8c-7 2-14 1-21-2Z"
        fill={INK}
      />
      <g className="step-art-pop">
        <path
          d="M30 8a8 8 0 0 1 8-8h22a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-7l-9 8 2-8h-8a8 8 0 0 1-8-8Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path
          d="M49 6v6m0 6v6M41 10l5 3m6 4 5 3M41 20l5-3m6-4 5-3"
          stroke={VIOLET}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="49" cy="15" r="2.4" fill={CORAL} />
      </g>
    </>
  );
}

function Scout() {
  return (
    <>
      {/* A page of notes under a magnifying glass. */}
      <rect
        x="12"
        y="10"
        width="48"
        height="64"
        rx="9"
        fill={PAPER}
        stroke={INK}
        strokeWidth="2.5"
      />
      <path
        d="M22 26h28M22 37h22M22 48h28M22 59h14"
        stroke="#B8E9CC"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="m70 70 15 16"
        stroke={INK}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle
        cx="57"
        cy="55"
        r="20"
        fill={PAPER}
        stroke={GREEN}
        strokeWidth="7"
      />
      <path
        className="step-art-pop"
        d="m57 43 3.4 8.6L69 55l-8.6 3.4L57 67l-3.4-8.6L45 55l8.6-3.4Z"
        fill={SUN}
      />
    </>
  );
}

function Bridge() {
  return (
    <>
      {/* Two different voices, kept side by side. */}
      <path
        d="M6 22a12 12 0 0 1 12-12h32a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12H30L16 64l3-12h-1A12 12 0 0 1 6 40Z"
        fill={CORAL}
      />
      <path
        d="M20 26h28M20 37h18"
        stroke={PAPER}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g className="step-art-pop">
        <path
          d="M34 54a12 12 0 0 1 12-12h32a12 12 0 0 1 12 12v16a12 12 0 0 1-12 12h-1l3 12-14-12H46a12 12 0 0 1-12-12Z"
          fill={VIOLET}
          stroke={PAPER}
          strokeWidth="3"
        />
        <path
          d="M48 58h28M48 69h18"
          stroke={PAPER}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </>
  );
}

function Maker() {
  return (
    <>
      {/* A short list of tasks, and the hammer that gets them moving. */}
      <rect
        x="8"
        y="14"
        width="56"
        height="70"
        rx="9"
        fill={PAPER}
        stroke={INK}
        strokeWidth="2.5"
      />
      <rect x="17" y="25" width="12" height="12" rx="4" fill={VIOLET} />
      <path
        d="m20 31 2.6 2.6 4-4.6"
        stroke={PAPER}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="17"
        y="44"
        width="12"
        height="12"
        rx="4"
        fill={PAPER}
        stroke={VIOLET}
        strokeWidth="2.5"
      />
      <rect
        x="17"
        y="63"
        width="12"
        height="12"
        rx="4"
        fill={PAPER}
        stroke={VIOLET}
        strokeWidth="2.5"
      />
      <path
        d="M36 31h20M36 50h16M36 69h20"
        stroke="#E8DFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g className="step-art-pop" transform="rotate(38 68 56)">
        <rect x="63" y="38" width="10" height="50" rx="5" fill="#D99770" />
        <rect x="48" y="22" width="40" height="20" rx="6" fill={INK} />
        <rect x="48" y="22" width="9" height="20" rx="4.5" fill={CORAL} />
      </g>
    </>
  );
}

function Studio() {
  return (
    <>
      {/* A small form, made for one mission. */}
      <rect
        x="12"
        y="10"
        width="62"
        height="76"
        rx="10"
        fill={PAPER}
        stroke={INK}
        strokeWidth="2.5"
      />
      <path d="M22 24h26" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <rect
        x="22"
        y="33"
        width="42"
        height="13"
        rx="5"
        fill={PAPER}
        stroke="#D5C6EB"
        strokeWidth="2.5"
      />
      <circle cx="27" cy="59" r="5" fill={VIOLET} />
      <circle cx="27" cy="59" r="1.9" fill={PAPER} />
      <circle
        cx="27"
        cy="74"
        r="5"
        fill={PAPER}
        stroke={VIOLET}
        strokeWidth="2.5"
      />
      <path
        d="M38 59h22M38 74h16"
        stroke="#E8DFFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        className="step-art-pop"
        d="m76 4 4.6 11.4L92 20l-11.4 4.6L76 36l-4.6-11.4L60 20l11.4-4.6Z"
        fill={CORAL}
        stroke={PAPER}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </>
  );
}

function Decide() {
  return (
    <>
      {/* Two answers, the same size. The pointer belongs to a person. */}
      <circle
        cx="25"
        cy="38"
        r="19"
        fill={PAPER}
        stroke={INK}
        strokeWidth="4"
      />
      <path
        d="m16 38 6.5 6.5L34 31"
        stroke={INK}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="71"
        cy="38"
        r="19"
        fill={PAPER}
        stroke={INK}
        strokeWidth="4"
      />
      <path
        d="m63.5 30.5 15 15m0-15-15 15"
        stroke={INK}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        className="step-art-pop"
        d="M41 60 47 92l7-10 12 2Z"
        fill={VIOLET}
        stroke={PAPER}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </>
  );
}

/** A four-point sparkle centred on (cx, cy). */
const sparkle = (cx: number, cy: number, r: number) => {
  const k = r * 0.3;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
};

/** Small marks that spill past the edge of each tile, like ink on a sticker. */
const accents: Record<StepArtName, React.JSX.Element> = {
  goal: (
    <>
      <path d={sparkle(-4, 28, 7)} fill={CORAL} />
      <path d={sparkle(100, 30, 6)} fill={VIOLET} />
      <circle cx="92" cy="8" r="3" fill={SUN} />
    </>
  ),
  scout: (
    <path
      d="M80 30l7-8m-1 18 9-4m-23-12 2-10"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
    />
  ),
  bridge: (
    <>
      <circle cx="80" cy="18" r="4.5" fill={SUN} />
      <path d={sparkle(92, 32, 5.5)} fill={VIOLET} />
      <circle cx="8" cy="80" r="3.5" fill={CORAL} />
    </>
  ),
  maker: (
    <path
      d="M86 10l6-8m2 18 9-4M75 6V-3"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
    />
  ),
  studio: (
    <>
      <circle cx="2" cy="52" r="3.5" fill={VIOLET} />
      <path d={sparkle(4, 24, 6)} fill={INK} />
      <circle cx="90" cy="66" r="3" fill={CORAL} />
    </>
  ),
  decide: (
    <path
      d="M33 57l-8-4m11 13-6 8m0-12-9 1"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
    />
  ),
};

const art: Record<StepArtName, () => React.JSX.Element> = {
  goal: Goal,
  scout: Scout,
  bridge: Bridge,
  maker: Maker,
  studio: Studio,
  decide: Decide,
};

export default function StepArt({ name }: { name: StepArtName }) {
  const Art = art[name];
  return (
    <svg
      className="step-art"
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <Art />
      <g className="step-art-accent">{accents[name]}</g>
    </svg>
  );
}
