import { photoImage } from './assets';
import { el } from './dom';

// Diagrams drawn in code (no art file): so far the autopsy's injury chart for 1화.
// A figure has fixed spots; each use says which spots to label and how sure the label is.
// The drawing carries numbered rings only; the labels go in a list beside it, where they stay readable.

export type FigureTone = 'fact' | 'claim' | 'pending' | 'plain';

export interface FigureMark {
  /** A spot id from the figure (e.g. 'head', 'wrist', 'ribs'). */
  id: string;
  /** The label for the spot. */
  note: string;
  tone?: FigureTone;
}

interface FigureSpot {
  id: string;
  x: number;
  y: number;
}

export interface FigureDef {
  title: string;
  /** SVG viewBox. */
  view: string;
  /** A painted plate under the drawing (src/assets/photos/<image>.png), in its own pixel coordinates. */
  image?: string;
  svg: string;
  spots: FigureSpot[];
  /** Labels used when the figure appears in the court record. */
  base: FigureMark[];
  caption?: string;
}

// The body chart printed on an autopsy form, painted by Codex (src/assets/photos/injury-chart.png,
// 1024×1536). The victim's right is the viewer's left, as on the form. Spot coordinates are in the
// picture's pixels; re-measure them if the picture is redrawn.
const CHART = 'injury-chart';

