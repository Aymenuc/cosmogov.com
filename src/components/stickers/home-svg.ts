import type { HomeId } from "@/lib/stickers";

/**
 * Your home on the community map, one original illustration per level, in the
 * site palette (ink edges, violet, coral, sunshine, mint, sky). Plain SVG
 * strings so the same art works in React and as a Leaflet pin. Static and
 * trusted: no user text is ever placed in these strings.
 */

const INK = "#29223d";
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const ground = `<ellipse cx="60" cy="104" rx="46" ry="9" fill="#B8E9CC" ${S}/>`;

const art: Record<HomeId, string> = {
  tent: `
    ${ground}
    <path d="M60 30 96 100H24Z" fill="#FF785F" ${S}/>
    <path d="M60 30 72 100H48Z" fill="#FFE7DF" ${S}/>
    <path d="M60 58 68 100H52Z" fill="${INK}"/>
    <path d="M60 30V12" ${S}/>
    <path d="M60 12h18l-5 6 5 6H60Z" fill="#FFCF4D" ${S}/>`,
  cabin: `
    ${ground}
    <rect x="80" y="30" width="10" height="22" fill="#B8422D" ${S}/>
    <path d="M18 60 60 28l42 32Z" fill="#6741D9" ${S}/>
    <rect x="28" y="58" width="64" height="42" fill="#FFB89E" ${S}/>
    <path d="M28 70h64M28 82h64" stroke="#B8422D" stroke-width="2"/>
    <rect x="52" y="74" width="16" height="26" rx="2" fill="${INK}"/>
    <circle cx="40" cy="70" r="6" fill="#FFCF4D" ${S}/>`,
  house: `
    ${ground}
    <path d="M22 58 60 26l38 32Z" fill="#6741D9" ${S}/>
    <rect x="30" y="56" width="60" height="44" fill="#EEE6FF" ${S}/>
    <rect x="53" y="72" width="14" height="28" rx="7" fill="#FF785F" ${S}/>
    <rect x="36" y="64" width="12" height="12" rx="2" fill="#FFCF4D" ${S}/>
    <rect x="72" y="64" width="12" height="12" rx="2" fill="#FFCF4D" ${S}/>
    <path d="M14 100V90M22 100V88M98 100V90M106 100V88" ${S}/>
    <circle cx="14" cy="86" r="5" fill="#FF785F" ${S}/>
    <circle cx="22" cy="84" r="5" fill="#FFCF4D" ${S}/>
    <circle cx="98" cy="86" r="5" fill="#FFCF4D" ${S}/>
    <circle cx="106" cy="84" r="5" fill="#FF785F" ${S}/>`,
  tower: `
    ${ground}
    <path d="M40 34 60 8l20 26Z" fill="#6741D9" ${S}/>
    <rect x="40" y="34" width="40" height="66" fill="#E1F3FF" ${S}/>
    <circle cx="60" cy="52" r="12" fill="#FFFDF7" ${S}/>
    <path d="M60 52V44M60 52l6 4" ${S}/>
    <rect x="52" y="78" width="16" height="22" rx="8" fill="#FF785F" ${S}/>
    <path d="M26 100V78h14M94 100V78H80" fill="#FFE7DF" ${S}/>
    <path d="M60 8V2" ${S}/>`,
  lighthouse: `
    ${ground}
    <path d="M14 22 40 30M106 22 80 30M10 40l30-2M110 40l-30-2" stroke="#FFCF4D" stroke-width="4" stroke-linecap="round"/>
    <path d="M46 22h28v14H46Z" fill="#FFCF4D" ${S}/>
    <path d="M42 22 60 8l18 14Z" fill="#6741D9" ${S}/>
    <path d="M48 36h24l8 64H40Z" fill="#FFFDF7" ${S}/>
    <path d="M47 50h26l2 14H45ZM44 76h32l2 14H42Z" fill="#FF785F" ${S}/>
    <rect x="55" y="88" width="10" height="12" rx="5" fill="${INK}"/>`,
};

export function homeSvg(id: HomeId, size = 72): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">${art[id]}</svg>`;
}
