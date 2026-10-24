import { photoImage } from './assets';
import { sfx } from './audio';
import { el, replay, setLabel } from './dom';
import { fromSpace, push } from './input';
import { touchLayout } from './viewport';

/** A rectangle in the photo's own pixel coordinates. */
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
  /** What lies on top of the shared background plate in this frame. */
  overlay: string;
  /** What can be seen, for players who cannot see the picture. */
  alt: string;
  /** The region that the later expert match points at (the plate's lower-left corner). */
  mark?: PhotoRect;
}

export interface PhotoSet {
  title: string;
  /** Background plate under every frame (src/assets/photos/<image>.png) and its pixel size. */
  image: string;
  size: [number, number];
  /** The part of the plate a frame shows (the phone's 16:9 still). */
  view: PhotoRect;
  frames: PhotoFrame[];
  /** Indices of the two frames shown side by side. */
  compare: [number, number];
  /** Close-ups of the compared frames, for the corner that matters. */
  zoom?: [PhotoRect, PhotoRect];
  /** An explanatory drawing laid over nothing: how the wound fragments fit the gap. */
  diagram?: string;
  notes: string[];
}

/** A step the player takes inside the photo viewer (1화: which part, then which two frames). */
export interface PhotoTask {
  region: {
    frame: number;
    /** A closer crop of that frame for pointing (defaults to the set's view). */
    view?: PhotoRect;
    prompt: string;
    spots: { id: string; label: string; rect: PhotoRect }[];
    answer: string;
    /** Feedback per wrong spot id; `default` for anything else. */
    wrong: Record<string, string>;
    done: string;
  };
  frames: {
    prompt: string;
    /** [last frame with the part, first frame without it]. */
    answer: [number, number];
    /** Feedback for two frames that both show the part, both lack it, or skip a frame between. */
    bothIntact: string;
    bothBroken: string;
    gap: string;
    done: string;
  };
  closing: string;
}

// 112 현장 공유 (fiction, 2031): a phone leaning on the wall at the back of the owner's desk sends
// a still every 10 s. Every frame is the same painted plate (desk, ledger, pen, the empty metal
// base, the floor beyond the desk edge) with the acrylic plaque drawn on top, so composition,
// light and scale cannot drift between frames; only the plaque's place and its corner change.

// The plaque in its own coordinates: 120 x 160 (18 x 24 cm), origin top-left.
const PLATE_WHOLE = 'M0,0 L120,0 L120,160 L0,160 Z';
// The broken plaque: the lower-left corner gone along a jagged line.
const PLATE_NOTCHED = 'M0,0 L120,0 L120,160 L30,160 L24,156 L13,152 L16,145 L5,139 L8,130 L0,124 Z';
// The three pieces that left the corner (the ones later recovered from the wound).
const SHARDS = [
  '0,124 8,130 5,139 0,141',
  '0,141 5,139 16,145 13,152 7,160 0,160',
  '7,160 13,152 24,156 30,160',
];

const DEFS = `
  <defs>
    <linearGradient id="ac-face" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e9fbff" stop-opacity="0.34"/>
      <stop offset="0.45" stop-color="#a9d9ea" stop-opacity="0.16"/>
      <stop offset="0.8" stop-color="#d7f5ff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.38"/>
    </linearGradient>
    <linearGradient id="ac-edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#bfe9f7" stop-opacity="0.55"/>
    </linearGradient>
    <filter id="ac-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="ac-blur1"><feGaussianBlur stdDeviation="0.6"/></filter>
  </defs>`;

