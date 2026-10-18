import { sfx } from './audio';
import { el } from './dom';
import { push } from './input';

/** A rectangle in the photo's own coordinates. */
export interface PhotoRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PhotoFrame {
  /** Verified capture time shown on the evidence UI (not baked into the picture). */
  time: string;
  /** Server receipt time, shown only in the frame's details. */
  received: string;
  svg: string;
  /** What can be seen, for players who cannot see the picture. */
  alt: string;
  /** The region that the later expert match points at (the plate's lower-left corner). */
  mark?: PhotoRect;
}

export interface PhotoSet {
  title: string;
  width: number;
  height: number;
  frames: PhotoFrame[];
  /** Indices of the two frames shown side by side. */
  compare: [number, number];
  notes: string[];
}

// 112 현장 공유 (fiction, 2031): a phone propped on the owner's desk sends a still every 10 s.
// Both states are drawn from one composition, so the desk, the base and the plate's outline are
// the same in every frame; only the plate's place and its lower-left corner change.
const W = 640;
const H = 360;

function scene(body: string): string {
  return `
  <defs>
    <linearGradient id="ph-desk" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a2a1e"/><stop offset="1" stop-color="#22180f"/>
    </linearGradient>
    <linearGradient id="ph-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b4048"/><stop offset="1" stop-color="#2a2e35"/>
    </linearGradient>
    <linearGradient id="ph-acryl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9f4ff" stop-opacity="0.72"/>
      <stop offset="0.55" stop-color="#9fd3e8" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#e8fbff" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="ph-vig" cx="0.45" cy="0.42" r="0.75">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/>
    </radialGradient>
    <filter id="ph-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#1c1f25"/>
  <!-- floor beyond the desk edge -->
  <polygon points="0,236 ${W},196 ${W},${H} 0,${H}" fill="url(#ph-floor)"/>
  <g stroke="#4a515b" stroke-width="1.5" opacity="0.7">
    <line x1="0" y1="300" x2="${W}" y2="262"/><line x1="140" y1="${H}" x2="250" y2="224"/>
    <line x1="380" y1="${H}" x2="430" y2="214"/><line x1="610" y1="${H}" x2="600" y2="204"/>
  </g>
  <!-- desk top and its front edge -->
  <polygon points="0,40 ${W},0 ${W},176 0,214" fill="url(#ph-desk)"/>
  <polygon points="0,214 ${W},176 ${W},196 0,236" fill="#140e09"/>
  <g stroke="#4b3626" stroke-width="2" opacity="0.6">
    <line x1="0" y1="96" x2="${W}" y2="58"/><line x1="0" y1="160" x2="${W}" y2="122"/>
  </g>
  <!-- a ledger and a pen, fixed in every frame -->
  <polygon points="40,120 170,104 182,160 52,178" fill="#6b5a3c" stroke="#2a2012" stroke-width="2"/>
  <line x1="62" y1="132" x2="160" y2="120" stroke="#3d321f" stroke-width="2"/>
  <line x1="66" y1="146" x2="164" y2="134" stroke="#3d321f" stroke-width="2"/>
  <line x1="210" y1="168" x2="268" y2="150" stroke="#c9c2b0" stroke-width="5" stroke-linecap="round"/>
  <!-- the trophy's metal base, never moved -->
  <polygon points="372,150 492,138 500,168 380,182" fill="#5c6470" stroke="#1d2127" stroke-width="2"/>
  <polygon points="380,182 500,168 500,186 380,200" fill="#3a4049" stroke="#1d2127" stroke-width="2"/>
  <polygon points="404,154 466,148 468,154 406,160" fill="#14171c"/>
  ${body}
  <rect width="${W}" height="${H}" fill="url(#ph-vig)"/>
  <rect width="${W}" height="${H}" filter="url(#ph-grain)"/>`;
}

