/**
 * Original sticker illustrations, one per workspace section, so each tool
 * has its own face. Same flat geometry, ink outline and palette as
 * CommonsArt and StepArt. People are drawn as people; AI is drawn as tools.
 * Decorative only: every illustration is aria-hidden.
 */
import type { ReactNode } from "react";

export type ToolArtName =
  | "budget"
  | "surveys"
  | "initiatives"
  | "assemblies"
  | "sortition"
  | "legislation"
  | "accountability"
  | "binding"
  | "meetings"
  | "pulse"
  | "analytics"
  | "agents"
  | "games"
  | "reputation"
  | "activity"
  | "explore";

const INK = "#302248";
const VIOLET = "#6741D9";
const CORAL = "#FF785F";
const SUN = "#FFCF4D";
const GREEN = "#28745B";
const MINT = "#B8E9CC";
const SKY = "#9FD8F5";
const LILAC = "#E8DFFF";
const PAPER = "#FFFDF7";

const line = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Sparkle({ x, y, s = 7, color }: { x: number; y: number; s?: number; color: string }) {
  return (
    <path
      d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`}
      fill={color}
    />
  );
}

function Backdrop() {
  return (
    <>
      <circle cx="100" cy="76" r="62" fill={PAPER} opacity="0.65" />
      <circle cx="170" cy="24" r="13" fill={SUN} />
      <path d="M0 132c40-13 80-13 120-4s60 7 80 0v22H0Z" fill={PAPER} opacity="0.6" />
      <Sparkle x={24} y={30} color={VIOLET} />
      <Sparkle x={184} y={84} s={5} color={CORAL} />
    </>
  );
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  const petals: [number, number][] = [[0, -8], [7.6, -2.5], [4.7, 6.5], [-4.7, 6.5], [-7.6, -2.5]];
  return (
    <g className="tool-art-pop">
      {petals.map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={x + dx} cy={y + dy} r="7" fill={color} stroke={INK} strokeWidth="2" />
      ))}
      <circle cx={x} cy={y} r="5" fill={SUN} stroke={INK} strokeWidth="2" />
    </g>
  );
}

const art: Record<ToolArtName, () => ReactNode> = {
  budget: () => (
    <>
      {/* A jar of coins with something growing out of it. */}
      <rect x="62" y="48" width="76" height="78" rx="18" fill={PAPER} stroke={INK} strokeWidth="3" />
      <rect x="74" y="60" width="52" height="12" rx="4" fill={MINT} />
      <circle cx="84" cy="110" r="11" fill={SUN} stroke={INK} strokeWidth="2.5" />
      <circle cx="107" cy="112" r="11" fill={SUN} stroke={INK} strokeWidth="2.5" />
      <circle cx="122" cy="98" r="10" fill={SUN} stroke={INK} strokeWidth="2.5" />
      <circle cx="96" cy="92" r="10" fill={SUN} stroke={INK} strokeWidth="2.5" />
      <rect x="70" y="36" width="60" height="16" rx="6" fill={GREEN} stroke={INK} strokeWidth="3" />
      <g className="tool-art-pop">
        <path d="M100 36V14" stroke={GREEN} strokeWidth="4" {...line} />
        <path d="M100 24c-16 0-22-9-20-17 11-1 19 6 20 17Z" fill={MINT} stroke={INK} strokeWidth="2.5" />
        <path d="M100 18c4-11 14-15 21-11-2 10-10 13-21 11Z" fill={MINT} stroke={INK} strokeWidth="2.5" />
      </g>
      <circle cx="152" cy="62" r="9" fill={SUN} stroke={INK} strokeWidth="2.5" />
      <path d="M152 40v8M161 44l-3 6" stroke={INK} strokeWidth="2.5" opacity=".45" {...line} />
    </>
  ),
  surveys: () => (
    <>
      {/* A question with tick boxes, and an answer on its way. */}
      <path
        d="M28 30a12 12 0 0 1 12-12h70a12 12 0 0 1 12 12v34a12 12 0 0 1-12 12H58l-14 12 3-12h-7a12 12 0 0 1-12-12Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth="3"
      />
      <rect x="40" y="30" width="12" height="12" rx="3" fill={MINT} stroke={INK} strokeWidth="2" />
      <path d="m43 36 3 3 6-7" stroke={GREEN} strokeWidth="2.5" fill="none" {...line} />
      <path d="M60 36h46" stroke={SKY} strokeWidth="5" {...line} />
      <rect x="40" y="50" width="12" height="12" rx="3" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M60 56h34" stroke={SKY} strokeWidth="5" {...line} />
      <g className="tool-art-pop">
        <path
          d="M92 84a12 12 0 0 1 12-12h56a12 12 0 0 1 12 12v24a12 12 0 0 1-12 12h-6l3 11-14-11h-39a12 12 0 0 1-12-12Z"
          fill={SKY}
          stroke={INK}
          strokeWidth="3"
        />
        <circle cx="118" cy="96" r="4.5" fill={VIOLET} />
        <circle cx="132" cy="96" r="4.5" fill={CORAL} />
        <circle cx="146" cy="96" r="4.5" fill={INK} />
      </g>
      <g transform="rotate(-35 50 116)">
        <rect x="22" y="110" width="52" height="12" rx="2" fill={SUN} stroke={INK} strokeWidth="2.5" />
        <path d="M74 110l14 6-14 6Z" fill="#F2C4A0" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="16" y="110" width="8" height="12" rx="2" fill={CORAL} stroke={INK} strokeWidth="2.5" />
      </g>
    </>
  ),
  initiatives: () => (
    <>
      {/* A petition filling up, and a megaphone to spread the word. */}
      <rect x="38" y="26" width="76" height="100" rx="10" fill={PAPER} stroke={INK} strokeWidth="3" />
      <rect x="60" y="18" width="32" height="16" rx="5" fill={VIOLET} stroke={INK} strokeWidth="3" />
      <path d="M50 48h52M50 60h40" stroke="#FFC7B5" strokeWidth="5" {...line} />
      <path d="M52 78c4-8 8 6 12-2s7 4 11-1 6 3 9 0" stroke={VIOLET} strokeWidth="2.5" fill="none" {...line} />
      <path d="M50 84h52M50 102h52M50 118h52" stroke={INK} strokeWidth="1.5" opacity=".35" />
      <path d="M52 96c5-6 7 5 12-1s6 3 10 0" stroke={CORAL} strokeWidth="2.5" fill="none" {...line} />
      <g className="tool-art-pop">
        <path d="M128 70l32-18v52l-32-18Z" fill={CORAL} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <rect x="116" y="68" width="14" height="20" rx="4" fill={SUN} stroke={INK} strokeWidth="3" />
        <path d="M122 88l3 14h7l-2-14Z" fill={INK} />
        <path d="M170 64c6 5 6 23 0 28M178 56c11 9 11 35 0 44" stroke={VIOLET} strokeWidth="3" fill="none" {...line} />
      </g>
    </>
  ),
  assemblies: () => (
    <>
      {/* Three neighbours, one conversation. */}
      <path d="M22 128v-18a20 20 0 0 1 40 0v18Z" fill={VIOLET} />
      <rect x="32" y="70" width="20" height="26" rx="10" fill="#D99770" />
      <path d="M30 80c-2-13 5-19 14-18 9 1 12 9 9 18-4-1-7-5-8-9-4 6-9 8-15 9Z" fill={INK} />
      <path d="M80 128v-22a20 20 0 0 1 40 0v22Z" fill={CORAL} />
      <rect x="90" y="62" width="20" height="26" rx="10" fill="#764A3E" />
      <path
        d="M88 72c-5-2-7-11-2-15-1-6 7-10 12-7 6-5 15 1 13 6 7 4 5 14-2 16v-8c-7 2-14 1-21-2Z"
        fill={INK}
      />
      <path d="M138 128v-18a20 20 0 0 1 40 0v18Z" fill={GREEN} />
      <rect x="148" y="70" width="20" height="26" rx="10" fill="#F2C4A0" />
      <path d="M146 82c-1-12 4-17 12-17s13 5 12 17c-3-6-8-9-12-9s-9 3-12 9Z" fill="#8A4B2A" />
      <circle cx="158" cy="63" r="5" fill="#8A4B2A" />
      <g className="tool-art-pop">
        <path
          d="M70 14a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v18a10 10 0 0 1-10 10h-14l-6 9-6-9H80a10 10 0 0 1-10-10Z"
          fill={PAPER}
          stroke={INK}
          strokeWidth="3"
        />
        <circle cx="88" cy="23" r="4" fill={VIOLET} />
        <circle cx="100" cy="23" r="4" fill={CORAL} />
        <circle cx="112" cy="23" r="4" fill={GREEN} />
      </g>
    </>
  ),
  sortition: () => (
    <>
      {/* Names in a hat, one drawn, and a die for luck. */}
      <path d="M60 66v44a28 8 0 0 0 56 0V66Z" fill={VIOLET} stroke={INK} strokeWidth="3" />
      <rect x="60" y="72" width="56" height="9" fill={CORAL} />
      <g className="tool-art-pop">
        <rect x="70" y="26" width="22" height="30" rx="3" fill={PAPER} stroke={INK} strokeWidth="2.5" transform="rotate(-14 81 41)" />
        <rect x="88" y="18" width="22" height="30" rx="3" fill={SUN} stroke={INK} strokeWidth="2.5" transform="rotate(10 99 33)" />
        <path d="M99.0 27.0L100.5 30.9L104.7 31.1L101.5 33.8L102.5 37.9L99.0 35.6L95.5 37.9L96.5 33.8L93.3 31.1L97.5 30.9Z" fill={CORAL} />
      </g>
      <ellipse cx="88" cy="66" rx="44" ry="10" fill={VIOLET} stroke={INK} strokeWidth="3" />
      <ellipse cx="88" cy="65" rx="28" ry="5.5" fill={INK} />
      <g transform="rotate(12 154 106)">
        <rect x="136" y="88" width="36" height="36" rx="8" fill={PAPER} stroke={INK} strokeWidth="3" />
        <circle cx="145" cy="97" r="3.5" fill={INK} />
        <circle cx="154" cy="106" r="3.5" fill={INK} />
        <circle cx="163" cy="115" r="3.5" fill={INK} />
      </g>
    </>
  ),
  legislation: () => (
    <>
      {/* A draft with one line up for change, and a sticky-note comment. */}
      <rect x="40" y="16" width="86" height="112" rx="8" fill={PAPER} stroke={INK} strokeWidth="3" />
      <path d="M54 34h44" stroke={INK} strokeWidth="5" {...line} />
      <path d="M54 52h58M54 64h52M54 98h58M54 110h40" stroke={SKY} strokeWidth="5" {...line} />
      <rect x="50" y="73" width="66" height="15" rx="4" fill="#FFE7A3" />
      <path d="M54 80.5h56" stroke={CORAL} strokeWidth="5" {...line} />
      <path d="M116 81c4 0 7-2 10-6" stroke={INK} strokeWidth="2" strokeDasharray="3 4" fill="none" />
      <g className="tool-art-pop">
        <g transform="rotate(7 150 76)">
          <rect x="124" y="52" width="52" height="48" rx="5" fill={SUN} stroke={INK} strokeWidth="3" />
          <path d="M134 66h32M134 78h24M134 90h28" stroke={INK} strokeWidth="3" opacity=".5" {...line} />
        </g>
      </g>
    </>
  ),
  accountability: () => (
    <>
      {/* Promises on a list, two done, one still to check. */}
      <rect x="34" y="18" width="88" height="110" rx="10" fill={PAPER} stroke={INK} strokeWidth="3" />
      <circle cx="52" cy="42" r="9" fill={MINT} stroke={INK} strokeWidth="2.5" />
      <path d="m47 42 4 4 7-8" stroke={GREEN} strokeWidth="3" fill="none" {...line} />
      <path d="M68 42h40" stroke={MINT} strokeWidth="5" {...line} />
      <circle cx="52" cy="68" r="9" fill={MINT} stroke={INK} strokeWidth="2.5" />
      <path d="m47 68 4 4 7-8" stroke={GREEN} strokeWidth="3" fill="none" {...line} />
      <path d="M68 68h34" stroke={MINT} strokeWidth="5" {...line} />
      <circle cx="52" cy="94" r="9" fill={PAPER} stroke={INK} strokeWidth="2.5" strokeDasharray="4 3" />
      <path d="M68 94h30" stroke="#E6E0EE" strokeWidth="5" {...line} />
      <g className="tool-art-pop">
        <path d="m150 114 18 18" stroke={INK} strokeWidth="11" {...line} />
        <circle cx="134" cy="96" r="24" fill="#DFF5E8" fillOpacity=".75" stroke={INK} strokeWidth="4" />
        <path d="M122 88a14 14 0 0 1 10-8" stroke={PAPER} strokeWidth="4" {...line} />
      </g>
    </>
  ),
  binding: () => (
    <>
      {/* A formal request with a seal, and a reviewed tick. */}
      <rect x="44" y="20" width="84" height="106" rx="8" fill={PAPER} stroke={INK} strokeWidth="3" />
      <path d="M58 38h56M58 52h48M58 66h52" stroke={LILAC} strokeWidth="5" {...line} />
      <path d="M58 88c5-7 8 5 13-1s7 4 11 0" stroke={VIOLET} strokeWidth="2.5" fill="none" {...line} />
      <path d="M56 96h40" stroke={INK} strokeWidth="1.5" opacity=".35" />
      <g className="tool-art-pop">
        <path d="M112 106l-8 24 10-5 6 9 4-24Z" fill={CORAL} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M128 106l9 23-11-3-5 9-5-23Z" fill={CORAL} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="120" cy="100" r="18" fill={CORAL} stroke={INK} strokeWidth="3" />
        <path d="M120.0 91.0L122.4 96.8L128.6 97.2L123.8 101.2L125.3 107.3L120.0 104.0L114.7 107.3L116.2 101.2L111.4 97.2L117.6 96.8Z" fill={SUN} />
      </g>
      <circle cx="160" cy="58" r="16" fill={MINT} stroke={INK} strokeWidth="3" />
      <path d="m152 58 6 6 10-12" stroke={GREEN} strokeWidth="3.5" fill="none" {...line} />
    </>
  ),
  meetings: () => (
    <>
      {/* A date circled on the calendar, and coffee for two. */}
      <rect x="30" y="28" width="88" height="94" rx="10" fill={PAPER} stroke={INK} strokeWidth="3" />
      <path d="M30 38a10 10 0 0 1 10-10h68a10 10 0 0 1 10 10v12H30Z" fill={CORAL} stroke={INK} strokeWidth="3" />
      <path d="M52 20v16M96 20v16" stroke={INK} strokeWidth="5" {...line} />
      {[66, 84, 102].map((y) =>
        [46, 62, 78, 94, 110].map((x) =>
          x === 78 && y === 84 ? null : <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={INK} opacity=".25" />,
        ),
      )}
      <g className="tool-art-pop">
        <circle cx="78" cy="84" r="10" fill="none" stroke={VIOLET} strokeWidth="3.5" />
        <circle cx="78" cy="84" r="3.5" fill={VIOLET} />
      </g>
      <path d="M128 92h26v22a8 8 0 0 1-8 8h-10a8 8 0 0 1-8-8Z" fill={SUN} stroke={INK} strokeWidth="3" />
      <path d="M154 98h4a6 6 0 0 1 0 12h-4" stroke={INK} strokeWidth="3" fill="none" />
      <path d="M168 98h22v20a7 7 0 0 1-7 7h-8a7 7 0 0 1-7-7Z" fill={SKY} stroke={INK} strokeWidth="3" />
      <path d="M190 103h2a5 5 0 0 1 0 10h-2" stroke={INK} strokeWidth="3" fill="none" />
      <path d="M136 84c-4-5 4-8 0-13M146 84c-4-5 4-8 0-13M178 90c-4-5 4-8 0-13" stroke={INK} strokeWidth="2.5" fill="none" opacity=".45" {...line} />
    </>
  ),
  pulse: () => (
    <>
      {/* The community's heartbeat. */}
      <path
        d="M100 118C60 94 46 72 56 54c9-16 32-15 44 2 12-17 35-18 44-2 10 18-4 40-44 64Z"
        fill={CORAL}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M78 60a14 14 0 0 1 12-6" stroke={PAPER} strokeWidth="4" opacity=".7" {...line} />
      <path
        className="tool-art-trace"
        d="M10 86h50l9-20 11 38 11-34 7 16h92"
        stroke={INK}
        strokeWidth="4"
        fill="none"
        {...line}
      />
    </>
  ),
  analytics: () => (
    <>
      {/* A chart that grows like a flower bed. */}
      <path d="M50 128V94M82 128V66M114 128V80M146 128V46" stroke={GREEN} strokeWidth="5" {...line} />
      <path d="M82 106c-12 0-16-7-15-12 8 0 14 4 15 12Z" fill={MINT} stroke={INK} strokeWidth="2" />
      <path d="M146 98c12 0 16-7 15-12-8 0-14 4-15 12Z" fill={MINT} stroke={INK} strokeWidth="2" />
      <path d="M114 112c-11 0-15-6-14-11 8 0 13 4 14 11Z" fill={MINT} stroke={INK} strokeWidth="2" />
      <Flower x={50} y={90} color={SKY} />
      <Flower x={82} y={62} color={CORAL} />
      <Flower x={114} y={76} color={VIOLET} />
      <Flower x={146} y={42} color="#FFC7B5" />
      <path d="M28 128h144" stroke={INK} strokeWidth="3" {...line} />
    </>
  ),
  agents: () => (
    <>
      {/* AI as what it is: a box of tools. */}
      <g transform="rotate(-12 70 60)">
        <rect x="64" y="34" width="12" height="52" rx="2" fill={SUN} stroke={INK} strokeWidth="2.5" />
        <path d="M64 34l6-14 6 14Z" fill="#F2C4A0" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <path d="M104 84V56" stroke={INK} strokeWidth="7" {...line} />
      <circle cx="104" cy="42" r="16" fill="#E1F3FF" stroke={INK} strokeWidth="4" />
      <g transform="rotate(14 138 56)">
        <path d="M138 30a16 16 0 0 0-9 29v9h18v-9a16 16 0 0 0-9-29Z" fill={SUN} stroke={INK} strokeWidth="2.5" />
        <rect x="130" y="68" width="16" height="10" rx="2" fill="#E6E0EE" stroke={INK} strokeWidth="2.5" />
      </g>
      <g className="tool-art-pop">
        <path d="M152 22l5-7M162 34l8-3M128 18l-2-8" stroke={CORAL} strokeWidth="3" {...line} />
      </g>
      <rect x="40" y="78" width="120" height="48" rx="10" fill={VIOLET} stroke={INK} strokeWidth="3" />
      <path d="M40 94h120" stroke={INK} strokeWidth="3" />
      <rect x="92" y="88" width="16" height="12" rx="3" fill={SUN} stroke={INK} strokeWidth="2.5" />
    </>
  ),
  games: () => (
    <>
      {/* A roll of the dice and a game piece. */}
      <g transform="rotate(-14 66 96)">
        <rect x="44" y="74" width="44" height="44" rx="10" fill={PAPER} stroke={INK} strokeWidth="3" />
        {[[54, 84], [78, 84], [66, 96], [54, 108], [78, 108]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill={INK} />
        ))}
      </g>
      <g className="tool-art-pop">
        <g transform="rotate(18 118 60)">
          <rect x="100" y="42" width="36" height="36" rx="8" fill={CORAL} stroke={INK} strokeWidth="3" />
          <circle cx="110" cy="52" r="3.5" fill={PAPER} />
          <circle cx="126" cy="68" r="3.5" fill={PAPER} />
        </g>
      </g>
      <path d="M142 126l4-34h12l4 34Z" fill={MINT} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="152" cy="80" r="11" fill={MINT} stroke={INK} strokeWidth="3" />
      <rect x="136" y="120" width="32" height="8" rx="3" fill={GREEN} stroke={INK} strokeWidth="3" />
    </>
  ),
  reputation: () => (
    <>
      {/* A medal for showing up. */}
      <path d="M78 14l20 50H78L60 14Z" fill={VIOLET} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M122 14l-20 50h20l18-50Z" fill={CORAL} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="100" cy="88" r="32" fill={SUN} stroke={INK} strokeWidth="3" />
      <circle cx="100" cy="88" r="23" fill="none" stroke={INK} strokeWidth="2" opacity=".35" />
      <g className="tool-art-pop">
        <path d="M100.0 74.0L103.5 83.1L113.3 83.7L105.7 89.9L108.2 99.3L100.0 94.0L91.8 99.3L94.3 89.9L86.7 83.7L96.5 83.1Z" fill={VIOLET} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>
    </>
  ),
  activity: () => (
    <>
      {/* Bunting up for the regulars. */}
      <path d="M8 30c50 26 134 26 184 0" stroke={INK} strokeWidth="2.5" fill="none" />
      {[[27, 38, VIOLET], [55, 45, SUN], [84, 49, CORAL], [116, 49, MINT], [145, 45, SKY], [173, 38, VIOLET]].map(
        ([x, y, color]) => (
          <path
            key={`${x}`}
            d={`M${Number(x) - 10} ${y}h20l-10 22Z`}
            fill={String(color)}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ),
      )}
      <path d="M84 102 68 76M116 102l16-26" stroke={VIOLET} strokeWidth="10" {...line} />
      <circle cx="67" cy="73" r="6" fill="#D99770" />
      <circle cx="133" cy="73" r="6" fill="#D99770" />
      <path d="M78 128v-20a22 22 0 0 1 44 0v20Z" fill={VIOLET} />
      <rect x="90" y="64" width="20" height="26" rx="10" fill="#D99770" />
      <path d="M88 74c-2-13 5-19 14-18 9 1 12 9 9 18-4-1-7-5-8-9-4 6-9 8-15 9Z" fill={INK} />
      <g className="tool-art-pop">
        <rect x="44" y="92" width="8" height="5" rx="1" fill={CORAL} transform="rotate(25 48 94)" />
        <rect x="150" y="96" width="8" height="5" rx="1" fill={SUN} transform="rotate(-30 154 98)" />
        <rect x="58" y="112" width="8" height="5" rx="1" fill={MINT} transform="rotate(-15 62 114)" />
        <rect x="140" y="114" width="8" height="5" rx="1" fill={SKY} transform="rotate(40 144 116)" />
      </g>
    </>
  ),
  explore: () => (
    <>
      {/* A small desk globe with two places pinned and a dotted route between them. */}
      <circle cx="100" cy="78" r="44" fill={SKY} stroke={INK} strokeWidth="3" />
      <path d="M68 62c8-7 19-5 23 2s-2 13-10 12-15 3-17-4 0-7 4-10Z" fill={MINT} stroke={INK} strokeWidth="2" {...line} />
      <path d="M108 50c10-3 22 2 26 11s-4 14-12 12-9 8-17 5-7-12-4-18 2-8 7-10Z" fill={MINT} stroke={INK} strokeWidth="2" {...line} />
      <path d="M84 100c6-4 14-3 17 3s-3 12-10 11-12-8-7-14Z" fill={MINT} stroke={INK} strokeWidth="2" {...line} />
      <ellipse cx="100" cy="78" rx="18" ry="44" stroke={INK} strokeWidth="1.5" opacity="0.3" />
      <path d="M56 78h88" stroke={INK} strokeWidth="1.5" opacity="0.3" />
      <path d="M80 50c8-16 30-20 44-12" stroke={VIOLET} strokeWidth="2.5" strokeDasharray="3 6" fill="none" {...line} />
      <g className="tool-art-pop">
        <path d="M78 62c-7-9-10-13-10-18a10 10 0 0 1 20 0c0 5-3 9-10 18Z" fill={CORAL} stroke={INK} strokeWidth="2.5" {...line} />
        <circle cx="78" cy="44" r="3.5" fill={PAPER} />
      </g>
      <g className="tool-art-pop">
        <path d="M128 54c-7-9-10-13-10-18a10 10 0 0 1 20 0c0 5-3 9-10 18Z" fill={VIOLET} stroke={INK} strokeWidth="2.5" {...line} />
        <circle cx="128" cy="36" r="3.5" fill={PAPER} />
      </g>
      <path d="M100 122v7M74 130h52" stroke={INK} strokeWidth="3" {...line} />
    </>
  ),
};

export default function ToolArt({ name, className = "" }: { name: ToolArtName; className?: string }) {
  return (
    <svg className={`tool-art ${className}`} viewBox="0 0 200 150" fill="none" aria-hidden="true" focusable="false">
      <Backdrop />
      {art[name]()}
    </svg>
  );
}