/** The plaque's face, edges, thickness, etched text and a glint; `d` is whole or notched. */
function plaque(d: string, broken: boolean): string {
  return `
    <path d="${d}" transform="translate(5 -4)" fill="#dff6ff" fill-opacity="0.22" stroke="#f4fdff" stroke-opacity="0.55" stroke-width="1.4"/>
    <path d="${d}" fill="url(#ac-face)" stroke="url(#ac-edge)" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M3,6 L117,4" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.2"/>
    <polygon points="14,8 34,7 14,118 4,120" fill="#ffffff" opacity="0.13"/>
    <polygon points="84,6 92,6 64,150 58,150" fill="#ffffff" opacity="0.08"/>
    <g filter="url(#ac-blur1)" opacity="0.78">
      <circle cx="60" cy="40" r="11" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.6"/>
      <path d="M53,40 L58,45 L67,35" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.6"/>
      <text x="60" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="#f2fdff" fill-opacity="0.62" font-family="'Apple SD Gothic Neo','Noto Sans KR',sans-serif">상생 우수가맹점</text>
      <text x="60" y="94" text-anchor="middle" font-size="9.5" fill="#f2fdff" fill-opacity="0.5" font-family="'Apple SD Gothic Neo','Noto Sans KR',sans-serif">오롯리테일 2030</text>
      <line x1="30" y1="104" x2="90" y2="104" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>
    </g>
    ${broken ? '<path d="M30,160 L24,156 L13,152 L16,145 L5,139 L8,130 L0,124" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-opacity="0.95"/>' : ''}`;
}

// Standing in the base slot (x 1059-1180, y 547-570 on the plate image), 150 x 200 px on screen.
const UPRIGHT = `
  <ellipse cx="1120" cy="562" rx="86" ry="10" fill="#000" opacity="0.35" filter="url(#ac-soft)"/>
  <g transform="translate(1044 358) scale(1.25)">${plaque(PLATE_WHOLE, false)}</g>`;

// Knocked off the desk and lying on the floor just beyond its edge, seen from above at a slant:
// turned, then squashed along the view's vertical, so it reads as flat on the tiles.
const FALLEN_T = 'translate(560 330) scale(1.4 0.75) rotate(-16)';
const FALLEN = `
  <g transform="${FALLEN_T}">
    <path d="${PLATE_NOTCHED}" transform="translate(8 14)" fill="#000" opacity="0.45" filter="url(#ac-soft)"/>
    ${plaque(PLATE_NOTCHED, true)}
  </g>
  <g fill="#effcff" fill-opacity="0.85" stroke="#ffffff" stroke-opacity="0.6" stroke-width="0.8">
    <polygon points="664,462 673,458 669,468"/><polygon points="702,484 711,481 707,490"/>
    <polygon points="566,458 573,454 576,462"/><polygon points="812,446 819,443 818,451"/>
  </g>`;

const INTACT_ALT = '책상 위 금속 받침에 투명 아크릴 상패가 서 있다. 판의 왼쪽 아래 모서리는 직각으로 이어져 있다. 받침 뒤 바닥에는 아무것도 없다. 사람은 화면 밖이다.';
const BROKEN_ALT = '받침은 비어 있다. 상패 판은 책상 앞 바닥에 넘어져 있고, 왼쪽 아래 모서리가 들쭉날쭉하게 깨져 나가 있다. 근처 바닥에 작은 조각 몇 개. 사람은 화면 밖이다.';

const MARK_UPRIGHT: PhotoRect = { x: 1016, y: 510, w: 72, h: 64 };
const MARK_FALLEN: PhotoRect = { x: 598, y: 398, w: 78, h: 66 };