// The plate: 18 x 24 cm acrylic. Upright in the base its outline is x 388..484, y 18..152.
const PLATE_UPRIGHT = `
  <polygon points="388,22 484,14 486,148 390,156" fill="url(#ph-acryl)" stroke="#f2fdff" stroke-width="2.5"/>
  <polyline points="390,156 388,22 484,14" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.8"/>
  <text x="436" y="62" text-anchor="middle" font-size="11" fill="#20465a" opacity="0.85">상생 우수가맹점</text>
  <text x="436" y="80" text-anchor="middle" font-size="9" fill="#20465a" opacity="0.8">오롯리테일 2030</text>
  <line x1="404" y1="98" x2="468" y2="93" stroke="#20465a" stroke-width="1" opacity="0.5"/>
  <polygon points="398,30 410,29 404,140 396,141" fill="#ffffff" opacity="0.22"/>`;

// On the floor, tipped over. The same outline, turned and foreshortened, with the lower-left
// corner (bottom edge, left end) broken away.
const PLATE_FALLEN = `
  <g transform="translate(300 250) rotate(-14)">
    <polygon points="0,0 132,-10 138,52 28,61 20,54 15,59 9,49 4,45" fill="url(#ph-acryl)" stroke="#f2fdff" stroke-width="2.5"/>
    <polyline points="28,61 20,54 15,59 9,49 4,45" fill="none" stroke="#ffffff" stroke-width="2"/>
    <text x="70" y="22" text-anchor="middle" font-size="10" fill="#20465a" opacity="0.8" transform="scale(1 0.8)">상생 우수가맹점</text>
    <text x="70" y="40" text-anchor="middle" font-size="8" fill="#20465a" opacity="0.75" transform="scale(1 0.8)">오롯리테일 2030</text>
  </g>
  <!-- small chips near the desk foot -->
  <g fill="#e6faff" opacity="0.8">
    <polygon points="452,232 458,229 456,236"/><polygon points="476,246 483,244 480,250"/>
    <polygon points="430,270 434,266 437,272"/><polygon points="500,224 505,222 504,228"/>
  </g>`;

const INTACT = scene(PLATE_UPRIGHT);
const BROKEN = scene(PLATE_FALLEN);

const INTACT_ALT = '책상 위 금속 받침에 투명 상패 판이 서 있다. 판의 왼쪽 아래 모서리는 직각으로 이어져 있다. 사람은 화면 밖이다.';
const BROKEN_ALT = '받침은 비어 있다. 상패 판은 책상 아래 바닥에 넘어져 있고, 왼쪽 아래 모서리가 깨져 나가 있다. 바닥에 작은 조각 몇 개. 사람은 화면 밖이다.';

export const PHOTO_SETS: Record<string, PhotoSet> = {
  share112: {
    title: '112 현장 공유 사진 · 3월 15일 02:55:38~02:56:38',
    width: W,
    height: H,
    frames: [
      { time: '02:55:38', received: '02:55:39', svg: INTACT, alt: INTACT_ALT, mark: { x: 372, y: 132, w: 38, h: 36 } },
      { time: '02:55:48', received: '02:55:49', svg: INTACT, alt: INTACT_ALT, mark: { x: 372, y: 132, w: 38, h: 36 } },
      { time: '02:55:58', received: '02:55:59', svg: BROKEN, alt: BROKEN_ALT, mark: { x: 298, y: 286, w: 44, h: 42 } },
      { time: '02:56:08', received: '02:56:09', svg: BROKEN, alt: BROKEN_ALT, mark: { x: 298, y: 286, w: 44, h: 42 } },
      { time: '02:56:18', received: '02:56:19', svg: BROKEN, alt: BROKEN_ALT, mark: { x: 298, y: 286, w: 44, h: 42 } },
      { time: '02:56:28', received: '02:56:29', svg: BROKEN, alt: BROKEN_ALT, mark: { x: 298, y: 286, w: 44, h: 42 } },
      { time: '02:56:38', received: '02:56:39', svg: BROKEN, alt: BROKEN_ALT, mark: { x: 298, y: 286, w: 44, h: 42 } },
    ],
    compare: [1, 2],
    notes: [
      '머리·얼굴은 촬영 범위 밖',
      '사진으로 미세한 금은 판단하지 않음',
      '상패가 떨어져 있다는 것과, 누가 그것으로 때렸다는 것은 별개',
      '표시된 시각은 수신 시각이 아니라, 같은 시간 기준으로 검증된 촬영 시각',
    ],
  },
};

