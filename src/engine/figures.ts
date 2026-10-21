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