// How the three wound pieces close the gap: a drawing in the plaque's own coordinates, not a photo.
// The corner of the plate (from the bag) on the right; the three pieces from the wound pulled out
// to the lower left, each with a dashed line to the place it fits.
const SHARD_OUT: [number, number][] = [[-18, -5], [-24, 1], [-12, 5]];
const DIAGRAM = `
  <svg viewBox="-46 104 112 63" role="img" aria-label="감정 도식: 상처 속 조각 세 점이 판 왼쪽 아래 결손부를 메운다">
    <rect x="-46" y="104" width="112" height="63" fill="#f4f0e6"/>
    <path d="${PLATE_NOTCHED}" fill="#cfe7ef" stroke="#2b3a73" stroke-width="0.6"/>
    ${SHARDS.map((p) => `<polygon points="${p}" fill="none" stroke="#c8372d" stroke-width="0.45" stroke-dasharray="1.2 0.9"/>`).join('')}
    ${SHARDS.map((p, k) => {
      const [dx, dy] = SHARD_OUT[k];
      const pts = p.split(' ').map((xy) => xy.split(',').map(Number));
      const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
      const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
      return `<line x1="${cx + dx}" y1="${cy + dy}" x2="${cx}" y2="${cy}" stroke="#c8372d" stroke-width="0.35" stroke-dasharray="0.8 0.8"/>
        <polygon points="${p}" transform="translate(${dx} ${dy})" fill="#ffb347" stroke="#8a4a10" stroke-width="0.45"/>
        <text x="${cx + dx - 1.1}" y="${cy + dy + 1.1}" font-size="2.8" fill="#5a3008">${'①②③'[k]}</text>`;
    }).join('')}
    <g font-family="'Apple SD Gothic Neo','Noto Sans KR',sans-serif">
      <text x="-44" y="109" font-size="3.4" font-weight="700" fill="#1e2433">감정 도식 · 3월 17일 16:00 · 사진이 아님</text>
      <text x="-44" y="114" font-size="3" fill="#8a4a10">주황: 상처에서 회수한 조각 3점</text>
      <text x="-44" y="118.5" font-size="3" fill="#c8372d">붉은 점선: 맞물리는 자리</text>
      <text x="22" y="120" font-size="3" fill="#2b3a73">판 본체 (가방에서 확보)</text>
    </g>
  </svg>`;

const W = 1536;
const H = 1024;

export const PHOTO_SETS: Record<string, PhotoSet> = {
  share112: {
    title: '112 현장 공유 사진 · 3월 15일 02:55:38~02:56:38',
    image: 'share112-base',
    size: [W, H],
    view: { x: 300, y: 196, w: 1236, h: 695 },
    frames: [
      { time: '02:55:38', received: '02:55:39', overlay: UPRIGHT, alt: INTACT_ALT, mark: MARK_UPRIGHT },
      { time: '02:55:48', received: '02:55:49', overlay: UPRIGHT, alt: INTACT_ALT, mark: MARK_UPRIGHT },
      { time: '02:55:58', received: '02:55:59', overlay: FALLEN, alt: BROKEN_ALT, mark: MARK_FALLEN },
      { time: '02:56:08', received: '02:56:09', overlay: FALLEN, alt: BROKEN_ALT, mark: MARK_FALLEN },
      { time: '02:56:18', received: '02:56:19', overlay: FALLEN, alt: BROKEN_ALT, mark: MARK_FALLEN },
      { time: '02:56:28', received: '02:56:29', overlay: FALLEN, alt: BROKEN_ALT, mark: MARK_FALLEN },
      { time: '02:56:38', received: '02:56:39', overlay: FALLEN, alt: BROKEN_ALT, mark: MARK_FALLEN },
    ],
    compare: [1, 2],
    zoom: [{ x: 980, y: 466, w: 170, h: 120 }, { x: 560, y: 372, w: 170, h: 120 }],
    diagram: DIAGRAM,
    notes: [
      '머리·얼굴과 사람의 동작은 촬영 범위 밖',
      '사진으로 미세한 금은 판단하지 않음',
      '상패가 떨어져 있다는 것과, 누가 그것으로 때렸다는 것은 별개',
      '표시된 시각은 수신 시각이 아니라, 112 서버 시각으로 검증된 촬영 시각',
    ],
  },
};

/** The analysis mark, drawn to look the same thickness whatever the crop (labelled only when wide). */
function markSvg(r: PhotoRect, view: PhotoRect): string {
  const u = view.w / 250;
  const label = view.w > 600
    ? `<text x="${r.x}" y="${r.y - 4 * u}" font-size="${4.4 * u}" fill="#ffb347" font-family="'Apple SD Gothic Neo',sans-serif">감정 주석 · 조각 ①②③의 자리</text>`
    : '';
  return `<g class="ph-mark"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${1.6 * u}" fill="#ffb347" fill-opacity="0.12" stroke="#ffb347" stroke-width="${u}" stroke-dasharray="${2.4 * u} ${1.6 * u}"/>${label}</g>`;
}

