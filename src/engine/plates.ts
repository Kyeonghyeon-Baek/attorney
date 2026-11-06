import { photoImage } from './assets';

// In-world photos whose details the logic depends on (2화): the appraisal's Namsan view (its sign
// must read the right way round), the 201/302 room photos (sticker text and window crack must
// mirror exactly) and the verification clip's frames. Each is a painted photo in
// src/assets/photos/<image>.png (1536×1024, cropped like a background); the code drawing below is
// only the fallback while that file is missing. The appraisal's "302" is never painted on its own:
// it is 201's photo flipped here, so its mirrored words and crack are exact by construction.
// Coordinates (hotspots, compare spots) are in stage pixels: stage = image × 0.8333 − 66.7 in y.

export interface Plate {
  title: string;
  /** Fallback drawing in stage pixels (1280×720). */
  svg: string;
  /** Painted photo (src/assets/photos/<image>.png), used when it exists. */
  image?: string;
  /** Show the photo mirrored left to right. */
  flip?: boolean;
  /** Drawn over the photo (a stamp). */
  over?: string;
}

const W = 1280;
const H = 720;

// ------------------------------------------------------------------ Namsan reference photo

// Taken in 2030 from a ladder truck's basket hanging outside the west railing, looking ENE.
// Bottom: the top of panel W3 with the building's sign facing the camera (outside), so its
// letters read normally. Beyond: the roof, the stair hut and water tank on the left, the
// laundry building and its sign frame ahead, and Namsan tower rising above the frame.
const NAMSAN = `
  <defs>
    <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a2452"/>
      <stop offset="0.45" stop-color="#7a4a78"/>
      <stop offset="0.8" stop-color="#e9845a"/>
      <stop offset="1" stop-color="#f7b072"/>
    </linearGradient>
    <linearGradient id="ns-brick" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6b4a3e"/><stop offset="1" stop-color="#3e2a26"/>
    </linearGradient>
    <radialGradient id="ns-vig" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <pattern id="ns-lattice" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M0 0 L36 36 M36 0 L0 36" stroke="#2b2626" stroke-width="3"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ns-sky)"/>
  <!-- Namsan: the hill's top just clears the sign frame, the tower stands above it -->
  <path d="M470 300 Q 600 150 690 150 Q 790 150 930 300 Z" fill="#4a3a5e"/>
  <rect x="684" y="70" width="12" height="84" fill="#3a2f4a"/>
  <ellipse cx="690" cy="96" rx="26" ry="9" fill="#3a2f4a"/>
  <rect x="687" y="30" width="6" height="42" fill="#3a2f4a"/>
  <circle cx="690" cy="28" r="3" fill="#ffcf8a"/>
  <!-- the laundry building ahead and its rooftop sign frame (seen from behind) -->
  <rect x="330" y="300" width="820" height="110" fill="url(#ns-brick)"/>
  <rect x="360" y="190" width="740" height="112" fill="url(#ns-lattice)" stroke="#2b2626" stroke-width="6"/>
  <rect x="360" y="190" width="740" height="10" fill="#2b2626"/>
  <rect x="400" y="300" width="10" height="20" fill="#2b2626"/><rect x="1050" y="300" width="10" height="20" fill="#2b2626"/>
  <!-- left: the stair hut with its water tank -->
  <rect x="60" y="190" width="250" height="230" fill="#8f8a83"/>
  <rect x="60" y="190" width="250" height="14" fill="#6d6964"/>
  <rect x="210" y="260" width="64" height="150" fill="#5a5651"/>
  <rect x="88" y="132" width="170" height="64" rx="10" fill="#3f8f8c"/>
  <ellipse cx="173" cy="132" rx="85" ry="12" fill="#57a9a5"/>
  <!-- the roof floor, a chili tray, the laundry pole -->
  <path d="M0 470 L0 404 L1280 404 L1280 470 Z" fill="#9b958c"/>
  <ellipse cx="980" cy="438" rx="70" ry="12" fill="#b23a2a" opacity="0.8"/>
  <rect x="1196" y="250" width="9" height="160" fill="#56524d"/>
  <!-- foreground: W3's top rail, brighter grey than the rest, and the sign hung on its outside -->
  <rect x="0" y="462" width="${W}" height="14" fill="#9a9da1"/>
  <rect x="320" y="460" width="640" height="18" fill="#c9ccd0"/>
  <rect x="340" y="476" width="10" height="90" fill="#c9ccd0"/><rect x="930" y="476" width="10" height="90" fill="#c9ccd0"/>
  <g class="pl-sign">
    <rect x="470" y="482" width="340" height="74" rx="4" fill="#f4f1ea" stroke="#3a3a3a" stroke-width="4"/>
    <text x="640" y="522" text-anchor="middle" font-size="34" font-weight="800" fill="#1f3a6b">행복하우스</text>
    <text x="640" y="548" text-anchor="middle" font-size="18" fill="#333">달빛로12길 7</text>
  </g>
  <rect x="0" y="566" width="${W}" height="154" fill="#2a2120"/>
  <rect width="${W}" height="${H}" fill="url(#ns-vig)"/>
  <text x="1250" y="40" text-anchor="end" font-size="16" fill="rgba(255,255,255,0.75)">집값닷AI 기준 사진 · 2030.03.22 14:41</text>`;