export const FIGURES: Record<string, FigureDef> = {
  injury: {
    title: '부검 소견 · 손상 위치',
    view: '120 30 784 1490',
    image: CHART,
    svg: `
      <text class="fg-side" x="150" y="1500">← 오른쪽</text>
      <text class="fg-side" x="874" y="1500" style="text-anchor:end">왼쪽 →</text>`,
    spots: [
      { id: 'head', x: 536, y: 90 },
      { id: 'wrist', x: 272, y: 716 },
      { id: 'ribs', x: 620, y: 500 },
    ],
    base: [
      { id: 'head', note: '정수리 왼쪽 · 함몰 골절 (사인) · 투명 조각 3점', tone: 'fact' },
      { id: 'wrist', note: '오른손목 · 움켜쥔 흔적', tone: 'plain' },
      { id: 'ribs', note: '왼쪽 옆구리 · 갈비뼈 골절', tone: 'plain' },
    ],
    caption: '확인된 머리 손상은 한 곳. 손목·옆구리는 머리와 별도의 손상이다. (그림의 왼쪽이 피해자의 오른쪽)',
  },
  // 2화 구조 감정: W3 패널을 옆에서 자른 단면. 왼쪽이 골목(바깥), 오른쪽이 옥상(안쪽).
  // 밑판 안쪽 가장자리는 턱의 단차에 걸려 안쪽으로는 못 넘어가고, 바깥 모서리를 축으로만 돈다.
  rail: {
    title: '구조 감정 · W3 난간 단면',
    view: '0 0 1024 760',
    svg: `
      <rect x="0" y="0" width="1024" height="760" fill="#f3efe4"/>
      <g stroke="#c9c2b2" stroke-width="1">${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="760"/>`).join('')}</g>
      <text class="fg-side" x="40" y="60">← 골목 (바깥)</text>
      <text class="fg-side" x="990" y="60" style="text-anchor:end">옥상 (안쪽) →</text>
      <!-- parapet with the inner step -->
      <path d="M300 640 L300 560 L640 560 L640 590 L720 590 L720 640 Z" fill="#b9b2a4" stroke="#6b655b" stroke-width="4"/>
      <path d="M60 640 L980 640" stroke="#6b655b" stroke-width="6"/>
      <text class="fg-small" x="470" y="625" style="text-anchor:middle">파라펫 턱</text>
      <!-- bolts: no nuts, clean threads -->
      <g stroke="#555" stroke-width="10"><line x1="390" y1="560" x2="390" y2="500"/><line x1="560" y1="560" x2="560" y2="500"/></g>
      <g stroke="#999" stroke-width="2">${[506, 516, 526, 536].map((y) => `<line x1="383" y1="${y}" x2="397" y2="${y}"/><line x1="553" y1="${y}" x2="567" y2="${y}"/>`).join('')}</g>
      <!-- base plate (slightly lifted on the inside: the moment it starts to tip) -->
      <path d="M320 548 L650 540 L650 552 L320 560 Z" fill="#cdd0d4" stroke="#555" stroke-width="3"/>
      <!-- the panel: two posts and the top rail at +1.1 m -->
      <path d="M420 548 L404 170" stroke="#cdd0d4" stroke-width="22"/>
      <path d="M540 545 L524 168" stroke="#cdd0d4" stroke-width="22"/>
      <path d="M380 172 L560 166" stroke="#cdd0d4" stroke-width="26" stroke-linecap="round"/>
      <path d="M404 170 L420 548 M524 168 L540 545" stroke="#555" stroke-width="2" fill="none"/>
      <!-- the sign on the outside face -->
      <rect x="300" y="250" width="96" height="120" fill="#f8f6f0" stroke="#555" stroke-width="3" transform="rotate(-2 348 310)"/>
      <text class="fg-small" x="348" y="318" style="text-anchor:middle">표지판</text>
      <!-- clamp seat (paint pressed into a band) -->
      <rect x="534" y="300" width="18" height="44" fill="none" stroke="#b5462f" stroke-width="3" stroke-dasharray="6 4"/>
      <!-- strap hook mark on the top rail, and the strap's line to the laundry pole -->
      <path d="M560 166 L960 300" stroke="#e08a2c" stroke-width="5" stroke-dasharray="14 8"/>
      <rect x="950" y="260" width="20" height="380" fill="#6b655b"/>
      <text class="fg-small" x="960" y="250" style="text-anchor:middle">빨래대 기둥</text>
      <text class="fg-small" x="780" y="212" style="text-anchor:middle">래칫 끈(6/13~6/14)</text>
      <!-- pivot and the tipping arrow -->
      <circle cx="320" cy="556" r="9" fill="#b5462f"/>
      <path d="M380 120 C 250 120 160 210 130 330" fill="none" stroke="#b5462f" stroke-width="6" marker-end="url(#rl-arrow)"/>
      <defs><marker id="rl-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#b5462f"/></marker></defs>
      <text class="fg-small" x="70" y="760" style="text-anchor:start" dy="-20">수치: 난간 상단 +1.1m · 패널 폭 2.4m · 끈 고리 자국은 상단 가로대 안쪽</text>`,
    spots: [
      { id: 'bolt', x: 475, y: 520 },
      { id: 'clamp', x: 543, y: 322 },
      { id: 'hook', x: 560, y: 166 },
      { id: 'pivot', x: 320, y: 556 },
      { id: 'tip', x: 180, y: 220 },
    ],
    base: [
      { id: 'bolt', note: '앵커 볼트 넷 · 너트 없음 · 나사산 깨끗 (녹슬어 끊긴 게 아니라 풀렸다)', tone: 'fact' },
      { id: 'clamp', note: '연결 클램프 자리 · 페인트 눌림 띠만 남음', tone: 'fact' },
      { id: 'hook', note: '상단 가로대 안쪽 · 끈 고리 자국과 장력 눌림', tone: 'fact' },
      { id: 'pivot', note: '회전축 · 밑판 바깥 모서리', tone: 'plain' },
      { id: 'tip', note: '바깥으로 전도 (고정 해제 상태 + 기록된 자세의 하중)', tone: 'plain' },
    ],
    caption: '고정이 풀린 채 끈 하나로 안쪽에 붙잡혀 있었다. 끈을 풀면 볼트 위에 얹혀 제 무게로만 선다. 정상 고정이었다면 같은 자세로 넘어가지 않는다.',
  },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The figure as SVG markup, with a numbered ring on each marked spot (the figure's own marks if none given). */
export function figureSvg(id: string, marks?: FigureMark[]): string {
  const f = FIGURES[id];
  if (!f) return '';
  const rings = (marks ?? f.base).map((m, i) => {
    const s = f.spots.find((p) => p.id === m.id);
    if (!s) return '';
    return `<g class="fg-mark ${m.tone ?? 'plain'}"><circle cx="${s.x}" cy="${s.y}" r="46"/><text x="${s.x}" y="${s.y + 17}">${i + 1}</text></g>`;
  });
  const url = f.image ? photoImage(f.image) : undefined;
  const plate = url ? `<image href="${url}" x="0" y="0" width="1024" height="1536"/>` : '';
  // A drawn figure (no painted plate) keeps its labels in the list beside it.
  return `<svg viewBox="${f.view}" role="img" aria-label="${esc(f.title)}">${plate}${f.svg}${rings.join('')}</svg>`;
}

/** The drawing beside its numbered labels, into `box` (the court record and the on-screen panel both use it). */
export function paintFigure(box: HTMLElement, id: string, marks?: FigureMark[]): void {
  const f = FIGURES[id];
  if (!f) return;
  const row = el('div', 'fig-row', box);
  el('div', 'fig-draw', row).innerHTML = figureSvg(id, marks);
  const list = el('ol', 'fig-legend', row);
  for (const m of marks ?? f.base) el('li', m.tone ?? 'plain', list, m.note);
}