/** One frame as SVG: the shared plate image, this frame's overlay, and (if asked) the analysis mark. */
export function frameSvg(set: PhotoSet, f: PhotoFrame, marked: boolean, view: PhotoRect = set.view): string {
  const url = photoImage(set.image) ?? '';
  const m = marked && f.mark ? markSvg(f.mark, view) : '';
  return `<svg viewBox="${view.x} ${view.y} ${view.w} ${view.h}" role="img" aria-label="촬영 ${f.time}. ${f.alt}">
    ${DEFS}<image href="${url}" x="0" y="0" width="${set.size[0]}" height="${set.size[1]}" preserveAspectRatio="none"/>
    ${f.overlay}${m}</svg>`;
}

/** Two frames side by side, for the court record's sheet. */
export function paintCompare(parent: HTMLElement, setId: string, marked: boolean): void {
  const set = PHOTO_SETS[setId];
  const row = el('div', 'photo-compare', parent);
  for (const k of set.compare) {
    const f = set.frames[k];
    const fig = el('figure', 'photo-fig', row);
    el('div', 'photo-pic', fig).innerHTML = frameSvg(set, f, marked);
    const cap = el('figcaption', '', fig);
    el('strong', '', cap, f.time);
    el('span', '', cap, f.alt);
  }
}

/** Close-ups of the compared frames and, after the expert match, the drawing of the fit. */
function paintAnalysis(parent: HTMLElement, set: PhotoSet, marked: boolean): void {
  if (!set.zoom) return;
  const box = el('div', 'photo-analysis', parent);
  set.compare.forEach((k, j) => {
    const f = set.frames[k];
    const fig = el('figure', 'photo-fig zoom', box);
    el('div', 'photo-pic', fig).innerHTML = frameSvg(set, f, marked, set.zoom![j]);
    el('figcaption', '', fig, `확대 · ${f.time} ${j === 0 ? '(분리 전)' : '(결손 후)'}`);
  });
  if (marked && set.diagram) {
    const fig = el('figure', 'photo-fig diagram', box);
    el('div', 'photo-pic', fig).innerHTML = set.diagram;
    el('figcaption', '', fig, '파편 대응 · 감정 도식');
  }
}

/**
 * Full-screen viewer: the two compared frames large, the whole list of frames, and (after the
 * expert match) a toggle for the analysis layer. Esc closes only this viewer.
 */