// ------------------------------------------------------------------ 201 / 302 room photos

// Units x01 and x02 mirror each other across the stairwell. The base drawing is 201: window on the
// right, extinguisher on the left wall, intercom left of centre, and a crack in the window frame.
// 302 really is 201 mirrored, but its own photo keeps every printed word the right way round and
// has no crack. The appraisal's "302" is 201's photo flipped: mirrored words, mirrored crack.
function roomGeometry(): string {
  return `
    <rect width="${W}" height="${H}" fill="#e8e1d4"/>
    <path d="M0 560 L${W} 560 L${W} ${H} L0 ${H} Z" fill="#b89a74"/>
    <path d="M0 560 L${W} 560" stroke="#8f7656" stroke-width="4"/>
    <rect x="0" y="0" width="${W}" height="70" fill="#d8d0c2"/>
    <!-- window -->
    <rect x="850" y="140" width="340" height="320" fill="#a9c6d8" stroke="#f6f4ef" stroke-width="18"/>
    <line x1="1020" y1="140" x2="1020" y2="460" stroke="#f6f4ef" stroke-width="12"/>
    <!-- kitchen counter -->
    <rect x="300" y="430" width="480" height="130" fill="#cfc6b6"/>
    <rect x="300" y="420" width="480" height="16" fill="#9b9183"/>
    <rect x="560" y="392" width="140" height="28" rx="6" fill="#7f7a72"/>
    <!-- extinguisher -->
    <rect x="160" y="340" width="74" height="200" rx="26" fill="#c8322a"/>
    <rect x="182" y="316" width="30" height="30" fill="#333"/>
    <!-- intercom -->
    <rect x="420" y="220" width="96" height="140" rx="8" fill="#ece9e2" stroke="#7c7a75" stroke-width="4"/>
    <rect x="436" y="238" width="64" height="52" fill="#2e3a44"/>`;
}

const ROOM_WORDS = (x: (n: number) => number, mirrored: boolean) => {
  const t = (cx: number, y: number, size: number, text: string) => mirrored
    ? `<text transform="translate(${x(cx)} ${y}) scale(-1 1)" text-anchor="middle" font-size="${size}" font-weight="700" fill="#222">${text}</text>`
    : `<text x="${x(cx)}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="700" fill="#222">${text}</text>`;
  return `
    <rect x="${Math.min(x(170), x(224))}" y="400" width="54" height="64" fill="#fff"/>
    ${t(197, 430, 17, '소화기')}
    ${t(197, 452, 12, '사용법')}
    ${t(468, 318, 15, '인터폰')}
    ${t(468, 342, 13, '호출 ▶')}`;
};

const CRACK = '<polyline points="868,452 884,430 878,414 896,392 890,376" fill="none" stroke="#3a3530" stroke-width="3"/>';

function room(kind: '201' | '302real' | '302fake'): string {
  const id = (n: number) => n;
  const mx = (n: number) => W - n;
  if (kind === '201') return roomGeometry() + ROOM_WORDS(id, false) + CRACK;
  if (kind === '302fake') {
    return `<g transform="translate(${W} 0) scale(-1 1)">${roomGeometry()}${ROOM_WORDS(id, false)}${CRACK}</g>`;
  }
  // The real 302: mirrored rooms, words printed normally, no crack.
  return `<g transform="translate(${W} 0) scale(-1 1)">${roomGeometry()}</g>${ROOM_WORDS(mx, false)}`;
}

// ------------------------------------------------------------------ the verification clip's frames