function frameSvg(set: PhotoSet, f: PhotoFrame, marked: boolean): string {
  const m = marked && f.mark
    ? `<rect x="${f.mark.x}" y="${f.mark.y}" width="${f.mark.w}" height="${f.mark.h}" rx="6" fill="none" stroke="#ffb347" stroke-width="4" stroke-dasharray="7 5"/>`
    : '';
  return `<svg viewBox="0 0 ${set.width} ${set.height}" role="img" aria-label="${f.time} ${f.alt}">${f.svg}${m}</svg>`;
}

/** Two frames side by side, for the court record's sheet. */
export function paintCompare(parent: HTMLElement, setId: string, marked: boolean): void {
  const set = PHOTO_SETS[setId];
  const row = el('div', 'photo-compare', parent);
  for (const k of set.compare) {
    const f = set.frames[k];
    const fig = el('figure', 'photo-fig', row);
    const pic = el('div', 'photo-pic', fig);
    pic.innerHTML = frameSvg(set, f, marked);
    const cap = el('figcaption', '', fig);
    el('strong', '', cap, f.time);
    el('span', '', cap, f.alt);
  }
}

/**
 * Full-screen viewer: the two compared frames large, the whole list of frames, and (after the
 * expert match) a toggle that rings the matched corner. Esc closes only this viewer.
 */
export class PhotoView {
  open(stage: HTMLElement, setId: string, markable: boolean): Promise<void> {
    const set = PHOTO_SETS[setId];
    const root = el('div', 'photoview', stage);
    const panel = el('div', 'photoview-panel', root);
    const head = el('header', 'photoview-head', panel);
    el('h2', 'photoview-title', head, set.title);
    const markBtn = el('button', 'btn btn-small', head, markable ? '대응 영역 표시' : '대응 영역 표시 (감정 결과 뒤)');
    markBtn.disabled = !markable;
    const big = el('div', 'photoview-big', panel);
    const strip = el('div', 'photoview-strip', panel);
    const notes = el('ul', 'photoview-notes', panel);
    for (const n of set.notes) el('li', '', notes, n);
    const foot = el('footer', 'photoview-foot', panel);
    el('span', 'photoview-hint', foot, '← → 사진 고르기 · Esc 닫기');
    const close = el('button', 'btn btn-primary', foot, '닫기  Esc');

    let marked = false;
    // Left slot is fixed to the first compared frame; the right slot follows the strip.
    let right = set.compare[1];
    const paint = () => {
      big.replaceChildren();
      for (const k of [set.compare[0], right]) {
        const f = set.frames[k];
        const fig = el('figure', 'photo-fig big', big);
        el('div', 'photo-pic', fig).innerHTML = frameSvg(set, f, marked);
        const cap = el('figcaption', '', fig);
        el('strong', '', cap, `촬영 ${f.time}`);
        el('span', 'photo-recv', cap, `서버 수신 ${f.received}`);
        el('span', '', cap, f.alt);
      }
      strip.replaceChildren();
      set.frames.forEach((f, i) => {
        const b = el('button', 'photo-thumb', strip, f.time);
        b.classList.toggle('on', i === right || i === set.compare[0]);
        b.addEventListener('click', () => {
          if (i !== set.compare[0]) right = i;
          sfx('select');
          paint();
        });
      });
      markBtn.classList.toggle('on', marked);
    };
    paint();
    sfx('paper');
    markBtn.addEventListener('click', () => {
      marked = !marked;
      sfx('select');
      paint();
    });

    return new Promise((resolve) => {
      const finish = () => {
        pop();
        root.remove();
        sfx('close');
        resolve();
      };
      const step = (d: number) => {
        let n = right + d;
        if (n === set.compare[0]) n += d;
        if (n < 0 || n >= set.frames.length) return;
        right = n;
        sfx('select');
        paint();
      };
      const pop = push((a) => {
        if (a === 'back' || a === 'advance') finish();
        else if (a === 'right') step(1);
        else if (a === 'left') step(-1);
      }, { strict: true });
      close.addEventListener('click', finish);
    });
  }
}