export class PhotoView {
  open(stage: HTMLElement, setId: string, markable: boolean): Promise<void> {
    const set = PHOTO_SETS[setId];
    const root = el('div', 'photoview', stage);
    const panel = el('div', 'photoview-panel', root);
    const head = el('header', 'photoview-head', panel);
    el('h2', 'photoview-title', head, set.title);
    const markBtn = el('button', 'btn btn-small', head, markable ? '감정 주석 보기' : '감정 주석 (감정 결과 뒤)');
    markBtn.disabled = !markable;
    const big = el('div', 'photoview-big', panel);
    const strip = el('div', 'photoview-strip', panel);
    const extra = el('div', 'photoview-extra', panel);
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
      paintStrip(strip, set, (i) => i === right || i === set.compare[0], (i) => {
        if (i !== set.compare[0]) right = i;
        sfx('select');
        paint();
      });
      extra.replaceChildren();
      if (marked) paintAnalysis(extra, set, true);
      markBtn.classList.toggle('on', marked);
      markBtn.textContent = marked ? '감정 주석 숨기기' : markable ? '감정 주석 보기' : '감정 주석 (감정 결과 뒤)';
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

  /**
   * The 1화 photo step, all in this one screen: point at the part of the plaque the wound pieces
   * belong to, then pick the last frame that still shows it and the first that does not. Wrong
   * picks only get a line of feedback; nothing is spent.
   */
  task(stage: HTMLElement, setId: string, t: PhotoTask, openRecord?: () => Promise<unknown>, onHint?: () => void): Promise<void> {
    const set = PHOTO_SETS[setId];
    const root = el('div', 'photoview task', stage);
    const panel = el('div', 'photoview-panel', root);
    const head = el('header', 'photoview-head', panel);
    el('h2', 'photoview-title', head, set.title);
    const stepTag = el('span', 'photoview-step', head);
    const prompt = el('p', 'photoview-prompt', panel);
    const big = el('div', 'photoview-big', panel);
    const strip = el('div', 'photoview-strip', panel);
    const extra = el('div', 'photoview-extra', panel);
    const say = el('p', 'photoview-say', panel);
    say.setAttribute('aria-live', 'polite');
    const foot = el('footer', 'photoview-foot', panel);
    const hint = el('span', 'photoview-hint', foot);
    const hintBtn = onHint ? el('button', 'btn', foot, '힌트  H') : null;
    hintBtn?.addEventListener('click', onHint!);
    const go = el('button', 'btn btn-primary', foot);

    let stage2 = false;
    let finished = false;
    let focus = -1;
    const picked: number[] = [];
    const tell = (text: string, good = false) => {
      say.textContent = text;
      say.classList.toggle('good', good);
      replay(say, 'on');
    };

    const paintRegion = () => {
      stepTag.textContent = '1 / 2 · 부분 지목';
      prompt.textContent = t.region.prompt;
      // Same rule as the other puzzles: a click only marks the spot; Enter (or the button) checks it.
      hint.textContent = focus < 0
        ? '클릭 또는 ← → 로 한 곳 고르기 · 고른 뒤 Enter'
        : `고른 곳 — ${t.region.spots[focus].label}${touchLayout() ? '' : '  → Enter로 확인'}`;
      hint.classList.toggle('picked', focus >= 0);
      setLabel(go, '여기다  Enter');
      go.disabled = focus < 0;
      big.replaceChildren();
      const f = set.frames[t.region.frame];
      const v = t.region.view ?? set.view;
      const fig = el('figure', 'photo-fig big solo', big);
      const pic = el('div', 'photo-pic spots', fig);
      pic.innerHTML = frameSvg(set, f, false, v);
      t.region.spots.forEach((s, i) => {
        const b = el('button', 'photo-spot', pic);
        b.setAttribute('aria-label', s.label);
        b.title = s.label;
        b.style.left = `${((s.rect.x - v.x) / v.w) * 100}%`;
        b.style.top = `${((s.rect.y - v.y) / v.h) * 100}%`;
        b.style.width = `${(s.rect.w / v.w) * 100}%`;
        b.style.height = `${(s.rect.h / v.h) * 100}%`;
        b.classList.toggle('on', i === focus);
        if (i === focus) el('span', 'photo-spot-check', b, '✓ 고름');
        b.addEventListener('click', () => {
          focus = i;
          sfx('select');
          paintRegion();
        });
      });
      el('figcaption', '', fig, `촬영 ${f.time} · 확대`);
    };

    const submitRegion = () => {
      if (focus < 0) {
        tell('먼저 사진에서 한 곳을 고르세요.');
        return;
      }
      const s = t.region.spots[focus];
      if (s.id !== t.region.answer) {
        sfx('close');
        tell(t.region.wrong[s.id] ?? t.region.wrong.default ?? '그 부분은 아니야.');
        paintRegion();
        return;
      }
      sfx('realize');
      tell(t.region.done, true);
      stage2 = true;
      focus = 0;
      paintFrames();
    };

    const paintFrames = () => {
      stepTag.textContent = '2 / 2 · 시간 구간';
      prompt.textContent = t.frames.prompt;
      hint.textContent = '클릭 또는 ← → 와 Space로 두 장을 고른 뒤 Enter';
      hint.classList.remove('picked');
      setLabel(go, '이 두 장  Enter');
      go.disabled = picked.length !== 2;
      big.replaceChildren();
      const slots = [...picked].sort((a, b) => a - b);
      ['그 부분이 남아 있는 마지막 사진', '그 부분이 사라진 첫 사진'].forEach((label, j) => {
        const fig = el('figure', 'photo-fig big', big);
        const k = slots[j];
        if (k === undefined) {
          el('div', 'photo-pic empty', fig, label);
          el('figcaption', '', fig, '—');
          return;
        }
        el('div', 'photo-pic', fig).innerHTML = frameSvg(set, set.frames[k], false);
        el('figcaption', '', fig, `${label} · 촬영 ${set.frames[k].time}`);
      });
      paintStrip(strip, set, (i) => picked.includes(i), (i) => {
        focus = i;
        toggle(i);
      }, focus);
    };

    const toggle = (i: number) => {
      const at = picked.indexOf(i);
      if (at >= 0) picked.splice(at, 1);
      else {
        if (picked.length === 2) picked.shift();
        picked.push(i);
      }
      sfx('select');
      paintFrames();
    };

    const submitFrames = () => {
      if (picked.length !== 2) {
        tell('사진을 두 장 고르세요.');
        return;
      }
      const [a, b] = [...picked].sort((x, y) => x - y);
      const [ra, rb] = t.frames.answer;
      if (a === ra && b === rb) {
        sfx('realize');
        tell(t.frames.done, true);
        finished = true;
        // The two stills were just looked at; the summary keeps only the close-ups and the drawing.
        big.replaceChildren();
        strip.replaceChildren();
        prompt.textContent = '';
        extra.replaceChildren();
        paintAnalysis(extra, set, true);
        el('p', 'photoview-closing', extra, t.closing);
        stepTag.textContent = '정리';
        hint.textContent = '';
        if (hintBtn) hintBtn.hidden = true;
        setLabel(go, '계속  Enter');
        go.disabled = false;
        return;
      }
      sfx('close');
      const intact = (k: number) => k <= ra;
      tell(intact(a) && intact(b) ? t.frames.bothIntact : !intact(a) && !intact(b) ? t.frames.bothBroken : t.frames.gap);
    };

    paintRegion();
    sfx('paper');

    return new Promise((resolve) => {
      const finish = () => {
        pop();
        root.remove();
        sfx('close');
        resolve();
      };
      const submit = () => {
        if (finished) finish();
        else if (stage2) submitFrames();
        else submitRegion();
      };
      go.addEventListener('click', submit);
      const pop = push((a) => {
        if (a === 'record' && openRecord) {
          void openRecord();
          return;
        }
        if (finished) {
          if (a === 'advance' || a === 'back') finish();
          return;
        }
        if (!stage2) {
          const n = t.region.spots.length;
          if (a === 'right' || a === 'down') focus = (focus + 1) % n;
          else if (a === 'left' || a === 'up') focus = (focus - 1 + n) % n;
          else if (a === 'advance' && (fromSpace() || focus < 0)) focus = Math.max(focus, 0);
          else if (a === 'advance') {
            submitRegion();
            return;
          } else return;
          sfx('select');
          paintRegion();
          return;
        }
        const n = set.frames.length;
        if (a === 'right') focus = Math.min(n - 1, focus + 1);
        else if (a === 'left') focus = Math.max(0, focus - 1);
        else if (a === 'advance' && fromSpace()) {
          toggle(focus);
          return;
        } else if (a === 'advance') {
          submitFrames();
          return;
        } else return;
        sfx('select');
        paintFrames();
      }, { strict: true });
    });
  }
}

/** The row of all frames as small pictures with their times. */
function paintStrip(
  strip: HTMLElement,
  set: PhotoSet,
  on: (i: number) => boolean,
  pick: (i: number) => void,
  focus = -1,
): void {
  strip.replaceChildren();
  set.frames.forEach((f, i) => {
    const b = el('button', 'photo-thumb', strip);
    el('span', 'photo-thumb-pic', b).innerHTML = frameSvg(set, f, false);
    el('span', 'photo-thumb-time', b, f.time);
    b.classList.toggle('on', on(i));
    b.classList.toggle('focus', i === focus);
    b.addEventListener('click', () => pick(i));
  });
}