// The victim's phone, held overhead at W3, faced ENE: the roof, the stair hut on the left, the
// laundry building and its sign frame ahead. The railing is behind him and never in frame, so a
// frame can only show where 소윤 is. She stands about 2 m in front until 33 s, comes at him from
// 35 s, and her hand enters at the bottom edge at 37 s.
function clipFrame(sec: number): string {
  const sky = `<rect width="${W}" height="${H}" fill="#e98a5c"/><rect width="${W}" height="300" fill="#6a4a78"/>`;
  const town = `
    <rect x="300" y="250" width="820" height="230" fill="#5b3f37"/>
    <rect x="340" y="160" width="740" height="100" fill="#2b2626" opacity="0.85"/>
    <rect x="40" y="200" width="240" height="330" fill="#8f8a83"/><rect x="70" y="150" width="170" height="56" rx="8" fill="#3f8f8c"/>
    <path d="M0 520 L${W} 480 L${W} ${H} L0 ${H} Z" fill="#9b958c"/>`;
  const person = (x: number, y: number, sc: number, arm = false) => `
    <g transform="translate(${x} ${y}) scale(${sc})" fill="#1c1418">
      <circle cx="0" cy="-150" r="34"/>
      <path d="M-55 -110 Q0 -128 55 -110 L66 60 L-66 60 Z" fill="#9c2f2f"/>
      <rect x="-48" y="60" width="96" height="140" fill="#1c1418"/>
      ${arm ? '<path d="M50 -90 L150 -40 L160 -20 L45 -60 Z"/>' : '<path d="M-60 -100 L-78 30 L-60 30 Z M60 -100 L78 30 L60 30 Z"/>'}
    </g>`;
  const tilt = (deg: number, inner: string) => `<g transform="rotate(${deg} 640 360)">${inner}</g>`;
  let body = '';
  if (sec <= 33) body = sky + town + person(660, 470, 1.15);
  else if (sec === 35) body = tilt(-8, sky + town + person(700, 520, 1.9, true));
  else if (sec === 37) body = tilt(-18, sky + town) + '<path d="M420 720 L560 470 L640 470 L600 720 Z" fill="#c99a7c"/><path d="M380 720 L520 520 L560 500 L470 720 Z" fill="#9c2f2f"/>';
  else body = tilt(-40, '<rect x="-200" y="-200" width="1700" height="1200" fill="#e98a5c"/><rect x="-200" y="-200" width="1700" height="520" fill="#6a4a78"/>');
  const stamp = `<rect x="18" y="16" width="250" height="40" rx="6" fill="rgba(0,0,0,0.55)"/>
    <text x="34" y="44" font-size="22" fill="#fff">인증 클립 · 19:46:${String(sec).padStart(2, '0')}</text>`;
  const blur = sec >= 35 ? '<rect width="1280" height="720" fill="rgba(255,255,255,0.08)"/>' : '';
  return body + blur + stamp;
}

const ROOM_STAMP = (text: string) =>
  `<text x="24" y="700" font-size="18" fill="rgba(0,0,0,0.55)">${text}</text>`;

const CLIP_STAMP = (sec: number) => `<rect x="18" y="16" width="250" height="40" rx="6" fill="rgba(0,0,0,0.55)"/>
  <text x="34" y="44" font-size="22" fill="#fff">인증 클립 · 19:46:${sec}</text>`;
const NAMSAN_STAMP = '<text x="1250" y="40" text-anchor="end" font-size="16" fill="rgba(255,255,255,0.8)">집값닷AI 기준 사진 · 2030.03.22 14:41</text>';
const clip = (sec: number): Plate => ({ title: `인증 클립 ${sec}초`, svg: clipFrame(sec), image: `clip${sec}`, over: CLIP_STAMP(sec) });

export const PLATES: Record<string, Plate> = {
  namsan: { title: '감정 리포트 · 조망 기준 사진', svg: NAMSAN, image: 'namsan', over: NAMSAN_STAMP },
  room201: { title: '감정 리포트 · 201호 사진', svg: room('201') + ROOM_STAMP('감정 리포트 · 201호'), image: 'room201', over: ROOM_STAMP('감정 리포트 · 201호') },
  room302fake: {
    title: '감정 리포트 · 302호 사진', svg: room('302fake') + ROOM_STAMP('감정 리포트 · 302호'),
    image: 'room201', flip: true, over: ROOM_STAMP('감정 리포트 · 302호'),
  },
  room302real: {
    title: '소윤의 입주 사진 · 302호', svg: room('302real') + ROOM_STAMP('2030.05.02 입주 · 302호'),
    image: 'room302real', over: ROOM_STAMP('2030.05.02 입주 · 302호'),
  },
  // The photos as they are under an overlay: no corner stamp, so only the rooms are compared.
  room201bare: { title: '201호 사진', svg: room('201'), image: 'room201' },
  room302fakeBare: { title: '302호 사진(감정)', svg: room('302fake'), image: 'room201', flip: true },
  room302realBare: { title: '302호 입주 사진', svg: room('302real'), image: 'room302real' },
  clip31: clip(31),
  clip33: clip(33),
  clip35: clip(35),
  clip37: clip(37),
  clip38: clip(38),
};

/** The plate as a full-stage SVG, or '' if there is none with that id. */
export function plateSvg(id: string | null | undefined, cls = 'photoplate'): string {
  const p = id ? PLATES[id] : undefined;
  if (!p) return '';
  const url = p.image ? photoImage(p.image) : undefined;
  // A 1536×1024 photo covers the 1280×720 stage the way a background does (top and bottom cropped).
  const body = url
    ? `<g${p.flip ? ` transform="translate(${W} 0) scale(-1 1)"` : ''}><image href="${url}" x="0" y="-66.67" width="${W}" height="853.33"/></g>${p.over ?? ''}`
    : p.svg;
  return `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${p.title}">${body}</svg>`;
}
